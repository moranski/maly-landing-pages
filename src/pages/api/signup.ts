import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;

const MAX_BODY_BYTES = 8 * 1024;
const RESPONDER_API = "https://graph.responder.live/v2";
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type SignupBody = {
	name: string;
	phone: string;
	email: string;
	consent: boolean;
	website: string;
	turnstileToken: string;
};

const json = (body: Record<string, unknown>, status: number) =>
	new Response(JSON.stringify(body), {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "no-store",
			"X-Content-Type-Options": "nosniff",
		},
	});

async function readLimitedBody(request: Request): Promise<unknown | undefined> {
	const declaredLength = Number(request.headers.get("content-length"));
	if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) return undefined;
	if (!request.body) return undefined;

	const reader = request.body.getReader();
	const decoder = new TextDecoder();
	let size = 0;
	let text = "";
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			size += value.byteLength;
			if (size > MAX_BODY_BYTES) {
				await reader.cancel();
				return undefined;
			}
			text += decoder.decode(value, { stream: true });
		}
		text += decoder.decode();
		return JSON.parse(text) as unknown;
	} catch {
		return undefined;
	}
}

function validateBody(value: unknown): SignupBody | undefined {
	if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
	const body = value as Record<string, unknown>;
	const allowed = new Set(["name", "phone", "email", "consent", "website", "turnstileToken"]);
	if (Object.keys(body).some((key) => !allowed.has(key))) return undefined;
	if (typeof body.name !== "string" || typeof body.phone !== "string" || typeof body.email !== "string") return undefined;
	if (typeof body.consent !== "boolean" || typeof body.website !== "string" || typeof body.turnstileToken !== "string") return undefined;

	const name = body.name.trim().replace(/\s+/gu, " ");
	const rawPhone = body.phone.trim();
	const email = body.email.trim();
	if (rawPhone.length > 24 || !/^\+?[\d\s().-]+$/u.test(rawPhone)) return undefined;
	const compactPhone = rawPhone.replace(/[\s().-]/gu, "");
	const phone = compactPhone.startsWith("+972") ? `0${compactPhone.slice(4)}` : compactPhone;
	if (!name || name.length > 120 || /[\u0000-\u001f\u007f]/u.test(name)) return undefined;
	if (!/^0(?:5\d{8}|[23489]\d{7}|7\d{8})$/u.test(phone)) return undefined;
	if (!email || email.length > 254 || /[\u0000-\u0020\u007f]/u.test(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) return undefined;
	if (body.consent !== true || body.turnstileToken.length < 1 || body.turnstileToken.length > 2048) return undefined;
	if (body.website.length > 0) return undefined;

	return { name, phone, email, consent: true, website: "", turnstileToken: body.turnstileToken };
}

async function verifyTurnstile(token: string, request: Request, expectedHost: string): Promise<boolean> {
	if (!env.TURNSTILE_SECRET) return false;
	const params = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token });
	const ip = request.headers.get("CF-Connecting-IP");
	if (ip) params.set("remoteip", ip);

	const response = await fetch(TURNSTILE_VERIFY_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: params,
		signal: AbortSignal.timeout(10_000),
	});
	if (!response.ok) return false;
	const result = await response.json() as { success?: boolean; hostname?: string; action?: string };
	return result.success === true && result.hostname === expectedHost && result.action === "signup";
}

export const POST: APIRoute = async ({ request }) => {
	const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
	try {
		const rate = await env.SIGNUP_RATE_LIMITER.limit({ key: ip });
		if (!rate.success) return json({ ok: false, error: "rate_limited" }, 429);
	} catch (error) {
		console.error("Signup rate limiter unavailable", error instanceof Error ? error.name : "unknown");
		return json({ ok: false, error: "unavailable" }, 503);
	}

	if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
		return json({ ok: false, error: "invalid_input" }, 415);
	}

	let canonical: URL;
	try {
		canonical = new URL(env.SITE_URL);
	} catch {
		return json({ ok: false, error: "unavailable" }, 503);
	}
	const origin = request.headers.get("Origin");
	if (!origin || origin !== canonical.origin || new URL(request.url).origin !== canonical.origin) {
		return json({ ok: false, error: "invalid_input" }, 403);
	}

	const rawBody = await readLimitedBody(request);
	if (!rawBody) return json({ ok: false, error: "invalid_input" }, 400);
	const body = validateBody(rawBody);
	if (!body) return json({ ok: false, error: "invalid_input" }, 400);

	try {
		if (!await verifyTurnstile(body.turnstileToken, request, canonical.hostname)) {
			return json({ ok: false, error: "verification_failed" }, 400);
		}

		const clientId = Number(env.RESPONDER_CLIENT_ID);
		const listId = Number(env.RESPONDER_LIST_ID);
		if (!Number.isSafeInteger(clientId) || clientId < 1 || !Number.isSafeInteger(listId) || listId < 1 || !env.RESPONDER_CLIENT_SECRET || !env.RESPONDER_USER_TOKEN) {
			return json({ ok: false, error: "unavailable" }, 503);
		}

		const getAccessToken = async (): Promise<string | undefined> => {
			const response = await fetch(`${RESPONDER_API}/oauth/token`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					grant_type: "client_credentials",
					scope: "*",
					client_id: clientId,
					client_secret: env.RESPONDER_CLIENT_SECRET,
					user_token: env.RESPONDER_USER_TOKEN,
				}),
				signal: AbortSignal.timeout(10_000),
			});
			if (!response.ok) {
				console.error("Responder authentication failed", response.status);
				return undefined;
			}
			const auth = await response.json() as { status?: boolean; token?: string };
			return auth.status === true && typeof auth.token === "string" && auth.token ? auth.token : undefined;
		};

		const accessToken = await getAccessToken();
		if (!accessToken) {
			console.error("Responder authentication returned an invalid response");
			return json({ ok: false, error: "upstream_error" }, 502);
		}

		const createSubscriber = (token: string) => fetch(`${RESPONDER_API}/subscribers`, {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
			body: JSON.stringify({ email: body.email, name: body.name, phone: body.phone, list_ids: [listId], override: false }),
			signal: AbortSignal.timeout(10_000),
		});
		let createResponse = await createSubscriber(accessToken);
		if (createResponse.status === 401) {
			const refreshedToken = await getAccessToken();
			if (!refreshedToken) return json({ ok: false, error: "upstream_error" }, 502);
			createResponse = await createSubscriber(refreshedToken);
		}
		if (!createResponse.ok) {
			console.error("Responder subscriber creation failed", createResponse.status);
			return json({ ok: false, error: "upstream_error" }, 502);
		}
		const created = await createResponse.json() as { status?: boolean; duplicate?: boolean; createdId?: number; capacity?: boolean };
		if (created.duplicate === true) return json({ ok: false, error: "duplicate" }, 409);
		if (created.status === true) {
			return json({ ok: true }, 200);
		}

		console.error("Responder did not create a subscriber", { status: created.status, capacity: created.capacity });
		return json({ ok: false, error: "upstream_error" }, 502);
	} catch (error) {
		console.error("Signup provider request failed", error instanceof Error ? error.name : "unknown");
		return json({ ok: false, error: "upstream_error" }, 502);
	}
};

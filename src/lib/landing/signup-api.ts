// Co-authored-by: Codex <codex@openai.com>
import { normalizeSignupDetails, type SignupDetails } from "./signup-details.ts";

const MAX_BODY_BYTES = 8 * 1024;
const RESPONDER_API = "https://graph.responder.live/v2";
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

type SignupBody = SignupDetails & {
	funnel: string;
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
	const allowed = new Set(["funnel", "name", "phone", "email", "consent", "website", "turnstileToken"]);
	if (Object.keys(body).some((key) => !allowed.has(key))) return undefined;
	if (typeof body.funnel !== "string" || !/^[a-z][a-z0-9-]{0,24}$/.test(body.funnel)) return undefined;
	if (typeof body.name !== "string" || typeof body.phone !== "string" || typeof body.email !== "string") return undefined;
	if (body.consent !== true || body.website !== "" || typeof body.turnstileToken !== "string") return undefined;
	if (body.turnstileToken.length < 1 || body.turnstileToken.length > 2048) return undefined;
	const details = normalizeSignupDetails({ name: body.name, phone: body.phone, email: body.email });
	return details && { ...details, funnel: body.funnel, turnstileToken: body.turnstileToken };
}

async function verifyTurnstile(body: SignupBody, request: Request, expectedHost: string, secret: string, fetcher: typeof fetch): Promise<boolean> {
	const params = new URLSearchParams({ secret, response: body.turnstileToken });
	const ip = request.headers.get("CF-Connecting-IP");
	if (ip) params.set("remoteip", ip);

	const response = await fetcher(TURNSTILE_VERIFY_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: params,
		signal: AbortSignal.timeout(10_000),
	});
	if (!response.ok) return false;
	const result = await response.json() as { success?: boolean; hostname?: string; action?: string };
	return result.success === true && result.hostname === expectedHost && result.action === `signup_${body.funnel}`;
}

export async function handleSignup(request: Request, env: Cloudflare.Env, fetcher: typeof fetch = fetch): Promise<Response> {
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

	const requestUrl = new URL(request.url);
	let allowedOrigins: string[];
	try {
		allowedOrigins = [new URL(env.SITE_URL).origin];
		if (env.LEGACY_SITE_URL) allowedOrigins.push(new URL(env.LEGACY_SITE_URL).origin);
	} catch {
		return json({ ok: false, error: "unavailable" }, 503);
	}
	const origin = request.headers.get("Origin");
	if (origin !== requestUrl.origin || !allowedOrigins.includes(requestUrl.origin)) {
		return json({ ok: false, error: "invalid_input" }, 403);
	}

	const body = validateBody(await readLimitedBody(request));
	if (!body) return json({ ok: false, error: "invalid_input" }, 400);

	const lists = env.RESPONDER_LIST_IDS;
	if (!lists || !Object.hasOwn(lists, body.funnel)) return json({ ok: false, error: "invalid_input" }, 400);
	const listId = Number(lists[body.funnel]);
	const configuredIds = Object.values(lists).map(Number);
	if (!Number.isSafeInteger(listId) || listId < 1 || configuredIds.filter(id => id === listId).length !== 1) {
		console.error("Signup funnel must have a dedicated Responder list");
		return json({ ok: false, error: "unavailable" }, 503);
	}

	try {
		if (!env.TURNSTILE_SECRET || !await verifyTurnstile(body, request, requestUrl.hostname, env.TURNSTILE_SECRET, fetcher)) {
			return json({ ok: false, error: "verification_failed" }, 400);
		}
	} catch (error) {
		console.error("Signup verification failed", error instanceof Error ? error.name : "unknown");
		return json({ ok: false, error: "verification_failed" }, 400);
	}

	// Once verified, a Responder failure must not stop the purchase.
	const upstreamError = () => json({ ok: false, error: "upstream_error", checkoutAllowed: true }, 502);
	try {
		const clientId = Number(env.RESPONDER_CLIENT_ID);
		if (!Number.isSafeInteger(clientId) || clientId < 1 || !env.RESPONDER_CLIENT_SECRET || !env.RESPONDER_USER_TOKEN) {
			console.error("Signup provider configuration unavailable");
			return upstreamError();
		}

		const getAccessToken = async (): Promise<string | undefined> => {
			const response = await fetcher(`${RESPONDER_API}/oauth/token`, {
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
			return upstreamError();
		}

		const createSubscriber = (token: string) => fetcher(`${RESPONDER_API}/subscribers`, {
			method: "POST",
			headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
			body: JSON.stringify({ email: body.email, name: body.name, phone: body.phone, list_ids: [listId], override: false }),
			signal: AbortSignal.timeout(10_000),
		});
		let createResponse = await createSubscriber(accessToken);
		if (createResponse.status === 401) {
			const refreshedToken = await getAccessToken();
			if (!refreshedToken) return upstreamError();
			createResponse = await createSubscriber(refreshedToken);
		}
		if (!createResponse.ok) {
			console.error("Responder subscriber creation failed", createResponse.status);
			return upstreamError();
		}
		const created = await createResponse.json() as { status?: boolean; duplicate?: boolean; createdId?: number; capacity?: boolean };
		if (created.duplicate === true) return json({ ok: false, error: "duplicate", checkoutAllowed: true }, 409);
		if (created.status === true) {
			return json({ ok: true, checkoutAllowed: true }, 200);
		}

		console.error("Responder did not create a subscriber", { status: created.status, capacity: created.capacity });
		return upstreamError();
	} catch (error) {
		console.error("Signup provider request failed", error instanceof Error ? error.name : "unknown");
		return upstreamError();
	}
}

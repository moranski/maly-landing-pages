// Co-authored-by: Codex <codex@openai.com>
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { COOKIE_NAME } from "@emplugins/emprivacy";
import { landingPagePath } from "../../lib/landing/urls";

export const prerender = false;

function marketingAllowed(cookie: string | undefined): boolean {
	if (!cookie || cookie.length > 3072) return false;
	try {
		// EmPrivacy serializes { v, f, a, m } into its first-party consent cookie.
		const { v, f, a, m } = JSON.parse(cookie);
		const isFlag = (value: unknown) => value === 0 || value === 1 || typeof value === "boolean";
		return typeof v === "string" && v.length > 0 && isFlag(f) && isFlag(a) && (m === 1 || m === true);
	} catch {
		return false;
	}
}

export const POST: APIRoute = async ({ request, cookies }) => {
	const respond = (status: number) => new Response(null, { status, headers: { "Cache-Control": "no-store" } });
	const dataset = env.META_CAPI_DATASET_ID;
	const token = env.META_CAPI_ACCESS_TOKEN;
	if (!dataset || !/^\d+$/.test(dataset) || !token) return respond(503);

	const site = new URL(env.SITE_URL);
	const eventSource = new URL(landingPagePath("reading"), site);
	const referer = request.headers.get("Referer");
	if (request.headers.get("Origin") !== site.origin || !referer || !URL.canParse(referer)) return respond(403);
	const source = new URL(referer);
	if (source.origin !== eventSource.origin || source.pathname !== eventSource.pathname) return respond(403);
	if (request.headers.get("Sec-GPC") === "1" || !marketingAllowed(cookies.get(COOKIE_NAME)?.value)) return respond(403);

	const event = request.headers.get("X-Landing-Event");
	const ip = request.headers.get("CF-Connecting-IP");
	const userAgent = request.headers.get("User-Agent");
	if ((event !== "PageView" && event !== "CheckoutClick") || !ip || !userAgent) return respond(400);
	if (!(await env.META_CAPI_RATE_LIMITER.limit({ key: ip })).success) return respond(429);

	try {
		const response = await fetch(`https://graph.facebook.com/v25.0/${dataset}/events`, {
			method: "POST",
			headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
			body: JSON.stringify({
				data: [{
					event_name: event,
					event_id: crypto.randomUUID(),
					event_time: Math.floor(Date.now() / 1000),
					action_source: "website",
					event_source_url: eventSource.href,
					user_data: { client_ip_address: ip, client_user_agent: userAgent },
					custom_data: { course_slug: "reading", landing_page: eventSource.pathname },
				}],
				test_event_code: env.META_CAPI_TEST_EVENT_CODE || undefined,
			}),
			signal: AbortSignal.timeout(5000),
		});
		const result = response.ok ? await response.json() as { events_received?: number } : undefined;
		if (result?.events_received === 1) return respond(204);
		console.warn("Meta CAPI did not accept landing event", { event, status: response.status });
	} catch {
		console.warn("Meta CAPI request failed", { event });
	}
	return respond(502);
};

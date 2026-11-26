// Co-authored-by: Codex <codex@openai.com>
import type { SignupDetails } from "./signup-details";

const READING_CHECKOUT_ORIGIN = "https://secure.cardcom.solutions";
const READING_CHECKOUT_PATH = "/EA/EA5/bTTx0BGcMEqeDCr0cVizMg/PaymentSP";

export function readingCheckoutUrl(href: string, details?: SignupDetails): string | undefined {
	let checkout: URL;
	try {
		checkout = new URL(href);
	} catch {
		return undefined;
	}
	if (checkout.origin !== READING_CHECKOUT_ORIGIN || checkout.pathname !== READING_CHECKOUT_PATH || checkout.username || checkout.password) return undefined;

	for (const field of ["email", "name", "phone"] as const) {
		const key = `subscribers_${field}`;
		if (details) checkout.searchParams.set(key, details[field]);
		else checkout.searchParams.delete(key);
	}
	return checkout.href;
}

/** Canonical landing path, also used by legacy redirects. */
export function landingPagePath(slug: string): string {
	return `/landing/${encodeURIComponent(slug)}/`;
}

const ATTRIBUTION_PARAMETERS = new Set([
	"fbp", "fbc", "_fbp", "_fbc", "fbclid",
	"gclid", "dclid", "gbraid", "wbraid", "msclkid", "ttclid",
]);

/** Forward only URL attribution values, without forwarding preview tokens or other page data. */
export function withCheckoutAttribution(href: string, landingUrl: URL): string {
	if (href.startsWith("#")) return href;
	let checkout: URL;
	try {
		checkout = new URL(href, landingUrl);
	} catch {
		return href;
	}
	if (checkout.protocol !== "https:" && checkout.protocol !== "http:") return href;
	// Keep in-page navigation intact, including absolute links to this page.
	if (checkout.origin === landingUrl.origin && checkout.pathname === landingUrl.pathname) return href;

	const forwarded = new Set<string>();
	for (const [key, value] of landingUrl.searchParams) {
		if (!/^utm_[a-z0-9_]+$/.test(key) && !ATTRIBUTION_PARAMETERS.has(key)) continue;
		if (!value.trim()) continue;
		// First non-empty incoming value wins; preserve the checkout's other parameters.
		if (forwarded.has(key)) continue;
		checkout.searchParams.set(key, value);
		forwarded.add(key);
	}
	return forwarded.size ? checkout.href : href;
}

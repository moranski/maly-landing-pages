// Co-authored-by: Codex <codex@openai.com>
type MetaEvent = "PageView" | "CheckoutClick";
type ConsentWindow = Window & { emprivacy?: { has(category: "marketing"): boolean } };
const sentEvents = new Set<MetaEvent>();

export function reportReadingMetaEvent(event: MetaEvent): void {
	if (document.body.dataset.metaPilot !== "reading" || sentEvents.has(event)) return;
	if (!(window as ConsentWindow).emprivacy?.has("marketing")) return;

	sentEvents.add(event);
	void fetch("/api/reading-meta-event", {
		method: "POST",
		headers: { "X-Landing-Event": event },
		keepalive: true,
		referrerPolicy: "same-origin",
	}).catch(() => {});
}

export function installReadingMetaEvents(): void {
	const report = () => reportReadingMetaEvent("PageView");
	// EmPrivacy reloads after saving consent. Report from the reloaded page so
	// granting Marketing does not count the same visit twice.
	if (document.readyState !== "complete") document.addEventListener("DOMContentLoaded", report, { once: true });
	report();

	const checkout = document.querySelector<HTMLAnchorElement>("a[data-meta-checkout]");
	if (checkout?.protocol === "https:" && checkout.origin !== window.location.origin) {
		checkout.addEventListener("click", () => reportReadingMetaEvent("CheckoutClick"));
	}
}

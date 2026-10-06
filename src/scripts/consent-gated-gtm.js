const GTM_ID_PATTERN = /^GTM-[A-Z0-9]+$/;

export function isValidGtmId(value) {
	return typeof value === "string" && GTM_ID_PATTERN.test(value);
}

export function installConsentGatedGtm(win, doc, gtmId) {
	if (!isValidGtmId(gtmId)) return;

	let loaded = false;
	function loadIfConsented(state) {
		if (loaded || !state || (!state.analytics && !state.marketing)) return;

		loaded = true;
		win.dataLayer = win.dataLayer || [];
		win.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });

		const script = doc.createElement("script");
		script.async = true;
		script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
		doc.head.appendChild(script);
	}

	function sync() {
		if (win.emprivacy && typeof win.emprivacy.get === "function") {
			loadIfConsented(win.emprivacy.get());
		}
	}

	doc.addEventListener("emprivacy:change", (event) => loadIfConsented(event.detail));
	if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", sync, { once: true });
	else sync();
}

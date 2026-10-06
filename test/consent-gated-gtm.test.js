import assert from "node:assert/strict";
import test from "node:test";
import { installConsentGatedGtm, isValidGtmId } from "../src/scripts/consent-gated-gtm.js";

function createHarness({ readyState = "complete", consent = null } = {}) {
	const listeners = new Map();
	const scripts = [];
	const dataLayer = [];
	const win = {
		dataLayer,
		emprivacy: consent === null ? undefined : { get: () => consent },
	};
	const doc = {
		readyState,
		head: { appendChild: (script) => scripts.push(script) },
		createElement: (tagName) => ({ tagName }),
		addEventListener: (name, callback, options) => {
			listeners.set(name, { callback, options });
		},
	};
	return { win, doc, listeners, scripts, dataLayer };
}

test("accepts only well-formed GTM container IDs", () => {
	assert.equal(isValidGtmId("GTM-TK82BZVF"), true);
	assert.equal(isValidGtmId("G-ABC123"), false);
	assert.equal(isValidGtmId(undefined), false);
});

test("does not load GTM before optional consent, then loads once after analytics consent", () => {
	const harness = createHarness({ consent: { analytics: false, marketing: false } });
	installConsentGatedGtm(harness.win, harness.doc, "GTM-TK82BZVF");

	assert.equal(harness.scripts.length, 0);
	harness.listeners.get("emprivacy:change").callback({ detail: { analytics: true, marketing: false } });
	harness.listeners.get("emprivacy:change").callback({ detail: { analytics: true, marketing: true } });

	assert.equal(harness.scripts.length, 1);
	assert.equal(harness.scripts[0].async, true);
	assert.equal(harness.scripts[0].src, "https://www.googletagmanager.com/gtm.js?id=GTM-TK82BZVF");
	assert.equal(harness.dataLayer.length, 1);
	assert.equal(harness.dataLayer[0].event, "gtm.js");
});

test("loads GTM when marketing consent is granted without analytics consent", () => {
	const harness = createHarness();
	installConsentGatedGtm(harness.win, harness.doc, "GTM-TK82BZVF");
	harness.listeners.get("emprivacy:change").callback({ detail: { analytics: false, marketing: true } });

	assert.equal(harness.scripts.length, 1);
});

test("waits for DOMContentLoaded before reading an existing consent choice", () => {
	const harness = createHarness({ readyState: "loading", consent: { analytics: true, marketing: false } });
	installConsentGatedGtm(harness.win, harness.doc, "GTM-TK82BZVF");

	assert.equal(harness.scripts.length, 0);
	assert.equal(harness.listeners.get("DOMContentLoaded").options.once, true);
	harness.listeners.get("DOMContentLoaded").callback();
	assert.equal(harness.scripts.length, 1);
});

test("ignores invalid container IDs", () => {
	const harness = createHarness({ consent: { analytics: true, marketing: false } });
	installConsentGatedGtm(harness.win, harness.doc, "not-a-container");

	assert.equal(harness.scripts.length, 0);
	assert.equal(harness.listeners.size, 0);
});

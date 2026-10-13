import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { getSectionBackground } from "../src/scripts/section-background.js";

test("rejects unsupported background values before producing CSS classes", () => {
	for (const value of [undefined, null, {}, 3, "", "constructor", "__proto__", "blue", "כחול injected-class"]) {
		assert.equal(getSectionBackground(value), undefined);
	}
});

test("every CMS background choice has a supported palette color", async () => {
	const theme = await readFile(new URL("../src/styles/theme.css", import.meta.url), "utf8");
	const snapshot = JSON.parse(await readFile(new URL("../src/data/blocks-demo/landing_content_section.json", import.meta.url), "utf8"));
	const choices = snapshot.fields.find(field => field.slug === "background").validation.options;
	for (const label of choices) {
		const surface = getSectionBackground(label);
		assert.ok(surface, `Missing editor choice: ${label}`);
		assert.ok(theme.includes(`--surface-${surface}:`), `Missing palette color for ${label}`);
	}
});

import { readdir } from "node:fs/promises";

const testDirectory = new URL("../test/", import.meta.url);
const files = (await readdir(testDirectory)).filter((file) => file.endsWith(".test.js")).sort();

if (files.length === 0) throw new Error("No automated test files were found in test/.");

for (const file of files) {
	await import(new URL(file, testDirectory));
}

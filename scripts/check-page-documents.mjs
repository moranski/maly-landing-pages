import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const docsRoot = path.join(process.cwd(), "docs", "landing-pages");
const errors = [];

const entries = await readdir(docsRoot, { withFileTypes: true });
const pages = entries.filter((entry) => entry.isDirectory());

for (const page of pages) {
	const readmePath = path.join(docsRoot, page.name, "README.md");
	let readme;
	try {
		readme = await readFile(readmePath, "utf8");
	} catch {
		errors.push(`docs/landing-pages/${page.name}/: חסר README.md.`);
		continue;
	}

	const slug = readme.match(/^- \*\*slug:\*\* `([^`]+)`/m)?.[1];
	if (slug !== page.name) {
		errors.push(`${path.relative(process.cwd(), readmePath)}: ה־slug חייב להתאים לשם התיקייה.`);
	}
	if (!readme.includes("אוסף `landing_pages`")) {
		errors.push(`${path.relative(process.cwd(), readmePath)}: חסר מיפוי לרשומת EmDash באוסף landing_pages.`);
	}
	if (!readme.includes("אוסף `agent_context`")) {
		errors.push(`${path.relative(process.cwd(), readmePath)}: חסר מיפוי להקשר שבאוסף agent_context.`);
	}
}

if (errors.length > 0) {
	for (const error of errors) console.error(`שגיאה: ${error}`);
	process.exit(1);
}

console.log(`מפת הדפים המקומית תקינה (${pages.length} עמודים). בדיקה זו אינה מאמתת תוכן ב־EmDash.`);

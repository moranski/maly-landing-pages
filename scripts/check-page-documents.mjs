import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";

const contentRoot = path.join(process.cwd(), "src", "content", "landing-pages");
const docsRoot = path.join(process.cwd(), "docs", "landing-pages");
const requiredFiles = ["README.md", "product.md", "audience.md", "design.md"];

async function listPageFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	return entries
		.filter((entry) => entry.isFile() && /\.(md|mdx)$/.test(entry.name))
		.map((entry) => path.join(directory, entry.name));
}

function getFrontmatterValue(source, key) {
	const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
	return frontmatter.match(new RegExp(`^${key}:\\s*["']?([^"'\\n]+)["']?\\s*$`, "m"))?.[1];
}

const errors = [];
const pageFiles = await listPageFiles(contentRoot);
const pageSlugs = new Set();

for (const pageFile of pageFiles) {
	const source = await readFile(pageFile, "utf8");
	const slug = getFrontmatterValue(source, "slug");

	if (!slug) {
		errors.push(`${path.relative(process.cwd(), pageFile)}: חסר slug.`);
		continue;
	}

	pageSlugs.add(slug);

	const pageDocs = path.join(docsRoot, slug);
	for (const requiredFile of requiredFiles) {
		try {
			await access(path.join(pageDocs, requiredFile));
		} catch {
			errors.push(`docs/landing-pages/${slug}/: חסר ${requiredFile}.`);
		}
	}

	try {
		const index = await readFile(path.join(pageDocs, "README.md"), "utf8");
		if (!index.includes(`src/content/landing-pages/${path.basename(pageFile)}`)) {
			errors.push(`docs/landing-pages/${slug}/README.md: חסר קישור ל־MDX הפעיל.`);
		}
	} catch {
		// The missing README is already reported above.
	}
}

const documentationEntries = await readdir(docsRoot, { withFileTypes: true });
for (const entry of documentationEntries) {
	if (entry.isDirectory() && !pageSlugs.has(entry.name)) {
		errors.push(`docs/landing-pages/${entry.name}/: אין MDX עם slug תואם.`);
	}
}

if (errors.length > 0) {
	for (const error of errors) console.error(`שגיאה: ${error}`);
	process.exit(1);
}

console.log(`בדיקת מסמכי דפים עברה בהצלחה (${pageFiles.length} עמודים).`);

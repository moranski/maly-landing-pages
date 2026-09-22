import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const contentRoot = path.join(process.cwd(), "src", "content");
const maxParagraphLength = 420;

const prohibitedClaims = [
	"מובטח",
	"תוצאות מובטחות",
	"יקרא שוטף",
	"פותר לקויות",
	"מרפא",
	"מאבחן",
	"אין צורך באבחון",
	"תוצאות בתוך שבוע",
	"הפתרון המושלם",
	"מהפכה בלימודי",
];

const genericEnglishCtas = [
	"click here",
	"learn more",
	"buy now",
	"start now",
	"sign up",
	"get started",
];

const errors = [];
const warnings = [];

async function listContentFiles(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = await Promise.all(
		entries.map((entry) => {
			const entryPath = path.join(dir, entry.name);

			if (entry.isDirectory()) {
				return listContentFiles(entryPath);
			}

			if (entry.isFile() && /\.(md|mdx)$/.test(entry.name)) {
				return [entryPath];
			}

			return [];
		}),
	);

	return files.flat();
}

function relative(filePath) {
	return path.relative(process.cwd(), filePath);
}

function addError(filePath, message) {
	errors.push(`${relative(filePath)}: ${message}`);
}

function addWarning(filePath, message) {
	warnings.push(`${relative(filePath)}: ${message}`);
}

function parseFrontmatter(source) {
	const match = source.match(/^---\n([\s\S]*?)\n---/);
	return match?.[1] ?? "";
}

function stripFrontmatter(source) {
	return source.replace(/^---\n[\s\S]*?\n---/, "");
}

function hasFrontmatterValue(frontmatter, key, value) {
	const quoted = new RegExp(`^${key}:\\s*["']${value}["']\\s*$`, "m");
	const plain = new RegExp(`^${key}:\\s*${value}\\s*$`, "m");
	return quoted.test(frontmatter) || plain.test(frontmatter);
}

function checkRequiredMetadata(filePath, frontmatter) {
	if (!/^family:\s*["'][a-z0-9-]+["']\s*$/m.test(frontmatter)) {
		addError(filePath, 'חסר מזהה משפחה תקין מסוג `family: "family-id"`.');
	}

	if (!hasFrontmatterValue(frontmatter, "lang", "he")) {
		addError(filePath, 'חסר frontmatter מסוג `lang: "he"`.');
	}

	if (!hasFrontmatterValue(frontmatter, "dir", "rtl")) {
		addError(filePath, 'חסר frontmatter מסוג `dir: "rtl"`.');
	}
}

function checkProhibitedClaims(filePath, source) {
	for (const claim of prohibitedClaims) {
		if (source.includes(claim)) {
			addError(filePath, `נמצא ביטוי שאינו עומד בסגנון הכתיבה: "${claim}".`);
		}
	}
}

function extractLabels(source) {
	const labels = [];
	const patterns = [
		/label:\s*["']([^"']+)["']/g,
		/label=\s*["']([^"']+)["']/g,
		/cta=\{\{[\s\S]*?label:\s*["']([^"']+)["'][\s\S]*?\}\}/g,
	];

	for (const pattern of patterns) {
		for (const match of source.matchAll(pattern)) {
			labels.push(match[1]);
		}
	}

	return labels;
}

function checkCtas(filePath, source) {
	for (const label of extractLabels(source)) {
		const normalized = label.toLowerCase();
		const latinLetters = label.match(/[a-z]/gi)?.length ?? 0;
		const hebrewLetters = label.match(/[\u0590-\u05ff]/g)?.length ?? 0;

		if (genericEnglishCtas.some((cta) => normalized.includes(cta))) {
			addError(filePath, `CTA באנגלית אינו מתאים לסגנון האתר: "${label}".`);
		}

		if (latinLetters > 0 && hebrewLetters === 0) {
			addError(filePath, `CTA צריך להיות בעברית: "${label}".`);
		}
	}
}

function getParagraphs(source) {
	return stripFrontmatter(source)
		.split(/\n{2,}/)
		.map((paragraph) => paragraph.trim())
		.filter(Boolean)
		.filter((paragraph) => !paragraph.startsWith("import "))
		.filter((paragraph) => !paragraph.startsWith("<"))
		.filter((paragraph) => !paragraph.startsWith("{"))
		.filter((paragraph) => !paragraph.startsWith("### "))
		.filter((paragraph) => !paragraph.startsWith("## "))
		.filter((paragraph) => !paragraph.startsWith(">"))
		.filter((paragraph) => !paragraph.includes("={["));
}

function checkParagraphLength(filePath, source) {
	for (const paragraph of getParagraphs(source)) {
		const compact = paragraph.replace(/\s+/g, " ");
		if (compact.length > maxParagraphLength) {
			addError(
				filePath,
				`פסקה ארוכה מדי (${compact.length} תווים). מומלץ לפצל לפסקאות קצרות יותר.`,
			);
		}
	}
}

function checkStyleSignals(filePath, source) {
	const body = stripFrontmatter(source);
	const hebrewLetters = body.match(/[\u0590-\u05ff]/g)?.length ?? 0;

	if (hebrewLetters < 100) {
		addWarning(filePath, "נמצאו מעט תווים בעברית. בדקו שהתוכן המרכזי בעברית.");
	}
}

async function main() {
	const files = await listContentFiles(contentRoot);

	for (const filePath of files) {
		const source = await readFile(filePath, "utf8");
		const frontmatter = parseFrontmatter(source);

		checkRequiredMetadata(filePath, frontmatter);
		checkProhibitedClaims(filePath, source);
		checkCtas(filePath, source);
		checkParagraphLength(filePath, source);
		checkStyleSignals(filePath, source);
	}

	for (const warning of warnings) {
		console.warn(`אזהרה: ${warning}`);
	}

	if (errors.length > 0) {
		for (const error of errors) {
			console.error(`שגיאה: ${error}`);
		}
		process.exit(1);
	}

	console.log(`בדיקת סגנון תוכן עברה בהצלחה (${files.length} קבצים).`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});

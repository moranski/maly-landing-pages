import { spawnSync } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";

const designSystemsRoot = path.join(process.cwd(), "docs", "design-systems");
const executable = process.platform === "win32" ? "designmd.cmd" : "designmd";
const executablePath = path.join(process.cwd(), "node_modules", ".bin", executable);

async function findDesignFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const nestedFiles = await Promise.all(
		entries.map((entry) => {
			const entryPath = path.join(directory, entry.name);

			if (entry.isDirectory()) {
				return findDesignFiles(entryPath);
			}

			return entry.isFile() && entry.name === "DESIGN.md" ? [entryPath] : [];
		}),
	);

	return nestedFiles.flat().sort();
}

async function main() {
	const files = await findDesignFiles(designSystemsRoot);

	if (files.length === 0) {
		console.log(
			"לא נמצאו מערכות עיצוב בפורמט DESIGN.md. שלב המעבר תקין, אך יש ליצור קובץ לפני אישור עיצוב חדש.",
		);
		return;
	}

	let failed = false;

	for (const file of files) {
		const relativePath = path.relative(process.cwd(), file);
		console.log(`בודק ${relativePath}`);

		const result = spawnSync(executablePath, ["lint", file], {
			encoding: "utf8",
			stdio: "pipe",
		});

		if (result.stdout) process.stdout.write(result.stdout);
		if (result.stderr) process.stderr.write(result.stderr);

		let report;
		try {
			report = JSON.parse(result.stdout);
		} catch {
			console.error(`לא ניתן היה לקרוא את דוח הבדיקה של ${relativePath}.`);
			failed = true;
		}

		if (
			result.status !== 0 ||
			(report?.summary?.errors ?? 0) > 0 ||
			(report?.summary?.warnings ?? 0) > 0
		) {
			failed = true;
		}
	}

	if (failed) process.exit(1);

	console.log(`בדיקת מערכות העיצוב עברה בהצלחה (${files.length} קבצים).`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});

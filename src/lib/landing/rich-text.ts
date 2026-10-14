// Co-authored-by: Codex <codex@openai.com>
export type ListStyle = "standard" | "checklist" | "cross_list";
export interface RichTextBlock {
	_type: "block"; _key: string;
	style: "normal" | "h3" | "h4" | "blockquote";
	children: { _type: "span"; _key: string; text: string; marks: string[] }[];
	markDefs: { _type: "link"; _key: string; href: string }[];
	listItem?: "bullet" | "number";
	level?: number;
}
export type RichText = RichTextBlock[];
type Raw = Record<string, unknown>;
const record = (v: unknown): Raw | undefined => v !== null && typeof v === "object" && !Array.isArray(v) ? v as Raw : undefined;
const key = (v: unknown, fallback: string) => typeof v === "string" && v ? v : fallback;

/** Safe display-only copies: no plugins, HTML, CSS, embeds or private fields. */
export function normalizeRichText(value: unknown, report: (path: string, code: string) => void, safeHref: (value: unknown) => string | undefined): RichText {
	if (value === undefined || value === null) return [];
	if (!Array.isArray(value)) { report("", "invalid_rich_text"); return []; }
	return value.flatMap((item, i): RichText => {
		const b = record(item), path = `[${i}]`;
		if (!b || b._type !== "block") { report(path, "unsupported_rich_text_type"); return []; }
		const style = b.style ?? "normal";
		const supportedStyle = ["normal", "h3", "h4", "blockquote"].includes(String(style));
		if (!supportedStyle) report(`${path}.style`, "unsupported_rich_text_style");
		const markDefs: RichTextBlock["markDefs"] = [];
		if (b.markDefs !== undefined && !Array.isArray(b.markDefs)) report(`${path}.markDefs`, "invalid_marks");
		for (const [j, value] of (Array.isArray(b.markDefs) ? b.markDefs : []).entries()) {
			const def = record(value), href = safeHref(def?.href);
			if (!def || def._type !== "link" || typeof def._key !== "string" || !def._key || !href || ["strong", "em"].includes(def._key) || markDefs.some(d => d._key === def._key)) {
				report(`${path}.markDefs[${j}]`, "invalid_rich_text_link"); continue;
			}
			markDefs.push({ _type: "link", _key: def._key, href });
		}
		if (!Array.isArray(b.children)) { report(`${path}.children`, "invalid_rich_text_children"); return []; }
		const allowedMarks = new Set(["strong", "em", ...markDefs.map(d => d._key)]);
		const children = b.children.flatMap((value, j): RichTextBlock["children"] => {
			const span = record(value);
			if (!span || span._type !== "span" || typeof span.text !== "string") { report(`${path}.children[${j}]`, "unsupported_rich_text_span"); return []; }
			if (span.marks !== undefined && !Array.isArray(span.marks)) report(`${path}.children[${j}].marks`, "invalid_marks");
			const marks = (Array.isArray(span.marks) ? span.marks : []).filter((mark): mark is string => {
				if (typeof mark === "string" && allowedMarks.has(mark)) return true;
				report(`${path}.children[${j}].marks`, "unsupported_rich_text_mark"); return false;
			});
			return [{ _type: "span", _key: key(span._key, `span-${j}`), text: span.text, marks: [...new Set(marks)] }];
		});
		if (!children.some(c => c.text.trim())) return [];
		const block: RichTextBlock = { _type: "block", _key: key(b._key, `text-${i}`), style: supportedStyle ? style as RichTextBlock["style"] : "normal", children, markDefs: markDefs.filter(d => children.some(c => c.marks.includes(d._key))) };
		if (b.listItem !== undefined) {
			if (b.listItem === "bullet" || b.listItem === "number") {
				block.listItem = b.listItem;
				block.level = typeof b.level === "number" && Number.isInteger(b.level) && b.level > 0 && b.level <= 6 ? b.level : 1;
				if (b.level !== undefined && b.level !== block.level) report(`${path}.level`, "invalid_list_level");
			} else report(`${path}.listItem`, "unsupported_rich_text_list");
		}
		return [block];
	});
}

/** Deterministic text-only conversion, without parsing literal Markdown or HTML. */
export function plainTextToRichText(items: string[], list = false): RichText {
	return items.map((text, i) => ({ _type: "block", _key: `text-${i}`, style: "normal", children: [{ _type: "span", _key: `span-${i}`, text, marks: [] }], markDefs: [], ...(list ? { listItem: "bullet", level: 1 } as const : {}) }));
}

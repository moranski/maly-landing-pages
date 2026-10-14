// Pure migration preparation; all CMS reads and writes use EmDash MCP.
// Co-authored-by: Codex <codex@openai.com>
import { plainTextToRichText } from "./rich-text.ts";
type Block = Record<string, unknown>;
const affected = new Set(["landing_hero", "landing_content_section", "landing_offer", "landing_final_cta"]);

export function migrateRichTextLayout(layout: Block[]): Block[] {
	return layout.map(source => {
		const b = { ...source };
		if (!affected.has(String(b._type)) || b._version === 3) return b;
		if (b._version !== 2) throw new Error("Rich text migration requires version 2 blocks");
		const section = b._type === "landing_content_section";
		const repeater = b._type === "landing_hero" ? b.body : b.paragraphs;
		const strings = b._type === "landing_offer" ? [b.body] : repeater ?? [];
		if (!Array.isArray(strings)) throw new Error("Invalid legacy paragraphs");
		const texts = strings.map(item => {
			const t = typeof item === "string" ? item : item && typeof item === "object" ? (item as Block).text : undefined;
			if (typeof t !== "string" || !t.trim()) throw new Error("Invalid legacy text; migration would lose content");
			return t;
		});
		if (section && !["paragraphs", "bullets", "checklist", "cross_list"].includes(String(b.paragraph_format))) throw new Error("Invalid legacy paragraph format");
		b.body = plainTextToRichText(texts, section && b.paragraph_format !== "paragraphs");
		if (section) b.list_style = ["checklist", "cross_list"].includes(String(b.paragraph_format)) ? b.paragraph_format : "standard";
		delete b.paragraphs;
		delete b.paragraph_format;
		b._version = 3;
		return b;
	});
}

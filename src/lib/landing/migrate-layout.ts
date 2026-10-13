// Pure migration preparation; all CMS reads and writes must use EmDash MCP.
// Co-authored-by: Codex <codex@openai.com>
type Block = Record<string, unknown>;
const legacyBackgrounds: Record<string, string> = { plain: "שנהב", tinted: "אבן", deep: "כחול כהה" };
export function migrateLandingLayout(layout: Block[], reasonBlockKey: string): Block[] {
	return layout.map(source => {
		const block = { ...source };
		if (source._version === 2) return block;
		if (source._version !== undefined && source._version !== 1) throw new Error("Unsupported migration source version");
		if (source._type === "landing_content_section") {
			block.background = source.background ?? legacyBackgrounds[typeof source.tone === "string" ? source.tone : ""] ?? "שנהב";
			block.paragraph_format = source._key === reasonBlockKey ? "cross_list" : "paragraphs";
			if (source._key === reasonBlockKey && Array.isArray(source.paragraphs)) {
				block.paragraphs = source.paragraphs.map(item => {
					if (typeof item === "string") return item.replace(/^[✓×✕]\s*/, "");
					if (item && typeof item === "object" && typeof (item as Block).text === "string") return { ...item, text: ((item as Block).text as string).replace(/^[✓×✕]\s*/, "") };
					return item;
				});
			}
			delete block.tone;
		} else if (source._type === "landing_offer") {
			delete block.lead_endpoint;
			delete block.consent_label;
			block.kicker = source.kicker ?? "רוצים להתחיל?";
		}
		if (["landing_hero", "landing_content_section", "landing_testimonials", "landing_offer", "landing_final_cta"].includes(String(source._type))) block._version = 2;
		return block;
	});
}

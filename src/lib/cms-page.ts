// Co-authored-by: Codex <codex@openai.com>
import { normalizeRichText, type RichText } from "./landing/rich-text.ts";
import { destination } from "./landing/normalize.ts";

export interface CmsPage { title: string; body: RichText; lang: string; dir: "rtl" | "ltr"; }
export function normalizeCmsPage(data: unknown, locale: unknown): { page?: CmsPage; diagnostics: { path: string; code: string }[] } {
	const diagnostics: { path: string; code: string }[] = [];
	const fields = data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : {};
	const title = typeof fields.title === "string" && fields.title.trim() ? fields.title : undefined;
	if (!title) { diagnostics.push({ path: "title", code: "required" }); return { diagnostics }; }
	const lang = typeof locale === "string" && /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i.test(locale) ? locale : "he";
	const body = normalizeRichText(fields.content, (path, code) => diagnostics.push({ path: `content${path}`, code }), destination);
	return { page: { title, body, lang, dir: /^(he|ar|fa|ur)(-|$)/i.test(lang) ? "rtl" : "ltr" }, diagnostics };
}

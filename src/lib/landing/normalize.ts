// Co-authored-by: Codex <codex@openai.com>
import { getSectionBackground, type SectionSurface } from "../../scripts/section-background.js";

export type ParagraphFormat = "paragraphs" | "bullets" | "checklist" | "cross_list";
export type CtaStyle = "orange" | "navy" | "outline" | "white";
export interface Cta { label: string; href: string; style?: CtaStyle }
export interface Image { src: string; alt: string; caption?: string; width?: number; height?: number }
export interface Hero {
	eyebrow?: string; title: string; subtitle: string; body: string[];
	primaryCta?: Cta; secondaryCta?: Cta;
	visual?: Image & { title?: string };
}
export interface ContentSection {
	kind: "section"; id?: string; kicker?: string; title: string; surface: SectionSurface;
	paragraphFormat: ParagraphFormat; paragraphs: string[];
	cards: { title: string; body: string }[]; orderedCards: boolean;
	profile?: Image; gallery: Image[]; faq: { question: string; answer: string }[];
}
export interface Testimonials {
	kind: "testimonials"; title: string;
	items: { quote: string; attribution?: string; authorImage?: Image }[];
}
export interface Offer {
	kind: "offer"; title: string; body: string; includes: string[]; kicker?: string; cta?: Cta;
}
export interface FinalCta {
	kind: "final"; heading: string; paragraphs: string[]; signature?: string; kicker?: string; cta?: Cta;
}
export interface LandingPage {
	title: string; description: string; lang: "he"; dir: "rtl";
	hero?: Hero; blocks: (ContentSection | Testimonials | Offer | FinalCta)[];
}
export interface Diagnostic { blockKey?: string; path: string; code: string }
type Raw = Record<string, unknown>;
const record = (value: unknown): Raw | undefined => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Raw : undefined;
// Test blankness without changing editorial text, including literal list markers.
const text = (value: unknown): string | undefined => typeof value === "string" && value.trim() ? value : undefined;
const formats: ParagraphFormat[] = ["paragraphs", "bullets", "checklist", "cross_list"];
const ctaStyles: Record<string, CtaStyle> = { "כתום": "orange", "כחול כהה": "navy", "מסגרת כחולה": "outline", "לבן": "white" };
const legacySurfaces: Record<string, SectionSurface> = { plain: "ivory", tinted: "stone", deep: "navy" };
const versions: Record<string, number[]> = {
	landing_hero: [1, 2], landing_content_section: [1, 2], landing_testimonials: [1, 2], landing_offer: [1, 2], landing_final_cta: [1, 2],
};

/** Returns a safe destination, never an inferred target or arbitrary protocol. */
export function destination(value: unknown, httpsOnly = false): string | undefined {
	const href = text(value)?.trim();
	if (!href || /[\u0000-\u0020\u007f]/u.test(href)) return undefined;
	if (!httpsOnly && (href.startsWith("#") && href.length > 1 || href.startsWith("/") && !href.startsWith("//") && !href.includes("\\"))) return href;
	try { return new URL(href).protocol === "https:" ? href : undefined; } catch { return undefined; }
}

/** CMS shapes and retained-version compatibility stop at this boundary. */
export function normalizeLandingPage(input: unknown): { page?: LandingPage; diagnostics: Diagnostic[] } {
	const diagnostics: Diagnostic[] = [];
	const data = record(input) ?? {};
	const issue = (path: string, code: string, blockKey?: string) => diagnostics.push({ path, code, ...(blockKey ? { blockKey } : {}) });
	const title = text(data.title), description = text(data.description);
	for (const field of ["title", "description"]) if (!text(data[field])) issue(field, "required");
	if (data.lang !== "he") issue("lang", "invalid");
	if (data.dir !== "rtl") issue("dir", "invalid");
	if (!title || !description || data.lang !== "he" || data.dir !== "rtl") return { diagnostics };
	const page: LandingPage = { title, description, lang: "he", dir: "rtl", blocks: [] };
	if (!Array.isArray(data.layout) || !data.layout.length) { issue("layout", "required"); return { page, diagnostics }; }
	let heroCount = 0;
	data.layout.forEach((value, index) => {
		const b = record(value);
		const root = `layout[${index}]`;
		if (!b) { issue(root, "invalid_block"); return; }
		const key = text(b._key);
		const report = (path: string, code: string) => issue(`${root}.${path}`, code, key);
		const required = (value: unknown, path: string) => { const result = text(value); if (!result) report(path, "required"); return result; };
		const entries = (value: unknown, path: string): [number, Raw][] => {
			if (value === undefined || value === null) return [];
			if (!Array.isArray(value)) { report(path, "invalid_repeater"); return []; }
			return value.flatMap((item, i) => { const r = record(item); if (!r) report(`${path}[${i}]`, "invalid_item"); return r ? [[i, r] as [number, Raw]] : []; });
		};
		const texts = (value: unknown, path: string, mandatory = false): string[] => {
			if (value !== undefined && !Array.isArray(value)) report(path, "invalid_repeater");
			const result = Array.isArray(value) ? value.flatMap((item, i) => { const t = required(typeof item === "string" ? item : record(item)?.text, `${path}[${i}].text`); return t ? [t] : []; }) : [];
			if (mandatory && !result.length) report(path, "required");
			return result;
		};
		const image = (value: unknown, alt: unknown, path: string, mandatory = false): Image | undefined => {
			if (value === undefined || value === null || value === "") { if (mandatory) report(path, "required"); return; }
			const media = record(value);
			const storageKey = text(record(media?.meta)?.storageKey);
			const source = typeof value === "string" ? value : media?.src ?? media?.url ?? media?.previewUrl ?? (storageKey ? `/_emdash/api/media/file/${encodeURIComponent(storageKey)}` : undefined);
			const src = destination(source);
			const description = text(alt);
			if (!src || src.startsWith("#") || !description) { report(path, "invalid_image"); return; }
			const dimension = (v: unknown): number | undefined => typeof v === "number" && Number.isInteger(v) && v > 0 ? v : undefined;
			const width = dimension(media?.width), height = dimension(media?.height);
			return { src, alt: description, ...(width && height ? { width, height } : {}) };
		};
		const cta = (label: unknown, href: unknown, path: string, httpsOnly = false): Cta | undefined => {
			const l = required(label, `${path}.label`), h = destination(href, httpsOnly);
			if (!h) report(`${path}.href`, "invalid_destination");
			const choice = b.cta_style;
			const style = typeof choice === "string" && Object.hasOwn(ctaStyles, choice) ? ctaStyles[choice] : undefined;
			if (choice !== undefined && choice !== null && choice !== "" && choice !== "ברירת מחדל" && !style) report("cta_style", "invalid_choice");
			return l && h ? { label: l, href: h, ...(style ? { style } : {}) } : undefined;
		};
		const kind = text(b._type ?? b.type);
		const version = b._version ?? 1;
		if (kind === "landing_hero") {
			heroCount++;
			if (index !== 0) { report("_type", "misplaced_or_duplicate_hero"); return; }
		}
		if (!kind || !versions[kind]) { report("_type", "unknown_block_type"); return; }
		if (typeof version !== "number" || !versions[kind].includes(version)) { report("_version", "unsupported_version"); return; }
		if (kind === "landing_hero") {
			const title = required(b.title, "title"), subtitle = required(b.subtitle, "subtitle"), body = texts(b.body, "body", true);
			const primaryCta = cta(b.cta_label, b.cta_href, "cta");
			const visual = image(b.visual_image, b.visual_alt, "visual_image", true);
			const visualTitle = required(b.visual_title, "visual_title"), visualCaption = required(b.visual_caption, "visual_caption");
			if (title && subtitle && body.length) page.hero = { title, subtitle, body, eyebrow: text(b.eyebrow), primaryCta, visual: visual ? { ...visual, title: visualTitle, caption: visualCaption } : undefined };
		} else if (kind === "landing_content_section") {
			const title = required(b.title, "title");
			let surface = getSectionBackground(b.background);
			if (!surface && version === 1) surface = legacySurfaces[typeof b.tone === "string" ? b.tone : ""] ?? "ivory";
			if (!surface) { report("background", "invalid_choice"); return; }
			const format = version === 1 ? "paragraphs" : b.paragraph_format;
			if (!formats.includes(format as ParagraphFormat)) { report("paragraph_format", "invalid_choice"); return; }
			const profile = image(b.profile_image, b.profile_alt, "profile_image");
			const gallery = entries(b.gallery, "gallery").flatMap(([i, r]) => { const img = image(r.image, r.alt, `gallery[${i}].image`, true); return img ? [{ ...img, caption: text(r.caption) }] : []; });
			const cards = entries(b.cards, "cards").flatMap(([i, r]) => { const title = required(r.title, `cards[${i}].title`), body = required(r.body, `cards[${i}].body`); return title && body ? [{ title, body }] : []; });
			const faq = entries(b.faq_items, "faq_items").flatMap(([i, r]) => { const question = required(r.question, `faq_items[${i}].question`), answer = required(r.answer, `faq_items[${i}].answer`); return question && answer ? [{ question, answer }] : []; });
			const paragraphs = texts(b.paragraphs, "paragraphs");
			if (!paragraphs.length && !cards.length && !gallery.length && !faq.length && !profile) { report("content", "required"); return; }
			if (title) page.blocks.push({ kind: "section", title, id: text(b.id), kicker: text(b.kicker), surface, paragraphFormat: format as ParagraphFormat, paragraphs, cards, orderedCards: b.ordered_cards === true, profile: profile ? { ...profile, caption: text(b.profile_caption) } : undefined, gallery, faq });
		} else if (kind === "landing_testimonials") {
			const title = required(b.title, "title");
			const items = entries(b.testimonials, "testimonials").flatMap(([i, r]) => {
				const quote = required(r.quote, `testimonials[${i}].quote`);
				const img = image(r.author_image, record(r.author_image)?.alt, `testimonials[${i}].author_image`);
				return quote ? [{ quote, attribution: text(r.attribution), authorImage: img }] : [];
			});
			if (!items.length) report("testimonials", "required");
			if (title && items.length) page.blocks.push({ kind: "testimonials", title, items });
		} else if (kind === "landing_offer") {
			const title = required(b.title, "title"), body = required(b.body, "body"), includes = texts(b.includes, "includes", true);
			const action = cta(b.submit_label, b.checkout_url, "checkout", true);
			if (title && body && includes.length) page.blocks.push({ kind: "offer", title, body, includes, cta: action, kicker: text(b.kicker) });
		} else if (kind === "landing_final_cta") {
			const heading = required(b.heading, "heading"), paragraphs = texts(b.paragraphs, "paragraphs", true);
			const action = cta(b.cta_label, b.cta_href, "cta");
			if (heading && paragraphs.length) page.blocks.push({ kind: "final", heading, paragraphs, signature: text(b.signature), kicker: text(b.kicker), cta: action });
		}
	});
	if (heroCount !== 1 || !page.hero) issue("layout", "hero_contract");
	return { page, diagnostics };
}

// Co-authored-by: Codex <codex@openai.com>
/** Canonical landing path, also used by legacy redirects. */
export function landingPagePath(slug: string): string {
	return `/landing/${encodeURIComponent(slug)}/`;
}

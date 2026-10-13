// Co-authored-by: Codex <codex@openai.com>
// Use EmDash's existing /_image endpoint, which resolves source bytes through
// its storage adapter. Leave external media and local development unchanged.
const mediaOrigin = "https://maly-landing-pages.moranski.workers.dev";
const mediaPath = /^\/_emdash\/api\/media\/file\/[A-Za-z0-9_-][A-Za-z0-9._-]*\.(?:png|webp|jpe?g|avif)$/i;

function localMediaPath(src: string): string | undefined {
	try {
		const url = new URL(src, mediaOrigin);
		if (url.origin !== mediaOrigin || url.search || url.hash || url.username || url.password || src.includes("\\")) return;
		if (!src.startsWith("/_emdash/") && !src.startsWith(`${mediaOrigin}/_emdash/`)) return;
		return mediaPath.test(url.pathname) ? url.pathname : undefined;
	} catch { return; }
}

export function mediaImageUrl(src: string, width: number, optimize: boolean): string {
	const path = optimize ? localMediaPath(src) : undefined;
	if (!path || !Number.isInteger(width) || width < 1 || width > 4000) return src;
	return `/_image?${new URLSearchParams({ href: path, w: String(width), f: "webp", q: "85" })}`;
}

export function responsiveMediaImage(src: string, widths: number[], sizes: string, optimize: boolean, originalWidth?: number) {
	let candidates = [...new Set(widths)].filter(w => Number.isInteger(w) && w > 0 && w <= 4000).sort((a, b) => a - b);
	if (!optimize || !localMediaPath(src) || !candidates.length) return { src };
	// The binding never upscales: a descriptor above the original width would
	// misrepresent the returned pixels. Unknown dimensions get a single URL.
	if (!originalWidth || !Number.isInteger(originalWidth) || originalWidth < 1) return { src: mediaImageUrl(src, candidates[Math.floor(candidates.length / 2)], true) };
	const cap = Math.min(originalWidth, candidates[candidates.length - 1]);
	candidates = [...new Set([...candidates.filter(w => w <= cap), cap])];
	return {
		src: mediaImageUrl(src, candidates[Math.floor(candidates.length / 2)], true),
		srcset: candidates.map(w => `${mediaImageUrl(src, w, true)} ${w}w`).join(", "),
		sizes,
	};
}

const background = `${mediaOrigin}/_emdash/api/media/file/01M4EN17571ZYTCHAZCSEMNK0V.01M4EN17H57PAR2NBFHRKCBDM7.png`;
export function landingBackgroundStyle(optimize: boolean): string {
	// Keep the original 2x resolution for the repeating 362px-wide tile.
	return `--landing-background-image: url("${mediaImageUrl(background, 724, optimize)}")`;
}

import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { EmDashClient } from "emdash/client";

const siteUrl = process.env.EMDASH_URL ?? "https://maly-landing-pages.moranski.workers.dev";
const root = resolve(new URL("..", import.meta.url).pathname);
const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const credentials = await readJson(join(homedir(), ".config", "emdash", "auth.json"));
const auth = credentials[new URL(siteUrl).origin];

if (!auth?.accessToken) {
	throw new Error(`No EmDash login is stored for ${siteUrl}. Run: npx emdash login -u ${siteUrl}`);
}

const client = new EmDashClient({ baseUrl: siteUrl, token: auth.accessToken });
const schema = await readJson(join(root, "emdash", "landing-pages.schema.json"));
const content = await readJson(join(root, "emdash", "reading.content.json"));

const existingBlocks = new Map((await client.blockTypes()).map((block) => [block.slug, block]));
for (const block of schema.blockTypes) {
	if (!existingBlocks.has(block.slug)) {
		await client.createBlockType(block);
		console.log(`Created block type: ${block.slug}`);
	}
}

const collectionDefinition = schema.collections[0];
const collections = await client.collections();
if (!collections.some((collection) => collection.slug === collectionDefinition.slug)) {
	const { fields, ...collection } = collectionDefinition;
	await client.createCollection({ ...collection, source: "manual", hasSeo: true });
	console.log(`Created collection: ${collection.slug}`);
}

const collection = await client.collection(collectionDefinition.slug);
const fieldSlugs = new Set(collection.fields.map((field) => field.slug));
for (const field of collectionDefinition.fields) {
	if (!fieldSlugs.has(field.slug)) {
		await client.createField(collectionDefinition.slug, field);
		console.log(`Created field: ${field.slug}`);
	}
}

const mediaSources = {
	"card-letters": {
		path: join(root, "public/assets/reading/cards/card-letters.webp"),
		alt: "כרטיס לימוד מהקורס עם האות J ודוגמאות למילים Jeep ו-Jungle",
		caption: "אות, צליל ודוגמאות חזותיות",
	},
	"card-sounds": {
		path: join(root, "public/assets/reading/cards/card-sounds.webp"),
		alt: "כרטיס לימוד מהקורס עם האות L ודוגמאות למילים Lion ו-Lemon",
		caption: "חיבור בין צליל, תמונה ומילה",
	},
	maly: {
		path: join(root, "public/assets/reading/people/maly.webp"),
		alt: "מלי, יוצרת הקורס אנגלית מעצימה לי עם מלי",
		caption: "מלי - מלווה ילדים ומבוגרים בלימוד אנגלית כבר יותר מ־20 שנה",
	},
};

const media = {};
for (const [name, source] of Object.entries(mediaSources)) {
	const bytes = await readFile(source.path);
	const uploaded = await client.mediaUpload(bytes, source.path.split("/").at(-1), {
		contentType: "image/webp",
		alt: source.alt,
		caption: source.caption,
	});
	media[name] = {
		id: uploaded.id,
		src: uploaded.url,
		alt: uploaded.alt ?? source.alt,
		width: uploaded.width ?? undefined,
		height: uploaded.height ?? undefined,
	};
	console.log(`Uploaded media: ${name}`);
}

const replaceMedia = (value) => {
	if (Array.isArray(value)) return value.map(replaceMedia);
	if (!value || typeof value !== "object") return value;
	if (typeof value.$media === "string") {
		const resolved = media[value.$media];
		if (!resolved) throw new Error(`Unknown media placeholder: ${value.$media}`);
		return resolved;
	}
	return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replaceMedia(child)]));
};

const data = replaceMedia(content.data);
const published = await client.list(collectionDefinition.slug, { limit: 100 });
const drafts = await client.list(collectionDefinition.slug, { status: "draft", limit: 100 });
const existing = [...published.items, ...drafts.items].find((entry) => entry.slug === content.slug);

let entry;
if (existing) {
	const current = await client.get(collectionDefinition.slug, existing.id, { raw: true });
	entry = await client.update(collectionDefinition.slug, existing.id, { data, slug: content.slug, _rev: current._rev });
	console.log(`Updated existing entry: ${content.slug}`);
} else {
	entry = await client.create(collectionDefinition.slug, { data, slug: content.slug, locale: content.locale, status: "draft" });
	console.log(`Created draft: ${content.slug}`);
}

await client.publish(collectionDefinition.slug, entry.id);
console.log(`Published: ${siteUrl}/${content.slug}/`);

// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import emdash from "emdash/astro";
import { d1, r2, sandbox } from "@emdash-cms/cloudflare";
import { emprivacyPlugin } from "@emplugins/emprivacy";

// https://astro.build/config
export default defineConfig({
	site: process.env.SITE_URL,
	output: "server",
	integrations: [
		mdx(),
		react(),
		emdash({
			database: d1({ binding: "DB" }),
			storage: r2({ binding: "MEDIA" }),
			sandboxRunner: sandbox(),
			plugins: [emprivacyPlugin()],
		}),
	],
	adapter: cloudflare(),
	// Keep the Cloudflare SSR worker's Astro dependencies in Vite's first
	// optimization pass. This avoids a cold-start optimizer reload while the
	// worker is already importing the CMS admin routes.
	vite: {
		ssr: {
			optimizeDeps: {
				include: [
					"@astrojs/cloudflare/entrypoints/server",
					"astro/app/fetch/default-handler",
					"astro/assets/services/noop",
					"astro/logger/json",
				],
			},
		},
	},
});

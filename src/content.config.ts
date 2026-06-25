import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";

const landingPages = defineCollection({
	loader: glob({ base: "./src/content/landing-pages", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		slug: z.string(),
		lang: z.string().default("he"),
		dir: z.enum(["rtl", "ltr"]).default("rtl"),
		draft: z.boolean().default(false),
		hero: z.object({
			eyebrow: z.string().optional(),
			title: z.string(),
			subtitle: z.string(),
			body: z.array(z.string()).default([]),
			primaryCta: z.object({
				label: z.string(),
				href: z.string(),
			}),
			secondaryCta: z
				.object({
					label: z.string(),
					href: z.string(),
				})
				.optional(),
		}),
		stats: z.array(
			z.object({
				value: z.string(),
				label: z.string(),
			}),
		),
	}),
});

export const collections = { landingPages };

# Reading page design reference

This file is a derived implementation reference, not an independent design source. Google Stitch is authoritative. If a token here conflicts with the selected Stitch screen or its project design system, update this reference and the renderer to match Stitch.

- **Stitch project:** [דף נחיתה לימודי אנגלית](https://stitch.withgoogle.com/projects/5526393599336009433)
- **Selected screen:** [Power English - דף נחיתה מבוסס מקור ואפיון מלא](https://stitch.withgoogle.com/projects/5526393599336009433/screens/b2c425fdf4ad47778bc459d79e30561c); its exported HTML uses a mobile-first `max-w-lg` (512px) layout.
- **Design system:** project-level “Power English Mobile Landing”; Rubik typography, light mode, rounded cards. When the project brief and generated screen differ, follow the selected screen’s rendered HTML for this page.

## Tokens to implement

| Role | Value |
| --- | --- |
| Warm canvas | `#FBF9F5` |
| Surface / card | `#FFFFFF` |
| Primary navy | `#00236F` |
| Primary container | `#1E3A8A` |
| Primary action (secondary) | `#A73A00` |
| Action hover | `#FD651E` |
| Warm secondary tint | `#FFDBCE` |
| WhatsApp green | `#128C7E` (contact-specific) |
| Body text | `#1B1C1A` |
| Muted text | `#444651` |
| Soft section surface | `#F5F3EF` |
| Card outline | `#EAE8E4` |
| Card shadow | subtle neutral `shadow-sm` |
| CTA shadow | soft burnt-orange lift |
| Headline font | Rubik, weights 700–800 |
| Body font | Rubik, weight 400, line-height 1.45–1.55 |
| Content width | 512px outer frame, 480px usable width |
| Page gutter | 16px |
| Main section spacing | 32px |
| Prominent card radius | 24px; nested cards 12–16px |
| Primary button | orange pill, white label, 56px minimum height |

Use RTL flow and keep paragraph measure around 32–42 Hebrew characters. The selected screen uses a compact fixed translucent header, a single-column hero with image and full-width CTA, open and softly tinted content sections, a navy showcase/gallery panel, a rounded instructor portrait, parent-proof cards, a warm offer/form card, and a persistent mobile CTA. Preserve this visual rhythm while EmDash remains authoritative for published wording, claims, order, and media.

Use one compact pill treatment for every section kicker. Keep its shape, padding, type size, weight, and spacing consistent; vary only foreground and background colors for the hero and dark navy sections.

The selected screen’s HTML and screenshot were downloaded from the Stitch MCP artifact. The renderer now implements its shared palette, compact fixed header, mobile-width frame, hero image/CTA order, toned sections, cards, gallery panel, profile treatment, offer, and sticky CTA. CMS content differs from the mock’s copy, so only the visual system is carried across; do not copy mock wording or unverified phone, price, or testimonial content into EmDash.

## Change workflow

1. Update the selected screen or its project design system in Stitch first.
2. Implement that approved direction in the Astro renderer and its theme tokens.
3. Compare a local rendered page against the selected Stitch screen at its 512px mobile frame and a wider viewport.
4. If implementation needs to depart from Stitch for content, accessibility, or technical constraints, document the reason and keep the deviation as narrow as possible.

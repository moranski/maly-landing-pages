# Cookie consent and tracking

The public landing-page layout integrates EmPrivacy as a native EmDash plugin. It renders the CMP on each landing page and uses the EmPrivacy consent state to gate the site’s existing GTM container.

## Where the integration lives

- `astro.config.mjs` registers `emprivacyPlugin()` with EmDash. The package is pinned in `package.json`; `postinstall` uses `patch-package` to apply the small Worker-compatibility and Hebrew-UI changes in `patches/@emplugins+emprivacy+3.2.0.patch`.
- EmPrivacy's saved settings are the normal way to configure banner title/message, locale fallback, policy links, strict consent defaults, analytics provider, and Google Consent Mode. The settings can be updated in the EmDash admin without patching the package. The patch currently adds Hebrew button and category labels because EmPrivacy 3.2.0 has no Hebrew built-in locale, and its admin locale override supports only title/message. Remove that part when an upstream release adds Hebrew labels or equivalent supported overrides.
- The remaining Worker compatibility change replaces runtime-generated `new Function` code with a static hostname checker. Cloudflare Workers reject code generation from strings; current EmPrivacy 3.2.0 calls `new Function` while importing the plugin. `wrangler.json`'s `disallow_eval_during_startup` flag documents/enforces this constraint. This cannot be fixed by EmPrivacy settings. Prefer an upstream release that removes the dynamic code; until then, retain the narrow package patch and recheck it on upgrades.
- The patch also adjusts the EmPrivacy Astro `GatedEmbed.astro` import to use the package's public export. That correction is already present in the installed 3.2.0 source, so it appears redundant and can be removed from the patch after confirming a clean install/build. Do not carry it forward as an ongoing local change.
- `wrangler.json` supplies the public `GTM_ID` variable. `src/env.d.ts` declares it for TypeScript, and `src/layouts/LandingPage.astro` validates the ID and loads `gtm.js` only after EmPrivacy reports Analytics or Marketing consent. Do not add an unconditional GTM snippet or a `noscript` loader; both would bypass this consent gate.
- The landing-page layout uses EmDash head/body components, while EmPrivacy owns its banner and consent state. The layout’s global style keeps the consent interface right-to-left.
- `wrangler.json` sets `disallow_eval_during_startup` along with `nodejs_compat`. Keep Worker compatibility settings aligned with the dependency patch and check Cloudflare logs if a future build begins throwing `Code generation from strings disallowed for this context`.

## Current behavior

- New visitors start with optional categories off. Google Consent Mode defaults are denied before GTM can load.
- GTM loads after either Analytics or Marketing consent. EmPrivacy maps Analytics to `analytics_storage` and Marketing to the Google advertising consent signals.
- GTM tags must still be configured in the GTM container to require the appropriate consent category. This repository cannot assign category requirements to individual container tags.
- The EmPrivacy admin configuration supplies the Hebrew banner text, Google Consent Mode, and disables EmPrivacy's separate analytics provider so it does not install a second tracker. The package patch supplies Hebrew interface labels until upstream supports them.
- The consent banner is right-to-left. Policy links are initially empty.

The current GTM container ID is an environment variable (`GTM_ID`), not page content. Keep deployment-specific values in Wrangler or Cloudflare configuration; do not copy secrets or environment settings into CMS records.

## EmPrivacy admin setup

EmPrivacy settings are stored by EmDash and are not configured in this repository. In the EmDash admin, open **EmPrivacy** and configure it once the privacy policy page exists:

1. Set the required Privacy Policy path (for example `/privacy`) and increment the policy version when the notice or vendors change.
2. Keep Analytics platform set to **None**; this site loads GTM itself after consent.
3. Keep strict defaults and Google Consent Mode enabled. Use Hebrew for the default locale.
4. Configure the tags inside GTM to honor analytics and advertising consent separately.

The plugin defaults leave the policy link blank until the policy page is available. EmPrivacy requires a valid privacy policy path or HTTPS URL before saving admin settings.

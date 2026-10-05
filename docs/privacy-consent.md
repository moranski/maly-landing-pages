# Cookie consent and tracking

The public landing-page layout integrates EmPrivacy as a native EmDash plugin. It renders the CMP on each landing page and uses the EmPrivacy consent state to gate the site’s existing GTM container.

## Current behavior

- New visitors start with optional categories off. Google Consent Mode defaults are denied before GTM can load.
- GTM loads after either Analytics or Marketing consent. EmPrivacy maps Analytics to `analytics_storage` and Marketing to the Google advertising consent signals.
- GTM tags must still be configured in the GTM container to require the appropriate consent category. This repository cannot assign category requirements to individual container tags.
- The EmPrivacy package patch adds Hebrew interface strings, Hebrew defaults, Google Consent Mode, and disables its separate analytics provider so it does not install a second tracker.
- The consent banner is right-to-left. Policy links are initially empty.

## EmPrivacy admin setup

EmPrivacy settings are stored by EmDash and are not configured in this repository. In the EmDash admin, open **EmPrivacy** and configure it once the privacy policy page exists:

1. Set the required Privacy Policy path (for example `/privacy`) and increment the policy version when the notice or vendors change.
2. Keep Analytics platform set to **None**; this site loads GTM itself after consent.
3. Keep strict defaults and Google Consent Mode enabled. Use Hebrew for the default locale.
4. Configure the tags inside GTM to honor analytics and advertising consent separately.

The plugin defaults leave the policy link blank until the policy page is available. EmPrivacy requires a valid privacy policy path or HTTPS URL before saving admin settings.

# Production conversion acceptance (2026-09-23)

PR #75 merged at 11:41 UTC as `9de3ec13da3df50914b2380e3e167e740ca0d977`.
Production deployment: `dpl_3X8XQL1AZjd7AphdxbzJ6rrjm4JZ`, READY, aliased to www.haibucrafts.com.

## Real inquiry evidence

- Mobile viewport 390px: document width 390px, no horizontal overflow.
- Four synthetic reference images compressed from 12.8 MB to 2.4 MB.
- Live form returned HTTP 200, `ok: true`, request reference `13c13bda-26a7-4d29-af20-8c085841a027`, `backupAccepted: true`.
- Primary inbox received marker `PR75-PROD-20260923`, with camera.webp (646858 bytes), reference.webp (481728), sample.webp (645946), fourth.webp (646858).
- Backup provider acceptance is confirmed; actual backup inbox has not been inspected.
- Test harness initially stopped on the normal HTTP 308 slash redirect, before a final delivery response. A corrected controlled retry produced the acceptance above; no earlier matching mail or function log was found.

## Analytics defect found

The form queued exactly one `inquiry_submitted`, but the production response used `script-src 'self'; connect-src 'self'`, blocking the configured Google loader. Browser reported `www.googletagmanager.com/gtag/js: csp`. This is not GA4 ingestion success.

Allow only the Google tag script host and GA4 collection host families, retaining self-only defaults, no inline/eval scripts, no framing and same-origin form actions. No ads or Google Signals enabled. Add regression coverage for production policy.

Reference: https://developers.google.com/tag-platform/security/guides/csp

After this fix deploys, verify actual collection response and query HAIBU GA4 property 555090613. Do not mistake an event queued in dataLayer for Google receiving it.

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

PR #76 merged as `096ed57dd1f80477f11ce7bff665cdefffa5ccb6`. Production deployment `dpl_CYWS1fV9X3KUKUcLxfXKQw9r8sJ5` is READY and the live response contains the updated policy.

Post-fix controlled test marker `PR76-GA4-20260923`, request `3df4c114-dab5-45e1-889a-8ae932ac774c`: real form accepted four images, primary inbox received all four, backup sending accepted, and the actual Google collection endpoint returned HTTP 204 for `inquiry_submitted` with measurement ID `G-HJ0EL0PQWR`. The page queued this conversion exactly once. No CSP rejection occurred; the browser also reported aborted analytics beacon transports alongside successful 204 responses.

The GA4 report connector for property 555090613 returned no processed inquiry event yet when queried immediately after the test. Network collection acceptance is verified; reporting ingestion remains pending. Backup inbox placement still requires the mailbox owner's confirmation.

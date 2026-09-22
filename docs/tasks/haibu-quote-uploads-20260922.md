# Quote upload and mobile form acceptance

PR: https://github.com/maxiaoyang57-afk/haibucrafts-b2b-site/pull/75

Base: `b0358b3d091940e2280ee4bba00a84e2b487936c` (main, PR #74).
Runtime verification commit: `692a081d5414786387766f83e57d7fa943468f50`.

## Buyer behavior

- Name, business email and country are the three required contact fields. Company and phone are in the collapsed optional requirements section.
- Add up to four JPG, PNG or WebP reference images across successive selections. Previews show the prepared filenames and sizes; each image has an accessible removal button.
- Oversized images are resized and compressed in the browser. Browsers without WebP encoding fall back to JPEG with matching attachment type and extension.
- A newer selection invalidates older compression results. Submission waits for the current preparation and rejects duplicate submits. A rejected inquiry retains images for retry.
- Invalid fields reopen the optional section. Analytics errors cannot turn an accepted inquiry into an apparent delivery failure.

## Verified

- 125 Node tests passed, including eight behavioral upload regressions.
- SEO source generation and release build passed. Rebuilt title HTML remains escaped, while SEO tests compare the displayed title text.
- Release audits passed: 184 canonical routes, 183 indexable sitemap URLs, 139 products across four categories, 94 one-hop redirects, and custom HTTP 404 behavior.
- All 252 materialized release files matched the production tree after normalizing Windows checkout line endings to LF.
- Headless Chrome at 320, 390 and 1440 pixel widths: no horizontal overflow. Mobile inputs use 16px text; optional fields start collapsed.
- Four 2200 x 1500 JPG/PNG/WebP test images totaling 12,807,624 bytes became approximately 2.4 MB of ready attachments. A fifth file was refused without discarding the previous selection.
- Removing the PNG reference left three attachments. A local browser submission through the real inquiry handler, with the mail provider mocked, produced matching primary/backup payloads and exactly one `inquiry_submitted` event.
- The SLM680 product page prefilled the correct SKU, product name and category in the quote form.
- Protected Preview runtime contains the new selection/version guards.

## Controlled Preview delivery

One test inquiry was submitted on 2026-09-22 at approximately 15:48 UTC, clearly marked **TEST ONLY - NO ORDER**, with four tiny PNG attachments.

- Request reference: `166c4866-b782-4447-80dc-dfac7c64ae42`.
- API returned `ok: true` and `backupAccepted: true`.
- Primary inquiry was found in the connected Gmail inbox via the existing forwarding path; all four PNG filenames and attachments were present.
- The backup provider accepted its separate message. The backup mailbox itself has not been inspected.

## Remaining release checks

This PR has not been merged or promoted to production. Preview hosts intentionally do not send events into the production GA4 property.

After production approval and deployment, verify one controlled inquiry using the live form, primary and backup inbox delivery, and the GA4 `inquiry_submitted` event in the production property. GSC indexing checks, multi-product quote lists and real order case studies are separate follow-up work.

Work was performed in a fresh checkout; the older video workspace and its uncommitted files were not modified.

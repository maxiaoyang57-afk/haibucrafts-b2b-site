# Full site and inquiry audit — 2026-09-29

Scope: all checked-in public HTML (HAIBU 187, QULA 270), separately from HAIBU's 186 legacy/source preview pages. Current production main remains unchanged; these fixes are in the existing inquiry preview PRs.

## Findings and fixes

- QULA cleared the inquiry basket when submit fired, before native FormSubmit delivery could be known. Keep selections until the buyer explicitly removes/clears them. This avoids losing the list after a blocked or failed POST; it also means successfully sent selections remain available for reuse.
- Returning through browser back/forward could leave QULA submit buttons disabled as Sending. Restore the original button state on pageshow on all four forms.
- Some HAIBU seasonal collection paths matched a broad product-detail path expression. Use top-level Product structured data (not products nested in category ItemLists) to distinguish individual products from collections.
- Cards inserted by search now receive the same short, readable inquiry CTA as static cards before being clicked.
- Shortened optional select prompts, unknown-quantity option and WhatsApp placeholder to fit narrower form columns. Full instructions remain in nearby help text.
- Updated the previous upload test to check the actual multiple-file control, instead of requiring an obsolete marketing sentence. All other upload and delivery safeguards remain tested.

## Verification

- 457 public HTML files parsed: 27,364 internal resource/link references resolved locally; no duplicate IDs or visible Chinese text found by the scan.
- Isolated DOM execution across all 457 pages: 2,374 contextual inquiry links and 5 forms checked, no runtime errors in the inquiry module; seasonal context and dynamic result-card behavior checked.
- QULA simulated prevented/failed submit retains saved selections; pageshow restores the submit button. No actual form POST was sent.
- HAIBU: 157 existing tests passed. 139-product catalog consistency passed. Shared runtime-route audit passed.
- QULA: recipient/backup, native multipart attachment, required-product, SEO, IndexNow, page and basket synchronization gates passed; 231 catalog products.
- Live public sitemap crawl completed: HAIBU 184/184 and QULA 268/268 returned HTTP 200 with HTML (452 total).
- Browser layout checks at a 1363px viewport passed for HAIBU home, resin category and custom solutions, and QULA home, products, customization and contact: no horizontal page overflow, clipped text buttons or loaded-image failures were found in these samples.

## Remaining limits and follow-up

- A historical HAIBU SEO audit uses strict title-brand and character-length rules that newer product titles do not all meet. These are wording/length follow-ups, not missing pages or broken product data. Do not add brand text everywhere simply to satisfy a legacy checker; it can make long titles worse.
- Localized native file-picker words follow the browser/system language. English website body text was checked separately.
- No live email/inbox receipt was tested in this audit, and no customer messages were sent.
- Static coverage of every page plus representative browser checks is not a claim that every page was manually reviewed at every mobile width.

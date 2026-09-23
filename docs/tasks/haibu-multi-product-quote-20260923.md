# Multi-product quote list acceptance

Base: `096ed57dd1f80477f11ce7bff665cdefffa5ccb6` (latest production after PR #76).

## Scope

- Add to Quote on all 139 category product cards and individual product detail pages.
- Header-adjacent quote-list count, accessible announcements, cross-page persistence and duplicate prevention.
- Up to 20 products, each with an optional quantity / unit description (80 characters).
- Quote-list mode displays catalog images, exact SKU/name, removal and quantity editing. It autofills product codes and a list summary in the existing form.
- The direct single-product Get Quote path stays independent of a stored list.
- Browser storage contains only SKU and entered quantity, never contact details. Local storage falls back to tab-scoped session storage. Storage and catalog failures are explicit, not silently treated as a valid empty list.
- Accepted submissions clear only submitted items whose quantities have not changed in another tab. Failure preserves selection and quantities.
- Server validates every SKU against the current 139-product catalog and builds the canonical name, product link and image URL itself. Unknown, duplicate or oversized lists are rejected. Client-supplied product identity is not trusted.
- Primary and backup emails include the same structured list with quantities and product images. Product thumbnails do not consume the four-reference-image attachment allowance.
- No online payment, prices, fabricated orders or catalog identity changes.

## Verified

- 135 Node tests, including nine quote-list validation/state/email tests.
- SEO source generation, release build, 254-file materialization consistency, product identity, full 139-product catalog and HTTP 404 audits pass.
- Real Chrome local browser flow: two categories -> add -> duplicate attempt -> quote list -> quantity edit -> reload -> remove -> re-add from detail -> failed submit -> retry -> success.
- 320px / 390px / 1440px viewports have no horizontal overflow; mobile quantities use 16px input text.
- Both rendered images and code autofill match SLM680 / YX043. Quantities survive navigation and rejection.
- Local real inquiry handler with outbound email mocked generated exactly one primary plus one backup message on accepted retry, containing the same canonical list and quantities.
- Direct SLM680 inquiry remains a single-product request even when the saved list is non-empty.
- Browser page-error capture is empty.

## Release boundary

This new feature is delivered as a separate Preview PR for review, not automatically merged into production. Production currently contains PR #75 inquiry uploads and PR #76 GA4 CSP repair.

After accepting the Preview, merge and run a clearly marked controlled list inquiry on production; verify email rendering, list clearing, and the conversion's `quote_item_count` parameter. GA4 report processing and GSC URL Inspection limitations are documented separately.

# Site V2 Phase 1 — Initial Audit

Status: started on preview branch only.

## Confirmed issues from the current homepage

1. Canonical host currently uses `https://www.haibucrafts.com/`; the V2 standard will use `https://haibucrafts.com/`.
2. Navigation currently exposes `Custom Services` but does not expose the planned `Manufacturing` and `Quality Control` sections.
3. Internal links mix root files and directory paths, for example `index.html`, `products/index.html`, `quote/index.html` and `.html` category pages.
4. The logo and main navigation use relative file links, which complicates reuse across nested Blog and capability pages.
5. The homepage copy uses strong factory-direct language. These claims must be checked against the company’s real ownership and supply-chain model before being repeated on Manufacturing or Quality Control pages.
6. The homepage includes a `24-hour quote target`; this should remain a target rather than a guaranteed service-level promise unless operationally confirmed.
7. The current header structure must be refactored so Blog, Manufacturing, Quality Control and product pages use one consistent desktop and mobile navigation pattern.
8. Product SKU and image mapping must be frozen during Phase 1 to prevent recurrence of previous image/code mismatches.

## Phase 1 implementation order

1. Build a complete route inventory.
2. Define old-to-new redirect mappings.
3. Standardize the canonical domain.
4. Implement the final navigation structure.
5. Implement consistent mobile navigation.
6. Normalize internal links.
7. Validate every route in Preview.
8. Only then begin Manufacturing and Quality Control page construction.

## Non-production rule

No merge to `main` and no production deployment until the user explicitly approves the completed Preview.

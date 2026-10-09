# SKU-specific purchasing evidence — 2026-10-08

Baseline: main `79fd228e78711194be9ecc0ea00e7207863b2219`. Independent candidate for SLM26529, SLM10009, SLM10014, SLM10001, SLM10012, SLM10008 and SLM10123.

## Buyer-facing change

The purchasing template previously presented five bag weights and dispatch in 7–15 days as facts for every SKU. The available explicit user confirmation on October 1 covers 5 g/bag and 7–15-day dispatch for SLM26529. A separate clarification covers the seven-SKU MOQ wording: typically 100 bags, with the final MOQ subject to sales discussion. SKU-specific evidence for the other weights and dispatch periods remains pending.

- Separate confirmed packaging from requested quotation weights in the source data. SLM26529 retains its confirmed 5 g/bag; other packaging requires quotation confirmation.
- Retain all 35 bag-weight inquiry links and their SKU, image, packaging and landing-page attribution. Explain that the selected weight is a request, subject to sales confirmation.
- Keep typically 100 bags qualified by packing and order requirements. Do not inherit SLM26529 dispatch timing for the other six SKUs; shipping transit is additional.
- Synchronize purchasing blocks, specification/packing copy, Christmas and Halloween procurement rows, and modified dates through existing generators.
- Preserve the three approved production category procurement blocks from main by restoring their generator representation. Rebuilding now retains their existing content byte-for-byte; no new category Title/H1 or URL changes.

The earlier batch source is historical input. The reviewed purchasing overlay takes precedence for commercial wording. Dimensions, mix ratios, sample terms, carton data, actual dispatch for six SKUs and physical evidence remain pending. This does not establish stock availability, general certification or guaranteed delivery.

## Validation

- Full test suite: 162 tests passed. Two regression cases cover SKU-scoped packaging/dispatch and all 35 inquiry links in Preview and production files; the legacy approved-copy test defers its superseded packaging paragraph to this reviewed overlay.
- Existing SEO source and release build: passed, including 187 HTML pages, 186 canonical routes, 185 indexable URLs and 139 product image entries.
- Materialized-production audit: 259 files match the candidate byte-for-byte. Existing catalog and full 139-product consistency audits passed.
- Compared all 278 source/production product pages against baseline: Title, H1, canonical and image paths unchanged. Three approved category procurement pages retain baseline production bytes.
- `git diff --check`: passed.

Remote Preview and browser acceptance are recorded in the PR after deployment. This candidate has not been released to production. No inquiry was submitted and no real email delivery or GA4 lead receipt was tested.

## Release scope — 2026-10-09

The user authorized production release and deferred measured dimensions. The seven purchasing pages use size-confirmation wording without numeric measurements. Mixed products describe assorted sizes varying by component, shape and design; SLM10123 describes slice-specific variation without asserting a mixed-material assortment. Included components, any mix proportions, net weight and sample timing require sales confirmation. Physical dimensions are a later follow-up, not a blocker for this authorized release. QULA rod-fit measurements remain a separate task.

Validation and production deployment results for this updated candidate are recorded in PR #93.

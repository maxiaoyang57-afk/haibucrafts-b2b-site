# Codex handoff — Polymer Clay SKUs YX4002–YX4011

## Release target

Work only on branch `feature/polymer-clay-yx4002-yx4011`, created from `main` commit `93f0b9f0948a0a7d944622a8842b69f17de8e1e2`.

Do not merge or intentionally deploy Production. Required workflow: branch → PR → Vercel Preview → desktop/mobile QA → explicit owner approval → merge.

## Catalog baseline and target

The approved current `main` baseline is 81 total products: 33 Slime Charms / 9 Polymer Clay Slices / 20 Resin Charms / 19 Sequins & Confetti.

Add exactly these 8 new Polymer Clay SKUs. Do not alter existing SKU/image mappings.

| SKU | Product name | Route slug | Style |
| --- | --- | --- | --- |
| YX4002 | Christmas Polymer Clay Sprinkle Mix | `yx4002-christmas-polymer-clay-sprinkle-mix` | Seasonal |
| YX4003 | Halloween Polymer Clay Sprinkle Mix | `yx4003-halloween-polymer-clay-sprinkle-mix` | Seasonal |
| YX4004 | Colorful Pixel Game Polymer Clay Slice Mix | `yx4004-colorful-pixel-game-polymer-clay-slice-mix` | Decorative |
| YX4005 | Colorful Candy Polymer Clay Slice Mix | `yx4005-colorful-candy-polymer-clay-slice-mix` | Sweet |
| YX4008 | Christmas Candy Polymer Clay Slice Mix | `yx4008-christmas-candy-polymer-clay-slice-mix` | Seasonal |
| YX4009 | Colorful Game Polymer Clay Slice Mix | `yx4009-colorful-game-polymer-clay-slice-mix` | Decorative |
| YX4010 | Pastel Candy Polymer Clay Sprinkle Mix | `yx4010-pastel-candy-polymer-clay-sprinkle-mix` | Sweet |
| YX4011 | Pastel Fruit & Flower Polymer Clay Slice Mix | `yx4011-pastel-fruit-flower-polymer-clay-slice-mix` | Fruit |

After addition, derive all displayed counts from repository truth and verify the expected approved target is 89 total / 17 Polymer Clay if no other catalog change is introduced. Do not hard-code a count without validating all category totals.

## Source images

Asset bundle prepared outside the repository: `HAIBU_softclay_YX4002-YX4011_B2B_FINAL_IMAGES.zip`.

Each SKU has five intended product-page images:

1. `01-main-product` — source-of-truth original product photograph.
2. `02-product-detail` — source-of-truth original product photograph.
3. `03-b2b-scene` — supplemental B2B scene image.
4. `04-application-scene` — supplemental application scene image.
5. `05-bulk-sourcing` — supplemental sourcing/packaging scene image.

Main/detail original photos control product identity, colors and motifs. AI-generated scene/application/bulk images are contextual only and must not be used to infer or claim exact motif, composition, packaging quantity, factory capacity, MOQ, certification, or compliance facts.

If the ZIP is not available inside the Codex workspace, STOP before wiring image paths. Do not create broken links, placeholders pretending to be the SKU, or substitute another product image. Report `ASSET INPUT REQUIRED` and wait for the exact bundle.

When assets are available, optimize for the existing repository conventions (prefer WebP if that is the current product pipeline), preserve visual fidelity, do not upscale small originals unnecessarily, strip metadata, and keep responsive dimensions explicit.

## Required implementation

- Add 8 product cards to `/products/polymer-clay-slices-wholesale/` using the verified SKU/name/image mapping.
- Update Polymer Clay ItemList JSON-LD from 9 to 17 items and keep item positions deterministic.
- Create one dedicated product detail route per SKU under `/products/polymer-clay-slices-wholesale/<slug>/` following the current Polymer Clay detail-page structure.
- Use unique B2B SEO title, meta description, H1, buyer-fit content and alt text for every SKU; do not duplicate paragraphs across all eight pages.
- Add canonical, robots index/follow, Open Graph/Twitter metadata, Product JSON-LD and BreadcrumbList JSON-LD.
- Product JSON-LD must use the exact SKU and true main product image. Do not add fake Offer/price/availability/review/rating data.
- Preserve the current B2B sourcing wording: public price, blanket MOQ, blanket lead time and blanket compliance/testing claims are prohibited. Where exact values are unknown, use quotation/order-specification confirmation language.
- RFQ links must preserve `source`, `category=polymer-clay-slices`, `product_code`, product name, exact main image path and `landing_page`.
- Update `/products/`, Home/catalog counts, source catalog data, materialized output, sitemap/SEO route maps, generated release candidate and any deterministic test fixtures required by the existing build pipeline.
- Add the 8 canonical URLs to the sitemap and ensure no duplicate canonical URL or clean-URL collision is introduced.
- Preserve all existing redirects and existing approved SKU/image mappings.
- Seasonal products may be contextually linked from relevant Halloween/Christmas hubs only when that link accurately describes the real product; do not rewrite or remove the existing seasonal hubs.
- Do not introduce trademarked game/character/franchise names. `game`, `pixel`, `candy`, `Christmas`, `Halloween`, `fruit`, `flower`, `pastel` are generic descriptive terms only.

## Product-specific content direction

- YX4002: red/green/white Christmas/holiday sprinkle mix; seasonal slime and DIY-kit sourcing.
- YX4003: black/orange/yellow Halloween mix; seasonal slime, shaker and DIY-kit sourcing.
- YX4004: bright multicolor pixel/game-style decorative pieces; generic game/pixel wording only.
- YX4005: bright multicolor candy/novelty decorative mix.
- YX4008: red/green/white Christmas candy-style mix; generic festive motifs only.
- YX4009: bright multicolor game/fruit/candy-style shapes; generic wording only.
- YX4010: pastel pink/purple/yellow/green candy/flower-style mix.
- YX4011: pastel pink/green/red/yellow fruit/flower/candy-style mix.

Do not infer edible use. These are craft components.

## Concurrency guardrail

PR #28 (`codex/issue-27-ux-audit`) is currently open from the same `main` baseline and may merge before this product batch. Before finalizing this branch, re-fetch current `main`. If it has advanced, rebase/merge the new main into this branch without discarding approved UX/accessibility changes or altering the eight SKU mappings.

## Validation gate

Run at minimum:

- `npm test`
- `npm run build:v2-seo`
- `npm run build:v2-release`
- `npm run release:v2-materialize`
- `npm run audit:v2-materialized`
- `npm run audit:v2-seo`
- `npm run audit:v2-404`
- `git diff --check`
- GitHub SEO Release Gate
- Vercel Preview

QA at 1440 / 1200 / 1081 / 1024 / 768 / 390 px. Verify:

- exactly 8 new SKUs, no collisions or duplicates;
- all 8 detail URLs return the expected product;
- all image URLs load and main-image identity matches the SKU source photo;
- Polymer category count is 17 and total catalog count is 89 only if repository totals reconcile;
- search/filter recognizes SKU and product name;
- RFQ buttons carry correct SKU/name/image/landing-page attribution;
- JSON-LD parses and SKU/canonical/image match the page;
- no broken links, missing images, horizontal overflow or console errors;
- no Production deployment.

Required PR handoff statement: `Production not deployed; awaiting review.`

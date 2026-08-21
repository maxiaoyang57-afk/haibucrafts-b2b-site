# Issue #18 — Final 9-SKU Slime Charm Release

Owner decision: **SLM10012 is skipped** for this release.

## Baseline
- Start from corrected `main` after PR #20.
- Existing catalog count: 72.
- Existing Slime Charms count: 24.
- Preserve all PR #20 SKU mappings and permanent redirects.

## Add exactly these 9 products
- SLM10013 — Christmas Santa & Candy Slime Charm Mix — Christmas
- SLM10014 — Halloween Pumpkin & Cat Slime Charm Mix — Halloween
- SLM10015 — Christmas Peppermint & Snowman Slime Charm Mix — Christmas
- SLM10016 — Pastel Flower & Moon Slime Charm Mix — Floral
- SLM10017 — Christmas Tree & Snowman Slime Charm Mix — Christmas
- SLM10018 — Pink Candy & Citrus Slime Charm Mix — Sweet
- SLM10019 — Ocean Crab & Fish Slime Charm Mix — Ocean
- SLM10021 — Halloween Skull & Spider Slime Charm Mix — Halloween
- SLM10022 — Pastel Frog & Duck Slime Charm Mix — Cute Animals

There is no SLM10020. Do not add the new Strawberry & Flower SLM10012 product.

## Media
Use `HAIBU_ISSUE18_9SKU_WEBP_READY.zip` / the supplied Issue #18 media only. Six real product images per accepted SKU. Image 01 is the primary image and images 01–06 are the public gallery. No fabricated or substituted product imagery.

## Required final counts
- Master catalog / published products: **81**
- Slime Charms: **33**
- Polymer Clay Slices: 9
- Resin Charms: 20
- Sequins & Confetti: 19

Correct stale homepage and products-directory displays that still show 63 total products or 15 Slime Charms. Keep generated catalog/category/home/directory counts synchronized.

## Required implementation
Follow GitHub Issue #18 for exact slugs, card/detail-page architecture, B2B wording, inquiry attribution, canonical/robots, Product JSON-LD, BreadcrumbList JSON-LD, sitemap, filters and test gates.

Run:
- npm test
- npm run build:v2-seo
- npm run build:v2-release
- npm run release:v2-materialize
- npm run audit:v2-materialized
- npm run audit:v2-seo
- npm run audit:v2-404
- git diff --check

Then produce Vercel Preview and QA at 1440 / 1024 / 390. Do not merge to Production until a new explicit owner approval is received.

Required handoff text: `Production not deployed; awaiting review.`

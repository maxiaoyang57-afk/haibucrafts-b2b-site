# Slime Charms SKU Renumber — 2026-08-21

Owner-approved atomic mapping:

- SLM680 → SLM712 — Dreamy Mini Doll Sprinkle Mix
- SLM712 → SLM680 — Space Candy Adventure Charms
- SLM10012 → SLM715 — Undersea Craft Charm Pile
- SLM715 → SLM717 — Mini Snack Layout Charms
- SLM717 → SLM10129 — Gingerbread Holiday Charm Feast
- SLM10129 → SLM26521 — Pink Candy Charm Assortment
- SLM26521 → SLM713 — Seashell Candy Decor Plate Mix
- SLM713 → SLM10012 — Sweet Berry Candy Charms

Implementation requirements completed on this fix branch:

- source Slime Charms product cards use the final SKU mapping
- generated production and preview detail routes follow the physical product/title
- quote attribution follows the new SKU and production route
- Product JSON-LD, breadcrumb JSON-LD, canonical and social metadata regenerate from the corrected source
- product catalog and sitemap regenerate from the corrected source
- old SKU/title routes have permanent Vercel redirects to the corrected routes
- obsolete old detail-route files are removed before generation

Release gate: Preview only. Do not merge to main until manual owner approval.

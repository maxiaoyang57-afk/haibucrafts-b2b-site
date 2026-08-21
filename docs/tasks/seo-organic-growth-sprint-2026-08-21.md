# HAIBUCRAFT Organic Growth Sprint — 2026-08-21

## Objective
Increase Google impressions first, then clicks, without using spammy backlinks, doorway pages, keyword stuffing, fake reviews, fake stock, or unsupported manufacturer/compliance claims.

## Current public-site findings
- Production category pages are crawlable and contain substantial buyer-facing content.
- Public search discovery for the domain is still weak relative to the number of published product pages.
- The site already has sound technical foundations: clean product URLs, category hubs, Product JSON-LD, Breadcrumb JSON-LD, sitemap generation and inquiry attribution.
- The homepage/public directory still contains stale product-count copy in currently crawled output; Issue #18 must correct counts to 81 total / 33 Slime Charms after the accepted nine-SKU batch is released.
- Existing blog library is useful operationally but underweights high-intent product queries such as bulk slime charms, slime charms supplier, resin charms wholesale, Halloween slime charms wholesale and Christmas slime charms wholesale.

## P0 — 48-hour actions
1. Complete GitHub Issue #18 for the accepted 9 SKUs only. SLM10012 is skipped.
2. Correct all product-count surfaces to the generated source of truth: 81 total / 33 Slime Charms / 9 Polymer Clay Slices / 20 Resin Charms / 19 Sequins & Confetti.
3. Keep one canonical URL per product and one sitemap entry per canonical URL.
4. Strengthen product-detail `<title>` formulas with transactional intent while staying natural and within practical SERP length. Examples by category:
   - Slime Charms: `<Product Name> Wholesale | <SKU> | HAIBUCRAFT`
   - Resin Charms: `<Product Name> Wholesale Resin Charms | <SKU> | HAIBUCRAFT`
   - Polymer Clay: `<Product Name> Wholesale Polymer Clay Slices | <SKU> | HAIBUCRAFT`
   - Sequins/Confetti: `<Product Name> Wholesale Craft Confetti | <SKU> | HAIBUCRAFT`
   Preserve unique meta descriptions and exact product identity.
5. Add a compact, visible internal-link block near the bottom of each category hub: related buying guide(s), custom/OEM page, quality-control page, and 4–6 representative product detail pages.
6. Add `ItemList` structured data to product category hubs using the visible product cards; do not fabricate offers/reviews/ratings.
7. Ensure every product detail page links back to its category and to 3 relevant products with descriptive anchor text, not only SKU codes.

## P1 — High-intent content cluster
Create original B2B guides tied directly to current catalog and buyer questions. Each page should be useful without filler, link to relevant category/products, and use real HAIBUCRAFT operational evidence where appropriate.

Priority pages:
1. `/blog/bulk-slime-charms-wholesale-buying-guide/`
   - target: bulk slime charms, slime charms wholesale, wholesale slime charms supplier
   - buyer intent: pack formats, mixed SKU planning, sample review, private label, documentation questions
2. `/blog/slime-charms-supplier-checklist/`
   - target: slime charms supplier, slime charm manufacturer/supplier comparison
   - use supplier language unless a manufacturer claim is explicitly supported for the exact scope
3. `/blog/resin-charms-wholesale-buying-guide/`
   - target: resin charms wholesale, flatback resin charms bulk, resin charms for slime wholesale
4. `/blog/halloween-slime-charms-wholesale-planning/`
   - target: Halloween slime charms wholesale, Halloween charms bulk
   - link current Halloween SKUs and sourcing timeline without promising fixed lead time
5. `/blog/christmas-slime-charms-wholesale-planning/`
   - target: Christmas slime charms wholesale, Christmas charms bulk
   - link current Christmas SKUs and sourcing timeline without promising fixed lead time

Content requirements:
- 1 clear primary query per page; avoid cannibalizing the main category URL.
- 900–1,600 useful English words where the topic supports it; no forced length.
- descriptive title/H1, concise answer-first opening, comparison/checklist/table where useful.
- 3–8 contextual internal links.
- Article structured data plus BreadcrumbList.
- canonical, index/follow, sitemap inclusion.
- no auto-generated filler or unsupported market statistics.

## P1 — Seasonal commercial landing pages
Because the current catalog already contains Halloween and Christmas slime charm SKUs, create two buyer-facing collection pages rather than relying only on JS/filter state:
- `/products/slime-charms-wholesale/halloween-slime-charms/`
- `/products/slime-charms-wholesale/christmas-slime-charms/`

Each page must:
- show only real matching catalog SKUs;
- contain 500–900 words of genuinely useful B2B selection/packing/customization guidance;
- use ItemList + BreadcrumbList;
- link back to the parent Slime Charms category;
- have unique canonical/title/meta;
- avoid duplicate boilerplate with the parent category;
- be included exactly once in sitemap.

## P1 — Internal-link architecture
Add contextual links:
- Home → Slime Charms / Resin Charms / Polymer Clay Slices using commercial anchors.
- Blog guides → relevant category + 2–5 products.
- Category hubs → 2–4 related guides.
- Product details → category + related theme guide where relevant.
- Seasonal product details → seasonal collection page.

## P2 — Authority / referral acquisition
No link farms, bulk directory spam or paid low-quality links.

Priority legitimate sources:
1. Ensure the company website URL is present wherever allowed on Alibaba supplier/company profiles and other owned B2B profiles.
2. Link the domain from all owned brand social profiles.
3. Create one shareable wholesale catalog/buyer resource that real customers and industry contacts can reference.
4. Outreach to craft/slime bloggers, wholesale sourcing guides, packaging/custom-craft resources and existing buyers for legitimate mentions where editorially relevant.
5. Reuse real factory/QC/document evidence as linkable resources, not as generic SEO text.

## GSC measurement plan
Before judging results, capture a baseline in Search Console:
- Performance → Search results → last 28 days and previous 28 days
- export Queries, Pages, Countries, Devices
- Indexing → Pages
- Sitemaps status

Track weekly:
- total impressions
- total clicks
- CTR
- average position
- number of queries with impressions
- number of landing pages receiving impressions
- branded vs non-branded query share
- top 20 queries moving into positions 8–30

Success signals over 2–6 weeks:
- more unique queries receiving impressions;
- category/blog/seasonal pages begin receiving non-branded impressions;
- product pages receive long-tail impressions beyond SKU searches;
- CTR improves after titles/meta are refined based on actual query data.

## Release process
Feature branch → automated SEO/test gates → Vercel Preview → desktop/mobile review → explicit owner approval → merge.
Do not merge SEO changes directly to Production without Preview approval.

# HAIBUCRAFT Product Batch — SLM10001 to SLM10011

Status: prepared for Codex implementation on feature branch.

GitHub tracking issue: #12

## Verified SKU scope

- SLM10001 — Mermaid & Ocean Slime Charm Mix
- SLM10002 — Pink Halloween Ghost & Fruit Slime Charm Mix
- SLM10003 — Christmas Santa & Tree Slime Charm Mix
- SLM10004 — Halloween Skeleton & Candy Corn Slime Charm Mix
- SLM10005 — Pastel Animal Slime Charm Mix
- SLM10008 — Pastel Flower Slime Charm Mix
- SLM10009 — Christmas Snowflake & Santa Slime Charm Mix
- SLM10010 — Red Halloween Ghost Slime Charm Mix
- SLM10011 — Purple Halloween Skull Slime Charm Mix

SLM10006 and SLM10007 are not present in the verified source batch and must not be invented.

## Product-page rules

Keep the existing HAIBUCRAFT B2B sourcing-page architecture. Each new SKU must have a dedicated canonical page under `/products/slime-charms-wholesale/` with SKU, gallery, Buyer Reference, quotation checklist, mixed-SKU/private-label sourcing language, related products, and Request Quote attribution.

Public image gallery: one main image plus up to five supporting images. Do not expose the electronic-scale/weighing photo in the public gallery.

Do not publish retail prices, Add to Cart, fake stock, fake urgency, consumer reviews, or unsupported compliance claims.

## Image rules

Preserve aspect ratio. Optimize for web delivery with sRGB and descriptive filenames. Prefer WebP for production. Include explicit image dimensions to avoid CLS. Use accurate, neutral ALT text with SKU.

## B2B language

Target wholesalers, importers, slime brands, craft retailers, DIY-kit programs, and private-label buyers. Use practical sourcing language: mixed-SKU ordering, packing options, MOQ confirmation, sample review, private-label/OEM packaging, lead-time confirmation, and destination-market documentation review.

## SEO

Every new product page requires unique title/meta description, index/follow, one absolute canonical on `https://www.haibucrafts.com`, Product JSON-LD with the exact SKU, BreadcrumbList JSON-LD, descriptive ALT text, and one sitemap entry.

## Responsive QA

Validate category + detail pages at 1440px, 1024px, and 390px. Mobile product gallery must load correctly, avoid horizontal overflow, and preserve CTA tap targets.

## Release rule

Feature branch and Vercel Preview only. Do not merge or deploy Production until manual approval. Run the repository's existing tests/build/release SEO checks and report the Preview URL plus screenshots.

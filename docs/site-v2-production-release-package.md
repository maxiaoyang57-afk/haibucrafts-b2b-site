# HAIBUCRAFT Site V2 Production Release Package

Date: 2026-08-06
Source branch: `codex/v2-takeover`
Production branch: `main`
Release state: **Published to production**

- Production deployment: `dpl_EoDgP3G65FTz3qPhTaPLhiZreSJg`
- Production commit: `9b310af70a2ddf9317046086cc439c7fe84c7653`
- Rollback tag: `pre-v2-production-20260806`

## Release objective

Move the approved V2 buyer journey from `/v2-preview/` to stable production routes without losing current security headers, inquiry capability, indexed URL value or verified product mappings.

## Production page package

The release contains 88 page files: homepage, product directory, four category
pages, 63 SKU-specific product detail pages, Custom Solutions, Manufacturing,
Quality Control, Certificates and Test Reports, About, Editorial Policy, Blog
directory, ten buying guides, Request Quote and 404.

The exact source-to-destination mapping is stored in:

`v2-preview/production-config/file-migration-map.json`

## Replace

These current production pages are intended to be replaced after approval:

- `/`
- `/products/`
- `/manufacturing/`
- `/quality-control/`
- `/certificates/`
- `/about/`
- `/blog/`
- `/404.html`

Replacement does not mean deleting the old content without review. The current production files should be retained in the rollback commit and compared before merge.

## Create

These clean production routes are intended to be created:

- `/products/slime-charms-wholesale/`
- `/products/polymer-clay-slices-wholesale/`
- `/products/resin-charms-for-slime/`
- `/products/sequins-glitter-confetti/`
- 63 SKU-specific product detail routes nested under the four product categories
- `/custom-solutions/`
- `/about/editorial-policy/`
- `/blog/how-to-prepare-a-wholesale-product-brief/`
- `/blog/sample-approval-checklist/`
- `/blog/packaging-quality-checkpoints/`
- `/blog/planning-a-mixed-sku-wholesale-order/`
- `/blog/private-label-packaging-brief/`
- `/blog/craft-product-document-checklist/`
- `/blog/pre-shipment-inspection-checklist/`
- `/blog/how-to-compare-wholesale-craft-suppliers/`
- `/blog/polymer-clay-slice-buying-guide/`
- `/blog/seasonal-craft-assortment-planning/`
- `/request-quote/`

## Retain and redirect

Existing `.html` product URLs must remain reachable through permanent redirects. Do not delete indexed paths without a redirect.

The release builder now generates a merged production-candidate `vercel.json`.
It preserves the existing Content Security Policy and other security headers,
enables the approved clean trailing-slash routes and applies the final redirect
destinations. The root configuration remains unchanged until production
approval.

## Shared asset migration

V2 scripts and styles should move into `/assets/v2/` and page references should be rewritten before release. Product images already under `/assets/images/products/` should remain in place and should not be duplicated.

The user-supplied factory archive has been transferred and visually reviewed.
Optimized WebP assets now cover the real facility exterior, production workshop,
warehouse aisles, SKU storage, resin workflow and polymer-clay workflow. The
legacy facility SVG is retained only for rollback comparison and is no longer
used by the V2 homepage or Manufacturing page.

The document library also contains the supplied amfori monitoring summary,
resin-charm EN 71 and CPC certificates and reports, and the product-specific
REACH report for polishing cloth model SC048. Public copy must preserve the
named legal entity, model and sample limitations shown in each document.

## Search and indexing controls

Before production release:

1. Replace root `sitemap.xml` with the approved production sitemap.
2. Replace root `robots.txt` with the approved rules.
3. Remove `noindex,nofollow` from indexable production pages.
4. Keep `/request-quote/` non-indexable.
5. Remove every `/v2-preview/` URL from canonical links, navigation, scripts, structured data and source tracking defaults.
6. Confirm all canonical URLs use `https://www.haibucrafts.com`.

All 86 pages with a visible navigation trail now include matching
`BreadcrumbList` structured data. The last breadcrumb item is checked against
the page canonical URL in the release-candidate audit.

## Inquiry activation gate

The production quote form must not be activated by changing only its button label. Activation requires:

- POST to `/api/inquiry`
- required-field validation matching the endpoint
- source, landing page, product code, product name, product image and referrer preservation
- attachment count/type/size validation
- success and failure states
- one authorized end-to-end test to `sale008@sola-craft.com`
- verification that the submitted email contains the correct product context

## Catalog blocks

The current production package contains 63 verified product cards and 63 linked
product detail pages. Each detail page includes a unique title and description,
Product structured data, SKU-specific inquiry context, buyer-confirmation
checkpoints and related products.

The buyer-resource library contains ten English-language guides with BlogPosting
structured data, operational checklists, related product and capability links,
and article-level quote attribution. The copy avoids unsupported MOQ, lead-time
and certification promises.

Each guide visibly identifies HAIBUCRAFT Buyer Resources as the organization
author, Product & Quality Coordination as the internal scope reviewer and the
latest review date. The Editorial Policy explains the evidence standard,
review boundary, update process and correction contact. Homepage WebSite and
Organization structured data identify the brand, public site, location and
sales contact without inventing a personal expert profile.

The shared navigation also provides a skip-to-content link, visible keyboard
focus treatment, explicit menu relationships, focus recovery when Escape closes
navigation and reduced-motion behavior. All 361 source images retain non-empty
alternative text and explicit width and height attributes.

- `MA022` is deliberately excluded because the legacy product-card description
  and available placeholder asset do not identify the same product.
- `RW2666` is deliberately excluded because it is absent from the authoritative
  HTML product-card inventory and the verified 63-SKU V2 catalog.
- No product count should be changed solely to reach a historical marketing total.

The controlled live inquiry test was accepted by `/api/inquiry` on August 6,
2026. Test ID `release-20260806-195657` returned HTTP 200 and provider message
ID `b13ef3a9-b044-4fcd-872a-4cee426cf6a3` for the approved recipient
`sale008@sola-craft.com`. Production email sending is approved; reference-image
uploads remain disabled for the initial release.

## Release order

1. Freeze product and image mappings.
2. Create a rollback tag or commit reference.
3. Materialize V2 pages into their production destinations.
4. Rewrite all V2 asset and internal paths.
5. Merge Vercel redirects while retaining security headers.
6. Install sitemap and robots files.
7. Run local production-path audit.
8. Deploy a final preview from the release candidate branch.
9. Test desktop, mobile, product filters, quote prefill, redirects and 404.
10. Obtain explicit production approval.
11. Merge to `main` and monitor Vercel deployment.
12. Check Search Console, sitemap fetch, indexing and 404 reports after release.

## Rollback trigger

Rollback should be immediate if the production deployment shows broken navigation, missing product images, incorrect SKU mappings, inquiry failure, widespread 404 responses, redirect loops, blocked CSS/JavaScript from CSP, or accidental indexing of preview paths.

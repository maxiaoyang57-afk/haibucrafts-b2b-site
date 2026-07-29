# HAIBUCRAFT Site V2 Production Release Package

Date: 2026-07-29
Source branch: `site-v2-integrated-preview`
Production branch: `main`
Release state: **Not approved / not published**

## Release objective

Move the approved V2 buyer journey from `/v2-preview/` to stable production routes without losing current security headers, inquiry capability, indexed URL value or verified product mappings.

## Production page package

The release contains 16 page files: homepage, product directory, four category pages, Custom Solutions, Manufacturing, Quality Control, About, Blog directory, three buying guides, Request Quote and 404.

The exact source-to-destination mapping is stored in:

`v2-preview/production-config/file-migration-map.json`

## Replace

These current production pages are intended to be replaced after approval:

- `/`
- `/products/`
- `/manufacturing/`
- `/quality-control/`
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
- `/custom-solutions/`
- `/blog/how-to-prepare-a-wholesale-product-brief/`
- `/blog/sample-approval-checklist/`
- `/blog/packaging-quality-checkpoints/`
- `/request-quote/`

## Retain and redirect

Existing `.html` product URLs must remain reachable through permanent redirects. Do not delete indexed paths without a redirect.

The existing security-header section in root `vercel.json` must be retained. The production redirect draft is a merge source, not a complete replacement for the root configuration.

## Shared asset migration

V2 scripts and styles should move into `/assets/v2/` and page references should be rewritten before release. Product images already under `/assets/images/products/` should remain in place and should not be duplicated.

The current facility exterior SVG may move to `/assets/images/facility/facility-exterior.svg`. Warehouse, SKU-storage and packing-workshop photographs remain blocked until their repository transfer and final visual verification are complete.

## Search and indexing controls

Before production release:

1. Replace root `sitemap.xml` with the approved production sitemap.
2. Replace root `robots.txt` with the approved rules.
3. Remove `noindex,nofollow` from indexable production pages.
4. Keep `/request-quote/` non-indexable.
5. Remove every `/v2-preview/` URL from canonical links, navigation, scripts, structured data and source tracking defaults.
6. Confirm all canonical URLs use `https://www.haibucrafts.com`.

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

The current production package contains 63 verified product cards.

- `MA022` remains unpublished until its image is verified.
- `RW2666` requires an explicit decision because the workbook and current resin page differ.
- No product count should be changed solely to reach a historical marketing total.

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

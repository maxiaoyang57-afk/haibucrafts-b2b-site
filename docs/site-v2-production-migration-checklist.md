# HAIBUCRAFT Site V2 Production Migration Checklist

Branch under review: `codex/v2-takeover`
Production branch: `main`
Production domain: `https://www.haibucrafts.com/`

## Hard release gates

- [ ] User approves the complete V2 preview.
- [ ] Product counts and all SKU/image mappings are frozen.
- [ ] `MA022` image and publication status are resolved.
- [ ] `RW2666` workbook-versus-site discrepancy is resolved.
- [x] Facility and production images are transferred, optimized and visually reviewed.
- [ ] Quote form fields, attachment limits and email output are approved.
- [ ] `/api/inquiry` is tested with a controlled live submission.
- [ ] No unsupported factory ownership, capacity, certification, MOQ, lead-time, customer or testing claims remain.

## Functional QA

- [x] Run `node scripts/audit-v2-links.mjs` and require exit code 0.
- [x] Verify all 63 product cards link to unique SKU-specific detail pages.
- [x] Verify all 63 detail pages include Product structured data and prefilled inquiry context.
- [x] Verify all 10 buyer guides use the shared article layout and link from the Blog directory.
- [x] Verify all 10 buyer guides include BlogPosting structured data, internal links and article-level quote attribution.
- [x] Verify all 10 buyer guides show organization authorship, internal scope reviewer and review date.
- [x] Verify the Editorial Policy explains evidence, review boundaries, updates and corrections.
- [ ] Verify desktop and mobile navigation, dropdown, Escape-key close and active navigation state.
- [ ] Verify all 63 product-card images load.
- [ ] Verify search and category filters on all four product pages.
- [ ] Verify every product `Get Quote` link pre-fills category, SKU and product name.
- [ ] Verify all footer, blog, capability and related-content links.
- [ ] Verify 404 behavior after final production routing is configured.
- [ ] Verify keyboard focus order and visible focus states.
- [x] Add skip-to-content navigation, visible focus styles and Escape-key focus recovery.
- [x] Respect reduced-motion preferences for smooth scrolling and transitions.
- [x] Confirm all 361 source images have non-empty alt text and explicit dimensions.

## SEO and indexing

- [x] Generate concise, unique production titles and remove preview-only wording in the release candidate.
- [ ] Remove page-level `noindex,nofollow` only after final approval.
- [ ] Remove preview-specific `X-Robots-Tag: noindex` configuration for production routes.
- [x] Generate production `sitemap.xml` using final URLs.
- [x] Update the production-candidate `robots.txt` and reference the sitemap.
- [x] Add canonical URLs using `https://www.haibucrafts.com/`.
- [x] Confirm one H1, unique title and useful meta description per indexable page.
- [x] Add homepage WebSite and Organization structured data.
- [x] Match visible article authorship with BlogPosting author and reviewer data.
- [x] Add BreadcrumbList data to all 86 pages with visible breadcrumb navigation.
- [ ] Submit the production sitemap in Google Search Console after deployment.

## Inquiry activation

- [ ] Change the V2 form from preview validation to POST `/api/inquiry`.
- [ ] Enable up to four image uploads only after API testing.
- [ ] Preserve `attribution_source`, `first_landing_page`, `first_referrer`, `article`, `product_image` and `inquiry_page`.
- [ ] Confirm recipient email is `sale008@sola-craft.com` or the final approved sales address.
- [ ] Test success, validation-error, oversized-image, unsupported-file and server-error states.
- [ ] Confirm spam controls and honeypot behavior.

## Production migration

- [ ] Create a final backup tag or release branch from current `main`.
- [ ] Compare `main` against `codex/v2-takeover` before merging.
- [ ] Decide whether V2 replaces root routes directly or is migrated page by page.
- [ ] Add redirects from old URLs to final production URLs where slugs change.
- [x] Generate a merged production-candidate `vercel.json` while preserving security headers.
- [ ] Preserve analytics, Search Console verification and Vercel anonymous analytics.
- [ ] Deploy to a production-candidate preview first.
- [ ] Obtain explicit user approval before merging or promoting to production.
- [ ] Monitor 404s, inquiry errors, Core Web Vitals and indexing after release.

## Rollback

- [ ] Keep the pre-V2 production commit and deployment ID recorded.
- [ ] Confirm the Vercel rollback candidate before release.
- [ ] Roll back immediately if inquiry submission, navigation, product images or primary routes fail.

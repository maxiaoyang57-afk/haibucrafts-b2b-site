# HAIBU SEO and inquiry consistency repair

- Repository: `maxiaoyang57-afk/haibucrafts-b2b-site`
- Baseline: `474e310f0821454860e43fe677203be254de97ec` (PR #61)
- Branch: `pro/haibu-seo-optimization-20260917`
- Release status: Preview review required; this task does not approve Production.

## Problems and changes

1. A baseline release build differed from the checked-in site in four files: home, About, shared components and the inquiry browser script. The source still carried the former public email and omitted the latest honeypot-autofill and request-reference fixes. Synchronized the source with PR #61 and updated remaining editorial/privacy contact links to `sales@haibucrafts.com`.
2. Added a final deterministic identity build step. All 169 routed pages identify the same HAIBU organization; nested HAIBU publisher/author/reviewer objects use the existing approved logo. No new certification, price, stock or business-address claims were added.
3. Article sitemap dates now match each article's recorded revision date instead of falling back to a generic August date.
4. Inquiry browser code requires explicit API acceptance before clearing buyer input. A malformed 200 response can no longer appear successful.
5. Replaced the inquiry API's blanket `*.vercel.app` origin allowance with the exact deployment and branch hostnames supplied by Vercel. Public HAIBU origins and primary/backup email configuration remain intact. This is origin validation, not comprehensive anti-spam protection.
6. Enabled the existing materialized-output consistency check on PRs. Previously its `refs/heads/main` condition meant it was skipped for PRs targeting main.
7. Corrected README catalog, homepage, upload and backup-delivery descriptions and documented the source/build workflow.

## Verification

- 90/90 Node tests pass, including new full-site identity/date tests, origin rejection cases and malformed/successful inquiry-response cases. Email delivery tests use a mocked provider.
- Release audit: 170 HTML pages, 169 canonical routes, 168 sitemap URLs, 126 image entries, 94 permanent one-hop redirect definitions.
- 126 product catalog records are byte-for-byte unchanged; no product images, SKU mappings, routes or galleries changed.
- 231 release files match checked-in output byte-for-byte.
- A second full source build, release build and materialization changes zero tracked files.
- Catalog identity, full catalog, runtime routes, content and whitespace checks pass.
- Existing enforcing CSP is retained. Public homepage and inquiry-page browser checks showed no site-script/CSP error; extension errors were excluded.

## External checks and release requirements

- Use the accessible GSC URL-prefix property `https://www.haibucrafts.com/`. The domain property returned insufficient permission in this session.
- Homepage, slime category and resin category passed live URL Inspection as submitted and indexed. This is a sample, not a claim that every product is indexed.
- The proper `sitemap.xml` submission had zero errors. A separate entry using the homepage URL had one error and needs removal in GSC; the available connector has no sitemap mutation action. Do not remove the proper XML sitemap.
- No real inquiry email was sent by this task; receipt, mailbox placement and Production environment values were not verified. A mocked test does not establish inbox delivery.
- Existing strict CSP and Vercel settings were not changed. Preview inquiry checks require the standard Vercel system environment values to be exposed.
- Product SEO titles/descriptions were checked for uniqueness and length; the existing descriptive titles were retained.
- Merge only the accepted Preview commit after explicit approval, then verify Production and actual receipt separately.

## Reference documentation

- https://developers.google.com/search/docs/appearance/structured-data/organization
- https://developers.google.com/search/docs/appearance/ai-features
- https://vercel.com/docs/environment-variables/system-environment-variables

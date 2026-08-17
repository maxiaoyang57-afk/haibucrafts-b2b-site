# Post-deploy QA — PR #15 / 9 new Slime Charm products

## Scope
Verify the live Production site after merge commit `f1bc47a48248802ef74495bb53ef940d981dd799`.

Do not change code or redeploy unless a real Production defect is proven and reported first.

## URLs to verify

Category:
- https://www.haibucrafts.com/products/slime-charms-wholesale/

New product pages:
- https://www.haibucrafts.com/products/slime-charms-wholesale/slm10001-mermaid-ocean-slime-charm-mix/
- https://www.haibucrafts.com/products/slime-charms-wholesale/slm10002-pink-halloween-ghost-fruit-slime-charm-mix/
- https://www.haibucrafts.com/products/slime-charms-wholesale/slm10003-christmas-santa-tree-slime-charm-mix/
- https://www.haibucrafts.com/products/slime-charms-wholesale/slm10004-halloween-skeleton-candy-corn-slime-charm-mix/
- https://www.haibucrafts.com/products/slime-charms-wholesale/slm10005-pastel-animal-slime-charm-mix/
- https://www.haibucrafts.com/products/slime-charms-wholesale/slm10008-pastel-flower-slime-charm-mix/
- https://www.haibucrafts.com/products/slime-charms-wholesale/slm10009-christmas-snowflake-santa-slime-charm-mix/
- https://www.haibucrafts.com/products/slime-charms-wholesale/slm10010-red-halloween-ghost-slime-charm-mix/
- https://www.haibucrafts.com/products/slime-charms-wholesale/slm10011-purple-halloween-skull-slime-charm-mix/

Infrastructure:
- https://www.haibucrafts.com/sitemap.xml
- https://www.haibucrafts.com/robots.txt

## P0 live Production checks
For every new product page confirm:
1. HTTP 200
2. correct SKU and title
3. main image loads
4. gallery images load and thumbnail switching works
5. no electronic-scale/weighing image in public gallery
6. no horizontal overflow at 390px
7. Request Quote/Get Quote carries correct SKU/product name/category/landing_page
8. canonical is absolute and matches the clean Production URL
9. robots is `index,follow`
10. Product JSON-LD contains exact SKU
11. BreadcrumbList JSON-LD is valid
12. no `/v2-preview/` residue
13. no broken internal links

## P0 category checks
- all 9 new cards appear exactly once
- displayed product count matches actual card count
- search/filter still works
- SKU/title/image pairing is correct
- View Details and Get Quote links are correct
- desktop and 390px mobile layout have no overflow or clipped CTAs

## P0 sitemap checks
- all 9 new canonical URLs are present exactly once
- sitemap remains valid XML
- no Preview URLs, query URLs, redirect URLs or noindex URLs are added

## P1 post-deploy health checks
- Vercel Production deployment is Ready for merge commit `f1bc47a48248802ef74495bb53ef940d981dd799`
- no new runtime 4xx/5xx pattern attributable to these product pages
- existing category/product routes remain healthy
- no regression to favicon, header, footer, WhatsApp or Request Quote behavior

## Mobile/browser QA
Minimum widths:
- 1440px desktop
- 1024px tablet
- 390px mobile

For visual spot-checks, inspect at least SLM10001, SLM10002, SLM10009 and SLM10011 in addition to automated checks across all 9 URLs.

## GSC follow-up
After live QA passes:
- confirm sitemap remains successfully readable in Google Search Console
- do not manually request indexing for all 9 pages at once unless needed
- prioritize URL Inspection/request indexing for category page plus 2–3 representative high-value new product pages
- monitor discovery/indexing over the next 7–14 days

## Required report
Return:
1. Production deployment status + commit SHA
2. URL-by-URL HTTP result for all 9 products
3. image/gallery result
4. mobile result
5. quote attribution result
6. canonical/robots/structured-data result
7. category product-count result
8. sitemap count/result
9. runtime/error findings
10. exact defects, if any
11. whether any code change is required
12. explicit statement: `Production post-deploy QA PASS` or `HOLD — defect found`

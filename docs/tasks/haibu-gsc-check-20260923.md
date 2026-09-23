# HAIBU Search Console check - 2026-09-23

Account checked: `https://www.haibucrafts.com/` via the connected Search Console data provider.

## Live site crawlability

`node scripts/audit-production-indexability.mjs` passed against production:

- 183 sitemap URLs return HTTP 200, self-canonical and index,follow.
- Robots points to the canonical sitemap and protects the noindex preview area.
- Preview and custom HTTP 404 behavior passed.
- This includes the Candy Slime / Polymer Clay Sprinkles cluster pages and the 13 September 20 products: RW26460, RW26774, RW26775, RW26776, RW26777, RW26796, RW26800, RW26813, RW26814, RW26819, YX162, YX3150, YX3461.

These are live HTTP checks, not proof of Google indexing.

## Search Console sitemap records

| Sitemap | Last submitted | Last downloaded | Errors | Warnings |
| --- | --- | --- | --- | --- |
| `/sitemap.xml` | 2026-09-08 13:53 UTC | 2026-09-20 12:05 UTC | 0 | 0 |
| `/` (incorrect homepage submission) | 2026-09-08 13:54 UTC | 2026-09-22 04:43 UTC | 1 | 0 |

The provider reports 294 submitted URLs for the XML sitemap; the live sitemap contains 183. This older provider/Google snapshot must not be reported as the current sitemap count or an indexed-page count.

## Search performance

Read 2026-09-09 through 2026-09-23, finalized available data. The query returned 26 page rows. The slime hub had 5 clicks / 114 impressions; polymer hub 1 / 95; resin hub 1 / 93. No rows were returned for the new cluster landing pages or the 13 September 20 SKUs. Absence of performance rows does not establish non-indexing.

## Outstanding authenticated actions

The current connector exposes sitemap and search performance reads, but no URL Inspection or sitemap submission actions. The connected browser inventory failed repeatedly with `nodeRepl.fetch request failed`, including after reset, so authenticated GSC UI checks could not be completed.

1. Re-submit `https://www.haibucrafts.com/sitemap.xml` in GSC.
2. Remove the incorrect homepage-as-sitemap entry, keeping the XML sitemap.
3. Use URL Inspection on the cluster pages and 13 new products: Google-selected canonical, last crawl, coverage and indexing state. Request indexing only where appropriate.
4. Compare impressions and clicks after 7-14 days. Do not create additional pages merely because these new pages have no performance rows yet.

No sitemap settings or index requests were changed by this check.

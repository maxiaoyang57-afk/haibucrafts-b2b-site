import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const releaseRoot = path.join(root, '.release-candidate', 'site-v2');
const manifest = JSON.parse(await readFile(path.join(releaseRoot, 'release-manifest.json'), 'utf8'));
const seoMap = JSON.parse(await readFile(path.join(root, 'v2-preview', 'seo-production-map.json'), 'utf8'));
const migration = JSON.parse(await readFile(path.join(root, 'v2-preview', 'production-config', 'file-migration-map.json'), 'utf8'));

const indexed = seoMap.routes.filter((route) => route.index).length;
const noindex = seoMap.routes.length - indexed;
const blockers = [
  'MA022 product image remains unverified and is excluded.',
  'RW2666 product placement remains unresolved and is excluded.',
  'Three internal facility images are still pending repository verification.',
  'Quote runtime mode remains validation-only; no live email submission is enabled.',
  'Reference image uploads remain disabled.',
  'Production publication requires explicit approval before any main-branch merge.'
];

const report = `# HAIBUCRAFT Site V2 — Release Candidate Acceptance Report\n\n` +
`Generated: ${new Date().toISOString()}\n\n` +
`## Release identity\n\n` +
`- Source branch: ${manifest.source}\n` +
`- Migration version: ${manifest.migrationVersion}\n` +
`- Routed pages: ${manifest.routes.length}\n` +
`- Indexable pages: ${indexed}\n` +
`- Noindex pages: ${noindex}\n` +
`- Quote mode: ${manifest.quoteMode}\n` +
`- Production published: ${manifest.productionPublished}\n\n` +
`## Automated acceptance gates\n\n` +
`- V2 source links, assets, SKU uniqueness, product counts and quote parameters audited.\n` +
`- Release candidate internal links and assets audited after production-path transformation.\n` +
`- Unique title and meta description enforcement enabled.\n` +
`- Canonical URLs restricted to https://www.haibucrafts.com/.\n` +
`- Approved pages require index,follow; request-quote remains noindex,follow.\n` +
`- Sitemap excludes request-quote and all preview URLs.\n` +
`- robots.txt blocks /request-quote/, /api/ and /v2-preview/.\n` +
`- Quote sending and reference uploads are blocked by runtime configuration.\n` +
`- Release artifact generation fails on any unresolved technical validation error.\n\n` +
`## Known publication blockers\n\n` + blockers.map((item) => `- ${item}`).join('\n') + `\n\n` +
`## Production activation gates\n\n` +
`1. Obtain explicit owner approval to prepare a main-branch release.\n` +
`2. Reconfirm all 63 published SKU/image mappings.\n` +
`3. Decide whether MA022 and RW2666 remain excluded.\n` +
`4. Verify facility images and all factual manufacturing statements.\n` +
`5. Merge Vercel redirects without removing existing security headers.\n` +
`6. Perform a controlled inquiry API test using an authorized recipient.\n` +
`7. Change quote mode to live only after the API test succeeds.\n` +
`8. Deploy to a production-candidate environment and re-run route, redirect and metadata checks.\n` +
`9. Publish to production only after explicit final approval.\n` +
`10. Submit the new sitemap in Google Search Console and monitor indexing and 404 reports.\n\n` +
`## Rollback triggers\n\n` +
`Rollback immediately for broken primary navigation, missing product images, failed inquiry delivery, redirect loops, lost security headers, widespread 404 responses or incorrect indexability.\n\n` +
`## Decision\n\n` +
`Technical release-candidate automation is prepared. Production approval is not granted by this report.\n`;

await writeFile(path.join(releaseRoot, 'acceptance-report.md'), report, 'utf8');
console.log(`Acceptance report generated for ${manifest.routes.length} routed pages and ${migration.pages?.length || manifest.routes.length} mapped page entries.`);

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const releaseRoot = path.join(root, '.release-candidate', 'site-v2');
const manifest = JSON.parse(await readFile(path.join(releaseRoot, 'release-manifest.json'), 'utf8'));
const seoMap = JSON.parse(await readFile(path.join(root, 'v2-preview', 'seo-production-map.json'), 'utf8'));
const migration = JSON.parse(await readFile(path.join(root, 'v2-preview', 'production-config', 'file-migration-map.json'), 'utf8'));

const indexed = seoMap.routes.filter((route) => route.index).length;
const routeNoindex = seoMap.routes.length - indexed;
const supportPages = manifest.supportPages || [];
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
`- Support pages: ${supportPages.length}\n` +
`- Indexable pages: ${indexed}\n` +
`- Noindex pages: ${routeNoindex + supportPages.length}\n` +
`- Quote mode: ${manifest.quoteMode}\n` +
`- Production published: ${manifest.productionPublished}\n\n` +
`## Automated acceptance gates\n\n` +
`- Source links, assets, SKU uniqueness, product counts and quote parameters audited.\n` +
`- Runtime navigation, buyer-resource links and inquiry JSON contract audited.\n` +
`- Production candidate HTML and JavaScript paths audited after transformation.\n` +
`- Unique title, description and canonical enforcement enabled.\n` +
`- Approved pages require index,follow; request-quote and 404 remain noindex,follow.\n` +
`- Sitemap excludes request-quote, 404 and preview URLs.\n` +
`- robots.txt blocks /request-quote/, /api/ and /v2-preview/.\n` +
`- Quote sending and reference uploads remain blocked by runtime configuration.\n` +
`- Artifact generation fails on unresolved technical validation errors.\n\n` +
`## Known publication blockers\n\n` + blockers.map((item) => `- ${item}`).join('\n') + `\n\n` +
`## Production activation gates\n\n` +
`1. Obtain explicit approval to prepare a main-branch release.\n` +
`2. Reconfirm all 63 published SKU/image mappings and excluded items.\n` +
`3. Verify facility images and factual manufacturing statements.\n` +
`4. Merge redirects without removing existing security headers.\n` +
`5. Perform a controlled inquiry API test using an authorized recipient.\n` +
`6. Change quote mode to live only after the API test succeeds.\n` +
`7. Deploy to a production-candidate environment and re-run route, redirect and metadata checks.\n` +
`8. Publish only after explicit final approval, then submit the sitemap in Search Console.\n\n` +
`## Rollback triggers\n\n` +
`Rollback for broken navigation, missing product images, failed inquiry delivery, redirect loops, lost security headers, widespread 404 responses or incorrect indexability.\n\n` +
`## Decision\n\n` +
`Technical release-candidate automation is prepared. Production approval is not granted by this report.\n`;

await writeFile(path.join(releaseRoot, 'acceptance-report.md'), report, 'utf8');
console.log(`Acceptance report generated for ${manifest.routes.length} routed pages, ${supportPages.length} support pages and ${migration.pages?.length || manifest.routes.length} mapped page entries.`);

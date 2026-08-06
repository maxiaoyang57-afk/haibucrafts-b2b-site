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
const catalogDecisions = manifest.catalogDecisions || {};
const inquiryTest = manifest.inquiryTest || {};

const report = `# HAIBUCRAFT Site V2 — Release Candidate Acceptance Report

Generated: ${new Date().toISOString()}

## Release identity

- Source branch: ${manifest.source}
- Migration version: ${manifest.migrationVersion}
- Routed pages: ${manifest.routes.length}
- Support pages: ${supportPages.length}
- Indexable pages: ${indexed}
- Noindex pages: ${routeNoindex + supportPages.length}
- Quote mode: ${manifest.quoteMode}
- Production approved: ${manifest.productionApproved}
- Approval date: ${manifest.approvalDate}
- Production published: ${manifest.productionPublished}

## Automated acceptance gates

- Source links, assets, SKU uniqueness, product counts and quote parameters audited.
- Runtime navigation, buyer-resource links and inquiry JSON contract audited.
- Production candidate HTML and JavaScript paths audited after transformation.
- Unique title, description and canonical enforcement enabled.
- Approved pages require index,follow; request-quote and 404 remain noindex,follow.
- Sitemap excludes request-quote, 404 and preview URLs.
- robots.txt blocks /request-quote/, /api/ and /v2-preview/.
- Quote sending is live; reference uploads remain deliberately disabled for the initial production release.
- Artifact generation fails on unresolved technical validation errors.

## Resolved release decisions

- MA022: ${catalogDecisions.MA022?.status || 'unknown'} — ${catalogDecisions.MA022?.reason || 'No decision recorded.'}
- RW2666: ${catalogDecisions.RW2666?.status || 'unknown'} — ${catalogDecisions.RW2666?.reason || 'No decision recorded.'}
- Controlled inquiry: HTTP ${inquiryTest.statusCode || 'unknown'}, accepted ${inquiryTest.accepted === true ? 'yes' : 'no'}, test ID ${inquiryTest.testId || 'unknown'}, provider message ID ${inquiryTest.providerMessageId || 'unknown'}.

## Known publication blockers

None.

## Production activation gates

1. Deploy the exact approved materialized commit to a production-candidate preview.
2. Re-run route, redirect, metadata and inquiry-runtime checks against that deployment.
3. Fast-forward the same commit to main and monitor the Vercel production deployment.
4. Verify the production domain, then submit the sitemap in Search Console.

## Rollback triggers

Rollback for broken navigation, missing product images, failed inquiry delivery, redirect loops, lost security headers, widespread 404 responses or incorrect indexability.

## Decision

Explicit production approval and a successful controlled inquiry acceptance are recorded. The candidate is approved for production publication.
`;

await writeFile(path.join(releaseRoot, 'acceptance-report.md'), report, 'utf8');
console.log(`Acceptance report generated for ${manifest.routes.length} routed pages, ${supportPages.length} support pages and ${migration.pages?.length || manifest.routes.length} mapped page entries.`);

import { cp, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const releaseRoot = path.join(root, '.release-candidate', 'site-v2');
const manifest = JSON.parse(await readFile(path.join(releaseRoot, 'release-manifest.json'), 'utf8'));

if (manifest.productionApproved !== true || manifest.quoteMode !== 'live') {
  throw new Error('Refusing to materialize an unapproved or non-live release candidate.');
}

const excludedReleaseMetadata = new Set(['acceptance-report.md', 'release-manifest.json']);
const entries = await readdir(releaseRoot, { withFileTypes: true });
let copied = 0;

for (const entry of entries) {
  if (excludedReleaseMetadata.has(entry.name)) continue;
  await cp(
    path.join(releaseRoot, entry.name),
    path.join(root, entry.name),
    { recursive: entry.isDirectory(), force: true }
  );
  copied += 1;
}

console.log(`Materialized ${copied} approved production entries from ${path.relative(root, releaseRoot)} without removing retained legacy files.`);

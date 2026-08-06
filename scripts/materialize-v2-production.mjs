import { cp, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const releaseRoot = path.join(root, '.release-candidate', 'site-v2');
const manifest = JSON.parse(await readFile(path.join(releaseRoot, 'release-manifest.json'), 'utf8'));

if (manifest.productionApproved !== true || manifest.quoteMode !== 'live') {
  throw new Error('Refusing to materialize an unapproved or non-live release candidate.');
}

const excludedReleaseMetadata = new Set(['acceptance-report.md', 'release-manifest.json']);
const cleanUrlCollisions = [
  'products/polymer-clay-slices-wholesale.html',
  'products/resin-charms-for-slime.html',
  'products/sequins-glitter-confetti.html',
  'products/slime-charms-wholesale.html'
];
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

for (const relative of cleanUrlCollisions) {
  await rm(path.join(root, relative), { force: true });
}

console.log(`Materialized ${copied} approved production entries from ${path.relative(root, releaseRoot)} and removed ${cleanUrlCollisions.length} legacy files that shadow clean production routes.`);

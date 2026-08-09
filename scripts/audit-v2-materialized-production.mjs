import { access, readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const releaseRoot = path.join(root, '.release-candidate', 'site-v2');
const excludedReleaseMetadata = new Set(['acceptance-report.md', 'release-manifest.json']);
const cleanUrlCollisions = [
  'products/polymer-clay-slices-wholesale.html',
  'products/resin-charms-for-slime.html',
  'products/sequins-glitter-confetti.html',
  'products/slime-charms-wholesale.html'
];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

if (!await exists(releaseRoot)) {
  throw new Error('Release Candidate is missing. Run npm run build:v2-release before this audit.');
}

const releaseFiles = (await walk(releaseRoot))
  .filter((file) => !excludedReleaseMetadata.has(path.basename(file)))
  .sort();
const errors = [];

for (const releaseFile of releaseFiles) {
  const relative = path.relative(releaseRoot, releaseFile);
  const productionFile = path.join(root, relative);
  if (!await exists(productionFile)) {
    errors.push(`${relative}: missing from checked-in Production`);
    continue;
  }

  const [releaseContent, productionContent] = await Promise.all([
    readFile(releaseFile),
    readFile(productionFile)
  ]);
  if (!releaseContent.equals(productionContent)) {
    errors.push(`${relative}: content differs (release ${sha256(releaseContent)}, production ${sha256(productionContent)})`);
  }
}

for (const relative of cleanUrlCollisions) {
  if (await exists(path.join(root, relative))) {
    errors.push(`${relative}: clean-URL collision file must remain absent`);
  }
}

if (errors.length) {
  console.error(`Materialized production audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Materialized production audit passed: ${releaseFiles.length} Release Candidate files match checked-in Production byte-for-byte; ${cleanUrlCollisions.length} clean-URL collision files are absent.`);
}

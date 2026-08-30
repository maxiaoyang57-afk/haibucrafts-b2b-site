import { readFile, writeFile, readdir, rm, rename } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const config = JSON.parse(await readFile(path.join(root, 'scripts/data/issue-35-polymer-sku-migration.json'), 'utf8'));
const categoryPreview = path.join(root, 'v2-preview/products/polymer-clay-slices');
const categoryProduction = path.join(root, 'products/polymer-clay-slices-wholesale');
const mapping = config.mapping;
const retired = config.retired.sku;
const allAffected = [...Object.keys(mapping), retired];

const readCards = (html) => [...html.matchAll(/<article class="product-card-v2"[\s\S]*?<\/article>/g)].map((match) => match[0]);
const cardSku = (card) => card.match(/<span class="sku-badge">([^<]+)<\/span>/)?.[1]?.trim() || '';
const replaceSku = (value, oldSku, newSku) => value.replace(new RegExp(oldSku, 'gi'), newSku);

let html = await readFile(path.join(categoryPreview, 'index.html'), 'utf8');
const cards = readCards(html);
const before = cards.map(cardSku);
const finalSkus = new Set([...before]);
if (before.length === config.expectedActiveCount && finalSkus.has('YX038') && !finalSkus.has(retired) || (before.length === config.expectedActiveCount && !before.some((sku) => sku === retired))) {
  console.log('Issue #35 migration already applied; no changes needed.');
  process.exit(0);
}
if (before.length !== 17 || new Set(before).size !== 17) throw new Error(`Expected 17 unique Polymer cards before migration, got ${before.length}`);
for (const sku of allAffected) if (!before.includes(sku)) throw new Error(`Missing source SKU ${sku}`);

const transformedCards = cards.flatMap((card) => {
  const sku = cardSku(card);
  if (sku === retired) {
    if (!card.includes(config.retired.title.replace('&', '&amp;'))) throw new Error('Retired YX038 card title does not match the approved identity');
    return [];
  }
  const nextSku = mapping[sku] || sku;
  if (nextSku === sku) return [card];
  const marker = `__ISSUE35_${sku}__`;
  return [replaceSku(card, sku, marker).replaceAll(marker, nextSku)];
});
const firstCard = html.indexOf('<article class="product-card-v2"');
const lastCardEnd = html.lastIndexOf('</article>') + '</article>'.length;
if (firstCard < 0 || lastCardEnd < firstCard) throw new Error('Could not locate Polymer card grid');
html = `${html.slice(0, firstCard)}${transformedCards.join('')}${html.slice(lastCardEnd)}`;
html = html.replace(/(<strong data-product-count>)\d+ products(<\/strong>)/, `$1${config.expectedActiveCount} products$2`);
await writeFile(path.join(categoryPreview, 'index.html'), html, 'utf8');

const renameDirectories = async (directory, production = false) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const affectedDirs = new Map();
  for (const oldSku of allAffected) {
    const dir = dirs.find((name) => name.toLowerCase().startsWith(`${oldSku.toLowerCase()}-`));
    if (!dir) throw new Error(`Missing ${production ? 'production' : 'preview'} detail directory for ${oldSku}`);
    affectedDirs.set(oldSku, dir);
  }
  const retiredDir = affectedDirs.get(retired);
  await rm(path.join(directory, retiredDir), { recursive: true, force: true });
  const staged = [];
  for (const [oldSku, dir] of affectedDirs) {
    if (oldSku === retired) continue;
    const nextSku = mapping[oldSku];
    const nextDir = `${nextSku.toLowerCase()}-${dir.slice(oldSku.length + 1)}`;
    const tempDir = `.issue35-${oldSku.toLowerCase()}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    await rename(path.join(directory, dir), path.join(directory, tempDir));
    staged.push({ tempDir, nextDir });
  }
  for (const { tempDir, nextDir } of staged) await rename(path.join(directory, tempDir), path.join(directory, nextDir));
};

await renameDirectories(categoryPreview);
await renameDirectories(categoryProduction, true);

const redirectPaths = [];
for (const [oldSku, nextSku] of Object.entries(mapping)) {
  const sourceDir = (await readdir(categoryPreview, { withFileTypes: true }))
    .map((entry) => entry.name)
    .find((name) => name.toLowerCase().startsWith(`${nextSku.toLowerCase()}-`));
  if (!sourceDir) throw new Error(`Cannot resolve destination slug for ${oldSku} -> ${nextSku}`);
  const suffix = sourceDir.slice(nextSku.length + 1);
  redirectPaths.push({
    source: `/products/polymer-clay-slices-wholesale/${oldSku.toLowerCase()}-${suffix}/`,
    destination: `/products/polymer-clay-slices-wholesale/${sourceDir}/`,
    permanent: true
  });
}
const retiredDirName = `${retired.toLowerCase()}-pink-and-blue-decorative-slice-mix`;
redirectPaths.push({
  source: `/products/polymer-clay-slices-wholesale/${retiredDirName}/`,
  destination: config.retired.redirectTo,
  permanent: true
});

for (const file of ['vercel.json', 'v2-preview/production-config/vercel-redirects.json']) {
  const filePath = path.join(root, file);
  const json = JSON.parse(await readFile(filePath, 'utf8'));
  const existingSources = new Set(json.redirects.map((item) => item.source));
  for (const redirect of redirectPaths) {
    if (!existingSources.has(redirect.source)) json.redirects.push(redirect);
  }
  await writeFile(filePath, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
}

console.log(`Issue #35 migrated ${Object.keys(mapping).length} retained Polymer SKUs, retired ${retired}, added ${redirectPaths.length} redirects.`);

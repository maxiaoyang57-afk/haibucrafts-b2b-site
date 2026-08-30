import { readFile, writeFile, readdir, rename } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const config = JSON.parse(await readFile(path.join(root, 'scripts/data/issue-37-sequins-sku-migration.json'), 'utf8'));
const previewCategory = path.join(root, 'v2-preview/products/sequins-glitter-confetti');
const productionCategory = path.join(root, 'products/sequins-glitter-confetti');
const mapping = config.mapping;
const sourceSkus = Object.keys(mapping);

const cardsOf = (html) => [...html.matchAll(/<article class="product-card-v2"[\s\S]*?<\/article>/g)].map((match) => match[0]);
const skuOf = (card) => card.match(/<span class="sku-badge">([^<]+)<\/span>/)?.[1]?.trim() || '';
const replaceSku = (value, oldSku, newSku) => value.replace(new RegExp(oldSku, 'g'), newSku).replace(new RegExp(oldSku.toLowerCase(), 'g'), newSku.toLowerCase());

let html = await readFile(path.join(previewCategory, 'index.html'), 'utf8');
const cards = cardsOf(html);
const before = cards.map(skuOf);
if (before.length === config.expectedActiveCount && sourceSkus.some((sku) => !before.includes(sku))) {
  console.log('Issue #37 migration already applied; no changes needed.');
  process.exit(0);
}
if (before.length !== config.expectedActiveCount || new Set(before).size !== config.expectedActiveCount) throw new Error(`Expected ${config.expectedActiveCount} unique Sequins cards before migration, got ${before.length}`);
for (const sku of sourceSkus) if (!before.includes(sku)) throw new Error(`Missing source SKU ${sku}`);
const originalDirBySku = new Map();
for (const sku of sourceSkus) {
  const dir = (await readdir(previewCategory, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
    .find((name) => name.toLowerCase().startsWith(`${sku.toLowerCase()}-`));
  if (!dir) throw new Error(`Missing original slug for ${sku}`);
  originalDirBySku.set(sku, dir);
}

const transformed = cards.map((card) => {
  const oldSku = skuOf(card);
  const newSku = mapping[oldSku];
  if (!newSku) return card;
  const marker = `__ISSUE37_${oldSku.replace('-', '_')}__`;
  return card.replace(new RegExp(oldSku, 'g'), marker).replace(new RegExp(oldSku.toLowerCase(), 'g'), marker.toLowerCase()).replaceAll(marker, newSku).replaceAll(marker.toLowerCase(), newSku.toLowerCase());
});
const first = html.indexOf('<article class="product-card-v2"');
const last = html.lastIndexOf('</article>') + '</article>'.length;
if (first < 0 || last <= first) throw new Error('Could not locate Sequins product card grid');
html = `${html.slice(0, first)}${transformed.join('')}${html.slice(last)}`;
await writeFile(path.join(previewCategory, 'index.html'), html, 'utf8');

const renameCategory = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const dirs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const bySku = new Map();
  for (const sku of sourceSkus) {
    const dir = dirs.find((name) => name.toLowerCase().startsWith(`${sku.toLowerCase()}-`));
    if (!dir) throw new Error(`Missing detail directory for ${sku}`);
    bySku.set(sku, dir);
  }
  const staged = [];
  for (const [oldSku, dir] of bySku) {
    const nextSku = mapping[oldSku];
    const suffix = dir.slice(oldSku.length + 1);
    const nextDir = `${nextSku.toLowerCase()}-${suffix}`;
    const tempDir = `.issue37-${oldSku.toLowerCase().replace('-', '_')}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    await rename(path.join(directory, dir), path.join(directory, tempDir));
    staged.push({ tempDir, nextDir });
  }
  for (const { tempDir, nextDir } of staged) await rename(path.join(directory, tempDir), path.join(directory, nextDir));
};

await renameCategory(previewCategory);
await renameCategory(productionCategory);

const finalDirs = await readdir(previewCategory, { withFileTypes: true });
const dirFor = (sku) => finalDirs.map((entry) => entry.name).find((name) => name.toLowerCase().startsWith(`${sku.toLowerCase()}-`));
const redirects = sourceSkus.map((oldSku) => {
  const newSku = mapping[oldSku];
  const destinationDir = dirFor(newSku);
  if (!destinationDir) throw new Error(`Missing destination directory for ${oldSku} -> ${newSku}`);
  const sourceDir = originalDirBySku.get(oldSku);
  return { source: `/products/sequins-glitter-confetti/${sourceDir}/`, destination: `/products/sequins-glitter-confetti/${destinationDir}/`, permanent: true };
});

for (const file of ['vercel.json', 'v2-preview/production-config/vercel-redirects.json']) {
  const filePath = path.join(root, file);
  const json = JSON.parse(await readFile(filePath, 'utf8'));
  const existing = new Set(json.redirects.map((item) => item.source));
  for (const redirect of redirects) if (!existing.has(redirect.source)) json.redirects.push(redirect);
  await writeFile(filePath, `${JSON.stringify(json, null, 2)}\n`, 'utf8');
}
console.log(`Issue #37 migrated ${sourceSkus.length} Sequins identities and added ${redirects.length} permanent redirects.`);

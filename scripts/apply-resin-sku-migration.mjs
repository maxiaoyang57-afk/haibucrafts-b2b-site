import { readdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const migration = JSON.parse(await readFile(path.join(root, 'scripts', 'data', 'issue-33-resin-sku-migration.json'), 'utf8'));
const mapping = migration.mapping;
const resinSkus = Object.keys(mapping);
const expectedFinal = new Set(Object.values(mapping));

if (resinSkus.length !== 20 || expectedFinal.size !== 20 || !mapping.RW002859) {
  throw new Error('Issue #33 mapping must contain 20 source SKUs and 20 unique final SKUs, including preserved RW002859');
}

const previewCategory = path.join(root, 'v2-preview', 'products', 'resin-charms', 'index.html');
const html = await readFile(previewCategory, 'utf8');
const cards = [...html.matchAll(/<article class="product-card-v2"[\s\S]*?<\/article>/g)].map((match) => match[0]);
const cardSkus = cards.map((card) => card.match(/<span class="sku-badge">([^<]+)<\/span>/)?.[1]);
if (cards.length !== 20 || cardSkus.some((sku) => !mapping[sku]) || new Set(cardSkus).size !== 20) {
  throw new Error(`Expected the 20 current Resin cards to match the Issue #33 source set; found ${cards.length} cards`);
}
if (new Set(cardSkus).size !== resinSkus.length || resinSkus.some((sku) => !cardSkus.includes(sku))) {
  throw new Error('Issue #33 source mapping does not exactly match the current Resin category cards');
}

let nextHtml = html.replace(/<article class="product-card-v2"[\s\S]*?<\/article>/g, (card) => {
  const oldSku = card.match(/<span class="sku-badge">([^<]+)<\/span>/)?.[1];
  return card.replaceAll(oldSku, mapping[oldSku]);
});
await writeFile(previewCategory, nextHtml, 'utf8');

const dirs = [
  path.join(root, 'v2-preview', 'products', 'resin-charms'),
  path.join(root, 'products', 'resin-charms-for-slime')
];
const moves = [];
for (const dir of dirs) {
  for (const oldSku of resinSkus) {
    const oldPrefix = `${oldSku.toLowerCase()}-`;
    const entries = await readdir(dir, { withFileTypes: true });
    const entry = entries.find((item) => item.isDirectory() && item.name.toLowerCase().startsWith(oldPrefix));
    if (!entry || oldSku === mapping[oldSku]) continue;
    const oldPath = path.join(dir, entry.name);
    const nextName = `${mapping[oldSku].toLowerCase()}-${entry.name.slice(oldPrefix.length)}`;
    const nextPath = path.join(dir, nextName);
    moves.push({ oldPath, nextPath, oldName: entry.name, nextName });
  }
}
const token = `.issue33-resin-sku-migration-${Date.now()}`;
for (const move of moves) await rename(move.oldPath, `${move.oldPath}${token}`);
for (const move of moves) await rename(`${move.oldPath}${token}`, move.nextPath);

const redirectFiles = [
  path.join(root, 'vercel.json'),
  path.join(root, 'v2-preview', 'production-config', 'vercel-redirects.json')
];
const redirectEntries = moves
  .filter(({ oldPath }) => oldPath.includes(`${path.sep}products${path.sep}resin-charms-for-slime${path.sep}`))
  .map(({ oldName, nextName }) => ({
    source: `/products/resin-charms-for-slime/${oldName}/`,
    destination: `/products/resin-charms-for-slime/${nextName}/`,
    permanent: true
  }));
for (const file of redirectFiles) {
  const config = JSON.parse(await readFile(file, 'utf8'));
  const existing = new Map((config.redirects || []).map((redirect) => [redirect.source, redirect]));
  for (const redirect of redirectEntries) existing.set(redirect.source, redirect);
  config.redirects = [...existing.values()];
  await writeFile(file, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

console.log(`Issue #33 applied: ${resinSkus.length} Resin identities mapped; ${moves.length / 2} product directories renamed; ${redirectEntries.length} permanent redirects added.`);

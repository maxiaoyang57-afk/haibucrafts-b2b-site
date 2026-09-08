import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (relative) => readFile(path.join(root, relative), 'utf8');

test('AI discovery guide stays aligned with the reconciled catalog and production URLs', async () => {
  const guide = await read('v2-preview/production-config/llms.txt');
  const catalog = JSON.parse(await read('v2-preview/assets/product-catalog.json'));
  assert.match(guide, /^# HAIBUCRAFT/m);
  assert.match(guide, /https:\/\/www\.haibucrafts\.com\/sitemap\.xml/);
  assert.doesNotMatch(guide, /\/v2-preview\//);
  assert.doesNotMatch(guide, /Site V2 Preview|Preview branch|Not published to production/i);
  for (const [category, label, productionPath] of [
    ['slime-charms', 'Slime Charms', '/products/slime-charms-wholesale/'],
    ['polymer-clay-slices', 'Polymer Clay Slices', '/products/polymer-clay-slices-wholesale/'],
    ['resin-charms', 'Resin Charms', '/products/resin-charms-for-slime/'],
    ['sequins-glitter-confetti', 'Sequins & Glitter Confetti', '/products/sequins-glitter-confetti/']
  ]) {
    const count = catalog.products.filter((product) => product.category === category).length;
    assert.match(guide, new RegExp(`- ${label}: https://www\\.haibucrafts\\.com${productionPath.replaceAll('/', '\\/')} \\(${count} catalog SKUs\\)`));
  }
});

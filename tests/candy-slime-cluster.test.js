import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const productionPath = path.join('products', 'slime-charms-wholesale', 'candy-charms-for-slime', 'index.html');
const previewPath = path.join('v2-preview', 'products', 'slime-charms', 'candy-charms-for-slime', 'index.html');
const canonical = 'https://www.haibucrafts.com/products/slime-charms-wholesale/candy-charms-for-slime/';
const skus = ['SLM10094','SLM680','SLM713','SLM10093','SLM10012','SLM693','SLM26521','SLM717','SLM10018'];

test('candy slime collection has a canonical production page and noindex preview', async () => {
  const production = await readFile(path.join(root, productionPath), 'utf8');
  const preview = await readFile(path.join(root, previewPath), 'utf8');

  assert.match(production, /<title>Candy Charms for Slime Wholesale \| HAIBUCRAFT<\/title>/);
  assert.match(production, /<h1>Candy Charms for Slime Wholesale<\/h1>/);
  assert.ok(production.includes(`<link rel="canonical" href="${canonical}">`));
  assert.ok(!production.includes('noindex,nofollow'));

  assert.match(preview, /<title>Candy Charms for Slime Wholesale \| HAIBUCRAFT<\/title>/);
  assert.match(preview, /<meta name="robots" content="noindex,nofollow">/);

  for (const sku of skus) {
    assert.ok(production.includes(sku), `production page missing ${sku}`);
    assert.ok(preview.includes(sku), `preview page missing ${sku}`);
  }
  assert.match(production, /"@type":"FAQPage"/);
  assert.match(production, /"@type":"ItemList"/);
  assert.match(production, /There is no blanket MOQ published for every item/);
});

test('relevant hubs link to the candy slime collection', async () => {
  const cases = [
    ['products/slime-charms-wholesale/index.html', '/products/slime-charms-wholesale/candy-charms-for-slime/'],
    ['themes/food-and-treats/index.html', '/products/slime-charms-wholesale/candy-charms-for-slime/'],
    ['themes/bakery/index.html', '/products/slime-charms-wholesale/candy-charms-for-slime/'],
    ['themes/fruit/index.html', '/products/slime-charms-wholesale/candy-charms-for-slime/'],
    ['v2-preview/products/slime-charms/index.html', '/v2-preview/products/slime-charms/candy-charms-for-slime/'],
    ['v2-preview/themes/food-and-treats/index.html', '/v2-preview/products/slime-charms/candy-charms-for-slime/'],
    ['v2-preview/themes/bakery/index.html', '/v2-preview/products/slime-charms/candy-charms-for-slime/'],
    ['v2-preview/themes/fruit/index.html', '/v2-preview/products/slime-charms/candy-charms-for-slime/']
  ];
  for (const [relative, href] of cases) {
    const html = await readFile(path.join(root, relative), 'utf8');
    assert.ok(html.includes(href), `${relative} missing candy collection link`);
  }
});

test('SEO map, sitemap and AI discovery expose the candy slime collection', async () => {
  const map = JSON.parse(await readFile(path.join(root, 'v2-preview', 'seo-production-map.json'), 'utf8'));
  const route = map.routes.find((row) => row.productionPath === '/products/slime-charms-wholesale/candy-charms-for-slime/');
  assert.ok(route);
  assert.equal(route.title, 'Candy Charms for Slime Wholesale | HAIBUCRAFT');
  assert.equal(route.lastModified, '2026-09-22');

  for (const relative of ['sitemap.xml', path.join('v2-preview','production-config','sitemap.xml')]) {
    const sitemap = await readFile(path.join(root, relative), 'utf8');
    assert.ok(sitemap.includes(`<loc>${canonical}</loc><lastmod>2026-09-22</lastmod>`));
  }

  for (const relative of ['llms.txt', path.join('v2-preview','production-config','llms.txt')]) {
    const llms = await readFile(path.join(root, relative), 'utf8');
    assert.ok(llms.includes('Candy and mini food charms for slime: ' + canonical));
  }

  const builder = await readFile(path.join(root, 'scripts', 'build-v2-ai-discovery.mjs'), 'utf8');
  assert.ok(builder.includes('/products/slime-charms-wholesale/candy-charms-for-slime/'));
});

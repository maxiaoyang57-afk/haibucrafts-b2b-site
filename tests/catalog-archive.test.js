import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = p => readFile(new URL('../' + p, import.meta.url), 'utf8');
test('fixed public category scope preserves reference identities without indexing or browsing them', async () => {
  const policy = JSON.parse(await read('scripts/data/catalog-scope-20261031.json'));
  const catalog = JSON.parse(await read('assets/v2/product-catalog.json'));
  assert.deepEqual([...new Set(catalog.products.map(p => p.category))].sort(), [...policy.activeCategories].sort());
  assert.equal(catalog.count, catalog.products.length);
  assert.deepEqual(catalog.archivedProducts.map(p => p.sku).sort(), policy.products.map(p => p.sku).sort());
  const sitemap = await read('sitemap.xml');
  for (const source of policy.products) {
    assert.equal(catalog.products.some(p => p.sku === source.sku), false);
    const p = catalog.archivedProducts.find(p => p.sku === source.sku);
    assert.equal(p.productionPath, source.productionPath);
    assert.equal(p.image, source.image);
    const html = await read(p.productionPath.slice(1) + 'index.html');
    assert.match(html, /data-catalog-archive/);
    assert.match(html, /<meta name="robots" content="noindex,follow">/);
    assert.ok(html.includes(`"sku":"${p.sku}"`));
    assert.ok(!sitemap.includes(`<loc>https://www.haibucrafts.com${p.productionPath}</loc>`));
  }
  for (const file of ['index.html', 'products/index.html', 'request-quote/index.html', 'llms.txt']) {
    const html = await read(file);
    assert.doesNotMatch(html, /Decorative Craft Accessories|Keychains &amp; Components|Keychains & Components/);
  }
});

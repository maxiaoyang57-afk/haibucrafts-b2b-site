import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const config = JSON.parse(await readFile(path.join(root, 'scripts', 'data', 'polymer-selected-sku-retirement.json'), 'utf8'));
const retiredSkus = new Set(config.products.map((product) => product.sku));

test('selected polymer products are absent from catalogs, category cards and generated routes', async () => {
  for (const prefix of ['', 'v2-preview']) {
    const catalogPath = prefix
      ? path.join(root, prefix, 'assets', 'product-catalog.json')
      : path.join(root, 'assets', 'v2', 'product-catalog.json');
    const categoryPath = prefix
      ? path.join(root, prefix, 'products', 'polymer-clay-slices', 'index.html')
      : path.join(root, 'products', 'polymer-clay-slices-wholesale', 'index.html');
    const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
    const category = await readFile(categoryPath, 'utf8');
    assert.equal(catalog.count, 82);
    assert.equal(catalog.products.filter((product) => product.category === config.category).length, 12);
    assert.equal(catalog.products.some((product) => retiredSkus.has(product.sku)), false);
    for (const product of config.products) assert.equal(category.includes(`>${product.sku}</span>`), false);
  }

  const seoMap = JSON.parse(await readFile(path.join(root, 'v2-preview', 'seo-production-map.json'), 'utf8'));
  const migrationMap = JSON.parse(await readFile(path.join(root, 'v2-preview', 'production-config', 'file-migration-map.json'), 'utf8'));
  const productionSitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
  const previewSitemap = await readFile(path.join(root, 'v2-preview', 'production-config', 'sitemap.xml'), 'utf8');
  for (const product of config.products) {
    assert.equal(seoMap.routes.some((route) => route.productionPath === product.retiredPath), false);
    assert.equal(migrationMap.pages.some((page) => page.productionPath === product.retiredPath), false);
    assert.equal(productionSitemap.includes(product.retiredPath), false);
    assert.equal(previewSitemap.includes(product.retiredPath), false);
    const slug = product.retiredPath.split('/').filter(Boolean).at(-1);
    await assert.rejects(access(path.join(root, 'products', 'polymer-clay-slices-wholesale', slug, 'index.html')));
    await assert.rejects(access(path.join(root, 'v2-preview', 'products', 'polymer-clay-slices', slug, 'index.html')));
  }
});

test('retired polymer URLs redirect permanently to the active category', async () => {
  for (const relative of ['vercel.json', path.join('v2-preview', 'production-config', 'vercel-redirects.json')]) {
    const redirects = new Map((JSON.parse(await readFile(path.join(root, relative), 'utf8')).redirects || []).map((redirect) => [redirect.source, redirect]));
    for (const product of config.products) {
      assert.equal(redirects.get(product.retiredPath)?.destination, config.redirectTo, `${relative}: ${product.sku} destination`);
      assert.equal(redirects.get(product.retiredPath)?.permanent, true, `${relative}: ${product.sku} permanent redirect`);
    }
    assert.equal(redirects.get(config.redirectTo), undefined, `${relative}: category must not redirect`);
  }
});

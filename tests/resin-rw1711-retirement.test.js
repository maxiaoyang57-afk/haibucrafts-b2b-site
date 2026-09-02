import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const config = JSON.parse(await readFile(path.join(root, 'scripts', 'data', 'resin-rw1711-retirement.json'), 'utf8'));
const category = await readFile(path.join(root, 'v2-preview', 'products', 'resin-charms', 'index.html'), 'utf8');
const catalog = JSON.parse(await readFile(path.join(root, 'v2-preview', 'assets', 'product-catalog.json'), 'utf8'));
const seoMap = JSON.parse(await readFile(path.join(root, 'v2-preview', 'seo-production-map.json'), 'utf8'));
const sitemap = await readFile(path.join(root, 'v2-preview', 'production-config', 'sitemap.xml'), 'utf8');

test('RW1711 is removed from the Resin catalog and generated product routes', async () => {
  const resinProducts = catalog.products.filter((product) => product.category === config.category);
  const cards = [...category.matchAll(/<article class="product-card-v2"[\s\S]*?<\/article>/g)].map((match) => match[0]);
  assert.equal(resinProducts.length, 19);
  assert.equal(cards.length, 19);
  assert.equal(resinProducts.some((product) => product.sku === config.sku), false);
  assert.equal(category.includes(`>RW1711</span>`), false);
  assert.equal(seoMap.routes.some((route) => route.productionPath === config.retiredPath), false);
  assert.equal(sitemap.includes(config.retiredPath), false);
  await assert.rejects(access(path.join(root, 'v2-preview', 'products', 'resin-charms', 'rw1711-glitter-bow-head-resin-charms', 'index.html')));
  await assert.rejects(access(path.join(root, 'products', 'resin-charms-for-slime', 'rw1711-glitter-bow-head-resin-charms', 'index.html')));
});

test('RW1711 and its prior corrected alias redirect directly to the Resin category', async () => {
  for (const relative of ['vercel.json', path.join('v2-preview', 'production-config', 'vercel-redirects.json')]) {
    const redirects = new Map((JSON.parse(await readFile(path.join(root, relative), 'utf8')).redirects || []).map((redirect) => [redirect.source, redirect]));
    const retired = redirects.get(config.retiredPath);
    const priorAlias = redirects.get('/products/resin-charms-for-slime/rw5806-glitter-bow-head-resin-charms/');
    assert.equal(retired?.destination, config.redirectTo, `${relative}: retired URL destination`);
    assert.equal(retired?.permanent, true, `${relative}: retired URL must be permanent`);
    assert.equal(priorAlias?.destination, config.redirectTo, `${relative}: prior alias destination`);
    assert.equal(priorAlias?.permanent, true, `${relative}: prior alias must be permanent`);
    assert.equal(redirects.get(config.redirectTo), undefined, `${relative}: category destination must not redirect`);
  }
});

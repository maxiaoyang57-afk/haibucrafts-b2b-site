import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const config = JSON.parse(await readFile(path.join(root, 'scripts', 'data', 'sequins-ma079-retirement.json'), 'utf8'));
const category = await readFile(path.join(root, 'v2-preview', 'products', 'sequins-glitter-confetti', 'index.html'), 'utf8');
const productionCategory = await readFile(path.join(root, 'products', 'sequins-glitter-confetti', 'index.html'), 'utf8');
const catalog = JSON.parse(await readFile(path.join(root, 'v2-preview', 'assets', 'product-catalog.json'), 'utf8'));
const seoMap = JSON.parse(await readFile(path.join(root, 'v2-preview', 'seo-production-map.json'), 'utf8'));
const sitemap = await readFile(path.join(root, 'v2-preview', 'production-config', 'sitemap.xml'), 'utf8');

test('MA079 is removed from the Sequins catalog and generated product routes', async () => {
  const products = catalog.products.filter((product) => product.category === config.category);
  const cards = [...category.matchAll(/<article class="product-card-v2"[\s\S]*?<\/article>/g)];
  assert.equal(products.length, 18);
  assert.equal(cards.length, 18);
  assert.equal(products.some((product) => product.sku === config.sku), false);
  assert.equal(category.includes(`>${config.sku}</span>`), false);
  assert.equal((productionCategory.match(/<article class="product-card-v2"[\s\S]*?<\/article>/g) || []).length, 18);
  assert.equal(productionCategory.includes(`>${config.sku}</span>`), false);
  assert.equal(seoMap.routes.some((route) => route.productionPath === config.retiredPath), false);
  assert.equal(sitemap.includes(config.retiredPath), false);
  await assert.rejects(access(path.join(root, 'v2-preview', 'products', 'sequins-glitter-confetti', 'ma079-iridescent-circle-ring-sequins', 'index.html')));
  await assert.rejects(access(path.join(root, 'products', 'sequins-glitter-confetti', 'ma079-iridescent-circle-ring-sequins', 'index.html')));
});

test('MA079 and its MA087 legacy URL redirect directly to the Sequins category', async () => {
  for (const relative of ['vercel.json', path.join('v2-preview', 'production-config', 'vercel-redirects.json')]) {
    const redirects = new Map((JSON.parse(await readFile(path.join(root, relative), 'utf8')).redirects || []).map((redirect) => [redirect.source, redirect]));
    for (const source of [config.retiredPath, config.legacyPath]) {
      const redirect = redirects.get(source);
      assert.equal(redirect?.destination, config.redirectTo, `${relative}: ${source} destination`);
      assert.equal(redirect?.permanent, true, `${relative}: ${source} must be permanent`);
      assert.notEqual(source, redirect?.destination);
    }
    assert.equal(redirects.get(config.redirectTo), undefined, `${relative}: category destination must not redirect`);
  }
});

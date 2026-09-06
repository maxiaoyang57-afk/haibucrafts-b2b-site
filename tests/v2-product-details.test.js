import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const previewRoot = path.join(root, 'v2-preview');
const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

test('all catalog products have linked detail pages and SEO routes', async () => {
  const catalog = JSON.parse(await readFile(path.join(previewRoot, 'assets', 'product-catalog.json'), 'utf8'));
  const seoMap = JSON.parse(await readFile(path.join(previewRoot, 'seo-production-map.json'), 'utf8'));
  const generatedRoutes = seoMap.routes.filter((route) => route.generatedProduct);

  assert.equal(catalog.count, 82);
  assert.equal(catalog.products.length, 82);
  assert.equal(generatedRoutes.length, 82);
  assert.equal(new Set(catalog.products.map((product) => product.sku)).size, 82);

  for (const product of catalog.products) {
    const relative = product.previewPath.slice('/v2-preview/'.length);
    const detailFile = path.join(previewRoot, relative, 'index.html');
    await access(detailFile);
    const html = await readFile(detailFile, 'utf8');

    assert.match(html, new RegExp(`<h1>${escapeRegex(escapeHtml(product.title))}</h1>`));
    assert.match(html, /type="application\/ld\+json"/);
    assert.match(html, new RegExp(`product_code=${encodeURIComponent(product.sku)}`));
    assert.ok(generatedRoutes.some((route) => route.previewPath === product.previewPath && route.productionPath === product.productionPath));
  }

  const categoryPages = [
    'polymer-clay-slices',
    'slime-charms',
    'resin-charms',
    'sequins-glitter-confetti'
  ];
  let linkedCards = 0;
  for (const category of categoryPages) {
    const html = await readFile(path.join(previewRoot, 'products', category, 'index.html'), 'utf8');
    linkedCards += (html.match(/class="btn btn-light product-detail-link"/g) || []).length;
  }
  assert.equal(linkedCards, 82);
});

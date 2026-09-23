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

test('all catalog products have linked detail pages and SEO routes', async () => {
  const catalog = JSON.parse(await readFile(path.join(previewRoot, 'assets', 'product-catalog.json'), 'utf8'));
  const seoMap = JSON.parse(await readFile(path.join(previewRoot, 'seo-production-map.json'), 'utf8'));
  const generatedRoutes = seoMap.routes.filter((route) => route.generatedProduct);

  assert.equal(catalog.count, 139);
  assert.equal(catalog.products.length, 139);
  assert.equal(generatedRoutes.length, 139);
  assert.equal(new Set(catalog.products.map((product) => product.sku)).size, 139);

  for (const product of catalog.products) {
    const relative = product.previewPath.slice('/v2-preview/'.length);
    const detailFile = path.join(previewRoot, relative, 'index.html');
    await access(detailFile);
    const html = await readFile(detailFile, 'utf8');

    const heading = html.match(/<h1>([^<]+)<\/h1>/)?.[1] || '';
    assert.ok(
      heading.includes(escapeHtml(product.title)) || heading.includes(product.sku),
      `${product.sku}: H1 must preserve the catalog title or product code`
    );
    const productData = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
      .map((match) => JSON.parse(match[1]))
      .find((entry) => entry['@type'] === 'Product');
    assert.ok(productData, `${product.sku}: missing Product structured data`);
    assert.equal(productData.name, product.title, `${product.sku}: Product name differs from catalog`);
    assert.equal(productData.sku, product.sku, `${product.sku}: Product SKU differs from catalog`);
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
  assert.equal(linkedCards, 139);
});

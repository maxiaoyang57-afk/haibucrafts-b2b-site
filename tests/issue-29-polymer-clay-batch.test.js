import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const origin = 'https://www.haibucrafts.com';
const batch = JSON.parse(await readFile(path.join(root, 'scripts', 'data', 'issue-29-polymer-clay-products.json'), 'utf8'));
const expectedSkus = ['YX4002', 'YX4008', 'YX4010', 'YX4011'];

const slugify = (value) => value
  .toLowerCase()
  .replace(/['’]/g, '')
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .replace(/-{2,}/g, '-');

const productSlug = (product) => `${product.sku.toLowerCase()}-${slugify(product.title).replaceAll('-and-', '-')}`;
const productImage = (product, position) => `/assets/images/products/${batch.assetDirectory}/${product.sku.toLowerCase()}/${product.imagePrefix}-${String(position).padStart(2, '0')}.webp`;

function webpDimensions(buffer) {
  assert.equal(buffer.toString('ascii', 0, 4), 'RIFF');
  assert.equal(buffer.toString('ascii', 8, 12), 'WEBP');
  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const type = buffer.toString('ascii', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (type === 'VP8X') {
      return {
        width: 1 + buffer[data + 4] + (buffer[data + 5] << 8) + (buffer[data + 6] << 16),
        height: 1 + buffer[data + 7] + (buffer[data + 8] << 8) + (buffer[data + 9] << 16)
      };
    }
    if (type === 'VP8 ') {
      return {
        width: buffer.readUInt16LE(data + 6) & 0x3fff,
        height: buffer.readUInt16LE(data + 8) & 0x3fff
      };
    }
    if (type === 'VP8L') {
      const b1 = buffer[data + 1];
      const b2 = buffer[data + 2];
      const b3 = buffer[data + 3];
      const b4 = buffer[data + 4];
      return {
        width: 1 + (((b2 & 0x3f) << 8) | b1),
        height: 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | (b2 >> 6))
      };
    }
    offset = data + size + (size % 2);
  }
  throw new Error('Unsupported WebP image');
}

test('Issue #29 retains exactly the four active SKU, five-image media sets', async () => {
  assert.deepEqual(batch.products.map((product) => product.sku), expectedSkus);
  assert.equal(batch.publicGalleryCount, 5);
  assert.equal(new Set(batch.products.map((product) => product.title)).size, 4);
  assert.equal(new Set(batch.products.map((product) => product.metaDescription)).size, 4);

  for (const product of batch.products) {
    const directory = path.join(root, 'assets', 'images', 'products', batch.assetDirectory, product.sku.toLowerCase());
    const files = (await readdir(directory)).filter((file) => file.endsWith('.webp')).sort();
    assert.equal(files.length, 5, `${product.sku} must publish exactly five supplied WebP images`);
    assert.ok(files.every((file) => file.startsWith(product.imagePrefix)));
    for (const file of files) {
      const dimensions = webpDimensions(await readFile(path.join(directory, file)));
      assert.deepEqual(dimensions, { width: 1000, height: 1000 }, `${product.sku}/${file} must be 1000px square`);
    }
  }
});

test('Issue #29 retirements reconcile the catalog to 82 total and 12 active polymer clay products', async () => {
  const catalog = JSON.parse(await readFile(path.join(root, 'assets', 'v2', 'product-catalog.json'), 'utf8'));
  const category = await readFile(path.join(root, 'products', 'polymer-clay-slices-wholesale', 'index.html'), 'utf8');
  const home = await readFile(path.join(root, 'index.html'), 'utf8');
  const directory = await readFile(path.join(root, 'products', 'index.html'), 'utf8');

  assert.equal(catalog.count, 82);
  assert.equal(catalog.products.length, 82);
  assert.equal(catalog.products.filter((product) => product.category === 'polymer-clay-slices').length, 12);
  assert.equal(new Set(catalog.products.map((product) => product.sku)).size, 82);
  assert.match(category, /<strong data-product-count>12 products<\/strong>/);
  assert.equal((category.match(/data-product-card/g) || []).length, 12);
  assert.match(home, /<span>82 cataloged products<\/span>/);
  assert.match(home, /<span class="eyebrow">12 products<\/span><h3>Polymer Clay Slices<\/h3>/);
  assert.match(directory, /Browse 82 published products/);
  assert.match(directory, /<span>12 Products<\/span>[\s\S]*?<h2>Polymer Clay Slices<\/h2>/);

  const itemList = [...category.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]))
    .find((item) => item['@type'] === 'ItemList');
  assert.equal(itemList?.numberOfItems, 12);
  assert.deepEqual(itemList?.itemListElement.map((item) => item.position), Array.from({ length: 12 }, (_, index) => index + 1));
});

test('Issue #29 product pages preserve identity, RFQ attribution and SEO integrity', async () => {
  const category = await readFile(path.join(root, 'products', 'polymer-clay-slices-wholesale', 'index.html'), 'utf8');
  const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');

  for (const product of batch.products) {
    const slug = productSlug(product);
    const productionPath = `/products/polymer-clay-slices-wholesale/${slug}/`;
    const canonical = `${origin}${productionPath}`;
    const mainImage = productImage(product, 1);
    const article = category.match(new RegExp(`<article class="product-card-v2"[^>]*>[\\s\\S]*?<span class="sku-badge">${product.sku}<\\/span>[\\s\\S]*?<\\/article>`))?.[0];
    assert.ok(article, `missing category card for ${product.sku}`);
    assert.ok(article.includes(productionPath));
    assert.ok(article.includes(mainImage));
    assert.ok(article.includes(`product_code=${product.sku}`));
    assert.ok(article.includes(`landing_page=%2Fproducts%2Fpolymer-clay-slices-wholesale%2F${slug}%2F`));

    const file = path.join(root, 'products', 'polymer-clay-slices-wholesale', slug, 'index.html');
    await access(file);
    const html = await readFile(file, 'utf8');
    assert.equal((html.match(/<link rel="canonical"/g) || []).length, 1);
    assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`));
    assert.match(html, /<meta name="robots" content="index,follow">/);
    assert.ok(html.includes(`<h1>${product.title.replaceAll('&', '&amp;')}</h1>`));
    assert.equal((html.match(/data-product-gallery-thumb/g) || []).length, 5);
    assert.equal((html.match(/data-product-gallery-main/g) || []).length, 1);
    assert.match(html, /Images 1–2 are actual product photographs/);
    assert.match(html, /data-buyer-fit=/);
    assert.match(html, /These are decorative craft components, not edible products/);
    assert.doesNotMatch(html, /Add to Cart|consumer review|in stock|limited time|FDA approved|certified safe/i);
    assert.doesNotMatch(html, /Mario|Minecraft|Pokemon|Nintendo|Disney|Marvel/i);
    assert.doesNotMatch(html, /\/v2-preview\//);

    const jsonLd = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
      .map((match) => JSON.parse(match[1]));
    const productLd = jsonLd.find((item) => item['@type'] === 'Product');
    const breadcrumbLd = jsonLd.find((item) => item['@type'] === 'BreadcrumbList');
    assert.equal(productLd?.sku, product.sku);
    assert.equal(productLd?.image, `${origin}${mainImage}`);
    assert.ok(breadcrumbLd);
    assert.equal(sitemap.split(`<loc>${canonical}</loc>`).length - 1, 1, `${product.sku} sitemap URL must appear once`);
  }
});

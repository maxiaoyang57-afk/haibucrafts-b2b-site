import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const origin = 'https://www.haibucrafts.com';
const batch = JSON.parse(await readFile(path.join(root, 'scripts', 'data', 'issue-18-slime-products.json'), 'utf8'));
const expectedSkus = [
  'SLM10013', 'SLM10014', 'SLM10015', 'SLM10016', 'SLM10017',
  'SLM10018', 'SLM10019', 'SLM10021', 'SLM10022'
];

const slugify = (value) => value
  .toLowerCase()
  .replace(/['’]/g, '')
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .replace(/-{2,}/g, '-');

const productSlug = (product) => `${product.sku.toLowerCase()}-${slugify(product.title).replaceAll('-and-', '-')}`;

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

test('Issue #18 publishes only the approved nine-SKU media set', async () => {
  assert.deepEqual(batch.products.map((product) => product.sku), expectedSkus);
  assert.ok(!batch.products.some((product) => ['SLM10012', 'SLM10020'].includes(product.sku)));
  assert.equal(new Set(batch.products.map((product) => product.title)).size, 9);
  assert.equal(new Set(batch.products.map((product) => product.metaDescription)).size, 9);

  for (const product of batch.products) {
    const directory = path.join(root, 'assets', 'images', 'products', 'batch-2026-08', product.sku.toLowerCase());
    const files = (await readdir(directory)).filter((file) => file.endsWith('.webp')).sort();
    assert.equal(files.length, 6, `${product.sku} must publish exactly six supplied WebP images`);
    assert.ok(files.every((file) => file.startsWith(product.imagePrefix)));

    for (const file of files) {
      const dimensions = webpDimensions(await readFile(path.join(directory, file)));
      assert.deepEqual(dimensions, { width: 1000, height: 1000 }, `${product.sku}/${file} must be 1000px square`);
    }
  }
});

test('Issue #18 keeps its 33-SKU slime result after later catalog additions and preserves legacy SLM10012', async () => {
  const catalog = JSON.parse(await readFile(path.join(root, 'assets', 'v2', 'product-catalog.json'), 'utf8'));
  const category = await readFile(path.join(root, 'products', 'slime-charms-wholesale', 'index.html'), 'utf8');
  const home = await readFile(path.join(root, 'index.html'), 'utf8');
  const directory = await readFile(path.join(root, 'products', 'index.html'), 'utf8');
  const redirects = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8')).redirects;

  assert.equal(catalog.count, 86);
  assert.equal(catalog.products.length, 86);
  assert.equal(catalog.products.filter((product) => product.category === 'slime-charms').length, 33);
  assert.match(category, /<strong data-product-count>33 products<\/strong>/);
  assert.equal((category.match(/data-product-card/g) || []).length, 33);
  assert.match(home, /<span>86 cataloged products<\/span>/);
  assert.match(home, /<b>86<\/b><span>Cataloged wholesale products<\/span>/);
  assert.match(home, /<span class="eyebrow">33 products<\/span><h3>Slime Charms<\/h3>/);
  assert.match(directory, /Browse 86 published products/);
  assert.match(directory, /<b>86<\/b><span>Published products<\/span>/);
  assert.match(directory, /<span>33 Products<\/span>[\s\S]*?<h2>Slime Charms<\/h2>/);
  assert.doesNotMatch(`${home}\n${directory}`, /63 cataloged products|Browse 63 published products|15 Products/);

  const legacy = catalog.products.find((product) => product.sku === 'SLM10012');
  assert.equal(legacy?.title, 'Sweet Berry Candy Charms');
  assert.equal(legacy?.productionPath, '/products/slime-charms-wholesale/slm10012-sweet-berry-candy-charms/');
  assert.ok(redirects.some((redirect) => (
    redirect.source === '/products/slime-charms-wholesale/slm713-sweet-berry-candy-charms/'
      && redirect.destination === legacy.productionPath
      && redirect.permanent === true
  )));
});

test('Issue #18 cards, inquiry attribution and production SEO are complete', async () => {
  const category = await readFile(path.join(root, 'products', 'slime-charms-wholesale', 'index.html'), 'utf8');
  const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');

  for (const product of batch.products) {
    const slug = productSlug(product);
    const productionPath = `/products/slime-charms-wholesale/${slug}/`;
    const canonical = `${origin}${productionPath}`;
    const article = category.match(new RegExp(`<article class="product-card-v2"[^>]*>[\\s\\S]*?<span class="sku-badge">${product.sku}<\\/span>[\\s\\S]*?<\\/article>`))?.[0];
    assert.ok(article, `missing category card for ${product.sku}`);
    assert.ok(article.includes(productionPath));
    assert.ok(article.includes(`product_code=${product.sku}`));
    assert.ok(article.includes('product='));
    assert.ok(article.includes('image='));
    assert.ok(article.includes(`landing_page=%2Fproducts%2Fslime-charms-wholesale%2F${slug}%2F`));

    const file = path.join(root, 'products', 'slime-charms-wholesale', slug, 'index.html');
    await access(file);
    const html = await readFile(file, 'utf8');
    assert.equal((html.match(/<link rel="canonical"/g) || []).length, 1);
    assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`));
    assert.match(html, /<meta name="robots" content="index,follow">/);
    assert.ok(html.includes(`<h1>${product.title.replaceAll('&', '&amp;')}</h1>`));
    assert.equal((html.match(/data-product-gallery-thumb/g) || []).length, 6);
    assert.equal((html.match(/data-product-gallery-main/g) || []).length, 1);
    assert.match(html, /Buyer Reference/);
    assert.match(html, /Quotation Checklist/);
    assert.match(html, /Mixed-SKU and private-label packaging review/);
    assert.match(html, /approved order specification/);
    assert.doesNotMatch(html, /Add to Cart|consumer review|in stock|limited time|FDA approved|certified safe/i);
    assert.doesNotMatch(html, /\/v2-preview\//);

    const jsonLd = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
      .map((match) => JSON.parse(match[1]));
    const productLd = jsonLd.find((item) => item['@type'] === 'Product');
    const breadcrumbLd = jsonLd.find((item) => item['@type'] === 'BreadcrumbList');
    assert.equal(productLd?.sku, product.sku);
    assert.equal(productLd?.image?.length, 6);
    assert.ok(breadcrumbLd);
    assert.equal(sitemap.split(`<loc>${canonical}</loc>`).length - 1, 1, `${product.sku} sitemap URL must appear once`);
  }
});

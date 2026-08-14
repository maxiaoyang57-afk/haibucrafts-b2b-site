import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const origin = 'https://www.haibucrafts.com';
const batch = JSON.parse(await readFile(path.join(root, 'scripts', 'data', 'issue-12-slime-products.json'), 'utf8'));
const expectedSkus = [
  'SLM10001', 'SLM10002', 'SLM10003', 'SLM10004', 'SLM10005',
  'SLM10008', 'SLM10009', 'SLM10010', 'SLM10011'
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
      const width = 1 + buffer[data + 4] + (buffer[data + 5] << 8) + (buffer[data + 6] << 16);
      const height = 1 + buffer[data + 7] + (buffer[data + 8] << 8) + (buffer[data + 9] << 16);
      return { width, height };
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

test('Issue #12 uses the verified nine-SKU set and six public images per product', async () => {
  assert.deepEqual(batch.products.map((product) => product.sku), expectedSkus);
  assert.ok(!batch.products.some((product) => ['SLM10006', 'SLM10007'].includes(product.sku)));

  for (const product of batch.products) {
    const directory = path.join(root, 'assets', 'images', 'products', 'batch-2026-08', product.sku.toLowerCase());
    const files = (await readdir(directory)).filter((file) => file.endsWith('.webp')).sort();
    assert.equal(files.length, 6, `${product.sku} must publish exactly six non-scale WebP images`);
    assert.ok(files.every((file) => file.startsWith(product.imagePrefix)));

    for (const file of files) {
      const dimensions = webpDimensions(await readFile(path.join(directory, file)));
      assert.ok(dimensions.width <= 1000 && dimensions.height <= 1000, `${product.sku}/${file} exceeds 1000px`);
      assert.equal(dimensions.width, dimensions.height, `${product.sku}/${file} must retain its square aspect ratio`);
    }
  }
});

test('Issue #12 category cards preserve filters, product count and attributed quote links', async () => {
  const html = await readFile(path.join(root, 'products', 'slime-charms-wholesale', 'index.html'), 'utf8');
  assert.match(html, /<strong data-product-count>24 products<\/strong>/);
  assert.equal((html.match(/data-product-card/g) || []).length, 24);

  for (const product of batch.products) {
    const slug = productSlug(product);
    const article = html.match(new RegExp(`<article class="product-card-v2"[^>]*>[\\s\\S]*?<span class="sku-badge">${product.sku}<\\/span>[\\s\\S]*?<\\/article>`))?.[0];
    assert.ok(article, `missing category card for ${product.sku}`);
    assert.ok(article.includes(`/products/slime-charms-wholesale/${slug}/`));
    assert.ok(article.includes(`product_code=${product.sku}`));
    assert.ok(article.includes('product='));
    assert.ok(article.includes('image='));
    assert.ok(article.includes(`landing_page=%2Fproducts%2Fslime-charms-wholesale%2F${slug}%2F`));
  }
});

test('Issue #12 production pages have galleries, sourcing copy and complete SEO signals', async () => {
  const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');

  for (const product of batch.products) {
    const slug = productSlug(product);
    const canonical = `${origin}/products/slime-charms-wholesale/${slug}/`;
    const file = path.join(root, 'products', 'slime-charms-wholesale', slug, 'index.html');
    await access(file);
    const html = await readFile(file, 'utf8');

    assert.equal((html.match(/<link rel="canonical"/g) || []).length, 1);
    assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`));
    assert.match(html, /<meta name="robots" content="index,follow">/);
    assert.ok(html.includes(`<h1>${product.title.replaceAll('&', '&amp;')}</h1>`));
    assert.equal((html.match(/data-product-gallery-thumb/g) || []).length, 6);
    assert.equal((html.match(/data-product-gallery-main/g) || []).length, 1);
    assert.match(html, /Packing options\/reference/);
    assert.match(html, /Quotation Checklist/);
    assert.match(html, /Mixed-SKU and private-label packaging review/);
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

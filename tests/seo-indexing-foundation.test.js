import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const read = (relative) => readFile(path.join(root, relative), 'utf8');

test('robots explicitly allows search and user-triggered ChatGPT crawlers', async () => {
  for (const relative of ['robots.txt', 'v2-preview/production-config/robots.txt']) {
    const robots = await read(relative);
    for (const agent of ['OAI-SearchBot', 'ChatGPT-User']) {
      assert.match(robots, new RegExp(`User-agent: ${agent}\\nAllow: /\\nDisallow: /api/\\nDisallow: /v2-preview/`));
    }
    assert.match(robots, /Sitemap: https:\/\/www\.haibucrafts\.com\/sitemap\.xml/);
  }
});

test('sitemap supplies honest lastmod values and one discoverable image per product', async () => {
  const sitemap = await read('sitemap.xml');
  const catalog = JSON.parse(await read('assets/v2/product-catalog.json'));
  const blocks = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => match[1]);
  assert.match(sitemap, /xmlns:image="http:\/\/www\.google\.com\/schemas\/sitemap-image\/1\.1"/);
  assert.ok(blocks.length > catalog.products.length);
  for (const block of blocks) assert.equal((block.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g) || []).length, 1);
  for (const product of catalog.products) {
    const canonical = `https://www.haibucrafts.com${product.productionPath}`;
    const block = blocks.find((entry) => entry.includes(`<loc>${canonical}</loc>`));
    assert.ok(block, `missing sitemap URL for ${product.sku}`);
    assert.ok(block.includes(`<image:loc>https://www.haibucrafts.com${product.image}</image:loc>`), `missing sitemap image for ${product.sku}`);
  }
  assert.equal((sitemap.match(/<image:image>/g) || []).length, catalog.products.length);
});

test('all four category hubs expose CollectionPage and ItemList data', async () => {
  for (const category of ['slime-charms', 'polymer-clay-slices', 'resin-charms', 'sequins-glitter-confetti']) {
    const html = await read(`v2-preview/products/${category}/index.html`);
    assert.match(html, new RegExp(`data-seo-growth-jsonld="${category}-item-list"`));
    assert.match(html, new RegExp(`data-seo-growth-jsonld="${category}-collection-page"`));
    assert.match(html, /"@type":"CollectionPage"/);
  }
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const mapping = {
  YX3531: 'YX048', YX097: 'YX3531', YX626: 'YX3400', YX778: 'YX097', YX3400: 'YX038', YX048: 'YX778'
};
const identities = {
  YX3531: ['Pink Candy & Ceramic Dish Mix', '/assets/images/products/hc001-school-theme-polymer-clay-mix.webp'],
  YX097: ['Crystal Accent Fantasy Candy Slices', '/assets/images/products/hc005-pastel-star-slices-mix.webp'],
  YX626: ['Gothic Candy Decor Mix', '/assets/images/products/hc006-halloween-candy-corn-mix.webp'],
  YX778: ['Rainbow Crumble Bowl Mix', '/assets/images/products/hc007-mini-knife-polymer-pieces.webp'],
  YX3400: ['Halloween Theme Slice Mix', '/assets/images/products/hc008-halloween-ghost-spider-mix.webp'],
  YX048: ['Strawberry Candy Heart Mix', '/assets/images/products/hc010-campfire-marshmallow-mix.webp']
};

const decode = (value) => value.replaceAll('&amp;', '&');
const cardForSku = (html, sku) => [...html.matchAll(/<article class="product-card-v2"[\s\S]*?<\/article>/g)].map((m) => m[0]).find((card) => card.includes(`<span class="sku-badge">${sku}</span>`));

test('Issue #35 leaves 16 unique active Polymer identities and retires original YX038', async () => {
  const catalog = JSON.parse(await readFile(path.join(root, 'assets/v2/product-catalog.json'), 'utf8'));
  const category = await readFile(path.join(root, 'products/polymer-clay-slices-wholesale/index.html'), 'utf8');
  const polymer = catalog.products.filter((product) => product.category === 'polymer-clay-slices');
  assert.equal(polymer.length, 16);
  assert.equal(new Set(polymer.map((product) => product.sku)).size, 16);
  assert.equal(category.match(/class="product-card-v2"/g)?.length, 16);
  assert.doesNotMatch(category, /Pink &amp; Blue Decorative Slice Mix/);
  assert.doesNotMatch(category, /hc009-ocean-fish-dolphin-mix/);

  for (const [oldSku, newSku] of Object.entries(mapping)) {
    const [title, image] = identities[oldSku];
    const card = cardForSku(category, newSku);
    assert.ok(card, `missing corrected card ${newSku}`);
    assert.match(card, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('&', '&amp;')));
    assert.match(card, new RegExp(image.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    const product = polymer.find((item) => item.sku === newSku && item.title === title);
    assert.ok(product, `catalog identity ${oldSku} -> ${newSku} missing`);
    const detail = await readFile(path.join(root, product.productionPath.slice(1), 'index.html'), 'utf8');
    assert.match(detail, new RegExp(`<span class="sku-badge">${newSku}</span>`));
    assert.match(detail, new RegExp(`product_code=${newSku}`));
    assert.match(detail, new RegExp(`"sku":"${newSku}"`));
    assert.match(detail, new RegExp(`<h1>${title.replace('&', '&amp;')}</h1>`));
  }
  assert.equal(polymer.find((item) => item.sku === 'YX038')?.title, 'Halloween Theme Slice Mix');
});

test('Issue #35 retained URLs redirect one hop and retired YX038 redirects to category', async () => {
  const vercel = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'));
  const redirects = new Map(vercel.redirects.map((item) => [item.source, item]));
  for (const [oldSku, newSku] of Object.entries(mapping)) {
    const oldDir = {
      YX3531: 'pink-candy-and-ceramic-dish-mix', YX097: 'crystal-accent-fantasy-candy-slices', YX626: 'gothic-candy-decor-mix',
      YX778: 'rainbow-crumble-bowl-mix', YX3400: 'halloween-theme-slice-mix', YX048: 'strawberry-candy-heart-mix'
    }[oldSku];
    const newDir = {
      YX048: 'pink-candy-and-ceramic-dish-mix', YX3531: 'crystal-accent-fantasy-candy-slices', YX3400: 'gothic-candy-decor-mix',
      YX097: 'rainbow-crumble-bowl-mix', YX038: 'halloween-theme-slice-mix', YX778: 'strawberry-candy-heart-mix'
    }[newSku];
    const source = `/products/polymer-clay-slices-wholesale/${oldSku.toLowerCase()}-${oldDir}/`;
    const destination = `/products/polymer-clay-slices-wholesale/${newSku.toLowerCase()}-${newDir}/`;
    assert.equal(redirects.get(source)?.destination, destination, `${oldSku} redirect destination`);
    assert.equal(redirects.get(source)?.permanent, true);
    assert.notEqual(source, destination);
  }
  const retired = redirects.get('/products/polymer-clay-slices-wholesale/yx038-pink-and-blue-decorative-slice-mix/');
  assert.equal(retired?.destination, '/products/polymer-clay-slices-wholesale/');
  assert.equal(retired?.permanent, true);
  await assert.rejects(access(path.join(root, 'products/polymer-clay-slices-wholesale/yx038-pink-and-blue-decorative-slice-mix/index.html')));
});

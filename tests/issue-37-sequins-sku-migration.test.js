import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const retirement = JSON.parse(await readFile(path.join(root, 'scripts', 'data', 'sequins-ma079-retirement.json'), 'utf8'));
const mapping = {
  MA012: 'MA119', MA087: 'MA079', MA109: 'MA118', MA107: 'MA601', MA119: 'MA059', MA127: 'MA131', MA131: 'MA064', MA064: 'MA127', MA302: 'MA107', MA601: 'MA109', MA013: 'MA217', MA602: 'MA225', MA084: 'MA602', MA217: 'MA084', MA118: 'YM109', MA059: 'MA041', MA041: 'MA302', 'YM109-2': 'MA012', MA225: 'MA013'
};
const identity = {
  MA012: ['Autumn Maple Leaf Holographic Sequins', '/assets/images/products/autumn-maple-leaf-sequins.webp'],
  MA087: ['Iridescent Circle Ring Sequins', '/assets/images/products/iridescent-circle-ring-sequins.webp'],
  MA109: ['Silver Novelty Party Confetti', '/assets/images/products/silver-novelty-party-confetti.webp'],
  MA107: ['Pastel Butterfly Confetti Bowl', '/assets/images/products/pastel-butterfly-confetti-bowl.webp'],
  MA119: ['Rainbow Star Glitter Confetti', '/assets/images/products/rainbow-star-glitter-confetti.webp'],
  MA127: ['Iridescent Sequin Scoop Mix', '/assets/images/products/iridescent-sequin-scoop-mix.webp'],
  MA131: ['Coral Diamond Glitter Sequins', '/assets/images/products/coral-diamond-glitter-sequins.webp'],
  MA064: ['Pastel Love Heart Confetti', '/assets/images/products/pastel-love-heart-confetti.webp'],
  MA302: ['Iridescent Fish Sequins Mix', '/assets/images/products/iridescent-fish-sequins-mix.webp'],
  MA601: ['Pastel Seashell Paillette Mix', '/assets/images/products/pastel-seashell-paillette-mix.webp'],
  MA013: ['Candy Heart Bowl Paillettes', '/assets/images/products/candy-heart-bowl-paillettes.webp'],
  MA602: ['Patriotic Star Confetti Mix', '/assets/images/products/patriotic-star-confetti-mix.webp'],
  MA225: ['Rainbow Micro Star Sprinkles', '/assets/images/products/rainbow-micro-star-sprinkles.webp'],
  MA217: ['Holographic Hollow Star Sequins', '/assets/images/products/holographic-hollow-star-sequins.webp'],
  MA118: ['Patriotic Tube Glitter Mix', '/assets/images/products/patriotic-tube-glitter-mix.webp'],
  MA059: ['Multicolor Round Confetti Assortment', '/assets/images/products/multicolor-round-confetti-chart.webp'],
  MA041: ['Dreamy Pearl Moon Star Mix', '/assets/images/products/dreamy-pearl-moon-star-mix.webp'],
  MA084: ['Pastel Mini Heart Sequins', '/assets/images/products/pastel-mini-heart-sequins.webp'],
  'YM109-2': ['Pastel Hollow Star Scatter Mix', '/assets/images/products/pastel-hollow-star-scatter.webp']
};
const oldSlug = {
  MA012: 'ma012-autumn-maple-leaf-holographic-sequins', MA087: 'ma087-iridescent-circle-ring-sequins', MA109: 'ma109-silver-novelty-party-confetti', MA107: 'ma107-pastel-butterfly-confetti-bowl', MA119: 'ma119-rainbow-star-glitter-confetti', MA127: 'ma127-iridescent-sequin-scoop-mix', MA131: 'ma131-coral-diamond-glitter-sequins', MA064: 'ma064-pastel-love-heart-confetti', MA302: 'ma302-iridescent-fish-sequins-mix', MA601: 'ma601-pastel-seashell-paillette-mix', MA013: 'ma013-candy-heart-bowl-paillettes', MA602: 'ma602-patriotic-star-confetti-mix', MA225: 'ma225-rainbow-micro-star-sprinkles', MA217: 'ma217-holographic-hollow-star-sequins', MA118: 'ma118-patriotic-tube-glitter-mix', MA059: 'ma059-multicolor-round-confetti-assortment', MA041: 'ma041-dreamy-pearl-moon-star-mix', MA084: 'ma084-pastel-mini-heart-sequins', 'YM109-2': 'ym109-2-pastel-hollow-star-scatter-mix'
};

const cards = (html) => [...html.matchAll(/<article class="product-card-v2"[\s\S]*?<\/article>/g)].map((m) => m[0]);
const skuCard = (html, sku) => cards(html).find((card) => card.includes(`<span class="sku-badge">${sku}</span>`));

test('Issue #37 preserves active Sequins identities while applying corrected unique SKUs', async () => {
  const catalog = JSON.parse(await readFile(path.join(root, 'assets/v2/product-catalog.json'), 'utf8'));
  const category = await readFile(path.join(root, 'products/sequins-glitter-confetti/index.html'), 'utf8');
  const products = catalog.products.filter((product) => product.category === 'sequins-glitter-confetti');
  assert.equal(products.length, 18);
  assert.equal(new Set(products.map((product) => product.sku)).size, 18);
  assert.equal(cards(category).length, 18);
  for (const [oldSku, newSku] of Object.entries(mapping)) {
    if (newSku === retirement.sku) continue;
    const [title, image] = identity[oldSku];
    const card = skuCard(category, newSku);
    assert.ok(card, `missing corrected card ${newSku}`);
    assert.match(card, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(card, new RegExp(image.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    const product = products.find((item) => item.sku === newSku && item.title === title);
    assert.ok(product, `${oldSku} -> ${newSku} identity missing from catalog`);
    const detail = await readFile(path.join(root, product.productionPath.slice(1), 'index.html'), 'utf8');
    assert.match(detail, new RegExp(`<span class="sku-badge">${newSku}</span>`));
    assert.match(detail, new RegExp(`product_code=${newSku}`));
    assert.match(detail, new RegExp(`"sku":"${newSku}"`));
  }
  assert.ok(products.some((product) => product.sku === 'MA601' && product.title === identity.MA107[0]));
  assert.ok(products.some((product) => product.sku === 'YM109' && product.title === identity.MA118[0]));
});

test('Issue #37 adds one-hop redirects for every original Sequins URL', async () => {
  const vercel = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'));
  const redirects = new Map(vercel.redirects.map((item) => [item.source, item]));
  const catalog = JSON.parse(await readFile(path.join(root, 'assets/v2/product-catalog.json'), 'utf8'));
  for (const [oldSku, newSku] of Object.entries(mapping)) {
    if (newSku === retirement.sku) continue;
    const product = catalog.products.find((item) => item.category === 'sequins-glitter-confetti' && item.sku === newSku && item.title === identity[oldSku][0]);
    assert.ok(product, `destination product missing for ${oldSku}`);
    const source = `/products/sequins-glitter-confetti/${oldSlug[oldSku]}/`;
    const redirect = redirects.get(source);
    assert.equal(redirect?.destination, product.productionPath);
    assert.equal(redirect?.permanent, true);
    assert.notEqual(source, redirect.destination);
    await access(path.join(root, product.productionPath.slice(1), 'index.html'));
  }
});

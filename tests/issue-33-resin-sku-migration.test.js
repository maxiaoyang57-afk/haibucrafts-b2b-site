import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const origin = 'https://www.haibucrafts.com';
const migration = JSON.parse(await readFile(path.join(root, 'scripts', 'data', 'issue-33-resin-sku-migration.json'), 'utf8'));
const mapping = migration.mapping;
const correction = JSON.parse(await readFile(path.join(root, 'scripts', 'data', 'resin-rw26189-correction.json'), 'utf8'));
const effectiveMapping = { ...mapping, RW26189: correction.finalSku };
const sourceIdentity = {
  RW4252: ['Glitter Cherry Resin Charms', '/assets/images/products/glitter-cherry-resin-charms.webp'],
  RW994: ['Iridescent Ocean Animal Charms', '/assets/images/products/iridescent-ocean-animal-charms.webp'],
  RW22741: ['Pink Strawberry Flatback Charms', '/assets/images/products/pink-strawberry-flatback-charms.webp'],
  RW002854: ['Kawaii Frog Resin Charms', '/assets/images/products/kawaii-frog-resin-charms.webp'],
  RW26439: ['School Supplies Flatback Charms', '/assets/images/products/school-supplies-flatback-charms.webp'],
  RW1620: ['Gummy Bear Resin Charms', '/assets/images/products/gummy-bear-resin-charms.webp'],
  RW26051: ['Fruit Shell Turtle Resin Charms', '/assets/images/products/fruit-shell-turtle-resin-charms.webp'],
  RW26412: ['Pastel Heart Flatback Charms', '/assets/images/products/pastel-heart-flatback-charms.webp'],
  RW1711: ['Glossy Jelly Bean Resin Charms', '/assets/images/products/glossy-jelly-bean-resin-charms.webp'],
  RW22372: ['Green Frog Flatback Charms', '/assets/images/products/green-frog-flatback-charms.webp'],
  RW2899: ['Star Gummy Bear Charms', '/assets/images/products/star-gummy-bear-charms.webp'],
  RW20388: ['Mini Cauldron Resin Charms', '/assets/images/products/mini-cauldron-resin-charms.webp'],
  RW1775: ['Citrus Slice Resin Charms', '/assets/images/products/citrus-slice-resin-charms.webp'],
  RW003223: ['Bright Jelly Bean Charms Mix', '/assets/images/products/bright-jelly-bean-charms-mix.webp'],
  RW002859: ['Green Ghost Flatback Charms', '/assets/images/products/green-ghost-flatback-charms.webp'],
  RW2683: ['Mermaid Ocean Flatback Charms', '/assets/images/products/mermaid-ocean-flatback-charms.webp'],
  RW5806: ['Glitter Bow Head Resin Charms', '/assets/images/products/glitter-bow-head-resin-charms.webp'],
  RW26386: ['Pastel Candy Disc Charms', '/assets/images/products/pastel-candy-disc-charms.webp'],
  RW003422: ['Frosted Cookie Resin Charms', '/assets/images/products/frosted-cookie-resin-charms.webp'],
  RW26189: ['Spring Mini Duck Charms', '/assets/images/products/sc010-spring-mini-duck-charms.webp']
};

const categoryHtml = await readFile(path.join(root, 'v2-preview', 'products', 'resin-charms', 'index.html'), 'utf8');
const cards = [...categoryHtml.matchAll(/<article class="product-card-v2"[\s\S]*?<\/article>/g)].map((match) => match[0]);
const finalSkus = [...new Set(Object.values(effectiveMapping))];

test('Resin migration has exactly 20 unique corrected SKUs', () => {
  const cardsSkus = cards.map((card) => card.match(/<span class="sku-badge">([^<]+)<\/span>/)?.[1]);
  assert.equal(cards.length, 20);
  assert.equal(new Set(cardsSkus).size, 20);
  assert.deepEqual(new Set(cardsSkus), new Set(finalSkus));
  assert.equal(mapping.RW002859, 'RW002859');
});

test('each corrected card/detail preserves original product identity and quote SKU', async () => {
  for (const [oldSku, newSku] of Object.entries(effectiveMapping)) {
    const [title, image] = sourceIdentity[oldSku];
    const card = cards.find((item) => item.includes(`sku-badge">${newSku}<`));
    assert.ok(card, `missing corrected card for ${oldSku} -> ${newSku}`);
    assert.match(card, new RegExp(`<h3>${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/h3>`));
    assert.match(card, new RegExp(`src="${image.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
    const detailHref = card.match(/class="btn btn-light product-detail-link" href="([^"]+)"/)?.[1];
    assert.ok(detailHref, `${newSku} detail link missing`);
    const detailPath = path.join(root, detailHref.replace('/v2-preview/', 'v2-preview/'), 'index.html');
    const detailHtml = await readFile(detailPath, 'utf8');
    assert.match(detailHtml, new RegExp(`<h1>${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/h1>`));
    assert.match(detailHtml, new RegExp(`product_code=${newSku}`));
    assert.match(detailHtml, new RegExp(`sku["']?:["']?${newSku}`));
    assert.match(detailHtml, new RegExp(image.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('all Resin legacy product URLs are one-hop permanent redirects', async () => {
  const oldDirs = {
    RW4252: 'rw4252-glitter-cherry-resin-charms', RW994: 'rw994-iridescent-ocean-animal-charms', RW22741: 'rw22741-pink-strawberry-flatback-charms',
    RW002854: 'rw002854-kawaii-frog-resin-charms', RW26439: 'rw26439-school-supplies-flatback-charms', RW1620: 'rw1620-gummy-bear-resin-charms',
    RW26051: 'rw26051-fruit-shell-turtle-resin-charms', RW26412: 'rw26412-pastel-heart-flatback-charms', RW1711: 'rw1711-glossy-jelly-bean-resin-charms',
    RW22372: 'rw22372-green-frog-flatback-charms', RW2899: 'rw2899-star-gummy-bear-charms', RW20388: 'rw20388-mini-cauldron-resin-charms',
    RW1775: 'rw1775-citrus-slice-resin-charms', RW003223: 'rw003223-bright-jelly-bean-charms-mix', RW2683: 'rw2683-mermaid-ocean-flatback-charms',
    RW5806: 'rw5806-glitter-bow-head-resin-charms', RW26386: 'rw26386-pastel-candy-disc-charms', RW003422: 'rw003422-frosted-cookie-resin-charms',
    RW26189: 'rw26189-spring-mini-duck-charms'
  };
  const newDirs = new Map(cards.map((card) => [card.match(/sku-badge">([^<]+)/)?.[1], card.match(/product-detail-link" href="\/v2-preview\/products\/resin-charms\/([^"]+)/)?.[1]?.replace(/\/$/, '')]));
  for (const relative of ['vercel.json', path.join('v2-preview', 'production-config', 'vercel-redirects.json')]) {
    const config = JSON.parse(await readFile(path.join(root, relative), 'utf8'));
    const redirects = new Map(config.redirects.map((redirect) => [redirect.source, redirect]));
    const sources = new Set(config.redirects.map((redirect) => redirect.source));
    for (const [oldSku, newSku] of Object.entries(effectiveMapping)) {
      if (oldSku === newSku) continue;
      const source = `/products/resin-charms-for-slime/${oldDirs[oldSku]}/`;
      const destination = `/products/resin-charms-for-slime/${newDirs.get(newSku)}/`;
      assert.equal(redirects.get(source)?.destination, destination, `${relative}: ${source}`);
      assert.equal(redirects.get(source)?.permanent, true, `${relative}: ${source} must be permanent`);
      assert.equal(sources.has(destination), false, `${relative}: redirect chain at ${destination}`);
    }
  }
  assert.equal(await access(path.join(root, 'products', 'resin-charms-for-slime', 'rw002859-green-ghost-flatback-charms', 'index.html')).then(() => true), true);
  assert.equal(origin, 'https://www.haibucrafts.com');
});

test('RW26189 correction keeps the Spring Mini Duck identity and aliases both legacy codes', async () => {
  const card = cards.find((item) => item.includes(`sku-badge">${correction.finalSku}<`));
  assert.ok(card, 'RW26189 card missing');
  assert.match(card, /<h3>Spring Mini Duck Charms<\/h3>/);
  assert.match(card, /spring-mini-duck-charms/);
  assert.equal(await access(path.join(root, 'products', 'resin-charms-for-slime', 'rw26189-spring-mini-duck-charms', 'index.html')).then(() => true), true);
  for (const relative of ['vercel.json', path.join('v2-preview', 'production-config', 'vercel-redirects.json')]) {
    const config = JSON.parse(await readFile(path.join(root, relative), 'utf8'));
    const redirects = new Map(config.redirects.map((redirect) => [redirect.source, redirect]));
    for (const source of correction.legacyPaths) {
      const redirect = redirects.get(source);
      assert.equal(redirect?.destination, correction.finalPath, `${relative}: ${source}`);
      assert.equal(redirect?.permanent, true, `${relative}: ${source} must be permanent`);
    }
    assert.equal(redirects.get(correction.finalPath), undefined, `${relative}: final path must not redirect`);
  }
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

const cases = [
  {
    production: 'products/sequins-glitter-confetti/index.html',
    preview: 'v2-preview/products/sequins-glitter-confetti/index.html',
    title: 'Wholesale Sequins & Glitter Confetti for Crafts | HAIBUCRAFT',
    h1: 'Wholesale Sequins, Glitter &amp; Craft Confetti',
    phrase: 'craft confetti in bulk'
  },
  {
    production: 'custom-solutions/index.html',
    preview: 'v2-preview/custom-solutions/index.html',
    title: 'OEM Craft Supplies & Private Label Packaging | HAIBUCRAFT',
    h1: 'OEM Craft Supplies, Custom Assortments &amp; Private Label Packaging',
    phrase: 'Browse Wholesale Supplies'
  },
  {
    production: 'themes/holiday/index.html',
    preview: 'v2-preview/themes/holiday/index.html',
    title: 'Christmas & Halloween Craft Charms Wholesale | HAIBUCRAFT',
    h1: 'Christmas &amp; Halloween Craft Charms Wholesale',
    phrase: 'original, non-branded Christmas and Halloween craft add-ins'
  },
  {
    production: 'products/polymer-clay-slices-wholesale/yx043-colorful-candy-round-slices/index.html',
    preview: 'v2-preview/products/polymer-clay-slices/yx043-colorful-candy-round-slices/index.html',
    title: 'Candy Polymer Clay Slices Wholesale – YX043 | HAIBUCRAFT',
    h1: 'YX043 Colorful Candy Polymer Clay Slices',
    phrase: 'mixed-SKU or custom packing review'
  }
];

for (const item of cases) {
  for (const relative of [item.production, item.preview]) {
    test(`${relative} keeps the approved zero-click SEO positioning`, async () => {
      const html = await readFile(path.join(root, relative), 'utf8');
      const renderedTitle = html.match(/<title>([^<]*)<\/title>/)?.[1].replaceAll('&amp;', '&');
      assert.equal(renderedTitle, item.title);
      assert.ok(html.includes(`<h1>${item.h1}</h1>`));
      assert.ok(html.includes(item.phrase));
    });
  }
}

test('SEO production map persists the four opportunity-page snippets', async () => {
  const map = JSON.parse(await readFile(path.join(root, 'v2-preview', 'seo-production-map.json'), 'utf8'));
  const expected = new Map([
    ['/products/sequins-glitter-confetti/', 'Wholesale Sequins & Glitter Confetti for Crafts | HAIBUCRAFT'],
    ['/custom-solutions/', 'OEM Craft Supplies & Private Label Packaging | HAIBUCRAFT'],
    ['/themes/holiday/', 'Christmas & Halloween Craft Charms Wholesale | HAIBUCRAFT'],
    ['/products/polymer-clay-slices-wholesale/yx043-colorful-candy-round-slices/', 'Candy Polymer Clay Slices Wholesale – YX043 | HAIBUCRAFT']
  ]);
  for (const [productionPath, title] of expected) {
    const entry = map.routes.find((row) => row.productionPath === productionPath);
    assert.ok(entry, `Missing SEO map route for ${productionPath}`);
    assert.equal(entry.title, title);
    assert.equal(entry.lastModified, '2026-09-22');
  }
});

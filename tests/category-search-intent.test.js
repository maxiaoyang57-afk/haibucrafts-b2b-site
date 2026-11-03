import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');

const pairs = {
  polymer: [
    'v2-preview/products/polymer-clay-slices/index.html',
    'products/polymer-clay-slices-wholesale/index.html'
  ],
  slime: [
    'v2-preview/products/slime-charms/index.html',
    'products/slime-charms-wholesale/index.html'
  ],
  resin: [
    'v2-preview/products/resin-charms/index.html',
    'products/resin-charms-for-slime/index.html'
  ]
};

test('category hubs target wholesale queries while clarifying buyer intent', async () => {
  for (const file of pairs.slime) {
    const html = await read(file);
    assert.match(html, /<title>Wholesale Slime Charms in Bulk \| HAIBUCRAFT<\/title>/);
    assert.match(html, /Bulk slime charms for slime brands, sensory kits and retail assortments\./);
    assert.match(html, /Use this page when the buying intent is decorative charms and add-ins for slime or sensory-kit programs\./);
    assert.match(html, /Resin Flatbacks &amp; Cabochons/);
  }

  for (const file of pairs.resin) {
    const html = await read(file);
    assert.match(html, /<title>Resin Charms Wholesale &(?:amp;)? Bulk Flatbacks \| HAIBUCRAFT<\/title>/);
    assert.match(html, /Bulk resin flatbacks and cabochons for decoden and craft decoration\./);
    assert.match(html, /For slime-specific charm assortments, use the Slime Charms hub instead\./);
    assert.match(html, /Slime Charms for Slime Brands/);
    assert.match(html, /Source resin charms wholesale and bulk flatback cabochons for decoden, phone-case, hair-accessory and DIY programs\./);
  }

  for (const file of pairs.polymer) {
    const html = await read(file);
    assert.match(html, /Polymer Clay Slices Wholesale &(?:amp;)? Bulk Sprinkles \| HAIBUCRAFT/);
    assert.match(html, /Source wholesale polymer clay slices and bulk polymer clay sprinkles/);
    assert.match(html, /Wholesale polymer clay slices and sprinkles for repeatable craft programs\./);
    assert.doesNotMatch(html, /fimo/i);
  }
});

test('updated category hubs advertise a fresh lastmod in sitemap', async () => {
  const sitemap = await read('sitemap.xml');
  assert.equal(await read('v2-preview/production-config/sitemap.xml'), sitemap);
  const map = JSON.parse(await read('v2-preview/seo-production-map.json'));
  const catalog = JSON.parse(await read('v2-preview/assets/product-catalog.json'));
  const routeByPath = new Map(map.routes.map(route => [route.productionPath, route]));
  const categories = [
    ['polymer-clay-slices', '/products/polymer-clay-slices-wholesale/', '2026-10-02'],
    ['slime-charms', '/products/slime-charms-wholesale/', '2026-10-31'],
    ['resin-charms', '/products/resin-charms-for-slime/', '2026-10-04'],
    ['sequins-glitter-confetti', '/products/sequins-glitter-confetti/', '2026-09-22']
  ];
  for (const [category, productionPath, editorialBaseline] of categories) {
    const lastmod = routeByPath.get(productionPath)?.lastModified;
    assert.match(lastmod || '', /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(lastmod >= editorialBaseline, `category editorial date went backwards: ${category}`);
    for (const product of catalog.products.filter(product => product.category === category)) {
      const productRoute = routeByPath.get(product.productionPath);
      if (!productRoute?.index) continue;
      const productDate = productRoute.lastModified || catalog.generatedAt;
      assert.ok(lastmod >= productDate, `category date predates public SKU ${product.sku}`);
    }
    const url = `${map.site.origin}${productionPath}`;
    assert.ok(sitemap.includes(`<loc>${url}</loc><lastmod>${lastmod}</lastmod>`), `sitemap date differs from the source map for ${url}`);
  }
});

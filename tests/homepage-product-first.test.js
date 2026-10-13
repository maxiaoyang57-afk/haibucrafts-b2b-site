import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import test from 'node:test';

const catalog = JSON.parse(await readFile('v2-preview/assets/product-catalog.json', 'utf8'));
for (const [file, routeKey] of [['v2-preview/index.html', 'previewPath'], ['index.html', 'productionPath']]) {
  test(`${file} keeps products and buying choices ahead of supply evidence`, async () => {
    const html = await readFile(file, 'utf8');
    assert.match(html, /Wholesale charms &amp; mix-ins for slime &amp; craft brands\./);
    assert.match(html, />Browse Products /);
    assert.match(html, />Ask About Samples</);
    assert.ok(html.indexOf('id="categories"') < html.indexOf('id="featured"'));
    assert.ok(html.indexOf('id="featured"') < html.indexOf('id="buying"'));
    assert.ok(html.indexOf('id="buying"') < html.indexOf('id="factory"'));
    const cards = [...html.matchAll(/<a class="home-product-card" href="([^"]+)" data-product-code="([^"]+)">([\s\S]*?)<\/a>/g)];
    assert.equal(cards.length, 8);
    assert.equal(new Set(cards.map((card) => card[2])).size, 8);
    const represented = new Set();
    for (const [, href, sku, content] of cards) {
      const product = catalog.products.find((item) => item.sku === sku);
      assert.ok(product, sku);
      assert.equal(href, product[routeKey]);
      assert.ok(content.includes(`src="${product.image}"`));
      assert.ok(content.includes(`>${sku}</span>`));
      await access(`.${href}index.html`);
      await access(`.${product.image}`);
      represented.add(product.category);
    }
    assert.equal(represented.size, 4);
    assert.match(html, /Availability, specifications, quantities and packing are confirmed by product code/);
    assert.match(html, /Ask about samples/);
    assert.match(html, /Reorder by product code/);
    assert.doesNotMatch(html, /Send a usable buying brief, not only a product photo/);
  });
}

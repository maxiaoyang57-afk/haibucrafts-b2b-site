import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const skus = ['SLM26529', 'SLM10009', 'SLM10014', 'SLM10001', 'SLM10012', 'SLM10008', 'SLM10123'];
const catalog = JSON.parse(await readFile(path.join(root, 'v2-preview/assets/product-catalog.json'), 'utf8'));
const products = skus.map((sku) => catalog.products.find((product) => product.sku === sku));

test('SKU-specific packaging and dispatch facts do not spread to other purchasing pages', async () => {
  for (const product of products) {
    assert.ok(product);
    for (const route of [product.previewPath, product.productionPath]) {
      const html = await readFile(path.join(root, route.slice(1), 'index.html'), 'utf8');
      const packaging = html.match(/<dt>Packaging<\/dt><dd>([^<]+)<\/dd>/)?.[1];
      const dispatch = html.match(/<dt>Dispatch lead time<\/dt><dd>([^<]+)<\/dd>/)?.[1];
      assert.ok(packaging, `${route} must give a packaging decision`);
      assert.ok(dispatch, `${route} must give a dispatch decision`);
      if (product.sku === 'SLM26529') {
        assert.equal(packaging, '5 g/bag');
        assert.match(dispatch, /^7–15 days\. Shipping transit time is additional\.$/);
      } else {
        assert.equal(packaging, 'Confirm by quotation');
        assert.match(dispatch, /^Confirm after SKU, quantity and packaging review\./);
        assert.doesNotMatch(html, /7–15 days/);
      }
      assert.match(html, /Other bag weights are quotation requests|The bag weights below are quotation requests/);
      assert.match(html, /Typically 100 bags\. Final MOQ confirmed with our sales team/);

      const links = [...html.matchAll(/href="([^"]+)"[^>]*>Ask about (\d+) g\/bag<\/a>/g)];
      assert.equal(links.length, 5, `${route} must retain the five inquiry choices`);
      for (const [, href, grams] of links) {
        const url = new URL(href.replaceAll('&amp;', '&'), 'https://www.haibucrafts.com');
        assert.equal(url.searchParams.get('product_code'), product.sku);
        assert.equal(url.searchParams.get('packaging'), `${grams} g/bag`);
        assert.equal(url.searchParams.get('landing_page'), route);
        assert.equal(url.searchParams.get('image'), product.image);
      }
    }
  }
});

test('seasonal procurement tables retain SKU-specific dispatch and packaging boundaries', async () => {
  for (const base of ['v2-preview/products/slime-charms', 'products/slime-charms-wholesale']) {
    for (const season of ['christmas', 'halloween']) {
      const html = await readFile(path.join(root, base, `${season}-slime-charms/index.html`), 'utf8');
      const rows = [...html.matchAll(/<tr><td data-label="Product">([\s\S]*?)<\/tr>/g)];
      for (const [, row] of rows) {
        const sku = row.match(/class="procurement-sku">([^<]+)/)?.[1];
        if (!skus.includes(sku)) continue;
        if (sku === 'SLM26529') {
          assert.match(row, /data-label="Standard Packing">5 g\/bag/);
          assert.match(row, /7–15 days/);
        } else {
          assert.match(row, /data-label="Standard Packing">Confirm by quotation/);
          assert.doesNotMatch(row, /7–15 days/);
        }
      }
    }
  }
});

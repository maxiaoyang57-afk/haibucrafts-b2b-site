import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const catalog = JSON.parse(await readFile('v2-preview/assets/product-catalog.json', 'utf8'));
for (const file of ['v2-preview/assets/components.js', 'assets/v2/components.js']) {
  test(`${file} navigation uses verified product imagery and preserves all category destinations`, async () => {
    const source = await readFile(file, 'utf8');
    const cards = [...source.matchAll(/<a class="nav-category-card" href="([^"]+)" aria-label="([^"]+)"><img src="([^"]+)"[^>]+>.*?<\/a>/g)];
    assert.equal(cards.length, 4);
    assert.equal(new Set(cards.map((card) => card[1])).size, 4);
    const images = new Set(catalog.products.map((item) => item.image));
    for (const [, href, label, image] of cards) {
      assert.ok(images.has(image), `${image} must be a real catalog image`);
      await access(`.${image}`);
      assert.match(href, /products\//);
      assert.ok(label.length > 8);
    }
    assert.match(source, /class="nav-catalog-all" href="\$\{ROOT\}products\/"/);
    assert.match(source, /class="nav-catalog-motif"[^>]*aria-hidden="true"[^>]*focusable="false"/);
    assert.match(source, /const navIcon = \(name\) => `<span class="nav-icon" aria-hidden="true">/);
    for (const route of ['custom-solutions', 'themes', 'manufacturing', 'quality-control', 'certificates', 'about', 'blog']) {
      assert.ok(source.includes(`href="\u0024{ROOT}${route}/"`));
    }
    assert.match(source, /aria-controls="product-category-navigation"/);
    assert.match(source, /aria-controls="primary-navigation"/);
  });
}

test('visual navigation keeps popup visibility tied to its toggle and respects reduced motion', async () => {
  const css = await readFile('v2-preview/assets/brand-v2.css', 'utf8');
  assert.match(css, /\.nav \.nav-group \.nav-catalog-menu \{\s+display: none/);
  assert.match(css, /\.nav \.nav-group\.dropdown-open \.nav-catalog-menu \{\s+display: grid/);
  assert.match(css, /max-height: calc\(100dvh - 120px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.products-toggle svg/);
});

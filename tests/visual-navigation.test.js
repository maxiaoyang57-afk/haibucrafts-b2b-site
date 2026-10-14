import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const catalog = JSON.parse(await readFile('v2-preview/assets/product-catalog.json', 'utf8'));
for (const file of ['v2-preview/assets/components.js', 'assets/v2/components.js']) {
  test(`${file} header pairs the existing symbol with a readable HAIBU home wordmark`, async () => {
    const source = await readFile(file, 'utf8');
    const logo = source.match(/<a class="logo"[^>]*>[\s\S]*?<\/a>/)?.[0];
    assert.ok(logo, 'The header must keep its logo home link');
    assert.match(logo, /href="\$\{ROOT\}"/);
    assert.match(logo, /aria-label="HAIBU home"/);
    assert.match(logo, /<img src="\/brand\/haibu-logo-mobile\.png"[^>]*alt=""/);
    assert.equal([...logo.matchAll(/<img\b/g)].length, 1);
    assert.match(logo, /<span class="logo-wordmark">HAIBU<\/span>/);
    assert.doesNotMatch(logo, /<picture\b|<source\b|haibu-logo-header\.png/);
    await access('brand/haibu-logo-mobile.png');
  });

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

for (const base of ['v2-preview/assets', 'assets/v2']) {
  test(`${base} shows categories directly on mobile and keeps the desktop disclosure`, async () => {
    const css = await readFile(`${base}/brand-v2.css`, 'utf8');
    assert.match(css, /\.nav \.nav-group \.nav-catalog-menu \{\s+display: none/);
    assert.match(css, /\.nav \.nav-group\.dropdown-open \.nav-catalog-menu \{\s+display: grid/);
    const mobile = [...css.matchAll(/@media \(max-width: 1180px\) \{([\s\S]*?)\n\}/g)]
      .map((match) => match[1]).join('\n');
    assert.match(mobile, /\.nav \.products-toggle \{\s+display: none/);
    assert.match(mobile, /\.nav \.nav-group \.nav-catalog-menu \{\s+display: grid/);
    assert.match(mobile, /max-height: var\(--mobile-nav-height, calc\(100dvh - 120px\)\)/);
    assert.match(mobile, /overflow: auto/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.products-toggle svg/);
  });

  test(`${base} resets mobile scroll and dismisses the whole menu with one Escape`, async () => {
    const runtime = await readFile(`${base}/site-v2.js`, 'utf8');
    assert.match(runtime, /window\.matchMedia\('\(max-width: 1180px\)'\)/);
    assert.match(runtime, /if \(open\) \{\s*nav\.scrollTop = 0;\s*fitMobileMenu\(\)/);
    assert.match(runtime, /if \(mobileNavigation\.matches\) return/);
    assert.match(runtime, /if \(event\.key === 'Escape'\) \{\s+if \(mobileNavigation\.matches\) closeMenu\(\{ restoreFocus: true \}\);\s+else if \(navGroup\?\.classList\.contains\('dropdown-open'\)\) closeProducts\(\{ restoreFocus: true \}\)/);
    assert.match(runtime, /mobileNavigation\.addEventListener\?\.\('change'/);
  });
}

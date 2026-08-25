import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const previewRoot = path.join(root, 'v2-preview');

const readPreview = (...parts) => readFile(path.join(previewRoot, ...parts), 'utf8');

test('Issue #27 preserves keyboard dismissal and restores focus to the correct trigger', async () => {
  const runtime = await readPreview('assets', 'site-v2.js');
  const brand = await readPreview('assets', 'brand-v2.css');

  assert.match(runtime, /navGroup\?\.classList\.contains\('dropdown-open'\)/);
  assert.match(runtime, /closeProducts\(\{ restoreFocus: true \}\)/);
  assert.match(runtime, /else closeMenu\(\{ restoreFocus: true \}\)/);
  assert.match(runtime, /Close product categories/);
  assert.match(brand, /focus-within:not\(\.dropdown-open\):not\(:hover\)/);
});

test('Issue #27 provides touch targets, sticky offsets and mobile safe-area separation', async () => {
  const accessibility = await readPreview('assets', 'accessibility.css');
  const brand = await readPreview('assets', 'brand-v2.css');
  const category = await readPreview('assets', 'category-ux.css');

  assert.match(accessibility, /scroll-padding-top: 96px/);
  assert.match(accessibility, /scroll-margin-top: 76px/);
  assert.match(accessibility, /touch-action: manipulation/);
  assert.match(brand, /\.products-toggle \{[\s\S]*?min-width: 44px;[\s\S]*?min-height: 44px/);
  assert.match(brand, /\.menu-btn \{[\s\S]*?min-width: 44px;[\s\S]*?min-height: 44px/);
  assert.match(brand, /\[data-site-header\] \{[\s\S]*?display: contents/);
  assert.match(category, /\.filter-chip \{[\s\S]*?min-height: 44px/);
  assert.match(category, /bottom: calc\(12px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(category, /has-category-mobile-quote \.whatsapp-float[\s\S]*?bottom: calc\(96px/);
  assert.match(category, /has-category-mobile-quote \.back-top[\s\S]*?bottom: calc\(160px/);
});

test('Issue #27 makes inquiry requirements, input semantics and disabled uploads clear', async () => {
  const quote = await readPreview('quote', 'index.html');
  const runtime = await readPreview('assets', 'quote-preview.js');

  assert.equal((quote.match(/class="field-required"/g) || []).length, 3);
  assert.match(quote, /name="phone" type="tel" inputmode="tel" autocomplete="tel"/);
  assert.match(quote, /name="website" type="url" inputmode="url" autocomplete="url" spellcheck="false"/);
  assert.match(quote, /Uploads are unavailable in this form\./);
  assert.match(quote, /disabled aria-describedby="referenceImageHelp"/);
  assert.match(quote, /id="formStatus" aria-live="polite" aria-atomic="true"/);
  assert.match(runtime, /submitButton\.textContent = 'Sending…'/);
  assert.match(runtime, /form\.setAttribute\('aria-busy', 'true'\)/);
  assert.match(runtime, /Boolean\(fields\.sku \|\| productCode\)/);
});

test('Issue #27 keeps Preview validation-only and adds a shared browser theme color', async () => {
  const config = await readPreview('assets', 'quote-runtime-config.js');
  const components = await readPreview('assets', 'components.js');
  const home = await readPreview('index.html');

  assert.match(config, /mode: 'validation-only'/);
  assert.match(config, /enableReferenceUploads: false/);
  assert.match(components, /themeColor\.name = 'theme-color'/);
  assert.match(components, /themeColor\.content = '#ffffff'/);
  assert.match(home, /name="msvalidate\.01" content="D213E7787F1AED0C57F6EE1F7C5A2A50"/);
});

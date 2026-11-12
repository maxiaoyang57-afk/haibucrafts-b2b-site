import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const previewRoot = path.join(root, 'v2-preview');

test('blog library publishes twenty-two linked buyer guides', async () => {
  const seoMap = JSON.parse(await readFile(path.join(previewRoot, 'seo-production-map.json'), 'utf8'));
  const routes = seoMap.routes.filter((route) => route.generatedBlog);
  assert.equal(routes.length, 22);

  const hub = await readFile(path.join(previewRoot, 'blog', 'index.html'), 'utf8');
  assert.equal((hub.match(/class="blog-guide-card"/g) || []).length, 22);

  for (const route of routes) {
    const relative = route.previewPath.slice('/v2-preview/'.length);
    const file = path.join(previewRoot, relative, 'index.html');
    await access(file);
    const html = await readFile(file, 'utf8');
    assert.match(html, /type="application\/ld\+json"/);
    assert.match(html, /"@type":"BlogPosting"/);
    assert.match(html, /class="blog-article-body"/);
    const inquirySources = {
      'wholesale-resin-charms-for-phone-cases': 'phone-case-resin-charms-guide',
      'keychain-bag-charm-components-sourcing-guide': 'keychain-components-guide',
      'source-craft-supplies-from-reference-photos': 'photo-sourcing-guide',
      'strawberry-polymer-clay-slices-wholesale': 'strawberry-slices-blog',
      'polymer-clay-slice-buying-guide': 'polymer-liquid-samples'
    };
    const slug = path.basename(relative);
    assert.match(html, new RegExp(`source=${inquirySources[slug] || 'blog'}(?:&amp;|")`));
  }
});

test('seasonal planning checklist is singular and its sticky card keeps the CTA above clipped overflow', async () => {
  const article = await readFile(path.join(previewRoot, 'blog', 'seasonal-craft-assortment-planning', 'index.html'), 'utf8');
  const checklist = article.match(/<ul class="checklist">([\s\S]*?)<\/ul>/)?.[1] ?? '';
  const styles = await readFile(path.join(root, 'assets', 'v2', 'blog-library.css'), 'utf8');

  assert.equal((checklist.match(/<li>/g) || []).length, 6);
  assert.equal((checklist.match(/Shipping responsibility/g) || []).length, 1);
  assert.match(styles, /\.blog-checklist-card\{[^}]*isolation:isolate;overflow:hidden/);
  assert.match(styles, /\.blog-checklist-card \.btn\{position:relative;z-index:1/);
});

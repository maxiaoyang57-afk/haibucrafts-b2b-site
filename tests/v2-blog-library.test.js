import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const previewRoot = path.join(root, 'v2-preview');

test('blog library publishes ten linked buyer guides', async () => {
  const seoMap = JSON.parse(await readFile(path.join(previewRoot, 'seo-production-map.json'), 'utf8'));
  const routes = seoMap.routes.filter((route) => route.generatedBlog);
  assert.equal(routes.length, 10);

  const hub = await readFile(path.join(previewRoot, 'blog', 'index.html'), 'utf8');
  assert.equal((hub.match(/class="blog-guide-card"/g) || []).length, 10);

  for (const route of routes) {
    const relative = route.previewPath.slice('/v2-preview/'.length);
    const file = path.join(previewRoot, relative, 'index.html');
    await access(file);
    const html = await readFile(file, 'utf8');
    assert.match(html, /type="application\/ld\+json"/);
    assert.match(html, /"@type":"BlogPosting"/);
    assert.match(html, /class="blog-article-body"/);
    assert.match(html, /source=blog/);
  }
});

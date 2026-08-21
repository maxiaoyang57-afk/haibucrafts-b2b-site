import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const previewRoot = path.join(root, 'v2-preview');

const read = (relativePath) => readFile(path.join(previewRoot, relativePath), 'utf8');
const escapeHtml = (value) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function structuredData(html) {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((match) => JSON.parse(match[1]));
}

test('homepage identifies the HAIBUCRAFT website and organization', async () => {
  const graphs = structuredData(await read('index.html')).flatMap((entry) => entry['@graph'] || [entry]);
  const website = graphs.find((entry) => entry['@type'] === 'WebSite');
  const organization = graphs.find((entry) => entry['@type'] === 'Organization');
  assert.equal(website?.name, 'HAIBUCRAFT');
  assert.equal(website?.publisher?.['@id'], 'https://www.haibucrafts.com/#organization');
  assert.equal(organization?.email, 'sale008@sola-craft.com');
  assert.equal(organization?.address?.addressLocality, 'Yiwu');
});

test('all buyer guides show matching author and scope-review information', async () => {
  const blogRoot = path.join(previewRoot, 'blog');
  const directories = (await readdir(blogRoot, { withFileTypes: true })).filter((entry) => entry.isDirectory());
  assert.equal(directories.length, 10);

  for (const directory of directories) {
    const html = await read(path.join('blog', directory.name, 'index.html'));
    const posting = structuredData(html).find((entry) => entry['@type'] === 'BlogPosting');
    assert.equal(posting?.author?.name, 'HAIBUCRAFT Buyer Resources');
    assert.equal(posting?.author?.url, 'https://www.haibucrafts.com/about/editorial-policy/');
    assert.equal(posting?.reviewedBy?.name, 'HAIBUCRAFT Product & Quality Coordination');
    assert.equal(posting?.dateModified, '2026-08-06');
    assert.match(html, /By <a href="\/v2-preview\/about\/editorial-policy\/">HAIBUCRAFT Buyer Resources<\/a>/);
    assert.match(html, /Scope reviewed by/);
    assert.match(html, /Last reviewed August 6, 2026/);
  }
});

test('editorial policy is indexable in the production package and linked from About', async () => {
  const policy = await read(path.join('about', 'editorial-policy', 'index.html'));
  const about = await read(path.join('about', 'index.html'));
  const seoMap = JSON.parse(await read('seo-production-map.json'));
  const migrationMap = JSON.parse(await read(path.join('production-config', 'file-migration-map.json')));
  const sitemap = await read(path.join('production-config', 'sitemap.xml'));

  assert.match(policy, /Content owner/);
  assert.match(policy, /Review boundary/);
  assert.match(policy, /Updates and corrections/);
  assert.match(about, /data-editorial-trust/);
  assert.ok(seoMap.routes.some((route) => route.productionPath === '/about/editorial-policy/' && route.index));
  assert.ok(migrationMap.pages.some((page) => page.productionPath === '/about/editorial-policy/'));
  assert.match(sitemap, /https:\/\/www\.haibucrafts\.com\/about\/editorial-policy\//);
});

test('category source titles are concise and match approved search intent', async () => {
  const expected = new Map([
    ['products/slime-charms/index.html', 'Bulk Slime Charms Wholesale Supplier | HAIBUCRAFT'],
    ['products/polymer-clay-slices/index.html', 'Wholesale Polymer Clay Slices & Sprinkles | HAIBUCRAFT'],
    ['products/resin-charms/index.html', 'Bulk Resin Charms Wholesale for Slime & Crafts | HAIBUCRAFT']
  ]);

  for (const [file, title] of expected) {
    const html = await read(file);
    const renderedTitle = escapeHtml(title);
    assert.match(html, new RegExp(`<title>${escapeRegex(renderedTitle)}</title>`));
    assert.ok(title.length >= 25 && title.length <= 65);
  }
});

test('seasonal slime collection pages use real catalog products and indexable production routes', async () => {
  const seoMap = JSON.parse(await read('seo-production-map.json'));
  const sitemap = await read(path.join('production-config', 'sitemap.xml'));
  const collections = [
    ['halloween-slime-charms', 'Halloween Slime Charms Wholesale'],
    ['christmas-slime-charms', 'Christmas Slime Charms Wholesale']
  ];

  for (const [slug, h1] of collections) {
    const html = await read(path.join('products', 'slime-charms', slug, 'index.html'));
    const productionPath = `/products/slime-charms-wholesale/${slug}/`;
    assert.match(html, new RegExp(`<h1>${h1}</h1>`));
    assert.match(html, /"@type":"ItemList"/);
    assert.ok(seoMap.routes.some((route) => route.productionPath === productionPath && route.index === true));
    assert.equal(sitemap.split(`<loc>https://www.haibucrafts.com${productionPath}</loc>`).length - 1, 1);
  }
});

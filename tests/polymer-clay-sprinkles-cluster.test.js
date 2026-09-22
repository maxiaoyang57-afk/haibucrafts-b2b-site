import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const production = path.join('products','polymer-clay-slices-wholesale','polymer-clay-sprinkles-wholesale','index.html');
const preview = path.join('v2-preview','products','polymer-clay-slices','polymer-clay-sprinkles-wholesale','index.html');
const canonical = 'https://www.haibucrafts.com/products/polymer-clay-slices-wholesale/polymer-clay-sprinkles-wholesale/';
const skus = ['YX3318','YX3603','YX4002','YX4010','YX4012','YX4019','YX4138','YX421','YX660','YX097'];

test('polymer clay sprinkles collection is indexable in production and noindex in preview', async () => {
  const live = await readFile(path.join(root, production), 'utf8');
  const prev = await readFile(path.join(root, preview), 'utf8');
  assert.match(live, /<title>Polymer Clay Sprinkles Wholesale \| HAIBUCRAFT<\/title>/);
  assert.match(live, /<h1>Polymer Clay Sprinkles Wholesale<\/h1>/);
  assert.ok(live.includes(`<link rel="canonical" href="${canonical}">`));
  assert.ok(!live.includes('noindex,nofollow'));
  assert.match(prev, /<meta name="robots" content="noindex,nofollow">/);
  for (const sku of skus) {
    assert.ok(live.includes(sku), `production missing ${sku}`);
    assert.ok(prev.includes(sku), `preview missing ${sku}`);
  }
  assert.match(live, /"@type":"FAQPage"/);
  assert.match(live, /"@type":"ItemList"/);
  assert.match(live, /There is no blanket MOQ for every sprinkle mix/);
});

test('relevant hubs link to the sprinkles collection', async () => {
  const liveHref='/products/polymer-clay-slices-wholesale/polymer-clay-sprinkles-wholesale/';
  const previewHref='/v2-preview/products/polymer-clay-slices/polymer-clay-sprinkles-wholesale/';
  const cases=[
    ['products/polymer-clay-slices-wholesale/index.html',liveHref],
    ['themes/food-and-treats/index.html',liveHref],
    ['themes/fruit/index.html',liveHref],
    ['themes/holiday/index.html',liveHref],
    ['blog/polymer-clay-slice-buying-guide/index.html',liveHref],
    ['v2-preview/products/polymer-clay-slices/index.html',previewHref],
    ['v2-preview/themes/food-and-treats/index.html',previewHref],
    ['v2-preview/themes/fruit/index.html',previewHref],
    ['v2-preview/themes/holiday/index.html',previewHref],
    ['v2-preview/blog/polymer-clay-slice-buying-guide/index.html',previewHref]
  ];
  for(const [relative,href] of cases){
    const html=await readFile(path.join(root,relative),'utf8');
    assert.ok(html.includes(href), `${relative} missing sprinkles collection link`);
  }
});

test('SEO map sitemap and AI discovery expose the sprinkles collection', async () => {
  const map=JSON.parse(await readFile(path.join(root,'v2-preview','seo-production-map.json'),'utf8'));
  const route=map.routes.find(row=>row.productionPath==='/products/polymer-clay-slices-wholesale/polymer-clay-sprinkles-wholesale/');
  assert.ok(route);
  assert.equal(route.title,'Polymer Clay Sprinkles Wholesale | HAIBUCRAFT');
  assert.equal(route.lastModified,'2026-09-22');

  for(const relative of ['sitemap.xml',path.join('v2-preview','production-config','sitemap.xml')]){
    const xml=await readFile(path.join(root,relative),'utf8');
    assert.ok(xml.includes(`<loc>${canonical}</loc><lastmod>2026-09-22</lastmod>`));
  }
  for(const relative of ['llms.txt',path.join('v2-preview','production-config','llms.txt')]){
    const txt=await readFile(path.join(root,relative),'utf8');
    assert.ok(txt.includes('Polymer clay sprinkles wholesale: '+canonical));
  }
  const builder=await readFile(path.join(root,'scripts','build-v2-ai-discovery.mjs'),'utf8');
  assert.ok(builder.includes('/products/polymer-clay-slices-wholesale/polymer-clay-sprinkles-wholesale/'));
});

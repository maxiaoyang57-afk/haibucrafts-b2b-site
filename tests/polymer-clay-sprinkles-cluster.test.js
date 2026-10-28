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
  assert.equal(route.lastModified,'2026-10-28');

  for(const relative of ['sitemap.xml',path.join('v2-preview','production-config','sitemap.xml')]){
    const xml=await readFile(path.join(root,relative),'utf8');
    assert.ok(xml.includes(`<loc>${canonical}</loc><lastmod>2026-10-28</lastmod>`));
  }
  for(const relative of ['llms.txt',path.join('v2-preview','production-config','llms.txt')]){
    const txt=await readFile(path.join(root,relative),'utf8');
    assert.ok(txt.includes('Polymer clay sprinkles wholesale: '+canonical));
  }
  const builder=await readFile(path.join(root,'scripts','build-v2-ai-discovery.mjs'),'utf8');
  assert.ok(builder.includes('/products/polymer-clay-slices-wholesale/polymer-clay-sprinkles-wholesale/'));
});

test('sprinkles cards retain exact catalog inquiry context and scoped sample guidance', async () => {
  const catalog=JSON.parse(await readFile(path.join(root,'assets/v2/product-catalog.json'),'utf8')).products;
  for(const relative of [production,preview]){
    const html=await readFile(path.join(root,relative),'utf8');
    const links=[...html.matchAll(/data-sprinkle-quote="([^"]+)" href="([^"]+)"/g)];
    assert.equal(links.length,10);
    assert.deepEqual(links.map(m=>m[1]),skus);
    const isPreview=relative===preview;
    const collectionPath=isPreview?'/v2-preview/products/polymer-clay-slices/polymer-clay-sprinkles-wholesale/':new URL(canonical).pathname;
    for(const [,sku,href] of links){
      const product=catalog.find(p=>p.sku===sku&&p.category==='polymer-clay-slices');
      const url=new URL(href.replaceAll('&amp;','&'),'https://www.haibucrafts.com');
      assert.equal(url.pathname,isPreview?'/v2-preview/quote/':'/request-quote/');
      for(const [key,value] of Object.entries({source:'polymer-sprinkles-sku',product_code:sku,product:product.title,image:product.image,category:product.category,landing_page:collectionPath,source_page:collectionPath,product_page:isPreview?product.previewPath:product.productionPath}))assert.equal(url.searchParams.get(key),value,sku+': '+key);
    }
    assert.match(html,/Approve the product and the pack separately/);
    assert.match(html,/does not establish long-term liquid compatibility/);
    assert.match(html,/polymer-clay-slice-buying-guide\/#liquid-filled-tumblers/);
    const graphs=[...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(m=>JSON.parse(m[1])).flatMap(o=>o['@graph']||[o]);
    const faq=graphs.find(o=>o['@type']==='FAQPage').mainEntity.find(o=>o.name==='Can these sprinkles be used in a liquid-filled tumbler?');
    assert.ok(faq);
    assert.ok(html.includes('<p>'+faq.acceptedAnswer.text+'</p>'));
  }
});

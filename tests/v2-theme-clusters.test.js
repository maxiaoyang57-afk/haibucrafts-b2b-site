import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const read=(file)=>readFileSync(path.join(root,file),'utf8');
const clusters=['food-and-treats','nature-inspired','seasonal-and-lifestyle','cute-originals'];
const themes=['fruit','bakery','ocean','floral','holiday','western','cute-animal','generic-kawaii'];

test('theme library publishes four clusters and eight release routes',()=>{
  const map=JSON.parse(read('v2-preview/seo-production-map.json'));
  for (const slug of [...clusters,...themes]) {
    assert.ok(map.routes.some((route)=>route.productionPath===`/themes/${slug}/`&&route.index));
    const html=read(`v2-preview/themes/${slug}/index.html`);
    assert.equal((html.match(/<h1\b/g)||[]).length,1);
  }
  assert.ok(map.routes.some((route)=>route.productionPath==='/themes/'&&route.index));
});

test('theme pages use exact products and keep western custom-only',()=>{
  assert.match(read('v2-preview/themes/fruit/index.html'),/YX778/);
  assert.match(read('v2-preview/themes/floral/index.html'),/SLM10008/);
  assert.match(read('v2-preview/themes/ocean/index.html'),/SLM10019/);
  assert.match(read('v2-preview/themes/western/index.html'),/No current catalog SKU is represented as a western stock item/);
  assert.doesNotMatch(read('v2-preview/themes/western/index.html'),/theme-product-card/);
});

test('sitemap has exact theme URLs with lastmod and no priority hints',()=>{
  const sitemap=read('v2-preview/production-config/sitemap.xml');
  for (const slug of ['',...clusters,...themes]) {
    const loc=`<loc>https://www.haibucrafts.com/themes/${slug?`${slug}/`:''}</loc>`;
    assert.equal(sitemap.split(loc).length-1,1);
  }
  assert.match(sitemap,/<lastmod>2026-08-23<\/lastmod>/);
  assert.doesNotMatch(sitemap,/<priority>|<changefreq>/);
});

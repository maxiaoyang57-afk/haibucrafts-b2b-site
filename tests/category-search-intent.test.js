import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), 'utf8');

const pairs = {
  polymer: [
    'v2-preview/products/polymer-clay-slices/index.html',
    'products/polymer-clay-slices-wholesale/index.html'
  ],
  slime: [
    'v2-preview/products/slime-charms/index.html',
    'products/slime-charms-wholesale/index.html'
  ],
  resin: [
    'v2-preview/products/resin-charms/index.html',
    'products/resin-charms-for-slime/index.html'
  ]
};

test('category hubs preserve titles while clarifying buyer intent', async () => {
  for (const file of pairs.slime) {
    const html = await read(file);
    assert.match(html, /<title>Wholesale Slime Charms in Bulk \| HAIBUCRAFT<\/title>/);
    assert.match(html, /Bulk slime charms for slime brands, sensory kits and retail assortments\./);
    assert.match(html, /Use this page when the buying intent is decorative charms and add-ins for slime or sensory-kit programs\./);
    assert.match(html, /Resin Flatbacks &amp; Cabochons/);
  }

  for (const file of pairs.resin) {
    const html = await read(file);
    assert.match(html, /<title>Resin Charms Wholesale &(?:amp;)? Bulk Flatbacks \| HAIBUCRAFT<\/title>/);
    assert.match(html, /Bulk resin flatbacks and cabochons for decoden and craft decoration\./);
    assert.match(html, /For slime-specific charm assortments, use the Slime Charms hub instead\./);
    assert.match(html, /Slime Charms for Slime Brands/);
    assert.match(html, /Source resin charms wholesale and bulk flatback cabochons for decoden, phone-case, hair-accessory and DIY programs\./);
  }

  for (const file of pairs.polymer) {
    const html = await read(file);
    assert.match(html, /Polymer Clay Slices Wholesale for Slime \| HAIBUCRAFT/);
    assert.match(html, /Source wholesale polymer clay slices and bulk polymer clay sprinkles/);
    assert.match(html, /Wholesale polymer clay slices and sprinkles for repeatable craft programs\./);
  }
});

test('updated category hubs advertise a fresh lastmod in sitemap', async () => {
  const sitemap = await read('sitemap.xml');
  for (const url of [
    'https://www.haibucrafts.com/products/polymer-clay-slices-wholesale/',
    'https://www.haibucrafts.com/products/slime-charms-wholesale/',
    'https://www.haibucrafts.com/products/resin-charms-for-slime/'
  ]) {
    assert.ok(sitemap.includes(`<loc>${url}</loc><lastmod>2026-09-25</lastmod>`), `missing fresh sitemap date for ${url}`);
  }
});

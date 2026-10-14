import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { customizationGuide } from '../scripts/content/customization-guide.mjs';

const slug = customizationGuide.slug;
const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');

for (const prefix of ['', 'v2-preview/']) {
  test(`${prefix || 'production/'} custom development guide has both material routes and decision records`, async () => {
    const html = await read(`${prefix}blog/${slug}/index.html`);
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    assert.equal((html.match(/class="custom-approval-note"/g) || []).length, 3);
    assert.doesNotMatch(html, /custom-stage-handoff|<dt>Stage output|<dt>Your decision/);
    assert.match(html, /<picture><source media="\(max-width: 800px\)"/);
    assert.match(html, /diagrams\/haibu-custom-order-flow-mobile\.svg/);
    assert.match(html, /diagrams\/haibu-custom-order-flow\.svg/);
    for (const [, , stage] of customizationGuide.sections) assert.ok(html.includes(`id="${stage.id}"`));
    assert.match(html, /Not every polymer clay project needs a 3D model or a new mold/);
    assert.match(html, /Existing tooling may avoid that step/);
    assert.match(html, /Sample approval does not place a bulk order/);
    assert.match(html, /exact SKU, material, project and destination market/);
    assert.match(html, /do not establish safety certification/);
    assert.match(html, /Process illustration\. Steps and terms/);
    assert.doesNotMatch(html, /Emily|Carter|QULA|testimonial|infant|food.safe|non.toxic/i);
    assert.match(html, /source=blog(?:&amp;|&)article=custom-resin-polymer-clay-development-process/);
    const article = html.match(/<article class="blog-article-body">([\s\S]*?)<\/article>/)?.[1] || '';
    const wordCount = article.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    assert.ok(wordCount >= 1200 && wordCount <= 1800, `Detailed article length: ${wordCount}`);
  });
  test(`${prefix || 'production/'} OEM service links both materials to the detailed guide`, async () => {
    const html = await read(`${prefix}custom-solutions/index.html`);
    assert.match(html, /id="material-routes"/);
    assert.match(html, /Resin customization/);
    assert.match(html, /Polymer clay customization/);
    assert.match(html, /not every design needs a 3D model or mold/);
    assert.match(html, new RegExp(`href="/${prefix}blog/${slug}/"`));
    assert.match(html, /source=custom-resin-service/);
    assert.match(html, /source=custom-polymer-service/);
    assert.match(html, /blog-library\.css/);
  });
}

test('custom guide is discoverable with its canonical URL, metadata and date', async () => {
  const html = await read(`blog/${slug}/index.html`);
  assert.match(html, new RegExp(`<link rel="canonical" href="https://www.haibucrafts.com/blog/${slug}/">`));
  assert.match(html, /name="robots" content="index,follow"/);
  assert.match(html, /"datePublished":"2026-10-14"/);
  assert.match(html, /"dateModified":"2026-10-14"/);
  assert.match(await read('sitemap.xml'), new RegExp(`<loc>https://www.haibucrafts.com/blog/${slug}/</loc><lastmod>2026-10-14</lastmod>`));
  for (const page of ['index', 'resin-charms-wholesale-buying-guide/index', 'polymer-clay-slice-buying-guide/index']) {
    assert.match(await read(`blog/${page}.html`), new RegExp(`/blog/${slug}/`));
  }
});

test('HAIBU process drawings connect two material routes to sample approval and fulfillment', async () => {
  for (const name of ['haibu-custom-order-flow.svg', 'haibu-custom-order-flow-mobile.svg']) {
    const source = await read(`v2-preview/assets/diagrams/${name}`);
    assert.equal(source, await read(`assets/v2/diagrams/${name}`));
    assert.match(source, /<svg[^>]+aria-labelledby="title desc"/);
    assert.match(source, /marker-end:url\(#arrow\)/);
    assert.match(source, /Resin/);
    assert.match(source, /Polymer clay/);
    assert.match(source, /Written approval|Approve the final version in writing/);
    assert.match(source, /Revise and resample/);
    assert.doesNotMatch(source, /<image|data:image|QULA|Stage output|Your decision/);
  }
});

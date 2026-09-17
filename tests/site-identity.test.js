import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const origin = 'https://www.haibucrafts.com';
const map = JSON.parse(await readFile('v2-preview/seo-production-map.json', 'utf8'));
function organizations(value, found = []) {
  if (!value || typeof value !== 'object') return found;
  if (value['@type'] === 'Organization') found.push(value);
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) child.forEach((item) => organizations(item, found));
    else organizations(child, found);
  }
  return found;
}

test('every routed page and nested HAIBU publisher has a consistent logo and public contact', async () => {
  for (const route of map.routes) {
    for (const page of [route.previewPath, route.productionPath]) {
      const html = await readFile(`.${page}index.html`, 'utf8');
      const entries = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
        .flatMap((match) => organizations(JSON.parse(match[1])));
      const company = entries.find((entry) => entry['@id'] === `${origin}/#organization`);
      assert.ok(company, `${page}: missing canonical organization`);
      assert.equal(company.email, 'sales@haibucrafts.com', page);
      assert.equal(company.contactPoint.email, company.email, page);
      for (const entry of entries.filter((item) => /^HAIBUCRAFT/.test(item.name))) {
        assert.equal(entry.logo, `${origin}/brand/haibu-logo-header.png`, page);
      }
      assert.ok(!html.includes('sale008@sola-craft.com'), `${page}: obsolete public email`);
    }
  }
});

test('sitemap article dates agree with the published article revision dates', async () => {
  const sitemap = await readFile('sitemap.xml', 'utf8');
  for (const route of map.routes.filter((entry) => entry.generatedBlog)) {
    const html = await readFile(`.${route.productionPath}index.html`, 'utf8');
    const posting = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
      .map((match) => JSON.parse(match[1])).find((entry) => entry['@type'] === 'BlogPosting');
    const block = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)]
      .map((match) => match[1]).find((entry) => entry.includes(`<loc>${origin}${route.productionPath}</loc>`));
    assert.ok(block.includes(`<lastmod>${posting.dateModified}</lastmod>`), route.productionPath);
  }
});

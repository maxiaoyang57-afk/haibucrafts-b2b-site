import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const origin = 'https://www.haibucrafts.com';

const expectedRedirects = new Map([
  ['/index.html', '/'],
  ['/products/index.html', '/products/'],
  ['/blog/index.html', '/blog/'],
  ['/about/index.html', '/about/'],
  ['/custom-services/', '/custom-solutions/'],
  ['/custom-services/index.html', '/custom-solutions/'],
  ['/quote/', '/request-quote/'],
  ['/quote/index.html', '/request-quote/'],
  ['/request-quote/index.html', '/request-quote/'],
  ['/products/resin-charms-for-slime.html', '/products/resin-charms-for-slime/'],
  ['/products/sequins-glitter-confetti.html', '/products/sequins-glitter-confetti/'],
  ['/blog/polymer-clay-slices-buying-guide.html', '/blog/polymer-clay-slice-buying-guide/'],
  ['/privacy.html', '/privacy/'],
  ['/about/b2b-export-supplier.html', '/about/'],
  ['/products/plastic-sequins-wholesale.html', '/products/sequins-glitter-confetti/'],
  ['/products/resin-charms-wholesale.html', '/products/resin-charms-for-slime/'],
  ['/products/slime-charms-wholesale.html', '/products/slime-charms-wholesale/'],
  ['/products/polymer-clay-slices-wholesale.html', '/products/polymer-clay-slices-wholesale/'],
  ['/haibu-manufacturing/', '/manufacturing/'],
  ['/haibu-quality-control/', '/quality-control/']
]);

test('robots allows the noindex quote route to be crawled', async () => {
  const intended = `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /v2-preview/\n\nSitemap: ${origin}/sitemap.xml\n`;
  const rootRobots = (await readFile(path.join(root, 'robots.txt'), 'utf8')).replaceAll('\r\n', '\n');
  const sourceRobots = (await readFile(path.join(root, 'v2-preview', 'production-config', 'robots.txt'), 'utf8')).replaceAll('\r\n', '\n');

  assert.equal(rootRobots, intended);
  assert.equal(sourceRobots, intended);
  assert.doesNotMatch(rootRobots, /Disallow:\s*\/request-quote\//);
});

test('production components use canonical routes and versioned dynamic assets', async () => {
  const components = await readFile(path.join(root, 'assets', 'v2', 'components.js'), 'utf8');
  for (const route of [
    'products/slime-charms-wholesale/',
    'products/polymer-clay-slices-wholesale/',
    'products/resin-charms-for-slime/',
    'products/sequins-glitter-confetti/',
    'custom-solutions/',
    'manufacturing/',
    'quality-control/',
    'certificates/',
    'about/',
    'blog/',
    'request-quote/'
  ]) assert.ok(components.includes(route), `missing ${route}`);

  for (const legacy of ['products/slime-charms/', 'products/polymer-clay-slices/', 'products/resin-charms/', '${ROOT}quote/', 'custom-services/']) {
    assert.ok(!components.includes(legacy), `legacy route remains: ${legacy}`);
  }
  assert.match(components, /const ASSET_ROOT = '\/assets\/v2\/'/);
  assert.match(components, /footer-related-v2\.css/);
  assert.match(components, /accessibility\.css/);
  assert.doesNotMatch(components, /Preview branch|Not published to production|preview structure/i);
});

test('legacy migrations are explicit permanent one-hop redirects', async () => {
  for (const relative of ['vercel.json', path.join('v2-preview', 'production-config', 'vercel-redirects.json')]) {
    const config = JSON.parse(await readFile(path.join(root, relative), 'utf8'));
    const redirects = new Map(config.redirects.map((redirect) => [redirect.source, redirect]));
    assert.equal(redirects.size, config.redirects.length, `${relative} has duplicate sources`);
    for (const [source, destination] of expectedRedirects) {
      assert.equal(redirects.get(source)?.destination, destination, `${relative}: ${source}`);
      assert.equal(redirects.get(source)?.permanent, true, `${relative}: ${source} must be permanent`);
    }
    for (const redirect of redirects.values()) {
      assert.equal(redirects.has(redirect.destination), false, `${relative}: redirect chain through ${redirect.destination}`);
    }
  }
});

test('privacy has a canonical production route and sitemap follows the SEO map exactly', async () => {
  const seoMap = JSON.parse(await readFile(path.join(root, 'v2-preview', 'seo-production-map.json'), 'utf8'));
  const privacy = seoMap.routes.find((route) => route.productionPath === '/privacy/');
  assert.ok(privacy?.index);
  assert.equal(privacy.previewPath, '/v2-preview/privacy/');

  const sitemap = await readFile(path.join(root, 'v2-preview', 'production-config', 'sitemap.xml'), 'utf8');
  const actual = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const expected = seoMap.routes.filter((route) => route.index).map((route) => `${origin}${route.productionPath}`);
  assert.deepEqual(new Set(actual), new Set(expected));
  assert.equal(actual.length, new Set(actual).size);
  assert.ok(!actual.some((url) => /request-quote|404|v2-preview|index\.html|\?/.test(url)));
});

test('release audit contains canonical, sitemap, legacy-link, landing-page and 404 gates', async () => {
  const audit = await readFile(path.join(root, 'scripts', 'audit-v2-release-candidate.mjs'), 'utf8');
  for (const marker of [
    'expected exactly one canonical',
    'canonical must equal',
    'sitemap contains duplicate URLs',
    'sitemap contains a redirect, noindex or unknown URL',
    'production internal link uses legacy route',
    'inquiry landing_page contains a preview path',
    'custom HAIBUCRAFT 404 content is missing',
    'catch-all redirect could mask real 404 behavior'
  ]) assert.ok(audit.includes(marker), `missing audit gate: ${marker}`);
});

import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const categories = [
  'polymer-clay-slices-wholesale',
  'resin-charms-for-slime',
  'sequins-glitter-confetti',
  'slime-charms-wholesale'
];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

test('legacy category files cannot shadow clean production routes', async () => {
  for (const slug of categories) {
    const cleanRoute = path.join(root, 'products', slug, 'index.html');
    const legacyFile = path.join(root, 'products', `${slug}.html`);

    assert.equal(await exists(cleanRoute), true, `${slug} clean route must exist`);
    assert.equal(
      await exists(legacyFile),
      false,
      `${slug}.html shadows /products/${slug}/ when Vercel cleanUrls is enabled`
    );
  }
});

test('production category pages use V2 assets, cards and inquiry routes', async () => {
  for (const slug of categories) {
    const html = await readFile(path.join(root, 'products', slug, 'index.html'), 'utf8');

    assert.match(html, /class="product-card-v2"/);
    assert.match(html, /src="\/assets\/(?:images|v2)\//);
    assert.match(html, /href="\/request-quote\/\?/);
    assert.doesNotMatch(html, /(?:href|src)="\.\.\//);
    assert.doesNotMatch(html, /(?:href|src)="\/products\/assets\//);
  }
});

test('legacy category URLs still have explicit redirects', async () => {
  const config = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'));
  const redirects = new Map(config.redirects.map((redirect) => [redirect.source, redirect.destination]));

  for (const slug of categories) {
    assert.equal(
      redirects.get(`/products/${slug}.html`),
      `/products/${slug}/`
    );
  }
});

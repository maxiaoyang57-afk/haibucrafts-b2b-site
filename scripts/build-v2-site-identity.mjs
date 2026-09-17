import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Run after page generators, so rebuilding cannot restore an obsolete public email.
const origin = 'https://www.haibucrafts.com';
const logo = `${origin}/brand/haibu-logo-header.png`;
const organization = {
  '@type': 'Organization',
  '@id': `${origin}/#organization`,
  name: 'HAIBUCRAFT',
  url: `${origin}/`,
  logo,
  email: 'sales@haibucrafts.com',
  address: { '@type': 'PostalAddress', addressLocality: 'Yiwu', addressRegion: 'Zhejiang', addressCountry: 'CN' },
  contactPoint: { '@type': 'ContactPoint', contactType: 'sales', email: 'sales@haibucrafts.com', availableLanguage: ['en', 'zh'] }
};
const root = path.join(process.cwd(), 'v2-preview');
const seoMap = JSON.parse(await readFile(path.join(root, 'seo-production-map.json'), 'utf8'));
const json = (value) => JSON.stringify(value).replaceAll('<', '\\u003c');

for (const route of seoMap.routes) {
  const file = path.join(root, route.previewPath.slice('/v2-preview/'.length), 'index.html');
  let html = await readFile(file, 'utf8');
  let hasOrganization = false;
  const normalize = (node) => {
    if (!node || typeof node !== 'object') return;
    if (node['@type'] === 'Organization' && /^HAIBUCRAFT(?:$| )/.test(node.name || '')) {
      node.logo = logo;
      if (node.name === 'HAIBUCRAFT' || node['@id'] === organization['@id']) {
        Object.assign(node, structuredClone(organization));
        hasOrganization = true;
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(normalize);
      else if (value && typeof value === 'object') normalize(value);
    }
  };
  html = html.replace(/<script type="application\/ld\+json"([^>]*)>([\s\S]*?)<\/script>/g, (_full, attrs, body) => {
    const data = JSON.parse(body);
    normalize(data);
    return `<script type="application/ld+json"${attrs}>${json(data)}</script>`;
  });
  if (!hasOrganization) {
    html = html.replace('</head>', `<script type="application/ld+json" data-site-identity>${json({ '@context': 'https://schema.org', ...organization })}</script>\n</head>`);
  }
  await writeFile(file, html, 'utf8');
}
console.log(`Synchronized HAIBU organization, logo and public contact across ${seoMap.routes.length} pages.`);

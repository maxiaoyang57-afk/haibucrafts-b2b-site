import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const siteUrl = 'https://www.haibucrafts.com';
const contactEmail = 'sale008@sola-craft.com';
const today = '2026-07-18';
const redirectPages = new Set([
  'products/resin-charms-wholesale.html',
  'products/plastic-sequins-wholesale.html'
]);

const walk = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const location = path.join(directory, entry.name);
  if (entry.name === 'node_modules' || entry.name === '.git') return [];
  return entry.isDirectory() ? walk(location) : [location];
});
const allFiles = walk(root);
const htmlFiles = allFiles.filter(file => file.endsWith('.html'));
const webpBasenames = new Set(allFiles.filter(file => file.endsWith('.webp')).map(file => path.basename(file, '.webp')));
const escapeXml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const canonicalPath = relative => {
  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html')) return `/${relative.slice(0, -'index.html'.length)}`;
  return `/${relative}`;
};

for (const file of allFiles) {
  if (!/\.(?:html|js|css|xml|md|txt)$/i.test(file)) continue;
  let source = fs.readFileSync(file, 'utf8');
  source = source
    .replaceAll('sales@haibucraft.com', contactEmail)
    .replaceAll('https://www.haibucraft.com', siteUrl)
    .replaceAll('https://haibucraft.com', siteUrl)
    .replaceAll('https://www.newsolastore.com', siteUrl)
    .replaceAll('https://newsolastore.com', siteUrl)
    .replaceAll('https://www.yourdomain.com', siteUrl)
    .replaceAll('newsolastore.com', 'haibucrafts.com')
    .replaceAll('The static email form cannot attach files automatically. Attach the file manually after your email application opens.', 'Your file is uploaded when you submit this form and included with the inquiry as a secure link.');
  for (const basename of webpBasenames) source = source.replaceAll(`${basename}.png`, `${basename}.webp`);
  fs.writeFileSync(file, source);
}

for (const file of htmlFiles) {
  const relative = path.relative(root, file).replaceAll(path.sep, '/');
  let source = fs.readFileSync(file, 'utf8').replace(/<!-- deployment-seo:start -->[\s\S]*?<!-- deployment-seo:end -->/g, '');
  source = source
    .replace(/<img\b(?![^>]*\balt=)([^>]*)>/gi, '<img alt=""$1>')
    .replace(/<\/img>/gi, '');

  if (relative === '404.html') {
    source = source
      .replace(/<(a|link)([^>]+)(href)="(?!https?:|mailto:|\/)([^"]+)"/g, '<$1$2$3="/$4"')
      .replace(/<(img|script)([^>]+)(src)="(?!https?:|\/)([^"]+)"/g, '<$1$2$3="/$4"');
    const block = '<!-- deployment-seo:start --><meta name="robots" content="noindex,follow"><link rel="icon" type="image/png" href="/assets/images/favicon-64.png"><!-- deployment-seo:end -->';
    source = source.replace('</head>', `${block}</head>`);
    fs.writeFileSync(file, source);
    continue;
  }

  if (!redirectPages.has(relative)) {
    const title = (source.match(/<title>([^<]*)<\/title>/i)?.[1] || 'Wholesale Craft Supplies').trim();
    const descriptionTag = source.match(/<meta\b[^>]*name="description"[^>]*>/i)?.[0] || '';
    const description = (descriptionTag.match(/content="([^"]*)"/i)?.[1] || 'Factory-direct wholesale craft supplies and custom sourcing support.').trim();
    const canonical = `${siteUrl}${canonicalPath(relative)}`;
    const type = relative.startsWith('blog/') && relative !== 'blog/index.html' ? 'article' : relative.startsWith('products/items/') ? 'product' : 'website';
    const block = [
      '<!-- deployment-seo:start -->',
      `<link rel="canonical" href="${canonical}">`,
      '<link rel="icon" type="image/png" href="/assets/images/favicon-64.png">',
      `<meta property="og:type" content="${type}">`,
      `<meta property="og:site_name" content="HAIBU CRAFT">`,
      `<meta property="og:title" content="${escapeXml(title)}">`,
      `<meta property="og:description" content="${escapeXml(description)}">`,
      `<meta property="og:url" content="${canonical}">`,
      `<meta property="og:image" content="${siteUrl}/assets/images/hero/slime-charms-b2b-banner.webp">`,
      '<meta name="twitter:card" content="summary_large_image">',
      `<meta name="twitter:title" content="${escapeXml(title)}">`,
      `<meta name="twitter:description" content="${escapeXml(description)}">`,
      `<meta name="twitter:image" content="${siteUrl}/assets/images/hero/slime-charms-b2b-banner.webp">`,
      '<!-- deployment-seo:end -->'
    ].join('');
    source = source.replace('</head>', `${block}</head>`);
  }

  if (!source.includes('data-privacy-link')) {
    source = source.replace('<div class="copy">', '<div class="copy"><a data-privacy-link href="/privacy.html">Privacy Policy</a> · ');
  }

  fs.writeFileSync(file, source);
}

const homepagePath = path.join(root, 'index.html');
let homepage = fs.readFileSync(homepagePath, 'utf8');
let homecardIndex = 0;
homepage = homepage.replace(/<img\b([^>]*homecards\/[^>]+)>/g, (tag, attributes) => {
  if (/\b(?:loading|fetchpriority)=/i.test(tag)) return tag;
  homecardIndex += 1;
  return homecardIndex === 1
    ? `<img fetchpriority="high" decoding="async"${attributes}>`
    : `<img loading="lazy" decoding="async"${attributes}>`;
});
fs.writeFileSync(homepagePath, homepage);

const indexable = htmlFiles
  .map(file => path.relative(root, file).replaceAll(path.sep, '/'))
  .filter(relative => relative !== '404.html' && !redirectPages.has(relative))
  .sort();
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...indexable.map(relative => `<url><loc>${siteUrl}${canonicalPath(relative)}</loc><lastmod>${today}</lastmod></url>`),
  '</urlset>',
  ''
].join('\n');
fs.writeFileSync(path.join(root, 'sitemap.xml'), sitemap);
fs.writeFileSync(path.join(root, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);

console.log(`Prepared ${htmlFiles.length} HTML files and ${indexable.length} sitemap URLs for ${siteUrl}.`);

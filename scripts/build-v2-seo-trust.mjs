import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const previewRoot = path.join(root, 'v2-preview');
const seoMapPath = path.join(previewRoot, 'seo-production-map.json');
const migrationMapPath = path.join(previewRoot, 'production-config', 'file-migration-map.json');
const sitemapPath = path.join(previewRoot, 'production-config', 'sitemap.xml');
const editorialPreviewPath = '/v2-preview/about/editorial-policy/';
const editorialProductionPath = '/about/editorial-policy/';

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

function decodeHtml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&nbsp;', ' ');
}

function textContent(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
}

const organization = {
  '@type': 'Organization',
  '@id': 'https://www.haibucrafts.com/#organization',
  name: 'HAIBUCRAFT',
  url: 'https://www.haibucrafts.com/',
  logo: 'https://www.haibucrafts.com/brand/haibu-logo-header.png',
  email: 'sale008@sola-craft.com',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Yiwu',
    addressRegion: 'Zhejiang',
    addressCountry: 'CN'
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'sales',
    email: 'sale008@sola-craft.com'
  }
};

const homeStructuredData = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    organization,
    {
      '@type': 'WebSite',
      '@id': 'https://www.haibucrafts.com/#website',
      url: 'https://www.haibucrafts.com/',
      name: 'HAIBUCRAFT',
      alternateName: 'HAIBUCRAFT Wholesale Craft Supply',
      publisher: { '@id': 'https://www.haibucrafts.com/#organization' }
    }
  ]
}).replaceAll('<', '\\u003c');

const aboutStructuredData = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    organization,
    {
      '@type': 'AboutPage',
      '@id': 'https://www.haibucrafts.com/about/#webpage',
      url: 'https://www.haibucrafts.com/about/',
      name: 'About HAIBUCRAFT Wholesale Craft Supply',
      about: { '@id': 'https://www.haibucrafts.com/#organization' },
      isPartOf: { '@id': 'https://www.haibucrafts.com/#website' }
    }
  ]
}).replaceAll('<', '\\u003c');

const editorialStructuredData = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': 'https://www.haibucrafts.com/about/editorial-policy/#webpage',
      url: 'https://www.haibucrafts.com/about/editorial-policy/',
      name: 'Editorial Policy and Content Review | HAIBUCRAFT',
      description: 'How HAIBUCRAFT prepares, reviews, limits and updates buyer guides, product information and sourcing claims.',
      dateModified: '2026-08-06',
      publisher: { '@id': 'https://www.haibucrafts.com/#organization' },
      about: { '@id': 'https://www.haibucrafts.com/#organization' }
    },
    organization,
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haibucrafts.com/' },
        { '@type': 'ListItem', position: 2, name: 'About', item: 'https://www.haibucrafts.com/about/' },
        { '@type': 'ListItem', position: 3, name: 'Editorial Policy', item: 'https://www.haibucrafts.com/about/editorial-policy/' }
      ]
    }
  ]
}).replaceAll('<', '\\u003c');

const editorialHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Editorial Policy and Content Review | HAIBUCRAFT</title>
  <meta name="description" content="How HAIBUCRAFT prepares, reviews, limits and updates buyer guides, product information and sourcing claims.">
  <meta name="robots" content="noindex,nofollow">
  <link rel="stylesheet" href="/v2-preview/assets/site-v2.css">
  <link rel="stylesheet" href="/v2-preview/assets/site-v2-fixes.css">
  <script type="application/ld+json">${editorialStructuredData}</script>
</head>
<body data-page="editorial-policy">
  <div data-site-header></div>
  <main>
    <section class="page-hero">
      <div class="container">
        <div class="breadcrumbs"><a href="/v2-preview/">Home</a> / <a href="/v2-preview/about/">About</a> / Editorial Policy</div>
        <span class="eyebrow">Content Transparency</span>
        <h1>How HAIBUCRAFT buyer content is prepared and reviewed.</h1>
        <p>This policy identifies the content owner, internal review scope, evidence standards and correction process used for product pages and buyer guides.</p>
        <div class="evidence-strip">
          <div class="evidence-item"><b>Content owner</b><span>HAIBUCRAFT Buyer Resources</span></div>
          <div class="evidence-item"><b>Scope reviewer</b><span>Product &amp; Quality Coordination</span></div>
          <div class="evidence-item"><b>Last reviewed</b><span>August 6, 2026</span></div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container split">
        <div>
          <span class="eyebrow">Who Creates the Content</span>
          <h2>Organization-based authorship with a defined sourcing purpose.</h2>
          <p>HAIBUCRAFT Buyer Resources prepares catalog explanations and practical B2B guides for importers, wholesalers, craft brands and private-label programs. Organization authorship is used because the content is based on shared product, sampling, packaging, production and document-handling workflows rather than a single public spokesperson.</p>
        </div>
        <div class="card">
          <h3>Why this content exists</h3>
          <p>The material helps buyers prepare clearer requirements, compare product codes and identify questions that must be confirmed before an order.</p>
          <p>It is not produced as legal, regulatory or laboratory advice.</p>
        </div>
      </div>
    </section>

    <section class="section alt" id="review">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">How Content Is Reviewed</span>
          <h2>Internal scope review checks usefulness, evidence and claim boundaries.</h2>
          <p>Product &amp; Quality Coordination reviews whether the content matches the available catalog, sample, packaging, production and document context.</p>
        </div>
        <div class="card-grid">
          <article class="card"><h3>Product identity</h3><p>Product names, codes, images and category relationships are checked against the maintained site catalog.</p></article>
          <article class="card"><h3>Operational accuracy</h3><p>Sample, packaging, production and inspection guidance is checked for alignment with the described workflow.</p></article>
          <article class="card"><h3>Claim boundaries</h3><p>MOQ, lead time, capacity, testing and certification statements remain conditional when the exact SKU or market scope is not confirmed.</p></article>
          <article class="card"><h3>Buyer clarity</h3><p>Pages should state what evidence is available, what remains to be confirmed and which details belong in an inquiry.</p></article>
        </div>
        <div class="scope-note"><strong>Review boundary:</strong> internal scope review is an editorial control. It is not third-party certification, legal approval, laboratory testing or a guarantee that one document covers every product.</div>
      </div>
    </section>

    <section class="section">
      <div class="container split">
        <div>
          <span class="eyebrow">Evidence Standards</span>
          <h2>Claims are tied to the narrowest supportable source.</h2>
          <ul class="checklist">
            <li>Product claims use maintained catalog codes and available product imagery.</li>
            <li>Facility and process claims use supplied operational photography and workflow records.</li>
            <li>Document claims identify the named company, product, sample, standard and date shown in the file.</li>
            <li>Unconfirmed MOQ, lead time, capacity and market requirements are presented as quotation-stage checks.</li>
            <li>Buyer guides distinguish operational inspection from laboratory testing and legal compliance.</li>
          </ul>
        </div>
        <div class="card">
          <h3>Updates and corrections</h3>
          <p>Content is revised when catalog records, product scope, documents or operational information change. Material changes receive a new review date.</p>
          <p>To report an error or request source clarification, email <a href="mailto:sale008@sola-craft.com">sale008@sola-craft.com</a> with the page URL and the statement in question.</p>
        </div>
      </div>
    </section>

    <section class="section alt">
      <div class="container cta">
        <div><h2>Need product-specific confirmation?</h2><p>Send the exact product code, intended use, destination market, quantity and packaging requirement for review.</p></div>
        <a class="btn btn-primary" href="/v2-preview/quote/?source=editorial-policy&amp;landing_page=/v2-preview/about/editorial-policy/">Request Clarification</a>
      </div>
    </section>
  </main>
  <div data-site-footer></div>
  <script src="/v2-preview/assets/components.js"></script>
  <script src="/v2-preview/assets/site-v2.js"></script>
</body>
</html>
`;

async function updateHtml(relativePath, transform) {
  const filePath = path.join(previewRoot, relativePath);
  const source = await readFile(filePath, 'utf8');
  await writeFile(filePath, transform(source), 'utf8');
}

await updateHtml('index.html', (html) => {
  if (html.includes('https://www.haibucrafts.com/#website')) return html;
  return html.replace('</head>', `  <script type="application/ld+json">${homeStructuredData}</script>\n</head>`);
});

await updateHtml(path.join('about', 'index.html'), (html) => {
  let next = html;
  if (!next.includes('https://www.haibucrafts.com/about/#webpage')) {
    next = next.replace('</head>', `<script type="application/ld+json">${aboutStructuredData}</script></head>`);
  }
  if (!next.includes('data-editorial-trust')) {
    const section = `<section class="section" data-editorial-trust><div class="container split"><div><span class="eyebrow">Content Accountability</span><h2>Buyer content has a named owner and review standard.</h2><p>HAIBUCRAFT Buyer Resources prepares product and sourcing content. Product &amp; Quality Coordination reviews operational scope and unsupported-claim boundaries.</p><div class="actions"><a class="btn btn-light" href="/v2-preview/about/editorial-policy/">Read Editorial Policy</a></div></div><div class="scope-note"><strong>Review scope:</strong> internal content review supports clarity and traceability; it does not replace third-party testing, legal advice or market-specific compliance review.</div></div></section>`;
    next = next.replace('<section class="section" id="faq">', `${section}<section class="section" id="faq">`);
  }
  return next;
});

await updateHtml(path.join('products', 'slime-charms', 'index.html'), (html) => html.replace(
  /<title>[^<]+<\/title>/,
  '<title>Slime Charms Wholesale Supplier | HAIBUCRAFT</title>'
));

await updateHtml(path.join('products', 'polymer-clay-slices', 'index.html'), (html) => html.replace(
  /<title>[^<]+<\/title>/,
  '<title>Polymer Clay Slices Wholesale | HAIBUCRAFT</title>'
));

const editorialDirectory = path.join(previewRoot, 'about', 'editorial-policy');
await mkdir(editorialDirectory, { recursive: true });
await writeFile(path.join(editorialDirectory, 'index.html'), editorialHtml, 'utf8');

const seoMap = JSON.parse(await readFile(seoMapPath, 'utf8'));
const editorialRoute = {
  previewPath: editorialPreviewPath,
  productionPath: editorialProductionPath,
  title: 'Editorial Policy and Content Review | HAIBUCRAFT',
  description: 'How HAIBUCRAFT prepares, reviews, limits and updates buyer guides, product information and sourcing claims.',
  type: 'website',
  index: true,
  generatedTrust: true
};
seoMap.routes = seoMap.routes.filter((route) => route.productionPath !== editorialProductionPath);
const aboutIndex = seoMap.routes.findIndex((route) => route.productionPath === '/about/');
seoMap.routes.splice(aboutIndex < 0 ? seoMap.routes.length : aboutIndex + 1, 0, editorialRoute);
await writeFile(seoMapPath, `${JSON.stringify(seoMap, null, 2)}\n`, 'utf8');

const migrationMap = JSON.parse(await readFile(migrationMapPath, 'utf8'));
const editorialPage = {
  source: 'v2-preview/about/editorial-policy/index.html',
  destination: 'about/editorial-policy/index.html',
  action: 'create',
  productionPath: editorialProductionPath,
  generatedTrust: true
};
migrationMap.pages = migrationMap.pages.filter((page) => page.productionPath !== editorialProductionPath);
const aboutPageIndex = migrationMap.pages.findIndex((page) => page.productionPath === '/about/');
migrationMap.pages.splice(aboutPageIndex < 0 ? migrationMap.pages.length : aboutPageIndex + 1, 0, editorialPage);
migrationMap.version = '2026-08-06';
if (!migrationMap.sharedAssets.some((asset) => asset.source === 'v2-preview/assets/accessibility.css')) {
  migrationMap.sharedAssets.push({
    source: 'v2-preview/assets/accessibility.css',
    destination: 'assets/v2/accessibility.css'
  });
}
await writeFile(migrationMapPath, `${JSON.stringify(migrationMap, null, 2)}\n`, 'utf8');

const routeByPreviewPath = new Map(seoMap.routes.map((route) => [route.previewPath, route]));
const htmlFiles = (await walk(previewRoot)).filter((file) => file.endsWith('.html'));
for (const file of htmlFiles) {
  let html = await readFile(file, 'utf8');
  const relative = path.relative(previewRoot, file).replaceAll('\\', '/');
  const previewPath = relative === 'index.html'
    ? '/v2-preview/'
    : `/v2-preview/${relative.replace(/index\.html$/, '')}`;
  const route = routeByPreviewPath.get(previewPath);
  const visibleBreadcrumbs = html.match(/<div class="breadcrumbs">([\s\S]*?)<\/div>/i)?.[1];
  if (!route || !visibleBreadcrumbs || html.includes('"@type":"BreadcrumbList"')) continue;

  const chunks = visibleBreadcrumbs.split(/\s+\/\s+/).filter(Boolean);
  const itemListElement = chunks.map((chunk, index) => {
    const anchor = chunk.match(/<a\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    const name = textContent(anchor?.[2] || chunk);
    let productionPath = route.productionPath;
    if (anchor) {
      const rawPath = anchor[1].split('#')[0].split('?')[0];
      const normalizedPath = rawPath.endsWith('/') || rawPath.endsWith('.html') ? rawPath : `${rawPath}/`;
      productionPath = routeByPreviewPath.get(normalizedPath)?.productionPath || productionPath;
    }
    return {
      '@type': 'ListItem',
      position: index + 1,
      name,
      item: `${seoMap.site.origin}${productionPath}`
    };
  });

  const breadcrumbData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement
  }).replaceAll('<', '\\u003c');
  html = html.replace('</head>', `  <script type="application/ld+json" data-breadcrumb-ld>${breadcrumbData}</script>\n</head>`);
  await writeFile(file, html, 'utf8');
}

const sitemapUrls = seoMap.routes.filter((route) => route.index).map((route) => {
  return `  <url><loc>${seoMap.site.origin}${route.productionPath}</loc><lastmod>${route.lastModified || '2026-08-21'}</lastmod></url>`;
});
await writeFile(sitemapPath, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.join('\n')}\n</urlset>\n`, 'utf8');

console.log('Generated the editorial policy, organization metadata, authorship signals, concise titles and breadcrumb data.');

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const previewRoot = path.join(root, 'v2-preview');
const productsRoot = path.join(previewRoot, 'products');
const seoMapPath = path.join(previewRoot, 'seo-production-map.json');
const migrationMapPath = path.join(previewRoot, 'production-config', 'file-migration-map.json');
const sitemapPath = path.join(previewRoot, 'production-config', 'sitemap.xml');
const catalogPath = path.join(previewRoot, 'assets', 'product-catalog.json');
const issue12BatchPath = path.join(root, 'scripts', 'data', 'issue-12-slime-products.json');
const issue12Batch = JSON.parse(await readFile(issue12BatchPath, 'utf8'));
const issue12ProductsBySku = new Map(issue12Batch.products.map((product) => [product.sku, product]));

if (issue12ProductsBySku.size !== 9 || issue12ProductsBySku.size !== issue12Batch.products.length) {
  throw new Error('Issue #12 batch must contain exactly 9 unique SKUs');
}
for (const product of issue12Batch.products) {
  if (product.galleryLabels.length !== issue12Batch.publicGalleryCount) {
    throw new Error(`Issue #12 gallery for ${product.sku} must contain ${issue12Batch.publicGalleryCount} public images`);
  }
}

const categories = [
  {
    slug: 'polymer-clay-slices',
    label: 'Polymer Clay Slices',
    productionBase: '/products/polymer-clay-slices-wholesale/',
    uses: 'slime decoration, nail art, shaker fillers, resin crafts and DIY kits',
    material: 'Polymer clay or mixed decorative components; confirm composition against the selected sample.',
    overview: 'Decorative slice mixes for buyers preparing coordinated slime, nail-art, shaker, resin-craft or DIY assortments.'
  },
  {
    slug: 'slime-charms',
    label: 'Slime Charms',
    productionBase: '/products/slime-charms-wholesale/',
    uses: 'slime decoration, sensory kits, DIY craft boxes and retail assortments',
    material: 'Resin, plastic, polymer clay or mixed decorative components depending on the selected SKU.',
    overview: 'Theme-led decorative add-ins for slime brands, retailers, importers, DIY kit programs and private-label assortments.'
  },
  {
    slug: 'resin-charms',
    label: 'Resin Charms',
    productionBase: '/products/resin-charms-for-slime/',
    uses: 'slime add-ins, decoden, phone-case decoration, DIY kits and resin crafts',
    material: 'Resin or mixed flatback components; confirm finish, dimensions and backing style against the selected sample.',
    overview: 'Glossy, flatback and novelty decorative pieces for slime, decoden, phone-case, DIY and mixed craft programs.'
  },
  {
    slug: 'sequins-glitter-confetti',
    label: 'Sequins & Confetti',
    productionBase: '/products/sequins-glitter-confetti/',
    uses: 'slime, nail art, shaker fillers, resin crafts and seasonal DIY projects',
    material: 'Decorative film or mixed components depending on shape, color and finish; confirm against the selected sample.',
    overview: 'Shaped sequins, glitter and confetti for color-led slime, shaker, nail-art, resin-craft and seasonal programs.'
  }
];

const decodeHtml = (value) => value
  .replaceAll('&amp;', '&')
  .replaceAll('&#39;', "'")
  .replaceAll('&quot;', '"');

const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const slugify = (value) => value
  .toLowerCase()
  .replace(/['’]/g, '')
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .replace(/-{2,}/g, '-');

const clip = (value, max) => {
  if (value.length <= max) return value;
  const clipped = value.slice(0, max + 1).replace(/\s+\S*$/, '').trim();
  return clipped || value.slice(0, max).trim();
};

const seoTitle = ({ title, sku }) => {
  const normalized = title.replaceAll('&', 'and');
  const suffix = ` ${sku} | HAIBUCRAFT`;
  return `${clip(normalized, 65 - suffix.length)}${suffix}`;
};

const metaDescription = (product) => clip(
  `${product.title.replaceAll('&', 'and')} (${product.sku}) is listed in the HAIBUCRAFT ${product.categoryLabel.toLowerCase().replaceAll('&', 'and')} catalog for ${product.uses}. Confirm material, size, MOQ, packing and testing scope before ordering.`,
  165
);

const issue12DetailSlug = (product) => `${product.sku.toLowerCase()}-${slugify(product.title).replaceAll('-and-', '-')}`;

const issue12Image = (product, position) => (
  `/assets/images/products/batch-2026-08/${product.sku.toLowerCase()}/${product.imagePrefix}-${String(position).padStart(2, '0')}.webp`
);

const issue12Filter = (product) => {
  if (product.type === 'Ocean') return 'ocean';
  if (product.type === 'Cute Animals') return 'character';
  if (product.type === 'Floral') return 'fantasy';
  return 'seasonal';
};

const issue12Card = (product) => {
  const detailSlug = issue12DetailSlug(product);
  const previewPath = `/v2-preview/products/slime-charms/${detailSlug}/`;
  const image = issue12Image(product, 1);
  const quoteParams = new URLSearchParams({
    source: 'product',
    category: 'slime-charms',
    product_code: product.sku,
    product: product.title,
    image,
    landing_page: previewPath
  });
  const quoteHref = `/v2-preview/quote/?${quoteParams.toString().replaceAll('&', '&amp;')}`;
  const tags = `${product.sku} ${product.title.replaceAll('&', 'and')} wholesale`.toLowerCase();
  const alt = `${product.title.replaceAll('&', 'and')} assortment, product code ${product.sku}`;

  return `<article class="product-card-v2" data-product-card data-category="${issue12Filter(product)}" data-tags="${escapeHtml(tags)}"><img src="${image}" width="1000" height="1000" loading="lazy" decoding="async" alt="${escapeHtml(alt)}"><div class="product-card-body"><div class="product-card-top"><span class="sku-badge">${product.sku}</span><span class="product-type">${escapeHtml(product.type)}</span></div><h3>${escapeHtml(product.title)}</h3><div class="product-card-actions"><a class="btn btn-light product-detail-link" href="${previewPath}">View Details</a><a class="btn btn-primary get-quote" href="${quoteHref}">Get Quote</a></div></div></article>`;
};

const categoryHtml = new Map();
const products = [];

for (const category of categories) {
  const file = path.join(productsRoot, category.slug, 'index.html');
  let html = await readFile(file, 'utf8');
  if (category.slug === 'slime-charms') {
    const missingCards = issue12Batch.products
      .filter((product) => !html.includes(`<span class="sku-badge">${product.sku}</span>`))
      .map(issue12Card)
      .join('');
    if (missingCards) {
      const marker = '</div></div></div></section><section class="section" id="specifications">';
      if (!html.includes(marker)) throw new Error('Could not locate the slime-charms product-grid insertion point');
      html = html.replace(marker, `${missingCards}${marker}`);
    }
  }
  categoryHtml.set(category.slug, { file, html });

  const cards = [...html.matchAll(/<article class="product-card-v2"([^>]*)>([\s\S]*?)<\/article>/g)];
  for (const card of cards) {
    const attributes = card[1];
    const block = card[0];
    const sku = decodeHtml(block.match(/<span class="sku-badge">([^<]+)<\/span>/)?.[1]?.trim() || '');
    const title = decodeHtml(block.match(/<h3>([^<]+)<\/h3>/)?.[1]?.trim() || '');
    const imageTag = block.match(/<img\b[^>]*>/i)?.[0] || '';
    const image = imageTag.match(/src="([^"]+)"/)?.[1] || '';
    const alt = decodeHtml(imageTag.match(/alt="([^"]*)"/)?.[1]?.trim() || title);
    const type = decodeHtml(block.match(/<span class="product-type">([^<]+)<\/span>/)?.[1]?.trim() || 'Mixed');
    const quoteTag = block.match(/<a class="btn btn-primary get-quote"[\s\S]*?<\/a>/)?.[0] || '';
    const quoteHref = quoteTag.match(/href="([^"]+)"/)?.[1] || '';
    const style = decodeHtml(attributes.match(/data-category="([^"]+)"/)?.[1] || type);

    if (!sku || !title || !image || !quoteHref) {
      throw new Error(`Incomplete product card in ${category.slug}: ${sku || title || '(unknown)'}`);
    }

    const issue12Product = issue12ProductsBySku.get(sku);
    if (issue12Product && (issue12Product.title !== title || issue12Product.type !== type)) {
      throw new Error(`Issue #12 card data does not match the approved product record for ${sku}`);
    }
    const detailSlug = issue12Product ? issue12DetailSlug(issue12Product) : `${slugify(sku)}-${slugify(title)}`;
    const previewPath = `/v2-preview/products/${category.slug}/${detailSlug}/`;
    const productionPath = `${category.productionBase}${detailSlug}/`;
    const gallery = issue12Product
      ? issue12Product.galleryLabels.map((label, position) => ({
        src: issue12Image(issue12Product, position + 1),
        alt: `${issue12Product.title} ${label}, product code ${issue12Product.sku}`
      }))
      : [];
    products.push({
      sku,
      title,
      image,
      alt,
      type,
      style,
      detailSlug,
      previewPath,
      productionPath,
      categorySlug: category.slug,
      categoryLabel: category.label,
      categoryProductionBase: category.productionBase,
      uses: category.uses,
      material: issue12Product ? issue12Batch.material : category.material,
      overview: issue12Product?.description || category.overview,
      customMetaDescription: issue12Product?.metaDescription || null,
      gallery,
      packingOptions: issue12Product ? issue12Batch.packingOptions : [],
      relatedSkus: issue12Product?.relatedSkus || [],
      issue12Batch: Boolean(issue12Product)
    });
  }
}

if (products.length !== 72) {
  throw new Error(`Expected 72 products after Issue #12 integration, found ${products.length}`);
}

const skuSet = new Set(products.map((product) => product.sku));
const previewPathSet = new Set(products.map((product) => product.previewPath));
if (skuSet.size !== products.length || previewPathSet.size !== products.length) {
  throw new Error('Product SKUs or generated detail paths are not unique');
}
const productsBySku = new Map(products.map((product) => [product.sku, product]));

for (const category of categories) {
  const categoryProducts = products.filter((product) => product.categorySlug === category.slug);
  const source = categoryHtml.get(category.slug);
  let index = 0;
  let nextHtml = source.html.replace(
    /<article class="product-card-v2"([^>]*)>([\s\S]*?)<\/article>/g,
    (article) => {
      const product = categoryProducts[index++];
      const quoteTag = article.match(/<a class="btn btn-primary get-quote"[\s\S]*?<\/a>/)?.[0];
      if (!quoteTag) throw new Error(`Missing quote link for ${product.sku}`);
      const actions = `<div class="product-card-actions"><a class="btn btn-light product-detail-link" href="${product.previewPath}">View Details</a>${quoteTag}</div>`;
      if (article.includes('<div class="product-card-actions">')) {
        return article.replace(/<div class="product-card-actions">[\s\S]*?<\/div>/, actions);
      }
      return article.replace(quoteTag, actions);
    }
  );
  nextHtml = nextHtml.replace(
    /(<strong data-product-count>)\d+ products(<\/strong>)/,
    `$1${categoryProducts.length} products$2`
  );
  await writeFile(source.file, nextHtml, 'utf8');
}

for (const category of categories) {
  const categoryProducts = products.filter((product) => product.categorySlug === category.slug);
  const existingCategoryProducts = categoryProducts.filter((product) => !product.issue12Batch);
  for (const [position, product] of categoryProducts.entries()) {
    const relatedPool = product.issue12Batch ? categoryProducts : existingCategoryProducts;
    const relatedPosition = product.issue12Batch ? position : relatedPool.indexOf(product);
    const related = product.relatedSkus.length
      ? product.relatedSkus.map((sku) => productsBySku.get(sku))
      : [
        relatedPool[(relatedPosition + 1) % relatedPool.length],
        relatedPool[(relatedPosition + 2) % relatedPool.length],
        relatedPool[(relatedPosition + 3) % relatedPool.length]
      ];
    if (related.length !== 3 || related.some((item) => !item || item.categorySlug !== category.slug)) {
      throw new Error(`Invalid related-product configuration for ${product.sku}`);
    }
    const description = product.customMetaDescription || metaDescription(product);
    const quoteParams = new URLSearchParams({
      source: 'product-detail',
      category: product.categorySlug,
      product_code: product.sku,
      product: product.title,
      image: product.image,
      landing_page: product.previewPath
    });
    const quoteHref = `/v2-preview/quote/?${quoteParams.toString().replaceAll('&', '&amp;')}`;
    const structuredData = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      sku: product.sku,
      image: product.gallery.length
        ? product.gallery.map((item) => `https://www.haibucrafts.com${item.src}`)
        : `https://www.haibucrafts.com${product.image}`,
      description,
      category: product.categoryLabel,
      brand: { '@type': 'Brand', name: 'HAIBUCRAFT' }
    }).replaceAll('<', '\\u003c');
    const galleryStylesheet = product.gallery.length
      ? '  <link rel="stylesheet" href="/v2-preview/assets/product-gallery.css">\n'
      : '';
    const mediaMarkup = product.gallery.length
      ? `<div class="product-detail-gallery" data-product-gallery>
            <figure class="product-detail-media">
              <img data-product-gallery-main src="${escapeHtml(product.gallery[0].src)}" width="1000" height="1000" decoding="async" fetchpriority="high" alt="${escapeHtml(product.gallery[0].alt)}">
              <span>Actual product photo</span>
            </figure>
            <div class="product-detail-thumbs" aria-label="${escapeHtml(product.title)} gallery">
              ${product.gallery.map((item, index) => `<button class="product-detail-thumb" type="button" data-product-gallery-thumb data-src="${escapeHtml(item.src)}" data-alt="${escapeHtml(item.alt)}" aria-label="Show image ${index + 1} of ${product.gallery.length}" aria-current="${index === 0 ? 'true' : 'false'}"><img src="${escapeHtml(item.src)}" width="1000" height="1000" loading="lazy" decoding="async" alt="${escapeHtml(item.alt)} thumbnail"></button>`).join('\n              ')}
            </div>
            <p class="product-detail-gallery-note">Six actual product views are shown. Electronic-scale photos remain internal sourcing references and are not published.</p>
          </div>`
      : `<div class="product-detail-media">
            <img src="${escapeHtml(product.image)}" width="800" height="800" decoding="async" alt="${escapeHtml(product.alt)}">
            <span>Actual catalog image</span>
          </div>`;
    const packingReference = product.packingOptions.length
      ? `<div class="product-packing-reference">
            <h3>Packing options/reference</h3>
            <ul class="pack-option-list">${product.packingOptions.map((option) => `<li>${escapeHtml(option)}</li>`).join('')}</ul>
            <p class="b2b-note">These are source-sheet packing references, not guaranteed specifications. Final pack weight, mix ratio, carton details and gross weight are confirmed with the quotation and order specification.</p>
          </div>`
      : '';
    const galleryScript = product.gallery.length
      ? '  <script src="/v2-preview/assets/product-gallery.js"></script>\n'
      : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(seoTitle(product))}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="noindex,nofollow">
  <link rel="stylesheet" href="/v2-preview/assets/site-v2.css">
  <link rel="stylesheet" href="/v2-preview/assets/site-v2-fixes.css">
  <link rel="stylesheet" href="/v2-preview/assets/product-detail.css">
${galleryStylesheet}  <script type="application/ld+json">${structuredData}</script>
</head>
<body data-page="${escapeHtml(product.categorySlug)}">
  <div data-site-header></div>
  <main>
    <section class="product-detail-hero">
      <div class="container">
        <div class="breadcrumbs"><a href="/v2-preview/">Home</a> / <a href="/v2-preview/products/">Products</a> / <a href="/v2-preview/products/${escapeHtml(product.categorySlug)}/">${escapeHtml(product.categoryLabel)}</a> / ${escapeHtml(product.sku)}</div>
        <div class="product-detail-layout">
          ${mediaMarkup}
          <div class="product-detail-copy">
            <div class="product-detail-badges"><span class="sku-badge">${escapeHtml(product.sku)}</span><span class="product-type">${escapeHtml(product.type)}</span></div>
            <span class="eyebrow">${escapeHtml(product.categoryLabel)}</span>
            <h1>${escapeHtml(product.title)}</h1>
            <p>${escapeHtml(product.overview)}</p>
            <ul class="product-detail-highlights">
              <li>${product.issue12Batch ? 'Sample and product-code based quotation' : 'Product-code based quotation'}</li>
              <li>${product.issue12Batch ? 'Mixed-SKU and private-label packaging review' : 'Mixed-SKU and packaging review'}</li>
              <li>${product.issue12Batch ? 'Lead-time and destination-market document review' : 'Export and documentation coordination'}</li>
            </ul>
            <div class="actions">
              <a class="btn btn-primary" href="${quoteHref}">Request Quote for ${escapeHtml(product.sku)}</a>
              <a class="btn btn-light" href="/v2-preview/products/${escapeHtml(product.categorySlug)}/">Back to Category</a>
            </div>
            <p class="product-detail-note">Pricing, MOQ, lead time and document availability are confirmed after reviewing the exact product code, packing format, quantity and destination market.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="section alt">
      <div class="container product-detail-spec-layout">
        <div>
          <span class="eyebrow">Buyer Reference</span>
          <h2>Product information to confirm before ordering.</h2>
          <p>Use this page as a sourcing reference, then confirm the approved sample and written quotation before production.</p>
        </div>
        <table class="spec-table product-detail-table">
          <tbody>
            <tr><th>Product code</th><td>${escapeHtml(product.sku)}</td></tr>
            <tr><th>Product family</th><td>${escapeHtml(product.categoryLabel)}</td></tr>
            <tr><th>Style direction</th><td>${escapeHtml(product.type)}</td></tr>
            <tr><th>Common applications</th><td>${escapeHtml(product.uses)}</td></tr>
            <tr><th>Material scope</th><td>${escapeHtml(product.material)}</td></tr>
            <tr><th>MOQ and lead time</th><td>Confirmed against quantity, packing, customization and current production scheduling.</td></tr>
            <tr><th>Testing documents</th><td>Reviewed for the exact SKU, intended use and destination market; no blanket certificate claim applies.</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="section">
      <div class="container split">
        <div>
          <span class="eyebrow">Quotation Checklist</span>
          <h2>Send a complete requirement for a faster review.</h2>
          <ul class="checklist">
            <li>Reference product code ${escapeHtml(product.sku)}</li>
            <li>State quantity and packing unit</li>
            <li>Add color, mix-ratio or artwork requirements</li>
            <li>Include destination country and intended application</li>
            <li>Request any required testing or compliance documents</li>
          </ul>${packingReference ? `
          ${packingReference}` : ''}
        </div>
        <div class="product-detail-cta">
          <span class="eyebrow">B2B Inquiry</span>
          <h2>Need this item in a mixed or private-label program?</h2>
          <p>Send the selected product codes together with quantities, packaging requirements and the delivery market.</p>
          <a class="btn btn-primary" href="${quoteHref}">Start Product Inquiry</a>
        </div>
      </div>
    </section>

    <section class="section alt">
      <div class="container">
        <div class="section-head">
          <span class="eyebrow">Related ${escapeHtml(product.categoryLabel)}</span>
          <h2>Continue comparing products in this family.</h2>
        </div>
        <div class="product-related-grid">
          ${related.map((item) => `<a class="product-related-card" href="${item.previewPath}"><img src="${escapeHtml(item.image)}" width="800" height="800" loading="lazy" decoding="async" alt="${escapeHtml(item.alt)}"><div><span>${escapeHtml(item.sku)}</span><h3>${escapeHtml(item.title)}</h3></div></a>`).join('\n          ')}
        </div>
      </div>
    </section>
  </main>
  <div data-site-footer></div>
  <script src="/v2-preview/assets/components.js"></script>
  <script src="/v2-preview/assets/site-v2.js"></script>
${galleryScript}</body>
</html>
`;

    const directory = path.join(productsRoot, product.categorySlug, product.detailSlug);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, 'index.html'), html, 'utf8');
  }
}

await writeFile(catalogPath, JSON.stringify({
  generatedAt: '2026-08-14',
  count: products.length,
  products: products.map((product) => ({
    sku: product.sku,
    title: product.title,
    category: product.categorySlug,
    categoryLabel: product.categoryLabel,
    type: product.type,
    image: product.image,
    gallery: product.gallery.map((item) => item.src),
    previewPath: product.previewPath,
    productionPath: product.productionPath
  }))
}, null, 2), 'utf8');

const seoMap = JSON.parse(await readFile(seoMapPath, 'utf8'));
const productRoutes = products.map((product) => ({
  previewPath: product.previewPath,
  productionPath: product.productionPath,
  title: seoTitle(product),
  description: product.customMetaDescription || metaDescription(product),
  type: 'website',
  index: true,
  generatedProduct: true
}));
const baseRoutes = seoMap.routes.filter((route) => !route.generatedProduct);
const quoteIndex = baseRoutes.findIndex((route) => route.productionPath === '/request-quote/');
baseRoutes.splice(quoteIndex < 0 ? baseRoutes.length : quoteIndex, 0, ...productRoutes);
seoMap.routes = baseRoutes;
await writeFile(seoMapPath, `${JSON.stringify(seoMap, null, 2)}\n`, 'utf8');

const migrationMap = JSON.parse(await readFile(migrationMapPath, 'utf8'));
const generatedPages = products.map((product) => ({
  source: `v2-preview/products/${product.categorySlug}/${product.detailSlug}/index.html`,
  destination: `${product.productionPath.slice(1)}index.html`,
  action: 'create',
  productionPath: product.productionPath,
  generatedProduct: true
}));
const basePages = migrationMap.pages.filter((page) => !page.generatedProduct);
const quotePageIndex = basePages.findIndex((page) => page.productionPath === '/request-quote/');
basePages.splice(quotePageIndex < 0 ? basePages.length : quotePageIndex, 0, ...generatedPages);
migrationMap.version = '2026-08-14-issue-12';
migrationMap.pages = basePages;
const requiredSharedAssets = [
  { source: 'v2-preview/assets/category-ux.css', destination: 'assets/v2/category-ux.css' },
  { source: 'v2-preview/assets/product-directory.css', destination: 'assets/v2/product-directory.css' },
  { source: 'v2-preview/assets/product-detail.css', destination: 'assets/v2/product-detail.css' },
  { source: 'v2-preview/assets/product-gallery.css', destination: 'assets/v2/product-gallery.css' },
  { source: 'v2-preview/assets/product-gallery.js', destination: 'assets/v2/product-gallery.js' },
  { source: 'v2-preview/assets/product-catalog.json', destination: 'assets/v2/product-catalog.json' }
];
for (const asset of requiredSharedAssets) {
  if (!migrationMap.sharedAssets.some((item) => item.source === asset.source)) {
    migrationMap.sharedAssets.push(asset);
  }
}
await writeFile(migrationMapPath, `${JSON.stringify(migrationMap, null, 2)}\n`, 'utf8');

const sitemapUrls = seoMap.routes
  .filter((route) => route.index)
  .map((route) => {
    const isHome = route.productionPath === '/';
    const isProduct = route.generatedProduct;
    const priority = isHome ? '1.0' : isProduct ? '0.8' : route.productionPath.startsWith('/products/') ? '0.9' : '0.7';
    const changefreq = isProduct || route.type === 'article' ? 'monthly' : route.productionPath.startsWith('/products') || route.productionPath === '/blog/' ? 'weekly' : 'monthly';
    return `  <url><loc>${seoMap.site.origin}${route.productionPath}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
  });
await writeFile(sitemapPath, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.join('\n')}\n</urlset>\n`, 'utf8');

console.log(`Generated ${products.length} product detail pages, card links, SEO routes and production mappings.`);

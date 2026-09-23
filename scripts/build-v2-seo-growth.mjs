import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const previewRoot = path.join(root, 'v2-preview');
const origin = 'https://www.haibucrafts.com';
const seoMapPath = path.join(previewRoot, 'seo-production-map.json');
const migrationMapPath = path.join(previewRoot, 'production-config', 'file-migration-map.json');
const sitemapPath = path.join(previewRoot, 'production-config', 'sitemap.xml');
const catalogPath = path.join(previewRoot, 'assets', 'product-catalog.json');

const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const seoMap = JSON.parse(await readFile(seoMapPath, 'utf8'));
const migrationMap = JSON.parse(await readFile(migrationMapPath, 'utf8'));
let sitemap = await readFile(sitemapPath, 'utf8');

if (!catalog.count || catalog.count !== catalog.products.length) {
  throw new Error(`SEO growth sprint requires a non-empty reconciled catalog; found ${catalog.count}/${catalog.products.length}`);
}

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const escapeAttr = escapeHtml;

function replaceFirstRequired(html, pattern, replacement, label) {
  if (!pattern.test(html)) throw new Error(`SEO growth sprint could not locate ${label}`);
  return html.replace(pattern, replacement);
}

function replaceMeta(html, selector, value) {
  const escaped = escapeAttr(value);
  if (selector === 'description') {
    return replaceFirstRequired(
      html,
      /<meta\s+name=["']description["']\s+content=["'][^"']*["']\s*\/?>/i,
      `<meta name="description" content="${escaped}">`,
      'meta description'
    );
  }
  const attr = selector.startsWith('og:') ? 'property' : 'name';
  const pattern = new RegExp(`<meta\\s+${attr}=["']${selector.replace(':', '\\:')}["']\\s+content=["'][^"']*["']\\s*\\/?>`, 'i');
  if (!pattern.test(html)) return html;
  return html.replace(pattern, `<meta ${attr}="${selector}" content="${escaped}">`);
}

function setPageMetadata(html, { title, description }) {
  let next = replaceFirstRequired(html, /<title>[^<]*<\/title>/i, `<title>${escapeHtml(title)}</title>`, 'title');
  next = replaceMeta(next, 'description', description);
  next = replaceMeta(next, 'og:title', title);
  next = replaceMeta(next, 'og:description', description);
  next = replaceMeta(next, 'twitter:title', title);
  next = replaceMeta(next, 'twitter:description', description);
  return next;
}

function upsertJsonLd(html, id, value) {
  const marker = `data-seo-growth-jsonld="${id}"`;
  const script = `<script type="application/ld+json" ${marker}>${JSON.stringify(value).replaceAll('<', '\\u003c')}</script>`;
  const existing = new RegExp(`<script type=["']application/ld\\+json["'] ${marker}>[\\s\\S]*?<\\/script>`, 'i');
  if (existing.test(html)) return html.replace(existing, script);
  return html.replace('</head>', `  ${script}\n</head>`);
}

function updateProductJsonLd(html, description) {
  return html.replace(/<script type="application\/ld\+json"([^>]*)>([\s\S]*?)<\/script>/g, (full, attrs, body) => {
    try {
      const json = JSON.parse(body);
      if (json?.['@type'] !== 'Product') return full;
      json.description = description;
      return `<script type="application/ld+json"${attrs}>${JSON.stringify(json).replaceAll('<', '\\u003c')}</script>`;
    } catch {
      return full;
    }
  });
}

function updateSeoRoute(productionPath, updates) {
  const route = seoMap.routes.find((item) => item.productionPath === productionPath);
  if (!route) throw new Error(`Missing SEO route for ${productionPath}`);
  Object.assign(route, updates);
}

function itemListFor(category, name) {
  const products = catalog.products.filter((product) => product.category === category);
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.title,
      url: `${origin}${product.productionPath}`
    }))
  };
}

function collectionPageFor(category, plan) {
  const itemList = itemListFor(category, plan.listName);
  delete itemList['@context'];
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${origin}${plan.productionPath}#collection`,
    url: `${origin}${plan.productionPath}`,
    name: plan.h1,
    description: plan.description,
    inLanguage: 'en',
    isPartOf: { '@id': `${origin}/#website` },
    mainEntity: itemList
  };
}

const categoryPlans = {
  'polymer-clay-slices': {
    previewFile: path.join(previewRoot, 'products', 'polymer-clay-slices', 'index.html'),
    productionPath: '/products/polymer-clay-slices-wholesale/',
    title: 'Polymer Clay Slices Wholesale for Slime | HAIBUCRAFT',
    description: 'Wholesale polymer clay slices and bulk sprinkles for slime, nail art, shakers and DIY kits. Compare fruit, candy and seasonal mixes; request MOQ and packing.',
    h1: 'Polymer Clay Slices Wholesale for Slime & DIY',
    intro: 'Source bulk polymer clay slices and wholesale clay sprinkles for slime, nail art, shaker fillers and DIY kits. Compare candy, fruit and seasonal mixes, then request current packing, MOQ and quotation details.',
    listName: 'Wholesale Polymer Clay Slices and Sprinkles',
    lastModified: '2026-09-22',
    resources: [
      ['/v2-preview/products/polymer-clay-slices/polymer-clay-sprinkles-wholesale/', 'Polymer Clay Sprinkles Wholesale'],
      ['/v2-preview/blog/polymer-clay-slice-buying-guide/', 'Polymer Clay Slice Buying Guide'],
      ['/v2-preview/custom-solutions/', 'Custom Mixes & Private Label'],
      ['/v2-preview/quality-control/', 'Quality Checkpoints']
    ]
  },
  'slime-charms': {
    previewFile: path.join(previewRoot, 'products', 'slime-charms', 'index.html'),
    productionPath: '/products/slime-charms-wholesale/',
    title: 'Wholesale Slime Charms in Bulk | HAIBUCRAFT',
    description: 'Wholesale slime charms for slime brands, DIY kits and retail assortments. Compare candy, fruit, ocean and seasonal designs; request packing, MOQ and quote.',
    h1: 'Wholesale Slime Charms in Bulk',
    intro: 'Source wholesale slime charms in bulk for slime brands, retailers and DIY kit programs. Compare candy, fruit, ocean and seasonal assortments, then request current packing, MOQ and quotation details.',
    listName: 'Bulk Slime Charms Wholesale Catalog',
    lastModified: '2026-09-22',
    resources: [
      ['/v2-preview/products/slime-charms/candy-charms-for-slime/', 'Candy Charms for Slime'],
      ['/v2-preview/products/slime-charms/halloween-slime-charms/', 'Halloween Slime Charms'],
      ['/v2-preview/products/slime-charms/christmas-slime-charms/', 'Christmas Slime Charms'],
      ['/v2-preview/products/polymer-clay-slices/', 'Polymer Clay Slices & Sprinkles'],
      ['/v2-preview/products/resin-charms/', 'Bulk Resin Charms'],
      ['/v2-preview/custom-solutions/', 'Custom & Private Label'],
      ['/v2-preview/quality-control/', 'Quality Checkpoints']
    ]
  },
  'resin-charms': {
    previewFile: path.join(previewRoot, 'products', 'resin-charms', 'index.html'),
    productionPath: '/products/resin-charms-for-slime/',
    title: 'Resin Charms Wholesale & Bulk Flatbacks | HAIBUCRAFT',
    description: 'Wholesale resin charms and bulk flatback cabochons for slime, decoden and DIY kits. Compare product codes and backing styles; request MOQ, packing and quote.',
    h1: 'Resin Charms Wholesale & Bulk Flatbacks',
    intro: 'Source resin charms wholesale and in bulk for slime, decoden, phone-case and DIY programs. Compare flatback styles, product codes and mixed assortments, then request current packing, MOQ and quotation details.',
    listName: 'Bulk Resin Charms Wholesale Catalog',
    lastModified: '2026-09-21',
    resources: [
      ['/v2-preview/blog/resin-charms-wholesale-buying-guide/', 'Resin Charms Buying Guide'],
      ['/v2-preview/products/slime-charms/', 'Slime Charms Wholesale'],
      ['/v2-preview/products/polymer-clay-slices/', 'Polymer Clay Slices & Sprinkles'],
      ['/v2-preview/certificates/', 'Product Documents & Scope'],
      ['/v2-preview/quality-control/', 'Quality Checkpoints'],
      ['/v2-preview/custom-solutions/', 'Custom & Private Label']
    ]
  },
  'sequins-glitter-confetti': {
    previewFile: path.join(previewRoot, 'products', 'sequins-glitter-confetti', 'index.html'),
    productionPath: '/products/sequins-glitter-confetti/',
    title: 'Wholesale Sequins & Glitter Confetti for Crafts | HAIBUCRAFT',
    description: 'Source bulk shaped sequins, glitter confetti and paillettes for slime, shakers, resin crafts and DIY kits. Mixed-SKU, packaging and custom options by quote.',
    h1: 'Wholesale Sequins, Glitter & Craft Confetti',
    intro: 'Source shaped sequins, holographic paillettes, glitter mixes and craft confetti in bulk for slime, shakers, nail art, resin crafts, DIY kits and private-label assortments.',
    listName: 'Sequins and Glitter Confetti Wholesale Catalog',
    lastModified: '2026-09-22',
    resources: [
      ['/v2-preview/custom-solutions/', 'Custom & Private Label'],
      ['/v2-preview/quality-control/', 'Quality Checkpoints'],
      ['/v2-preview/blog/packaging-quality-checkpoints/', 'Packaging Guide']
    ]
  }
};

for (const [category, plan] of Object.entries(categoryPlans)) {
  let html = await readFile(plan.previewFile, 'utf8');
  html = setPageMetadata(html, plan);
  if (!html.includes('/v2-preview/assets/product-detail.css')) {
    html = replaceFirstRequired(
      html,
      /<\/head>/i,
      '  <link rel="stylesheet" href="/v2-preview/assets/product-detail.css">\n</head>',
      `${category} related-product stylesheet`
    );
  }
  html = replaceFirstRequired(html, /<h1>[^<]*<\/h1>/i, `<h1>${escapeHtml(plan.h1)}</h1>`, `${category} H1`);
  html = replaceFirstRequired(
    html,
    /(<h1>[^<]*<\/h1>\s*)<p>[\s\S]*?<\/p>/i,
    `$1<p>${escapeHtml(plan.intro)}</p>`,
    `${category} intro`
  );
  html = upsertJsonLd(html, `${category}-item-list`, itemListFor(category, plan.listName));
  html = upsertJsonLd(html, `${category}-collection-page`, collectionPageFor(category, plan));

  const products = catalog.products.filter((product) => product.category === category).slice(0, 4);
  const resourceLinks = plan.resources
    .map(([href, label]) => `<a class="btn btn-light" href="${href}">${escapeHtml(label)}</a>`)
    .join('');
  const productLinks = products
    .map((product) => `<a class="product-related-card" href="${product.previewPath}"><img src="${escapeAttr(product.image)}" width="800" height="800" loading="lazy" decoding="async" alt="${escapeAttr(`${product.title}, product code ${product.sku}`)}"><div><span>${escapeHtml(product.sku)}</span><h3>${escapeHtml(product.title)}</h3></div></a>`)
    .join('');
  const block = `<section class="section" data-seo-growth="${category}-hub"><div class="container"><div class="section-head"><span class="eyebrow">Buyer resources &amp; internal links</span><h2>Compare products, sourcing guidance and project requirements.</h2><p>Use the category catalog as the main buying hub, then review related products and sourcing resources before sending a mixed-SKU or custom inquiry.</p></div><div class="actions">${resourceLinks}</div><div class="product-related-grid" style="margin-top:24px">${productLinks}</div></div></section>`;
  const existingHub = new RegExp(`<section class="section" data-seo-growth="${category}-hub">[\\s\\S]*?<\\/section>`, 'i');
  if (existingHub.test(html)) html = html.replace(existingHub, block);
  else if (/<section class="section" id="specifications">/i.test(html)) {
    html = html.replace(/<section class="section" id="specifications">/i, `${block}<section class="section" id="specifications">`);
  } else {
    html = replaceFirstRequired(html, /<\/main>/i, `${block}</main>`, `${category} internal-link insertion`);
  }

  await writeFile(plan.previewFile, html, 'utf8');
  updateSeoRoute(plan.productionPath, { title: plan.title, description: plan.description, lastModified: plan.lastModified || '2026-09-06' });
}

const polymerProfiles = {
  YX048: {
    title: 'Pink Candy Polymer Clay Slices Wholesale YX048 | HAIBUCRAFT',
    description: 'Source YX048 pink candy polymer clay slices for coordinated slime, shaker and DIY assortments. Mixed-SKU packing and custom requirements are reviewed by quote.',
    heading: 'Pink candy slices for coordinated sweet-theme assortments.',
    copy: 'YX048 combines a pink candy-led visual direction with small decorative pieces suited to buyers building pastel or dessert-theme assortments. It can be reviewed alongside other sweet polymer clay slices when a program needs several product codes in one shipment.',
    applications: ['Pastel and candy-theme slime assortments', 'Shaker filler and DIY kit programs', 'Mixed-SKU wholesale bundles']
  },
  YX043: {
    title: 'Candy Polymer Clay Slices Wholesale – YX043 | HAIBUCRAFT',
    lastModified: '2026-09-22',
    description: 'Source YX043 colorful candy polymer clay slices wholesale for slime, nail art, shakers and DIY kits. Ask about bulk packing, mixed SKUs and custom packaging.',
    h1: 'YX043 Colorful Candy Polymer Clay Slices',
    intro: 'Wholesale candy-style polymer clay slices for slime, nail art, shakers, resin crafts and DIY kits. Reference YX043 for mixed-SKU or custom packing review.',
    heading: 'Colorful round slices for bright, repeatable assortment themes.',
    copy: 'YX043 uses a colorful round-slice direction that works as a general-purpose accent across slime, nail-art and shaker programs. Buyers can reference this code when they need a bright mixed-color component without tying the assortment to one seasonal event.',
    applications: ['Bright slime and craft mixes', 'Nail-art and shaker filler assortments', 'Year-round mixed-color programs']
  },
  YX577: {
    title: 'Colorful Polymer Clay Sprinkle Mix Wholesale YX577 | HAIBUCRAFT',
    description: 'Source YX577 colorful polymer clay sprinkle and scatter mix for slime, shaker fillers and DIY kits. Confirm mix ratio, packing and custom color direction by quotation.',
    heading: 'Scatter-style polymer clay sprinkles for colorful craft mixes.',
    copy: 'YX577 is positioned as a colorful scatter mix for buyers who want a varied decorative look rather than a single repeated motif. It is a useful reference for slime and DIY-kit assortments where color distribution and mix ratio need to be agreed before production.',
    applications: ['Color-led slime sprinkle mixes', 'DIY kit and shaker filler programs', 'Custom mix-ratio review']
  },
  YX3531: {
    title: 'Fantasy Candy Polymer Clay Slices Wholesale YX3531 | HAIBUCRAFT',
    description: 'Source YX3531 fantasy candy polymer clay slices with accent details for premium-looking slime and DIY assortments. Confirm composition, size and packing by quote.',
    heading: 'Fantasy candy slices for higher-detail decorative assortments.',
    copy: 'YX3531 has a fantasy candy direction with accent details that gives buyers a more decorative visual option than a basic single-shape slice. It can be shortlisted for coordinated craft kits where the approved sample, finish and mix balance matter to the final presentation.',
    applications: ['Fantasy-theme slime assortments', 'Decorative DIY and shaker kits', 'Sample-led premium mix review']
  },
  YX3400: {
    title: 'Gothic Halloween Polymer Clay Slices Wholesale YX3400 | HAIBUCRAFT',
    description: 'Source YX3400 gothic Halloween polymer clay slices for seasonal slime, craft kits and shaker fillers. Confirm assortment ratio, packaging and schedule by quotation.',
    heading: 'Gothic seasonal slices for Halloween craft programs.',
    copy: 'YX3400 is a darker Halloween-oriented polymer clay mix for buyers planning seasonal slime, shaker or DIY assortments. Because seasonal programs are date-sensitive, the exact quantity, assortment ratio, packaging and production schedule should be confirmed together at quotation stage.',
    applications: ['Halloween slime assortments', 'Seasonal DIY and shaker kits', 'Retail-ready mixed seasonal programs']
  },
  YX097: {
    title: 'Rainbow Polymer Clay Sprinkle Mix Wholesale YX097 | HAIBUCRAFT',
    description: 'Source YX097 rainbow polymer clay sprinkle and crumble mix for slime, shaker fillers and DIY assortments, with color balance and packing confirmed by quotation.',
    heading: 'Rainbow crumble-style slices for multicolor assortment programs.',
    copy: 'YX097 offers a rainbow crumble visual direction for buyers who need a multicolor filler across slime and craft applications. It is best reviewed with the target color balance and packing format so the delivered mix matches the intended assortment presentation.',
    applications: ['Rainbow slime and sprinkle mixes', 'Shaker filler and craft kits', 'Color-balance controlled assortments']
  },
  YX038: {
    title: 'Halloween Polymer Clay Slice Mix Wholesale YX038 | HAIBUCRAFT',
    description: 'Source YX038 Halloween polymer clay slices for seasonal slime, shaker and DIY kits. Confirm product mix, packaging, timing and destination requirements by quote.',
    heading: 'Halloween theme slices for seasonal wholesale planning.',
    copy: 'YX038 is a Halloween-focused slice mix designed for buyers assembling seasonal slime, shaker and DIY-kit programs. It should be planned early enough to confirm the product mix, packing format and delivery window before the selling season.',
    applications: ['Halloween slime add-ins', 'Seasonal shaker and DIY kits', 'Mixed-SKU Halloween programs']
  },
  YX778: {
    title: 'Strawberry Polymer Clay Slices Wholesale YX778 | HAIBUCRAFT',
    description: 'Source YX778 strawberry and candy-heart polymer clay slices for fruit-theme slime, shaker and DIY programs, with packing and mix requirements confirmed by quote.',
    heading: 'Strawberry and heart slices for fruit-and-sweet assortments.',
    copy: 'YX778 combines strawberry and candy-heart cues for buyers building fruit, dessert or pink-theme craft assortments. It can be grouped with other sweet or fruit product codes when a wholesale program needs several related designs under one purchasing brief.',
    applications: ['Fruit-theme slime mixes', 'Pink dessert and DIY assortments', 'Related-SKU wholesale bundles']
  }
};

for (const [sku, profile] of Object.entries(polymerProfiles)) {
  const product = catalog.products.find((item) => item.sku === sku && item.category === 'polymer-clay-slices');
  if (!product) throw new Error(`Missing polymer clay catalog product ${sku}`);
  const file = path.join(previewRoot, product.previewPath.slice('/v2-preview/'.length), 'index.html');
  let html = await readFile(file, 'utf8');
  html = setPageMetadata(html, profile);
  html = updateProductJsonLd(html, profile.description);
  if (profile.h1) {
    html = replaceFirstRequired(html, /<h1>[^<]*<\/h1>/i, `<h1>${escapeHtml(profile.h1)}</h1>`, `${sku} H1`);
  }
  if (profile.intro) {
    html = replaceFirstRequired(
      html,
      /(<h1>[^<]*<\/h1>\s*)<p>[\s\S]*?<\/p>/i,
      `$1<p>${escapeHtml(profile.intro)}</p>`,
      `${sku} intro`
    );
  }
  if (!html.includes('data-seo-growth="polymer-detail"')) {
    const applicationList = profile.applications.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const block = `<section class="section" data-seo-growth="polymer-detail"><div class="container split"><div><span class="eyebrow">Wholesale polymer clay slices &amp; sprinkles</span><h2>${escapeHtml(profile.heading)}</h2><p>${escapeHtml(profile.copy)}</p></div><div class="card"><h3>Buyer-fit reference</h3><ul class="checklist">${applicationList}</ul><p>Exact dimensions, composition, MOQ, mix ratio, packing and lead time are confirmed against the approved sample and quotation.</p></div></div></section>`;
    html = replaceFirstRequired(html, /<section class="section alt">/i, `${block}<section class="section alt">`, `${sku} unique product context`);
  }
  await writeFile(file, html, 'utf8');
  updateSeoRoute(product.productionPath, { title: profile.title, description: profile.description, ...(profile.lastModified ? { lastModified: profile.lastModified } : {}) });
}

const collections = [
  {
    key: 'halloween',
    slug: 'halloween-slime-charms',
    title: 'Halloween Slime Charms Wholesale | Bulk Seasonal Mixes | HAIBUCRAFT',
    description: 'Browse real Halloween slime charm SKUs for wholesale seasonal assortments, mixed packs, DIY kits and private-label sourcing. Confirm packing and timing by quotation.',
    h1: 'Halloween Slime Charms Wholesale',
    intro: 'Plan bulk Halloween slime charm assortments using real HAIBUCRAFT catalog SKUs, with mixed-SKU packing, private-label options and delivery requirements reviewed before order confirmation.',
    skus: ['SLM10002', 'SLM10004', 'SLM10010', 'SLM10011', 'SLM10014', 'SLM10021'],
    buyerFit: 'For seasonal slime drops, party kits and retail-ready DIY assortments, these six slime-only codes cover ghost, skeleton, candy-corn, pumpkin, cat and spider directions.',
    mixRatio: 'Define the target share of focal charms and filler slices by selling unit. If a bag must contain each motif, state the minimum count per design rather than relying on an informal theme name.',
    sampling: 'Approve a physical or photo sample for color, finish, size and motif balance before packaging artwork is released. Record any approved substitute in the SKU brief.',
    reversePlan: 'Work backward from the Halloween launch or warehouse arrival date and reserve time for quote, sample, artwork, production, inspection, packing and transport.'
  },
  {
    key: 'christmas',
    slug: 'christmas-slime-charms',
    title: 'Christmas Slime Charms Wholesale | Bulk Holiday Mixes | HAIBUCRAFT',
    description: 'Browse real Christmas slime charm SKUs for wholesale holiday assortments, DIY kits and private-label programs. Confirm mix, packing and seasonal timing by quotation.',
    h1: 'Christmas Slime Charms Wholesale',
    intro: 'Build bulk Christmas slime charm programs from real catalog SKUs, combining Santa, tree, snowflake, peppermint and snowman themes with mixed-SKU and private-label sourcing support.',
    skus: ['SLM10003', 'SLM10009', 'SLM10013', 'SLM10015', 'SLM10017', 'SLM10129', 'SLM26529'],
    buyerFit: 'For slime brands and DIY-kit buyers, the seven-code slime shortlist covers classic Santa, tree, snowflake, peppermint, snowman and gingerbread directions, with YX4109 shown separately as a related Christmas polymer clay option.',
    mixRatio: 'Start with a written ratio by SKU or motif family (for example, focal charms versus small filler pieces). Confirm the final count or weight per selling unit against the approved sample.',
    sampling: 'Request a representative sample of the selected codes before artwork and packing are approved. Note substitutions, color tolerance and whether every design must appear in each bag.',
    reversePlan: 'Work backward from the required arrival date: quotation and sample review, artwork approval, production, inspection, packing and transport each need an agreed decision window.'
  },
];

function collectionCard(product, collection) {
  const quoteParams = new URLSearchParams({
    source: 'seasonal-collection',
    category: 'slime-charms',
    product_code: product.sku,
    product: product.title,
    image: product.image,
    landing_page: `/v2-preview/products/slime-charms/${collection.slug}/`,
    source_page: `/v2-preview/products/slime-charms/${collection.slug}/`,
    product_page: product.previewPath,
    collection: collection.key
  });
  return `<article class="product-card-v2" data-product-card><div class="seasonal-product-media"><img src="${escapeAttr(product.image)}" width="1000" height="1000" loading="lazy" decoding="async" alt="${escapeAttr(`${product.title}, product code ${product.sku}`)}"></div><div class="product-card-body"><div class="product-card-top"><span class="sku-badge">${escapeHtml(product.sku)}</span><span class="product-type">${escapeHtml(product.type)}</span></div><h3>${escapeHtml(product.title)}</h3><div class="product-card-actions"><a class="btn btn-light product-detail-link" href="${product.previewPath}">View Details</a><a class="btn btn-primary get-quote" href="/v2-preview/quote/?${quoteParams.toString().replaceAll('&', '&amp;')}">Get Quote</a></div></div></article>`;
}

const seasonalCollectionStyles = `
    [data-page="slime-charms-seasonal"] .product-grid-v2 {
      align-items: stretch;
    }
    [data-page="slime-charms-seasonal"] .product-card-v2 {
      height: 100%;
    }
    [data-page="slime-charms-seasonal"] .seasonal-product-media {
      width: 100%;
      aspect-ratio: 1 / 1;
      overflow: hidden;
      border-bottom: 1px solid #eceef4;
      background: #f6f7fa;
    }
    [data-page="slime-charms-seasonal"] .seasonal-product-media img {
      display: block;
      width: 100%;
      height: 100%;
      aspect-ratio: 1 / 1;
      object-fit: cover;
      object-position: center;
    }
    [data-page="slime-charms-seasonal"] .product-card-actions {
      margin-top: auto;
    }
    [data-page="slime-charms-seasonal"] .seasonal-quote-card {
      display: grid;
      gap: 14px;
      align-content: start;
    }
    [data-page="slime-charms-seasonal"] .seasonal-quote-card h3,
    [data-page="slime-charms-seasonal"] .seasonal-quote-card p {
      margin: 0;
    }
    [data-page="slime-charms-seasonal"] .seasonal-quote-card .checklist {
      margin: 0;
    }

    [data-page="slime-charms-seasonal"] .procurement-guide .section-head {
      max-width: 820px;
    }
    [data-page="slime-charms-seasonal"] .procurement-guide .section-head p {
      max-width: 760px;
    }
    [data-page="slime-charms-seasonal"] .procurement-table-wrap {
      overflow-x: auto;
      margin-top: 24px;
      border: 1px solid #dce2ea;
      border-radius: 20px;
      background: #fff;
      box-shadow: 0 14px 38px rgba(22, 47, 75, .08);
    }
    [data-page="slime-charms-seasonal"] .procurement-table {
      width: 100%;
      min-width: 980px;
      border-collapse: collapse;
    }
    [data-page="slime-charms-seasonal"] .procurement-table th,
    [data-page="slime-charms-seasonal"] .procurement-table td {
      padding: 15px 16px;
      border-bottom: 1px solid #e8edf3;
      text-align: left;
      vertical-align: top;
    }
    [data-page="slime-charms-seasonal"] .procurement-table th {
      background: #173f67;
      color: #fff;
      font-size: .83rem;
      letter-spacing: .02em;
    }
    [data-page="slime-charms-seasonal"] .procurement-table tbody tr:nth-child(even) {
      background: #f7f9fc;
    }
    [data-page="slime-charms-seasonal"] .procurement-table tbody tr:last-child td {
      border-bottom: 0;
    }
    [data-page="slime-charms-seasonal"] .procurement-product-link {
      color: #173f67;
      font-weight: 750;
      text-decoration: none;
    }
    [data-page="slime-charms-seasonal"] .procurement-product-link:hover,
    [data-page="slime-charms-seasonal"] .procurement-product-link:focus-visible {
      text-decoration: underline;
    }
    [data-page="slime-charms-seasonal"] .procurement-sku {
      display: block;
      margin-bottom: 4px;
      color: #677386;
      font-size: .78rem;
      font-weight: 750;
      letter-spacing: .04em;
    }
    [data-page="slime-charms-seasonal"] .availability-badge {
      display: inline-flex;
      padding: 6px 10px;
      border-radius: 999px;
      background: #e8f6ef;
      color: #17633f;
      font-size: .78rem;
      font-weight: 750;
      white-space: nowrap;
    }
    [data-page="slime-charms-seasonal"] .procurement-note {
      margin: 16px 0 0;
      color: #5e6878;
      font-size: .9rem;
      line-height: 1.65;
    }
    [data-page="slime-charms-seasonal"] .procurement-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      margin-top: 22px;
    }
    @media (max-width: 760px) {
      [data-page="slime-charms-seasonal"] .procurement-table-wrap {
        overflow: visible;
        border: 0;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
      }
      [data-page="slime-charms-seasonal"] .procurement-table {
        min-width: 0;
      }
      [data-page="slime-charms-seasonal"] .procurement-table thead {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      [data-page="slime-charms-seasonal"] .procurement-table,
      [data-page="slime-charms-seasonal"] .procurement-table tbody,
      [data-page="slime-charms-seasonal"] .procurement-table tr,
      [data-page="slime-charms-seasonal"] .procurement-table td {
        display: block;
        width: 100%;
      }
      [data-page="slime-charms-seasonal"] .procurement-table tr {
        margin-bottom: 16px;
        overflow: hidden;
        border: 1px solid #dce2ea;
        border-radius: 16px;
        background: #fff;
        box-shadow: 0 10px 26px rgba(22, 47, 75, .07);
      }
      [data-page="slime-charms-seasonal"] .procurement-table tbody tr:nth-child(even) {
        background: #fff;
      }
      [data-page="slime-charms-seasonal"] .procurement-table td {
        display: grid;
        grid-template-columns: minmax(110px, 38%) 1fr;
        gap: 12px;
        padding: 12px 14px;
      }
      [data-page="slime-charms-seasonal"] .procurement-table td::before {
        content: attr(data-label);
        color: #4b586b;
        font-size: .78rem;
        font-weight: 750;
      }
      [data-page="slime-charms-seasonal"] .procurement-table td:first-child {
        display: block;
        padding: 16px 14px;
        background: #f1f5fa;
      }
      [data-page="slime-charms-seasonal"] .procurement-table td:first-child::before {
        display: none;
      }
      [data-page="slime-charms-seasonal"] .procurement-table tr:last-child td {
        border-bottom: 1px solid #e8edf3;
      }
      [data-page="slime-charms-seasonal"] .procurement-table tr:last-child td:last-child {
        border-bottom: 0;
      }
    }

`;

function procurementRow(product) {
  const packing = product.sku === 'YX4109' ? '500 g/bag' : '100 pcs/bag';
  return `<tr><td data-label="Product"><span class="procurement-sku">${escapeHtml(product.sku)}</span><a class="procurement-product-link" href="${product.previewPath}">${escapeHtml(product.title)}</a></td><td data-label="Availability"><span class="availability-badge">Available for inquiry</span></td><td data-label="Standard Packing">${packing}</td><td data-label="MOQ">Negotiable*</td><td data-label="Sample Time">3–7 days*</td><td data-label="Estimated Lead Time">10–20 days*</td></tr>`;
}

function procurementGuide(collection, products, previewPath) {
  const procurementProducts = [...products];
  if (collection.key === 'christmas') {
    const relatedProduct = catalog.products.find((item) => item.sku === 'YX4109' && item.category === 'polymer-clay-slices');
    if (!relatedProduct) throw new Error('Missing Christmas procurement product YX4109');
    procurementProducts.push(relatedProduct);
  }
  const intro = collection.key === 'christmas'
    ? 'Use this guide to compare the slime shortlist and related polymer clay option before requesting a quotation. Availability means the SKU can be discussed for an order; it is not a real-time inventory promise.'
    : 'Use this guide to shortlist products before requesting a quotation. Availability means the SKU can be discussed for an order; it is not a real-time inventory promise.';
  const quoteParams = new URLSearchParams({
    source: `${collection.key}-procurement-guide`,
    source_page: previewPath,
    collection: collection.key
  });
  return `<section class="section procurement-guide" aria-labelledby="${collection.key}-procurement-heading"><div class="container"><div class="section-head"><span class="eyebrow">Wholesale order information</span><h2 id="${collection.key}-procurement-heading">${collection.h1.replace(' Slime Charms Wholesale', '')} procurement terms at a glance</h2><p>${escapeHtml(intro)}</p></div><div class="procurement-table-wrap"><table class="procurement-table"><thead><tr><th scope="col">Product</th><th scope="col">Availability</th><th scope="col">Standard Packing</th><th scope="col">MOQ</th><th scope="col">Sample Time</th><th scope="col">Estimated Lead Time</th></tr></thead><tbody>${procurementProducts.map(procurementRow).join('')}</tbody></table></div><p class="procurement-note">* Indicative only. Final MOQ, sample time and lead time depend on design complexity, packaging, customization, order quantity and material availability, and will be confirmed in the quotation.</p><div class="procurement-actions"><a class="btn btn-primary" href="/v2-preview/quote/?${quoteParams.toString().replaceAll('&', '&amp;')}">Request a confirmed quotation</a><a class="btn btn-light" href="/custom-solutions/">Discuss custom packing</a></div></div></section>`;
}

for (const collection of collections) {
  const products = collection.skus.map((sku) => {
    const product = catalog.products.find((item) => item.sku === sku && item.category === 'slime-charms');
    if (!product) throw new Error(`Missing ${collection.key} collection product ${sku}`);
    return product;
  });
  const previewPath = `/v2-preview/products/slime-charms/${collection.slug}/`;
  const productionPath = `/products/slime-charms-wholesale/${collection.slug}/`;
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
      { '@type': 'ListItem', position: 2, name: 'Slime Charms', item: `${origin}/products/slime-charms-wholesale/` },
      { '@type': 'ListItem', position: 3, name: collection.h1, item: `${origin}${productionPath}` }
    ]
  };
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: collection.h1,
    numberOfItems: products.length,
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.title,
      url: `${origin}${product.productionPath}`
    }))
  };
  let html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width,initial-scale=1">\n  <title>${escapeHtml(collection.title)}</title>\n  <meta name="description" content="${escapeAttr(collection.description)}">\n  <meta name="robots" content="noindex,nofollow">\n  <link rel="stylesheet" href="/v2-preview/assets/site-v2.css">\n  <link rel="stylesheet" href="/v2-preview/assets/site-v2-fixes.css">\n  <link rel="stylesheet" href="/v2-preview/assets/product-directory.css">\n  <link rel="stylesheet" href="/v2-preview/assets/category-ux.css">\n  <style>${seasonalCollectionStyles}</style>\n  <script type="application/ld+json">${JSON.stringify(breadcrumbs).replaceAll('<', '\\u003c')}</script>\n  <script type="application/ld+json">${JSON.stringify(itemList).replaceAll('<', '\\u003c')}</script>\n</head>\n<body data-page="slime-charms-seasonal">\n  <div data-site-header></div>\n  <main>\n    <section class="page-hero"><div class="container"><div class="breadcrumbs"><a href="/v2-preview/">Home</a> / <a href="/v2-preview/products/slime-charms/">Slime Charms</a> / ${escapeHtml(collection.h1)}</div><span class="eyebrow">Seasonal wholesale collection</span><h1>${escapeHtml(collection.h1)}</h1><p>${escapeHtml(collection.intro)}</p><div class="actions"><a class="btn btn-primary" href="/v2-preview/quote/?source=${collection.key}-collection&amp;category=slime-charms&amp;landing_page=${encodeURIComponent(previewPath)}&amp;source_page=${encodeURIComponent(previewPath)}&amp;collection=${collection.key}">Request Seasonal Quote</a><a class="btn btn-light" href="/v2-preview/products/slime-charms/">Browse All Slime Charms</a></div></div></section>\n    <section class="section alt"><div class="container"><div class="section-head"><span class="eyebrow">Real catalog selection</span><h2>${products.length} catalog SKUs for ${escapeHtml(collection.key)} sourcing.</h2><p>Only real products already present in the HAIBUCRAFT catalog are shown here. Product mix, packaging, labeling, MOQ, lead time and destination requirements are confirmed in the quotation.</p></div><div class="product-grid-v2">${products.map((product) => collectionCard(product, collection)).join('')}</div></div></section>\n    ${procurementGuide(collection, products, previewPath)}
    <section class="section"><div class="container split"><div><span class="eyebrow">Seasonal planning</span><h2>Confirm the selling window before locking the assortment.</h2><ul class="checklist"><li>Shortlist exact product codes and target quantities.</li><li>Define mixed-pack ratios and whether every design must appear in each selling unit.</li><li>Confirm private-label bag, jar, label or carton requirements.</li><li>State destination country and required delivery window.</li><li>Request product-specific documentation where applicable.</li></ul></div><div class="card"><h3>Need a mixed seasonal program?</h3><p>Send several product codes in one inquiry so assortment, packing and timing can be reviewed together.</p><a class="btn btn-primary" href="/v2-preview/quote/?source=${collection.key}-collection-cta&amp;category=slime-charms&amp;landing_page=${encodeURIComponent(previewPath)}&amp;source_page=${encodeURIComponent(previewPath)}&amp;collection=${collection.key}">Start Seasonal Inquiry</a></div></div></section>\n    <section class="section alt" data-seasonal-buyer-content><div class="container"><div class="section-head"><span class="eyebrow">Buyer-fit guidance</span><h2>Plan a ${escapeHtml(collection.key)} assortment around real pack decisions.</h2></div><div class="card-grid"><article class="card"><h3>Who this shortlist fits</h3><p>${escapeHtml(collection.buyerFit)}</p></article><article class="card"><h3>Mix ratios and pack units</h3><p>${escapeHtml(collection.mixRatio)}</p></article><article class="card"><h3>Sampling and custom review</h3><p>${escapeHtml(collection.sampling)}</p></article><article class="card"><h3>Reverse-plan from arrival</h3><p>${escapeHtml(collection.reversePlan)}</p></article></div></div></section>\n    <section class="section alt"><div class="container"><div class="section-head"><span class="eyebrow">Related sourcing</span><h2>Continue from the seasonal collection.</h2></div><div class="actions"><a class="btn btn-light" href="/v2-preview/products/slime-charms/">All Slime Charms</a><a class="btn btn-light" href="/v2-preview/custom-solutions/">Custom &amp; Private Label</a><a class="btn btn-light" href="/v2-preview/quality-control/">Quality Checkpoints</a></div></div></section>\n  </main>\n  <div data-site-footer></div>\n  <script src="/v2-preview/assets/components.js"></script>\n  <script src="/v2-preview/assets/site-v2.js"></script>\n</body>\n</html>\n`;
  if (collection.key === 'christmas') {
    const oldQuoteCard = `<div class="card"><h3>Need a mixed seasonal program?</h3><p>Send several product codes in one inquiry so assortment, packing and timing can be reviewed together.</p><a class="btn btn-primary" href="/v2-preview/quote/?source=christmas-collection-cta&amp;category=slime-charms&amp;landing_page=${encodeURIComponent(previewPath)}&amp;source_page=${encodeURIComponent(previewPath)}&amp;collection=christmas">Start Seasonal Inquiry</a></div>`;
    const christmasQuoteCard = `<div class="card seasonal-quote-card"><span class="eyebrow">Quote checklist</span><h3>Get a Christmas range quote</h3><p>Choose one or more SKU cards, then share your target quantity, packaging plan, destination and target arrival date. We will confirm MOQ, available options and lead time for the selected products.</p><ul class="checklist"><li>Selected SKU codes and target quantity</li><li>Bag, jar, label or carton requirements</li><li>Destination country and target arrival date</li></ul><a class="btn btn-primary" href="/v2-preview/quote/?source=christmas-collection-cta&amp;category=slime-charms&amp;landing_page=${encodeURIComponent(previewPath)}&amp;source_page=${encodeURIComponent(previewPath)}&amp;collection=christmas">Get Christmas Range Quote</a></div>`;
    html = html.replace('>Request Seasonal Quote</a>', '>Get Christmas Range Quote</a>').replace(oldQuoteCard, christmasQuoteCard);
  }
  const file = path.join(previewRoot, 'products', 'slime-charms', collection.slug, 'index.html');
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, html, 'utf8');

  const existingRoute = seoMap.routes.find((route) => route.productionPath === productionPath);
  const route = { previewPath, productionPath, title: collection.title, description: collection.description, type: 'website', index: true, generatedCollection: true, lastModified: '2026-09-21' };
  if (existingRoute) Object.assign(existingRoute, route);
  else seoMap.routes.push(route);

  const source = `v2-preview/products/slime-charms/${collection.slug}/index.html`;
  const destination = `products/slime-charms-wholesale/${collection.slug}/index.html`;
  const existingPage = migrationMap.pages.find((page) => page.productionPath === productionPath);
  const page = { source, destination, action: 'create', productionPath, generatedCollection: true };
  if (existingPage) Object.assign(existingPage, page);
  else migrationMap.pages.push(page);

  const sitemapEntry = `<url><loc>${origin}${productionPath}</loc><changefreq>weekly</changefreq><priority>0.85</priority></url>`;
  if (!sitemap.includes(`<loc>${origin}${productionPath}</loc>`)) {
    sitemap = sitemap.replace('</urlset>', `  ${sitemapEntry}\n</urlset>`);
  }
}

await writeFile(seoMapPath, `${JSON.stringify(seoMap, null, 2)}\n`, 'utf8');
await writeFile(migrationMapPath, `${JSON.stringify(migrationMap, null, 2)}\n`, 'utf8');
await writeFile(sitemapPath, sitemap, 'utf8');

console.log('SEO growth sprint source generated: 9 unique Polymer Clay detail enhancements, 4 optimized category hubs, ItemList/CollectionPage data, internal links, and Halloween/Christmas collection pages.');

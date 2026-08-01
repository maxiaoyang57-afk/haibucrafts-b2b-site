import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const previewRoot = path.join(root, 'v2-preview');
const blogRoot = path.join(previewRoot, 'blog');
const seoMapPath = path.join(previewRoot, 'seo-production-map.json');
const migrationMapPath = path.join(previewRoot, 'production-config', 'file-migration-map.json');
const sitemapPath = path.join(previewRoot, 'production-config', 'sitemap.xml');

const articles = [
  {
    slug: 'how-to-prepare-a-wholesale-product-brief',
    category: 'Buying Guide',
    title: 'How to Prepare a Wholesale Product Brief',
    seoTitle: 'Wholesale Product Brief Guide | HAIBUCRAFT',
    description: 'Prepare a clearer wholesale inquiry by defining product codes, quantities, intended use, packaging, destination and approval requirements.',
    dek: 'A complete brief reduces quotation revisions and separates product, packaging and market requirements before sampling begins.',
    sections: [
      ['Identify the exact product', 'List the category, product code, reference image and required variation. For a mixed assortment, state every selected code and the intended ratio.'],
      ['State quantity in a usable unit', 'Clarify whether the target is pieces, grams, bags, jars, sets or cartons. A number without a unit cannot support a reliable packing or pricing review.'],
      ['Explain intended use and market', 'State whether the item is for slime, nail art, resin crafts, shaker fillers or another application. Include the destination country and expected age grading.'],
      ['Define packaging and approval criteria', 'Specify pack weight or piece count, label and barcode needs, warning text, color range, dimensions, assortment balance and acceptable surface finish.']
    ],
    checklist: ['Product category and codes', 'Quantity and unit', 'Destination and intended use', 'Packaging format', 'Artwork and barcode files', 'Sample approval criteria'],
    note: 'MOQ, lead time and documentation should be confirmed after the product, packaging and destination scope are defined.',
    links: [['Product Directory', '/v2-preview/products/'], ['Custom Solutions', '/v2-preview/custom-solutions/'], ['Request Quote', '/v2-preview/quote/?source=blog-resource&article=product-brief']]
  },
  {
    slug: 'sample-approval-checklist',
    category: 'OEM & Custom',
    title: 'Sample Approval Checklist for Custom Craft Supplies',
    seoTitle: 'Custom Sample Approval Checklist | HAIBUCRAFT',
    description: 'Use a written sample approval checklist to confirm appearance, dimensions, assortment, finish, packaging and controlled changes before production.',
    dek: 'A signed-off sample should be supported by written criteria so that visual approval can be translated into repeatable production checks.',
    sections: [
      ['Record the sample identity', 'Assign a product code or project reference, revision date and image set. Keep one approved version so later comments do not refer to different samples.'],
      ['Check measurable features', 'Record dimensions, piece count, pack weight, assortment ratio and label placement. Use tolerances only when they have been discussed and approved.'],
      ['Review appearance consistently', 'Compare color direction, surface finish, print position, glitter distribution and visible defects under a repeatable viewing condition.'],
      ['Control every change in writing', 'After approval, document requested changes, affected files and the new revision. A chat message alone should not replace the final approval record.']
    ],
    checklist: ['Product and revision code', 'Reference images', 'Dimensions and count', 'Color and finish', 'Packout and label', 'Written deviations'],
    note: 'A sample approval is an operational reference. It does not replace product-specific laboratory testing or market compliance review.',
    links: [['Custom Solutions', '/v2-preview/custom-solutions/'], ['Manufacturing', '/v2-preview/manufacturing/'], ['Quality Control', '/v2-preview/quality-control/']]
  },
  {
    slug: 'packaging-quality-checkpoints',
    category: 'Quality & Packaging',
    title: 'Packaging and Quality Checkpoints for B2B Orders',
    seoTitle: 'B2B Packaging Quality Checkpoints | HAIBUCRAFT',
    description: 'Define pack count, labels, warnings, barcodes, cartons, quantity reconciliation and pre-shipment packaging checks for wholesale craft orders.',
    dek: 'Packaging instructions become more reliable when every count, label and carton requirement has a named checkpoint.',
    sections: [
      ['Define the selling unit', 'State piece count or net weight, inner-pack quantity and carton quantity. Use the same unit in the quotation, packing list and inspection record.'],
      ['Approve artwork and variable data', 'Confirm label size, logo, barcode, warnings, country information and lot or date fields. Freeze the approved artwork revision before printing.'],
      ['Check packout and protection', 'Review sealing, empty space, dividers, inner bags and carton strength against the product shape and transport route.'],
      ['Reconcile finished quantities', 'Compare packed units, spare components, rejected items and carton totals. Resolve differences before shipping documents are finalized.']
    ],
    checklist: ['Unit count or weight', 'Approved artwork', 'Barcode verification', 'Warnings and labels', 'Inner protection', 'Carton reconciliation'],
    note: 'Packaging checks verify the approved packout. They do not establish legal labeling compliance without a market-specific review.',
    links: [['Quality Control', '/v2-preview/quality-control/'], ['Manufacturing', '/v2-preview/manufacturing/'], ['Sample Approval Guide', '/v2-preview/blog/sample-approval-checklist/']]
  },
  {
    slug: 'planning-a-mixed-sku-wholesale-order',
    category: 'Order Planning',
    title: 'How to Plan a Mixed-SKU Wholesale Craft Order',
    seoTitle: 'Mixed-SKU Wholesale Order Planning | HAIBUCRAFT',
    description: 'Plan a mixed-SKU craft order by fixing product codes, quantities, pack formats, assortment ratios and carton-level reconciliation rules.',
    dek: 'Mixed orders are easier to quote and inspect when the assortment is treated as a controlled list rather than a general theme request.',
    sections: [
      ['Build one SKU matrix', 'List each product code, image, color or style, quantity and unit. Avoid combining several products under one informal nickname.'],
      ['Separate stock and custom requirements', 'Mark standard items, custom colors, buyer artwork and special packaging separately because they may follow different confirmation steps.'],
      ['Define assortment ratios', 'For mixed bags or sets, state the target ratio, acceptable variation and whether every design must appear in each selling unit.'],
      ['Plan carton reconciliation', 'Agree how mixed cartons will be labeled and how totals will be reported by SKU, selling unit and carton.']
    ],
    checklist: ['SKU matrix', 'Quantity by code', 'Stock versus custom', 'Mix ratio', 'Selling-unit format', 'Carton labels'],
    note: 'Mixed-order feasibility, MOQ and scheduling depend on the selected SKUs and packing structure and must be confirmed in the quotation.',
    links: [['Product Directory', '/v2-preview/products/'], ['Slime Charms', '/v2-preview/products/slime-charms/'], ['Prepare a Product Brief', '/v2-preview/blog/how-to-prepare-a-wholesale-product-brief/']]
  },
  {
    slug: 'private-label-packaging-brief',
    category: 'Private Label',
    title: 'Private-Label Packaging Brief for Craft Products',
    seoTitle: 'Private Label Packaging Brief | HAIBUCRAFT',
    description: 'Prepare a private-label packaging brief covering pack format, artwork, barcode, warning text, approval files and carton identification.',
    dek: 'A packaging brief should connect the buyer artwork to a specific product, pack size and destination requirement.',
    sections: [
      ['Choose the packaging structure', 'Define pouch, jar, box or counted pack, including dimensions, material preference, closure and display requirements.'],
      ['Prepare production-ready artwork', 'Supply the correct file format, dimensions, bleed, color references and font handling. Identify the final approved revision clearly.'],
      ['Separate buyer content from required content', 'List branding, marketing copy and design preferences separately from barcodes, warnings, country information and other market-driven fields.'],
      ['Approve a packed sample', 'Review the actual product inside the proposed pack. Check fill level, readability, sealing, barcode scan and carton presentation.']
    ],
    checklist: ['Pack type and size', 'Artwork revision', 'Barcode data', 'Warning copy', 'Packed sample', 'Master-carton mark'],
    note: 'The buyer remains responsible for approving market-specific label content. Packaging capability does not create a blanket compliance guarantee.',
    links: [['Custom Solutions', '/v2-preview/custom-solutions/'], ['Packaging Checkpoints', '/v2-preview/blog/packaging-quality-checkpoints/'], ['Request Quote', '/v2-preview/quote/?source=blog-resource&article=private-label-packaging']]
  },
  {
    slug: 'craft-product-document-checklist',
    category: 'Compliance Scope',
    title: 'Craft Product Compliance Document Checklist',
    seoTitle: 'Craft Product Document Checklist | HAIBUCRAFT',
    description: 'Review supplier, product, sample, standard, issue date and market scope before relying on a craft-product test report or certificate.',
    dek: 'A document is useful only when its named company, product, sample and standard match the item and market being reviewed.',
    sections: [
      ['Match the named company', 'Check the applicant, manufacturer, supplier or audit site shown on the document. Do not assume one entity name automatically covers another.'],
      ['Match the product and sample', 'Compare model numbers, product descriptions, materials, colors and sample photographs with the SKU being purchased.'],
      ['Read the standard and result', 'Confirm the cited test method, tested clauses, result and any age grading or intended-use limitation.'],
      ['Check dates and document type', 'Separate test reports, certificates, declarations and social-audit summaries. Review issue date, monitoring window and any stated expiry.']
    ],
    checklist: ['Named legal entity', 'Product and model', 'Sample identity', 'Test standard', 'Issue and expiry dates', 'Destination market'],
    note: 'Documents published by HAIBUCRAFT are presented with product and company scope notes. No report should be treated as covering every catalog item.',
    links: [['Certificates & Reports', '/v2-preview/certificates/'], ['Quality Control', '/v2-preview/quality-control/'], ['Product Directory', '/v2-preview/products/']]
  },
  {
    slug: 'pre-shipment-inspection-checklist',
    category: 'Quality Control',
    title: 'Pre-Shipment Inspection Checklist for Craft Orders',
    seoTitle: 'Pre-Shipment Inspection Checklist | HAIBUCRAFT',
    description: 'Prepare a pre-shipment inspection checklist for SKU identity, appearance, quantity, packaging, carton marks and document reconciliation.',
    dek: 'A pre-shipment review works best when the acceptance criteria were defined before production rather than invented at the inspection stage.',
    sections: [
      ['Confirm the inspection scope', 'List purchase order, SKU codes, quantities, approved samples, artwork revisions and the lot or cartons available for inspection.'],
      ['Check product identity and appearance', 'Compare code, color direction, dimensions, finish and obvious defects against the approved reference and written criteria.'],
      ['Verify quantity and packaging', 'Review selling-unit count or weight, seal, label, barcode, inner protection, carton quantity and carton marks.'],
      ['Record findings and disposition', 'Use photographs and counts to describe issues. State whether the lot is accepted, requires rework or needs buyer review before shipment.']
    ],
    checklist: ['Purchase order and SKU', 'Approved sample', 'Appearance checks', 'Unit quantity', 'Packaging and barcode', 'Carton totals'],
    note: 'Inspection sampling and acceptance rules should be agreed for the order. Operational inspection does not replace required laboratory testing.',
    links: [['Quality Control', '/v2-preview/quality-control/'], ['Manufacturing', '/v2-preview/manufacturing/'], ['Packaging Checkpoints', '/v2-preview/blog/packaging-quality-checkpoints/']]
  },
  {
    slug: 'how-to-compare-wholesale-craft-suppliers',
    category: 'Supplier Review',
    title: 'How to Compare Wholesale Craft Suppliers',
    seoTitle: 'How to Compare Craft Suppliers | HAIBUCRAFT',
    description: 'Compare craft suppliers using product-code discipline, sample control, packaging capability, document scope and communication quality.',
    dek: 'Useful supplier comparison goes beyond the lowest unit price and looks at how requirements are translated into controlled order steps.',
    sections: [
      ['Compare like-for-like quotations', 'Use the same product code, quantity unit, packing specification, destination and customization scope for every supplier response.'],
      ['Evaluate sample and change control', 'Ask how samples are identified, revisions are recorded and approved differences are carried into production.'],
      ['Review operational evidence', 'Look for real product imagery, facility or workflow evidence, clear quality checkpoints and realistic communication about limitations.'],
      ['Read documents by scope', 'Check the company, product, sample and standard named in each test report, certificate or audit summary rather than counting document logos.']
    ],
    checklist: ['Comparable quotation', 'Product-code clarity', 'Sample revision control', 'Packaging capability', 'Document scope', 'Response quality'],
    note: 'Supplier selection should reflect the specific order risk, destination and product use. No single checklist replaces buyer due diligence.',
    links: [['Manufacturing', '/v2-preview/manufacturing/'], ['Certificates & Reports', '/v2-preview/certificates/'], ['About HAIBUCRAFT', '/v2-preview/about/']]
  },
  {
    slug: 'polymer-clay-slice-buying-guide',
    category: 'Product Guide',
    title: 'Polymer Clay Slice Buying Guide for Wholesale Buyers',
    seoTitle: 'Polymer Clay Slice Buying Guide | HAIBUCRAFT',
    description: 'Specify polymer clay slice theme, dimensions, thickness, color range, mix ratio, pack unit and intended use before requesting a quote.',
    dek: 'A useful polymer-clay-slice inquiry describes both the visual theme and the measurable pack requirements.',
    sections: [
      ['Define theme and intended use', 'State whether the slices are for slime, nail art, resin crafts, shaker fillers or DIY kits because size and pack format may differ.'],
      ['Confirm dimensions and thickness', 'Use an approved sample or written measurement range. Do not rely on a photograph alone to establish scale.'],
      ['Specify color and mix balance', 'For assorted designs, define required themes, excluded colors, target ratios and whether every pack needs the same composition.'],
      ['Choose a packing unit', 'State grams, pieces, bags, jars or sets and include label, barcode, warning and carton requirements where applicable.']
    ],
    checklist: ['Theme and use', 'Dimensions', 'Thickness', 'Color range', 'Mix ratio', 'Pack unit'],
    note: 'Exact material, dimensions, MOQ, lead time and testing scope must be confirmed against the selected product code and approved sample.',
    links: [['Polymer Clay Slices', '/v2-preview/products/polymer-clay-slices/'], ['Custom Solutions', '/v2-preview/custom-solutions/'], ['Product Brief Guide', '/v2-preview/blog/how-to-prepare-a-wholesale-product-brief/']]
  },
  {
    slug: 'seasonal-craft-assortment-planning',
    category: 'Seasonal Planning',
    title: 'Seasonal Craft Assortment Planning Guide',
    seoTitle: 'Seasonal Craft Assortment Planning | HAIBUCRAFT',
    description: 'Plan seasonal craft assortments by fixing launch date, product codes, samples, artwork, packaging, inspection and shipping milestones.',
    dek: 'Seasonal programs need a reverse timeline that allows decisions to be approved before the selling window becomes the shipping deadline.',
    sections: [
      ['Start from the required arrival date', 'Work backward from the warehouse or retail launch date and include transport, inspection, packing, production, sampling and quotation time.'],
      ['Freeze the assortment early', 'Confirm product codes, quantities, ratios and substitutes. Late assortment changes can affect pricing, packing and document scope.'],
      ['Coordinate artwork and samples', 'Plan time for buyer files, sample production, revision comments and written approval before bulk packaging is ordered.'],
      ['Protect the final shipping window', 'Define inspection, rework decision time, carton documents and booking responsibility. Keep contingency for issues that require buyer approval.']
    ],
    checklist: ['Arrival deadline', 'SKU assortment', 'Sample approval', 'Artwork freeze', 'Inspection window', 'Shipping responsibility'],
    note: 'Lead time is order-specific. A seasonal plan should use confirmed quotation milestones rather than a general website estimate.',
    links: [['Product Directory', '/v2-preview/products/'], ['Mixed-SKU Planning', '/v2-preview/blog/planning-a-mixed-sku-wholesale-order/'], ['Request Quote', '/v2-preview/quote/?source=blog-resource&article=seasonal-planning']]
  }
];

const escapeHtml = (value) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

for (const article of articles) {
  const previewPath = `/v2-preview/blog/${article.slug}/`;
  const quoteHref = `/v2-preview/quote/?source=blog&amp;article=${article.slug}&amp;landing_page=${encodeURIComponent(previewPath)}`;
  const structuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    datePublished: '2026-08-01',
    dateModified: '2026-08-01',
    author: { '@type': 'Organization', name: 'HAIBUCRAFT' },
    publisher: { '@type': 'Organization', name: 'HAIBUCRAFT' },
    mainEntityOfPage: `https://www.haibucrafts.com/blog/${article.slug}/`
  }).replaceAll('<', '\\u003c');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(article.seoTitle)}</title>
  <meta name="description" content="${escapeHtml(article.description)}">
  <meta name="robots" content="noindex,nofollow">
  <link rel="stylesheet" href="/v2-preview/assets/site-v2.css">
  <link rel="stylesheet" href="/v2-preview/assets/site-v2-fixes.css">
  <link rel="stylesheet" href="/v2-preview/assets/blog-library.css">
  <script type="application/ld+json">${structuredData}</script>
</head>
<body data-page="blog-article">
  <div data-site-header></div>
  <main>
    <section class="blog-article-hero">
      <div class="container">
        <div class="breadcrumbs"><a href="/v2-preview/">Home</a> / <a href="/v2-preview/blog/">Blog</a> / ${escapeHtml(article.category)}</div>
        <span class="eyebrow">${escapeHtml(article.category)}</span>
        <h1>${escapeHtml(article.title)}</h1>
        <p>${escapeHtml(article.dek)}</p>
        <div class="blog-article-meta"><span>Buyer guide</span><span>Updated August 2026</span><span>HAIBUCRAFT editorial</span></div>
      </div>
    </section>
    <section class="section">
      <div class="container blog-article-layout">
        <article class="blog-article-body">
          ${article.sections.map(([heading, body], index) => `<section><span>${String(index + 1).padStart(2, '0')}</span><div><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(body)}</p></div></section>`).join('\n          ')}
          <div class="scope-note">${escapeHtml(article.note)}</div>
        </article>
        <aside class="blog-checklist-card">
          <span class="eyebrow">Working Checklist</span>
          <h2>Use this in your inquiry.</h2>
          <ul class="checklist">${article.checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
          <a class="btn btn-primary" href="${quoteHref}">Prepare an Inquiry</a>
        </aside>
      </div>
    </section>
    <section class="section alt">
      <div class="container">
        <div class="section-head"><span class="eyebrow">Related Resources</span><h2>Continue the sourcing review.</h2></div>
        <div class="blog-related-grid">
          ${article.links.map(([label, href]) => `<a href="${href}"><span>Resource</span><h3>${escapeHtml(label)}</h3><strong>Open resource &rarr;</strong></a>`).join('\n          ')}
        </div>
      </div>
    </section>
  </main>
  <div data-site-footer></div>
  <script src="/v2-preview/assets/components.js"></script>
  <script src="/v2-preview/assets/site-v2.js"></script>
</body>
</html>
`;
  const directory = path.join(blogRoot, article.slug);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, 'index.html'), html, 'utf8');
}

const hub = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Wholesale Craft Supply Buying Guides | HAIBUCRAFT</title>
  <meta name="description" content="Practical B2B guides for craft-product selection, mixed orders, samples, private-label packaging, inspection and document review.">
  <meta name="robots" content="noindex,nofollow">
  <link rel="stylesheet" href="/v2-preview/assets/site-v2.css">
  <link rel="stylesheet" href="/v2-preview/assets/site-v2-fixes.css">
  <link rel="stylesheet" href="/v2-preview/assets/blog-library.css">
</head>
<body data-page="blog">
  <div data-site-header></div>
  <main>
    <section class="page-hero blog-hub-hero">
      <div class="container">
        <div class="breadcrumbs"><a href="/v2-preview/">Home</a> / Blog</div>
        <span class="eyebrow">Buying Guides &amp; OEM Insights</span>
        <h1>Practical sourcing guidance for wholesale craft buyers.</h1>
        <p>Ten working guides covering product definition, mixed orders, samples, packaging, inspection, documents and seasonal planning.</p>
        <div class="actions"><a class="btn btn-primary" href="/v2-preview/products/">Browse Products</a><a class="btn btn-light" href="/v2-preview/quote/?source=blog-directory&amp;landing_page=/v2-preview/blog/">Request Quote</a></div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="section-head"><span class="eyebrow">Buyer Resource Library</span><h2>Ten guides for a more controlled wholesale project.</h2><p>Start with the decision or checkpoint that matches your current sourcing stage.</p></div>
        <div class="blog-guide-grid">
          ${articles.map((article, index) => `<a class="blog-guide-card" href="/v2-preview/blog/${article.slug}/"><div><span>${String(index + 1).padStart(2, '0')}</span><small>${escapeHtml(article.category)}</small></div><h2>${escapeHtml(article.title)}</h2><p>${escapeHtml(article.description)}</p><strong>Read guide &rarr;</strong></a>`).join('\n          ')}
        </div>
      </div>
    </section>
    <section class="section alt">
      <div class="container split">
        <div><span class="eyebrow">Editorial Principles</span><h2>Useful guidance without unsupported guarantees.</h2><p>Each guide separates operational checks from legal compliance, certification and laboratory testing.</p><ul class="checklist"><li>No universal MOQ or lead-time promises</li><li>No blanket certification statements</li><li>No substitution of inspection for testing</li><li>Product- and market-specific confirmation</li></ul></div>
        <div class="card"><h3>Need help translating a concept into an inquiry?</h3><p>Use the Custom Solutions workflow to prepare artwork, specifications, packaging requirements and sample criteria.</p><div class="actions"><a class="btn btn-primary" href="/v2-preview/custom-solutions/">View Custom Solutions</a></div></div>
      </div>
    </section>
  </main>
  <div data-site-footer></div>
  <script src="/v2-preview/assets/components.js"></script>
  <script src="/v2-preview/assets/site-v2.js"></script>
</body>
</html>
`;
await writeFile(path.join(blogRoot, 'index.html'), hub, 'utf8');

const seoMap = JSON.parse(await readFile(seoMapPath, 'utf8'));
const articlePaths = new Set(articles.map((article) => `/v2-preview/blog/${article.slug}/`));
const blogRoutes = articles.map((article) => ({
  previewPath: `/v2-preview/blog/${article.slug}/`,
  productionPath: `/blog/${article.slug}/`,
  title: article.seoTitle,
  description: article.description,
  type: 'article',
  index: true,
  generatedBlog: true
}));
const baseRoutes = seoMap.routes.filter((route) => !route.generatedBlog && !articlePaths.has(route.previewPath));
const quoteIndex = baseRoutes.findIndex((route) => route.productionPath === '/request-quote/');
baseRoutes.splice(quoteIndex < 0 ? baseRoutes.length : quoteIndex, 0, ...blogRoutes);
seoMap.routes = baseRoutes;
await writeFile(seoMapPath, `${JSON.stringify(seoMap, null, 2)}\n`, 'utf8');

const migrationMap = JSON.parse(await readFile(migrationMapPath, 'utf8'));
const blogPages = articles.map((article) => ({
  source: `v2-preview/blog/${article.slug}/index.html`,
  destination: `blog/${article.slug}/index.html`,
  action: 'create',
  productionPath: `/blog/${article.slug}/`,
  generatedBlog: true
}));
const basePages = migrationMap.pages.filter((page) => !page.generatedBlog && !articlePaths.has(`/v2-preview${page.productionPath}`));
const quotePageIndex = basePages.findIndex((page) => page.productionPath === '/request-quote/');
basePages.splice(quotePageIndex < 0 ? basePages.length : quotePageIndex, 0, ...blogPages);
migrationMap.version = '2026-08-01';
migrationMap.pages = basePages;
if (!migrationMap.sharedAssets.some((item) => item.source === 'v2-preview/assets/blog-library.css')) {
  migrationMap.sharedAssets.push({ source: 'v2-preview/assets/blog-library.css', destination: 'assets/v2/blog-library.css' });
}
await writeFile(migrationMapPath, `${JSON.stringify(migrationMap, null, 2)}\n`, 'utf8');

const sitemapUrls = seoMap.routes.filter((route) => route.index).map((route) => {
  const priority = route.productionPath === '/' ? '1.0' : route.generatedProduct ? '0.8' : route.type === 'article' ? '0.7' : route.productionPath.startsWith('/products/') ? '0.9' : '0.7';
  const changefreq = route.generatedProduct || route.type === 'article' ? 'monthly' : route.productionPath.startsWith('/products') || route.productionPath === '/blog/' ? 'weekly' : 'monthly';
  return `  <url><loc>${seoMap.site.origin}${route.productionPath}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
});
await writeFile(sitemapPath, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls.join('\n')}\n</urlset>\n`, 'utf8');

console.log(`Generated ${articles.length} buyer guides, the blog hub, SEO routes and production mappings.`);

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const preview = path.join(root, 'v2-preview');
const policy = JSON.parse(await readFile('scripts/data/catalog-scope-20261031.json', 'utf8'));
const archivedSkus = new Set(policy.products.map(p => p.sku));
const catalogPath = path.join(preview, 'assets/product-catalog.json');
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
const all = [...catalog.products, ...(catalog.archivedProducts || [])];
const unique = new Map(all.map(p => [p.sku, p]));
const archived = policy.products.map(p => {
  const found = unique.get(p.sku);
  if (!found || found.productionPath !== p.productionPath || found.image !== p.image) throw new Error(`Archive identity mismatch: ${p.sku}`);
  return found;
});
catalog.products = [...unique.values()].filter(p => !archivedSkus.has(p.sku));
if (catalog.products.some(p => !policy.activeCategories.includes(p.category))) throw new Error('Unapproved public category');
catalog.count = catalog.products.length;
catalog.archivedProducts = archived;
catalog.archiveNote = 'Archived records retain source identity and URLs but are excluded from the public catalog and sitemap.';
await writeFile(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');

const seoPath = path.join(preview, 'seo-production-map.json');
const seo = JSON.parse(await readFile(seoPath, 'utf8'));
const archivedPaths = new Set(archived.map(p => p.productionPath));
const retiredCategories = new Set(policy.archivedCategories.map(slug => `/products/${slug}/`));
const notice = '<section class="section" data-catalog-archive><div class="container"><p><strong>Previous catalog reference.</strong> This item is outside our current catalog. The original product information is retained for reference; contact us with the SKU to review your request.</p><a class="btn btn-light" href="/v2-preview/products/">Browse the current catalog</a></div></section>';
const rx = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
for (const route of seo.routes) {
  const file = path.join(preview, route.previewPath.slice('/v2-preview/'.length), 'index.html');
  let html = await readFile(file, 'utf8');
  if (archivedPaths.has(route.productionPath)) {
    route.index = false;
    route.archivedCatalogReference = true;
    route.lastModified = policy.date;
    html = html.replace(/<section class="section" data-catalog-archive>[\s\S]*?<\/section>/g, '');
    html = html.replace(/(<main\b[^>]*>)/, '$1' + notice);
    // Keep the original product facts and gallery; replace links into the retired category.
    html = html.replace(/<a([^>]*?)href="\/v2-preview\/products\/(?:keychain|decorative-craft-accessories)\/"([^>]*)>[^<]*<\/a>/g, '<a$1href="/v2-preview/products/"$2>Current catalog</a>');
    html = html.replace(/href="([^"<>]+)"/g, (match, raw) => {
      if (!raw.startsWith('/v2-preview/quote/?')) return match;
      const url = new URL(raw.replaceAll('&amp;', '&'), 'https://www.haibucrafts.com');
      url.searchParams.delete('category');
      return `href="${url.pathname}${url.search.replaceAll('&', '&amp;')}"`;
    });
    html = html.replace(/<section class="section alt">\s*<div class="container">\s*<div class="section-head">\s*<span class="eyebrow">Related [\s\S]*?<\/section>/, '');
  } else if (retiredCategories.has(route.productionPath)) {
    route.index = false;
    route.archivedCatalogReference = true;
    route.lastModified = policy.date;
    const heading = route.productionPath.includes('keychain') ? 'Previous keyring selection' : 'Previous decorative selection';
    html = html.replace(/<main\b[^>]*>[\s\S]*?<\/main>/, `<main><section class="section"><div class="container"><div class="breadcrumbs"><a href="/v2-preview/">Home</a> / <a href="/v2-preview/products/">Products</a> / Reference</div><h1>${heading}</h1><p>This selection is no longer part of the current catalog. For a previous product reference, contact us with its SKU.</p><a class="btn btn-primary" href="/v2-preview/products/">Browse the current catalog</a><div class="product-grid-v2"></div></div></section></main>`);
  }
  // Remove retired category entry cards and RFQ choices from all public shells.
  for (const slug of policy.archivedCategories) {
    html = html.replace(new RegExp(`<a class="(?:category-visual-card|product-family-card)" href="/v2-preview/products/${rx(slug)}/">[\\s\\S]*?<\\/a>`, 'g'), '');
    html = html.replace(new RegExp(`<option value="${rx(slug)}">[^<]*<\\/option>`, 'g'), '');
  }
  // Existing breadcrumb schemas must no longer link an archived SKU to a live family.
  if (route.archivedCatalogReference) html = html.replace(/(<script type="application\/ld\+json"[^>]*>)([\s\S]*?)(<\/script>)/g, (match, open, body, close) => {
    const data = JSON.parse(body);
    if (retiredCategories.has(route.productionPath) && ['ItemList', 'CollectionPage'].includes(data['@type'])) return '';
    if (data['@type'] !== 'BreadcrumbList') return match;
    if (retiredCategories.has(route.productionPath)) data.itemListElement = [{ '@type': 'ListItem', position: 1, name: 'Home', item: seo.site.origin + '/' }, { '@type': 'ListItem', position: 2, name: 'Products', item: seo.site.origin + '/products/' }, { '@type': 'ListItem', position: 3, name: 'Previous catalog reference', item: seo.site.origin + route.productionPath }];
    data.itemListElement = data.itemListElement.filter(item => item.item === seo.site.origin + route.productionPath || !retiredCategories.has(new URL(item.item).pathname));
    data.itemListElement.forEach((item, i) => item.position = i + 1);
    return open + JSON.stringify(data).replaceAll('<', '\\u003c') + close;
  });
  if (route.archivedCatalogReference) html = html.replace(/[ \t]+$/gm, '');
  await writeFile(file, html, 'utf8');
}
await writeFile(seoPath, JSON.stringify(seo, null, 2) + '\n', 'utf8');
console.log(`Public scope: ${policy.activeCategories.length} categories, ${catalog.count} products; ${archived.length} old product URLs retained as references.`);

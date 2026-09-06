import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const previewRoot = path.join(root, 'v2-preview');
const seoMap = JSON.parse(await readFile(path.join(previewRoot, 'seo-production-map.json'), 'utf8'));
const catalog = JSON.parse(await readFile(path.join(previewRoot, 'assets', 'product-catalog.json'), 'utf8'));
const sitemapPath = path.join(previewRoot, 'production-config', 'sitemap.xml');
const defaultLastModified = seoMap.site.defaultLastModified || '2026-08-21';
const productByPath = new Map(catalog.products.map((product) => [product.productionPath, product]));

const xml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;');

const urls = seoMap.routes.filter((route) => route.index).map((route) => {
  const product = productByPath.get(route.productionPath);
  const lastModified = route.lastModified || (product ? catalog.generatedAt : defaultLastModified);
  const image = product
    ? `\n    <image:image><image:loc>${xml(`${seoMap.site.origin}${product.image}`)}</image:loc><image:title>${xml(`${product.title} ${product.sku}`)}</image:title></image:image>`
    : '';
  return `  <url><loc>${xml(`${seoMap.site.origin}${route.productionPath}`)}</loc><lastmod>${xml(lastModified)}</lastmod>${image}</url>`;
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join('\n')}\n</urlset>\n`;
await writeFile(sitemapPath, sitemap, 'utf8');

console.log(`Generated indexing sitemap: ${urls.length} canonical URLs and ${catalog.products.length} product images.`);

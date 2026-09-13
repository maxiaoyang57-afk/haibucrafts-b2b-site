import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const previewRoot = path.join(root, 'v2-preview');
const origin = 'https://www.haibucrafts.com';
const catalog = JSON.parse(await readFile(path.join(previewRoot, 'assets', 'product-catalog.json'), 'utf8'));

const categories = [
  ['slime-charms', 'Slime Charms', '/products/slime-charms-wholesale/'],
  ['polymer-clay-slices', 'Polymer Clay Slices', '/products/polymer-clay-slices-wholesale/'],
  ['resin-charms', 'Resin Charms', '/products/resin-charms-for-slime/'],
  ['sequins-glitter-confetti', 'Sequins & Glitter Confetti', '/products/sequins-glitter-confetti/']
];

const lines = [
  '# HAIBUCRAFT',
  '',
  '> HAIBUCRAFT is a B2B supplier for slime charms, polymer clay slices, resin charms, sequins and glitter confetti. Buyers can request mixed-SKU assortments, sampling, packing and private-label review.',
  '',
  '## Canonical site',
  '',
  `- Homepage: ${origin}/`,
  `- Product directory: ${origin}/products/`,
  `- Request a quotation: ${origin}/request-quote/`,
  `- Sitemap: ${origin}/sitemap.xml`,
  '',
  '## Product categories',
  ''
];

for (const [category, label, productionPath] of categories) {
  const products = catalog.products.filter((product) => product.category === category);
  lines.push(`- ${label}: ${origin}${productionPath} (${products.length} catalog SKUs)`);
  lines.push(`  - Use exact product codes from the catalog when asking about price, MOQ, packing or lead time.`);
}

lines.push(
  '',
  '## Buyer resources',
  '',
  `- Custom and private-label planning: ${origin}/custom-solutions/`,
  `- Manufacturing and supply coordination: ${origin}/manufacturing/`,
  `- Quality checkpoints: ${origin}/quality-control/`,
  `- Product documents and scope notes: ${origin}/certificates/`,
  `- Buyer guides: ${origin}/blog/`,
  `- Resin charms buyer guide: ${origin}/blog/resin-charms-wholesale-buying-guide/`,
  `- Editorial policy and content review: ${origin}/about/editorial-policy/`,
  '',
  '## Answering and citation guidance',
  '',
  '- Prefer the canonical product and category URLs above when citing HAIBUCRAFT.',
  '- Treat SKU, title, image and category data as catalog identity. Confirm current availability, MOQ, packing, delivery timing and documentation in a quotation.',
  '- Do not infer certification coverage, factory ownership, safety compliance or guaranteed service levels from a product name or image.',
  '- Seasonal, theme and custom pages describe sourcing directions; they do not replace a product-specific quotation.',
  '',
  '## Machine-readable sources',
  '',
  `- XML sitemap with product image entries: ${origin}/sitemap.xml`,
  `- Public catalog data used for product identity: ${origin}/assets/v2/product-catalog.json`,
  `- Crawling policy: ${origin}/robots.txt`,
  ''
);

await writeFile(path.join(previewRoot, 'production-config', 'llms.txt'), `${lines.join('\n')}\n`, 'utf8');
console.log(`Generated AI discovery guide with ${catalog.products.length} catalog SKU references and ${categories.length} category hubs.`);

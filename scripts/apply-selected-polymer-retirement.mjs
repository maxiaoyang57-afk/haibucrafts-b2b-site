import { readFile, writeFile } from 'node:fs/promises';

const configPath = 'scripts/data/polymer-selected-sku-retirement.json';
const config = JSON.parse(await readFile(configPath, 'utf8'));
const retiredSkus = new Set(config.products.map((product) => product.sku));
const retiredPaths = new Set(config.products.map((product) => product.retiredPath));
const totalCount = 82;
const polymerCount = 12;

const writeJson = async (file, value) => {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const updateCategory = async (file) => {
  let html = await readFile(file, 'utf8');
  html = html.replace(/<article class="product-card-v2"[\s\S]*?<\/article>/g, (article) => (
    [...retiredSkus].some((sku) => article.includes(`<span class="sku-badge">${sku}</span>`)) ? '' : article
  ));
  html = html.replace(/(<strong data-product-count>)\d+ products(<\/strong>)/, `$1${polymerCount} products$2`);
  html = html.replace(
    /(<script type="application\/ld\+json" data-seo-growth-jsonld="polymer-clay-slices-item-list">)([\s\S]*?)(<\/script>)/,
    (_, open, json, close) => {
      const itemList = JSON.parse(json);
      itemList.itemListElement = itemList.itemListElement
        .filter((item) => ![...retiredPaths].some((retiredPath) => item.url.endsWith(retiredPath)))
        .map((item, index) => ({ ...item, position: index + 1 }));
      itemList.numberOfItems = itemList.itemListElement.length;
      return `${open}${JSON.stringify(itemList)}${close}`;
    }
  );
  await writeFile(file, html, 'utf8');
};

for (const file of [
  'products/polymer-clay-slices-wholesale/index.html',
  'v2-preview/products/polymer-clay-slices/index.html'
]) {
  await updateCategory(file);
}

for (const file of ['assets/v2/product-catalog.json', 'v2-preview/assets/product-catalog.json']) {
  const catalog = JSON.parse(await readFile(file, 'utf8'));
  catalog.products = catalog.products.filter((product) => !retiredSkus.has(product.sku));
  catalog.count = catalog.products.length;
  await writeJson(file, catalog);
}

for (const file of ['index.html', 'v2-preview/index.html']) {
  let html = await readFile(file, 'utf8');
  html = html
    .replace(/<span>\d+ cataloged products<\/span>/, `<span>${totalCount} cataloged products</span>`)
    .replace(/(<div class="metric"><b>)\d+(<\/b><span>Cataloged wholesale products<\/span><\/div>)/, `$1${totalCount}$2`)
    .replace(/(<div class="category-copy"><span class="eyebrow">)\d+( products<\/span><h3>Polymer Clay Slices<\/h3>)/, `$1${polymerCount}$2`);
  await writeFile(file, html, 'utf8');
}

for (const file of ['products/index.html', 'v2-preview/products/index.html']) {
  let html = await readFile(file, 'utf8');
  html = html
    .replace(/Browse \d+ published products/, `Browse ${totalCount} published products`)
    .replace(/(<div class="evidence-item"><b>)\d+(<\/b><span>Published products<\/span><\/div>)/, `$1${totalCount}$2`)
    .replace(/(<span>)\d+( Products<\/span>[\s\S]*?<h2>Polymer Clay Slices<\/h2>)/, `$1${polymerCount}$2`);
  await writeFile(file, html, 'utf8');
}

const seoMapPath = 'v2-preview/seo-production-map.json';
const seoMap = JSON.parse(await readFile(seoMapPath, 'utf8'));
seoMap.routes = seoMap.routes.filter((route) => !retiredPaths.has(route.productionPath));
await writeJson(seoMapPath, seoMap);

const migrationMapPath = 'v2-preview/production-config/file-migration-map.json';
const migrationMap = JSON.parse(await readFile(migrationMapPath, 'utf8'));
migrationMap.pages = migrationMap.pages.filter((page) => !retiredPaths.has(page.productionPath));
await writeJson(migrationMapPath, migrationMap);

for (const file of ['sitemap.xml', 'v2-preview/production-config/sitemap.xml']) {
  const lines = (await readFile(file, 'utf8')).split('\n');
  const filtered = lines.filter((line) => ![...retiredPaths].some((retiredPath) => line.includes(retiredPath)));
  await writeFile(file, filtered.join('\n'), 'utf8');
}

for (const file of ['vercel.json', 'v2-preview/production-config/vercel-redirects.json']) {
  const redirects = JSON.parse(await readFile(file, 'utf8'));
  const bySource = new Map((redirects.redirects || []).map((redirect) => [redirect.source, redirect]));
  for (const product of config.products) {
    bySource.set(product.retiredPath, {
      source: product.retiredPath,
      destination: config.redirectTo,
      permanent: true
    });
  }
  redirects.redirects = [...bySource.values()];
  await writeJson(file, redirects);
}

const replacementProducts = {
  YX038: {
    slug: 'yx038-halloween-theme-slice-mix',
    title: 'Halloween Theme Slice Mix',
    image: '/assets/images/products/hc008-halloween-ghost-spider-mix.webp',
    alt: 'Halloween themed polymer clay slices, product code YX038'
  },
  YX043: {
    slug: 'yx043-colorful-candy-round-slices',
    title: 'Colorful Candy Round Slices',
    image: '/assets/images/products/yx043-main.webp',
    alt: 'Colorful candy round polymer clay slices, product code YX043'
  },
  YX577: {
    slug: 'yx577-colorful-candy-scatter-mix',
    title: 'Colorful Candy Scatter Mix',
    image: '/assets/images/products/hc003-school-bus-clay-slices.webp',
    alt: 'Colorful decorative polymer clay slice mix, product code YX577'
  }
};

const relatedReplacements = [
  ['yx4002-christmas-polymer-clay-sprinkle-mix', 'YX4003', 'YX038'],
  ['yx4008-christmas-candy-polymer-clay-slice-mix', 'YX4005', 'YX043'],
  ['yx4010-pastel-candy-polymer-clay-sprinkle-mix', 'YX4005', 'YX577']
];

for (const [detailSlug, retiredSku, replacementSku] of relatedReplacements) {
  for (const [file, hrefBase] of [
    [`products/polymer-clay-slices-wholesale/${detailSlug}/index.html`, '/products/polymer-clay-slices-wholesale/'],
    [`v2-preview/products/polymer-clay-slices/${detailSlug}/index.html`, '/v2-preview/products/polymer-clay-slices/']
  ]) {
    const replacement = replacementProducts[replacementSku];
    let html = await readFile(file, 'utf8');
    const card = `<a class="product-related-card" href="${hrefBase}${replacement.slug}/"><img src="${replacement.image}" width="800" height="800" loading="lazy" decoding="async" alt="${replacement.alt}"><div><span>${replacementSku}</span><h3>${replacement.title}</h3></div></a>`;
    const pattern = new RegExp(`<a class="product-related-card"[^>]*>[\\s\\S]*?<span>${retiredSku}<\\/span>[\\s\\S]*?<\\/a>`);
    if (!pattern.test(html)) throw new Error(`${file}: missing related card for ${retiredSku}`);
    html = html.replace(pattern, card);
    await writeFile(file, html, 'utf8');
  }
}

console.log(`Retired ${config.products.length} polymer products; catalog now contains ${totalCount} products (${polymerCount} polymer).`);

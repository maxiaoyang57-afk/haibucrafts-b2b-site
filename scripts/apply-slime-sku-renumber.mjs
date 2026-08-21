import { readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const previewCategoryPath = path.join(root, 'v2-preview/products/slime-charms/index.html');
const vercelPath = path.join(root, 'vercel.json');

const mapping = [
  { oldSku: 'SLM680', newSku: 'SLM712', title: 'Dreamy Mini Doll Sprinkle Mix' },
  { oldSku: 'SLM712', newSku: 'SLM680', title: 'Space Candy Adventure Charms' },
  { oldSku: 'SLM10012', newSku: 'SLM715', title: 'Undersea Craft Charm Pile' },
  { oldSku: 'SLM715', newSku: 'SLM717', title: 'Mini Snack Layout Charms' },
  { oldSku: 'SLM717', newSku: 'SLM10129', title: 'Gingerbread Holiday Charm Feast' },
  { oldSku: 'SLM10129', newSku: 'SLM26521', title: 'Pink Candy Charm Assortment' },
  { oldSku: 'SLM26521', newSku: 'SLM713', title: 'Seashell Candy Decor Plate Mix' },
  { oldSku: 'SLM713', newSku: 'SLM10012', title: 'Sweet Berry Candy Charms' }
];

const slugify = (value) => value
  .toLowerCase()
  .replace(/['’]/g, '')
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')
  .replace(/-{2,}/g, '-');

const detailSlug = (sku, title) => `${sku.toLowerCase()}-${slugify(title)}`;

let html = await readFile(previewCategoryPath, 'utf8');
const cards = [...html.matchAll(/<article class="product-card-v2"[^>]*>[\s\S]*?<\/article>/g)].map((match) => match[0]);
if (cards.length !== 24) {
  throw new Error(`Expected 24 Slime Charms cards before renumber, found ${cards.length}`);
}

for (const item of mapping) {
  const titleMarker = `<h3>${item.title}</h3>`;
  const card = cards.find((block) => block.includes(titleMarker));
  if (!card) throw new Error(`Could not locate product card for ${item.title}`);

  const hasOld = card.includes(`<span class="sku-badge">${item.oldSku}</span>`);
  const hasNew = card.includes(`<span class="sku-badge">${item.newSku}</span>`);
  if (!hasOld && !hasNew) {
    throw new Error(`Unexpected SKU on ${item.title}; expected ${item.oldSku} or ${item.newSku}`);
  }
  if (hasOld) {
    const nextCard = card
      .replaceAll(item.oldSku, item.newSku)
      .replaceAll(item.oldSku.toLowerCase(), item.newSku.toLowerCase());
    html = html.replace(card, nextCard);
  }
}

const finalCards = [...html.matchAll(/<article class="product-card-v2"[^>]*>[\s\S]*?<\/article>/g)].map((match) => match[0]);
const badges = finalCards.map((card) => card.match(/<span class="sku-badge">([^<]+)<\/span>/)?.[1]).filter(Boolean);
if (badges.length !== 24 || new Set(badges).size !== badges.length) {
  throw new Error('Final Slime Charms card SKUs are missing or duplicated');
}
for (const item of mapping) {
  const card = finalCards.find((block) => block.includes(`<h3>${item.title}</h3>`));
  if (!card?.includes(`<span class="sku-badge">${item.newSku}</span>`)) {
    throw new Error(`Final mapping failed for ${item.title}: expected ${item.newSku}`);
  }
  const expectedPreview = `/v2-preview/products/slime-charms/${detailSlug(item.newSku, item.title)}/`;
  if (!card.includes(expectedPreview)) {
    throw new Error(`Detail link did not move with ${item.title} to ${expectedPreview}`);
  }
  if (!card.includes(`product_code=${item.newSku}`)) {
    throw new Error(`Quote attribution did not move with ${item.title} to ${item.newSku}`);
  }
}
await writeFile(previewCategoryPath, html, 'utf8');

const vercel = JSON.parse(await readFile(vercelPath, 'utf8'));
vercel.redirects ||= [];
for (const item of mapping) {
  const source = `/products/slime-charms-wholesale/${detailSlug(item.oldSku, item.title)}/`;
  const destination = `/products/slime-charms-wholesale/${detailSlug(item.newSku, item.title)}/`;
  const existing = vercel.redirects.find((redirect) => redirect.source === source);
  if (existing && existing.destination !== destination) {
    throw new Error(`Redirect collision for ${source}: ${existing.destination} vs ${destination}`);
  }
  if (!existing) vercel.redirects.push({ source, destination, permanent: true });
}
await writeFile(vercelPath, `${JSON.stringify(vercel, null, 2)}\n`, 'utf8');

for (const item of mapping) {
  const oldSlug = detailSlug(item.oldSku, item.title);
  await rm(path.join(root, 'v2-preview/products/slime-charms', oldSlug), { recursive: true, force: true });
  await rm(path.join(root, 'products/slime-charms-wholesale', oldSlug), { recursive: true, force: true });
}

console.log('Applied atomic Slime Charms SKU mapping:');
for (const item of mapping) console.log(`- ${item.oldSku} -> ${item.newSku}: ${item.title}`);
console.log('Removed obsolete SKU-based detail routes and added permanent redirects.');

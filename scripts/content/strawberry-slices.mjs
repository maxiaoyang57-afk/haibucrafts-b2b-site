import { readFileSync } from 'node:fs';

const catalog = JSON.parse(readFileSync(new URL('../../v2-preview/assets/product-catalog.json', import.meta.url), 'utf8'));
const codes = ['YX693', 'YX318', 'YX329', 'YX241'];
const products = codes.map(sku => {
  const product = catalog.products.find(p => p.sku === sku);
  if (!product) throw new Error(`Strawberry article product missing: ${sku}`);
  return product;
});
const facts = new Map();
function collect(value) {
  if (Array.isArray(value)) { value.forEach(collect); return; }
  if (!value || typeof value !== 'object') return;
  if (codes.includes(value.sku) && value.sourceFields) { facts.set(value.sku, value); return; }
  Object.values(value).forEach(collect);
}
for (const file of ['haibu-new-products-20261102-monica-37.json', 'haibu-new-products-20261102-monica-36.json']) {
  collect(JSON.parse(readFileSync(new URL('../data/' + file, import.meta.url), 'utf8')));
}
for (const sku of codes) {
  const source = facts.get(sku);
  if (source?.sourceFields?.material !== 'Polymer Clay' || !source.sourceFields.size || !source.sourceFields.packaging) {
    throw new Error(`Strawberry article requires explicit source facts: ${sku}`);
  }
}
const labels = ['Pink strawberry', 'Red strawberry cross-section', 'Light green leaf', 'Daisy flower disc'];

export const strawberryBuyingArticle = {
  slug: 'strawberry-polymer-clay-slices-wholesale',
  category: 'Polymer Clay Slices · Buying Guide',
  title: 'Buying Strawberry Polymer Clay Slices for a Craft Collection',
  seoTitle: 'Strawberry Polymer Clay Slices Wholesale | HAIBU',
  description: 'Compare pink and red strawberry polymer clay slices, matching leaves and daisies. Review sizes, 500 g packing and sample needs for a wholesale order.',
  datePublished: '2026-11-09', dateModified: '2026-11-09', lastReviewed: 'November 9, 2026', scopeReview: false,
  inquirySource: 'strawberry-slices-blog', inquiryCategory: 'polymer-clay-slices',
  dek: 'Choose the strawberry design first. Then work out the supporting shapes, pack format and sample checks for the product you sell.',
  introduction: 'A pink strawberry and a red strawberry cross-section can lead to quite different collections. The pink design may sit beside a pastel gift label; the red one may carry a summer fruit theme. For a wholesale order, that visual choice needs a product code. It gives the buyer and supplier the same starting point when they discuss samples, quantities and packing. HAIBU lists YX693 and YX318 as two separate strawberry references, with YX329 leaves and YX241 daisy discs available to consider alongside them.',
  image: {
    src: products[1].image, width: 960, height: 960,
    alt: 'YX318 red strawberry cross-section polymer clay slices with green caps',
    caption: 'YX318 original product photograph. The container shown is presentation; agree on the order packing separately.'
  },
  sections: [
    ['Choose the strawberry your collection calls for', 'YX693 has a pale pink body, light green cap and cream-white dots. YX318 has a red outline, green cap and white-and-pink center. Place sample pieces beside your label, printed artwork or product base before choosing between them. A color that looks right in a large product photo can occupy a very small part of a finished jar or card.', {id:'choose-the-motif', paragraph:'For a garden theme, compare YX329 light green leaves or YX241 daisy discs beside the chosen berry. You do not need to use every shape. Keep the main strawberry easy to recognize and use supporting pieces where the layout has space. The product links below open the exact catalog references.'}],
    ['Use the 5 mm listing as a starting point', 'The source size for YX693 is 5 mm; YX318 is listed as approximately 5 mm. YX329 and YX241 also list 5 mm. Those figures do not tell you the thickness, the measurement direction or the clearance needed around a shaped piece. Ask for the missing dimensions if the application depends on a tight fit.', {id:'size-and-thickness', paragraph:'For a dry shaker, compare the thickest sample piece with the internal gap and check movement before sealing. For nail-art layouts, compare the piece with the available surface and intended finish. For a fixed decoration, check the contact area and choose the attachment method for the actual surfaces.'}],
    ['Keep the four codes separate in the first inquiry', 'A request for a strawberry garden mix could mean pink berries with daisies, red cross-sections with leaves, or all four together. List each selected code on its own line. If you want a combined assortment, add the desired proportions and say whether you mean proportions by weight or by piece count.', {id:'assortment', paragraph:'The four catalog records are separate items, not an existing four-part kit. A mixed bag, selected color range or retail assortment needs its own feasibility and packing review. Send a simple layout photograph or sketch with the codes when the visual balance matters.'}],
    ['Work out what a 500 g bag means for your packing line', 'Each of these references lists 500 g per bag. That is a source pack weight, not a fixed count of strawberries or a minimum order. If your retail kit uses a counted number of pieces, count and weigh a sample of the selected design before estimating quantities.', {id:'packing', paragraph:'If you are considering 10 g retail portions, 500 g would make 50 portions before handling loss. This is a planning calculation, not an offered small-pack specification or a recommended dose for slime. Trial-fill the intended bag or jar and allow for your own weighing and packing process.'}],
    ['Test the sample in the product you actually sell', 'For slime, use your own formula and record the amount of every component added. Compare appearance, texture and any color transfer over an observation period that fits your product. A dry shaker, a liquid-filled vessel and an adhesive-mounted decoration need different trials.', {id:'sample-trial', paragraph:'Keep the sample code, photographs, materials and observations together so a later order refers to the same version. If you need a particular test result or document, name it in the inquiry. A fruit motif, source photo or general material description does not establish colorfastness, liquid compatibility or a particular safety claim.'}],
    ['Ask for the order you intend to place', 'An inquiry can be short and still contain the useful details: selected SKUs, intended application, quantity with its unit, bulk or retail packing, destination and required date. Add the size, thickness or sample questions that remain open. This gives the quotation a clear scope without requiring a long purchasing document.', {id:'quotation', paragraph:'For example: YX693 pink strawberry slices and YX241 daisy discs for a shaker-card collection; separate bags initially, with a proposed retail portion to review. Ask for sample availability and packing feasibility before deciding the bulk quantities. Current MOQ, charges and delivery arrangements belong in the quotation.'}],
    ['Buyer questions about strawberry clay slices', 'Are the pieces edible? No: these are decorative craft components. Make their non-edible use clear on your retail pack or project instructions. Can a 500 g bag supply a fixed number of kits? Only after you establish how much of the selected design each kit uses; weight by itself does not give a fixed piece count.', {id:'questions', paragraph:'Can HAIBU quote a strawberry, leaf and daisy assortment? Send the exact codes and proposed composition for review. Are the same pieces suitable for slime and nail art? Review the thickness, fixing method and sample performance for each application rather than treating one use as proof of another.'}]
  ],
  workingTable: {
    caption: 'Four existing catalog references. Source dimensions and pack weights are shown; confirm thickness and the selected option with a sample.',
    headings: ['SKU', 'Design', 'Source size', 'Reference packing'],
    rows: codes.map((sku, i) => [sku, labels[i], facts.get(sku).sourceFields.size, facts.get(sku).sourceFields.packaging])
  },
  checklist: ['Selected strawberry SKU', 'Leaf or daisy codes, if needed', 'Application and dimensions to check', 'Quantity and unit', 'Bulk or retail packing', 'Destination and required date'],
  note: 'Decorative, non-edible components. List bases, adhesives and other accessories separately; review any proposed mix or finished assembly with a sample.',
  links: [
    ...products.map((p, i) => [p.sku + ' · ' + labels[i], p.previewPath]),
    ['Polymer Clay Slice Buying Guide', '/v2-preview/blog/polymer-clay-slice-buying-guide/'],
    ['Sample Approval Checklist', '/v2-preview/blog/sample-approval-checklist/'],
    ['All Polymer Clay Slices', '/v2-preview/products/polymer-clay-slices/']
  ]
};

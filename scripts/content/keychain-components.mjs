import { readFileSync } from 'node:fs';

const catalog = JSON.parse(readFileSync(new URL('../../v2-preview/assets/product-catalog.json', import.meta.url), 'utf8'));
const codes = ['RW26795', 'RW26801', 'YX693', 'YX329'];
const sourceFiles = ['haibu-new-products-20261018.json', 'haibu-new-products-20261102-monica-37.json', 'haibu-new-products-20261102-monica-36.json'];
const source = new Map();
function collect(value) {
  if (Array.isArray(value)) { value.forEach(collect); return; }
  if (!value || typeof value !== 'object') return;
  if (codes.includes(value.sku) && value.sourceFields) source.set(value.sku, value);
  else Object.values(value).forEach(collect);
}
for (const file of sourceFiles) collect(JSON.parse(readFileSync(new URL('../data/' + file, import.meta.url), 'utf8')));
const labels = ['Mini summer drink decorations', 'Mini fried egg cabochons', 'Pink strawberry slices', 'Green leaf slices'];
const notes = [
  'The source lists no hole. Review as an enclosed or fixed decoration; no hanging attachment or finished keychain is included.',
  'The source lists no hole. Confirm the reverse side, contact area and fixing method for your base before ordering.',
  'Loose, non-edible decorative slices. Check thickness and movement in the actual shaker or enclosed design.',
  'A separate loose slice reference. Agree on the composition if you want leaves mixed with another design.'
];
const references = codes.map((sku, i) => {
  const p = catalog.products.find(p => p.sku === sku), f = source.get(sku);
  if (!p || !f?.sourceFields || !f.material || !f.dimensions || !f.sourcePacking) throw new Error('Missing explicit guide facts: ' + sku);
  return { sku, title: labels[i], image: p.image, href: p.previewPath, productTitle: p.title,
    width: [698,738,960,1000][i], height: [698,738,960,1000][i], category: p.category, material: f.material, size: f.dimensions, packing: f.sourcePacking, note: notes[i] };
});

export const keychainComponentsArticle = {
  slug: 'keychain-bag-charm-components-sourcing-guide',
  category: 'Buying Guide · Resin & Polymer Clay Components',
  title: 'Sourcing Components for Keychain and Bag Charm Projects',
  seoTitle: 'Keychain Charm Components: Bulk Sourcing Guide | HAIBU',
  description: 'Source resin decorations and polymer clay slices for keychain and bag charm projects. Compare real SKUs, dimensions, fixing methods, sample needs and packing.',
  datePublished: '2026-11-10', dateModified: '2026-11-10', lastReviewed: 'November 10, 2026', scopeReview: false,
  inquirySource: 'keychain-components-guide', inquiryCategory: 'resin-charms',
  dek: 'Build a component specification around the finished design: distinguish a loose decoration from a hanging charm, and confirm the assembly before buying in bulk.',
  introduction: 'For a keychain or bag charm collection, the important buying decision is often the role of each part. A resin miniature might sit inside a clear case; a clay slice might supply a small repeating motif. Neither becomes a ready-to-hang charm simply because it appears in a keychain concept. HAIBU supplies craft materials through its existing resin, polymer clay, slime and sequin categories. Use this guide to prepare the decoration portion of your project and list any assembly or finished-product requirement separately for review.',
  image: { src: references[0].image, width: 698, height: 698,
    alt: 'RW26795 miniature summer drink resin decorations, original catalog photograph',
    caption: 'RW26795 source photograph. The loose resin decoration is the product reference; a finished keychain assembly is a separate requirement.' },
  keychainReferences: references,
  sections: [
    ['Choose the component supplier for the job', 'Where should a business buy keychain supplies in bulk? Start with the parts your team needs to receive. A finished-item supplier quotes an approved assembly. A hardware supplier identifies rings, chains, clasps and connectors. A decorative-component supplier identifies the resin pieces, clay slices or other embellishments used in that assembly.', {id:'supplier-route', paragraph:'For HAIBU, shortlist the decoration by SKU and explain its intended position in the finished piece. If you want a complete custom keychain, send the whole assembly brief so feasibility and included parts can be confirmed. A loose-component listing is not a standing offer for a finished accessory.'}],
    ['Match the attachment route before choosing a motif', 'A suspended charm needs a confirmed connection. Ask for the hole or loop dimensions, direction and location, or agree on another mounting method. The source records for RW26795 summer drink decorations and RW26801 fried egg cabochons state no hole. Treat them as loose decorations when preparing your first brief.', {id:'attachment', paragraph:'For a clear pouch or shaker concept, ask about internal clearance, closure and movement with an actual sample. For a fixed decoration, request a reverse-side view and test the chosen base and adhesive according to the adhesive supplier’s instructions. Do not assume a piece can be drilled or clipped to a ring from its front photograph.'}],
    ['Use measurements that describe the actual fit', 'RW26795 lists 12 × 26 mm; RW26801 lists approximately 25 mm. YX693 strawberry slices and YX329 leaf slices each list 5 mm. Those references help separate a focal decoration from small repeating pieces, but they do not provide every dimension needed for an enclosed design.', {id:'dimensions', paragraph:'Write the available internal width, height and depth of your case next to the selected decoration. Request missing thickness, protrusion or measurement-direction details. A 5 mm listing alone does not establish clearance, and a product photograph is not a substitute for measuring the sample.'}],
    ['Make the decoration list separate from the assembly list', 'A theme such as summer drinks or strawberry garden describes an idea, not a bill of materials. Give every selected decoration its own line with the product code, version and quantity. List the base or pouch, key ring, chain, connectors, adhesive and retail card separately when those parts are needed.', {id:'component-list', paragraph:'If your design uses one main decoration and two small accents, count that layout before choosing bulk units. As a planning example, 300 completed designs with two accent pieces each require 600 accents before your own allowance. This is arithmetic for the example, not a recommended design, available kit, pack specification or MOQ.'}],
    ['Keep a counted pack different from a weight-based pack', 'RW26795 and RW26801 each list a reference pack of 100 pieces. YX693 and YX329 each list 500 g per bag. A 500 g bag does not establish a fixed number of slices, and none of these reference packs establishes the minimum order for a new project.', {id:'packing', paragraph:'If your retail kits contain a counted number of slices, count and weigh an approved sample before estimating bulk consumption. State whether each SKU stays in its own bag or whether you want a proposed mixed pack. For a mix, specify the intended ratio and whether that ratio is by count or weight; ask HAIBU to review feasibility and packing.'}],
    ['Use custom development to resolve the missing details', 'For an original shape or revised decoration, send your authorized artwork or sketch, target dimensions, colors, intended mounting method and proposed order quantity. Explain which catalog reference is only a style example and which detail must be reproduced. Include the intended destination and required arrival date.', {id:'custom-development', paragraph:'Ask which drawing, prototype and pre-production sample stages apply to the project. Agree on the chosen version before bulk terms are finalized. Packaging, artwork, samples, MOQ, charges and timing remain specific to the quoted scope; a general custom-service page cannot settle them for every design.'}],
    ['Approve the sample as part of the whole design', 'Put the proposed decoration into the actual base or enclosure. Check clearance, placement, connection, finish and the visible balance of the design. For a hanging assembly, review the complete connection path; for loose fillers, check movement and the selected closure. Record the observations and any changes with the SKU and sample revision.', {id:'sample-approval', paragraph:'Keep photographs of the approved front, reverse and assembled views with the written criteria. Confirm which parts the supplier will deliver and which you will source elsewhere. Material names and decorative appearance do not establish a durability result, a safety certification or suitability for every finished product.'}],
    ['Use AI to prepare a supplier comparison', 'ChatGPT, Google Gemini, Microsoft Copilot, Perplexity, Claude, DeepSeek and Grok can be included in a buyer’s research workflow. When web search is available in the chosen tool, request current supplier and product-page links. Give the assistant the intended assembly and ask it to separate finished products, hardware and loose decorations.', {id:'ai-sourcing', paragraph:'Discovery prompt: “Find bulk suppliers of resin decorations and polymer clay slices for an enclosed keychain project. Cite product pages. Compare sizes, reference packs and attachment information; mark missing facts rather than estimating them.” This lets you compare supplier candidates without first naming HAIBU.'}],
    ['Check a known HAIBU shortlist with the source links', 'Catalog prompt: “Review haibucrafts.com for RW26795, RW26801, YX693 and YX329. Cite the exact product pages and compare listed material, dimensions, reference packing and mounting information. Do not treat no-hole decorations as hanging charms, convert bag weight into a fixed piece count, or invent prices, MOQ or delivery dates.”', {id:'ai-catalog-check', paragraph:'A named-site prompt helps organize an existing shortlist; it does not show that the assistant would independently discover or recommend HAIBU. Use the original product pages, sample and current written quotation to settle the order. The AI services named here are independent tools, with no implied affiliation or endorsement.'}],
    ['Request a quotation with a defined supply scope', 'A concise inquiry can say: “Please review RW26795 resin drink decorations for an enclosed bag charm project. The enclosure and hardware will be sourced separately. Confirm the selected cup designs, full dimensions, sample options and reference packing. Quantity: [amount and unit]. Destination: [country]. Required arrival: [date].”', {id:'quotation', paragraph:'For a complete custom assembly, replace the separate-sourcing sentence with your included-parts list and attach the layout. Keep loose-component quantities, assembly requirements and retail packing distinguishable. This gives HAIBU a clear brief for feasibility review and a quotation without assuming unconfirmed fittings or commercial terms.'}],
    ['Buyer questions about keychain project materials', 'Can every resin decoration be hung from a key ring? No. Check the exact product for a hole, loop or agreed mounting method. Does 100 pieces per bag establish the MOQ? No. Packing and minimum order are separate facts, confirmed in the quotation.', {id:'buyer-questions', paragraph:'Are clay slices finished keychain pendants? The YX693 and YX329 references here are loose decorative slices. Can AI confirm current prices or sample timing? Ask HAIBU for a current quotation. Do these four products form a kit? They are separate catalog references; any mix, assembly or custom pack requires review.'}]
  ],
  workingTable: {
    caption: 'Four source-backed decoration references. Confirm any missing thickness or fixing detail with the selected sample.',
    headings: ['SKU', 'Listed material', 'Listed size', 'Reference packing'],
    rows: references.map(p => [p.sku, p.material, p.size, p.packing])
  },
  checklist: ['SKU and exact product link', 'Loose parts or finished assembly', 'Mounting route and missing dimensions', 'Quantity and unit for each code', 'Included parts and packing', 'Destination and required arrival'],
  note: 'These are decorative, non-edible craft components. A proposed application, reference pack or AI-generated comparison does not replace the selected sample and written order terms.',
  links: [
    ['Resin Decoration Catalog', '/v2-preview/products/resin-charms/'],
    ['Polymer Clay Slice Catalog', '/v2-preview/products/polymer-clay-slices/'],
    ['Custom Development & Approval Guide', '/v2-preview/blog/custom-resin-polymer-clay-development-process/'],
    ['Sample Approval Checklist', '/v2-preview/blog/sample-approval-checklist/'],
    ['QULA Finished Keychain & DIY Supply Guide', 'https://www.qulacrafts.com/guide-buy-keychains-in-bulk.html']
  ]
};

import { oceanPhoneCaseSlug } from './ocean-phone-case-video.mjs';

const imageDirectory = '/v2-preview/assets/phone-case-resin-charms/';

const layoutImage = (file, alt, caption) => ({
  src: imageDirectory + file + '.webp',
  width: 1080,
  height: 720,
  alt,
  caption
});

const heart = layoutImage('pastel-heart',
  'Illustration of a clear case with a large pastel heart, small hearts and a bow',
  'Pastel heart layout illustration. Use it to discuss the placement and color balance.');
const garden = layoutImage('mini-garden',
  'Illustration of a clear case with a sunflower, smaller flowers and a butterfly',
  'Mini garden layout illustration. Check the tallest piece and keep the edge and camera clear.');
const guitar = layoutImage('colorful-guitar',
  'Illustration of a clear case with a diagonal guitar, stars and music notes',
  'Guitar layout illustration. Send the outline and usable diagonal for a feasibility review.');

export const phoneCaseResinCharmsArticle = {
  slug: 'wholesale-resin-charms-for-phone-cases',
  category: 'Resin Charms · Buying Guide',
  title: 'Wholesale Resin Charms for Phone Cases: How to Choose Flatbacks and Request Samples',
  seoTitle: 'Wholesale Resin Charms for Phone Cases | HAIBUCRAFT',
  description: 'Source flatback resin charms for phone cases. Compare size, height and backing, test samples on your case material, and send a quote-ready bulk brief.',
  datePublished: '2026-11-12',
  dateModified: '2026-11-12',
  lastReviewed: 'November 12, 2026',
  scopeReview: false,
  watchGuide: { href: `/v2-preview/blog/${oceanPhoneCaseSlug}/`, label: 'Watch the 59-second ocean phone case tutorial' },
  inquirySource: 'phone-case-resin-charms-guide',
  inquiryCategory: 'resin-charms',
  dek: 'Shortlist charms by footprint, height and backing. Use a physical sample to check fit and adhesion before agreeing on assortment and packing.',
  introduction: 'If you source flatback cabochons for a phone-case line, a craft shop or a decoden kit, start with the case you will actually use. Send the usable back-panel dimensions and show where the camera, flash and curved rim reduce the bonding area. A sample that fits this layout gives both sides a reference for the wholesale order.',
  sections: [
    ['Measure the panel before choosing charm sizes', 'Measure the usable width and length of the flat area, and mark the camera, flash and any other keep-clear areas on a full-size outline. For a long focal piece, include the usable diagonal. Record a maximum height for raised pieces if the finished case must fit a display box or sit against a charger.', {
      id: 'measure-case-fit',
      paragraph: 'For each selected design, ask for its maximum length and width, thickness at the tallest point, and a rear-view photo. Compare the actual contact area with the flat area on your case. If you plan to sell several case models, check the smallest or most restricted layout separately.'
    }],
    ['Pastel hearts: plan the focal and accent quantities', 'Place one larger heart below center and group smaller hearts around it. For a kit, give the focal piece and each accent its own count. Specify whether you need a particular color in every kit or allow colors to vary within an agreed range.', {
      id: 'pastel-hearts',
      paragraph: 'RW2041 is a HAIBU heart-and-bow flatback reference listed at 5 × 18 × 25 mm. Confirm the measurement orientation, exact colors and mix before using that reference to plan a finished case.',
      image: heart
    }],
    ['Mini garden: check the profile of the tallest piece', 'Start with a sunflower low on the panel. Use smaller flowers or leaves to form the curve, and leave a gap around any butterfly accent. Raised centers, petal edges and leaf tips can affect the finished height and where the pieces make contact.', {
      id: 'mini-garden',
      paragraph: 'HAIBU lists the textured-center sunflower RW24724 at 25 mm. Request its thickness and rear view, then compare the sample against the space allowed in your layout.',
      image: garden
    }],
    ['Colorful guitar: define the shape with a reference image', 'For a long, narrow design, sketch the guitar at actual size and mark the widest part of the body and the tip of the neck. Show the intended angle, the available diagonal and the camera clearance. List the stars and notes as separate accents if their size or color matters.', {
      id: 'guitar-layout',
      paragraph: 'Send a reference image and target dimensions for review. Ask whether an existing design matches the brief or a custom sample would be needed.',
      image: guitar
    }],
    ['Approve a sample on the actual case and adhesive', 'Test the proposed charm on the same case material and finish you plan to use. Apply the adhesive according to its manufacturer’s directions and wait for its stated full cure time. Check for visible glue lines, lifting, haze and changes in the finish. If wireless charging is part of the offer, check the decorated case on the intended setup.', {
      id: 'sample-approval',
      paragraph: 'Record the sample revision, selected colors, dimensions, backing, adhesive and test observations. For a custom design, agree on the artwork and physical sample before finalizing the bulk specifications. Give the approved sample and packing instructions the same project reference.'
    }],
    ['Request a quote in the units you intend to buy', 'Send the selected SKUs or artwork, number of pieces per design, estimated order quantity, packing format, destination and required date. If you need a mixed bag or a counted kit, state the mix by pieces and list the items that must appear in each pack.', {
      id: 'bulk-quotation',
      paragraph: 'For example, specify a heart-and-bow kit with one focal heart, three accent hearts and one bow, then request a sample for your case model. Ask for the current MOQ, sample terms, packing options and lead time for that brief. A catalog bag quantity is a reference selling unit; confirm minimum order separately.'
    }]
  ],
  workingTable: {
    caption: 'Existing HAIBU catalog references for size and packing comparisons.',
    headings: ['SKU and design', 'Listed material and size', 'Reference packing', 'Confirm for the sample'],
    rows: [
      ['RW2041 · Glitter heart and bow flatbacks', 'Resin · 5 × 18 × 25 mm', '100 pcs/bag', 'Measurement orientation, rear surface and exact assortment'],
      ['RW24724 · Textured-center sunflower', 'Resin · 25 mm', '100 pcs/bag', 'Height, rear contact area and selected color']
    ]
  },
  checklist: ['Case model, material and usable back-panel dimensions', 'Reference layout or product codes', 'Maximum footprint and height', 'Sample and attachment checks', 'Quantity per SKU and packing format', 'Delivery destination and target date'],
  note: 'Layout images are illustrations. Confirm the actual product, color, finish and packing from the selected SKU and approved sample.',
  links: [
    ['RW2041 · Heart and Bow Flatbacks', '/v2-preview/products/resin-charms/rw2041-glitter-heart-bow-resin-flatbacks-wholesale/'],
    ['RW24724 · Textured-Center Sunflower', '/v2-preview/products/resin-charms/rw24724-25-mm-textured-center-sunflower-resin-cabochons-rw24724/'],
    ['Resin Charms Wholesale Catalog', '/v2-preview/products/resin-charms/'],
    ['Sample Approval Checklist', '/v2-preview/blog/sample-approval-checklist/'],
    ['Custom Resin & Polymer Clay Development', '/v2-preview/blog/custom-resin-polymer-clay-development-process/']
  ]
};

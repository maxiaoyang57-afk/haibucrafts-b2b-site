const origin = 'https://www.haibucrafts.com';
export const oceanPhoneCaseSlug = 'ocean-phone-case-charm-video';
const videoTitle = 'Pastel Ocean Phone Case with Resin and Polymer Clay';
const description = 'Watch a 59-second phone case tutorial. See how to place pastel ocean resin pieces, add small clay accents, and attach a beaded strap.';
const assets = '/assets/video/ocean-phone-case-tutorial';
const procurementPath = '/v2-preview/blog/wholesale-resin-charms-for-phone-cases/';

export const oceanPhoneCaseArticle = {
  slug: oceanPhoneCaseSlug,
  category: 'Video Tutorial',
  title: videoTitle,
  seoTitle: 'Ocean Phone Case Video: Resin Charms & Clay | HAIBUCRAFT',
  description,
  dek: 'Watch how a jellyfish, striped fish and large resin starfish anchor a clear case decorated with smaller clay pieces.',
  datePublished: '2026-11-12',
  dateModified: '2026-11-12',
  lastReviewed: 'November 12, 2026',
  scopeReview: false,
  inquirySource: 'ocean-phone-case-video',
  inquiryCategory: 'resin-charms',
  video: {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    '@id': `${origin}/blog/${oceanPhoneCaseSlug}/#video`,
    name: videoTitle,
    description,
    thumbnailUrl: `${origin}${assets}-poster.webp`,
    uploadDate: '2026-11-12',
    duration: 'PT59S',
    contentUrl: `${origin}${assets}.mp4`,
    inLanguage: 'en',
    mainEntityOfPage: `${origin}/blog/${oceanPhoneCaseSlug}/`
  },
  sections: [
    ['Clean the case and try the layout', 'Remove the phone and wipe the outside of the case clean and dry. Place the three larger shapes first, then try the smaller clay pieces in the gaps. Keep the camera and rim clear.'],
    ['Glue, press and cure', 'Put a small dot of compatible adhesive on each flat back. Use tweezers for thin slices and press each piece gently into place. Keep the case flat until the adhesive has fully cured according to its label.'],
    ['Fit the optional strap', 'Pass the cord loop through the case’s lanyard holes. Feed the strand through the loop and gently tighten it.']
  ],
  checklist: ['Case material and usable back-panel size', 'Selected SKUs and colors', 'Rear surface, thickness and adhesive fit', 'Sample quantities, packing and destination'],
  note: 'Assembly and finished look are illustrated. The mini clay starfish are a styling example. Ask about a matching sample. The case, adhesive and blue beaded strap are separate supplies.',
  links: [
    ['RW25644 · Pastel ocean resin cabochons', '/v2-preview/products/resin-charms/rw25644-pastel-ocean-resin-cabochons/'],
    ['YX720 · Shell polymer clay slices', '/v2-preview/products/polymer-clay-slices/yx720-shell-polymer-clay-sprinkle-mix-in-bulk/'],
    ['SLM10093 · Mix with clay stars', '/v2-preview/products/slime-charms/slm10093-mermaid-tail-and-candy-stars-mix/'],
    ['Wholesale phone case charm buying guide', procurementPath]
  ]
};

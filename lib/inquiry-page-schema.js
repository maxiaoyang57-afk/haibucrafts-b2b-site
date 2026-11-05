// RFQ catalog pages have no published offer or product-specific rating.
// Product rich results require offers, review, or aggregateRating:
// https://developers.google.com/search/docs/appearance/structured-data/product-snippet
export function inquiryPageSchema(product, description) {
  const origin = 'https://www.haibucrafts.com';
  const url = `${origin}${product.productionPath}`;
  const images = product.gallery.length
    ? product.structuredDataImageMode === 'main'
      ? `${origin}${product.gallery[0].src}`
      : product.gallery.map(item => `${origin}${item.src}`)
    : `${origin}${product.image}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name: product.title,
    description,
    mainEntity: {
      '@type': 'Thing',
      '@id': `${url}#catalog-item`,
      identifier: product.sku,
      name: product.title,
      description,
      image: images,
      url
    }
  };
}

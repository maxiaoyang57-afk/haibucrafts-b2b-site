import catalog from '../assets/v2/product-catalog.json' with { type: 'json' };

const products = new Map(catalog.products.map(product => [product.sku, product]));

export function prepareQuoteItems(input) {
  if (input == null) return [];
  if (!Array.isArray(input) || input.length > 20) throw new Error('Choose up to 20 products for one quote.');
  const seen = new Set();
  return input.map(item => {
    if (!item || typeof item.sku !== 'string' || !products.has(item.sku) || seen.has(item.sku)) {
      throw new Error('The quote list contains an unknown or duplicate product. Please refresh your list.');
    }
    if (item.quantity != null && (typeof item.quantity !== 'string' || item.quantity.length > 80)) {
      throw new Error('Keep each product quantity within 80 characters.');
    }
    seen.add(item.sku);
    const product = products.get(item.sku);
    return {
      sku: product.sku,
      title: product.title,
      quantity: (item.quantity || '').replace(/[\u0000-\u001f]/g, ' ').trim(),
      url: `https://www.haibucrafts.com${product.productionPath}`,
      image: `https://www.haibucrafts.com${product.image}`
    };
  });
}

// Show only this SKU's already resolved detail-page facts. Unknown packing must
// not fall back to weight buttons, another SKU, MOQ or the category default.
export function renderBuyerCardSpecs(product, escapeHtml) {
  const rows = [
    ['Material', product.material || 'Confirm material by inquiry'],
    ['Size reference', product.dimensions || 'Confirm dimensions by inquiry'],
    ['Packing', product.sourcePacking || 'Confirm pack quantity or net weight by inquiry']
  ];
  return `<dl class="buyer-card-specs" data-buyer-specs="${escapeHtml(product.sku)}">${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join('')}</dl><p class="buyer-card-selection">Confirm available colors, mix contents and proportions for this SKU.</p>`;
}

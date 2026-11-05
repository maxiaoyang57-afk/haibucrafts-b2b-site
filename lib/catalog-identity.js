// Read the stable identity of an inquiry-only catalog entity, not a Product offer.
export function catalogIdentity(schema) {
  if (schema?.['@type'] !== 'WebPage' || schema.mainEntity?.['@type'] !== 'Thing') return undefined;
  const entity = schema.mainEntity;
  if (typeof entity.identifier !== 'string' || !entity.identifier.trim()) return undefined;
  return { ...entity, sku: entity.identifier };
}
export function visibleSpec(html, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`<li>\\s*${escaped}:\\s*([^<]*)</li>`));
  return match?.[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#(?:39|x27);/g, "'").replace(/&nbsp;/g, ' ');
}

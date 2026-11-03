// Catalog hubs change when the public product list or a listed product changes.
// Derive their freshness from recorded source dates, never from the build clock.
function sourceDate(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '') ||
      !Number.isFinite(Date.parse(value)) ||
      new Date(value).toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid sitemap source date for ${label}: ${value}`);
  }
  return value;
}

export function updateCategoryLastModified(seoMap, catalog) {
  const routeByPath = new Map(seoMap.routes.map(route => [route.productionPath, route]));
  const latestByCategory = new Map();
  for (const product of catalog.products) {
    const route = routeByPath.get(product.productionPath);
    if (!route?.index) continue;
    const date = sourceDate(route.lastModified || catalog.generatedAt, product.sku);
    const previous = latestByCategory.get(product.category);
    if (!previous || date > previous) latestByCategory.set(product.category, date);
  }

  const changes = [];
  for (const [category, productDate] of latestByCategory) {
    const hub = seoMap.routes.find(route =>
      route.index && route.previewPath === `/v2-preview/products/${category}/`);
    if (!hub) continue;
    const oldDate = hub.lastModified ? sourceDate(hub.lastModified, hub.productionPath) : null;
    // A later editorial update on the hub must remain later than its product dates.
    const nextDate = oldDate && oldDate > productDate ? oldDate : productDate;
    if (hub.lastModified !== nextDate) {
      changes.push({ category, productionPath: hub.productionPath, before: hub.lastModified || null, after: nextDate });
      hub.lastModified = nextDate;
    }
  }
  return changes;
}


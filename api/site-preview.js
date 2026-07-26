import path from 'node:path';
import { readFile } from 'node:fs/promises';

const ROOT = process.cwd();
const DOMAIN = 'https://www.haibucrafts.com';
const SOCIAL_IMAGE = `${DOMAIN}/assets/images/hero/slime-charms-b2b-banner.webp`;

const PAGE_OVERRIDES = {
  'index.html': {
    title: 'Slime Charms Wholesale Supplier | HAIBU CRAFT',
    description: 'Factory-owned craft supplier specializing in slime charms, polymer clay slices, resin charms, sequins and OEM craft solutions for global wholesale buyers.'
  },
  'about/index.html': {
    title: 'About HAIBU CRAFT | Factory-Owned B2B Supplier',
    description: 'Learn how HAIBU CRAFT supports global wholesale buyers with factory-owned production, OEM development, quality control and export-ready packing.'
  },
  'about/b2b-export-supplier.html': {
    title: 'B2B Export Supplier | HAIBU CRAFT',
    description: 'Factory-direct export supply for slime charms, polymer clay slices, resin charms, sequins and custom craft add-ins for global wholesale buyers.'
  },
  'about/brand-factory/index.html': {
    title: 'Brand & Factory Relationship | HAIBU CRAFT',
    description: 'Understand how the HAIBU CRAFT export brand connects with its registered manufacturing company for quotations, orders and supporting documents.'
  },
  'about/manufacturing.html': {
    title: 'Manufacturing Capability | HAIBU CRAFT',
    description: 'Factory-owned production, OEM development, packing and export support for wholesale slime charms and craft add-ins.'
  },
  'about/quality-control.html': {
    title: 'Quality Control | HAIBU CRAFT',
    description: 'Quality control workflow for wholesale slime charms, polymer clay slices, resin charms, sequins and custom craft mixes.'
  },
  'custom-services/index.html': {
    title: 'Custom Solutions & OEM Services | HAIBU CRAFT',
    description: 'Custom product development, OEM mixes, private-label packaging and wholesale program support for slime and craft brands.'
  },
  'blog/index.html': {
    title: 'Wholesale Craft Sourcing Guides | HAIBU CRAFT',
    description: 'B2B sourcing guides for slime charms, polymer clay slices, resin charms, sequins, OEM development and wholesale craft supply.'
  },
  'blog/custom-oem-process.html': {
    title: 'Custom OEM Process for Craft Products | HAIBU CRAFT',
    description: 'A practical guide to moving a custom slime add-in or craft product idea from buyer brief and sampling to quotation and bulk production.'
  },
  'blog/polymer-clay-slices-buying-guide.html': {
    title: 'Polymer Clay Slices Buying Guide | HAIBU CRAFT',
    description: 'A wholesale buying guide covering sizes, themes, packing, order quantities and OEM options for polymer clay slices.'
  },
  'blog/resin-vs-clay.html': {
    title: 'Resin Charms vs Clay Slices | HAIBU CRAFT',
    description: 'Compare resin charms and polymer clay slices by appearance, use case, packing and wholesale program fit.'
  },
  'products/index.html': {
    title: 'Wholesale Product Directories | HAIBU CRAFT',
    description: 'Browse wholesale slime charms, polymer clay slices, resin charms, sequins, glitter confetti and OEM craft mix programs.'
  },
  'products/resin-charms-for-slime.html': {
    title: 'Resin Charms for Slime Wholesale | HAIBU CRAFT',
    description: 'Wholesale flatback and novelty resin charms for slime brands, craft kits, retailers and custom product programs.'
  },
  'products/slime-charms-wholesale.html': {
    title: 'Slime Charms Wholesale | HAIBU CRAFT',
    description: 'Factory-direct wholesale slime charms for slime brands, distributors, craft retailers, DIY kits and private-label programs.'
  },
  'quote/index.html': {
    title: 'Request a Wholesale Quote | HAIBU CRAFT',
    description: 'Request factory pricing for slime charms, polymer clay slices, resin charms, sequins, OEM mixes and private-label packaging.'
  }
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function normalizeFile(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  let file = String(raw || 'index.html').split('?')[0].split('#')[0];
  file = decodeURIComponent(file).replace(/^\/+/, '');
  if (!file || file.endsWith('/')) file += 'index.html';
  file = path.posix.normalize(file);
  if (file.startsWith('../') || path.isAbsolute(file) || !file.endsWith('.html')) {
    throw new Error('Invalid preview file path.');
  }
  return file;
}

function canonicalFor(file) {
  if (file === 'index.html') return `${DOMAIN}/`;
  if (file.endsWith('/index.html')) return `${DOMAIN}/${file.slice(0, -10)}`;
  return `${DOMAIN}/${file}`;
}

function replaceOrInsertTitle(html, title) {
  const tag = `<title>${escapeHtml(title)}</title>`;
  if (/<title>[\s\S]*?<\/title>/i.test(html)) return html.replace(/<title>[\s\S]*?<\/title>/i, tag);
  return html.replace(/<head[^>]*>/i, match => `${match}${tag}`);
}

function replaceOrInsertMeta(html, name, content) {
  const escaped = escapeHtml(content);
  const first = new RegExp(`<meta[^>]+name=["']${name}["'][^>]*>`, 'i');
  const second = new RegExp(`<meta[^>]+content=["'][^"']*["'][^>]+name=["']${name}["'][^>]*>`, 'i');
  const tag = `<meta name="${name}" content="${escaped}">`;
  if (first.test(html)) return html.replace(first, tag);
  if (second.test(html)) return html.replace(second, tag);
  return html.replace(/<\/head>/i, `${tag}</head>`);
}

function replaceOrInsertProperty(html, property, content) {
  const escaped = escapeHtml(content);
  const regex = new RegExp(`<meta[^>]+property=["']${property}["'][^>]*>`, 'i');
  const tag = `<meta property="${property}" content="${escaped}">`;
  if (regex.test(html)) return html.replace(regex, tag);
  return html.replace(/<\/head>/i, `${tag}</head>`);
}

function replaceOrInsertCanonical(html, canonical) {
  const tag = `<link rel="canonical" href="${escapeHtml(canonical)}">`;
  if (/<link[^>]+rel=["']canonical["'][^>]*>/i.test(html)) {
    return html.replace(/<link[^>]+rel=["']canonical["'][^>]*>/i, tag);
  }
  if (/<link[^>]+href=["'][^"']+["'][^>]+rel=["']canonical["'][^>]*>/i.test(html)) {
    return html.replace(/<link[^>]+href=["'][^"']+["'][^>]+rel=["']canonical["'][^>]*>/i, tag);
  }
  return html.replace(/<\/head>/i, `${tag}</head>`);
}

function ensureBase(html) {
  if (/<base\b/i.test(html)) return html;
  const viewport = /<meta[^>]+name=["']viewport["'][^>]*>/i;
  if (viewport.test(html)) return html.replace(viewport, match => `${match}<base href="/">`);
  return html.replace(/<head[^>]*>/i, match => `${match}<base href="/">`);
}

function sectionFor(file) {
  if (file === 'index.html') return 'home';
  if (file.startsWith('products/')) return 'products';
  if (file.startsWith('custom-services/')) return 'custom';
  if (file.startsWith('blog/')) return 'blog';
  if (file.startsWith('quote/')) return 'quote';
  if (file.startsWith('about/')) return 'company';
  return '';
}

function current(section, expected) {
  return section === expected ? ' aria-current="page"' : '';
}

function buildNavigation(file) {
  const section = sectionFor(file);
  return `<nav class="navlinks">
<a href="/index.html"${current(section, 'home')}>Home</a>
<div class="nav-dropdown"><a class="products-main-link" href="/products/index.html"${current(section, 'products')}>Products</a><button aria-expanded="false" aria-label="Open product categories" class="products-trigger" type="button"><span aria-hidden="true">⌄</span></button><div class="dropdown-menu mega-menu"><div class="dropdown-group-title">Core Product Families</div><a href="/products/slime-charms-wholesale.html"><strong>Slime Charms Wholesale</strong><span>Bulk decorative charms for slime brands, distributors and DIY kit suppliers.</span></a><a href="/products/polymer-clay-slices-wholesale.html"><strong>Polymer Clay Slices Wholesale</strong><span>Fruit, seasonal and novelty slices for slime, crafts and kit programs.</span></a><a href="/products/resin-charms-for-slime.html"><strong>Resin Charms for Slime</strong><span>Glossy flatback and novelty resin add-ins for premium slime collections.</span></a><a href="/products/sequins-glitter-confetti.html"><strong>Sequins &amp; Glitter Confetti</strong><span>Shaped sequins, holographic confetti and decorative fillers for slime and crafts.</span></a><a class="dropdown-viewall" href="/products/index.html">View All Product Directories →</a></div></div>
<a href="/custom-services/index.html"${current(section, 'custom')}>Custom Solutions</a>
<div class="nav-dropdown"><a class="products-main-link" href="/about/index.html"${current(section, 'company')}>Company</a><button aria-expanded="false" aria-label="Open company information" class="products-trigger" type="button"><span aria-hidden="true">⌄</span></button><div class="dropdown-menu mega-menu"><div class="dropdown-group-title">Factory & Company</div><a href="/about/index.html"><strong>About HAIBU CRAFT</strong><span>Our B2B focus, product scope and buyer support.</span></a><a href="/about/manufacturing.html"><strong>Manufacturing</strong><span>Factory-owned production, OEM development and packing capability.</span></a><a href="/about/quality-control.html"><strong>Quality Control</strong><span>Specification, in-process, final and packing checks.</span></a><a href="/about/brand-factory/"><strong>Brand & Factory Relationship</strong><span>How the export brand connects with the registered manufacturing company.</span></a><a href="/about/b2b-export-supplier.html"><strong>B2B Export Supply</strong><span>Support for international wholesale orders and destination markets.</span></a></div></div>
<a href="/blog/index.html"${current(section, 'blog')}>Blog</a>
<a class="quote-link" href="/quote/index.html"${current(section, 'quote')}>Request a Quote</a>
</nav>`;
}

function replaceNavigation(html, file) {
  const navigation = buildNavigation(file);
  if (/<nav class=["']navlinks["'][^>]*>[\s\S]*?<\/nav>/i.test(html)) {
    return html.replace(/<nav class=["']navlinks["'][^>]*>[\s\S]*?<\/nav>/i, navigation);
  }
  return html;
}

function replaceTopbar(html) {
  const topbar = '<div class="topbar"><div class="container"><span>Factory wholesale · OEM/ODM · Private label · Export support</span><span><a href="mailto:sale008@sola-craft.com">sale008@sola-craft.com</a> · <a href="https://wa.me/8618632026595?text=Hello%2C%20I%20would%20like%20to%20ask%20about%20your%20wholesale%20products%2C%20MOQ%2C%20packing%20and%20lead%20time." target="_blank" rel="noopener noreferrer">WhatsApp</a></span></div></div>';
  if (/<div class=["']topbar["']>[\s\S]*?<\/div>\s*<\/div>/i.test(html)) {
    return html.replace(/<div class=["']topbar["']>[\s\S]*?<\/div>\s*<\/div>/i, topbar);
  }
  return html.replace(/<body[^>]*>/i, match => `${match}${topbar}`);
}

function replaceFooter(html) {
  const footer = `<footer><div class="container"><div class="footer-grid"><div><img alt="HAIBU CRAFT" src="/assets/images/logo-haibu.webp" style="width:170px" decoding="async" loading="lazy"><p>Factory-direct slime charms and craft add-ins for distributors, craft brands, retailers and DIY kit wholesalers.</p></div><div><h3>Core Products</h3><a href="/products/slime-charms-wholesale.html">Slime Charms</a><a href="/products/polymer-clay-slices-wholesale.html">Polymer Clay Slices</a><a href="/products/resin-charms-for-slime.html">Resin Charms</a><a href="/products/sequins-glitter-confetti.html">Sequins &amp; Confetti</a></div><div><h3>Factory & Company</h3><a href="/custom-services/index.html">Custom Solutions</a><a href="/about/manufacturing.html">Manufacturing</a><a href="/about/quality-control.html">Quality Control</a><a href="/about/brand-factory/">Brand & Factory</a><a href="/about/index.html">About</a></div><div><h3>Contact</h3><a href="mailto:sale008@sola-craft.com">sale008@sola-craft.com</a><a href="https://wa.me/8618632026595" target="_blank" rel="noopener noreferrer">+86 186 3202 6595</a><p>Target response time: within 24 hours</p></div></div><div class="copy"><a href="/privacy.html">Privacy Policy</a> · © 2026 HAIBU CRAFT. Factory wholesale inquiry website.</div></div></footer>`;
  if (/<footer\b[^>]*>[\s\S]*?<\/footer>/i.test(html)) return html.replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/i, footer);
  return html.replace(/<\/body>/i, `${footer}</body>`);
}

function ensureWhatsapp(html) {
  if (/class=["'][^"']*\bwhatsapp\b/i.test(html)) return html;
  const button = '<a aria-label="Chat with HAIBU CRAFT on WhatsApp" class="whatsapp" href="https://wa.me/8618632026595?text=Hello%2C%20I%20would%20like%20to%20ask%20about%20your%20wholesale%20products%2C%20MOQ%2C%20packing%20and%20lead%20time." target="_blank" rel="noopener noreferrer" title="WhatsApp">WA</a>';
  return html.replace(/<\/body>/i, `${button}</body>`);
}

function ensureMainScript(html) {
  if (/assets\/js\/main\.js/i.test(html)) return html;
  return html.replace(/<\/body>/i, '<script src="/assets/js/main.js"></script></body>');
}

function addFormLabels(html) {
  return html.replace(/<(input|select|textarea)\b([^>]*)>/gi, (full, tag, attrs) => {
    if (/type=["']hidden["']/i.test(attrs) || /aria-label=|aria-labelledby=/i.test(attrs)) return full;
    const placeholder = attrs.match(/placeholder=["']([^"']+)["']/i)?.[1];
    const name = attrs.match(/name=["']([^"']+)["']/i)?.[1];
    const label = placeholder || String(name || tag).replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
    return `<${tag}${attrs} aria-label="${escapeHtml(label)}">`;
  });
}

function customizePage(html, file) {
  if (file === 'custom-services/index.html') {
    html = html.replace(/Home\s*\/\s*Custom Services/gi, 'Home / Custom Solutions');
    html = html.replace(/<h1>Custom Services<\/h1>/i, '<h1>Custom Product & OEM Solutions</h1>');
    html = html.replace('Support custom pack building, mix design, label upgrades and OEM communication for bulk inquiry projects.', 'Develop custom assortments, OEM mixes and private-label packaging with a clear buyer brief, sampling process and factory quotation workflow.');
    html = html.replace(/value=["']Custom Service Inquiry["']/i, 'value="Custom Solutions Inquiry"');
  }
  if (file === 'index.html') {
    const oldDescription = 'Factory supplier of slime charms, polymer clay slices, resin charms, sequins and custom craft sprinkles for slime shops, craft brands and DIY kit wholesalers.';
    html = html.replace(`<h1>Slime Charms Wholesale Supplier</h1><p>${oldDescription}</p>`, '<h1>Slime Charms Wholesale Supplier</h1><p>Supporting global craft brands with factory-direct supply, OEM development and flexible wholesale solutions.</p>');
    html = html.replace('<div class="hero-trust-row-v12"><span>Factory-direct supply</span><span>OEM / Private Label</span><span>Export-ready packing</span><span>24-hour quote target</span></div>', '<div class="hero-trust-row-v12"><span>Factory-owned supply</span><span>OEM &amp; Private Label</span><span>Quality-controlled production</span><span>Export-ready packaging</span></div>');
  }
  return html;
}

function applySeo(html, file) {
  if (file === '404.html') {
    html = replaceOrInsertMeta(html, 'robots', 'noindex,follow');
    return html;
  }
  const currentTitle = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() || 'HAIBU CRAFT';
  const currentDescription = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i)?.[1]
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i)?.[1]
    || 'Factory-direct wholesale craft products and OEM support from HAIBU CRAFT.';
  const override = PAGE_OVERRIDES[file] || {};
  const title = override.title || currentTitle;
  const description = override.description || currentDescription;
  const canonical = canonicalFor(file);

  html = replaceOrInsertTitle(html, title);
  html = replaceOrInsertMeta(html, 'description', description);
  html = replaceOrInsertCanonical(html, canonical);
  html = replaceOrInsertProperty(html, 'og:type', 'website');
  html = replaceOrInsertProperty(html, 'og:site_name', 'HAIBU CRAFT');
  html = replaceOrInsertProperty(html, 'og:title', title);
  html = replaceOrInsertProperty(html, 'og:description', description);
  html = replaceOrInsertProperty(html, 'og:url', canonical);
  html = replaceOrInsertProperty(html, 'og:image', SOCIAL_IMAGE);
  html = replaceOrInsertMeta(html, 'twitter:card', 'summary_large_image');
  html = replaceOrInsertMeta(html, 'twitter:title', title);
  html = replaceOrInsertMeta(html, 'twitter:description', description);
  html = replaceOrInsertMeta(html, 'twitter:image', SOCIAL_IMAGE);
  return html;
}

async function buildPage(file) {
  const filePath = path.join(ROOT, file);
  let html = await readFile(filePath, 'utf8');
  html = ensureBase(html);
  html = customizePage(html, file);
  html = applySeo(html, file);
  html = replaceTopbar(html);
  html = replaceNavigation(html, file);
  html = replaceFooter(html);
  html = addFormLabels(html);
  html = ensureWhatsapp(html);
  html = ensureMainScript(html);
  return html;
}

export default async function handler(req, res) {
  if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
    res.setHeader('Allow', 'GET, HEAD');
    res.status(405).end('Method Not Allowed');
    return;
  }
  try {
    const file = normalizeFile(req.query?.file);
    const html = await buildPage(file);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    if (req.method === 'HEAD') res.end();
    else res.end(html);
  } catch (error) {
    console.error(error);
    res.statusCode = error?.code === 'ENOENT' ? 404 : 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(res.statusCode === 404 ? 'Page not found.' : 'Preview page could not be generated.');
  }
}

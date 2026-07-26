import path from 'node:path';
import { readFile } from 'node:fs/promises';

let cachedHtml = '';

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) {
    throw new Error(`Homepage preview replacement missing: ${label}`);
  }
  return source.replace(search, replacement);
}

async function buildHomepage() {
  if (cachedHtml) return cachedHtml;

  const filePath = path.join(process.cwd(), 'index.html');
  let html = await readFile(filePath, 'utf8');

  const oldDescription = 'Factory supplier of slime charms, polymer clay slices, resin charms, sequins and custom craft sprinkles for slime shops, craft brands and DIY kit wholesalers.';
  const newDescription = 'Factory-owned craft supplier specializing in slime charms, polymer clay slices, resin charms, sequins and OEM craft solutions for global wholesale buyers.';

  html = replaceRequired(
    html,
    `<meta content="${oldDescription}" name="description"/>`,
    `<meta content="${newDescription}" name="description"/>`,
    'meta description'
  );
  html = replaceRequired(
    html,
    `<meta property="og:description" content="${oldDescription}">`,
    `<meta property="og:description" content="${newDescription}">`,
    'Open Graph description'
  );
  html = replaceRequired(
    html,
    `<meta name="twitter:description" content="${oldDescription}">`,
    `<meta name="twitter:description" content="${newDescription}">`,
    'Twitter description'
  );

  html = replaceRequired(
    html,
    '<a href="custom-services/index.html">Custom Services</a><a href="about/index.html">About</a>',
    '<a href="custom-services/index.html">Custom Solutions</a><a href="about/manufacturing.html">Manufacturing</a><a href="about/quality-control.html">Quality Control</a><a href="about/index.html">About</a>',
    'desktop and mobile navigation'
  );

  html = replaceRequired(
    html,
    `<h1>Slime Charms Wholesale Supplier</h1><p>${oldDescription}</p>`,
    '<h1>Slime Charms Wholesale Supplier</h1><p>Supporting global craft brands with factory-direct supply, OEM development and flexible wholesale solutions.</p>',
    'hero description'
  );

  html = replaceRequired(
    html,
    '<div class="hero-trust-row-v12"><span>Factory-direct supply</span><span>OEM / Private Label</span><span>Export-ready packing</span><span>24-hour quote target</span></div>',
    '<div class="hero-trust-row-v12"><span>Factory-owned supply</span><span>OEM &amp; Private Label</span><span>Quality-controlled production</span><span>Export-ready packaging</span></div>',
    'hero trust row'
  );

  cachedHtml = html;
  return html;
}

export default async function handler(req, res) {
  if (!['GET', 'HEAD'].includes(req.method || 'GET')) {
    res.setHeader('Allow', 'GET, HEAD');
    res.status(405).end('Method Not Allowed');
    return;
  }

  try {
    const html = await buildHomepage();
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    if (req.method === 'HEAD') res.end();
    else res.end(html);
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Homepage preview could not be generated.');
  }
}

import { randomUUID } from 'node:crypto';

const MAX_BODY_BYTES = 4_000_000;
const MAX_ATTACHMENTS = 4;
const MAX_ATTACHMENT_BYTES = 800_000;
const MAX_TOTAL_ATTACHMENT_BYTES = 2_800_000;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const ALLOWED_ORIGINS = new Set([
  'https://www.haibucrafts.com',
  'https://haibucrafts.com'
]);
const LABELS = {
  name: 'Contact Name',
  company: 'Company / Brand',
  email: 'Business Email',
  country: 'Country / Region',
  phone: 'WhatsApp / Phone',
  website: 'Company Website',
  product: 'Product',
  product_display: 'Product',
  sku: 'SKU',
  sku_display: 'SKU',
  category: 'Product Category',
  quantity: 'Target Quantity',
  intended_use: 'Intended Use',
  target_delivery_date: 'Target Delivery Date',
  customization: 'Customization Program',
  custom_theme: 'Theme / Custom Shape',
  preferred_colors: 'Preferred Colors',
  dimensions: 'Size / Dimensions',
  packaging: 'Packaging Requirements',
  product_note: 'Interested Category / SKU',
  message: 'Project Details'
};

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function clean(value, maxLength = 4000) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, maxLength);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function parseBody(req) {
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString('utf8') || '{}');
  return req.body && typeof req.body === 'object' ? req.body : {};
}

function prepareAttachments(input) {
  if (input == null) return [];
  if (!Array.isArray(input) || input.length > MAX_ATTACHMENTS) throw new Error('ATTACHMENTS_INVALID');
  let totalBytes = 0;
  return input.map((attachment, index) => {
    const filename = clean(attachment?.filename || `reference-${index + 1}.jpg`, 100)
      .replace(/[^a-zA-Z0-9._ -]/g, '_');
    const contentType = clean(attachment?.contentType, 80).toLowerCase();
    const content = clean(attachment?.content, 1_200_000).replace(/\s/g, '');
    if (!ALLOWED_IMAGE_TYPES.has(contentType) || !/^[A-Za-z0-9+/]*={0,2}$/.test(content)) {
      throw new Error('ATTACHMENTS_INVALID');
    }
    const size = Math.floor(content.length * 3 / 4);
    if (!size || size > MAX_ATTACHMENT_BYTES) throw new Error('ATTACHMENT_TOO_LARGE');
    totalBytes += size;
    if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) throw new Error('ATTACHMENTS_TOO_LARGE');
    return { filename, content };
  });
}

function prepareFields(input) {
  const source = input && typeof input === 'object' ? input : {};
  const fields = {};
  for (const key of Object.keys(LABELS)) {
    const value = clean(source[key], key === 'message' ? 8000 : 1000);
    if (value && !(key.endsWith('_display') && fields[key.replace('_display', '')])) fields[key] = value;
  }
  return fields;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return json(res, 405, { ok: false, message: 'Method not allowed' });
  }

  const contentLength = Number(req.headers['content-length'] || 0);
  if (contentLength > MAX_BODY_BYTES) return json(res, 413, { ok: false, message: 'Request is too large' });

  const origin = clean(req.headers.origin, 300);
  if (origin && !ALLOWED_ORIGINS.has(origin) && !/^https:\/\/[^/]+\.vercel\.app$/.test(origin)) {
    return json(res, 403, { ok: false, message: 'Origin not allowed' });
  }

  let body;
  try {
    body = parseBody(req);
  } catch {
    return json(res, 400, { ok: false, message: 'Invalid request body' });
  }

  if (clean(body?._company_fax, 100)) return json(res, 200, { ok: true });

  const fields = prepareFields(body?.fields);
  const email = fields.email || '';
  if (!fields.name || !isEmail(email) || !fields.country) {
    return json(res, 400, { ok: false, message: 'Name, valid email and country are required' });
  }

  let attachments;
  try {
    attachments = prepareAttachments(body?.attachments);
  } catch (error) {
    const tooLarge = /TOO_LARGE/.test(error.message);
    return json(res, tooLarge ? 413 : 400, {
      ok: false,
      message: tooLarge ? 'Reference images are too large' : 'Reference images are invalid'
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return json(res, 503, { ok: false, message: 'Email service is not configured' });

  const product = fields.product || fields.product_display || 'General Wholesale Inquiry';
  const sku = fields.sku || fields.sku_display || '';
  const subject = clean(`Wholesale quote request - ${product}${sku ? ` - ${sku}` : ''}`, 180);
  const rows = Object.entries(fields)
    .filter(([key]) => !key.endsWith('_display') || !fields[key.replace('_display', '')])
    .map(([key, value]) => [LABELS[key] || key, value]);
  const text = rows.map(([label, value]) => `${label}: ${value}`).join('\n');
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#302b35;line-height:1.55"><h2>${escapeHtml(subject)}</h2><table style="border-collapse:collapse;width:100%;max-width:760px">${rows.map(([label, value]) => `<tr><th style="text-align:left;vertical-align:top;padding:8px;border-bottom:1px solid #e9dfe6;width:190px">${escapeHtml(label)}</th><td style="padding:8px;border-bottom:1px solid #e9dfe6;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`).join('')}</table>${attachments.length ? `<p>${attachments.length} compressed reference image(s) attached.</p>` : ''}</body></html>`;

  const from = process.env.INQUIRY_FROM_EMAIL || 'HAIBU CRAFT <inquiry@send.haibucrafts.com>';
  const to = process.env.INQUIRY_TO_EMAIL || 'sale008@sola-craft.com';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `inquiry-${randomUUID()}`
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject,
        text,
        html,
        attachments
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Resend inquiry failure', response.status, result?.message || 'Unknown error');
      return json(res, 502, { ok: false, message: 'Email service rejected the request' });
    }
    return json(res, 200, { ok: true, id: result.id || null });
  } catch (error) {
    console.error('Inquiry delivery failure', error instanceof Error ? error.message : 'Unknown error');
    return json(res, 502, { ok: false, message: 'Email service is temporarily unavailable' });
  }
}

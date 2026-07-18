const recipientEmail = process.env.INQUIRY_TO_EMAIL || 'sale008@sola-craft.com';
const fieldLabels = {
  name: 'Contact Name',
  company: 'Company / Brand',
  email: 'Business Email',
  country: 'Country / Region',
  phone: 'WhatsApp / Phone',
  website: 'Company Website',
  product: 'Product',
  sku: 'SKU',
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
  specification: 'Specification',
  message: 'Project Details'
};
const recentRequests = new Map();

const clean = (value, maxLength = 2000) => String(value || '').trim().slice(0, maxLength);
const escapeHtml = value => clean(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const isRateLimited = request => {
  const now = Date.now();
  const ip = clean(request.headers['x-forwarded-for'] || request.socket?.remoteAddress || 'unknown', 120).split(',')[0];
  const previous = (recentRequests.get(ip) || []).filter(timestamp => now - timestamp < 10 * 60 * 1000);
  previous.push(now);
  recentRequests.set(ip, previous);
  if (recentRequests.size > 500) {
    for (const [key, timestamps] of recentRequests) {
      if (!timestamps.some(timestamp => now - timestamp < 10 * 60 * 1000)) recentRequests.delete(key);
    }
  }
  return previous.length > 5;
};

const validBlobUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.endsWith('.public.blob.vercel-storage.com');
  } catch {
    return false;
  }
};

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ ok: false, message: 'Method not allowed' });
  }
  if (isRateLimited(request)) return response.status(429).json({ ok: false, message: 'Too many requests. Please try again later.' });

  try {
    const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body || {};
    if (clean(body.fax_number, 200)) return response.status(202).json({ ok: true });
    if (Number(body.startedAt) && Date.now() - Number(body.startedAt) < 1500) return response.status(202).json({ ok: true });

    const fields = Object.fromEntries(Object.keys(fieldLabels).map(key => [key, clean(body.fields?.[key]) ]));
    if (!fields.name || !fields.email || !fields.country) {
      return response.status(400).json({ ok: false, message: 'Please complete your name, business email and country.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      return response.status(400).json({ ok: false, message: 'Please enter a valid business email.' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.INQUIRY_FROM_EMAIL;
    if (!apiKey || !fromEmail) {
      console.error('Inquiry email environment variables are not configured');
      return response.status(503).json({ ok: false, message: 'The inquiry service is being configured. Please email us directly.' });
    }

    const rows = Object.entries(fieldLabels)
      .filter(([key]) => fields[key])
      .map(([key, label]) => `<tr><th style="text-align:left;padding:8px 12px;border:1px solid #ddd;background:#f6f6f3">${escapeHtml(label)}</th><td style="padding:8px 12px;border:1px solid #ddd">${escapeHtml(fields[key]).replaceAll('\n', '<br>')}</td></tr>`)
      .join('');
    const suppliedFiles = Array.isArray(body.files) ? body.files : Array.isArray(body.images) ? body.images : [];
    const images = suppliedFiles.slice(0, 10).filter(image => validBlobUrl(image?.url));
    const imageHtml = images.length
      ? `<h2 style="margin-top:28px">Reference Files</h2><ol>${images.map(image => `<li><a href="${escapeHtml(image.url)}">${escapeHtml(image.name || 'Reference file')}</a> (${Math.max(1, Math.round(Number(image.size || 0) / 1024))} KB)</li>`).join('')}</ol>`
      : '<p><strong>Reference files:</strong> None</p>';
    const sourceUrl = clean(body.sourceUrl, 1000);
    const product = fields.product || 'General Wholesale Inquiry';
    const skuSuffix = fields.sku ? ` · ${fields.sku}` : '';
    const subject = `New wholesale inquiry · ${product}${skuSuffix}`.slice(0, 180);
    const textRows = Object.entries(fieldLabels)
      .filter(([key]) => fields[key])
      .map(([key, label]) => `${label}: ${fields[key]}`)
      .join('\n');
    const textImages = images.length ? images.map((image, index) => `${index + 1}. ${image.name || 'Reference file'}: ${image.url}`).join('\n') : 'None';

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': clean(body.submissionId, 200) || crypto.randomUUID()
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [recipientEmail],
        reply_to: fields.email,
        subject,
        html: `<div style="font-family:Arial,sans-serif;color:#222;max-width:760px"><h1>New Wholesale Quote Request</h1><table style="border-collapse:collapse;width:100%">${rows}</table>${imageHtml}<p style="margin-top:24px;color:#666"><strong>Source page:</strong> ${escapeHtml(sourceUrl || 'Not provided')}</p></div>`,
        text: `New Wholesale Quote Request\n\n${textRows}\n\nReference files:\n${textImages}\n\nSource page: ${sourceUrl || 'Not provided'}`
      })
    });

    const resendResult = await resendResponse.json().catch(() => ({}));
    if (!resendResponse.ok) {
      console.error('Resend rejected inquiry email', resendResponse.status, resendResult?.message || 'Unknown error');
      return response.status(502).json({ ok: false, message: 'The email service could not send your inquiry. Please try again.' });
    }
    return response.status(202).json({ ok: true, id: resendResult.id });
  } catch (error) {
    console.error('Inquiry endpoint failed', error instanceof Error ? error.message : error);
    return response.status(500).json({ ok: false, message: 'The inquiry could not be sent. Please try again.' });
  }
}

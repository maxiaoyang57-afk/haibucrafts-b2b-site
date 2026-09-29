/* Contextual inquiry guidance. No customer contact details are stored or tracked. */
(function () {
  'use strict';
  const config = {"brand": "HAIBUCRAFT", "origin": "https://www.haibucrafts.com", "email": "sales@haibucrafts.com", "whatsapp": "8618632026595", "phoneField": "phone", "formSelector": "[data-quote-form]"};
  const ownScript = document.currentScript;
  const goals = {
    'Price and availability': ['What would you like us to quote?', 'Share a product code or description, an approximate quantity with its unit, and your destination. Not sure about quantity? Tell us what you are planning.'],
    'Samples first': ['What would you like to try?', 'Tell us which products you want to test, what you want to check, and the destination country. We will confirm sample availability, fees and shipping before you decide.'],
    'Custom development': ['What would you like to create?', 'Share a reference image or describe the shape, material, size, colors or finished accessory you have in mind. Add your intended use and approximate quantity if known.'],
    'Help choosing products': ['What will you use the products for?', 'Tell us what you make or sell, your preferred styles, and anything you are unsure about. You do not need a finished specification to start.'],
    'Repeat order': ['What would you like to order again?', 'Share the product codes or previous order reference, quantities, and anything you want to change.']
  };
  const copy = {
    product: ['Ask about this product', 'Would you like pricing, samples or a custom version of this product?'],
    category: ['Find the right products', 'Tell us which styles you like and what you plan to make or sell. We can help narrow down the options.'],
    custom: ['Discuss your design', 'Have an idea or reference image? Tell us what you would like to create; details can be worked out together.'],
    guide: ['Get sourcing advice', 'Tell us what you are planning and which question you would like help with after reading this guide.'],
    seasonal: ['Plan your collection', 'Share your theme, selected products and target arrival date so we can discuss a suitable assortment.'],
    supplier: ['Discuss your requirements', 'Tell us what you need to confirm about supply, packaging, quality or documentation for your project.'],
    general: ['Tell us what you need', 'Looking for prices, samples, a custom design or help choosing? Start with what matters to you.']
  };
  const tidy = (s, n = 180) => String(s || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
  const params = new URLSearchParams(location.search);
  const path = location.pathname;
  const isContactPage = /\/(?:request-quote\/|quote(?:\.html|\/)|contact(?:\.html|\/))$/.test(path);
  const pageTitle = tidy(params.get('entry_title') || (isContactPage ? 'craft supplies' : document.querySelector('h1')?.textContent) || config.brand);
  const canonicalPath = (() => {
    try { return new URL(document.querySelector('link[rel="canonical"]')?.href || location.href).pathname; }
    catch { return path; }
  })();
  const publicPage = config.origin + canonicalPath;
  const isProductPage = [...document.querySelectorAll('script[type="application/ld+json"]')].some(script => {
    try {
      const data = JSON.parse(script.textContent);
      const nodes = Array.isArray(data) ? data : (data['@graph'] || [data]);
      return nodes.some(node => [].concat(node['@type'] || []).includes('Product'));
    } catch { return false; }
  });
  const infer = (pathname, sku) => {
    if (sku || /\/p-[^/]+\.html$/.test(pathname) || document.body.dataset.page === 'product-detail' || isProductPage) return 'product';
    if (/guide-|\/blog\//.test(pathname)) return 'guide';
    if (/custom|private-label/.test(pathname)) return 'custom';
    if (/seasonal|halloween|christmas|\/themes\//.test(pathname)) return 'seasonal';
    if (/factory|manufactur|quality|about|certificat/.test(pathname)) return 'supplier';
    if (/products|charms|beads|sprinkles|sequins/.test(pathname)) return 'category';
    return 'general';
  };
  function contextFor(link) {
    let target;
    try { target = new URL(link.href, location.href); } catch { return null; }
    const scope = link.closest('.product-card, .product-card-v2, [data-product-card], .pdp-cta, .product-detail, .detail-grid');
    const productLink = scope?.querySelector('a[href*="sku="], a[href*="product_code="]');
    const productParams = productLink ? new URL(productLink.href, location.href).searchParams : target.searchParams;
    const sku = tidy(productParams.get('sku') || productParams.get('product_code') || scope?.querySelector('[data-sku]')?.dataset.sku, 100);
    const kind = infer(path, sku);
    return { target, sku, kind, title: tidy(productParams.get('product') || scope?.querySelector('h3')?.textContent || pageTitle) };
  }
  function decorate(link) {
    if (!link || link.dataset.inquiryDirect || link.getAttribute('href')?.startsWith('#')) return;
    const ctx = contextFor(link);
    if (!ctx) return;
    const { target, sku, kind, title } = ctx;
    const quoteLink = target.origin === location.origin && /\/(?:request-quote\/|quote(?:\.html|\/))$/.test(target.pathname);
    if (quoteLink) {
      if (!target.searchParams.has('entry_context')) target.searchParams.set('entry_context', kind);
      if (!target.searchParams.has('entry_page')) target.searchParams.set('entry_page', canonicalPath);
      if (!target.searchParams.has('entry_title')) target.searchParams.set('entry_title', title);
      link.href = target.href;
      if (link.closest('main') && /^(?:Get Quote|Request Quote|Send Inquiry|Request a Quote|Request a B2B Quote)(?:\s*[→›])?$/i.test(link.textContent.trim())) {
        const isProductCard = link.closest('.product-card, .product-card-v2, [data-product-card]');
        link.textContent = isProductCard ? 'Ask us' : kind === 'product' ? 'Ask about this product' : copy[kind][0];
        link.setAttribute('aria-label', isProductCard ? `Ask us about ${sku || title}` : copy[kind][0]);
        link.style.whiteSpace = 'normal';
        link.style.overflowWrap = 'anywhere';
        link.style.textAlign = 'center';
        link.style.height = 'auto';
      }
    }
    if (target.hostname === 'wa.me' || target.hostname === 'api.whatsapp.com') {
      // Keep existing product-specific messages; improve generic site-wide openers only.
      const old = target.searchParams.get('text') || '';
      if (!old || /just viewed your craft supply collection|visiting the .* page/.test(old) || sku) {
        target.searchParams.set('text', `Hello ${config.brand}, I am interested in ${sku ? sku + ' — ' : ''}${title}.\n${publicPage}\nI would like help with pricing, samples or customization. My main question is: `);
        link.href = target.href;
      }
    }
    if (target.protocol === 'mailto:' && !target.searchParams.has('body')) {
      target.searchParams.set('subject', `${config.brand} inquiry — ${title}`);
      target.searchParams.set('body', `Hello ${config.brand},\n\nI am interested in: ${sku ? sku + ' — ' : ''}${title}\nPage: ${publicPage}\n\nI would like help with: pricing / samples / customization / product selection\nApproximate quantity and unit (if known):\nDestination country:\nMy main question:\nPreferred reply method: Email / WhatsApp\n`);
      link.href = target.href;
    }
  }
  function init() {
    document.querySelectorAll('a[href]').forEach(decorate);
    // Also covers search results and product cards inserted after page load.
    document.addEventListener('click', event => decorate(event.target.closest?.('a[href]')), true);
    // Keep newly rendered search cards and navigation consistent before a click.
    new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches('a[href]')) decorate(node);
        node.querySelectorAll('a[href]').forEach(decorate);
      }
    }).observe(document.body, { childList: true, subtree: true });
    const forms = [...document.querySelectorAll(config.formSelector)];
    if (forms.length && ownScript && !document.querySelector('[data-inquiry-style]')) {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = ownScript.src.replace(/\.js(?:\?.*)?$/, '.css?v=20260929-simple');
      document.head.appendChild(css);
    }
    forms.forEach(form => {
      const panel = form.querySelector('[data-inquiry-preferences]');
      if (!panel) return;
      const field = name => form.elements.namedItem(name);
      const goal = field('inquiry_goal') || { value: '' };
      const contactEmail = field('email');
      const channel = field('preferred_contact');
      const phone = field(config.phoneField);
      const message = field('message');
      const quantity = field('quantity');
      const kind = Object.hasOwn(copy, params.get('entry_context')) ? params.get('entry_context') : infer(path, params.get('sku') || params.get('product_code'));
      const intro = panel.querySelector('[data-inquiry-intro]');
      if (intro) intro.textContent = copy[kind][1];
      if (!goal.value && kind === 'custom') goal.value = 'Custom development';
      if (!goal.value && kind === 'guide') goal.value = 'Help choosing products';
      if (quantity?.tagName === 'SELECT' && !quantity.querySelector('option[value=""]')) {
        const option = new Option('Not sure yet', '', true, true);
        quantity.prepend(option);
        quantity.value = '';
      }
      const addHidden = (name, value) => {
        let el = field(name);
        if (!el) { el = document.createElement('input'); el.type = 'hidden'; el.name = name; form.appendChild(el); }
        el.value = value;
      };
      let entryPath = params.get('entry_page') || canonicalPath;
      if (!entryPath.startsWith('/') || entryPath.startsWith('//')) entryPath = canonicalPath;
      addHidden('entry_context', kind);
      addHidden('entry_page', config.origin + entryPath.split('?')[0].split('#')[0]);
      addHidden('entry_title', tidy(params.get('entry_title') || pageTitle));
      if (params.get('application') && !field('application')) addHidden('application', tidy(params.get('application')));
      const wa = form.querySelector('[data-inquiry-whatsapp]');
      const email = form.querySelector('[data-inquiry-email]');
      function update() {
        const selected = goals[goal.value];
        const help = panel.querySelector('[data-inquiry-help]');
        if (help) help.textContent = selected ? selected[1] : 'Share what you know. Approximate quantities and early-stage ideas are welcome.';
        if (message) message.placeholder = 'Ask about prices, samples or customization. Share whatever you know.';
        const wantsWhatsApp = channel.value === 'WhatsApp';
        if (contactEmail) {
          contactEmail.required = !wantsWhatsApp;
          contactEmail.disabled = wantsWhatsApp;
          const label = contactEmail.closest('[data-contact-field]');
          if (label) label.hidden = wantsWhatsApp;
        }
        if (phone) {
          phone.required = wantsWhatsApp;
          phone.disabled = !wantsWhatsApp;
          const label = phone.closest('[data-contact-field]');
          if (label) label.hidden = !wantsWhatsApp;
          const requirement = phone.closest('label')?.querySelector('[data-phone-requirement]');
          if (requirement) requirement.textContent = phone.required ? '(required for WhatsApp)' : '(optional)';
          phone.setAttribute('aria-label', phone.required ? 'WhatsApp number with country code (required for WhatsApp replies)' : 'WhatsApp number (optional)');
          phone.placeholder = '+ Country code and number';
          const validPhone = /^\+[\d\s().-]+$/.test(phone.value.trim()) && /^[0-9]{7,15}$/.test(phone.value.replace(/\D/g, ''));
          phone.setCustomValidity(phone.required && phone.value.trim() && !validPhone ? 'Include + and your country code, followed by your WhatsApp number.' : '');
          const details = phone.closest('details');
          if (phone.required && details) details.open = true;
        }
        const subject = field('_subject');
        if (subject) subject.value = `${config.brand} — ${goal.value || 'General inquiry'} — Reply via ${channel.value}`;
        const selectedProduct = tidy(field('sku')?.value || field('selected_sku')?.value || params.get('sku') || params.get('product_code') || params.get('product') || params.get('entry_title') || pageTitle);
        const text = `Hello ${config.brand},\nI would like to discuss: ${(goal.value || 'pricing, samples or choosing products').toLowerCase()}.\nProduct / topic: ${selectedProduct}\nPage: ${field('entry_page').value}\nMy main question is: `;
        if (wa) wa.href = `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(text)}`;
        if (email) email.href = `mailto:${config.email}?subject=${encodeURIComponent(config.brand + ' — ' + (goal.value || 'Product inquiry'))}&body=${encodeURIComponent(text)}`;
      }
      form.addEventListener('change', update);
      phone?.addEventListener('input', update);
      form.addEventListener('reset', () => setTimeout(update, 0));
      form.addEventListener('submit', update, true);
      update();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
}());

(() => {
  const form = document.querySelector('[data-quote-form]');
  if (!form) return;

  const config = window.HAIBU_QUOTE_CONFIG || {};
  const liveMode = config.mode === 'live' && config.endpoint === '/api/inquiry';
  const params = new URLSearchParams(window.location.search);
  const value = (key, fallback = '') => params.get(key) || fallback;
  const setValue = (name, nextValue) => {
    const field = form.elements.namedItem(name);
    if (field && 'value' in field) {
      const normalizedValue = nextValue || '';
      field.value = normalizedValue;
      if ('defaultValue' in field) field.defaultValue = normalizedValue;
    }
  };

  const contextSource = value('source', 'direct');
  const category = value('category');
  const productCode = value('product_code', value('sku'));
  const productName = value('product');
  const productImage = value('image');
  const contextPage = value('landing_page', '/v2-preview/');
  const storedAttribution = window.HAIBU_ATTRIBUTION && typeof window.HAIBU_ATTRIBUTION === 'object'
    ? window.HAIBU_ATTRIBUTION
    : {};
  const inferredLandingPage =
    storedAttribution.first_landing_page === window.location.pathname &&
    contextPage && contextPage !== window.location.pathname
      ? contextPage
      : (storedAttribution.first_landing_page || contextPage || window.location.pathname);
  const inquiryAttribution = {
    attribution_channel: storedAttribution.attribution_channel || 'Direct',
    attribution_source: storedAttribution.attribution_source || 'direct',
    attribution_medium: storedAttribution.attribution_medium || 'none',
    attribution_campaign: storedAttribution.attribution_campaign || '',
    attribution_content: storedAttribution.attribution_content || '',
    attribution_term: storedAttribution.attribution_term || '',
    first_landing_page: inferredLandingPage,
    first_referrer: storedAttribution.first_referrer || 'Not provided',
    first_visit_at: storedAttribution.first_visit_at || new Date().toISOString(),
    lead_context: contextSource,
    source_page: value('source_page', contextPage),
    product_page: value('product_page', productCode ? contextPage : ''),
    collection: value('collection'),
    article: value('article'),
    product_image: productImage,
    inquiry_page: window.location.pathname
  };
  const landingPage = inquiryAttribution.first_landing_page;

  const ensureHiddenField = (name, id) => {
    let field = document.getElementById(id);
    if (!field) {
      field = document.createElement('input');
      field.type = 'hidden';
      field.name = name;
      field.id = id;
      form.appendChild(field);
    }
    return field;
  };
  ensureHiddenField('attribution_channel', 'channelField');
  ensureHiddenField('attribution_medium', 'mediumField');
  ensureHiddenField('attribution_campaign', 'campaignField');
  ensureHiddenField('attribution_content', 'contentField');
  ensureHiddenField('attribution_term', 'termField');
  ensureHiddenField('first_visit_at', 'firstVisitField');
  ensureHiddenField('lead_context', 'leadContextField');
  ensureHiddenField('source_page', 'sourcePageField');
  ensureHiddenField('product_page', 'productPageField');
  ensureHiddenField('collection', 'collectionField');
  if (!form.elements.namedItem('target_delivery_date')) {
    const quantityField = form.elements.namedItem('quantity');
    const quantityLabel = quantityField?.closest('label');
    const deliveryLabel = document.createElement('label');
    deliveryLabel.innerHTML = 'Target Arrival Date <span class="field-optional">(optional)</span><input name="target_delivery_date" type="date">';
    quantityLabel?.insertAdjacentElement('afterend', deliveryLabel);
  }

  const applyQuotePrefill = () => {
    Object.entries(inquiryAttribution).forEach(([name, nextValue]) => setValue(name, nextValue));
    setValue('sku', productCode);
    setValue('product', productName);
    if (form.dataset) {
      form.dataset.attributionPayload = JSON.stringify(inquiryAttribution);
      form.dataset.attributionReady = 'true';
    }
  };

  applyQuotePrefill();
  window.addEventListener('load', applyQuotePrefill, { once: true });
  window.addEventListener('pageshow', applyQuotePrefill);
  window.setTimeout(applyQuotePrefill, 250);

  const categoryField = document.getElementById('categoryField');
  if (categoryField && category && [...categoryField.options].some((option) => option.value === category)) {
    categoryField.value = category;
  }

  const quoteContext = document.getElementById('quoteContext');
  const selectedProduct = document.getElementById('selectedProduct');
  if (quoteContext && selectedProduct && (productCode || productName)) {
    selectedProduct.textContent = [productCode, productName].filter(Boolean).join(' — ');
    quoteContext.hidden = false;
  }

  const upload = form.querySelector('input[type="file"][name="reference_images"]');
  const honeypot = form.elements.namedItem('_company_fax');
  if (honeypot instanceof HTMLInputElement) {
    honeypot.value = '';
    honeypot.autocomplete = 'new-password';
    honeypot.readOnly = true;
  }
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.textContent = liveMode ? 'Send Quote Request' : 'Validate Quote Request';
  const idleSubmitText = submitButton?.textContent || 'Send Quote Request';
  if (upload && liveMode && config.enableReferenceUploads === true) upload.disabled = false;

  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return btoa(binary);
  };

  const fileToAttachment = async (file) => ({
    filename: file.name,
    contentType: file.type,
    content: arrayBufferToBase64(await file.arrayBuffer())
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = document.getElementById('formStatus');
    if (!form.reportValidity()) return;

    if (!liveMode) {
      if (status) status.textContent = 'Validation passed — inquiry sending remains disabled in this release candidate.';
      return;
    }

    const selectedFiles = upload ? [...upload.files] : [];
    const maxFiles = Number(config.maxReferenceImages || 4);
    if (selectedFiles.length > maxFiles) {
      if (status) status.textContent = `Please attach no more than ${maxFiles} reference images.`;
      return;
    }
    if (selectedFiles.some((file) => file.size > 800000)) {
      if (status) status.textContent = 'Each reference image must be 800 KB or smaller.';
      return;
    }
    if (selectedFiles.reduce((sum, file) => sum + file.size, 0) > 2800000) {
      if (status) status.textContent = 'Reference images must total 2.8 MB or less.';
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending…';
    }
    form.setAttribute('aria-busy', 'true');
    if (status) status.textContent = 'Sending inquiry…';

    try {
      const formData = new FormData(form);
      const fields = {};
      for (const [key, entryValue] of formData.entries()) {
        if (key === 'reference_images' || key === '_company_fax' || typeof entryValue !== 'string') continue;
        fields[key] = entryValue;
      }
      Object.assign(fields, inquiryAttribution);
      const attachments = await Promise.all(selectedFiles.map(fileToAttachment));
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          fields,
          attachments,
          _company_fax: String(formData.get('_company_fax') || '')
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok !== true) throw new Error(payload.message || 'Inquiry could not be sent.');
      if (typeof window.HAIBU_TRACK === 'function') {
        window.HAIBU_TRACK('inquiry_submitted', {
          source: String(fields.attribution_source || inquiryAttribution.attribution_source).slice(0, 80),
          channel: String(fields.attribution_channel || inquiryAttribution.attribution_channel).slice(0, 80),
          context: String(fields.lead_context || contextSource).slice(0, 80),
          category: String(fields.category || category || 'unspecified').slice(0, 80),
          landing_page: String(fields.first_landing_page || landingPage).slice(0, 180),
          has_product_code: Boolean(fields.sku || productCode)
        });
      }
      form.reset();
      if (status) {
        const reference = typeof payload.requestId === 'string' ? payload.requestId.slice(0, 8) : '';
        status.textContent = `Inquiry sent successfully. Our sales team will review the submitted requirements.${reference ? ` Reference: ${reference}.` : ''}`;
      }
    } catch (error) {
      if (status) status.textContent = error instanceof Error ? error.message : 'Inquiry could not be sent.';
    } finally {
      form.removeAttribute('aria-busy');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = idleSubmitText;
      }
    }
  });
})();

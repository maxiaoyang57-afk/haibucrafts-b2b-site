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
  const contextPage = value('landing_page', '/');
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
  if (typeof window.addEventListener === 'function') {
    window.addEventListener('load', applyQuotePrefill, { once: true });
    window.addEventListener('pageshow', applyQuotePrefill);
  }
  if (typeof window.setTimeout === 'function') window.setTimeout(applyQuotePrefill, 250);

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
  const uploadStatus = document.getElementById('referenceImageStatus');
  const uploadPreviews = document.getElementById('referenceImagePreviews');
  const maxReferenceImages = Number(config.maxReferenceImages || 4);
  const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const targetImageBytes = 650000;
  const maxTotalImageBytes = 2800000;
  let preparedReferenceImages = [];
  let preparedFilesSignature = '';
  let previewUrls = [];
  const honeypot = form.elements.namedItem('_company_fax');
  if (honeypot instanceof HTMLInputElement) {
    honeypot.value = '';
    honeypot.autocomplete = 'new-password';
    honeypot.readOnly = true;
  }
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) submitButton.textContent = liveMode ? 'Send Quote Request' : 'Validate Quote Request';
  const idleSubmitText = submitButton?.textContent || 'Send Quote Request';
  if (upload) upload.disabled = config.enableReferenceUploads !== true;

  const filesSignature = (files) => files
    .map((file) => [file.name, file.type, file.size, file.lastModified].join(':'))
    .join('|');

  const setUploadStatus = (message, state = '') => {
    if (!uploadStatus) return;
    uploadStatus.textContent = message;
    if (state) uploadStatus.dataset.state = state;
    else delete uploadStatus.dataset.state;
  };

  const clearImagePreviews = () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    previewUrls = [];
    if (!uploadPreviews) return;
    uploadPreviews.replaceChildren();
    uploadPreviews.hidden = true;
  };

  const formatFileSize = (bytes) => bytes < 1000000
    ? `${Math.max(1, Math.round(bytes / 1000))} KB`
    : `${(bytes / 1000000).toFixed(1)} MB`;

  const renderImagePreviews = (images) => {
    clearImagePreviews();
    if (!uploadPreviews || !images.length) return;
    images.forEach((image, index) => {
      const figure = document.createElement('figure');
      const preview = document.createElement('img');
      const caption = document.createElement('figcaption');
      const url = URL.createObjectURL(image.blob);
      previewUrls.push(url);
      preview.src = url;
      preview.alt = `Reference image ${index + 1}: ${image.filename}`;
      caption.textContent = `${image.filename} · ${formatFileSize(image.blob.size)}`;
      figure.append(preview, caption);
      uploadPreviews.appendChild(figure);
    });
    uploadPreviews.hidden = false;
  };

  const canvasToBlob = (canvas, type, quality) => new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('One reference image could not be optimized.'));
    }, type, quality);
  });

  const loadImageSource = async (file) => {
    if (typeof createImageBitmap === 'function') return createImageBitmap(file);
    const objectUrl = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.decoding = 'async';
      image.src = objectUrl;
      await image.decode();
      return image;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const optimizeReferenceImage = async (file) => {
    if (!allowedImageTypes.has(file.type)) {
      throw new Error('Reference images must be JPG, PNG or WebP files.');
    }
    if (file.size <= targetImageBytes) {
      return { blob: file, filename: file.name, contentType: file.type };
    }

    const image = await loadImageSource(file);
    const sourceWidth = image.width || image.naturalWidth;
    const sourceHeight = image.height || image.naturalHeight;
    if (!sourceWidth || !sourceHeight) throw new Error(`Could not read ${file.name}.`);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image optimization is unavailable in this browser.');

    const attempts = [
      { maxDimension: 1600, quality: 0.82 },
      { maxDimension: 1400, quality: 0.76 },
      { maxDimension: 1200, quality: 0.70 },
      { maxDimension: 1000, quality: 0.64 }
    ];
    let optimized;
    for (const attempt of attempts) {
      const scale = Math.min(1, attempt.maxDimension / Math.max(sourceWidth, sourceHeight));
      canvas.width = Math.max(1, Math.round(sourceWidth * scale));
      canvas.height = Math.max(1, Math.round(sourceHeight * scale));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      optimized = await canvasToBlob(canvas, 'image/webp', attempt.quality);
      if (optimized.size <= targetImageBytes) break;
    }
    if (typeof image.close === 'function') image.close();
    if (!optimized || optimized.size > 800000) {
      throw new Error(`${file.name} is still too large after optimization. Please choose a smaller image.`);
    }
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'reference-image';
    return { blob: optimized, filename: `${baseName}.webp`, contentType: 'image/webp' };
  };

  const prepareReferenceImages = async () => {
    const files = upload ? [...upload.files] : [];
    const signature = filesSignature(files);
    if (signature === preparedFilesSignature) return preparedReferenceImages;
    if (files.length > maxReferenceImages) {
      throw new Error(`Please attach no more than ${maxReferenceImages} reference images.`);
    }
    if (!files.length) {
      preparedReferenceImages = [];
      preparedFilesSignature = '';
      clearImagePreviews();
      setUploadStatus('');
      return preparedReferenceImages;
    }

    setUploadStatus('Optimizing selected images…', 'working');
    const prepared = [];
    for (const file of files) prepared.push(await optimizeReferenceImage(file));
    const totalBytes = prepared.reduce((sum, image) => sum + image.blob.size, 0);
    if (totalBytes > maxTotalImageBytes) {
      throw new Error('Reference images are still too large together. Please remove one image.');
    }
    preparedReferenceImages = prepared;
    preparedFilesSignature = signature;
    renderImagePreviews(prepared);
    setUploadStatus(`${prepared.length} image${prepared.length === 1 ? '' : 's'} ready · ${formatFileSize(totalBytes)} after optimization.`, 'ready');
    return preparedReferenceImages;
  };

  if (upload) {
    upload.addEventListener('change', async () => {
      preparedFilesSignature = '';
      preparedReferenceImages = [];
      try {
        await prepareReferenceImages();
      } catch (error) {
        clearImagePreviews();
        setUploadStatus(error instanceof Error ? error.message : 'Reference images could not be prepared.', 'error');
      }
    });
  }

  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return btoa(binary);
  };

  const fileToAttachment = async (image) => ({
    filename: image.filename,
    contentType: image.contentType,
    content: arrayBufferToBase64(await image.blob.arrayBuffer())
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = document.getElementById('formStatus');
    if (!form.reportValidity()) return;

    if (!liveMode) {
      if (status) status.textContent = 'Validation passed — inquiry sending remains disabled in this release candidate.';
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
      const optimizedImages = await prepareReferenceImages();
      const attachments = await Promise.all(optimizedImages.map(fileToAttachment));
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
      preparedReferenceImages = [];
      preparedFilesSignature = '';
      clearImagePreviews();
      setUploadStatus('');
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

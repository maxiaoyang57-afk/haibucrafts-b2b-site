(() => {
  const form = document.querySelector('[data-quote-form]');
  if (!form) return;

  const config = window.HAIBU_QUOTE_CONFIG || {};
  const liveMode = config.mode === 'live' && config.endpoint === '/api/inquiry';
  const params = new URLSearchParams(window.location.search);
  const value = (key, fallback = '') => params.get(key) || fallback;
  const setValue = (id, nextValue) => {
    const field = document.getElementById(id);
    if (field) field.value = nextValue || '';
  };

  const source = value('source', 'direct');
  const category = value('category');
  const productCode = value('product_code', value('sku'));
  const productName = value('product');
  const productImage = value('image');
  const landingPage = value('landing_page', document.referrer || '/v2-preview/');

  setValue('sourceField', source);
  setValue('landingField', landingPage);
  setValue('articleField', value('article'));
  setValue('productField', productCode);
  setValue('productNameField', productName);
  setValue('imageField', productImage);
  setValue('referrerField', document.referrer || '');
  setValue('inquiryPageField', window.location.pathname);

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
  if (upload && liveMode && config.enableReferenceUploads === true) upload.disabled = false;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = document.getElementById('formStatus');
    const submitButton = form.querySelector('button[type="submit"]');
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

    if (submitButton) submitButton.disabled = true;
    if (status) status.textContent = 'Sending inquiry…';

    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.ok === false) throw new Error(payload.error || 'Inquiry could not be sent.');
      form.reset();
      if (status) status.textContent = 'Inquiry sent successfully. Our sales team will review the submitted requirements.';
    } catch (error) {
      if (status) status.textContent = error instanceof Error ? error.message : 'Inquiry could not be sent.';
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
})();

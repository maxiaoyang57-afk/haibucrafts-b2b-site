(() => {
  const form = document.querySelector('[data-quote-form]');
  if (!form) return;

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

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const status = document.getElementById('formStatus');
    if (!form.reportValidity()) return;
    if (status) status.textContent = 'Preview validation passed — no inquiry was sent.';
  });
})();

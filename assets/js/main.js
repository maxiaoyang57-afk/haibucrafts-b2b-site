document.querySelectorAll('.menu-btn').forEach(btn=>btn.addEventListener('click',()=>document.body.classList.toggle('mobile-open')));document.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');const v=btn.dataset.filter.toLowerCase();document.querySelectorAll('[data-product-card]').forEach(c=>{const t=(c.dataset.tags||'').toLowerCase();c.classList.toggle('hidden',v!=='all'&&!t.includes(v));});}));document.querySelectorAll('[data-search-products]').forEach(input=>input.addEventListener('input',()=>{const q=input.value.trim().toLowerCase();document.querySelectorAll('[data-product-card]').forEach(c=>{const h=(c.textContent+' '+(c.dataset.tags||'')).toLowerCase();c.classList.toggle('hidden',q&&!h.includes(q));});}));

let inquiryUploadModule;

const getInquiryUploader = async () => {
  if (!inquiryUploadModule) inquiryUploadModule = import('/assets/js/inquiry-upload.js');
  return inquiryUploadModule;
};

const getSubmitStatus = form => {
  let status = form.querySelector('[data-form-submit-status]');
  if (!status) {
    status = document.createElement('p');
    status.className = 'form-submit-status';
    status.dataset.formSubmitStatus = '';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    form.append(status);
  }
  return status;
};

document.querySelectorAll('.quote-form').forEach(form => {
  const honeypot = document.createElement('input');
  honeypot.type = 'text';
  honeypot.name = 'fax_number';
  honeypot.tabIndex = -1;
  honeypot.autocomplete = 'off';
  honeypot.className = 'form-honeypot';
  honeypot.setAttribute('aria-hidden', 'true');
  form.append(honeypot);
  form.dataset.startedAt = String(Date.now());

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (form.dataset.submitting === 'true') return;
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const value = name => String(data.get(name) || '').trim();
    const product = value('product') || value('product_display') || 'General Wholesale Inquiry';
    const sku = value('sku') || value('sku_display');
    const selectedImages = Array.isArray(form._referenceImages) ? form._referenceImages.slice() : [];
    form.querySelectorAll('input[type="file"]').forEach(input => {
      Array.from(input.files || []).forEach(file => {
        if (!selectedImages.some(existing => existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified)) selectedImages.push(file);
      });
    });
    const status = getSubmitStatus(form);
    const uploadStatus = form.querySelector('[data-upload-status]');
    const submitButton = form.querySelector('button:not([type]), button[type="submit"], input[type="submit"]');
    const originalButtonText = submitButton?.innerHTML;

    const fields = {
      name: value('name'),
      company: value('company'),
      email: value('email'),
      country: value('country'),
      phone: value('phone'),
      website: value('website'),
      product,
      sku,
      category: value('category'),
      quantity: value('quantity'),
      intended_use: value('intended_use'),
      target_delivery_date: value('target_delivery_date'),
      customization: value('customization'),
      custom_theme: value('custom_theme'),
      preferred_colors: value('preferred_colors'),
      dimensions: value('dimensions'),
      packaging: value('packaging'),
      product_note: value('product_note'),
      specification: value('specification'),
      message: value('message')
    };

    form.dataset.submitting = 'true';
    form.classList.remove('form-submit-success', 'form-submit-error');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
      submitButton.textContent = selectedImages.length ? 'Uploading images…' : 'Sending inquiry…';
    }
    status.textContent = selectedImages.length
      ? `Uploading ${selectedImages.length} reference file${selectedImages.length === 1 ? '' : 's'} securely…`
      : 'Sending your inquiry securely…';

    try {
      let images = [];
      if (selectedImages.length) {
        const { uploadInquiryFiles } = await getInquiryUploader();
        images = await uploadInquiryFiles(selectedImages, ({ current, total, percentage }) => {
          const message = `Uploading file ${current} of ${total}${Number.isFinite(percentage) ? ` · ${Math.round(percentage)}%` : ''}`;
          status.textContent = message;
          if (uploadStatus) uploadStatus.textContent = message;
        });
      }

      if (submitButton) submitButton.textContent = 'Sending inquiry…';
      status.textContent = 'Sending your inquiry to our sales team…';
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          fields,
          files: images,
          sourceUrl: window.location.href,
          startedAt: Number(form.dataset.startedAt || Date.now()),
          fax_number: value('fax_number')
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || 'Submission failed');

      form.classList.add('form-submit-success');
      status.textContent = 'Thank you. Your quote request has been sent successfully. Our sales team will reply within 24 hours.';
      if (uploadStatus && selectedImages.length) uploadStatus.textContent = `${selectedImages.length} reference file${selectedImages.length === 1 ? '' : 's'} uploaded and attached as secure links.`;
    } catch (error) {
      console.error('Inquiry submission failed', error);
      form.classList.add('form-submit-error');
      status.innerHTML = 'We could not send the form right now. Please email <a href="mailto:sale008@sola-craft.com">sale008@sola-craft.com</a> or contact us on WhatsApp.';
      if (uploadStatus && selectedImages.length) uploadStatus.textContent = 'Upload or submission failed. Your selected images remain on this page so you can try again.';
    } finally {
      form.dataset.submitting = 'false';
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
        if (originalButtonText) submitButton.innerHTML = originalButtonText;
      }
    }
  });
});
document.querySelectorAll('.products-trigger').forEach(trigger => {
  trigger.addEventListener('click', event => {
    event.stopPropagation();
    const parent = trigger.closest('.nav-dropdown');
    const isOpen = parent.classList.toggle('open');
    trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
});

document.addEventListener('click', event => {
  document.querySelectorAll('.nav-dropdown.open').forEach(dropdown => {
    if (!dropdown.contains(event.target)) {
      dropdown.classList.remove('open');
      const trigger = dropdown.querySelector('.products-trigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    }
  });
});

document.querySelectorAll('.dropdown-menu a').forEach(link => {
  link.addEventListener('click', () => {
    const dropdown = link.closest('.nav-dropdown');
    if (dropdown) dropdown.classList.remove('open');
  });
});

document.querySelectorAll('.dark-faq-question').forEach(button => {
  button.addEventListener('click', () => {
    const item = button.closest('.dark-faq-item');
    const isOpen = item.classList.toggle('open');
    button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
});

(function(){
  const showcase = document.getElementById('heroShowcase');
  if(!showcase) return;
  const cards = Array.from(showcase.querySelectorAll('.hero-showcase-card'));
  const dots = Array.from(showcase.querySelectorAll('.hero-showcase-dots span'));
  const link = document.getElementById('heroShowcaseLink');
  let active = 0;
  let autoTimer = null;

  function setActive(index){
    active = Math.max(0, Math.min(cards.length - 1, index));
    cards.forEach((card, i) => card.classList.toggle('active', i === active));
    dots.forEach((dot, i) => dot.classList.toggle('active', i === active));
    const href = cards[active].dataset.link;
    if (href) link.setAttribute('href', href);
  }

  function startAuto(){
    stopAuto();
    autoTimer = setInterval(() => setActive((active + 1) % cards.length), 1800);
  }
  function stopAuto(){
    if(autoTimer){ clearInterval(autoTimer); autoTimer = null; }
  }

  showcase.addEventListener('mousemove', e => {
    const rect = showcase.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const segment = rect.width / cards.length;
    const index = Math.min(cards.length - 1, Math.max(0, Math.floor(x / segment)));
    setActive(index);
  });
  showcase.addEventListener('mouseenter', stopAuto);
  showcase.addEventListener('mouseleave', startAuto);

  setActive(0);
  startAuto();
})();

// Pause the decorative homepage video when it is outside the viewport.
(() => {
  const video = document.querySelector('.hero-bg-video');
  if (!video || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      const playAttempt = video.play();
      if (playAttempt && typeof playAttempt.catch === 'function') playAttempt.catch(() => {});
    } else {
      video.pause();
    }
  }, { threshold: 0.05 });
  observer.observe(video);
})();


/* Product-card quote routing, premium summary and inquiry-form prefill */
(() => {
  const form = document.getElementById('main-inquiry-form');
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const product = (params.get('product') || '').trim();
  const sku = (params.get('sku') || '').trim();
  const categoryParam = (params.get('category') || '').trim();
  const imageParam = (params.get('image') || '').trim();
  const productLabel = product || 'General Wholesale Inquiry';

  const inferCategory = () => {
    const source = `${product} ${sku} ${categoryParam}`.toLowerCase();
    const allowedCategories = [
      'Slime Charms Wholesale',
      'Polymer Clay Slices Wholesale',
      'Resin Charms for Slime',
      'Sequins & Glitter Confetti'
    ];
    if (allowedCategories.includes(categoryParam)) return categoryParam;
    if (/polymer|clay|\bhc\d/i.test(source)) return 'Polymer Clay Slices Wholesale';
    if (/sequin|glitter|confetti|sgc/i.test(source)) return 'Sequins & Glitter Confetti';
    if (/resin|rsc/i.test(source)) return 'Resin Charms for Slime';
    if (/slime charm|pvc charm|\bsc\d/i.test(source)) return 'Slime Charms Wholesale';
    return 'Not Sure / Need Recommendation';
  };
  const category = inferCategory();

  const defaultImages = {
    'Polymer Clay Slices Wholesale': '../assets/images/homecards/homecard-4-peach-slices.webp',
    'Slime Charms Wholesale': '../assets/images/homecards/homecard-8-space-charms.webp',
    'Resin Charms for Slime': '../assets/images/homecards/homecard-2-strawberry-resin.webp',
    'Sequins & Glitter Confetti': '../assets/images/homecards/homecard-1-mermaid-sequins.webp',
    'Not Sure / Need Recommendation': '../assets/images/homecards/homecard-7-strawberry-supplies.webp'
  };
  let imageSrc = defaultImages[category] || defaultImages['Not Sure / Need Recommendation'];
  if (imageParam) {
    if (/^https?:\/\//i.test(imageParam) || imageParam.startsWith('../') || imageParam.startsWith('/')) imageSrc = imageParam;
    else imageSrc = `../${imageParam.replace(/^\.\//,'')}`;
  }

  const hiddenProduct = form.querySelector('input[name="product"]');
  const hiddenSku = form.querySelector('input[name="sku"]');
  const productDisplay = form.querySelector('[data-selected-product-input]');
  const skuDisplay = form.querySelector('[data-selected-sku-input]');
  const categorySelect = form.querySelector('[data-category-select]');
  const summaryProduct = document.querySelector('[data-summary-product]');
  const summarySku = document.querySelector('[data-summary-sku]');
  const summaryCategory = document.querySelector('[data-summary-category]');
  const summaryImage = document.querySelector('[data-summary-image]');

  if (hiddenProduct) hiddenProduct.value = productLabel;
  if (hiddenSku) hiddenSku.value = sku;
  if (productDisplay) productDisplay.value = productLabel;
  if (skuDisplay) skuDisplay.value = sku;
  if (categorySelect) categorySelect.value = category;
  if (summaryProduct) summaryProduct.textContent = productLabel;
  if (summarySku) summarySku.textContent = sku || 'Not specified';
  if (summaryCategory) summaryCategory.textContent = category;
  if (summaryImage) {
    summaryImage.src = imageSrc;
    summaryImage.alt = `${productLabel} wholesale product reference`;
    summaryImage.addEventListener('error', () => {
      summaryImage.src = defaultImages[category] || defaultImages['Not Sure / Need Recommendation'];
    }, { once: true });
  }

  const quantitySummary = document.querySelector('[data-summary-quantity]');
  form.querySelectorAll('input[name="quantity"]').forEach(input => {
    input.addEventListener('change', () => {
      if (input.checked && quantitySummary) quantitySummary.textContent = input.value;
    });
  });
  if (categorySelect) {
    categorySelect.addEventListener('change', () => {
      if (summaryCategory) summaryCategory.textContent = categorySelect.value || 'Not specified';
    });
  }

  const customPanel = form.querySelector('[data-custom-detail-panel]');
  const updateCustomPanel = () => {
    const selected = form.querySelector('input[name="customization"]:checked');
    if (!customPanel || !selected) return;
    customPanel.hidden = selected.value === 'Standard Wholesale Products';
  };
  form.querySelectorAll('input[name="customization"]').forEach(input => input.addEventListener('change', updateCustomPanel));
  updateCustomPanel();

  if (window.location.hash === '#main-inquiry-form') {
    window.setTimeout(() => {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
      form.focus({ preventScroll: true });
      form.classList.add('quote-form-arrival');
      window.setTimeout(() => form.classList.remove('quote-form-arrival'), 1800);
    }, 120);
  }
})();


/* V25 multiple reference-image input: choose, drag/drop, clipboard paste and mobile camera */
(() => {
  const MAX_FILES = 10;
  const MAX_SIZE = 10 * 1024 * 1024;
  const imageMimeFallback = /\.(jpe?g|png|webp|gif|heic|heif)$/i;

  document.querySelectorAll('[data-image-uploader]').forEach(composer => {
    const form = composer.closest('form');
    const input = composer.querySelector('[data-image-input]');
    const cameraInput = composer.querySelector('[data-camera-input]');
    const zone = composer.querySelector('[data-drop-zone]');
    const preview = composer.querySelector('[data-image-preview]');
    const status = composer.querySelector('[data-upload-status]');
    const count = composer.querySelector('[data-upload-count]');
    const pasteButton = composer.querySelector('[data-paste-image]');
    const textarea = composer.querySelector('textarea');
    let files = [];
    const objectUrls = new Map();

    const isImage = file => Boolean(file && ((file.type && file.type.startsWith('image/')) || imageMimeFallback.test(file.name || '')));
    const formatSize = bytes => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    const fileKey = file => `${file.name}-${file.size}-${file.lastModified}`;

    function setStatus(message, isError = false){
      if(!status) return;
      status.textContent = message || '';
      status.classList.toggle('is-error', Boolean(isError));
    }

    function syncInput(){
      if(!input) return;
      try{
        const transfer = new DataTransfer();
        files.forEach(file => transfer.items.add(file));
        input.files = transfer.files;
      }catch(error){
        // Local previews remain available in browsers that block FileList updates.
      }
      if(form) form._referenceImages = files.slice();
    }

    function render(){
      if(!preview) return;
      preview.innerHTML = '';
      files.forEach((file,index) => {
        const card = document.createElement('div');
        card.className = 'image-preview-card';
        const image = document.createElement('img');
        image.alt = `Reference image preview ${index + 1}`;
        let url = objectUrls.get(fileKey(file));
        if(!url){
          url = URL.createObjectURL(file);
          objectUrls.set(fileKey(file), url);
        }
        image.src = url;
        image.addEventListener('error',()=>{ image.removeAttribute('src'); image.alt='Image selected; preview unavailable in this browser'; });
        const info = document.createElement('div');
        info.className = 'image-preview-info';
        const name = document.createElement('strong');
        name.textContent = file.name || `image-${index+1}`;
        const size = document.createElement('span');
        size.textContent = formatSize(file.size);
        info.append(name,size);
        const remove = document.createElement('button');
        remove.className = 'image-remove-btn';
        remove.type = 'button';
        remove.setAttribute('aria-label',`Remove ${file.name || 'image'}`);
        remove.textContent = '×';
        remove.addEventListener('click',()=>removeFile(index));
        card.append(image,info,remove);
        preview.append(card);
      });
      if(count) count.textContent = `${files.length} / ${MAX_FILES} images`;
      syncInput();
    }

    function removeFile(index){
      const [removed] = files.splice(index,1);
      if(removed){
        const key=fileKey(removed);
        const url=objectUrls.get(key);
        if(url) URL.revokeObjectURL(url);
        objectUrls.delete(key);
      }
      render();
      setStatus(files.length ? `${files.length} image${files.length===1?'':'s'} ready.` : '');
    }

    function addFiles(incoming){
      const candidates = Array.from(incoming || []);
      if(!candidates.length) return;
      const existing = new Set(files.map(fileKey));
      const errors = [];
      for(const file of candidates){
        if(files.length >= MAX_FILES){ errors.push(`Maximum ${MAX_FILES} images.`); break; }
        if(!isImage(file)){ errors.push(`${file.name || 'File'} is not a supported image.`); continue; }
        if(file.size > MAX_SIZE){ errors.push(`${file.name} is larger than 10 MB.`); continue; }
        const key=fileKey(file);
        if(existing.has(key)) continue;
        existing.add(key);
        files.push(file);
      }
      render();
      if(errors.length) setStatus(errors.join(' '),true);
      else setStatus(`${files.length} image${files.length===1?'':'s'} ready. You can add more, paste, or remove previews.`);
    }

    input?.addEventListener('change',event=>addFiles(event.target.files));
    cameraInput?.addEventListener('change',event=>{ addFiles(event.target.files); event.target.value=''; });

    ['dragenter','dragover'].forEach(type=>zone?.addEventListener(type,event=>{
      event.preventDefault();
      event.stopPropagation();
      zone.classList.add('is-dragging');
    }));
    ['dragleave','drop'].forEach(type=>zone?.addEventListener(type,event=>{
      event.preventDefault();
      event.stopPropagation();
      zone.classList.remove('is-dragging');
      if(type==='drop') addFiles(event.dataTransfer?.files);
    }));

    composer.addEventListener('paste',event=>{
      const pasted = Array.from(event.clipboardData?.items || [])
        .filter(item=>item.kind==='file' && item.type.startsWith('image/'))
        .map(item=>item.getAsFile())
        .filter(Boolean);
      if(pasted.length){
        event.preventDefault();
        addFiles(pasted);
        setStatus(`${pasted.length} pasted image${pasted.length===1?'':'s'} added.`);
      }
    });

    pasteButton?.addEventListener('click',async()=>{
      if(navigator.clipboard?.read){
        try{
          const clipboardItems=await navigator.clipboard.read();
          const pasted=[];
          for(const item of clipboardItems){
            for(const type of item.types){
              if(type.startsWith('image/')) pasted.push(await item.getType(type));
            }
          }
          if(pasted.length){ addFiles(pasted); setStatus(`${pasted.length} clipboard image${pasted.length===1?'':'s'} added.`); return; }
        }catch(error){ /* Use keyboard paste guidance below. */ }
      }
      textarea?.focus();
      setStatus('Press Ctrl+V on Windows or Command+V on Mac to paste an image from your clipboard.');
    });

    zone?.addEventListener('keydown',event=>{
      if((event.key==='Enter' || event.key===' ') && event.target===zone){
        event.preventDefault();
        input?.click();
      }
    });

    if(form) form._referenceImages = [];
  });
})();


// V26 navigation refinements
window.addEventListener('keydown', event => {
  if(event.key === 'Escape'){
    document.querySelectorAll('.nav-dropdown.open').forEach(dropdown => {
      dropdown.classList.remove('open');
      const trigger = dropdown.querySelector('.products-trigger');
      if(trigger) trigger.setAttribute('aria-expanded','false');
    });
  }
});


// V27: stable desktop hover navigation with delayed close.
// The delay prevents the menu from disappearing while the pointer crosses the small gap.
document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
  let closeTimer = null;
  const trigger = dropdown.querySelector('.products-trigger');
  const menu = dropdown.querySelector('.dropdown-menu');
  const desktopQuery = window.matchMedia('(min-width: 981px)');

  const openMenu = () => {
    if (!desktopQuery.matches) return;
    window.clearTimeout(closeTimer);
    dropdown.classList.add('open');
    if (trigger) trigger.setAttribute('aria-expanded', 'true');
  };

  const scheduleClose = () => {
    if (!desktopQuery.matches) return;
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      dropdown.classList.remove('open');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    }, 420);
  };

  dropdown.addEventListener('mouseenter', openMenu);
  dropdown.addEventListener('mouseleave', scheduleClose);
  menu?.addEventListener('mouseenter', openMenu);
  menu?.addEventListener('mouseleave', scheduleClose);

  dropdown.addEventListener('focusin', () => {
    window.clearTimeout(closeTimer);
  });
});

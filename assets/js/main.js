document.querySelectorAll('.menu-btn').forEach(btn => {
  btn.setAttribute('aria-expanded', 'false');
  btn.addEventListener('click', () => {
    const isOpen = document.body.classList.toggle('mobile-open');
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
});
document.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active'));btn.classList.add('active');const v=btn.dataset.filter.toLowerCase();document.querySelectorAll('[data-product-card]').forEach(c=>{const t=(c.dataset.tags||'').toLowerCase();c.classList.toggle('hidden',v!=='all'&&!t.includes(v));});}));document.querySelectorAll('[data-search-products]').forEach(input=>input.addEventListener('input',()=>{const q=input.value.trim().toLowerCase();document.querySelectorAll('[data-product-card]').forEach(c=>{const h=(c.textContent+' '+(c.dataset.tags||'')).toLowerCase();c.classList.toggle('hidden',q&&!h.includes(q));});}));

const INQUIRY_FALLBACK_EMAIL = 'sale008@sola-craft.com';
const MAX_EMAIL_ATTACHMENTS = 4;
const MAX_COMPRESSED_IMAGE_BYTES = 700 * 1024;
const ATTRIBUTION_SESSION_KEY = 'haibu_inquiry_attribution_v1';

function cleanAttributionValue(value, maxLength = 500) {
  return String(value || '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLength);
}

function classifyTraffic(referrer, utmSource, utmMedium) {
  if (utmSource) {
    return {
      attribution_source: cleanAttributionValue(utmSource, 120).toLowerCase(),
      attribution_medium: cleanAttributionValue(utmMedium || 'campaign', 80).toLowerCase(),
      attribution_channel: 'Campaign'
    };
  }

  let hostname = '';
  try {
    hostname = referrer ? new URL(referrer).hostname.toLowerCase().replace(/^www\./, '') : '';
  } catch {
    hostname = '';
  }

  if (!hostname) return { attribution_source: 'direct', attribution_medium: 'none', attribution_channel: 'Direct' };
  if (/(^|\.)google\./.test(hostname)) return { attribution_source: 'google', attribution_medium: 'organic', attribution_channel: 'Organic Search' };
  if (hostname === 'bing.com' || hostname.endsWith('.bing.com')) return { attribution_source: 'bing', attribution_medium: 'organic', attribution_channel: 'Organic Search' };
  if (hostname === 'chatgpt.com' || hostname.endsWith('.chatgpt.com')) return { attribution_source: 'chatgpt', attribution_medium: 'referral', attribution_channel: 'AI Referral' };
  if (hostname === 'perplexity.ai' || hostname.endsWith('.perplexity.ai')) return { attribution_source: 'perplexity', attribution_medium: 'referral', attribution_channel: 'AI Referral' };
  if (hostname === 'copilot.microsoft.com') return { attribution_source: 'copilot', attribution_medium: 'referral', attribution_channel: 'AI Referral' };
  if (hostname === 'gemini.google.com') return { attribution_source: 'gemini', attribution_medium: 'referral', attribution_channel: 'AI Referral' };
  if (hostname === 'claude.ai' || hostname.endsWith('.claude.ai')) return { attribution_source: 'claude', attribution_medium: 'referral', attribution_channel: 'AI Referral' };
  return { attribution_source: hostname, attribution_medium: 'referral', attribution_channel: 'Referral' };
}

function readInquiryAttribution() {
  const params = new URLSearchParams(window.location.search);
  const campaign = {
    attribution_campaign: cleanAttributionValue(params.get('utm_campaign'), 160),
    attribution_content: cleanAttributionValue(params.get('utm_content'), 160),
    attribution_term: cleanAttributionValue(params.get('utm_term'), 160)
  };
  const referrer = cleanAttributionValue(document.referrer, 500);
  const traffic = classifyTraffic(referrer, params.get('utm_source'), params.get('utm_medium'));
  const current = {
    ...traffic,
    ...campaign,
    first_landing_page: cleanAttributionValue(window.location.pathname, 300),
    first_referrer: referrer || 'Not provided',
    first_visit_at: new Date().toISOString()
  };

  try {
    const saved = JSON.parse(sessionStorage.getItem(ATTRIBUTION_SESSION_KEY) || 'null');
    if (saved && typeof saved === 'object') return saved;
    sessionStorage.setItem(ATTRIBUTION_SESSION_KEY, JSON.stringify(current));
  } catch {
    // Attribution remains available for this page if session storage is unavailable.
  }
  return current;
}

const inquiryAttribution = readInquiryAttribution();

function getInquiryAttributionFields() {
  return {
    ...inquiryAttribution,
    inquiry_page: cleanAttributionValue(window.location.pathname, 300)
  };
}

// Vercel Web Analytics is anonymous and cookie-free. The script is served
// from the same Vercel deployment and does not block page rendering.
(() => {
  if (/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) return;
  window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(arguments);
  };
  const script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/insights/script.js';
  script.dataset.sdk = 'analytics';
  document.head.append(script);
})();

const readAsDataUrl = blob => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Could not read an image.'));
  reader.readAsDataURL(blob);
});

const loadImage = file => new Promise((resolve, reject) => {
  const image = new Image();
  const url = URL.createObjectURL(file);
  image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
  image.onerror = () => { URL.revokeObjectURL(url); reject(new Error(`${file.name} cannot be processed by this browser.`)); };
  image.src = url;
});

async function compressReferenceImage(file, index) {
  const image = await loadImage(file);
  const maxDimension = 1600;
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d', { alpha: false });
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const makeBlob = quality => new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
  let blob = await makeBlob(0.8);
  if (blob && blob.size > MAX_COMPRESSED_IMAGE_BYTES) blob = await makeBlob(0.62);
  if (!blob || blob.size > MAX_COMPRESSED_IMAGE_BYTES) {
    throw new Error(`${file.name} is still too large after compression. Please use a smaller image.`);
  }
  const dataUrl = await readAsDataUrl(blob);
  return {
    filename: `${String(file.name || `reference-${index + 1}`).replace(/\.[^.]+$/, '')}.jpg`,
    contentType: 'image/jpeg',
    content: dataUrl.split(',')[1] || ''
  };
}

function getInquiryStatus(form) {
  let status = form.querySelector('[data-inquiry-status]');
  if (!status) {
    status = document.createElement('p');
    status.className = 'inquiry-submit-status';
    status.dataset.inquiryStatus = '';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    form.append(status);
  }
  return status;
}

document.querySelectorAll('.quote-form').forEach(form => form.addEventListener('submit', async event => {
  event.preventDefault();
  const status = getInquiryStatus(form);
  const submit = form.querySelector('[type="submit"]');
  const originalLabel = submit?.innerHTML || '';
  const data = new FormData(form);
  const fields = {};
  data.forEach((value, key) => {
    if (!(value instanceof File) && key !== '_company_fax') fields[key] = String(value).trim();
  });
  Object.assign(fields, getInquiryAttributionFields());
  const selectedImages = (Array.isArray(form._referenceImages) ? form._referenceImages : []).slice(0, MAX_EMAIL_ATTACHMENTS);
  status.className = 'inquiry-submit-status is-sending';
  status.textContent = selectedImages.length ? 'Compressing images and sending your inquiry…' : 'Sending your inquiry…';
  if (submit) { submit.disabled = true; submit.setAttribute('aria-busy', 'true'); submit.textContent = 'Sending…'; }

  try {
    const attachments = [];
    for (let index = 0; index < selectedImages.length; index += 1) {
      attachments.push(await compressReferenceImage(selectedImages[index], index));
    }
    const response = await fetch('/api/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields, attachments, _company_fax: data.get('_company_fax') || '' })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.message || 'The inquiry could not be sent.');
    status.className = 'inquiry-submit-status is-success';
    status.textContent = 'Thank you. Your inquiry was sent successfully. We normally reply within 24 hours.';
    form.reset();
    form.dispatchEvent(new CustomEvent('inquiry:sent'));
  } catch (error) {
    status.className = 'inquiry-submit-status is-error';
    status.textContent = `${error.message || 'The inquiry could not be sent.'} Please email ${INQUIRY_FALLBACK_EMAIL} or contact us on WhatsApp.`;
  } finally {
    if (submit) { submit.disabled = false; submit.removeAttribute('aria-busy'); submit.innerHTML = originalLabel; }
  }
}));
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
  const MAX_FILES = 4;
  const MAX_SIZE = 12 * 1024 * 1024;
  const imageMimeFallback = /\.(jpe?g|png|webp|gif)$/i;

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
        if(file.size > MAX_SIZE){ errors.push(`${file.name} is larger than 12 MB.`); continue; }
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

    if(form) {
      form._referenceImages = [];
      form.addEventListener('inquiry:sent', () => {
        objectUrls.forEach(url => URL.revokeObjectURL(url));
        objectUrls.clear();
        files = [];
        if(input) input.value = '';
        if(cameraInput) cameraInput.value = '';
        render();
        setStatus('');
      });
    }
  });
})();


// V26 navigation refinements
window.addEventListener('keydown', event => {
  if(event.key === 'Escape'){
    document.body.classList.remove('mobile-open');
    document.querySelectorAll('.menu-btn').forEach(button => button.setAttribute('aria-expanded','false'));
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

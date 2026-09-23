(() => {
  const ROOT = '/v2-preview/';
  const ASSET_ROOT = '/v2-preview/assets/';
  const KEY = 'haibu_quote_list_v1';
  const MAX_ITEMS = 20;
  const listMode = new URLSearchParams(location.search).get('quote_list') === '1';
  const form = document.querySelector('[data-quote-form]');
  let catalog = new Map();
  let items = [];
  let storage = null;
  let storageNote = '';
  let listElement;
  let notice;
  let failed = false;
  let unsavedChange = false;
  const buttons = [];

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = `${ASSET_ROOT}quote-list.css`;
  document.head.appendChild(stylesheet);

  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const announce = (message) => {
    if (notice) notice.textContent = message;
  };
  const normalize = (input) => {
    if (!Array.isArray(input)) return [];
    const seen = new Set();
    return input.slice(0, MAX_ITEMS).flatMap(item => {
      if (!item || !catalog.has(item.sku) || seen.has(item.sku)) return [];
      seen.add(item.sku);
      return [{ sku: item.sku, quantity: typeof item.quantity === 'string' ? item.quantity.slice(0, 80) : '' }];
    });
  };
  const read = () => {
    if (!storage) return items;
    try { return normalize(JSON.parse(storage.getItem(KEY) || '[]')); }
    catch { return []; }
  };
  const persist = (next) => {
    if (!storage) return false;
    try { storage.setItem(KEY, JSON.stringify(next)); items = next; unsavedChange = false; return true; }
    catch {
      unsavedChange = true;
      announce('Your browser could not save this change. Keep this page open or use Get Quote for a single product.');
      return false;
    }
  };
  const productFor = (sku) => catalog.get(sku);
  const productPath = product => ROOT === '/' ? product.productionPath : product.previewPath;
  const updateCounts = () => {
    document.querySelectorAll('[data-quote-list-count]').forEach(node => {
      node.textContent = `Quote list (${items.length})`;
      node.setAttribute('aria-label', `Review quote list, ${items.length} products`);
    });
    buttons.forEach(({ button, sku }) => {
      const selected = items.some(item => item.sku === sku);
      button.textContent = selected ? 'Added to Quote' : 'Add to Quote';
      button.setAttribute('aria-pressed', String(selected));
      button.setAttribute('aria-label', `${selected ? 'Added to quote' : 'Add to quote'}: ${sku}`);
    });
  };
  const syncFields = () => {
    if (!listMode || !form) return;
    const values = {
      sku: items.map(item => item.sku).join(', '),
      product: items.length === 1 ? productFor(items[0].sku).title : items.length ? `${items.length} selected products - see quote list` : '',
      product_image: items.length ? productFor(items[0].sku).image : ''
    };
    Object.entries(values).forEach(([name, value]) => {
      const input = form.elements.namedItem(name);
      if (input) { input.value = value; input.defaultValue = value; if (name !== 'product_image') input.readOnly = true; }
    });
  };
  const render = (focusSku) => {
    updateCounts();
    syncFields();
    if (!listElement) return;
    listElement.replaceChildren();
    if (!items.length) listElement.appendChild(element('li', '', 'Your quote list is empty. Browse products and use Add to Quote, or send a general inquiry below.'));
    items.forEach(item => {
      const product = productFor(item.sku);
      const row = element('li', 'quote-list-item');
      const image = element('img');
      image.src = product.image;
      image.alt = `${product.sku} - ${product.title}`;
      image.width = 72; image.height = 72; image.loading = 'lazy';
      const copy = element('div', 'quote-list-copy');
      const link = element('a', '', `${product.sku} · ${product.title}`);
      link.href = productPath(product);
      copy.append(link, element('p', '', product.categoryLabel));
      const label = element('label', '', 'Target quantity / unit (optional)');
      const quantity = element('input');
      quantity.type = 'text'; quantity.maxLength = 80;
      quantity.placeholder = 'e.g. 5,000 pieces or 20 packs';
      quantity.value = item.quantity;
      quantity.setAttribute('aria-label', `Target quantity for ${item.sku}`);
      quantity.dataset.quoteQuantity = item.sku;
      quantity.addEventListener('input', () => {
        const next = read().map(current => current.sku === item.sku ? { ...current, quantity: quantity.value } : current);
        persist(next);
      });
      label.appendChild(quantity);
      copy.appendChild(label);
      const remove = element('button', 'btn btn-light quote-list-remove', 'Remove');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remove ${item.sku} from quote list`);
      remove.addEventListener('click', () => {
        const next = read().filter(current => current.sku !== item.sku);
        if (persist(next)) { render(next[0]?.sku); announce(`${item.sku} removed from quote list.`); }
      });
      row.append(image, copy, remove);
      listElement.appendChild(row);
    });
    if (focusSku) listElement.querySelector(`[data-quote-quantity="${focusSku}"]`)?.focus();
  };
  const addButton = (parent, product) => {
    if (!product || parent.querySelector('[data-add-to-quote]')) return;
    const button = element('button', 'btn btn-light add-to-quote', 'Add to Quote');
    button.type = 'button'; button.dataset.addToQuote = product.sku;
    button.disabled = !storage;
    if (!storage) button.title = 'Browser storage unavailable. Use Get Quote instead.';
    button.addEventListener('click', () => {
      items = read();
      if (items.some(item => item.sku === product.sku)) { announce(`${product.sku} is already in your quote list.`); return; }
      if (items.length >= MAX_ITEMS) { announce(`Your list holds up to ${MAX_ITEMS} products. Review the list before adding more.`); return; }
      if (persist([...items, { sku: product.sku, quantity: '' }])) {
        render(); announce(`${product.sku} added. ${items.length} products in your quote list.`);
      }
    });
    buttons.push({ button, sku: product.sku });
    parent.appendChild(button);
  };
  const initialize = async () => {
    try {
      const response = await fetch(`${ASSET_ROOT}product-catalog.json`);
      if (!response.ok) throw new Error('Catalog unavailable');
      const data = await response.json();
      catalog = new Map(data.products.map(product => [product.sku, product]));
      for (const name of ['localStorage', 'sessionStorage']) {
        try {
          const candidate = window[name];
          const probe = `${KEY}_probe`;
          candidate.setItem(probe, '1'); candidate.removeItem(probe);
          storage = candidate;
          if (name === 'sessionStorage') storageNote = 'Saved in this tab only. Keep this tab open while browsing.';
          break;
        } catch { /* Try tab storage when persistent storage is unavailable. */ }
      }
      items = read();
      const bar = element('div', 'quote-list-bar');
      const inner = element('div', 'container');
      const review = element('a', 'quote-list-link');
      review.href = `${ROOT}quote/?quote_list=1&source=quote-list`;
      review.dataset.quoteListCount = '';
      notice = element('span', 'quote-list-notice', storage ? storageNote || 'Select products for one wholesale inquiry.' : 'Quote list storage unavailable. Use Get Quote for a single product.');
      notice.setAttribute('role', 'status');
      notice.setAttribute('aria-live', 'polite');
      inner.append(review, notice); bar.appendChild(inner);
      document.querySelector('.site-header')?.insertAdjacentElement('afterend', bar);
      document.querySelectorAll('[data-product-card]').forEach(card => {
        const link = card.querySelector('.get-quote');
        const sku = link ? new URL(link.href).searchParams.get('product_code') : '';
        addButton(card.querySelector('.product-card-actions') || card, productFor(sku));
      });
      const detail = [...catalog.values()].find(product => productPath(product) === location.pathname);
      if (detail) {
        const quote = [...document.querySelectorAll('main a')].find(link => new URL(link.href).searchParams.get('product_code') === detail.sku);
        if (quote) addButton(quote.parentElement, detail);
      }
      if (form && listMode) {
        const section = element('section', 'quote-list-panel full');
        section.setAttribute('aria-labelledby', 'quoteListTitle');
        const heading = element('h2', '', 'Your selected products'); heading.id = 'quoteListTitle';
        const note = element('p', '', 'Review up to 20 products. Quantities are optional; pricing, MOQ and packing will be confirmed by our sales team. No payment is collected.');
        listElement = element('ul', 'quote-list-items');
        const browse = element('a', 'btn btn-light', 'Continue browsing products'); browse.href = `${ROOT}products/`;
        section.append(heading, note, listElement, browse);
        form.prepend(section);
      }
      render();
      window.addEventListener('storage', event => {
        if (event.key === KEY && event.storageArea === storage && !form?.hasAttribute('aria-busy')) { items = read(); render(); }
      });
      window.addEventListener('pageshow', () => { items = read(); render(); });
      return true;
    } catch {
      failed = true;
      if (form && listMode) {
        const status = document.getElementById('formStatus');
        if (status) status.textContent = 'Your quote list could not load. Please reload before sending your selected products.';
      }
      return false;
    }
  };
  window.HAIBU_QUOTE_LIST = {
    ready: initialize(),
    getItems() {
      if (failed || !storage) throw new Error('Your quote list is unavailable. Please reload or use a single-product quote.');
      if (unsavedChange) throw new Error('A quote list change was not saved. Please reload and review the quantities before sending.');
      items = read(); syncFields();
      return items.map(item => ({ ...item }));
    },
    complete(submitted) {
      const sent = new Map(submitted.map(item => [item.sku, item.quantity]));
      const remaining = read().filter(item => !sent.has(item.sku) || sent.get(item.sku) !== item.quantity);
      if (persist(remaining)) render();
    }
  };
})();

(() => {
  const cssHref = '/assets/v2/category-ux.css';
  if (!document.querySelector(`link[href="${cssHref}"]`)) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = cssHref;
    document.head.appendChild(stylesheet);
  }

  const searchInput = document.querySelector('[data-product-search]');
  const filterButtons = [...document.querySelectorAll('[data-product-filter]')];
  const cards = [...document.querySelectorAll('[data-product-card]')];
  const resultCount = document.querySelector('[data-product-count]');
  if (!cards.length) return;

  const page = document.body.dataset.page || '';
  const pageLabels = {
    'slime-charms': 'Slime Charms',
    'polymer-clay-slices': 'Polymer Clay Slices',
    'resin-charms': 'Resin Charms',
    'sequins-glitter-confetti': 'Sequins & Confetti'
  };

  const sidebarNote = document.querySelector('.category-sidebar p');
  if (sidebarNote) {
    sidebarNote.classList.add('buyer-navigation-note');
    sidebarNote.textContent = 'Compare related product families before preparing a mixed inquiry.';
  }

  const sidebarQuote = document.querySelector('.category-sidebar a.btn-primary');
  const quoteHref = sidebarQuote?.getAttribute('href') || '/request-quote/?source=product-category';

  let searchClear = null;
  if (searchInput && !searchInput.closest('.category-search-shell')) {
    const shell = document.createElement('div');
    shell.className = 'category-search-shell';
    searchInput.parentNode.insertBefore(shell, searchInput);
    shell.appendChild(searchInput);
    searchClear = document.createElement('button');
    searchClear.type = 'button';
    searchClear.className = 'category-search-clear';
    searchClear.textContent = 'Clear';
    searchClear.setAttribute('aria-label', 'Clear product search');
    searchClear.hidden = true;
    shell.appendChild(searchClear);
  } else {
    searchClear = document.querySelector('.category-search-clear');
  }

  if (resultCount) {
    resultCount.setAttribute('aria-live', 'polite');
    resultCount.setAttribute('aria-atomic', 'true');
  }

  const productGrid = document.querySelector('.product-grid-v2');
  const emptyState = document.createElement('div');
  emptyState.className = 'category-empty-state';
  emptyState.setAttribute('role', 'status');
  emptyState.innerHTML = `<h3>No matching products found</h3><p>Try another product code or style. You can also describe the required item in a quotation request.</p><div class="actions"><button class="btn btn-light" type="button" data-show-all-products>Show All Products</button><a class="btn btn-primary" href="${quoteHref}">Describe Your Requirement</a></div>`;
  productGrid?.insertAdjacentElement('afterend', emptyState);

  let activeFilter = 'all';

  const applyFilters = () => {
    const query = (searchInput?.value || '').trim().toLowerCase();
    let visible = 0;
    cards.forEach((card) => {
      const tags = (card.dataset.tags || '').toLowerCase();
      const category = (card.dataset.category || '').toLowerCase();
      const matchesQuery = !query || tags.includes(query);
      const matchesFilter = activeFilter === 'all' || category === activeFilter;
      const show = matchesQuery && matchesFilter;
      card.hidden = !show;
      if (show) visible += 1;
    });
    if (resultCount) resultCount.textContent = `${visible} product${visible === 1 ? '' : 's'}`;
    if (searchClear) searchClear.hidden = !query;
    emptyState.classList.toggle('show', visible === 0);
  };

  const resetProducts = () => {
    activeFilter = 'all';
    if (searchInput) searchInput.value = '';
    filterButtons.forEach((button) => {
      const active = button.dataset.productFilter === 'all';
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    applyFilters();
    searchInput?.focus();
  };

  searchInput?.addEventListener('input', applyFilters);
  searchClear?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    applyFilters();
    searchInput?.focus();
  });
  emptyState.querySelector('[data-show-all-products]')?.addEventListener('click', resetProducts);

  filterButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.classList.contains('active')));
    button.addEventListener('click', () => {
      activeFilter = button.dataset.productFilter || 'all';
      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      applyFilters();
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && searchInput && document.activeElement === searchInput && searchInput.value) {
      searchInput.value = '';
      applyFilters();
    }
  });

  if (!document.querySelector('.category-mobile-quote')) {
    const mobileQuote = document.createElement('div');
    mobileQuote.className = 'category-mobile-quote';
    mobileQuote.innerHTML = `<span>${pageLabels[page] || 'Selected products'}<br>Send codes and quantities</span><a class="btn btn-primary" href="${quoteHref}">Request Quote</a>`;
    document.body.appendChild(mobileQuote);
    document.body.classList.add('has-category-mobile-quote');
  }

  const imageDialog = document.createElement('dialog');
  imageDialog.className = 'product-image-dialog';
  imageDialog.setAttribute('aria-labelledby', 'productImageDialogTitle');
  imageDialog.innerHTML = `<button class="product-image-dialog-close" type="button" aria-label="Close product image preview">&times;</button><div class="product-image-dialog-inner"><div class="product-image-dialog-visual"><img alt=""></div><div class="product-image-dialog-copy"><span class="sku-badge"></span><h2 id="productImageDialogTitle"></h2><p>Image shown for visual reference. Confirm size, material, color range, packing and destination requirements before ordering.</p><div class="actions"><a class="btn btn-primary" href="${quoteHref}">Get Quote</a><button class="btn btn-light" type="button" data-dialog-close>Continue Browsing</button></div></div></div>`;
  document.body.appendChild(imageDialog);

  const dialogImage = imageDialog.querySelector('.product-image-dialog-visual img');
  const dialogSku = imageDialog.querySelector('.sku-badge');
  const dialogTitle = imageDialog.querySelector('h2');
  const dialogQuote = imageDialog.querySelector('a.btn-primary');
  const closeImageDialog = () => imageDialog.open && imageDialog.close();
  imageDialog.querySelector('.product-image-dialog-close')?.addEventListener('click', closeImageDialog);
  imageDialog.querySelector('[data-dialog-close]')?.addEventListener('click', closeImageDialog);
  imageDialog.addEventListener('click', (event) => {
    if (event.target === imageDialog) closeImageDialog();
  });

  cards.forEach((card) => {
    const image = card.querySelector(':scope > img');
    const title = card.querySelector('h3')?.textContent?.trim() || 'Product';
    const sku = card.querySelector('.sku-badge')?.textContent?.trim() || '';
    const quoteLink = card.querySelector('.get-quote')?.getAttribute('href') || quoteHref;
    if (!image || image.closest('.product-image-button')) return;

    const imageButton = document.createElement('button');
    imageButton.type = 'button';
    imageButton.className = 'product-image-button';
    imageButton.setAttribute('aria-label', `View larger image for ${sku ? `${sku} ` : ''}${title}`);
    card.insertBefore(imageButton, image);
    imageButton.appendChild(image);

    imageButton.addEventListener('click', () => {
      if (typeof imageDialog.showModal !== 'function') {
        window.open(image.currentSrc || image.src, '_blank', 'noopener');
        return;
      }
      if (dialogImage) {
        dialogImage.src = image.currentSrc || image.src;
        dialogImage.alt = image.alt;
      }
      if (dialogSku) dialogSku.textContent = sku;
      if (dialogTitle) dialogTitle.textContent = title;
      if (dialogQuote) dialogQuote.href = quoteLink;
      imageDialog.showModal();
    });
  });

  const relatedByPage = {
    'polymer-clay-slices': [
      ['Slime Charms Wholesale', '/products/slime-charms-wholesale/', 'Combine clay slices with themed decorative charms for coordinated slime assortments.'],
      ['Sequins & Glitter Confetti', '/products/sequins-glitter-confetti/', 'Add color, sparkle and seasonal texture to mixed craft programs.'],
      ['Custom Solutions', '/custom-solutions/', 'Review custom slice themes, color directions and private-label packaging.']
    ],
    'slime-charms': [
      ['Polymer Clay Slices', '/products/polymer-clay-slices-wholesale/', 'Source compatible clay slices for mixed slime add-in collections.'],
      ['Resin Charms', '/products/resin-charms-for-slime/', 'Expand assortments with glossy flatback and novelty resin pieces.'],
      ['Wholesale Product Brief Guide', '/blog/how-to-prepare-a-wholesale-product-brief/', 'Prepare the codes, quantities and packaging details needed for quotation.']
    ],
    'resin-charms': [
      ['Slime Charms Wholesale', '/products/slime-charms-wholesale/', 'Compare broader charm assortments for slime and DIY kit programs.'],
      ['Sequins & Glitter Confetti', '/products/sequins-glitter-confetti/', 'Pair resin pieces with lightweight decorative fillers and sparkle mixes.'],
      ['Packaging & Quality Guide', '/blog/packaging-quality-checkpoints/', 'Define count, finish, packout and inspection checkpoints before production.']
    ],
    'sequins-glitter-confetti': [
      ['Polymer Clay Slices', '/products/polymer-clay-slices-wholesale/', 'Build coordinated mixed-filler packs with themed clay slices.'],
      ['Resin Charms', '/products/resin-charms-for-slime/', 'Add focal flatback pieces to sequin, shaker and craft assortments.'],
      ['Custom Sample Approval Guide', '/blog/sample-approval-checklist/', 'Use a written approval record for shape, finish, color and packaging.']
    ]
  };

  const related = relatedByPage[page];
  const footerSlot = document.querySelector('[data-site-footer]');
  if (related && footerSlot) {
    const section = document.createElement('section');
    section.className = 'section related-section';
    section.innerHTML = `<div class="container"><div class="section-head"><span class="eyebrow">Continue Your Sourcing Review</span><h2>Related products and buyer resources.</h2><p>Compare compatible product families or prepare a clearer quotation request.</p></div><div class="card-grid related-grid">${related.map(([title, href, text]) => `<a class="card page-card-link related-card" href="${href}"><h3>${title}</h3><p>${text}</p><span>Explore &rarr;</span></a>`).join('')}</div></div>`;
    footerSlot.parentNode.insertBefore(section, footerSlot);
  }

  applyFilters();
})();

(() => {
  const searchInput = document.querySelector('[data-product-search]');
  const filterButtons = [...document.querySelectorAll('[data-product-filter]')];
  const cards = [...document.querySelectorAll('[data-product-card]')];
  const resultCount = document.querySelector('[data-product-count]');
  if (!cards.length) return;

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
  };

  searchInput?.addEventListener('input', applyFilters);
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.productFilter || 'all';
      filterButtons.forEach((item) => item.classList.toggle('active', item === button));
      applyFilters();
    });
  });

  const relatedByPage = {
    'polymer-clay-slices': [
      ['Slime Charms Wholesale', '/v2-preview/products/slime-charms/', 'Combine clay slices with themed decorative charms for coordinated slime assortments.'],
      ['Sequins & Glitter Confetti', '/v2-preview/products/sequins-glitter-confetti/', 'Add color, sparkle and seasonal texture to mixed craft programs.'],
      ['Custom Solutions', '/v2-preview/custom-solutions/', 'Review custom slice themes, color directions and private-label packaging.']
    ],
    'slime-charms': [
      ['Polymer Clay Slices', '/v2-preview/products/polymer-clay-slices/', 'Source compatible clay slices for mixed slime add-in collections.'],
      ['Resin Charms', '/v2-preview/products/resin-charms/', 'Expand assortments with glossy flatback and novelty resin pieces.'],
      ['Wholesale Product Brief Guide', '/v2-preview/blog/how-to-prepare-a-wholesale-product-brief/', 'Prepare the codes, quantities and packaging details needed for quotation.']
    ],
    'resin-charms': [
      ['Slime Charms Wholesale', '/v2-preview/products/slime-charms/', 'Compare broader charm assortments for slime and DIY kit programs.'],
      ['Sequins & Glitter Confetti', '/v2-preview/products/sequins-glitter-confetti/', 'Pair resin pieces with lightweight decorative fillers and sparkle mixes.'],
      ['Packaging & Quality Guide', '/v2-preview/blog/packaging-quality-checkpoints/', 'Define count, finish, packout and inspection checkpoints before production.']
    ],
    'sequins-glitter-confetti': [
      ['Polymer Clay Slices', '/v2-preview/products/polymer-clay-slices/', 'Build coordinated mixed-filler packs with themed clay slices.'],
      ['Resin Charms', '/v2-preview/products/resin-charms/', 'Add focal flatback pieces to sequin, shaker and craft assortments.'],
      ['Custom Sample Approval Guide', '/v2-preview/blog/sample-approval-checklist/', 'Use a written approval record for shape, finish, color and packaging.']
    ]
  };

  const page = document.body.dataset.page || '';
  const related = relatedByPage[page];
  const footerSlot = document.querySelector('[data-site-footer]');
  if (related && footerSlot) {
    const section = document.createElement('section');
    section.className = 'section related-section';
    section.innerHTML = `<div class="container"><div class="section-head"><span class="eyebrow">Continue Your Sourcing Review</span><h2>Related products and buyer resources.</h2><p>Compare compatible product families or prepare a clearer quotation request.</p></div><div class="card-grid related-grid">${related.map(([title, href, text]) => `<a class="card page-card-link related-card" href="${href}"><h3>${title}</h3><p>${text}</p><span>Explore →</span></a>`).join('')}</div></div>`;
    footerSlot.parentNode.insertBefore(section, footerSlot);
  }

  applyFilters();
})();

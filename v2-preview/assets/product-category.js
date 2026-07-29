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

  applyFilters();
})();

/* Keep every catalog card in the DOM; shorten only the enhanced phone view. */
(function () {
  'use strict';
  const featured=document.querySelector('.home-product-grid');
  if(featured){featured.dataset.mobileBrowse='';featured.dataset.mobileInitial='4';featured.dataset.mobileStep='4';featured.dataset.mobileLabel='featured products';}
  const category=document.querySelector('[data-product-search]')&&document.querySelector('.product-grid-v2');
  if(category){category.dataset.mobileBrowse='';category.dataset.mobileInitial='12';category.dataset.mobileStep='12';category.dataset.mobileLabel='products';}
  const phone = window.matchMedia('(max-width: 720px)');
  let printing = false;
  const groups = [];

  document.querySelectorAll('[data-mobile-browse]').forEach((grid, index) => {
    const initial = Math.max(1, Number(grid.dataset.mobileInitial) || 12);
    const step = Math.max(1, Number(grid.dataset.mobileStep) || initial);
    const label = grid.dataset.mobileLabel || 'items';
    let limit = initial;
    let cards = Array.from(grid.children);
    let eligible = [];
    let shown = 0;
    let scheduled = false;
    if (!grid.id) {
      let id = 'mobile-browse-grid-' + (index + 1);
      while (document.getElementById(id)) id += '-more';
      grid.id = id;
    }

    const controls = document.createElement('div');
    controls.className = 'mobile-browse-controls';
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Browse ' + label);
    controls.hidden = true;
    const status = document.createElement('p');
    status.className = 'mobile-browse-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.setAttribute('aria-atomic', 'true');
    const actions = document.createElement('div');
    actions.className = 'mobile-browse-actions';
    function button(kind) {
      const node = document.createElement('button');
      node.type = 'button';
      node.className = 'mobile-browse-button mobile-browse-' + kind;
      node.setAttribute('aria-controls', grid.id);
      actions.appendChild(node);
      return node;
    }
    const more = button('more');
    const all = button('all');
    const fewer = button('fewer');
    fewer.textContent = 'Show fewer';
    fewer.setAttribute('aria-label', 'Show fewer ' + label);
    controls.append(status, actions);
    grid.after(controls);

    // Read only the existing filter's visibility. Our own paging attribute is
    // separate, so a hidden later card still participates in every filter.
    function available() {
      return cards.filter(card => !card.hidden && card.style.display !== 'none');
    }
    function hashCard() {
      let id;
      try { id = decodeURIComponent(window.location.hash.slice(1)); }
      catch { return null; }
      const target = id && document.getElementById(id);
      return target && cards.find(card => card === target || card.contains(target));
    }
    function render() {
      const compact = phone.matches && !printing && grid.dataset.mobileUnpaged !== 'true';
      const targetCard = hashCard();
      const activeCard = cards.find(card => card.contains(document.activeElement));
      for (const card of [targetCard, activeCard]) {
        const position = eligible.indexOf(card);
        if (position >= limit) limit = Math.ceil((position + 1) / step) * step;
      }
      const visible = new Set(compact ? eligible.slice(0, limit) : eligible);
      const availableCards = new Set(eligible);
      cards.forEach(card => {
        if (compact && availableCards.has(card) && !visible.has(card)) card.setAttribute('data-mobile-browse-hidden', '');
        else card.removeAttribute('data-mobile-browse-hidden');
      });
      shown = visible.size;
      controls.hidden = !compact || cards.length <= initial;
      status.textContent = 'Showing ' + shown + ' of ' + eligible.length + ' ' + label;
      more.textContent = 'Show ' + Math.min(step, eligible.length - shown) + ' more';
      more.setAttribute('aria-label', more.textContent + ' ' + label);
      all.textContent = 'Show all ' + eligible.length + ' ' + label;
      more.hidden = all.hidden = shown >= eligible.length;
      const fragmentMinimum = targetCard ? Math.ceil((eligible.indexOf(targetCard) + 1) / step) * step : initial;
      fewer.hidden = shown <= Math.max(initial, Math.min(eligible.length, fragmentMinimum));
    }
    function refresh() {
      cards = Array.from(grid.children);
      const next = available();
      if (next.length !== eligible.length || next.some((card, i) => card !== eligible[i])) limit = initial;
      eligible = next;
      render();
    }
    function focusNew(card) {
      if (!card) return;
      const target = card.querySelector('a[href], button, input, select, textarea, summary') || card;
      if (target === card && !card.hasAttribute('tabindex')) card.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      card.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
    function expand(nextLimit) {
      const firstNew = eligible[shown];
      limit = nextLimit;
      render();
      focusNew(firstNew);
    }
    more.addEventListener('click', () => expand(limit + step));
    all.addEventListener('click', () => expand(Infinity));
    fewer.addEventListener('click', () => {
      limit = initial;
      // Move focus out of the removed portion before collapsing it.
      more.hidden = false;
      more.focus({ preventScroll: true });
      render();
      grid.scrollIntoView({ block: 'start', behavior: 'auto' });
    });
    function revealHash() {
      const card = hashCard();
      const needsReveal = card && card.hasAttribute('data-mobile-browse-hidden');
      render();
      if (needsReveal) card.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
    // Existing filters can use display/hidden without knowing about paging.
    // Child-list observation also keeps dynamically inserted cards available.
    if (typeof MutationObserver === 'function') {
      new MutationObserver(records => {
        if (!records.some(record => record.type === 'childList' || record.target === grid || cards.includes(record.target))) return;
        if (scheduled) return;
        scheduled = true;
        queueMicrotask(() => { scheduled = false; refresh(); });
      }).observe(grid, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'hidden', 'data-mobile-unpaged'] });
    }
    refresh();
    // A browser may have attempted fragment scrolling before enhancement.
    const initialTarget = hashCard();
    if (initialTarget) requestAnimationFrame(() => initialTarget.scrollIntoView({ block: 'start', behavior: 'auto' }));
    groups.push({ render, revealHash });
  });

  phone.addEventListener('change', () => groups.forEach(group => group.render()));
  window.addEventListener('hashchange', () => groups.forEach(group => group.revealHash()));
  window.addEventListener('beforeprint', () => { printing = true; groups.forEach(group => group.render()); });
  window.addEventListener('afterprint', () => { printing = false; groups.forEach(group => group.render()); });
})();

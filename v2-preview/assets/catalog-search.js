(() => {
  const input = document.getElementById('catalog-search-input');
  if (!input) return;
  const status = document.getElementById('catalog-search-status');
  const results = document.getElementById('catalog-search-results');
  const more = document.getElementById('catalog-search-more');
  const help = document.getElementById('catalog-search-help');
  const isPreview = location.pathname.split('/')[1] === 'v2-preview';
  const catalogUrl = isPreview ? '/v2-preview/assets/product-catalog.json' : '/assets/v2/product-catalog.json';
  let data, pending, facts = {}, matches = [], shown = 0, revision = 0, timer, activeQuery = '';
  function setMoreVisible(visible) {
    more.hidden = !visible;
    more.style.display = visible ? '' : 'none';
  }
  function resetResults() {
    results.replaceChildren(); matches = []; shown = 0; activeQuery = '';
    setMoreVisible(false);
  }
  setMoreVisible(false);
  async function load() {
    if (data) return data;
    if (!pending) pending = fetch(catalogUrl).then(r => { if (!r.ok) throw Error('catalog'); return r.json(); }).then(async j => { try { const r = await fetch(isPreview ? '/v2-preview/assets/catalog-search-specs.json' : '/assets/v2/catalog-search-specs.json'); if (r.ok) facts = await r.json(); } catch (_) {} return data = j.products; }).finally(() => { pending = null; });
    return pending;
  }
  function show() {
    if (!activeQuery || input.value.trim().toLowerCase() !== activeQuery || shown >= matches.length) return;
    for (const p of matches.slice(shown, shown + 24)) {
      const a = document.createElement('a'); a.className = 'product-family-card';
      a.href = isPreview ? p.previewPath : p.productionPath;
      const img = document.createElement('img'); img.src = p.image; img.alt = p.title; img.loading = 'lazy'; img.width = 300; img.height = 300; img.style.cssText = 'width:100%;height:200px;object-fit:contain';
      const body = document.createElement('div'); body.className = 'product-family-body';
      const code = document.createElement('span'); code.textContent = p.sku;
      const title = document.createElement('h3'); title.textContent = p.title;
      const category = document.createElement('p'); category.textContent = p.categoryLabel;
      body.append(code, title, category); a.append(img, body); results.append(a);
    }
    shown = Math.min(shown + 24, matches.length);
    status.textContent = `Showing ${shown} of ${matches.length} matching products`;
    setMoreVisible(shown < matches.length);
  }
  async function search(current) {
    const q = input.value.trim().toLowerCase();
    resetResults(); help.hidden = true;
    if (!q) { status.textContent = ''; return; }
    status.textContent = 'Searching…';
    try {
      const products = await load(); if (current !== revision) return;
      const terms = q.split(/\s+/);
      matches = products.filter(p => terms.every(t => `${p.sku} ${p.title} ${p.categoryLabel} ${p.type} ${facts[p.sku] || ''}`.toLowerCase().includes(t)));
      matches.sort((a,b) => Number(b.sku.toLowerCase() === q) - Number(a.sku.toLowerCase() === q));
      shown = 0; activeQuery = q;
      if (!matches.length) { status.textContent = 'No matching products found. Try another name, use, material or code.'; help.hidden = false; return; }
      show();
    } catch (_) { if (current === revision) { status.textContent = 'Search is temporarily unavailable. Please browse the categories or try again.'; help.hidden = false; } }
  }
  input.addEventListener('input', () => {
    const current = ++revision; clearTimeout(timer);
    resetResults(); help.hidden = true; status.textContent = '';
    if (input.value.trim()) timer = setTimeout(() => search(current), 160);
  });
  more.addEventListener('click', show);
  const initialQuery = new URLSearchParams(location.search).get('search');
  if (initialQuery?.trim()) {
    input.value = initialQuery;
    search(++revision);
  }
})();


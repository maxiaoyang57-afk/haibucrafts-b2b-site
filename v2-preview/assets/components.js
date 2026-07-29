(() => {
  const ROOT = '/v2-preview/';
  const page = document.body.dataset.page || '';
  const source = encodeURIComponent(page || 'site-v2');

  const header = `
    <div class="topbar"><div class="container"><span>B2B wholesale · OEM/ODM · Private label · Export support</span><span><a href="mailto:sale008@sola-craft.com">sale008@sola-craft.com</a></span></div></div>
    <header class="site-header"><div class="container navbar">
      <a class="logo" href="${ROOT}"><img src="/assets/images/logo-haibu.webp" width="88" height="68" alt="HAIBUCRAFT"></a>
      <nav class="nav" aria-label="Primary navigation">
        <a href="${ROOT}">Home</a>
        <div class="nav-group">
          <div class="nav-product-row"><a href="${ROOT}products/">Products</a><button class="products-toggle" type="button" aria-expanded="false" aria-label="Open product categories">⌄</button></div>
          <div class="dropdown">
            <a href="${ROOT}products/slime-charms/">Slime Charms Wholesale</a>
            <a href="${ROOT}products/polymer-clay-slices/">Polymer Clay Slices Wholesale</a>
            <a href="${ROOT}products/resin-charms/">Resin Charms for Slime</a>
            <a href="${ROOT}products/sequins-glitter-confetti/">Sequins &amp; Glitter Confetti</a>
          </div>
        </div>
        <a href="${ROOT}custom-solutions/">Custom Solutions</a>
        <a href="${ROOT}manufacturing/">Manufacturing</a>
        <a href="${ROOT}quality-control/">Quality Control</a>
        <a href="${ROOT}about/">About</a>
        <a href="${ROOT}blog/">Blog</a>
        <a class="quote-btn" href="${ROOT}quote/?source=${source}">Request Quote</a>
      </nav>
      <button class="menu-btn" aria-expanded="false" aria-label="Open menu">☰</button>
    </div></header>`;

  const footer = `
    <footer class="site-footer"><div class="container">
      <div class="footer-grid">
        <div><h3>HAIBUCRAFT</h3><p>Wholesale craft supplies, custom development and export support from Yiwu, Zhejiang, China.</p></div>
        <div><h3>Products</h3><a href="${ROOT}products/slime-charms/">Slime Charms</a><a href="${ROOT}products/polymer-clay-slices/">Polymer Clay Slices</a><a href="${ROOT}products/resin-charms/">Resin Charms</a><a href="${ROOT}products/sequins-glitter-confetti/">Sequins &amp; Confetti</a></div>
        <div><h3>Capabilities</h3><a href="${ROOT}manufacturing/">Manufacturing</a><a href="${ROOT}quality-control/">Quality Control</a><a href="${ROOT}custom-solutions/">Custom Solutions</a></div>
        <div><h3>Company</h3><a href="${ROOT}about/">About</a><a href="${ROOT}blog/">Blog</a><a href="${ROOT}quote/?source=${source}">Request Quote</a></div>
      </div>
      <div class="footer-bottom">© 2026 HAIBUCRAFT. Preview branch only. Not published to production.</div>
    </div></footer><button class="back-top" aria-label="Back to top">↑</button>`;

  const headerSlot = document.querySelector('[data-site-header]');
  const footerSlot = document.querySelector('[data-site-footer]');
  if (headerSlot) headerSlot.innerHTML = header;
  if (footerSlot) footerSlot.innerHTML = footer;
})();

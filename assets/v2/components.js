(() => {
  const ROOT = '/';
  window.HAIBU_SITE_ROOT = ROOT;
  const page = document.body.dataset.page || '';
  const source = encodeURIComponent(page || 'site-v2');
  const landing = encodeURIComponent(window.location.pathname);

  if (!/^(localhost|127\.0\.0\.1)$/.test(window.location.hostname) && !document.querySelector('script[data-sdk="analytics"]')) {
    window.va = window.va || function () {
      (window.vaq = window.vaq || []).push(arguments);
    };
    const analytics = document.createElement('script');
    analytics.defer = true;
    analytics.src = '/_vercel/insights/script.js';
    analytics.dataset.sdk = 'analytics';
    document.head.appendChild(analytics);
  }

  if (!document.querySelector('link[href$="footer-related-v2.css"]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = `${ROOT}assets/footer-related-v2.css`;
    document.head.appendChild(stylesheet);
  }

  if (!document.querySelector('link[href$="accessibility.css"]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = `${ROOT}assets/accessibility.css`;
    document.head.appendChild(stylesheet);
  }

  const main = document.querySelector('main');
  if (main && !main.id) main.id = 'main-content';

  const header = `
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <div class="topbar"><div class="container"><span>B2B wholesale · OEM/ODM · Private label · Export support</span><span><a href="mailto:sale008@sola-craft.com">sale008@sola-craft.com</a></span></div></div>
    <header class="site-header"><div class="container navbar">
      <a class="logo" href="${ROOT}"><img src="/assets/images/logo-haibu.webp" width="88" height="68" alt="HAIBUCRAFT"></a>
      <nav class="nav" id="primary-navigation" aria-label="Primary navigation">
        <a href="${ROOT}">Home</a>
        <div class="nav-group">
          <div class="nav-product-row"><a href="${ROOT}products/">Products</a><button class="products-toggle" type="button" aria-expanded="false" aria-controls="product-category-navigation" aria-haspopup="true" aria-label="Open product categories">⌄</button></div>
          <div class="dropdown" id="product-category-navigation">
            <a href="${ROOT}products/slime-charms/">Slime Charms Wholesale</a>
            <a href="${ROOT}products/polymer-clay-slices/">Polymer Clay Slices Wholesale</a>
            <a href="${ROOT}products/resin-charms/">Resin Charms for Slime</a>
            <a href="${ROOT}products/sequins-glitter-confetti/">Sequins &amp; Glitter Confetti</a>
          </div>
        </div>
        <a href="${ROOT}custom-solutions/">Custom Solutions</a>
        <a href="${ROOT}manufacturing/">Manufacturing</a>
        <a href="${ROOT}quality-control/">Quality Control</a>
        <a href="${ROOT}certificates/">Certificates</a>
        <a href="${ROOT}about/">About</a>
        <a href="${ROOT}blog/">Blog</a>
        <a class="quote-btn" href="${ROOT}quote/?source=${source}&landing_page=${landing}">Request Quote</a>
      </nav>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="primary-navigation" aria-label="Open menu">☰</button>
    </div></header>`;

  const footer = `
    <footer class="site-footer"><div class="container">
      <div class="footer-grid footer-grid-v2">
        <div class="footer-brand"><h3>HAIBUCRAFT</h3><p>Buyer-facing B2B brand for wholesale craft supplies, custom-project coordination, packaging support and export communication from Yiwu, Zhejiang, China.</p><a class="footer-email" href="mailto:sale008@sola-craft.com">sale008@sola-craft.com</a><p class="footer-note">Decorative craft components only. Not edible. Small parts may present a choking hazard.</p></div>
        <div><h3>Products</h3><a href="${ROOT}products/">All Products</a><a href="${ROOT}products/slime-charms/">Slime Charms</a><a href="${ROOT}products/polymer-clay-slices/">Polymer Clay Slices</a><a href="${ROOT}products/resin-charms/">Resin Charms</a><a href="${ROOT}products/sequins-glitter-confetti/">Sequins &amp; Confetti</a></div>
        <div><h3>Capabilities</h3><a href="${ROOT}custom-solutions/">Custom Solutions</a><a href="${ROOT}manufacturing/">Manufacturing &amp; Supply</a><a href="${ROOT}quality-control/">Quality Control</a><a href="${ROOT}certificates/">Certificates &amp; Reports</a><a href="${ROOT}quote/?source=footer-capabilities&landing_page=${landing}">Request Quote</a></div>
        <div><h3>Buyer Resources</h3><a href="${ROOT}blog/">Buying Guides</a><a href="${ROOT}blog/how-to-prepare-a-wholesale-product-brief/">Product Brief Guide</a><a href="${ROOT}blog/sample-approval-checklist/">Sample Approval Guide</a><a href="${ROOT}blog/packaging-quality-checkpoints/">Packaging &amp; QC Guide</a></div>
        <div><h3>Company</h3><a href="${ROOT}about/">About HAIBUCRAFT</a><a href="${ROOT}about/#transparency">Transparency</a><a href="${ROOT}about/editorial-policy/">Editorial Policy</a><a href="${ROOT}certificates/">Document Center</a><a href="${ROOT}quote/?source=footer-company&landing_page=${landing}">Contact Sales</a></div>
      </div>
      <div class="footer-bottom"><span>© 2026 HAIBUCRAFT. Preview branch only. Not published to production.</span><span>Verified claims only · No retail checkout · No blanket certification claims</span></div>
    </div></footer><button class="back-top" type="button" aria-label="Back to top">↑</button>`;

  const headerSlot = document.querySelector('[data-site-header]');
  const footerSlot = document.querySelector('[data-site-footer]');
  if (headerSlot) headerSlot.innerHTML = header;
  if (footerSlot) footerSlot.innerHTML = footer;
})();

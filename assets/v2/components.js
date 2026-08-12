(() => {
  const ROOT = '/';
  const ASSET_ROOT = '/assets/v2/';
  window.HAIBU_SITE_ROOT = ROOT;
  const page = document.body.dataset.page || '';
  const source = encodeURIComponent(page || 'site-v2');
  const landing = encodeURIComponent(window.location.pathname);
  const CONTACT_CONFIG = Object.freeze({
    whatsappNumber: '8618632026595',
    whatsappDisplay: '+86 186 3202 6595'
  });
  window.HAIBU_CONTACT_CONFIG = CONTACT_CONFIG;
  const whatsappContext = (page || 'website').replace(/[-_]+/g, ' ');
  const whatsappMessage = `Hello HAIBUCRAFT, I am visiting the ${whatsappContext} page (${window.location.pathname}) and would like to discuss a wholesale inquiry. Please share MOQ, pricing, packing and lead time.`;
  const whatsappHref = `https://wa.me/${CONTACT_CONFIG.whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
  const whatsappIcon = `<svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><circle cx="12" cy="12" r="8.75" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9.15 7.85c.25-.25.55-.2.72.03l1.08 1.5c.15.22.13.5-.05.7l-.62.68c.48 1.08 1.36 1.96 2.44 2.44l.68-.62c.2-.18.48-.2.7-.05l1.5 1.08c.23.17.28.47.03.72-.6.62-1.47.98-2.37.84-2.95-.45-5.28-2.78-5.73-5.73-.14-.9.22-1.77.84-2.37Z" fill="currentColor"/><path d="m6.1 17.9.72-2.15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;

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
    stylesheet.href = `${ASSET_ROOT}footer-related-v2.css`;
    document.head.appendChild(stylesheet);
  }

  if (!document.querySelector('link[href$="accessibility.css"]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = `${ASSET_ROOT}accessibility.css`;
    document.head.appendChild(stylesheet);
  }

  if (!document.querySelector('link[href$="brand-v2.css"]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = `${ASSET_ROOT}brand-v2.css`;
    document.head.appendChild(stylesheet);
  }

  const main = document.querySelector('main');
  if (main && !main.id) main.id = 'main-content';

  const header = `
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <div class="topbar"><div class="container"><span>B2B wholesale · OEM/ODM · Private label · Export support</span><span class="topbar-contact"><a href="mailto:sale008@sola-craft.com">sale008@sola-craft.com</a><span aria-hidden="true"> · </span><a class="topbar-whatsapp" href="${whatsappHref}" target="_blank" rel="noopener noreferrer">WhatsApp</a></span></div></div>
    <header class="site-header"><div class="container navbar">
      <a class="logo" href="${ROOT}" aria-label="HAIBUCRAFT home">
        <picture>
          <source media="(max-width: 1080px)" srcset="/brand/haibu-logo-mobile.png">
          <img src="/brand/haibu-logo-header.png" width="624" height="214" alt="HAIBUCRAFT">
        </picture>
      </a>
      <nav class="nav" id="primary-navigation" aria-label="Primary navigation">
        <a href="${ROOT}">Home</a>
        <div class="nav-group">
          <div class="nav-product-row"><a href="${ROOT}products/">Products</a><button class="products-toggle" type="button" aria-expanded="false" aria-controls="product-category-navigation" aria-haspopup="true" aria-label="Open product categories">⌄</button></div>
          <div class="dropdown" id="product-category-navigation">
            <a href="${ROOT}products/slime-charms-wholesale/">Slime Charms Wholesale</a>
            <a href="${ROOT}products/polymer-clay-slices-wholesale/">Polymer Clay Slices Wholesale</a>
            <a href="${ROOT}products/resin-charms-for-slime/">Resin Charms for Slime</a>
            <a href="${ROOT}products/sequins-glitter-confetti/">Sequins &amp; Glitter Confetti</a>
          </div>
        </div>
        <a href="${ROOT}custom-solutions/">Custom Solutions</a>
        <a href="${ROOT}manufacturing/">Manufacturing</a>
        <a href="${ROOT}quality-control/">Quality Control</a>
        <a href="${ROOT}certificates/">Certificates</a>
        <a href="${ROOT}about/">About</a>
        <a href="${ROOT}blog/">Blog</a>
        <a class="quote-btn" href="${ROOT}request-quote/?source=${source}&landing_page=${landing}">Request Quote</a>
      </nav>
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="primary-navigation" aria-label="Open menu">☰</button>
    </div></header>`;

  const footer = `
    <footer class="site-footer"><div class="container">
      <div class="footer-grid footer-grid-v2">
        <div class="footer-brand">
          <a class="footer-brand-mark" href="${ROOT}" aria-label="HAIBUCRAFT home"><img class="footer-logo" src="/brand/haibu-logo-footer.png" width="810" height="278" alt="HAIBUCRAFT"></a>
          <h3>HAIBUCRAFT</h3>
          <p class="footer-tagline">Creative craft components supplier</p>
          <p>Buyer-facing B2B brand for wholesale craft supplies, custom-project coordination, packaging support and export communication from Yiwu, Zhejiang, China.</p>
          <a class="footer-email" href="mailto:sale008@sola-craft.com">sale008@sola-craft.com</a>
          <a class="footer-whatsapp" href="${whatsappHref}" target="_blank" rel="noopener noreferrer">WhatsApp: ${CONTACT_CONFIG.whatsappDisplay}</a>
          <p class="footer-note">Decorative craft components only. Not edible. Small parts may present a choking hazard.</p>
        </div>
        <div><h3>Products</h3><a href="${ROOT}products/">All Products</a><a href="${ROOT}products/slime-charms-wholesale/">Slime Charms</a><a href="${ROOT}products/polymer-clay-slices-wholesale/">Polymer Clay Slices</a><a href="${ROOT}products/resin-charms-for-slime/">Resin Charms</a><a href="${ROOT}products/sequins-glitter-confetti/">Sequins &amp; Confetti</a></div>
        <div><h3>Capabilities</h3><a href="${ROOT}custom-solutions/">Custom Solutions</a><a href="${ROOT}manufacturing/">Manufacturing &amp; Supply</a><a href="${ROOT}quality-control/">Quality Control</a><a href="${ROOT}certificates/">Certificates &amp; Reports</a><a href="${ROOT}request-quote/?source=footer-capabilities&landing_page=${landing}">Request Quote</a></div>
        <div><h3>Buyer Resources</h3><a href="${ROOT}blog/">Buying Guides</a><a href="${ROOT}blog/how-to-prepare-a-wholesale-product-brief/">Product Brief Guide</a><a href="${ROOT}blog/sample-approval-checklist/">Sample Approval Guide</a><a href="${ROOT}blog/packaging-quality-checkpoints/">Packaging &amp; QC Guide</a></div>
        <div><h3>Company</h3><a href="${ROOT}about/">About HAIBUCRAFT</a><a href="${ROOT}about/#transparency">Transparency</a><a href="${ROOT}about/editorial-policy/">Editorial Policy</a><a href="${ROOT}privacy/">Privacy Policy</a><a href="${ROOT}certificates/">Document Center</a><a href="${ROOT}request-quote/?source=footer-company&landing_page=${landing}">Contact Sales</a></div>
      </div>
      <div class="footer-bottom"><span>© 2026 HAIBUCRAFT. Wholesale craft supply and B2B sourcing support.</span><span>Verified claims only · No retail checkout · No blanket certification claims</span></div>
    </div></footer><a class="whatsapp-float" href="${whatsappHref}" target="_blank" rel="noopener noreferrer" aria-label="Chat with HAIBUCRAFT on WhatsApp" title="Chat with HAIBUCRAFT on WhatsApp">${whatsappIcon}<span>WhatsApp</span></a><button class="back-top" type="button" aria-label="Back to top">↑</button>`;

  const headerSlot = document.querySelector('[data-site-header]');
  const footerSlot = document.querySelector('[data-site-footer]');
  if (headerSlot) headerSlot.innerHTML = header;
  if (footerSlot) footerSlot.innerHTML = footer;

  if (page === 'quote') {
    const quoteIntro = document.querySelector('.page-hero .container');
    if (quoteIntro && !quoteIntro.querySelector('.quote-whatsapp-option')) {
      quoteIntro.insertAdjacentHTML('beforeend', `<p class="quote-whatsapp-option">Prefer WhatsApp? <a href="${whatsappHref}" target="_blank" rel="noopener noreferrer">Chat with sales</a></p>`);
    }
  }

  const whatsappFloat = document.querySelector('.whatsapp-float');
  const quoteForm = document.querySelector('[data-quote-form]');
  if (whatsappFloat && quoteForm && 'IntersectionObserver' in window) {
    const formObserver = new IntersectionObserver(([entry]) => {
      const avoidForm = entry.isIntersecting;
      whatsappFloat.classList.toggle('avoid-form', avoidForm);
      whatsappFloat.setAttribute('aria-hidden', String(avoidForm));
      whatsappFloat.tabIndex = avoidForm ? -1 : 0;
    }, { threshold: 0.02 });
    formObserver.observe(quoteForm);
  }
})();

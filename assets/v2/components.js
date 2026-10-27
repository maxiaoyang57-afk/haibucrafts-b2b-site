(() => {
  const ROOT = '/';
  const ASSET_ROOT = '/assets/v2/';
  window.HAIBU_SITE_ROOT = ROOT;
  const quoteListScript = document.createElement('script');
  quoteListScript.src = `${ASSET_ROOT}quote-list.js?v=20260929-compact`;
  window.HAIBU_QUOTE_LIST_READY = new Promise((resolve) => {
    quoteListScript.onload = () => resolve(window.HAIBU_QUOTE_LIST || null);
    quoteListScript.onerror = () => resolve(null);
  });
  document.head.appendChild(quoteListScript);
  const page = document.body.dataset.page || '';
  const source = encodeURIComponent(page || 'site-v2');
  const landing = encodeURIComponent(window.location.pathname);
  const CONTACT_CONFIG = Object.freeze({
    whatsappNumber: '8618632026595',
    whatsappDisplay: '+86 186 3202 6595'
  });
  const ANALYTICS_CONFIG = Object.freeze({
    measurementId: 'G-HJ0EL0PQWR',
    consentKey: 'haibu_analytics_consent_v2'
  });
  const IS_LOCAL = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  const IS_CANONICAL_ANALYTICS_HOST = /^(www\.)?haibucrafts\.com$/i.test(window.location.hostname);
  let googleAnalyticsReady = false;
  // Clarity consent adapter: no SDK request before an explicit analytics choice.
  function createClarityConsent(projectId, eligible) {
    let loaded = false;
    let stopped = false;
    let allowed = false;
    const events = new Set(['generate_lead', 'inquiry_submit_attempt', 'whatsapp_click', 'email_click', 'phone_click', 'quote_click', 'product_click']);
    const privacySignal = () => window.navigator.globalPrivacyControl === true || window.navigator.doNotTrack === '1';
    const maskForms = (root) => {
      const selector = 'form, [contenteditable], [data-inquiry-summary], [data-upload-preview]';
      if (root.matches && root.matches(selector)) root.setAttribute('data-clarity-mask', 'true');
      if (root.querySelectorAll) root.querySelectorAll(selector).forEach((node) => node.setAttribute('data-clarity-mask', 'true'));
    };
    const update = (value) => {
      allowed = value === 'granted' && eligible && !privacySignal();
      if (!allowed) {
        if (loaded && typeof window.clarity === 'function') {
          window.clarity('consentv2', { analytics_Storage: 'denied', ad_Storage: 'denied' });
          window.clarity('stop');
          stopped = true;
        }
        return;
      }
      // A withdrawn recording stays stopped in this document. A fresh page can
      // start a new consented session, without reloading an unfinished inquiry.
      if (stopped) return;
      if (!loaded) {
        maskForms(document);
        if (typeof MutationObserver === 'function') {
          new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach(maskForms)))
            .observe(document.documentElement, { childList: true, subtree: true });
        }
        window.clarity = window.clarity || function () {
          (window.clarity.q = window.clarity.q || []).push(arguments);
        };
        window.clarity('consentv2', { analytics_Storage: 'granted', ad_Storage: 'denied' });
        const script = document.createElement('script');
        script.async = true;
        script.dataset.sdk = 'clarity';
        script.src = 'https://www.clarity.ms/tag/' + projectId;
        document.head.appendChild(script);
        loaded = true;
      } else {
        window.clarity('consentv2', { analytics_Storage: 'granted', ad_Storage: 'denied' });
      }
    };
    return {
      update,
      event: (name) => {
        if (allowed && loaded && !stopped && events.has(name)) window.clarity('event', name);
      }
    };
  }
  // End Clarity consent adapter.
  const clarityConsent = createClarityConsent('yxduu55xlf', IS_CANONICAL_ANALYTICS_HOST && !/^\/v2-preview(?:\/|$)/.test(window.location.pathname));


  const readAnalyticsConsent = () => {
    try {
      return window.localStorage.getItem(ANALYTICS_CONFIG.consentKey);
    } catch {
      return null;
    }
  };

  const saveAnalyticsConsent = (value) => {
    try {
      window.localStorage.setItem(ANALYTICS_CONFIG.consentKey, value);
    } catch {
      // The visitor can still use the site when browser storage is unavailable.
    }
  };

  const analyticsConsentState = (analyticsStorage = 'denied') => ({
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: analyticsStorage
  });

  const loadGoogleAnalytics = () => {
    if (IS_LOCAL || !IS_CANONICAL_ANALYTICS_HOST || googleAnalyticsReady || document.querySelector('script[data-sdk="ga4"]')) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () {
      window.dataLayer.push(arguments);
    };

    window.gtag('consent', 'default', analyticsConsentState('denied'));
    if (readAnalyticsConsent() === 'granted') {
      window.gtag('consent', 'update', analyticsConsentState('granted'));
    }

    window.gtag('js', new Date());
    window.gtag('config', ANALYTICS_CONFIG.measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });

    const googleAnalytics = document.createElement('script');
    googleAnalytics.async = true;
    googleAnalytics.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.measurementId}`;
    googleAnalytics.dataset.sdk = 'ga4';
    document.head.appendChild(googleAnalytics);
    googleAnalyticsReady = true;
  };

  const updateAnalyticsConsent = (value) => {
    const previousConsent = readAnalyticsConsent();
    saveAnalyticsConsent(value);
    clarityConsent.update(value);
    if (!googleAnalyticsReady) loadGoogleAnalytics();
    if (typeof window.gtag === 'function') {
      const analyticsGranted = value === 'granted';
      window.gtag('consent', 'update', analyticsConsentState(analyticsGranted ? 'granted' : 'denied'));
      if (analyticsGranted && previousConsent !== 'granted') {
        window.gtag('event', 'page_view', {
          page_location: window.location.href,
          page_title: document.title
        });
      }
    }
  };

  loadGoogleAnalytics();
  clarityConsent.update(readAnalyticsConsent());
  window.addEventListener('storage', (event) => {
    if (event.key === ANALYTICS_CONFIG.consentKey || event.key === null) {
      clarityConsent.update(readAnalyticsConsent());
      if (window.gtag) window.gtag('consent', 'update', analyticsConsentState(readAnalyticsConsent() === 'granted' ? 'granted' : 'denied'));
    }
  });
  window.HAIBU_CONTACT_CONFIG = CONTACT_CONFIG;
  window.HAIBU_TRACK = (name, properties = {}) => {
    clarityConsent.event(name);
    if (typeof window.va === 'function') window.va('event', { name, data: properties });
    if (googleAnalyticsReady && typeof window.gtag === 'function') window.gtag('event', name, properties);
  };
  const whatsappContext = (page || 'website').replace(/[-_]+/g, ' ');
  const whatsappMessage = `Hello HAIBUCRAFT, I am visiting the ${whatsappContext} page (${window.location.pathname}) and would like to discuss a wholesale inquiry. Please share MOQ, pricing, packing and lead time.`;
  const whatsappHref = `https://wa.me/${CONTACT_CONFIG.whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  if (!IS_LOCAL && !document.querySelector('script[data-sdk="analytics"]')) {
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

  if (!document.querySelector('meta[name="theme-color"]')) {
    const themeColor = document.createElement('meta');
    themeColor.name = 'theme-color';
    themeColor.content = '#ffffff';
    document.head.appendChild(themeColor);
  }

  const main = document.querySelector('main');
  if (main && !main.id) main.id = 'main-content';

  // Small, decorative line drawings identify navigation groups without replacing text.
  const navIconPaths = {
    home: '<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7"/>',
    products: '<rect x="3" y="3" width="7" height="7" rx="2"/><circle cx="17.5" cy="6.5" r="3.5"/><path d="m6.5 14 4 7h-8z"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    custom: '<path d="m4 20 4-1 12-12-3-3L5 16l-1 4ZM14 7l3 3M4 4h5M6.5 1.5v5"/>',
    themes: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>',
    manufacturing: '<path d="M3 21V10l6 3V9l6 4V3h5v18H3ZM7 17h1m4 0h1m4 0h1"/>',
    quality: '<path d="m12 2 8 3v6c0 5-4 8-8 11-4-3-8-6-8-11V5l8-3Z"/><path d="m8 11 3 3 5-5"/>',
    certificates: '<path d="M14 3H4v18h16V9M14 3v6h6L14 3ZM8 13h8m-8 4h5"/>',
    about: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
    blog: '<path d="M3 4h6a4 4 0 0 1 3 2 4 4 0 0 1 3-2h6v16h-6a4 4 0 0 0-3 2 4 4 0 0 0-3-2H3V4Zm9 2v16"/>'
  };
  const navIcon = (name) => `<span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" focusable="false">${navIconPaths[name]}</svg></span>`;

  const header = `
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <div class="topbar"><div class="container"><span>B2B wholesale · OEM/ODM · Private label · Export support</span><span class="topbar-contact"><a href="mailto:sales@haibucrafts.com">sales@haibucrafts.com</a><span aria-hidden="true"> · </span><a class="topbar-whatsapp" href="${whatsappHref}" target="_blank" rel="noopener noreferrer">WhatsApp</a></span></div></div>
    <header class="site-header"><div class="container navbar">
      <a class="logo" href="${ROOT}" aria-label="HAIBU home">
        <img src="/brand/haibu-logo-mobile.png" width="160" height="160" alt="">
        <span class="logo-wordmark">HAIBU</span>
      </a>
      <nav class="nav" id="primary-navigation" aria-label="Primary navigation">
        <a class="nav-home-link" href="${ROOT}">${navIcon('home')}<span>Home</span></a>
        <div class="nav-group">
          <div class="nav-product-row"><a href="${ROOT}products/">${navIcon('products')}<span>Products</span></a><button class="products-toggle" type="button" aria-expanded="false" aria-controls="product-category-navigation" aria-haspopup="true" aria-label="Open product categories"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>
          <div class="dropdown nav-catalog-menu" id="product-category-navigation">
            <div class="nav-catalog-intro"><div><span class="nav-catalog-kicker">THE HAIBU CATALOG</span><strong>Build your next assortment.</strong></div><svg class="nav-catalog-motif" viewBox="0 0 66 45" width="66" height="45" aria-hidden="true" focusable="false"><rect x="6" y="17" width="19" height="19" rx="6" fill="#cfbff2" transform="rotate(-14 15 26)"/><path d="m37 6 4 8 9 1-6 7 2 9-9-4-8 4 1-9-6-7 9-1z" fill="#f2c4d7"/><circle cx="55" cy="33" r="6" fill="#efce8e"/><circle cx="15" cy="8" r="3" fill="#cfbff2"/></svg></div>
            <a class="nav-category-card" href="${ROOT}products/slime-charms-wholesale/" aria-label="Slime Charms Wholesale"><img src="/assets/images/products/batch-2026-08/slm10008/slm10008-pastel-flower-slime-charms-01.webp" width="80" height="80" loading="lazy" decoding="async" alt=""><span><strong>Slime Charms</strong><small>Themed mixes</small></span></a>
            <a class="nav-category-card" href="${ROOT}products/polymer-clay-slices-wholesale/" aria-label="Polymer Clay Slices Wholesale"><img src="/assets/images/products/yx043-main.webp" width="80" height="80" loading="lazy" decoding="async" alt=""><span><strong>Polymer Clay</strong><small>Slices &amp; sprinkles</small></span></a>
            <a class="nav-category-card" href="${ROOT}products/resin-charms-for-slime/" aria-label="Resin Charms for Slime"><img src="/assets/images/products/batch-2026-10-13/rw1917/dessert-resin-flatback-cabochon-mix-01.jpg" width="80" height="80" loading="lazy" decoding="async" alt=""><span><strong>Resin Charms</strong><small>Flatbacks &amp; minis</small></span></a>
            <a class="nav-category-card" href="${ROOT}products/sequins-glitter-confetti/" aria-label="Sequins &amp; Glitter Confetti"><img src="/assets/images/products/holographic-hollow-star-sequins.webp" width="80" height="80" loading="lazy" decoding="async" alt=""><span><strong>Sequins &amp; Confetti</strong><small>Sparkle &amp; accents</small></span></a>
            <a class="nav-catalog-all" href="${ROOT}products/">Browse the full catalog <span aria-hidden="true">→</span></a>
          </div>
        </div>
        <div class="nav-secondary-links">
          <a href="${ROOT}custom-solutions/">${navIcon('custom')}<span>Custom Solutions</span></a>
          <a href="${ROOT}themes/">${navIcon('themes')}<span>Themes</span></a>
          <a href="${ROOT}manufacturing/">${navIcon('manufacturing')}<span>Manufacturing</span></a>
          <a href="${ROOT}quality-control/">${navIcon('quality')}<span>Quality Control</span></a>
          <a href="${ROOT}certificates/">${navIcon('certificates')}<span>Certificates</span></a>
          <a href="${ROOT}about/">${navIcon('about')}<span>About</span></a>
          <a href="${ROOT}blog/">${navIcon('blog')}<span>Blog</span></a>
        </div>
        <a class="quote-btn" href="${ROOT}request-quote/?source=${source}&landing_page=${landing}"><span>Request Quote</span><span class="nav-quote-arrow" aria-hidden="true">→</span></a>
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
          <a class="footer-email" href="mailto:sales@haibucrafts.com">sales@haibucrafts.com</a>
          <a class="footer-whatsapp" href="${whatsappHref}" target="_blank" rel="noopener noreferrer">WhatsApp: ${CONTACT_CONFIG.whatsappDisplay}</a>
          <p class="footer-note">Decorative craft components only. Not edible. Small parts may present a choking hazard.</p>
        </div>
        <div><h3>Products</h3><a href="${ROOT}products/">All Products</a><a href="${ROOT}products/slime-charms-wholesale/">Slime Charms</a><a href="${ROOT}products/polymer-clay-slices-wholesale/">Polymer Clay Slices</a><a href="${ROOT}products/resin-charms-for-slime/">Resin Charms</a><a href="${ROOT}products/sequins-glitter-confetti/">Sequins &amp; Confetti</a></div>
        <div><h3>Capabilities</h3><a href="${ROOT}custom-solutions/">Custom Solutions</a><a href="${ROOT}manufacturing/">Manufacturing &amp; Supply</a><a href="${ROOT}quality-control/">Quality Control</a><a href="${ROOT}certificates/">Certificates &amp; Reports</a><a href="${ROOT}request-quote/?source=footer-capabilities&landing_page=${landing}">Request Quote</a></div>
        <div><h3>Buyer Resources</h3><a href="${ROOT}themes/">Original Theme Library</a><a href="${ROOT}blog/">Buying Guides</a><a href="${ROOT}blog/how-to-prepare-a-wholesale-product-brief/">Product Brief Guide</a><a href="${ROOT}blog/sample-approval-checklist/">Sample Approval Guide</a><a href="${ROOT}blog/packaging-quality-checkpoints/">Packaging &amp; QC Guide</a></div>
        <div><h3>Company</h3><a href="${ROOT}about/">About HAIBUCRAFT</a><a href="${ROOT}about/#transparency">Transparency</a><a href="${ROOT}about/editorial-policy/">Editorial Policy</a><a href="${ROOT}privacy/">Privacy Policy</a><button class="footer-cookie-settings" type="button" data-cookie-settings>Cookie choices</button><a href="${ROOT}certificates/">Document Center</a><a href="${ROOT}request-quote/?source=footer-company&landing_page=${landing}">Contact Sales</a></div>
      </div>
      <div class="footer-bottom"><span>© 2026 HAIBUCRAFT. Wholesale craft supply and B2B sourcing support.</span><span>Verified claims only · No retail checkout · No blanket certification claims</span></div>
    </div></footer><a class="whatsapp-float" href="${whatsappHref}" target="_blank" rel="noopener noreferrer" aria-label="Chat with HAIBUCRAFT on WhatsApp" title="Chat with HAIBUCRAFT on WhatsApp"><span class="wa-mark" aria-hidden="true"><svg viewBox="0 0 32 32" focusable="false"><path fill="currentColor" d="M16 .8C7.7.8 1 7.5 1 15.8c0 2.7.7 5.3 2 7.5L.9 31l7.9-2.1c2.2 1.2 4.7 1.9 7.2 1.9 8.3 0 15-6.7 15-15S24.3.8 16 .8zm0 27.5c-2.3 0-4.5-.6-6.4-1.8l-.5-.3-4.7 1.2 1.3-4.5-.3-.5a12.4 12.4 0 1 1 10.6 5.9zm6.8-9.3c-.4-.2-2.2-1.1-2.6-1.2-.3-.1-.6-.2-.8.2-.3.4-1 1.2-1.2 1.4-.2.3-.4.3-.8.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.9-2.2-2.1-2.6-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.4.4-.6.1-.3 0-.5-.1-.7l-1.2-2.8c-.3-.7-.6-.6-.8-.6h-.7c-.3 0-.7.1-1 .5-.4.4-1.3 1.3-1.3 3.1 0 1.9 1.3 3.6 1.5 3.8.2.3 2.6 4 6.3 5.6.9.4 1.6.6 2.1.8.9.3 1.7.2 2.3.1.7-.1 2.2-.9 2.5-1.8.3-.9.3-1.7.2-1.8-.1-.2-.3-.3-.7-.5z"/></svg></span><span class="wa-copy"><strong>Chat with us</strong><small>WhatsApp · HAIBUCRAFT</small></span></a><button class="back-top" type="button" aria-label="Back to top" title="Back to top"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 4h14M6.5 12.5 12 7l5.5 5.5M12 7v13"/></svg></button>`;

  const headerSlot = document.querySelector('[data-site-header]');
  const footerSlot = document.querySelector('[data-site-footer]');
  if (headerSlot) headerSlot.innerHTML = header;
  if (footerSlot) footerSlot.innerHTML = footer;

  const consentBanner = document.createElement('section');
  consentBanner.className = 'analytics-consent';
  consentBanner.hidden = true;
  consentBanner.setAttribute('role', 'dialog');
  consentBanner.setAttribute('aria-labelledby', 'analytics-consent-title');
  consentBanner.setAttribute('aria-describedby', 'analytics-consent-description');
  consentBanner.innerHTML = `
    <div class="analytics-consent-copy">
      <strong id="analytics-consent-title">Help us improve HAIBUCRAFT</strong>
      <p id="analytics-consent-description">We use Google Analytics for website statistics and Microsoft Clarity for heatmaps and session replay. Analytics cookies are used only if you accept. Clarity also loads only after you accept, with inquiry form content masked. You can change your choice at any time. <a href="${ROOT}privacy/">Privacy policy</a></p>
    </div>
    <div class="analytics-consent-actions">
      <button class="btn btn-light" type="button" data-analytics-decline>Decline analytics cookies</button>
      <button class="btn btn-primary" type="button" data-analytics-accept>Accept analytics</button>
    </div>`;
  document.body.appendChild(consentBanner);

  const showConsentBanner = () => {
    consentBanner.hidden = false;
  };
  const hideConsentBanner = () => {
    consentBanner.hidden = true;
  };

  consentBanner.querySelector('[data-analytics-accept]').addEventListener('click', () => {
    updateAnalyticsConsent('granted');
    hideConsentBanner();
  });
  consentBanner.querySelector('[data-analytics-decline]').addEventListener('click', () => {
    updateAnalyticsConsent('denied');
    hideConsentBanner();
  });
  document.querySelectorAll('[data-cookie-settings]').forEach((button) => {
    button.addEventListener('click', showConsentBanner);
  });
  if (readAnalyticsConsent() === null) showConsentBanner();

  // Keep click metadata bounded to published site routes and controlled labels.
  // Never send query strings, fragments, link text or inquiry form values.
  const ANALYTICS_LINK_LOCATIONS = new Set([
    'homepage_hero', 'homepage_categories', 'homepage_featured', 'homepage_buying_paths',
    'homepage_supply', 'homepage_evidence', 'homepage_final', 'header', 'footer', 'main', 'site'
  ]);
  const analyticsLinkLocation = (link) => {
    const declared = link.closest('[data-analytics-location]')?.getAttribute('data-analytics-location');
    if (ANALYTICS_LINK_LOCATIONS.has(declared)) return declared;
    if (link.closest('header, [data-site-header]')) return 'header';
    if (link.closest('footer, [data-site-footer]')) return 'footer';
    return link.closest('main') ? 'main' : 'site';
  };
  // Preserve the leading zeros of this published source code.
  const additionalPublishedProductCodes = ['RW0020648'];
  const analyticsProductCode = (value) => {
    const code = typeof value === 'string' ? value.trim().toUpperCase() : '';
    if (additionalPublishedProductCodes.includes(code)) return code;
    return /^(?:MA|RW004469\/CDK004469|YX3092\/YX3093\/YX3094\/YX3095|RX268|RX327|RW0020841|RW203-RW564-RW21165|YZ26165|RW0024876|RW0024009|RW26057-2|RW0026057-1|YX097-YX284|YX3084-YX3087-YX3089-YX3103-YX3112-YX3115|SHK26189|SLM10009-1|SLM(?:\d{3,5}|-RX488)|YX\d{3,4}|RW337\/285|RW3895-RW3857|RW\d{3,6}(?:-C|-YX\d{3,4})?|MA\d{3,4}|YM\d{3})(?:\/RW\d{3,6}){0,3}$/.test(code) ? code : '';
  };
  const analyticsPathProductCode = (pathname) => {
    // Product slugs begin with their catalog code, including the resin mix.
    const slug = pathname.split('/').filter(Boolean).pop() || '';
    const additionalCode = additionalPublishedProductCodes.find((code) => {
      const prefix = code.toLowerCase();
      return slug.toLowerCase() === prefix || slug.toLowerCase().startsWith(prefix + '-');
    });
    if (additionalCode) return additionalCode;
    if (/^rw004469-cdk004469(?:-|$)/i.test(slug)) return 'RW004469/CDK004469';
    if (/^yx3092-yx3093-yx3094-yx3095(?:-|$)/i.test(slug)) return 'YX3092/YX3093/YX3094/YX3095';
    if (/^rx268(?:-|$)/i.test(slug)) return "RX268";
    if (/^rx327(?:-|$)/i.test(slug)) return 'RX327';
    if (/^rw203-rw564-rw21165(?:-|$)/i.test(slug)) return 'RW203-RW564-RW21165';
    if (/^yz26165(?:-|$)/i.test(slug)) return 'YZ26165';
    if (/^rw0020841(?:-|$)/i.test(slug)) return 'RW0020841';
    if (/^rw0024876(?:-|$)/i.test(slug)) return 'RW0024876';
    if (/^rw0024009(?:-|$)/i.test(slug)) return 'RW0024009';
    if (/^rw26057-2(?:-|$)/i.test(slug)) return 'RW26057-2';
    if (/^rw0026057-1(?:-|$)/i.test(slug)) return 'RW0026057-1';
    if (/^yx097-yx284(?:-|$)/i.test(slug)) return 'YX097-YX284';
    if (/^yx3084-yx3087-yx3089-yx3103-yx3112-yx3115(?:-|$)/i.test(slug)) return 'YX3084-YX3087-YX3089-YX3103-YX3112-YX3115';
    if (/^ma-christmas-snowflake-craft-sequins(?:-|$)/i.test(slug)) return 'MA';
    if (/^slm-rx488(?:-|$)/i.test(slug)) return 'SLM-RX488';
    if (/^slm10009-1(?:-|$)/i.test(slug)) return 'SLM10009-1';
    if (/^shk26189(?:-|$)/i.test(slug)) return 'SHK26189';
    if (/^rw3895-rw3857(?:-|$)/i.test(slug)) return 'RW3895-RW3857';
    if (/^rw337-285(?:-|$)/i.test(slug)) return 'RW337/285';
    const prefix = slug.match(/^((?:rw\d{3,6}-(?:c|yx\d{3,4})|(?:slm|yx|rw|ma|ym)\d{3,6})(?:-rw\d{3,6}){0,3})(?:-|$)/i)?.[1];
    return analyticsProductCode(prefix?.replace(/-(?=rw\d)/gi, '/'));
  };
  const analyticsClickProductCode = (link, target) => {
    const candidates = [link.getAttribute('data-product-code')];
    for (const key of ['product_code', 'sku']) {
      const values = target.searchParams.getAll(key);
      if (values.length === 1) candidates.push(values[0]);
    }
    if (/\/products\//.test(target.pathname)) candidates.push(analyticsPathProductCode(target.pathname));
    return candidates.map(analyticsProductCode).find(Boolean) || '';
  };

  document.addEventListener('click', (event) => {
    const link = event.target?.closest?.('a[href]') || event.target?.parentElement?.closest?.('a[href]');
    if (!link) return;
    const href = (link.getAttribute('href') || '').trim();
    if (!href || /^[?#]/.test(href)) return;
    let target;
    try {
      target = new URL(href, window.location.href);
    } catch {
      return;
    }
    // Credentials and unrecognized schemes are never analytics destinations.
    if (target.username || target.password || !['https:', 'http:', 'mailto:'].includes(target.protocol)) return;
    const isSiteLink = ['https:', 'http:'].includes(target.protocol) &&
      (target.origin === window.location.origin || /^(www\.)?haibucrafts\.com$/i.test(target.hostname));
    const route = target.pathname;
    let name = '';
    if (target.hostname === 'wa.me') name = 'whatsapp_click';
    else if (target.protocol === 'mailto:') name = 'email_click';
    else if (isSiteLink && /^\/(?:v2-preview\/)?(?:request-quote|quote)\/?$/.test(route)) name = 'quote_cta_click';
    else if (isSiteLink && /^\/(?:v2-preview\/)?themes\//.test(route)) name = 'theme_link_click';
    else if (isSiteLink && /^\/(?:v2-preview\/)?products(?:\/[a-z0-9-]+)*\/?$/.test(route)) name = 'product_link_click';
    if (!name) return;
    const targetUrl = target.protocol === 'mailto:' ? 'mailto:' : `${target.origin}${route}`;
    const properties = { page: window.location.pathname, destination: targetUrl.slice(0, 180) };
    if (name === 'product_link_click' || name === 'quote_cta_click') {
      properties.target_url = targetUrl;
      properties.link_location = analyticsLinkLocation(link);
      const productCode = analyticsClickProductCode(link, target);
      if (productCode) properties.product_code = productCode;
    }
    window.HAIBU_TRACK(name, properties);
  });

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

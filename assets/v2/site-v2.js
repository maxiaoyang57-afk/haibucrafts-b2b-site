(() => {
  // Preserve the first external acquisition touch across internal navigation.
  // Product pages use this v2 runtime, so the external referrer must be stored
  // before the buyer clicks through to /request-quote/.
  const ATTRIBUTION_SESSION_KEY = 'haibu_inquiry_attribution_v2';

  const cleanAttributionValue = (value, maxLength = 500) =>
    String(value || '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLength);

  const normalizeHostname = (value) =>
    String(value || '').toLowerCase().replace(/^www\./, '');

  const getExternalReferrer = () => {
    const referrer = cleanAttributionValue(document.referrer, 500);
    if (!referrer) return '';
    try {
      const refHost = normalizeHostname(new URL(referrer).hostname);
      const currentHost = normalizeHostname(window.location.hostname);
      return refHost && refHost !== currentHost ? referrer : '';
    } catch {
      return '';
    }
  };

  const classifyFirstTouch = (params, externalReferrer) => {
    const utmSource = cleanAttributionValue(params.get('utm_source'), 120).toLowerCase();
    const utmMedium = cleanAttributionValue(params.get('utm_medium'), 80).toLowerCase();
    if (utmSource) {
      const paid = /(cpc|ppc|paid|display|social|ads?)/.test(utmMedium);
      return {
        attribution_source: utmSource,
        attribution_medium: utmMedium || 'campaign',
        attribution_channel: paid ? 'Paid Campaign' : 'Campaign'
      };
    }

    if (params.get('gclid') || params.get('wbraid') || params.get('gbraid')) {
      return { attribution_source: 'google', attribution_medium: 'cpc', attribution_channel: 'Paid Search' };
    }
    if (params.get('msclkid')) {
      return { attribution_source: 'bing', attribution_medium: 'cpc', attribution_channel: 'Paid Search' };
    }

    let hostname = '';
    try {
      hostname = externalReferrer ? normalizeHostname(new URL(externalReferrer).hostname) : '';
    } catch {
      hostname = '';
    }

    if (!hostname) return { attribution_source: 'direct', attribution_medium: 'none', attribution_channel: 'Direct' };
    if (/(^|\.)google\./.test(hostname)) return { attribution_source: 'google', attribution_medium: 'organic', attribution_channel: 'Organic Search' };
    if (hostname === 'bing.com' || hostname.endsWith('.bing.com')) return { attribution_source: 'bing', attribution_medium: 'organic', attribution_channel: 'Organic Search' };
    if (hostname === 'chatgpt.com' || hostname.endsWith('.chatgpt.com') || hostname === 'chat.openai.com') return { attribution_source: 'chatgpt', attribution_medium: 'referral', attribution_channel: 'AI Referral' };
    if (hostname === 'perplexity.ai' || hostname.endsWith('.perplexity.ai')) return { attribution_source: 'perplexity', attribution_medium: 'referral', attribution_channel: 'AI Referral' };
    if (hostname === 'copilot.microsoft.com') return { attribution_source: 'copilot', attribution_medium: 'referral', attribution_channel: 'AI Referral' };
    if (hostname === 'gemini.google.com') return { attribution_source: 'gemini', attribution_medium: 'referral', attribution_channel: 'AI Referral' };
    if (hostname === 'claude.ai' || hostname.endsWith('.claude.ai')) return { attribution_source: 'claude', attribution_medium: 'referral', attribution_channel: 'AI Referral' };
    if (hostname === 'poe.com' || hostname.endsWith('.poe.com')) return { attribution_source: 'poe', attribution_medium: 'referral', attribution_channel: 'AI Referral' };
    if (hostname === 'you.com' || hostname.endsWith('.you.com')) return { attribution_source: 'you.com', attribution_medium: 'referral', attribution_channel: 'AI Referral' };
    if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com') || hostname === 'youtu.be') return { attribution_source: 'youtube', attribution_medium: 'referral', attribution_channel: 'Social / Video Referral' };
    return { attribution_source: hostname, attribution_medium: 'referral', attribution_channel: 'Referral' };
  };

  const readFirstTouchAttribution = () => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(ATTRIBUTION_SESSION_KEY) || 'null');
      if (saved && typeof saved === 'object' && saved.attribution_source) return saved;
    } catch {
      // Continue with page-level attribution when session storage is unavailable.
    }

    const params = new URLSearchParams(window.location.search);
    const externalReferrer = getExternalReferrer();
    const firstTouch = {
      ...classifyFirstTouch(params, externalReferrer),
      attribution_campaign: cleanAttributionValue(params.get('utm_campaign'), 160),
      attribution_content: cleanAttributionValue(params.get('utm_content'), 160),
      attribution_term: cleanAttributionValue(params.get('utm_term'), 160),
      first_landing_page: cleanAttributionValue(window.location.pathname, 300) || '/',
      first_referrer: externalReferrer || 'Not provided',
      first_visit_at: new Date().toISOString()
    };

    try {
      sessionStorage.setItem(ATTRIBUTION_SESSION_KEY, JSON.stringify(firstTouch));
    } catch {
      // The current page still exposes the first-touch object below.
    }
    return firstTouch;
  };

  window.HAIBU_ATTRIBUTION = readFirstTouchAttribution();

  const normalizePath = (value) => {
    const path = value || '/';
    return path.endsWith('/') ? path : `${path}/`;
  };

  const currentPath = normalizePath(window.location.pathname);
  const navLinks = [...document.querySelectorAll('.nav a[href]')];
  let bestMatch = null;

  navLinks.forEach((link) => {
    const linkPath = normalizePath(new URL(link.href, window.location.origin).pathname);
    const isHome = linkPath === '/';
    const matches = isHome ? currentPath === linkPath : currentPath.startsWith(linkPath);
    if (matches && (!bestMatch || linkPath.length > bestMatch.path.length)) bestMatch = { link, path: linkPath };
  });

  if (bestMatch) {
    bestMatch.link.classList.add('active');
    bestMatch.link.setAttribute('aria-current', 'page');
    bestMatch.link.closest('.nav-group')?.classList.add('active-section');
  }

  const menuButton = document.querySelector('.menu-btn');
  const nav = document.querySelector('.nav');
  const closeMenu = ({ restoreFocus = false } = {}) => {
    if (!menuButton || !nav) return;
    const wasOpen = nav.classList.contains('open');
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
    if (wasOpen) closeProducts();
    if (restoreFocus && wasOpen) menuButton.focus();
  };

  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (!open) closeProducts();
    });
    nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  }

  const productToggle = document.querySelector('.products-toggle');
  const navGroup = productToggle?.closest('.nav-group');
  const closeProducts = ({ restoreFocus = false } = {}) => {
    if (!productToggle || !navGroup) return;
    const wasOpen = navGroup.classList.contains('dropdown-open');
    navGroup.classList.remove('dropdown-open');
    productToggle.setAttribute('aria-expanded', 'false');
    productToggle.setAttribute('aria-label', 'Open product categories');
    if (restoreFocus && wasOpen) productToggle.focus();
  };

  if (productToggle && navGroup) {
    productToggle.addEventListener('click', (event) => {
      event.preventDefault();
      const open = navGroup.classList.toggle('dropdown-open');
      productToggle.setAttribute('aria-expanded', String(open));
      productToggle.setAttribute('aria-label', open ? 'Close product categories' : 'Open product categories');
    });
    document.addEventListener('click', (event) => {
      if (!navGroup.contains(event.target)) closeProducts();
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (navGroup?.classList.contains('dropdown-open')) closeProducts({ restoreFocus: true });
      else closeMenu({ restoreFocus: true });
    }
  });

  const backTop = document.querySelector('.back-top');
  if (backTop) {
    const update = () => backTop.classList.toggle('show', window.scrollY > 500);
    window.addEventListener('scroll', update, { passive: true });
    update();
    backTop.addEventListener('click', () => {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }
})();

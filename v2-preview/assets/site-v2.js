(() => {
  const normalizePath = (value) => {
    const path = value || '/';
    return path.endsWith('/') ? path : `${path}/`;
  };

  const currentPath = normalizePath(window.location.pathname);
  const navLinks = [...document.querySelectorAll('.nav a[href]')];
  let bestMatch = null;

  navLinks.forEach((link) => {
    const linkPath = normalizePath(new URL(link.href, window.location.origin).pathname);
    const isHome = linkPath === '/v2-preview/';
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
    if (restoreFocus && wasOpen) menuButton.focus();
  };

  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
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
    if (restoreFocus && wasOpen) productToggle.focus();
  };

  if (productToggle && navGroup) {
    productToggle.addEventListener('click', (event) => {
      event.preventDefault();
      const open = navGroup.classList.toggle('dropdown-open');
      productToggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (event) => {
      if (!navGroup.contains(event.target)) closeProducts();
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu({ restoreFocus: true });
      closeProducts({ restoreFocus: true });
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

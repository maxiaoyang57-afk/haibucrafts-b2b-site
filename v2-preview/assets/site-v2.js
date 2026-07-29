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
  const closeMenu = () => {
    if (!menuButton || !nav) return;
    nav.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open menu');
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
  const closeProducts = () => {
    if (!productToggle || !navGroup) return;
    navGroup.classList.remove('dropdown-open');
    productToggle.setAttribute('aria-expanded', 'false');
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
      closeMenu();
      closeProducts();
    }
  });

  const backTop = document.querySelector('.back-top');
  if (backTop) {
    const update = () => backTop.classList.toggle('show', window.scrollY > 500);
    window.addEventListener('scroll', update, { passive: true });
    update();
    backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
})();

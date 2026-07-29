(() => {
  const menuButton = document.querySelector('.menu-btn');
  const nav = document.querySelector('.nav');
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
    });
  }

  const productToggle = document.querySelector('.products-toggle');
  const navGroup = productToggle?.closest('.nav-group');
  if (productToggle && navGroup) {
    productToggle.addEventListener('click', (event) => {
      event.preventDefault();
      const open = navGroup.classList.toggle('dropdown-open');
      productToggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (event) => {
      if (!navGroup.contains(event.target)) {
        navGroup.classList.remove('dropdown-open');
        productToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const backTop = document.querySelector('.back-top');
  if (backTop) {
    const update = () => backTop.classList.toggle('show', window.scrollY > 500);
    window.addEventListener('scroll', update, { passive: true });
    update();
    backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
})();

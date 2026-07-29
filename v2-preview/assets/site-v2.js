(() => {
  const menuButton = document.querySelector('.menu-btn');
  const nav = document.querySelector('.nav');
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', String(open));
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

(() => {
  const menu = document.querySelector('.journal-menu');
  const nav = document.querySelector('.journal-nav');
  if (menu && nav) {
    menu.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      menu.setAttribute('aria-expanded', String(open));
    });
  }

  const filterButtons = [...document.querySelectorAll('[data-topic-filter]')];
  const cards = [...document.querySelectorAll('[data-topic]')];
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.topicFilter || 'all';
      filterButtons.forEach(item => item.classList.toggle('is-active', item === button));
      cards.forEach(card => {
        const visible = filter === 'all' || card.dataset.topic === filter;
        card.hidden = !visible;
      });
    });
  });

  const backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    const syncVisibility = () => backToTop.classList.toggle('is-visible', window.scrollY > 480);
    window.addEventListener('scroll', syncVisibility, { passive: true });
    syncVisibility();
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }
})();

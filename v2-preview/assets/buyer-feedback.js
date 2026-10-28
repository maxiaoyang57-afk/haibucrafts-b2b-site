/* Give buyer stories clear reading space; contact remains available in the header and section CTA. */
(() => {
  const feedback = document.getElementById('buyer-feedback');
  if (!feedback || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(([entry]) => {
    document.body.classList.toggle('is-reading-feedback', entry.isIntersecting);
  }, { rootMargin: '-90px 0px -40px 0px' });
  observer.observe(feedback);
})();

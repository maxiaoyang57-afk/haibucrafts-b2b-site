(() => {
  const galleries = document.querySelectorAll('[data-product-gallery]');

  galleries.forEach((gallery) => {
    const mainImage = gallery.querySelector('[data-product-gallery-main]');
    const thumbs = [...gallery.querySelectorAll('[data-product-gallery-thumb]')];
    if (!mainImage || !thumbs.length) return;

    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => {
        const src = thumb.getAttribute('data-src');
        const alt = thumb.getAttribute('data-alt');
        if (!src) return;

        mainImage.src = src;
        if (alt) mainImage.alt = alt;

        thumbs.forEach((item) => item.setAttribute('aria-current', 'false'));
        thumb.setAttribute('aria-current', 'true');
      });
    });
  });
})();

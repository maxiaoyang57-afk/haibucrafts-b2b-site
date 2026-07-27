(() => {
  const assets = {
    'tiny-worlds-big-ideas': '/assets/images/blog/tiny-worlds-big-ideas.webp',
    'beyond-the-quote': '/assets/images/blog/beyond-the-quote.webp',
    'global-craft-supply-blueprint': '/assets/images/blog/global-craft-supply-blueprint.webp',
    'wholesale-slime-charms-sourcing-guide': '/assets/images/blog/wholesale-slime-charms-sourcing-guide.webp',
    'from-sketch-to-shelf': '/assets/images/blog/from-sketch-to-shelf.webp'
  };

  function currentFile() {
    const queryFile = new URLSearchParams(window.location.search).get('file');
    if (queryFile) return decodeURIComponent(queryFile).replace(/^\/+/, '');
    const pathname = window.location.pathname.replace(/^\/+/, '');
    if (!pathname || pathname.endsWith('/')) return `${pathname}index.html`;
    return pathname;
  }

  function updateShareImage(asset) {
    const absolute = new URL(asset, window.location.origin).href;
    const ogImage = document.querySelector('meta[property="og:image"]');
    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (ogImage) ogImage.setAttribute('content', absolute);
    if (twitterImage) twitterImage.setAttribute('content', absolute);
  }

  function applyBlogImages() {
    const file = currentFile();

    if (file === 'blog/index.html') {
      Object.entries(assets).forEach(([slug, asset]) => {
        const link = document.querySelector(`a[href*="${slug}.html"]`);
        const card = link?.closest('.editorial-card');
        const image = card?.querySelector('img');
        if (image) {
          image.src = asset;
          image.loading = card.matches(':first-child') ? 'eager' : 'lazy';
          image.decoding = 'async';
        }
      });
      updateShareImage(assets['tiny-worlds-big-ideas']);
      return;
    }

    const slug = file.split('/').pop()?.replace(/\.html$/i, '');
    const asset = assets[slug];
    const image = document.querySelector('.article-hero-image');
    if (asset && image) {
      image.src = asset;
      image.loading = 'eager';
      image.decoding = 'async';
      updateShareImage(asset);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyBlogImages, { once: true });
  } else {
    applyBlogImages();
  }
})();

import blogReplica from './blog-replica.js';

const FILES = [
  'blog/index.html',
  'blog/story-driven-slime-charm-collection-ideas/index.html',
  'blog/customer-first-craft-supply-service/index.html',
  'blog/haibucraft-global-craft-supply-blueprint/index.html',
  'blog/wholesale-slime-charms-sourcing-guide/index.html',
  'blog/custom-slime-charms-oem-process/index.html',
  'assets/css/haibucraft-blog-original.css',
  'assets/js/haibucraft-blog-original.js'
];

function captureResponse() {
  const headers = new Map();
  let body = '';
  return {
    statusCode: 200,
    setHeader(name, value) { headers.set(String(name).toLowerCase(), value); },
    getHeader(name) { return headers.get(String(name).toLowerCase()); },
    end(chunk = '') { if (chunk !== undefined && chunk !== null) body += String(chunk); },
    snapshot() { return { statusCode: this.statusCode, headers, body }; }
  };
}

async function fetchBundleFile(file) {
  const response = captureResponse();
  await blogReplica({ method: 'GET', query: { file } }, response);
  return response.snapshot();
}

export default async function handler(_req, res) {
  const results = {};
  for (const file of FILES) results[file] = await fetchBundleFile(file);

  const home = results['blog/index.html'].body;
  const creative = results['blog/story-driven-slime-charm-collection-ideas/index.html'].body;
  const css = results['assets/css/haibucraft-blog-original.css'].body;
  const js = results['assets/js/haibucraft-blog-original.js'].body;

  const expectedHomeCopy = [
    'Ideas, sourcing guidance and better ways to build.',
    'Tiny Worlds, Big Ideas: How Story-Driven Slime Charm Collections Help Creators Stand Out',
    'Beyond the Quote: What Customer-First Craft Supply Service Looks Like',
    'From Yiwu to Creative Brands Worldwide: HAIBUCRAFT’s Blueprint for Responsible Growth',
    'How to Source Slime Charms for Wholesale: A Buyer’s Quality, Safety and Packaging Checklist',
    'From Sketch to Shelf: A Practical OEM Process for Custom Slime Charms'
  ];

  const expectedCreativeSections = [
    'Start With a Feeling, Not a Product List',
    'Build a Collection With Roles',
    'Five Fresh Worlds Creators Can Explore',
    'Design for the Jar, the Camera and the Customer',
    'Create a Repeatable Visual Signature',
    'Move From Moodboard to Approved Assortment',
    'Creativity Becomes Stronger When the System Is Clear'
  ];

  const checks = {
    allFilesStatus200: FILES.every(file => results[file].statusCode === 200),
    replicaHeaderPresent: FILES.every(file => results[file].headers.get('x-haibu-blog-replica') === 'browser-export-v1'),
    originalHomeCopy: expectedHomeCopy.every(text => home.includes(text)),
    originalHomeStructure: ['site-header', 'blog-hero', 'featured', 'publishing-standard', 'inquiry-section', 'site-footer'].every(name => home.includes(name)),
    originalCreativeArticle: expectedCreativeSections.every(text => creative.includes(text)),
    originalCss: ['.site-header', '.blog-hero', '.featured', '.article-page', '.back-to-top'].every(selector => css.includes(selector)),
    originalInteractions: ['category', 'back-to-top'].every(token => js.includes(token)),
    originalSlugs: [
      '/blog/story-driven-slime-charm-collection-ideas/',
      '/blog/customer-first-craft-supply-service/',
      '/blog/haibucraft-global-craft-supply-blueprint/',
      '/blog/wholesale-slime-charms-sourcing-guide/',
      '/blog/custom-slime-charms-oem-process/'
    ].every(route => home.includes(route)),
    noSavedExtensionArtifacts: !/wps_ai_link|chrome-extension:|moz-extension:|<iframe/i.test(home),
    cssUsesOriginalArtwork: css.includes("url('/api/blog-sprite')")
  };

  const passed = Object.values(checks).every(Boolean);
  res.statusCode = passed ? 200 : 500;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({
    passed,
    bundleFiles: FILES.map(file => ({ file, status: results[file].statusCode, bytes: Buffer.byteLength(results[file].body) })),
    checks
  }));
}

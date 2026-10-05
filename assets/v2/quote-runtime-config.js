const IS_HAIBU_PRODUCTION_HOST = /^(www\.)?haibucrafts\.com$/i.test(window.location.hostname);
window.HAIBU_QUOTE_CONFIG = Object.freeze({
  mode: IS_HAIBU_PRODUCTION_HOST ? 'live' : 'validation-only',
  endpoint: '/api/inquiry',
  enableReferenceUploads: true,
  maxReferenceImages: 4
});

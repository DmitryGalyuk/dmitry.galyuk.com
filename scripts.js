function getLangFromDomain() {
  const host = window.location.hostname;
  // en.galyuk.com for English, galyuk.com for Russian
  if (/^en\./.test(host)) return 'en';
  return 'ru';
}
function applyTranslations(lang) {
  document.querySelectorAll('[data-' + lang + ']')
    .forEach(el => {
      el.textContent = el.getAttribute('data-' + lang);
    });
}
document.addEventListener('DOMContentLoaded', function() {
  const lang = getLangFromDomain();
  applyTranslations(lang);
});

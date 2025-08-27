
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

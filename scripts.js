// Google Analytics language-sensitive loader
function getAnalyticsIdForLang(lang) {
  // Map language to GA ID
  // Example: English and Russian, add more as needed
  if (lang === 'en') return 'G-0C1BGJ3HC2';
  if (lang === 'ru') return 'G-XXXXXXXXXXX'; // Replace with your RU property ID
  return 'G-0C1BGJ3HC2'; // fallback
}

function loadGoogleAnalytics(lang) {
  var gaId = getAnalyticsIdForLang(lang);
  if (!gaId) return;
  // Inject gtag.js script
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(gaId);
  document.head.appendChild(script);
  // gtag config
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', gaId);
}

document.addEventListener('DOMContentLoaded', function () {
  var lang = (typeof getLangFromDomain === 'function') ? getLangFromDomain() : 'en';
  loadGoogleAnalytics(lang);
});
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

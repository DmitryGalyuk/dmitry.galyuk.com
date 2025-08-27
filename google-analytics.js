const domainGaID = {
  'galyuk.com': 'G-0C1BGJ3HC2',
  'en.galyuk.com': 'G-E1RDPR22V5',
  'elena.galyuk.com': 'G-6BL7RMBY9E',
};

document.addEventListener('DOMContentLoaded', function () {
  const gaId = domainGaID[window.location.hostname];
  
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

});
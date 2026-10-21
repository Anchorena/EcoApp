(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker
        .register('./service-worker.js?v=20261021-1', { updateViaCache: 'none' })
        .then(function (registration) {
          registration.update().catch(function () {});
        })
        .catch(function (err) {
          console.warn('Service worker no registrado:', err);
        });
    });
  }
})();

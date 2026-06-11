window.SMARTSCHOOLHUB_RUNTIME_CONFIG = Object.assign({
  workerUrl: 'https://smartschoolhub-skkiandongo.g-95272556.workers.dev',
  googleClientId: '553204925712-qolkihf8jsmeash2ionto7035b352meh.apps.googleusercontent.com',
  googleAuthUrl: 'https://smartschoolhub-google-oauth.g-95272556.workers.dev',
  netlifySiteUrl: 'https://xbasmarthub.netlify.app',

  /* Splash Perasmian
     launchDate  : Tarikh mula splash perasmian dipaparkan (YYYY-MM-DD).
                   Sebelum tarikh ini, splash tidak akan muncul langsung.
     gbName      : Override nama GB (kosongkan untuk auto dari data guru).
                   Hierarki: gbName di sini -> AMARAN_CFG_GB (localStorage)
                             -> getGuruBesarNameFromData() [jawatan=Guru Besar]
                             -> profil log masuk (fallback terakhir).
     appVersion  : Versi app yang dipaparkan pada splash.
     splashIdleMs : Tempoh idle sebelum butang rasmikan aktif (ms).
     splashAudioSrc : Fail audio latar untuk splash perasmian.
  */
  launchDate : '2026-06-08',
  gbName     : '',
  splashIdleMs : 6000,
  splashAudioSrc : 'assets/splash-launch-ceremonial.mp3',
  appVersion : '2.0'
}, window.SMARTSCHOOLHUB_RUNTIME_CONFIG || {});

/* ── Service Worker ─────────────────────────────────────────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('./service-worker.js').catch(function(err) {
      console.warn('Pendaftaran service worker gagal:', err);
    });
  });
}

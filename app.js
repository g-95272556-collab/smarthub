// ═══════════════════════════════════════════════════════════════
// SMART SCHOOL HUB v2.0 — SK Kiandongo
// app.js — Main Application JavaScript
// ═══════════════════════════════════════════════════════════════

const DEFAULT_GOOGLE_CLIENT_ID = '553204925712-p975t8hnehd4vfhs3igf4ba9c63edf0f.apps.googleusercontent.com';
const DEFAULT_GOOGLE_AUTH_URL = 'https://smartschoolhub-google-oauth.g-95272556.workers.dev';

function getRuntimeConfig() {
  if (typeof window === 'undefined') return {};
  const cfg = window.SMARTSCHOOLHUB_RUNTIME_CONFIG;
  return cfg && typeof cfg === 'object' ? cfg : {};
}

function getQueryParamValue(keys) {
  if (typeof window === 'undefined' || !window.location || !window.location.search) return '';
  const params = new URLSearchParams(window.location.search);
  for (let i = 0; i < keys.length; i++) {
    const value = String(params.get(keys[i]) || '').trim();
    if (value) return value;
  }
  return '';
}

function normalizeConfigUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    return new URL(raw).toString().replace(/\/+$/, '');
  } catch {
    return '';
  }
}

function normalizeGoogleClientId(value) {
  return String(value || '').trim();
}

function resolveInitialWorkerUrl() {
  const queryValue = normalizeConfigUrl(getQueryParamValue(['workerUrl', 'worker']));
  if (queryValue) return queryValue;
  const storedValue = normalizeConfigUrl(localStorage.getItem('ssh_worker_url'));
  if (storedValue) return storedValue;
  const runtime = getRuntimeConfig();
  return normalizeConfigUrl(runtime.workerUrl || runtime.workerURL || '');
}

function resolveInitialGoogleClientId() {
  const queryValue = normalizeGoogleClientId(getQueryParamValue(['googleClientId', 'clientId']));
  if (queryValue) return queryValue;
  const storedValue = normalizeGoogleClientId(localStorage.getItem('ssh_google_client_id'));
  if (storedValue) return storedValue;
  const runtime = getRuntimeConfig();
  return normalizeGoogleClientId(runtime.googleClientId || runtime.google_client_id || DEFAULT_GOOGLE_CLIENT_ID);
}

function resolveInitialGoogleAuthUrl() {
  const queryValue = normalizeConfigUrl(getQueryParamValue(['googleAuthUrl', 'authUrl']));
  if (queryValue) return queryValue;
  const storedValue = normalizeConfigUrl(localStorage.getItem('ssh_google_auth_url'));
  if (storedValue) return storedValue;
  const runtime = getRuntimeConfig();
  return normalizeConfigUrl(runtime.googleAuthUrl || runtime.google_auth_url || DEFAULT_GOOGLE_AUTH_URL);
}

function getCurrentOriginBaseUrl() {
  if (typeof window === 'undefined' || !window.location || !window.location.origin) return '';
  const protocol = String(window.location.protocol || '').toLowerCase();
  if (protocol !== 'http:' && protocol !== 'https:') return '';
  return normalizeConfigUrl(window.location.origin);
}

function buildGoogleAuthBaseUrlCandidates() {
  const candidates = [];
  const pushCandidate = (value) => {
    const normalized = normalizeConfigUrl(value);
    if (!normalized || candidates.includes(normalized)) return;
    candidates.push(normalized);
  };
  pushCandidate(getCurrentOriginBaseUrl());
  pushCandidate(APP.googleAuthUrl);
  pushCandidate(APP.workerUrl);
  return candidates;
}

// ── STATE ──────────────────────────────────────────────────────
const APP = {
  user: null,
  workerUrl: resolveInitialWorkerUrl(),
  googleClientId: resolveInitialGoogleClientId(),
  googleAuthUrl: resolveInitialGoogleAuthUrl(),
  notifLog: JSON.parse(localStorage.getItem('ssh_notif_log') || '[]'),
  pwa: {
    installPrompt: null,
    registration: null,
    updateReady: false,
    installed: false,
    refreshing: false
  },
  d1Editor: {
    sheetKey: 'GURU',
    rows: [],
    draftRestored: false,
    draftDirty: false,
    lastDraftSavedAt: 0,
    lastServerSavedAt: 0
  }
};

const GEO = {
  lat: 5.3055655, lng: 116.9633906, radius: 200,
  jamHadir: 7, minHadir: 0,
  jamLewat: 7, minLewat: 30,
  jamTidak: 8, minTidak: 0,
  gbTel: '',
  pkTel: '',
};

const BULAN = ['','Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

let _gsiReady = false;
let _gsiScriptRequested = false;
let _domReady = false;
let _geoProfile = null;
let _authInitializedClientId = '';
let _gsiButtonRenderedClientId = '';
let _storedSessionRestoreAttempted = false;
let _birthdayHydrationPromise = null;
let _birthdayHydratedOnce = false;
let geoCoords = null;
let hlData = normalizeStoredHLData(JSON.parse(localStorage.getItem('ssh_hl_data') || '[]'));
let hlConfig = JSON.parse(localStorage.getItem('ssh_hl_config') || 'null') || {
  tgBot: '',
  tgChat: '',
  tgTopic: '',
  fonnteGroup: ''
};
let _guruData = [];
let _muridData = [];
let _guruFiltered = [];
let _muridFiltered = [];
let _muridCache = {};
let _autoHadirBusy = false;
let _autoPunchOutBusy = false;
let _laporanBertugasUiBound = false;
let currentAutoRefreshInterval = null;
let _d1EditorDraftTimer = null;
const OPR_IMAGE_MIN_COUNT = 6;
const OPR_IMAGE_MAX_COUNT = 6;
let _oprImageItems = [];
let _oprImageTargetIndex = -1;
let _d1EditorDraftBound = false;
let _kokumDraftTimer = null;
let _kokumProgramConfig = null;
let _backendConfigCache = null;
let _adminEmails = [];
let _currentModuleId = '';
let _kehadiranGuruLoading = false;
let _kehadiranMuridLoading = false;

const ATTENDANCE_LIVE_REFRESH_MS = 30000;
const MOBILE_NAV_BREAKPOINT = 900;

function isMobileViewport() {
  return typeof window !== 'undefined' && window.innerWidth <= MOBILE_NAV_BREAKPOINT;
}

function updateMobileNavTitle(moduleId) {
  var titleEl = document.getElementById('mobileNavTitle');
  if (!titleEl) return;
  var activeBtn = null;
  if (moduleId) {
    activeBtn = Array.from(document.querySelectorAll('.nav-item')).find(function(btn) {
      var handler = btn.getAttribute('onclick') || '';
      return handler.indexOf("'" + moduleId + "'") !== -1 || handler.indexOf('"' + moduleId + '"') !== -1;
    });
  }
  if (!activeBtn) activeBtn = document.querySelector('.nav-item.active');
  var labels = activeBtn ? activeBtn.querySelectorAll('span') : [];
  var text = labels && labels.length ? labels[labels.length - 1].textContent : '';
  titleEl.textContent = text || 'Smart School Hub';
}

function setMobileNavOpen(isOpen) {
  var appPage = document.getElementById('appPage');
  var toggleBtn = document.querySelector('.mobile-nav-toggle');
  if (!appPage) return;
  
  var shouldOpen = !!isOpen;
  appPage.classList.toggle('mobile-nav-open', shouldOpen);
  document.body.classList.toggle('mobile-nav-open', shouldOpen);
  if (toggleBtn) toggleBtn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
}

function closeMobileNav() {
  setMobileNavOpen(false);
}

function toggleMobileNav() {
  var appPage = document.getElementById('appPage');
  if (!appPage) return;
  setMobileNavOpen(!appPage.classList.contains('mobile-nav-open'));
}

function toggleDesktopNav() {
  var sidebar = document.getElementById('appSidebar');
  var appLayout = document.querySelector('.app-layout');
  if (sidebar) sidebar.classList.toggle('collapsed');
  if (appLayout) appLayout.classList.toggle('collapsed');
}

function syncResponsiveAppChrome() {
  updateMobileNavTitle(_currentModuleId);
  if (!isMobileViewport()) closeMobileNav();
}

const D1_EDITOR_DRAFT_KEY_PREFIX = 'ssh_d1_draft_';
const KOKUM_DRAFT_STORAGE_KEY = 'ssh_kokum_draft';
const KOKUM_PROGRAM_CONFIG_KEY = 'ssh_kokum_program_config';
const DEFAULT_KOKUM_PROGRAM_OPTIONS = {
  'UNIT BERUNIFORM': [
    'Kadet Remaja Sekolah (KRS)',
    'Pengakap'
  ],
  'KELAB DAN PERSATUAN': [
    'Kelab STEM',
    'Kelab Seni Muzik'
  ],
  'SUKAN DAN PERMAINAN': [
    'Bola Tampar',
    'Catur',
    'Sepak Takraw',
    'Memanah',
    'Olahraga'
  ]
};
const KOKUM_DEFAULT_LOCATIONS = {
  'Kadet Remaja Sekolah (KRS)': ['Padang sekolah', 'Dewan terbuka', 'Kawasan sekolah', 'Lain-lain'],
  'Pengakap': ['Kawasan sekolah', 'Padang sekolah', 'Tapak perhimpunan', 'Lain-lain'],
  'Kelab STEM': ['Makmal / bilik STEM', 'Kelas', 'Pusat sumber', 'Lain-lain'],
  'Kelab Seni Muzik': ['Bilik muzik', 'Dewan sekolah', 'Kelas', 'Lain-lain'],
  'Bola Tampar': ['Gelanggang bola tampar', 'Padang sekolah', 'Lain-lain'],
  'Catur': ['Pusat sumber / kelas', 'Kelas', 'Dewan sekolah', 'Lain-lain'],
  'Sepak Takraw': ['Gelanggang terbuka', 'Padang sekolah', 'Lain-lain'],
  'Memanah': ['Padang sekolah', 'Kawasan lapang', 'Lain-lain'],
  'Olahraga': ['Padang sekolah', 'Gelanggang sekolah', 'Lain-lain']
};
const KOKUM_CLASSROOM_OPTIONS = {
  1: 'Kelas 1 NILAM',
  2: 'Kelas 2 INTAN',
  3: 'Kelas 3 KRISTAL',
  4: 'Kelas 4 MUTIARA',
  5: 'Kelas 5 DELIMA',
  6: 'Kelas 6 BAIDURI'
};
const KOKUM_CATEGORY_ALIASES = {
  'UNIT BERUNIFORM': 'UNIT BERUNIFORM',
  'UNIT  BERUNIFORM': 'UNIT BERUNIFORM',
  'UNIT BERUNIFORM ': 'UNIT BERUNIFORM',
  'KELAB DAN PERSATUAN': 'KELAB DAN PERSATUAN',
  'KELAB / PERSATUAN': 'KELAB DAN PERSATUAN',
  'KELAB/PERSATUAN': 'KELAB DAN PERSATUAN',
  'SUKAN DAN PERMAINAN': 'SUKAN DAN PERMAINAN',
  'SUKAN / PERMAINAN': 'SUKAN DAN PERMAINAN',
  'SUKAN/PERMAINAN': 'SUKAN DAN PERMAINAN'
};

function $id(id) {
  return document.getElementById(id);
}
function setText(id, value) {
  const el = $id(id);
  if (el) el.textContent = value;
}
function setHTML(id, html) {
  const el = $id(id);
  if (el) el.innerHTML = html;
}
function setValue(id, value) {
  const el = $id(id);
  if (el) el.value = value || '';
}
function getTrimmedValue(id) {
  const el = $id(id);
  return el ? String(el.value || '').trim() : '';
}
async function fetchJsonWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(function() { controller.abort(); }, timeoutMs || 4000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}
function loadGoogleIdentityScript() {
  if (_gsiReady || _gsiScriptRequested || typeof document === 'undefined') return;
  _gsiScriptRequested = true;
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.onload = function() {
    if (typeof onGSIReady === 'function') onGSIReady();
  };
  script.onerror = function() {
    _gsiScriptRequested = false;
    updateLoginReadinessMessage();
  };
  document.head.appendChild(script);
}
function isStandalonePWA() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function isModuleVisible(id) {
  const mod = $id('mod-' + id);
  return !!(mod && mod.style.display !== 'none');
}
function refreshAttendanceModuleIfVisible(force) {
  if (_currentModuleId === 'kehadiran-guru' && isModuleVisible('kehadiran-guru')) {
    loadKehadiranGuru({ silent: !force, preserveTable: true, reason: force ? 'focus' : 'auto' });
    return;
  }
  if (_currentModuleId === 'kehadiran-murid' && isModuleVisible('kehadiran-murid')) {
    loadKehadiranMurid({ silent: !force, preserveTable: true, reason: force ? 'focus' : 'auto' });
  }
}
function setPWABannerState(config) {
  const banner = $id('pwaBanner');
  const title = $id('pwaBannerTitle');
  const text = $id('pwaBannerText');
  const badge = $id('pwaStatusBadge');
  const installBtn = $id('pwaInstallBtn');
  const updateBtn = $id('pwaUpdateBtn');
  if (!banner || !title || !text || !badge || !installBtn || !updateBtn) return;
  const state = config || {};
  banner.classList.add('is-visible');
  banner.classList.toggle('is-offline', !!state.offline);
  title.textContent = state.title || 'SmartSchoolHub PWA aktif';
  text.textContent = state.text || 'Aplikasi sedia digunakan pada pelayar ini.';
  badge.className = 'badge ' + (state.badgeClass || 'badge-blue');
  badge.textContent = state.badgeText || 'PWA aktif';
  installBtn.classList.toggle('is-visible', !!state.showInstall);
  updateBtn.classList.toggle('is-visible', !!state.showUpdate);
}
function renderPWAStatus() {
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
  const installed = isStandalonePWA() || APP.pwa.installed;
  if (offline) {
    setPWABannerState({
      title: 'Anda sedang offline',
      text: 'Shell aplikasi masih boleh dibuka. Ciri yang perlukan backend, login, GPS, atau internet akan sambung semula bila rangkaian stabil.',
      badgeClass: 'badge-red',
      badgeText: 'Offline',
      offline: true,
      showInstall: false,
      showUpdate: false
    });
    return;
  }
  if (APP.pwa.updateReady) {
    setPWABannerState({
      title: 'Versi aplikasi baharu tersedia',
      text: 'Tekan kemas kini untuk aktifkan service worker baharu dan muat semula SmartSchoolHub.',
      badgeClass: 'badge-amber',
      badgeText: 'Update tersedia',
      showInstall: false,
      showUpdate: true
    });
    return;
  }
  if (APP.pwa.installPrompt && !installed) {
    setPWABannerState({
      title: 'Pasang SmartSchoolHub pada peranti',
      text: 'Gunakan mod aplikasi penuh pada telefon atau komputer untuk akses lebih pantas dan pengalaman seperti app sebenar.',
      badgeClass: 'badge-green',
      badgeText: 'Boleh dipasang',
      showInstall: true,
      showUpdate: false
    });
    return;
  }
  if (installed) {
    setPWABannerState({
      title: 'SmartSchoolHub dipasang sebagai aplikasi',
      text: 'Aplikasi sedang berjalan dalam mod PWA. Anda boleh terus guna modul sekolah seperti biasa.',
      badgeClass: 'badge-blue',
      badgeText: 'Dipasang',
      showInstall: false,
      showUpdate: false
    });
    return;
  }
  setPWABannerState({
    title: 'SmartSchoolHub sedia untuk mod aplikasi',
    text: 'PWA aktif pada laman ini. Jika pelayar menyokong install prompt, butang pasang akan muncul secara automatik.',
    badgeClass: 'badge-blue',
    badgeText: 'PWA aktif',
    showInstall: false,
    showUpdate: false
  });
}
function trackPWARegistration(registration) {
  if (!registration) return;
  APP.pwa.registration = registration;
  if (registration.waiting) APP.pwa.updateReady = true;
  registration.addEventListener('updatefound', function() {
    const newWorker = registration.installing;
    if (!newWorker) return;
    newWorker.addEventListener('statechange', function() {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        APP.pwa.updateReady = true;
        renderPWAStatus();
      }
    });
  });
  renderPWAStatus();
}
async function initPWA() {
  APP.pwa.installed = isStandalonePWA();
  renderPWAStatus();

  window.addEventListener('online', function() {
    renderPWAStatus();
    showToast('Sambungan internet kembali aktif.', 'success');
  });
  window.addEventListener('offline', function() {
    renderPWAStatus();
    showToast('Anda sedang offline. Mod PWA masih tersedia.', 'info');
  });
  window.addEventListener('beforeinstallprompt', function(event) {
    event.preventDefault();
    APP.pwa.installPrompt = event;
    renderPWAStatus();
  });
  window.addEventListener('appinstalled', function() {
    APP.pwa.installed = true;
    APP.pwa.installPrompt = null;
    renderPWAStatus();
    showToast('SmartSchoolHub berjaya dipasang pada peranti ini.', 'success');
  });

  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('controllerchange', function() {
    if (APP.pwa.refreshing) return;
    if (!APP.pwa.updateReady) return;
    APP.pwa.refreshing = true;
    window.location.reload();
  });
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) trackPWARegistration(registration);
    navigator.serviceWorker.ready.then(trackPWARegistration).catch(function() {});
  } catch (e) {
    // noop
  }
}
async function promptPWAInstall() {
  if (!APP.pwa.installPrompt) {
    showToast('Pilihan pasang belum tersedia pada pelayar ini lagi.', 'info');
    return;
  }
  try {
    APP.pwa.installPrompt.prompt();
    const choice = await APP.pwa.installPrompt.userChoice;
    if (choice && choice.outcome === 'accepted') {
      showToast('Permintaan pemasangan dihantar.', 'success');
    }
  } catch (e) {
    showToast('Gagal memaparkan prompt pemasangan.', 'error');
  } finally {
    APP.pwa.installPrompt = null;
    renderPWAStatus();
  }
}
function applyPWAUpdate() {
  if (!APP.pwa.registration || !APP.pwa.registration.waiting) {
    showToast('Tiada kemas kini aplikasi yang menunggu.', 'info');
    return;
  }
  APP.pwa.updateReady = true;
  renderPWAStatus();
  showToast('Kemas kini aplikasi sedang diterapkan...', 'info');
  APP.pwa.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
}
const MALAYSIA_TIMEZONE = 'Asia/Kuala_Lumpur';
const MALAYSIA_WEEKDAY_MAP = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const MALAYSIA_DATE_TIME_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: MALAYSIA_TIMEZONE,
  weekday: 'short',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
});
const MALAYSIA_DATE_LABEL_FORMATTER = new Intl.DateTimeFormat('ms-MY', {
  timeZone: MALAYSIA_TIMEZONE,
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
const MALAYSIA_DAY_LABEL_FORMATTER = new Intl.DateTimeFormat('ms-MY', {
  timeZone: MALAYSIA_TIMEZONE,
  weekday: 'long',
  month: 'long',
  day: 'numeric'
});
const MALAYSIA_TIME_LABEL_FORMATTER = new Intl.DateTimeFormat('ms-MY', {
  timeZone: MALAYSIA_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
});
function getMalaysiaDateParts(date) {
  const d = date instanceof Date ? date : new Date();
  const parts = {};
  MALAYSIA_DATE_TIME_FORMATTER.formatToParts(d).forEach(function(part) {
    if (part.type !== 'literal') parts[part.type] = part.value;
  });
  return {
    year: Number(parts.year || 0),
    month: Number(parts.month || 0),
    day: Number(parts.day || 0),
    hour: Number(parts.hour || 0),
    minute: Number(parts.minute || 0),
    second: Number(parts.second || 0),
    weekday: MALAYSIA_WEEKDAY_MAP[parts.weekday] || 0,
    ymd: (parts.year || '0000') + '-' + (parts.month || '00') + '-' + (parts.day || '00'),
    yearMonth: (parts.year || '0000') + '-' + (parts.month || '00'),
    hm: (parts.hour || '00') + ':' + (parts.minute || '00')
  };
}
function getTodayYMD(date) {
  return getMalaysiaDateParts(date).ymd;
}
function getCurrentTimeHM(date) {
  return getMalaysiaDateParts(date).hm;
}
function getCurrentTotalMinutes(date) {
  const parts = getMalaysiaDateParts(date);
  return parts.hour * 60 + parts.minute;
}
function getMalaysiaDateLabel(date) {
  return MALAYSIA_DATE_LABEL_FORMATTER.format(date instanceof Date ? date : new Date());
}
function getMalaysiaDayLabel(date) {
  return MALAYSIA_DAY_LABEL_FORMATTER.format(date instanceof Date ? date : new Date());
}
function getMalaysiaTimeLabel(date) {
  return MALAYSIA_TIME_LABEL_FORMATTER.format(date instanceof Date ? date : new Date());
}
function getMalaysiaTodayDate(date) {
  return parseLocalDateYMD(getTodayYMD(date));
}
function getPunchOutConfig(date) {
  const d = date instanceof Date ? date : new Date();
  const hari = getMalaysiaDateParts(d).weekday;
  if (hari >= 1 && hari <= 4) return { minutes: 13 * 60, label: '13:00' };
  if (hari === 5) return { minutes: 11 * 60 + 30, label: '11:30' };
  return null;
}
function isPunchOutStatus(status) {
  const s = String(status || '').trim().toLowerCase();
  return s === 'punch out' || s === 'punch-out' || s === 'keluar';
}
function scheduleIdleWork(fn) {
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(fn, { timeout: 1000 });
  } else {
    setTimeout(fn, 50);
  }
}

// ════════════════════════════════════════
// SMART SCHOOL HUB v2.0 — EXTENSION
// Jadual, Kawalan Akses, Dashboard, Notif
// ════════════════════════════════════════

// ── Jadual Guru Bertugas 2026 ────────────
var JADUAL_BERTUGAS_2026 = [];
var _jadualBertugas = [];

// ── Group WA Kelas ───────────────────────
var GROUP_WA_KELAS = JSON.parse(localStorage.getItem('ssh_group_wa_kelas') || 'null') || {};
var SENARAI_KELAS_MURID = ['1 NILAM','2 INTAN','3 KRISTAL','4 MUTIARA','5 DELIMA','6 BAIDURI'];
var GROUP_WA_KELAS_FIELDS = {
  '1 NILAM':   { input: 'grp-1-nilam',   status: 'grp-1-nilam-status',   idBox: 'grp-1-nilam-id' },
  '2 INTAN':   { input: 'grp-2-intan',    status: 'grp-2-intan-status',    idBox: 'grp-2-intan-id' },
  '3 KRISTAL': { input: 'grp-3-kristal',  status: 'grp-3-kristal-status',  idBox: 'grp-3-kristal-id' },
  '4 MUTIARA': { input: 'grp-4-mutiara',  status: 'grp-4-mutiara-status',  idBox: 'grp-4-mutiara-id' },
  '5 DELIMA':  { input: 'grp-5-delima',   status: 'grp-5-delima-status',   idBox: 'grp-5-delima-id' },
  '6 BAIDURI': { input: 'grp-6-baiduri',  status: 'grp-6-baiduri-status',  idBox: 'grp-6-baiduri-id' }
};
var BIRTHDAY_NOTIF_CONFIG_KEYS = {
  telegramBot: 'TELEGRAM_BOT',
  telegramChat: 'TELEGRAM_CHAT',
  telegramTopic: 'TELEGRAM_TOPIC',
  fonnteToken: 'FONNTE_TOKEN',
  fonnteGuruGroup: 'HL_FONNTE_GROUP',
  fonnteTestGroup: 'FONNTE_TEST_GROUP'
};
var ATTENDANCE_NOTIF_CONFIG_KEYS = {
  guruEnabled: 'ATTENDANCE_GURU_NOTIF_ENABLED',
  guruReminderTime: 'ATTENDANCE_GURU_REMINDER_TIME',
  muridEnabled: 'ATTENDANCE_MURID_NOTIF_ENABLED',
  muridCutoffTime: 'ATTENDANCE_MURID_CUTOFF_TIME',
  muridNotifyGuardian: 'ATTENDANCE_MURID_NOTIFY_GUARDIAN',
  muridNotifyClassGroup: 'ATTENDANCE_MURID_NOTIFY_CLASS_GROUP',
  muridNotifyTelegram: 'ATTENDANCE_MURID_NOTIFY_TELEGRAM',
  guruAdminTemplate: 'ATTENDANCE_GURU_ADMIN_TEMPLATE',
  guruPersonalTemplate: 'ATTENDANCE_GURU_PERSONAL_TEMPLATE',
  muridGuardianTemplate: 'ATTENDANCE_MURID_GUARDIAN_TEMPLATE',
  muridSummaryTemplate: 'ATTENDANCE_MURID_SUMMARY_TEMPLATE',
  muridClassGroupTemplate: 'ATTENDANCE_MURID_CLASS_GROUP_TEMPLATE',
  note: 'ATTENDANCE_NOTIF_NOTE'
};
var DEFAULT_ATTENDANCE_TEMPLATES = {
  guruAdmin: 'Peringatan Kehadiran Guru\n\nGuru berikut belum mendaftar kehadiran pada {TARIKH}:\n\n{SENARAI}\n\nSila daftar segera.\n\n_{SEKOLAH}_',
  guruPersonal: 'Peringatan\n\nCikgu {NAMA}, anda belum mendaftar kehadiran hari ini ({TARIKH}). Sila daftar segera.\n\n_{SEKOLAH}_',
  muridGuardian: 'Makluman Kehadiran\n\nSelamat sejahtera,\n\nAnak jagaan tuan/puan, {NAMA} dari kelas {KELAS}, direkodkan {STATUS} pada {TARIKH}.\n\nSila hubungi pihak sekolah jika ada pertanyaan.\n\n_{SEKOLAH}_',
  muridSummary: 'Makluman Kehadiran Murid\n\nTarikh: {TARIKH}\nKelas: {KELAS}\nBilangan: {BILANGAN}\n\n{SENARAI}\n\n_{SEKOLAH}_',
  muridClassGroup: 'Makluman Kehadiran - {KELAS}\n\nMurid tidak hadir pada {TARIKH}:\n\n{SENARAI}\n\n_{SEKOLAH}_'
};
function getGroupKelas(k) { return GROUP_WA_KELAS[k] || ''; }
function getGroupGuruFonnteId() { return String(hlConfig.fonnteGroup || '').trim(); }
function buildGroupKelasConfigKey(kelas) {
  return 'GROUP_WA_' + String(kelas || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}
function maskConfigValue(value, visibleChars) {
  var text = String(value || '').trim();
  var visible = Number(visibleChars || 4);
  if (!text) return 'Tidak diset';
  if (text.length <= visible) return text;
  return text.slice(0, visible) + '•'.repeat(Math.max(4, text.length - visible));
}
function getBirthdayNotifInputValue(id) {
  var el = document.getElementById(id);
  return el ? String(el.value || '').trim() : '';
}
function setBirthdayNotifInputValue(id, value) {
  var el = document.getElementById(id);
  if (el) el.value = value || '';
}
function parseJsonConfigValue(value, fallback) {
  const text = String(value == null ? '' : value).trim();
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch (e) {
    return fallback;
  }
}
function normalizeDutyScheduleRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(function(item, index) {
    const row = Object.assign({}, item || {});
    row.minggu = row.minggu || (index + 1);
    row.isnin = String(row.isnin || '').trim();
    row.guru = String(row.guru || '').trim();
    row.telefon = String(row.telefon || '').trim();
    row.pembantu = String(row.pembantu || '').trim();
    row.telefonPembantu = String(row.telefonPembantu || '').trim();
    return row;
  }).filter(function(row) {
    return row.isnin && row.guru;
  });
}
function applyBackendOperationalConfig(config) {
  const cfg = config || {};
  _backendConfigCache = cfg;
  applyNotificationRuntimeConfig(cfg);

  const adminEmails = parseJsonConfigValue(cfg.ADMIN_EMAILS_JSON, []);
  _adminEmails = Array.isArray(adminEmails) ? adminEmails.map(function(email) {
    return String(email || '').trim().toLowerCase();
  }).filter(Boolean) : [];

  const groupConfig = parseJsonConfigValue(cfg.GROUP_WA_KELAS_JSON, null);
  if (groupConfig && typeof groupConfig === 'object' && !Array.isArray(groupConfig)) {
    GROUP_WA_KELAS = Object.assign({}, groupConfig);
    localStorage.setItem('ssh_group_wa_kelas', JSON.stringify(GROUP_WA_KELAS));
  }

  const dutySchedule = parseJsonConfigValue(cfg.JADUAL_BERTUGAS_JSON, []);
  _jadualBertugas = normalizeDutyScheduleRows(dutySchedule);

  if (cfg.KOKUM_PROGRAM_OPTIONS_JSON) {
    try {
      saveLocalKokumProgramConfig(cloneKokumProgramOptions(JSON.parse(cfg.KOKUM_PROGRAM_OPTIONS_JSON)));
    } catch (e) {}
  }
}
function applyNotificationRuntimeConfig(config) {
  const cfg = config || {};
  hlConfig.tgBot = String(cfg[BIRTHDAY_NOTIF_CONFIG_KEYS.telegramBot] || hlConfig.tgBot || '').trim();
  hlConfig.tgChat = String(cfg[BIRTHDAY_NOTIF_CONFIG_KEYS.telegramChat] || hlConfig.tgChat || '').trim();
  hlConfig.tgTopic = String(cfg[BIRTHDAY_NOTIF_CONFIG_KEYS.telegramTopic] || hlConfig.tgTopic || '').trim();
  hlConfig.fonnteToken = String(cfg[BIRTHDAY_NOTIF_CONFIG_KEYS.fonnteToken] || hlConfig.fonnteToken || '').trim();
  hlConfig.fonnteGroup = String(cfg[BIRTHDAY_NOTIF_CONFIG_KEYS.fonnteGuruGroup] || cfg.FONNTE_GROUP || hlConfig.fonnteGroup || '').trim();
  hlConfig.fonnteTestGroup = String(cfg[BIRTHDAY_NOTIF_CONFIG_KEYS.fonnteTestGroup] || hlConfig.fonnteTestGroup || '120363423994004887@g.us').trim();
  localStorage.setItem('ssh_hl_config', JSON.stringify(hlConfig));
}
async function loadBackendOperationalConfig(forceReload) {
  if (!forceReload && _backendConfigCache) return _backendConfigCache;
  if (!APP.workerUrl || !APP.user) return _backendConfigCache || {};
  try {
    const data = await callWorker({ action: 'getConfig' });
    if (data && data.success) {
      applyBackendOperationalConfig(data.config || {});
      return _backendConfigCache || {};
    }
  } catch (e) {}
  return _backendConfigCache || {};
}
function syncGroupGuruFonnteInputs(value) {
  ['hl-fonnte-group', 'config-fonnte-guru-group'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = value || '';
  });
}
function syncGroupGuruFonnteInputsFrom(sourceId) {
  var el = document.getElementById(sourceId);
  syncGroupGuruFonnteInputs(el ? el.value.trim() : '');
}
function updateGroupSetupSummary(id, active) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = active ? 'Aktif' : 'Tidak aktif';
  el.className = 'badge ' + (active ? 'badge-green' : 'badge-gray');
}
function renderGroupFonnteSetupUI() {
  var testId = String(hlConfig.fonnteTestGroup || '120363423994004887@g.us').trim();
  var testInput = document.getElementById('config-fonnte-test-group');
  if (testInput) testInput.value = testId;
  updateGroupSetupSummary('config-fonnte-test-status', !!testId);
  setText('config-fonnte-test-id', testId || 'Tiada group disimpan.');

  var guruId = getGroupGuruFonnteId();
  syncGroupGuruFonnteInputs(guruId);
  updateGroupSetupSummary('config-fonnte-guru-status', !!guruId);
  setText('config-fonnte-guru-id', guruId || 'Tiada group disimpan.');

  var activeCount = 0;
  SENARAI_KELAS_MURID.forEach(function(kelas) {
    var field = GROUP_WA_KELAS_FIELDS[kelas];
    if (!field) return;
    var id = getGroupKelas(kelas);
    var input = document.getElementById(field.input);
    if (input) input.value = id || '';
    updateGroupSetupSummary(field.status, !!id);
    setText(field.idBox, id || 'Tiada group disimpan.');
    if (id) activeCount++;
  });
  setText('config-group-kelas-summary', activeCount + '/' + SENARAI_KELAS_MURID.length + ' aktif');
  renderBirthdayNotifConfigSummary();
}

function setBirthdayConfigCheckResult(message, isError) {
  var el = document.getElementById('birthdayNotifConfigCheckResult');
  if (!el) return;
  el.style.display = 'block';
  el.style.color = isError ? 'var(--red)' : 'var(--green)';
  el.textContent = message;
}

function renderBirthdayNotifConfigSummary(config) {
  var effectiveConfig = config || {};
  var telegramBot = String(effectiveConfig[BIRTHDAY_NOTIF_CONFIG_KEYS.telegramBot] || hlConfig.tgBot || '').trim();
  var telegramChat = String(effectiveConfig[BIRTHDAY_NOTIF_CONFIG_KEYS.telegramChat] || hlConfig.tgChat || '').trim();
  var telegramTopic = String(effectiveConfig[BIRTHDAY_NOTIF_CONFIG_KEYS.telegramTopic] || hlConfig.tgTopic || '').trim();
  var fonnteToken = String(effectiveConfig[BIRTHDAY_NOTIF_CONFIG_KEYS.fonnteToken] || '').trim();
  var guruGroup = String(effectiveConfig[BIRTHDAY_NOTIF_CONFIG_KEYS.fonnteGuruGroup] || hlConfig.fonnteGroup || '').trim();
  var activeClassCount = SENARAI_KELAS_MURID.filter(function(kelas) { return !!getGroupKelas(kelas); }).length;

  setText('birthdayNotifTelegramStatus', telegramBot && telegramChat ? 'Aktif' : 'Tidak lengkap');
  setText('birthdayNotifTelegramMeta', telegramBot && telegramChat
    ? 'Bot: ' + maskConfigValue(telegramBot, 8) + ' | Chat: ' + telegramChat + (telegramTopic ? ' | Topic: ' + telegramTopic : '')
    : 'Telegram bot/chat belum lengkap.');
  setText('birthdayNotifFonnteStatus', fonnteToken ? 'Aktif' : 'Tidak lengkap');
  setText('birthdayNotifFonnteMeta', fonnteToken ? 'Token: ' + maskConfigValue(fonnteToken, 8) : 'Token Fonnte belum disimpan.');
  setText('birthdayNotifGuruGroupStatus', guruGroup ? 'Aktif' : 'Tidak lengkap');
  setText('birthdayNotifGuruGroupMeta', guruGroup || 'Group guru belum disimpan.');
  setText('birthdayNotifClassGroupStatus', activeClassCount + '/' + SENARAI_KELAS_MURID.length + ' aktif');
  setText('birthdayNotifClassGroupMeta', activeClassCount === SENARAI_KELAS_MURID.length ? 'Semua group kelas telah diset.' : 'Masih ada group kelas yang belum lengkap.');

  var tbody = document.getElementById('birthdayNotifGroupBody');
  if (!tbody) return;
  tbody.innerHTML = SENARAI_KELAS_MURID.map(function(kelas) {
    var groupId = getGroupKelas(kelas);
    var badge = groupId ? '<span class="badge badge-green">Aktif</span>' : '<span class="badge badge-gray">Belum set</span>';
    var action = groupId
      ? '<button class="btn btn-sm btn-secondary" onclick="testBirthdayFonnteTarget(' + JSON.stringify(kelas) + ')">Uji</button>'
      : '<span style="color:var(--muted);font-size:0.82rem">Tiada ujian</span>';
    return '<tr><td><strong>' + escapeHtml(kelas) + '</strong></td><td>' + badge + '</td><td style="font-family:monospace;font-size:0.82rem;color:var(--muted)">' + escapeHtml(groupId || 'Tiada group disimpan.') + '</td><td>' + action + '</td></tr>';
  }).join('');
}

function populateBirthdayNotifConfigInputs(config) {
  config = config || {};
  applyNotificationRuntimeConfig(config);

  setBirthdayNotifInputValue('hl-tg-bot', hlConfig.tgBot);
  setBirthdayNotifInputValue('hl-tg-chat', hlConfig.tgChat);
  setBirthdayNotifInputValue('hl-tg-topic', hlConfig.tgTopic);
  setBirthdayNotifInputValue('hl-fonnte-token', hlConfig.fonnteToken || '');
  syncGroupGuruFonnteInputs(hlConfig.fonnteGroup || '');

  var changed = false;
  SENARAI_KELAS_MURID.forEach(function(kelas) {
    var workerValue = String(config[buildGroupKelasConfigKey(kelas)] || '').trim();
    if (workerValue && GROUP_WA_KELAS[kelas] !== workerValue) {
      GROUP_WA_KELAS[kelas] = workerValue;
      changed = true;
    }
  });
  if (changed) localStorage.setItem('ssh_group_wa_kelas', JSON.stringify(GROUP_WA_KELAS));
  renderGroupFonnteSetupUI();
  renderBirthdayNotifConfigSummary(config);
}


async function simpanKonfigHariLahir() {
  var telegramBot = getBirthdayNotifInputValue('hl-tg-bot');
  var telegramChat = getBirthdayNotifInputValue('hl-tg-chat');
  var telegramTopic = getBirthdayNotifInputValue('hl-tg-topic');
  var fonnteToken = getBirthdayNotifInputValue('hl-fonnte-token');
  var guruGroupInput = document.getElementById('config-fonnte-guru-group');
  var guruGroup = guruGroupInput ? String(guruGroupInput.value || '').trim() : String(hlConfig.fonnteGroup || '').trim();
  var testGroupInput = document.getElementById('config-fonnte-test-group');
  var testGroup = testGroupInput ? String(testGroupInput.value || '').trim() : String(hlConfig.fonnteTestGroup || '120363423994004887@g.us').trim();
  var payload = {};
  payload[BIRTHDAY_NOTIF_CONFIG_KEYS.telegramBot] = telegramBot;
  payload[BIRTHDAY_NOTIF_CONFIG_KEYS.telegramChat] = telegramChat;
  payload[BIRTHDAY_NOTIF_CONFIG_KEYS.telegramTopic] = telegramTopic;
  payload[BIRTHDAY_NOTIF_CONFIG_KEYS.fonnteToken] = fonnteToken;
  payload.FONNTE_GROUP = guruGroup;
  payload[BIRTHDAY_NOTIF_CONFIG_KEYS.fonnteGuruGroup] = guruGroup;
  payload[BIRTHDAY_NOTIF_CONFIG_KEYS.fonnteTestGroup] = testGroup;
  SENARAI_KELAS_MURID.forEach(function(kelas) {
    payload[buildGroupKelasConfigKey(kelas)] = String(getGroupKelas(kelas) || '').trim();
  });

  hlConfig.tgBot = telegramBot;
  hlConfig.tgChat = telegramChat;
  hlConfig.tgTopic = telegramTopic;
  hlConfig.fonnteToken = fonnteToken;
  hlConfig.fonnteGroup = guruGroup;
  hlConfig.fonnteTestGroup = testGroup;
  localStorage.setItem('ssh_hl_config', JSON.stringify(hlConfig));
  localStorage.setItem('ssh_group_wa_kelas', JSON.stringify(GROUP_WA_KELAS));
  syncGroupGuruFonnteInputs(guruGroup);

  try {
    if (!APP.workerUrl) throw new Error('Worker URL belum disimpan. Pergi ke Konfigurasi dahulu.');
    var data = await callWorker({ action: 'setConfig', config: payload });
    if (!data.success) throw new Error(data.error || 'Gagal menyimpan konfigurasi notifikasi hari lahir.');
    renderBirthdayNotifConfigSummary(payload);
    setBirthdayConfigCheckResult('Konfigurasi Telegram, Fonnte, group guru, dan group kelas berjaya disimpan.', false);
    showToast('Konfigurasi notifikasi hari lahir berjaya disimpan.', 'success');
    try { await loadConfig(); } catch (err) {}
  } catch (e) {
    renderBirthdayNotifConfigSummary(payload);
    setBirthdayConfigCheckResult(e.message, true);
    showToast(e.message, 'error');
  }
}

function populateAttendanceNotificationConfig(config) {
  const cfg = config || {};
  const guruEnabled = normalizeConfigBoolean(cfg[ATTENDANCE_NOTIF_CONFIG_KEYS.guruEnabled], isGuruAttendanceNotifEnabled());
  const muridEnabled = normalizeConfigBoolean(cfg[ATTENDANCE_NOTIF_CONFIG_KEYS.muridEnabled], isMuridAttendanceNotifEnabled());
  const notifyGuardian = normalizeConfigBoolean(cfg[ATTENDANCE_NOTIF_CONFIG_KEYS.muridNotifyGuardian], shouldNotifyMuridGuardian());
  const notifyClassGroup = normalizeConfigBoolean(cfg[ATTENDANCE_NOTIF_CONFIG_KEYS.muridNotifyClassGroup], shouldNotifyMuridClassGroup());
  const notifyTelegram = normalizeConfigBoolean(cfg[ATTENDANCE_NOTIF_CONFIG_KEYS.muridNotifyTelegram], shouldNotifyMuridTelegram());
  const guruTime = String(cfg[ATTENDANCE_NOTIF_CONFIG_KEYS.guruReminderTime] || localStorage.getItem('ssh_attendance_guru_reminder_time') || '07:45').trim();
  const muridTime = String(cfg[ATTENDANCE_NOTIF_CONFIG_KEYS.muridCutoffTime] || localStorage.getItem('ssh_attendance_murid_cutoff_time') || '09:00').trim();
  const note = String(cfg[ATTENDANCE_NOTIF_CONFIG_KEYS.note] || localStorage.getItem('ssh_attendance_notif_note') || '').trim();
  const guruAdminTemplate = getConfigText(cfg[ATTENDANCE_NOTIF_CONFIG_KEYS.guruAdminTemplate], 'ssh_attendance_tpl_guru_admin', DEFAULT_ATTENDANCE_TEMPLATES.guruAdmin);
  const guruPersonalTemplate = getConfigText(cfg[ATTENDANCE_NOTIF_CONFIG_KEYS.guruPersonalTemplate], 'ssh_attendance_tpl_guru_personal', DEFAULT_ATTENDANCE_TEMPLATES.guruPersonal);
  const muridGuardianTemplate = getConfigText(cfg[ATTENDANCE_NOTIF_CONFIG_KEYS.muridGuardianTemplate], 'ssh_attendance_tpl_murid_guardian', getLegacyMuridGuardianTemplate());
  const muridSummaryTemplate = getConfigText(cfg[ATTENDANCE_NOTIF_CONFIG_KEYS.muridSummaryTemplate], 'ssh_attendance_tpl_murid_summary', DEFAULT_ATTENDANCE_TEMPLATES.muridSummary);
  const muridClassGroupTemplate = getConfigText(cfg[ATTENDANCE_NOTIF_CONFIG_KEYS.muridClassGroupTemplate], 'ssh_attendance_tpl_murid_class_group', DEFAULT_ATTENDANCE_TEMPLATES.muridClassGroup);

  localStorage.setItem('ssh_attendance_guru_notif_enabled', guruEnabled ? 'true' : 'false');
  localStorage.setItem('ssh_attendance_murid_notif_enabled', muridEnabled ? 'true' : 'false');
  localStorage.setItem('ssh_attendance_murid_notify_guardian', notifyGuardian ? 'true' : 'false');
  localStorage.setItem('ssh_attendance_murid_notify_class_group', notifyClassGroup ? 'true' : 'false');
  localStorage.setItem('ssh_attendance_murid_notify_telegram', notifyTelegram ? 'true' : 'false');
  localStorage.setItem('ssh_attendance_guru_reminder_time', guruTime || '07:45');
  localStorage.setItem('ssh_attendance_murid_cutoff_time', muridTime || '09:00');
  localStorage.setItem('ssh_attendance_notif_note', note);
  localStorage.setItem('ssh_attendance_tpl_guru_admin', guruAdminTemplate);
  localStorage.setItem('ssh_attendance_tpl_guru_personal', guruPersonalTemplate);
  localStorage.setItem('ssh_attendance_tpl_murid_guardian', muridGuardianTemplate);
  localStorage.setItem('ssh_attendance_tpl_murid_summary', muridSummaryTemplate);
  localStorage.setItem('ssh_attendance_tpl_murid_class_group', muridClassGroupTemplate);

  setSelectValue('attendanceGuruNotifEnabled', guruEnabled ? 'true' : 'false');
  setSelectValue('attendanceMuridNotifEnabled', muridEnabled ? 'true' : 'false');
  setSelectValue('attendanceMuridNotifyGuardian', notifyGuardian ? 'true' : 'false');
  setSelectValue('attendanceMuridNotifyClassGroup', notifyClassGroup ? 'true' : 'false');
  setSelectValue('attendanceMuridNotifyTelegram', notifyTelegram ? 'true' : 'false');
  setInputValue('attendanceGuruReminderTime', guruTime || '07:45');
  setInputValue('attendanceMuridCutoffTime', muridTime || '09:00');
  setInputValue('attendanceNotifNote', note);
  setInputValue('attendanceTplGuruAdmin', guruAdminTemplate);
  setInputValue('attendanceTplGuruPersonal', guruPersonalTemplate);
  setInputValue('attendanceTplMuridGuardian', muridGuardianTemplate);
  setInputValue('attendanceTplMuridSummary', muridSummaryTemplate);
  setInputValue('attendanceTplMuridClassGroup', muridClassGroupTemplate);
  updateAttendanceNotificationStatusUI();
}


async function saveAttendanceNotificationConfig() {
  const payload = {};
  payload[ATTENDANCE_NOTIF_CONFIG_KEYS.guruEnabled] = getSelectBoolean('attendanceGuruNotifEnabled', true) ? 'true' : 'false';
  payload[ATTENDANCE_NOTIF_CONFIG_KEYS.guruReminderTime] = getInputTrimmed('attendanceGuruReminderTime', '07:45');
  payload[ATTENDANCE_NOTIF_CONFIG_KEYS.muridEnabled] = getSelectBoolean('attendanceMuridNotifEnabled', true) ? 'true' : 'false';
  payload[ATTENDANCE_NOTIF_CONFIG_KEYS.muridCutoffTime] = getInputTrimmed('attendanceMuridCutoffTime', '09:00');
  payload[ATTENDANCE_NOTIF_CONFIG_KEYS.muridNotifyGuardian] = getSelectBoolean('attendanceMuridNotifyGuardian', true) ? 'true' : 'false';
  payload[ATTENDANCE_NOTIF_CONFIG_KEYS.muridNotifyClassGroup] = getSelectBoolean('attendanceMuridNotifyClassGroup', true) ? 'true' : 'false';
  payload[ATTENDANCE_NOTIF_CONFIG_KEYS.muridNotifyTelegram] = getSelectBoolean('attendanceMuridNotifyTelegram', true) ? 'true' : 'false';
  payload[ATTENDANCE_NOTIF_CONFIG_KEYS.guruAdminTemplate] = getInputTrimmed('attendanceTplGuruAdmin', DEFAULT_ATTENDANCE_TEMPLATES.guruAdmin);
  payload[ATTENDANCE_NOTIF_CONFIG_KEYS.guruPersonalTemplate] = getInputTrimmed('attendanceTplGuruPersonal', DEFAULT_ATTENDANCE_TEMPLATES.guruPersonal);
  payload[ATTENDANCE_NOTIF_CONFIG_KEYS.muridGuardianTemplate] = getInputTrimmed('attendanceTplMuridGuardian', DEFAULT_ATTENDANCE_TEMPLATES.muridGuardian);
  payload[ATTENDANCE_NOTIF_CONFIG_KEYS.muridSummaryTemplate] = getInputTrimmed('attendanceTplMuridSummary', DEFAULT_ATTENDANCE_TEMPLATES.muridSummary);
  payload[ATTENDANCE_NOTIF_CONFIG_KEYS.muridClassGroupTemplate] = getInputTrimmed('attendanceTplMuridClassGroup', DEFAULT_ATTENDANCE_TEMPLATES.muridClassGroup);
  payload[ATTENDANCE_NOTIF_CONFIG_KEYS.note] = getInputTrimmed('attendanceNotifNote', '');
  populateAttendanceNotificationConfig(payload);
  const result = document.getElementById('attendanceNotifConfigResult');
  if (!APP.workerUrl) {
    if (result) {
      result.style.display = 'block';
      result.textContent = 'Konfigurasi disimpan pada peranti ini. Worker URL belum disimpan, jadi belum diselaraskan ke backend.';
    }
    showToast('Konfigurasi kehadiran disimpan pada peranti ini.', 'success');
    return;
  }
  if (!APP.user || !APP.user.idToken) {
    if (result) {
      result.style.display = 'block';
      result.textContent = 'Konfigurasi disimpan pada peranti ini. Untuk simpan ke backend, sila log masuk semula sebagai pentadbir.';
    }
    showToast('Disimpan lokal. Log masuk pentadbir diperlukan untuk sync backend.', 'info');
    return;
  }
  try {
    const data = await callWorker({ action: 'setConfig', config: payload });
    if (!data.success) throw new Error(data.error || 'Gagal menyimpan konfigurasi notifikasi kehadiran.');
    if (result) {
      result.style.display = 'block';
      result.textContent = 'Konfigurasi notifikasi kehadiran guru dan murid berjaya disimpan.';
    }
    showToast('Konfigurasi notifikasi kehadiran berjaya disimpan.', 'success');
    try { await loadConfig(); } catch (err) {}
  } catch (e) {
    if (result) {
      result.style.display = 'block';
      result.textContent = 'Konfigurasi disimpan pada peranti ini, tetapi gagal sync ke backend: ' + e.message;
    }
    showToast('Disimpan lokal. Sync backend gagal: ' + e.message, 'info');
  }
}

async function testBirthdayTelegramConfig() {
  try {
    var mesej = '🧪 *Semakan Konfigurasi Hari Lahir*\n\nTelegram untuk modul Hari Lahir berjaya disahkan.';
    await sendTelegramLogged('Test Telegram Hari Lahir', 'Telegram Hari Lahir', mesej);
    setBirthdayConfigCheckResult('Telegram berjaya dihantar. Konfigurasi Telegram sah.', false);
    showToast('Telegram berjaya diuji.', 'success');
  } catch (e) {
    setBirthdayConfigCheckResult('Telegram gagal: ' + e.message, true);
    showToast('Telegram gagal: ' + e.message, 'error');
  }
}

async function testBirthdayFonnteTarget(targetType) {
  var originalTarget = '';
  var label = '';
  if (targetType === 'guru') {
    originalTarget = String(getGroupGuruFonnteId() || '').trim();
    label = 'Group Guru';
  } else {
    originalTarget = String(getGroupKelas(targetType) || '').trim();
    label = targetType;
  }
  
  var target = String(hlConfig.fonnteTestGroup || '120363423994004887@g.us').trim(); // Test Group
  try {
    var mesej = '🧪 Semakan konfigurasi Fonnte SmartSchoolHub\nSaluran Asal: ' + label + (originalTarget ? ' (' + originalTarget + ')' : ' (Tiada ID)') + '\nLencongan Ujian: Test Group\nStatus: Berjaya dihubungi.';
    await callFonnte(target, mesej);
    logNotif('Test Fonnte Hari Lahir', label + ' (Test Group)', mesej, 'Berjaya');
    setBirthdayConfigCheckResult('Fonnte berjaya dihantar ke Test Group untuk ' + label + '.', false);
    showToast('Fonnte berjaya diuji (Test Group): ' + label, 'success');
  } catch (e) {
    logNotif('Test Fonnte Hari Lahir', label + ' (Test Group)', String(e.message || e), 'Gagal');
    setBirthdayConfigCheckResult('Fonnte gagal untuk ' + label + ' (Test Group): ' + e.message, true);
    showToast('Fonnte gagal untuk ' + label + ' (Test Group).', 'error');
  }
}

async function testAllBirthdayFonnteGroups() {
  var targets = ['guru'].concat(SENARAI_KELAS_MURID);
  var passed = 0;
  var failed = 0;
  var skipped = 0;
  var notes = [];
  var testGroup = String(hlConfig.fonnteTestGroup || '120363423994004887@g.us').trim(); // Test Group
  for (var i = 0; i < targets.length; i++) {
    var target = targets[i];
    var label = target === 'guru' ? 'Group Guru' : target;
    var originalId = target === 'guru' ? getGroupGuruFonnteId() : getGroupKelas(target);
    
    try {
      var mesej = '🧪 Semakan Fonnte SmartSchoolHub\nSaluran Asal: ' + label + (originalId ? ' (' + originalId + ')' : ' (Tiada ID)') + '\nLencongan Ujian: Test Group\nStatus: Berjaya dihubungi.';
      await callFonnte(testGroup, mesej);
      logNotif('Test Semua Group Hari Lahir', label + ' (Test Group)', 'Semakan berjaya', 'Berjaya');
      passed++;
      notes.push(label + ': berjaya');
    } catch (e) {
      logNotif('Test Semua Group Hari Lahir', label + ' (Test Group)', String(e.message || e), 'Gagal');
      failed++;
      notes.push(label + ': gagal - ' + e.message);
    }
    await sleep(350);
  }
  setBirthdayConfigCheckResult('Semakan semua group ke Test Group selesai. Berjaya: ' + passed + ', Gagal: ' + failed + '. ' + notes.join(' | '), failed > 0);
  showToast('Semakan semua group selesai. Berjaya: ' + passed + ', Gagal: ' + failed + '.', failed > 0 ? 'error' : 'success');
}

// ── Kawalan Akses ────────────────────────
var DEFAULT_ADMIN_EMAILS = [];
var MODUL_PENTADBIR = ['data-guru','data-murid','konfigurasi','notifikasi','hari-lahir'];
function getAdminEmails() {
  var emails = _adminEmails.slice();
  try {
    var stored = JSON.parse(localStorage.getItem('ssh_admin_emails') || 'null');
    if (!emails.length && Array.isArray(stored)) emails = stored.slice();
  } catch(e) {}
  DEFAULT_ADMIN_EMAILS.forEach(function(email) {
    if (!emails.some(function(e){ return e.toLowerCase() === email.toLowerCase(); })) emails.push(email);
  });
  return emails;
}
function saveAdminEmails(emails) {
  localStorage.setItem('ssh_admin_emails', JSON.stringify(emails));
  _adminEmails = emails.slice();
  if (APP.workerUrl) {
    callWorker({ action: 'setConfig', config: { ADMIN_EMAILS_JSON: JSON.stringify(_adminEmails) } }).catch(function() {});
  }
}
function isPentadbir() {
  if (!APP.user) return false;
  var roleText = String(APP.user.role || APP.user.jawatan || '').toLowerCase();
  if (roleText.includes('admin') || roleText.includes('pentadbir') || roleText.includes('guru besar') || roleText.includes('penolong kanan')) return true;
  return getAdminEmails().some(function(e){ return e.toLowerCase() === (APP.user.email||'').toLowerCase(); });
}
function addAdminEmail() {
  var input = document.getElementById('configAdminEmail');
  if (!input) return;
  var email = (input.value || '').trim().toLowerCase();
  if (!email || email.indexOf('@') === -1) { showToast('Sila masukkan email pentadbiran yang sah.', 'error'); return; }
  var emails = getAdminEmails();
  if (emails.some(function(e){ return e.toLowerCase() === email; })) { showToast('Email sudah wujud.', 'error'); return; }
  emails.push(email);
  saveAdminEmails(emails);
  renderAdminList();
  input.value = '';
  showToast('Admin baru ditambah.', 'success');
}
function removeAdminEmail(email) {
  if (DEFAULT_ADMIN_EMAILS.some(function(e){ return e.toLowerCase() === email.toLowerCase(); })) {
    showToast('Tidak boleh buang admin lalai.', 'error');
    return;
  }
  var emails = getAdminEmails().filter(function(e){ return e.toLowerCase() !== email.toLowerCase(); });
  if (!emails.length) { showToast('Tidak boleh buang semua admin.', 'error'); return; }
  saveAdminEmails(emails);
  renderAdminList();
  showToast('Admin dipadam.', 'success');
}
function renderAdminList() {
  var tbody = document.getElementById('adminListBody'); if (!tbody) return;
  var emails = getAdminEmails();
  if (!emails.length) {
    tbody.innerHTML = '<tr><td colspan="3" style="color:var(--muted);text-align:center;padding:16px">Tiada admin dikesan.</td></tr>';
    return;
  }
  tbody.innerHTML = emails.map(function(email) {
    var isDefault = DEFAULT_ADMIN_EMAILS.some(function(e){ return e.toLowerCase() === email.toLowerCase(); });
    return '<tr><td>' + escapeHtml(email) + '</td>' +
           '<td>' + (isDefault ? 'Admin Lalai' : 'Admin Tambahan') + '</td>' +
           '<td>' + (isDefault ? '-' : '<button class="btn btn-sm btn-danger" onclick="removeAdminEmail(' + JSON.stringify(email) + ')">Buang</button>') + '</td>' +
           '</tr>';
  }).join('');
}
async function loadAdminConfig() {
  await loadBackendOperationalConfig(true);
  updateNotifAutoStatusUI();
  updateHLNotifStatusUI();
  renderGroupFonnteSetupUI();
  loadBirthdayNotificationConfig();
  renderAdminList();
  loadD1Summary();
  loadD1EditableSheet();
}

// ── Hari Persekolahan ────────────────────

// ── Jadual Bertugas Helpers ───────────────
function formatDateYMD(date) {
  var yyyy = date.getFullYear();
  var mm = String(date.getMonth() + 1).padStart(2, '0');
  var dd = String(date.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}
function parseLocalDateYMD(value) {
  if (!value || typeof value !== 'string') return null;
  var parts = value.split('-');
  if (parts.length !== 3) return null;
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}
function addDaysYMD(value, days) {
  var d = parseLocalDateYMD(value);
  if (!d) return '';
  d.setDate(d.getDate() + days);
  return formatDateYMD(d);
}
function getIsninMingguIni() {
  var d = getMalaysiaTodayDate();
  var h = getMalaysiaDateParts(new Date()).weekday;
  // 0=Ahad→esok(+1), 1=Isnin→0, 2=Selasa→-1, ...6=Sabtu→+2
  var diff = h === 0 ? 1 : h === 6 ? 2 : (1 - h);
  d.setDate(d.getDate() + diff);
  return formatDateYMD(d);
}
function getIsninMingguDepan() {
  var d = parseLocalDateYMD(getIsninMingguIni());
  if (!d) return null;
  d.setDate(d.getDate() + 7);
  return formatDateYMD(d);
}
function getGuruBertugasMinggu(isninStr) {
  if (!isninStr) return null;
  return _jadualBertugas.find(function(j){ return j.isnin === isninStr; }) || null;
}

// ── Notif Guru Bertugas ───────────────────
async function hantarNotifGuruBertugas(manual) {
  var dep = getIsninMingguDepan();
  var entry = getGuruBertugasMinggu(dep);
  if (!entry) { showToast('Tiada jadual untuk ' + dep, 'error'); return; }
  var logKey = 'ssh_notif_bertugas_' + dep;
  if (!manual && localStorage.getItem(logKey)) return;
  var jStr = addDaysYMD(dep, 4);
  var mesej = 'MAKLUMAN GURU BERTUGAS\n\n' + entry.guru + ' dijadualkan sebagai Guru Bertugas:\n' + dep + ' (Isnin) - ' + jStr + ' (Jumaat)\n\nTugas: Kawalan perhimpunan, kantin, disiplin, kebersihan, laporan mingguan.\n\n_SK Kiandongo_';
  try {
    if (entry.telefon) await callFonnte(entry.telefon, mesej);
    await hantarTelegram(mesej);
    localStorage.setItem(logKey, new Date().toISOString());
    showToast('Notifikasi dihantar kepada ' + entry.guru + '!', 'success');
  } catch(e) { showToast('Gagal: ' + e.message, 'error'); }
}
async function semakNotifGuruBertugasMingguDepan() {
  var now = new Date();
  var nowParts = getMalaysiaDateParts(now);
  if (nowParts.weekday !== 5 || nowParts.hour < 15 || nowParts.hour > 17) return;
  var dep = getIsninMingguDepan();
  if (!localStorage.getItem('ssh_notif_bertugas_' + dep)) await hantarNotifGuruBertugas(false);
}
function clearNotifGuards() {
  var keys = [];
  for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.startsWith('ssh_notif_')) keys.push(k); }
  keys.forEach(function(k){ localStorage.removeItem(k); });
  showToast(keys.length + ' guard direset.', 'success');
}

// ── Group WA UI ───────────────────────────
async function simpanSemuaGroupKelas() {
  var map = {};
  Object.keys(GROUP_WA_KELAS_FIELDS).forEach(function(k) {
    map[k] = (document.getElementById(GROUP_WA_KELAS_FIELDS[k].input) || {}).value || '';
  });
  GROUP_WA_KELAS = map;
  localStorage.setItem('ssh_group_wa_kelas', JSON.stringify(map));
  renderGroupFonnteSetupUI();
  try {
    if (APP.workerUrl) await simpanKonfigHariLahir();
    else showToast('Group WA kelas disimpan pada peranti ini.', 'success');
  } catch (e) {
    showToast('Group WA kelas disimpan secara tempatan sahaja.', 'info');
  }
}
function loadGroupKelasUI() {
  renderGroupFonnteSetupUI();
}



// ── Dashboard Functions ───────────────────
async function muatCuaca() {
  try {
    var d = await fetchJsonWithTimeout('https://api.open-meteo.com/v1/forecast?latitude=5.3055655&longitude=116.9633906&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&wind_speed_unit=kmh&timezone=Asia%2FKuala_Lumpur', 3500);
    var c = d.current;
    var icons = {
      0: 'sun',
      1: 'cloud-sun',
      2: 'cloud-sun',
      3: 'cloud',
      45: 'cloud-fog',
      48: 'cloud-fog',
      51: 'cloud-drizzle',
      61: 'cloud-rain',
      71: 'snowflake',
      80: 'cloud-rain-wind',
      95: 'cloud-lightning'
    };
    var descs = {0:'Cerah',1:'Sebahagian berawan',2:'Sebahagian berawan',3:'Berawan',45:'Berkabut',48:'Berkabut',51:'Hujan renyai',61:'Hujan',71:'Salji',80:'Hujan lebat',95:'Ribut petir'};
    var code = c.weather_code||0;
    var iconName = icons[code] || (code<=2?'cloud-sun':code<=3?'cloud':code<=49?'cloud-fog':code<=69?'cloud-rain':code<=99?'cloud-lightning':'sun');
    var desc = descs[code] || (code<=2?'Sebahagian berawan':code<=3?'Berawan':code<=49?'Berkabut':code<=69?'Hujan':'Ribut');
    setText('dash-cuaca-suhu', Math.round(c.temperature_2m)+'C');
    setText('dash-cuaca-desc', desc);
    setText('dash-cuaca-lembap', c.relative_humidity_2m);
    setText('dash-cuaca-angin', Math.round(c.wind_speed_10m));
    setText('dash-cuaca-rasa', Math.round(c.apparent_temperature));
    var ic = $id('dash-cuaca-icon'); 
    if(ic) {
      ic.innerHTML = '<svg class="lucide-icon" width="44" height="44"><use href="#lucide-' + iconName + '"></use></svg>';
      
    }
  } catch(e) { setText('dash-cuaca-desc','Gagal'); }
}

async function muatWaktuSolat() {
  function toMasa(v) {
    if (!v) return '-';
    var n = Number(v);
    if (!isNaN(n) && n > 100000000) {
      var dt = new Date(n * 1000);
      return String((dt.getUTCHours()+8)%24).padStart(2,'0') + ':' + String(dt.getUTCMinutes()).padStart(2,'0');
    }
    var s = String(v);
    if (/^\d{4}$/.test(s)) return s.substring(0,2)+':'+s.substring(2);
    return s.substring(0,5);
  }
  try {
    var d = await fetchJsonWithTimeout('https://api.waktusolat.app/v2/solat/SBH07', 3500);
    var now = new Date();
    var nowParts = getMalaysiaDateParts(now);
    var nm = nowParts.hour * 60 + nowParts.minute;
    var today = nowParts.ymd.replace(/-/g,'');
    var rec = null;
    if (Array.isArray(d.prayers)) {
      rec = d.prayers.find(function(p){ return (p.date||'').replace(/-/g,'')===today; }) || d.prayers[0];
    } else { rec = d.data || d; }
    var senarai = [
      {nama:'Subuh',  masa:toMasa(rec.fajr||rec.subuh)},
      {nama:'Zohor',  masa:toMasa(rec.dhuhr||rec.zohor)},
      {nama:'Asar',   masa:toMasa(rec.asr||rec.asar)},
      {nama:'Maghrib',masa:toMasa(rec.maghrib)},
      {nama:'Isyak',  masa:toMasa(rec.isha||rec.isyak)},
    ];
    var next = null;
    var html = senarai.map(function(s) {
      var p = s.masa.split(':'), wm = p.length>=2 ? parseInt(p[0])*60+parseInt(p[1]) : 9999;
      var st = isNext ? 'font-weight:700;color:#FFD700' : 'opacity:0.88';
      var marker = isNext ? '<svg class="lucide-icon" width="12" height="12" style="fill:currentColor;display:inline-block;margin-right:4px"><use href="#lucide-play"></use></svg> ' : '';
      return '<div style="display:flex;justify-content:space-between;'+st+';padding:3px 0"><span>'+marker+s.nama+'</span><span>'+s.masa+'</span></div>';
    }).join('');
    var le = document.getElementById('dash-solat-list'); if(le) le.innerHTML = html;
    var ne = document.getElementById('dash-solat-seterusnya');
    if(ne) ne.textContent = next ? 'Seterusnya: '+next.nama+' - '+next.masa : 'Semua waktu solat telah berlalu';
  } catch(e) {
    var fb = [{n:'Subuh',m:'05:42'},{n:'Zohor',m:'12:58'},{n:'Asar',m:'16:18'},{n:'Maghrib',m:'18:52'},{n:'Isyak',m:'20:02'}];
    var now2 = new Date(), nm2 = getCurrentTotalMinutes(now2), nxt = null;
    var h2 = fb.map(function(s){ 
      var p=s.m.split(':'),wm=parseInt(p[0])*60+parseInt(p[1]),isN=!nxt&&wm>nm2; if(isN)nxt=s; 
      var st=isN?'font-weight:700;color:#FFD700':'opacity:0.88'; 
      var marker = isN ? '<svg class="lucide-icon" width="12" height="12" style="fill:currentColor;display:inline-block;margin-right:4px"><use href="#lucide-play"></use></svg> ' : '';
      return '<div style="display:flex;justify-content:space-between;'+st+';padding:3px 0"><span>'+marker+s.n+'</span><span>'+s.m+'</span></div>'; 
    }).join('');
    var le = document.getElementById('dash-solat-list'); if(le) le.innerHTML = h2 + '<div style="font-size:0.65rem;opacity:0.5;margin-top:4px">Anggaran (offline)</div>';
    var ne = document.getElementById('dash-solat-seterusnya'); if(ne) ne.textContent = nxt ? 'Seterusnya: '+nxt.n+' - '+nxt.m : 'Semua telah berlalu';
  }
}

function renderGuruBertugasDash() {
  var hari = getMalaysiaDateParts(new Date()).weekday, isHujung = (hari===0||hari===6);
  var isninIni = getIsninMingguIni(), isninDep = getIsninMingguDepan();
  var guruIni = getGuruBertugasMinggu(isninIni), guruDep = getGuruBertugasMinggu(isninDep);
  var jumaatIni = addDaysYMD(isninIni, 4);
  var nmEl = document.getElementById('dash-bertugas-nama');
  var pbEl = document.getElementById('dash-bertugas-pembantu');
  var dpEl = document.getElementById('dash-bertugas-depan');
  var mwEl = document.getElementById('dash-bertugas-minggu');
  if (mwEl) mwEl.textContent = isHujung ? 'Minggu Hadapan (' + isninIni + ')' : isninIni + ' - ' + jumaatIni;
  if (nmEl) nmEl.textContent = guruIni ? guruIni.guru : 'Tiada dalam jadual';
  if (pbEl) pbEl.innerHTML = guruIni && guruIni.pembantu ? '<span style="opacity:0.8;font-size:0.78rem">Pembantu: ' + guruIni.pembantu + '</span>' : '';
  if (dpEl) dpEl.innerHTML = guruDep ? (guruDep.guru + (guruDep.pembantu ? '<br><small style="opacity:0.75">'+guruDep.pembantu+'</small>' : '')) : '-';
}

function renderMuridTidakHadirDash(rows) {
  var el = document.getElementById('dash-murid-tidak-hadir-list'); if(!el) return;
  if (!rows.length) { el.innerHTML = '<div style="color:var(--green);font-weight:600;text-align:center;padding:16px">Semua murid hadir hari ini!</div>'; return; }
  var esc = function(v) {
    return String(v || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };
  var byKelas = {};
  rows.forEach(function(r){
    var k = (r.kelas || r[1] || '-');
    if(!byKelas[k]) byKelas[k] = [];
    byKelas[k].push({
      nama: (r.nama || r[0] || '-'),
      status: (r.status || r[3] || '')
    });
  });
  el.innerHTML = '<div style="display:grid;gap:10px;padding:4px">' + Object.keys(byKelas).sort().map(function(k) {
    var murid = byKelas[k].slice().sort(function(a, b) { return a.nama.localeCompare(b.nama, 'ms'); });
    var muridList = murid.map(function(item, idx) {
      var statusBadgeMini = item.status === 'MC'
        ? '<span style="font-size:0.7rem;color:var(--gold2);font-weight:700">Sakit</span>'
        : item.status === 'Ponteng'
          ? '<span style="font-size:0.7rem;color:var(--red);font-weight:700">Ponteng</span>'
          : '';
      return '<div style="display:flex;align-items:flex-start;gap:8px;padding:8px 10px;background:#fff;border:1px solid rgba(239,68,68,0.08);border-radius:10px">' +
        '<span style="min-width:20px;color:var(--red);font-size:0.76rem;font-weight:700">' + (idx + 1) + '.</span>' +
        '<div style="display:flex;justify-content:space-between;gap:10px;width:100%">' +
          '<span style="font-size:0.82rem;line-height:1.35;color:var(--text)">' + esc(item.nama) + '</span>' +
          statusBadgeMini +
        '</div>' +
      '</div>';
    }).join('');
    return '<div style="background:rgba(239,68,68,0.05);border-radius:12px;padding:12px 14px;border-left:4px solid var(--red)">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap">' +
        '<span class="badge badge-blue">' + esc(k) + '</span>' +
        '<span class="badge badge-red">' + murid.length + ' orang</span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:8px">' + muridList + '</div>' +
    '</div>';
  }).join('') + '</div>';
}

function renderWeeklyChart(allRows) {
  var wrap = document.getElementById('dashChartWrap'); if(!wrap) return;
  var todayStr = getTodayYMD();
  var isnin = new Date(getIsninMingguIni()+'T00:00:00');
  var bars = '';
  for (var i = 0; i < 5; i++) {
    var d = new Date(isnin); d.setDate(isnin.getDate()+i);
    var ds = formatDateYMD(d);
    var isToday = ds === todayStr, pct = 0;
    if (allRows && allRows.length) {
      var dayRows = allRows.filter(function(r){ return (r.tarikh||r[2]) === ds; });
      if (dayRows.length > 0) {
        var h = dayRows.filter(function(r){ return (r.status||r[3])==='Hadir'; }).length;
        pct = Math.round((h/dayRows.length)*100);
      }
    }
    var height = pct ? Math.round((pct/100)*72) : 4;
    var col = pct>=90?'var(--green)':pct>=80?'var(--gold2)':pct>0?'var(--red)':'var(--border)';
    bars += '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1"><div style="font-size:0.68rem;color:var(--muted);font-weight:600">'+(pct>0?pct+'%':'')+'</div><div style="width:100%;height:'+height+'px;background:'+col+';border-radius:6px 6px 0 0;transition:height 0.3s'+(isToday?';outline:2px solid var(--gold);outline-offset:2px':'')+'"></div></div>';
  }
  wrap.innerHTML = bars;
}

function getNotificationLogs() {
  return Array.isArray(APP.notifLog) ? APP.notifLog.filter(Boolean) : [];
}
function isSuccessfulNotifLog(log) {
  return String(log && log.status || '').trim().toLowerCase() === 'berjaya';
}
function getNotifLogStatusBadge(log) {
  const status = String(log && log.status || '-');
  return '<span class="badge ' + (isSuccessfulNotifLog(log) ? 'badge-green' : 'badge-red') + '">' + escapeHtml(status) + '</span>';
}
function renderNotificationActivityItems(logs, limit) {
  const items = (logs || []).slice(-limit).reverse();
  if (!items.length) {
    return '<div style="color:var(--muted);font-size:0.82rem;padding:12px;text-align:center">Tiada aktiviti hari ini.</div>';
  }
  return items.map(function(l) {
    return '<div style="display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--border)">' +
      '<span style="font-size:0.74rem;color:var(--muted);flex-shrink:0;min-width:112px">' + escapeHtml(l.time || '') + '</span>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:3px">' +
          '<span class="badge badge-blue">' + escapeHtml(l.type || '-') + '</span>' +
          getNotifLogStatusBadge(l) +
        '</div>' +
        '<div style="font-size:0.86rem;font-weight:700">' + escapeHtml(l.target || '-') + '</div>' +
        '<div style="font-size:0.8rem;color:var(--muted);margin-top:2px">' + escapeHtml(l.preview || '') + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}
function renderAktivitiTerkini() {
  var el = document.getElementById('dash-aktiviti-list'); if(!el) return;
  var today = getTodayYMD();
  var logs = getNotificationLogs().filter(function(l){ return l.date === today; });
  el.innerHTML = renderNotificationActivityItems(logs, 6);
}

function renderBirthdayDashboard() {
  var el = document.getElementById('dash-birthday-list'); if (!el) return;
  if (!hlData || !hlData.length) {
    el.innerHTML = '<div style="color:var(--muted);font-size:0.82rem;padding:16px;text-align:center">Tiada rekod hari lahir.</div>';
    if (APP.workerUrl && !_birthdayHydratedOnce) {
      hydrateHariLahirFromBackend(false).then(function() {
        renderBirthdayDashboard();
      }).catch(function(err) {
        console.warn('Hydrasi dashboard Hari Lahir gagal:', err);
      });
    }
    return;
  }
  var todayParts = getMalaysiaDateParts(new Date()), todayM = todayParts.month, todayD = todayParts.day;
  var todayList = hlData.filter(function(item){ return item.bulan == todayM && item.hari == todayD; });
  if (todayList.length) {
    el.innerHTML = todayList.map(function(item) {
      return '<div style="padding:14px;border-radius:12px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);">' +
             '<strong>' + item.nama + '</strong> • ' + (item.peranan || '-') + ' • ' + (item.kelas || '-') +
             '<div style="display:flex;align-items:center;gap:6px;margin-top:6px;color:var(--green);font-weight:700"><svg class="lucide-icon" width="16" height="16"><use href="#lucide-party-popper"></use></svg> Hari lahir hari ini!</div>' +
             '</div>';
    }).join('');
    return;
  }
  var upcoming = hlData.map(function(item) {
    return { item: item, days: daysUntilBirthday(item.bulan, item.hari) };
  }).filter(function(x){ return x.days > 0 && x.days <= 7; }).sort(function(a,b){ return a.days - b.days; }).slice(0,4);
  if (!upcoming.length) {
    el.innerHTML = '<div style="color:var(--muted);font-size:0.82rem;padding:16px;text-align:center">Tiada hari lahir dalam 7 hari.</div>';
    return;
  }
  el.innerHTML = upcoming.map(function(entry) {
    return '<div style="padding:14px;border-radius:12px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);">' +
           '<strong>' + entry.item.nama + '</strong> • ' + (entry.item.peranan || '-') + ' • ' + (entry.item.kelas || '-') +
           '<div style="margin-top:6px;color:var(--blue);font-weight:700">' + entry.days + ' hari lagi</div>' +
           '</div>';
  }).join('');
}

function isNotifAutoEnabled() {
  return localStorage.getItem('ssh_notif_auto_enabled') !== 'false';
}
function getLocalBooleanConfig(key, defaultValue) {
  const value = localStorage.getItem(key);
  if (value == null) return !!defaultValue;
  return value !== 'false';
}
function isGuruAttendanceNotifEnabled() {
  return getLocalBooleanConfig('ssh_attendance_guru_notif_enabled', true);
}
function isMuridAttendanceNotifEnabled() {
  return getLocalBooleanConfig('ssh_attendance_murid_notif_enabled', true);
}
function shouldNotifyMuridGuardian() {
  return getLocalBooleanConfig('ssh_attendance_murid_notify_guardian', true);
}
function shouldNotifyMuridClassGroup() {
  return getLocalBooleanConfig('ssh_attendance_murid_notify_class_group', true);
}
function shouldNotifyMuridTelegram() {
  return getLocalBooleanConfig('ssh_attendance_murid_notify_telegram', true);
}
function isHLNotifEnabled() {
  return localStorage.getItem('ssh_hl_notif_enabled') !== 'false';
}
function setNotifAutoEnabled(enabled) {
  localStorage.setItem('ssh_notif_auto_enabled', enabled ? 'true' : 'false');
  updateNotifAutoStatusUI();
}
function setHLNotifEnabled(enabled) {
  localStorage.setItem('ssh_hl_notif_enabled', enabled ? 'true' : 'false');
  updateHLNotifStatusUI();
}
function toggleNotifAutoEnabled() {
  setNotifAutoEnabled(!isNotifAutoEnabled());
  showToast(isNotifAutoEnabled() ? 'Notifikasi auto diaktifkan.' : 'Notifikasi auto dinyahaktifkan.', 'success');
}
function toggleHLNotifEnabled() {
  setHLNotifEnabled(!isHLNotifEnabled());
  showToast(isHLNotifEnabled() ? 'Peringatan hari lahir diaktifkan.' : 'Peringatan hari lahir dinyahaktifkan.', 'success');
}
function updateNotifAutoStatusUI() {
  var status = isNotifAutoEnabled() ? 'Aktif' : 'Dinonaktifkan';
  setText('config-notif-auto-status', status);
  setText('notif-module-status', status);
  var btn = document.getElementById('config-notif-auto-toggle');
  if (btn) btn.textContent = isNotifAutoEnabled() ? 'Matikan' : 'Aktifkan';
  var btn2 = document.getElementById('notifModuleToggle');
  if (btn2) btn2.textContent = isNotifAutoEnabled() ? 'Matikan' : 'Aktifkan';
  updateAttendanceNotificationStatusUI();
}
function updateHLNotifStatusUI() {
  var status = isHLNotifEnabled() ? 'Aktif' : 'Dinonaktifkan';
  setText('config-hl-status', status);
  setText('hl-module-status', status);
  var btn = document.getElementById('config-hl-toggle');
  if (btn) btn.textContent = isHLNotifEnabled() ? 'Matikan' : 'Aktifkan';
  var btn2 = document.getElementById('hlModuleToggle');
  if (btn2) btn2.textContent = isHLNotifEnabled() ? 'Matikan' : 'Aktifkan';
}

function setSelectValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = String(value);
}
function setInputValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value == null ? '' : String(value);
}
function getSelectBoolean(id, defaultValue) {
  const el = document.getElementById(id);
  if (!el || el.value === '') return !!defaultValue;
  return el.value !== 'false';
}
function getInputTrimmed(id, fallback) {
  const el = document.getElementById(id);
  const value = el ? String(el.value || '').trim() : '';
  return value || fallback || '';
}
function getConfigText(configValue, localKey, fallback) {
  const fromConfig = String(configValue == null ? '' : configValue).trim();
  if (fromConfig) return fromConfig;
  const fromLocal = String(localStorage.getItem(localKey) || '').trim();
  return fromLocal || fallback || '';
}
function getLegacyMuridGuardianTemplate() {
  const saved = String(localStorage.getItem('tpl_tidakHadir') || '').trim();
  const el = document.getElementById('tplTidakHadir');
  return saved || (el ? String(el.value || '').trim() : '') || DEFAULT_ATTENDANCE_TEMPLATES.muridGuardian;
}
function getAttendanceTemplate(localKey, fallback) {
  return String(localStorage.getItem(localKey) || '').trim() || fallback || '';
}
function renderAttendanceTemplate(template, data) {
  const values = data || {};
  return String(template || '').replace(/{([A-Z_]+)}/g, function(match, key) {
    return values[key] == null ? '' : String(values[key]);
  });
}
function getSchoolTemplateName() {
  return 'SK Kiandongo';
}
function normalizeConfigBoolean(value, fallback) {
  if (value === true || value === false) return value;
  const text = String(value == null ? '' : value).trim().toLowerCase();
  if (['true', '1', 'ya', 'yes', 'on', 'aktif'].includes(text)) return true;
  if (['false', '0', 'tidak', 'no', 'off', 'dinonaktifkan'].includes(text)) return false;
  return !!fallback;
}
function updateAttendanceNotificationStatusUI() {
  const guruEnabled = isNotifAutoEnabled() && isGuruAttendanceNotifEnabled();
  const muridEnabled = isNotifAutoEnabled() && isMuridAttendanceNotifEnabled();
  const guruTime = localStorage.getItem('ssh_attendance_guru_reminder_time') || '07:45';
  const muridTime = localStorage.getItem('ssh_attendance_murid_cutoff_time') || '09:00';
  const telegramReady = !!(String(hlConfig.tgBot || '').trim() && String(hlConfig.tgChat || '').trim());
  const fonnteReady = !!String(hlConfig.fonnteToken || '').trim();
  const guruGroupReady = !!getGroupGuruFonnteId();
  const classGroupCount = SENARAI_KELAS_MURID.filter(function(kelas) { return !!getGroupKelas(kelas); }).length;

  setText('attendanceGuruNotifStatus', guruEnabled ? 'Aktif' : 'Dinonaktifkan');
  setText('attendanceGuruNotifMeta', guruEnabled ? 'Peringatan guru dijadual sekitar ' + guruTime + '.' : 'Notifikasi guru tidak akan dihantar secara automatik.');
  setText('attendanceMuridNotifStatus', muridEnabled ? 'Aktif' : 'Dinonaktifkan');
  setText('attendanceMuridNotifMeta', muridEnabled ? 'Makluman murid tidak hadir disasarkan sekitar ' + muridTime + '.' : 'Notifikasi murid tidak akan dihantar secara automatik.');
  setText('attendanceGuruChannelStatus', telegramReady || fonnteReady ? 'Sedia' : 'Belum lengkap');
  setText('attendanceGuruChannelMeta', 'Telegram: ' + (telegramReady ? 'Aktif' : 'Belum lengkap') + ' | Fonnte: ' + (fonnteReady ? 'Aktif' : 'Belum lengkap') + ' | Group guru: ' + (guruGroupReady ? 'Ada' : 'Tiada'));
  setText('attendanceMuridChannelStatus', classGroupCount + '/' + SENARAI_KELAS_MURID.length + ' group kelas');
  setText('attendanceMuridChannelMeta', 'Wali: ' + (shouldNotifyMuridGuardian() ? 'Ya' : 'Tidak') + ' | Group kelas: ' + (shouldNotifyMuridClassGroup() ? 'Ya' : 'Tidak') + ' | Telegram: ' + (shouldNotifyMuridTelegram() ? 'Ya' : 'Tidak'));
}

function renderDashGuruTable(rows, isninStr, jumaatStr) {
  var tbody = document.getElementById('dashGuruBody'); if(!tbody) return;
  var filteredRows = (rows || []).filter(function(r){ return !isPunchOutStatus(r.status); });
  if (!filteredRows.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:var(--muted);text-align:center;padding:16px">Tiada rekod kehadiran guru minggu ini.</td></tr>'; return;
  }
  var sorted = filteredRows.slice().sort(function(a,b){ return String(b.tarikh || '').localeCompare(String(a.tarikh || '')); });
  tbody.innerHTML = sorted.map(function(r) {
    var t = String(r.tarikh || '').split('T')[0];
    var parsedDate = parseLocalDateYMD(t);
    var h = ['Ahad','Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu'][parsedDate ? parsedDate.getDay() : 0];
    return '<tr><td data-label="Nama Guru"><strong>'+(r.nama||'-')+'</strong></td><td data-label="Status">'+statusBadge(r.status)+'</td><td data-label="Hari / Tarikh" style="font-size:0.8rem;color:var(--muted)">'+h+' '+t+'</td><td data-label="Masa">'+(r.masa||'-')+'</td><td data-label="Catatan" style="font-size:0.78rem;color:var(--muted)">'+(r.catatan||'')+'</td></tr>';
  }).join('');
}



// ── GOOGLE AUTH ────────────────────────────────────────────────
function onGSIReady() {
  if (_gsiReady) {
    updateLoginReadinessMessage();
    if (_domReady) renderGSIButton();
    return;
  }
  _gsiReady = true;
  if (_domReady) initAuth();
}

function hasGoogleSignInClient() {
  return typeof google !== 'undefined' && !!(google.accounts && google.accounts.id);
}

function getCurrentOriginLabel() {
  if (typeof window === 'undefined' || !window.location || !window.location.origin) return 'origin semasa';
  return window.location.origin;
}

function setLoginConfigStatus(message, type) {
  const box = document.getElementById('loginConfigStatus');
  if (!box) return;
  const palette = {
    info: {
      background: 'rgba(26,79,160,0.12)',
      border: 'rgba(96,165,250,0.35)',
      color: '#dbeafe'
    },
    success: {
      background: 'rgba(16,185,129,0.14)',
      border: 'rgba(16,185,129,0.35)',
      color: '#d1fae5'
    },
    error: {
      background: 'rgba(239,68,68,0.14)',
      border: 'rgba(248,113,113,0.35)',
      color: '#fee2e2'
    }
  };
  const tone = palette[type] || palette.info;
  box.textContent = message;
  box.style.background = tone.background;
  box.style.borderColor = tone.border;
  box.style.color = tone.color;
}

function setLoginDebugInfo(message, type) {
  const box = document.getElementById('loginDebugBox');
  if (!box) return;
  const text = String(message || '').trim();
  if (!text) {
    box.style.display = 'none';
    box.textContent = '';
    return;
  }
  box.style.display = 'block';
  box.textContent = text;
  if (type === 'success') {
    box.style.background = 'rgba(20,83,45,0.18)';
    box.style.borderColor = 'rgba(74,222,128,0.35)';
    box.style.color = '#dcfce7';
    return;
  }
  if (type === 'info') {
    box.style.background = 'rgba(30,64,175,0.16)';
    box.style.borderColor = 'rgba(96,165,250,0.35)';
    box.style.color = '#dbeafe';
    return;
  }
  box.style.background = 'rgba(127,29,29,0.18)';
  box.style.borderColor = 'rgba(248,113,113,0.35)';
  box.style.color = '#fecaca';
}

function syncBootstrapConfigInputs() {
  const workerValue = APP.workerUrl || '';
  const clientIdValue = APP.googleClientId || '';
  const workerUrlField = document.getElementById('workerUrl');
  const workerEndpointField = document.getElementById('workerEndpoint');
  const loginWorkerUrlField = document.getElementById('loginWorkerUrl');
  const loginGoogleClientIdField = document.getElementById('loginGoogleClientId');
  const originField = document.getElementById('loginOriginValue');
  if (workerUrlField) workerUrlField.value = workerValue;
  if (workerEndpointField) workerEndpointField.value = workerValue ? workerValue + '/api' : '';
  if (loginWorkerUrlField) loginWorkerUrlField.value = workerValue;
  if (loginGoogleClientIdField) loginGoogleClientIdField.value = clientIdValue;
  if (originField) originField.textContent = getCurrentOriginLabel();
}

function buildHostedOAuthHint() {
  return 'Jika log masuk masih gagal, buka Tetapan sambungan atau hubungi pentadbir sekolah.';
}

function exposeLoginBootstrapActions() {
  if (typeof window === 'undefined') return;
  window.focusLoginConfig = focusLoginConfig;
  window.savePreLoginConfig = savePreLoginConfig;
  window.checkLoginWorkerStatus = checkLoginWorkerStatus;
  window.retryGSIRender = retryGSIRender;
}

function bindLoginBootstrapActions() {
  const saveBtn = document.getElementById('loginSaveConfigBtn');
  const checkBtn = document.getElementById('loginCheckBackendBtn');
  if (saveBtn && !saveBtn.dataset.bound) {
    saveBtn.dataset.bound = '1';
    saveBtn.addEventListener('click', function() {
      savePreLoginConfig(false);
    });
  }
  if (checkBtn && !checkBtn.dataset.bound) {
    checkBtn.dataset.bound = '1';
    checkBtn.addEventListener('click', function() {
      savePreLoginConfig(true);
    });
  }
}

function renderPersistentLoginError(err) {
  if (!err) {
    setLoginDebugInfo('', 'info');
    return;
  }
  const lines = ['Ralat login terakhir: ' + String(err.message || 'Tidak diketahui')];
  if (err.code) lines.push('Kod backend: ' + String(err.code));
  if (err.debugAuth) {
    if (err.debugAuth.receivedEmail) lines.push('Email diterima backend: ' + String(err.debugAuth.receivedEmail));
    if (err.debugAuth.receivedName) lines.push('Nama diterima backend: ' + String(err.debugAuth.receivedName));
    lines.push('Padan admin lalai: ' + (err.debugAuth.adminMatchedByDefaultList ? 'ya' : 'tidak'));
    if ('adminMatchedByConfiguredList' in err.debugAuth) {
      lines.push('Padan admin konfigurasi: ' + (err.debugAuth.adminMatchedByConfiguredList ? 'ya' : 'tidak'));
    }
  }
  setLoginDebugInfo(lines.join('\n'), 'error');
}

function updateLoginReadinessMessage() {
  if (!APP.workerUrl) {
    setLoginConfigStatus('Tetapan sambungan belum lengkap. Sila minta bantuan pentadbir sekolah.', 'error');
    return;
  }
  if (!_gsiReady || typeof google === 'undefined') {
    setLoginConfigStatus('Butang Google sedang dimuatkan. Sila tunggu sebentar.', 'info');
    return;
  }
  setLoginConfigStatus('Sambungan sedia untuk digunakan.', 'success');
}

function focusLoginConfig() {
  const panel = document.getElementById('loginBootstrapConfig');
  if (panel && typeof panel.open !== 'undefined') panel.open = true;
  if (panel && typeof panel.scrollIntoView === 'function') {
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const input = document.getElementById('loginWorkerUrl');
  if (input && typeof input.focus === 'function') input.focus();
}

function persistBootstrapConfig(workerUrl, googleClientId) {
  const normalizedWorkerUrl = normalizeConfigUrl(workerUrl);
  const normalizedClientId = normalizeGoogleClientId(googleClientId);
  if (normalizedWorkerUrl) localStorage.setItem('ssh_worker_url', normalizedWorkerUrl);
  else localStorage.removeItem('ssh_worker_url');
  if (normalizedClientId && normalizedClientId !== DEFAULT_GOOGLE_CLIENT_ID) localStorage.setItem('ssh_google_client_id', normalizedClientId);
  else localStorage.removeItem('ssh_google_client_id');
  APP.workerUrl = normalizedWorkerUrl || normalizeConfigUrl(getRuntimeConfig().workerUrl || getRuntimeConfig().workerURL || '');
  APP.googleClientId = normalizedClientId || resolveInitialGoogleClientId();
  syncBootstrapConfigInputs();
}

async function savePreLoginConfig(checkWorkerAfterSave) {
  const workerField = document.getElementById('loginWorkerUrl');
  const clientField = document.getElementById('loginGoogleClientId');
  const nextWorkerUrl = workerField ? workerField.value : APP.workerUrl;
  const nextClientId = clientField ? clientField.value : APP.googleClientId;
  if (workerField && String(workerField.value || '').trim() && !normalizeConfigUrl(workerField.value)) {
    setLoginConfigStatus('Alamat sistem tidak sah. Sila semak semula alamat yang diberi oleh pentadbir.', 'error');
    return;
  }
  persistBootstrapConfig(nextWorkerUrl, nextClientId);
  updateLoginReadinessMessage();
  if (_gsiReady) initAuth();
  if (checkWorkerAfterSave) {
    await checkLoginWorkerStatus();
    return;
  }
  showToast('Konfigurasi login disimpan pada browser ini.', 'success');
}

async function checkLoginWorkerStatus() {
  const statusEl = document.getElementById('loginWorkerStatus');
  if (!statusEl) return;
  if (!APP.workerUrl) {
    statusEl.textContent = 'Tetapan sambungan belum lengkap.';
    statusEl.style.color = '#b91c1c';
    return;
  }
  statusEl.textContent = 'Memeriksa sambungan...';
  statusEl.style.color = '#475569';
  try {
    const data = await callWorker({ action: 'ping' });
    if (!data.success || data.worker !== 'ok') throw new Error('Respons ping backend tidak lengkap.');
    const backendLabel = data.backendMode === 'cloudflare-d1'
      ? 'Cloudflare D1'
      : data.backendMode === 'google-sheets'
        ? 'Google Sheets'
        : 'Tidak diketahui';
    statusEl.textContent = 'Sambungan aktif: ' + backendLabel;
    statusEl.style.color = '#15803d';
    setLoginConfigStatus('Sambungan berjaya. Sila teruskan log masuk.', 'success');
    setLoginDebugInfo('', 'info');
  } catch (err) {
    statusEl.textContent = 'Sambungan belum berjaya: ' + err.message;
    statusEl.style.color = '#b91c1c';
    setLoginConfigStatus('Sambungan belum berjaya. Sila semak tetapan atau minta bantuan pentadbir.', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  _domReady = true;
  exposeLoginBootstrapActions();
  bindLoginBootstrapActions();
  initPWA();
  syncResponsiveAppChrome();
  window.addEventListener('resize', syncResponsiveAppChrome);
  syncBootstrapConfigInputs();
  renderOPRImageGrid();
  showLoginPage();
  updateLoginReadinessMessage();
  if (!_gsiReady && hasGoogleSignInClient()) {
    onGSIReady();
  } else if (!_gsiReady) {
    setTimeout(() => {
      if (!_gsiReady && hasGoogleSignInClient()) onGSIReady();
    }, 800);
  }
  requestAnimationFrame(() => {
    setTimeout(() => {
      const ls = $id('loadingScreen');
      if (ls) { ls.classList.add('hidden'); setTimeout(() => { ls.style.display = 'none'; }, 500); }
      loadGoogleIdentityScript();
    }, 300);
  });
  initAuth();
});

function initAuth() {
  syncBootstrapConfigInputs();
  APP.googleClientId = resolveInitialGoogleClientId();
  if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
    showLoginPage();
    updateLoginReadinessMessage();
    return;
  }
  if (_authInitializedClientId !== APP.googleClientId) {
    try {
      google.accounts.id.initialize({
        client_id: APP.googleClientId,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
        ux_mode: 'popup'
      });
      _authInitializedClientId = APP.googleClientId;
      _gsiButtonRenderedClientId = '';
    } catch (err) {
      showLoginPage();
      setLoginConfigStatus('Google Sign-In gagal dimulakan. ' + buildHostedOAuthHint(), 'error');
      console.error('Google Sign-In initialization failed:', err);
      return;
    }
  }
  if (!_storedSessionRestoreAttempted) {
    _storedSessionRestoreAttempted = true;
    const savedUser = localStorage.getItem('ssh_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        if (isValidStoredSession(parsedUser)) {
          verifyStoredGoogleSession(parsedUser);
          return;
        }
        localStorage.removeItem('ssh_user');
      } catch(e) { localStorage.removeItem('ssh_user'); }
    }
  }
  showLoginPage();
}

async function handleGoogleCredential(response) {
  try {
    const payload = parseJWT(response.credential);
    if (!payload) { showToast('Token tidak sah.', 'error'); return; }
    if (!APP.workerUrl) { showToast('Worker URL belum disimpan. Login selamat memerlukan backend aktif.', 'error'); return; }
    _geoProfile = null;
    var tentativeUser = {
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      sub: payload.sub,
      idToken: response.credential
    };
    const verifiedUser = await verifyGoogleSessionWithBackend(tentativeUser);
    APP.user = verifiedUser;
    localStorage.setItem('ssh_user', JSON.stringify(APP.user));
    enterApp(APP.user);
    showToast('Selamat datang, ' + String((payload && payload.given_name) || verifiedUser.name || 'pengguna') + '!', 'success');
  } catch(err) {
    handleLogout(true);
    renderPersistentLoginError(err);
    showToast('Ralat log masuk: ' + err.message + formatLoginDebugMessage(err), 'error');
  }
}

function parseJWT(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch { return null; }
}

function renderGSIButton() {
  if (!_gsiReady || typeof google === 'undefined') return;
  const container = document.getElementById('googleSignInBtn');
  if (!container) return;
  if (!APP.workerUrl) {
    container.innerHTML = '<button class="btn btn-primary btn-full" onclick="focusLoginConfig()">Semak Tetapan Sambungan</button>';
    _gsiButtonRenderedClientId = '';
    updateLoginReadinessMessage();
    return;
  }
  if (_authInitializedClientId !== APP.googleClientId) {
    initAuth();
    return;
  }
  if (_gsiButtonRenderedClientId === APP.googleClientId && container.childElementCount) return;

  // Kira lebar responsif: lalai 320px, tetapi kecilkan pada skrin kecil (< 420px)
  let targetWidth = 320;
  if (window.innerWidth < 420) {
    targetWidth = Math.max(200, Math.min(320, window.innerWidth - 80));
  }

  container.innerHTML = '';
  google.accounts.id.renderButton(container, {
    type: 'standard', shape: 'pill', theme: 'filled_blue',
    size: 'large', text: 'signin_with', locale: 'ms', width: targetWidth
  });
  _gsiButtonRenderedClientId = APP.googleClientId;
}

function retryGSIRender() {
  if (!_gsiReady && hasGoogleSignInClient()) {
    onGSIReady();
    return;
  }
  if (_gsiReady) initAuth();
  else showToast('Google Sign-In belum siap dimuat. Tunggu sebentar dan cuba lagi.', 'error');
}

function showLoginPage() {
  document.getElementById('loginPage').style.display = 'flex';
  const app = document.getElementById('appPage');
  if (app) { app.classList.remove('active'); app.style.display = 'none'; }
  exposeLoginBootstrapActions();
  bindLoginBootstrapActions();
  syncBootstrapConfigInputs();
  if (_gsiReady) renderGSIButton();
  else {
    const btn = document.getElementById('googleSignInBtn');
    if (btn) btn.innerHTML = '<button class="btn btn-primary btn-full" onclick="retryGSIRender()" style="margin-bottom:14px">Log Masuk dengan Google</button>';
  }
  updateLoginReadinessMessage();
}

function isValidStoredSession(user) {
  if (!user || !user.idToken) return false;
  const payload = parseJWT(user.idToken);
  if (!payload || !payload.exp) return false;
  return Number(payload.exp) * 1000 > Date.now() + 60000;
}

async function verifyGoogleSessionWithBackend(user) {
  if (!user || !user.idToken) throw new Error('Sesi Google tidak lengkap.');
  const authCandidates = buildGoogleAuthBaseUrlCandidates();
  if (!authCandidates.length && !APP.workerUrl) throw new Error('Worker URL belum disimpan.');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  try {
    let oauthActor = null;
    let oauthError = null;
    for (let i = 0; i < authCandidates.length; i++) {
      const authUrl = authCandidates[i].replace(/\/+$/, '') + '/auth/google/verify';
      try {
        const oauthResponse = await fetch(authUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            credential: user.idToken || '',
            idToken: user.idToken || '',
            email: user.email || '',
            name: user.name || '',
            sub: user.sub || ''
          })
        });
        const oauthData = await oauthResponse.json();
        if (!oauthResponse.ok || !oauthData.success || !oauthData.actor) {
          const currentError = new Error((oauthData && oauthData.error) || 'Pengesahan Google OAuth gagal.');
          currentError.code = oauthData && oauthData.code ? oauthData.code : '';
          oauthError = currentError;
          continue;
        }
        oauthActor = oauthData.actor;
        break;
      } catch (authErr) {
        oauthError = authErr;
      }
    }

    let actor = oauthActor;
    if (APP.workerUrl) {
      const response = await fetch(APP.workerUrl.replace(/\/+$/, '') + '/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          action: 'verifySession',
          auth: {
            idToken: user.idToken || '',
            email: user.email || '',
            name: user.name || '',
            sub: user.sub || ''
          }
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.actor) {
        var err = new Error((data && data.error) || 'Pengesahan sesi Google gagal.');
        if (data && data.code) err.code = data.code;
        if (data && data.debugAuth) err.debugAuth = data.debugAuth;
        throw err;
      }
      actor = data.actor;
    } else if (!actor && oauthError) {
      throw oauthError;
    }

    if (!actor) {
      throw oauthError || new Error('Pengesahan sesi Google gagal.');
    }

    return {
      name: String(actor.name || user.name || user.email || '').trim(),
      email: String(actor.email || user.email || '').trim().toLowerCase(),
      picture: String(actor.picture || user.picture || '').trim(),
      sub: String(actor.sub || user.sub || '').trim(),
      idToken: user.idToken,
      role: String(actor.role || '').trim(),
      jawatan: String(actor.jawatan || '').trim(),
      kelas: String(actor.kelas || '').trim()
    };
  } catch (err) {
    if (err && err.name === 'AbortError') throw new Error('Pengesahan sesi Google mengambil masa terlalu lama.');
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

function formatLoginDebugMessage(err) {
  if (!err || !err.debugAuth) return '';
  const debug = err.debugAuth;
  const parts = [];
  if (debug.receivedEmail) parts.push('email=' + debug.receivedEmail);
  if (debug.receivedName) parts.push('nama=' + debug.receivedName);
  if (err.code) parts.push('kod=' + err.code);
  parts.push('adminLalai=' + (debug.adminMatchedByDefaultList ? 'ya' : 'tidak'));
  return parts.length ? ' [' + parts.join(' | ') + ']' : '';
}

async function verifyStoredGoogleSession(user) {
  try {
    const verifiedUser = await verifyGoogleSessionWithBackend(user);
    APP.user = verifiedUser;
    localStorage.setItem('ssh_user', JSON.stringify(APP.user));
    enterApp(APP.user);
  } catch (e) {
    localStorage.removeItem('ssh_user');
    APP.user = null;
    showLoginPage();
    showToast('Sesi Google tamat atau tidak dibenarkan. Sila log masuk semula.', 'info');
  }
}

function renderSidebarUserIdentity(user) {
  const current = $id('userInitials');
  if (!current) return;
  let next;
  if (user && user.picture) {
    next = document.createElement('img');
    next.src = String(user.picture);
    next.alt = String(user.name || 'Pengguna');
    next.style.width = '36px';
    next.style.height = '36px';
    next.style.borderRadius = '50%';
    next.style.objectFit = 'cover';
    next.style.flexShrink = '0';
  } else {
    const initials = String((user && user.name) || 'U')
      .split(' ')
      .map(function(part) { return part[0] || ''; })
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'U';
    next = document.createElement('div');
    next.className = 'user-initials';
    next.textContent = initials;
  }
  next.id = 'userInitials';
  current.replaceWith(next);
}

function enterApp(user) {
  const loginPage = $id('loginPage');
  if (loginPage) loginPage.style.display = 'none';
  const app = $id('appPage');
  if (app) {
    app.classList.add('active');
    app.style.display = 'block';
  }

  setText('userDisplayName', user.name || 'Pengguna');
  setText('userEmail', user.email || '');
  renderSidebarUserIdentity(user);

  setTodayDates();
  scheduleIdleWork(async function() {
    await loadBackendOperationalConfig(true);
    refreshDashboard();
    semakNotifGuruBertugasMingguDepan();
    applyKawalanAkses();
  });
  initWorkerUrl();
  applyKawalanAkses();
  updateNotifAutoStatusUI();
  updateHLNotifStatusUI();
}

function applyKawalanAkses() {
  var admin = isPentadbir();
  var roleEl = document.getElementById('userRoleBadge');
  if (roleEl) {
    roleEl.textContent = admin ? 'Pentadbir' : 'Guru';
    roleEl.style.background = admin ? 'rgba(245,197,24,0.2)' : 'rgba(26,79,160,0.1)';
    roleEl.style.color = admin ? 'var(--gold2)' : 'var(--blue)';
  }
  document.querySelectorAll('[data-admin-nav="true"]').forEach(function(btn) {
    btn.style.display = admin ? '' : 'none';
  });
  document.querySelectorAll('[data-admin-label="true"]').forEach(function(label) {
    label.style.display = admin ? '' : 'none';
  });
}

function handleLogout(silent) {
  if (_gsiReady && typeof google !== 'undefined') google.accounts.id.disableAutoSelect();
  _geoProfile = null;
  APP.user = null;
  localStorage.removeItem('ssh_user');
  showLoginPage();
  if (!silent) showToast('Anda telah log keluar.', 'info');
}

// ── NAVIGATION ─────────────────────────────────────────────────
function showModule(id) {
  if (id === 'geofence') id = 'kehadiran-guru';
  _currentModuleId = id;
  if (MODUL_PENTADBIR.includes(id) && !isPentadbir()) {
    showToast('Akses terhad - pentadbir sahaja.', 'error'); return;
  }
  const mod = document.getElementById('mod-' + id);
  if (!mod) {
    showToast('Modul "' + id + '" belum tersedia.', 'error');
    return;
  }
  document.querySelectorAll('.module').forEach(m => m.style.display = 'none');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  mod.style.display = 'block';
  document.querySelectorAll('.nav-item').forEach(btn => {
    if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(id))
      btn.classList.add('active');
  });
  updateMobileNavTitle(id);
  if (isMobileViewport()) closeMobileNav();
  if (id === 'kehadiran-guru') setTimeout(function(){ initKehadiranGuruModule(); }, 300);
  if (id === 'amaran-kehadiran') { muatAmaranSekolahConfigUI(); loadAmaranKehadiran(); }
  if (id === 'konfigurasi') { loadGroupKelasUI(); loadAdminConfig(); loadKokumProgramConfig(false); updateAttendanceNotificationStatusUI(); loadConfig(); }
  if (id === 'notifikasi') {
    updateNotifAutoStatusUI();
    var notifTarikhEl = document.getElementById('notifTarikh');
    var notifGuruTarikhEl = document.getElementById('notifGuruTarikh');
    var todayYmd = getTodayYMD();
    if (notifTarikhEl && !notifTarikhEl.value) notifTarikhEl.value = todayYmd;
    if (notifGuruTarikhEl && !notifGuruTarikhEl.value) notifGuruTarikhEl.value = todayYmd;
    var notifGuruTarikhPreview = document.getElementById('notifGuruTarikhPreview');
    if (notifGuruTarikhPreview) notifGuruTarikhPreview.textContent = 'Gunakan tarikh hari ini jika kosong.';
  }
  if (id === 'hari-lahir') { updateHLNotifStatusUI(); loadHariLahir(true); }

  // Auto-refresh setup
  if (currentAutoRefreshInterval) clearInterval(currentAutoRefreshInterval);
  if (id === 'dashboard') {
    refreshDashboard();
    currentAutoRefreshInterval = setInterval(refreshDashboard, 300000); // 5 minutes
  } else if (id === 'hari-lahir') {
    currentAutoRefreshInterval = setInterval(loadHariLahir, 600000); // 10 minutes
  } else if (id === 'kehadiran-guru') {
    loadKehadiranGuru({ silent: true, preserveTable: false, reason: 'initial' });
    currentAutoRefreshInterval = setInterval(function() {
      loadKehadiranGuru({ silent: true, preserveTable: true, reason: 'auto' });
    }, ATTENDANCE_LIVE_REFRESH_MS);
  } else if (id === 'kehadiran-murid') {
    loadKehadiranMurid({ silent: true, preserveTable: false, reason: 'initial' });
    currentAutoRefreshInterval = setInterval(function() {
      loadKehadiranMurid({ silent: true, preserveTable: true, reason: 'auto' });
    }, ATTENDANCE_LIVE_REFRESH_MS);
  } else if (id === 'data-guru') {
    loadDataGuru();
    currentAutoRefreshInterval = setInterval(loadDataGuru, 600000);
  } else if (id === 'data-murid') {
    loadDataMurid();
    currentAutoRefreshInterval = setInterval(loadDataMurid, 600000);
  } else if (id === 'laporan-kelas') {
    initLaporanGuruBertugasMingguanModule(false);
    currentAutoRefreshInterval = null;
  } else if (id === 'pelaporan-kokum') {
    loadKokumProgramConfig(false);
    initPelaporanKokumModule(false);
    currentAutoRefreshInterval = null;
  } else if (id === 'notifikasi') {
    loadNotifLog();
    currentAutoRefreshInterval = setInterval(loadNotifLog, 600000);
  } else {
    currentAutoRefreshInterval = null;
  }
}

// ── WORKER API ─────────────────────────────────────────────────
function initWorkerUrl() {
  syncBootstrapConfigInputs();
  // Auto-check status if URL is set
  if (APP.workerUrl) {
    updateWorkerStatus();
    // Periodic check every 5 minutes
    setInterval(updateWorkerStatus, 300000);
  }
}

function needsAuthenticatedWorkerAction(payload) {
  if (!payload || !payload.action) return false;
  if (payload.action === 'ping') return false;
  if (payload.action === 'readSheet') return true;
  if (payload.action === 'appendRow' || payload.action === 'appendRows' || payload.action === 'replaceSheet') return true;
  if (payload.action === 'getConfig' || payload.action === 'setConfig' || payload.action === 'setupAllSheets') return true;
  if (payload.action === 'getSummary' || payload.action === 'clearSheet' || payload.action === 'clearAllData') return true;
  return false;
}

async function callWorker(payload) {
  if (!APP.workerUrl) throw new Error('Worker URL belum disimpan. Pergi ke Konfigurasi dahulu.');
  if (needsAuthenticatedWorkerAction(payload) && (!APP.user || !APP.user.idToken)) {
    throw new Error('Sesi keselamatan tamat. Sila log keluar dan log masuk semula.');
  }
  const url = APP.workerUrl.replace(/\/+$/, '') + '/api';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  const requestPayload = Object.assign({}, payload);
  if (APP.user) {
    requestPayload.auth = {
      idToken: APP.user.idToken || '',
      email: APP.user.email || '',
      name: APP.user.name || '',
      sub: APP.user.sub || ''
    };
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestPayload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (!res.ok) {
      const err = new Error(data && data.error ? data.error : 'Ralat sambungan backend');
      if (data && data.code) err.code = data.code;
      err.status = res.status;
      throw err;
    }
    return data;
  } catch(e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') throw new Error('Sambungan timeout (10s)');
    throw e;
  }
}

async function pushFullSheet(sheetKey, headers, dataRows) {
  const rows = [headers].concat(dataRows);
  const data = await callWorker({ action: 'replaceSheet', sheetKey: sheetKey, rows: rows });
  if (!data.success) throw new Error(data.error || 'Gagal menyimpan rekod.');
  return data;
}

/* legacy removed: legacyOldUpdateWorkerStatus
  const el = document.getElementById('workerStatus');
  if (!el || !APP.workerUrl) return;
  el.textContent = '🔄 Memeriksa sambungan...';
  el.style.background = 'rgba(245,197,24,0.05)';
  el.style.borderColor = 'rgba(245,197,24,0.2)';
  el.style.color = 'var(--gold2)';
  try {
    const start = Date.now();
    const data = await callWorker({ action: 'ping' }); // Assume ping action for fast check
    const latency = Date.now() - start;
    if (data.success) {
      el.textContent = '✅ Tersambung (' + latency + 'ms)';
      el.style.background = 'rgba(16,185,129,0.05)';
      el.style.borderColor = 'rgba(16,185,129,0.2)';
      el.style.color = 'var(--green)';
    } else {
      el.textContent = '⚠️ Respons tidak dijangka';
      el.style.background = 'rgba(245,197,24,0.05)';
      el.style.borderColor = 'rgba(245,197,24,0.2)';
      el.style.color = 'var(--gold2)';
    }
  } catch(e) {
    el.textContent = '❌ Gagal sambung: ' + e.message;
    el.style.background = 'rgba(239,68,68,0.05)';
    el.style.borderColor = 'rgba(239,68,68,0.2)';
    el.style.color = 'var(--red)';
  }
}


*/
async function callWorkerAI(prompt, type) {
  if (!APP.workerUrl) throw new Error('Worker URL diperlukan');
  const url = APP.workerUrl.replace(/\/+$/, '') + '/ai';
  const res = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, type })
  });
  return await res.json();
}

// ── DASHBOARD ──────────────────────────────────────────────────
function setTodayDates() {
  const now = new Date();
  const nowParts = getMalaysiaDateParts(now);
  const label = getMalaysiaDateLabel(now);
  const el = document.getElementById('todayDateLabel');
  if (el) el.textContent = label;

  const isoDate = nowParts.ymd;
  ['guruFilterDate','muridFilterDate','notifTarikh','kTarikh'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = isoDate;
  });
  const monthEl = document.getElementById('laporanBulan');
  if (monthEl) monthEl.value = nowParts.yearMonth;
  const timeEl = document.getElementById('kMasa');
  if (timeEl) timeEl.value = nowParts.hm;
}

async function refreshDashboard() {
  renderGuruBertugasDash();
  scheduleIdleWork(function() {
    muatCuaca();
    muatWaktuSolat();
  });
  if (!APP.workerUrl) return;

  scheduleIdleWork(async function() {
    try {
      var today = getTodayYMD();
      var julatMinggu = getJulatMingguSemasa();
      var results = await Promise.allSettled([
        callWorker({ action: 'readSheet', sheetKey: 'KEHADIRAN_GURU' }),
        callWorker({ action: 'readSheet', sheetKey: 'KEHADIRAN_MURID' })
      ]);
      var guruRes = results[0], muridRes = results[1];
      if (guruRes.status === 'fulfilled' && guruRes.value.success) {
        updateDashboardGuru(guruRes.value.rows || [], today, julatMinggu);
      }
      if (muridRes.status === 'fulfilled' && muridRes.value.success) {
        updateDashboardMurid((muridRes.value.rows || []).map(parseKehadiranMuridRow), today);
      }
      setText('dash-notif', APP.notifLog.filter(function(l){return l.date===today;}).length);
      renderAktivitiTerkini();
      renderBirthdayDashboard();
    } catch(e) { /* silent */ }
  });
}

function getJulatMingguSemasa() {
  var isninIni = getIsninMingguIni();
  return {
    isnin: isninIni,
    jumaat: addDaysYMD(isninIni, 4)
  };
}

function updateDashboardGuru(allGuru, today, julatMinggu) {
  var parsedGuru = allGuru.map(parseKehadiranGuruRow).filter(function(r){ return r.nama && r.tarikh && !isPunchOutStatus(r.status); });
  var todayGuru = parsedGuru.filter(function(r){ return String(r.tarikh || '').startsWith(today); });
  var weekGuru = parsedGuru.filter(function(r){
    var t = String(r.tarikh || '').split('T')[0];
    return t >= julatMinggu.isnin && t <= julatMinggu.jumaat;
  });
  setText('dash-guru-hadir', todayGuru.filter(function(r){ return r.status === 'Hadir' || r.status === 'Lewat'; }).length);
  setText('dash-guru-sub', 'hadir hari ini daripada 12');
  renderDashGuruTable(weekGuru, julatMinggu.isnin, julatMinggu.jumaat);
}

/* legacy removed: legacyUpdateDashboardMurid
  var todayMurid = allMurid.filter(function(r){ return r.tarikh === today; });
  var hadir = todayMurid.filter(function(r){ return r.status === 'Hadir'; }).length;
  var tidakHadir = todayMurid.filter(function(r){ return ['Tidak Hadir', 'MC', 'Ponteng'].includes(r.status); });
  var total = todayMurid.length;
  var pct = total ? Math.round((hadir / total) * 100) : 0;
  setText('dash-murid-hadir', hadir);
  setText('dash-tidak-hadir', tidakHadir.length);
  setText('dash-murid-pct', total ? pct + '% hadir' : '');
  renderWeeklyChart(todayMurid);
  renderMuridTidakHadirDash(tidakHadir);
}


// renderWeeklyChart - moved to extension block above

// renderDashGuruTable - moved to extension block above

// ── KEHADIRAN GURU — GPS AUTO ──────────────────────────────────
*/
async function loadGuruProfile() {
  const user = APP.user;
  if (!user) return null;
  if (_geoProfile) return _geoProfile;
  try {
    const gurus = await getGuruList();
    const matchedGuru = gurus.find(g =>
      (g.emel || '').toLowerCase() === (user.email || '').toLowerCase() ||
      (g.nama || '').toLowerCase() === (user.name || '').toLowerCase()
    );
    const profil = Object.assign({}, matchedGuru || { nama: user.name, emel: user.email, jawatan: 'Guru', telefon: '' });
    profil.emelRasmi = String(profil.emel || '').trim();
    profil.emelLogin = String(user.email || '').trim();
    profil.emel = profil.emelLogin || profil.emelRasmi;
    _geoProfile = profil;
    return profil;
  } catch(e) {
    return { nama: user.name, emel: user.email, emelLogin: user.email, emelRasmi: '', jawatan: 'Guru', telefon: '' };
  }
}

function getGuruProfileEmailCandidates(profil) {
  var seen = {};
  return [
    APP.user && APP.user.email,
    profil && profil.emelLogin,
    profil && profil.emelRasmi,
    profil && profil.emel
  ]
    .map(function(email) { return String(email || '').trim().toLowerCase(); })
    .filter(function(email) {
      if (!email || seen[email]) return false;
      seen[email] = true;
      return true;
    });
}

function getCurrentAttendanceEmail(profil) {
  return String(
    (APP.user && APP.user.email) ||
    (profil && (profil.emelLogin || profil.emel)) ||
    ''
  ).trim();
}

function normalizeGuruKey(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function normalizePhoneKey(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeDuplicateKeyPart(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function getMuridDuplicateDescriptor(row) {
  const normalized = padSheetRow(row, MURID_SHEET_HEADERS.length);
  return {
    nama: normalizeDuplicateKeyPart(normalized[0]),
    kelas: normalizeDuplicateKeyPart(normalized[1]),
    noIc: normalizeDuplicateKeyPart(normalized[6]),
    label: String(normalized[0] || '').trim() + (normalized[1] ? ' (' + String(normalized[1]).trim() + ')' : '')
  };
}

function isSameMuridDuplicate(a, b) {
  if (!a || !b) return false;
  if (a.noIc && b.noIc && a.noIc === b.noIc) return true;
  return Boolean(a.nama && b.nama && a.kelas && b.kelas && a.nama === b.nama && a.kelas === b.kelas);
}

function findDuplicateMuridIndexByRow(row, ignoreIndex) {
  const target = getMuridDuplicateDescriptor(row);
  return _muridData.findIndex(function(existing, idx) {
    if (idx === ignoreIndex) return false;
    return isSameMuridDuplicate(target, getMuridDuplicateDescriptor(existing));
  });
}

async function findExistingKehadiranMuridDuplicates(rowsToSave) {
  const data = await callWorker({ action: 'readSheet', sheetKey: 'KEHADIRAN_MURID' });
  if (!data.success) throw new Error(data.error || 'Gagal menyemak duplicate kehadiran murid.');
  const existingKeys = new Set((data.rows || []).map(parseKehadiranMuridRow).filter(function(item) {
    return item && item.tarikh && item.kelas && item.nama;
  }).map(function(item) {
    return [normalizeDuplicateKeyPart(item.tarikh), normalizeDuplicateKeyPart(item.kelas), normalizeDuplicateKeyPart(item.nama)].join('|');
  }));
  return (rowsToSave || []).filter(function(row) {
    const key = [
      normalizeDuplicateKeyPart(row && row[2]),
      normalizeDuplicateKeyPart(row && row[1]),
      normalizeDuplicateKeyPart(row && row[0])
    ].join('|');
    return existingKeys.has(key);
  });
}

async function findExistingLaporanBertugasDuplicate(payload) {
  const targetIsnin = String((payload && payload.isnin) || '').trim();
  if (!targetIsnin) return null;
  const data = await callWorker({ action: 'readSheet', sheetKey: 'LAPORAN_BERTUGAS' });
  if (!data.success) throw new Error(data.error || 'Gagal menyemak duplicate laporan guru bertugas.');
  const rows = (data.rows || []).filter(function(row) {
    return Array.isArray(row) && row.length && String(row[0] || '').trim().toLowerCase() !== 'minggu';
  });
  return rows.find(function(row) {
    return String(row[2] || row[0] || '').trim() === targetIsnin;
  }) || null;
}

function getKelasGuruAllowed(profil) {
  var raw = String((profil && profil.kelas) || '').trim();
  if (!raw) return [];
  var upper = raw.toUpperCase();
  var matched = SENARAI_KELAS_MURID.filter(function(kelas) {
    return upper.indexOf(String(kelas || '').toUpperCase()) !== -1;
  });
  if (matched.length) return matched;
  return [raw];
}

function isGuruBertugasMingguanCurrent(profil) {
  var entry = getGuruBertugasMinggu(getIsninMingguIni());
  if (!entry) return false;
  var namaProfil = [
    normalizeGuruKey(profil && profil.nama),
    normalizeGuruKey(APP.user && APP.user.name)
  ].filter(Boolean);
  var telefonProfil = [
    normalizePhoneKey(profil && profil.telefon)
  ].filter(Boolean);
  var padanNama = [entry.guru, entry.pembantu].some(function(nama) {
    return namaProfil.includes(normalizeGuruKey(nama));
  });
  if (padanNama) return true;
  return [entry.telefon, entry.telefonPembantu].some(function(telefon) {
    return telefonProfil.includes(normalizePhoneKey(telefon));
  });
}

async function getKehadiranMuridAccess() {
  var profil = await loadGuruProfile();
  var kelasGuru = getKelasGuruAllowed(profil);
  var bolehSemuaKelas = isPentadbir() || isGuruBertugasMingguanCurrent(profil);
  var mesej = '';

  if (bolehSemuaKelas) {
    mesej = isPentadbir()
      ? 'Akses semua kelas dibenarkan untuk pentadbir.'
      : 'Akses semua kelas dibenarkan untuk guru bertugas atau pembantu minggu ini.';
    return {
      profil: profil,
      bolehSemuaKelas: true,
      allowedClasses: SENARAI_KELAS_MURID.slice(),
      mesej: mesej
    };
  }

  if (kelasGuru.length) {
    mesej = kelasGuru.length === 1
      ? 'Akses terhad kepada kelas anda: ' + kelasGuru[0] + '.'
      : 'Akses terhad kepada kelas yang ditetapkan pada profil anda.';
    return {
      profil: profil,
      bolehSemuaKelas: false,
      allowedClasses: kelasGuru,
      mesej: mesej
    };
  }

  return {
    profil: profil,
    bolehSemuaKelas: false,
    allowedClasses: [],
    mesej: 'Tiada kelas ditetapkan pada profil guru ini.'
  };
}

function isKelasAllowedForKehadiran(access, kelas) {
  if (!access) return false;
  if (access.bolehSemuaKelas) return true;
  return (access.allowedClasses || []).includes(String(kelas || '').trim());
}

function renderKelasKehadiranOptions(kelasEl, access) {
  if (!kelasEl) return;
  var allowed = (access && access.allowedClasses && access.allowedClasses.length)
    ? access.allowedClasses.slice()
    : [];
  var semua = access && access.bolehSemuaKelas;
  if (!allowed.length && semua) allowed = SENARAI_KELAS_MURID.slice();
  var options = semua ? ['<option value="">— Pilih Kelas —</option>'] : [];
  allowed.forEach(function(kelas) {
    options.push('<option value="' + kelas + '">' + kelas + '</option>');
  });
  kelasEl.innerHTML = options.join('');
  kelasEl.disabled = !semua && allowed.length <= 1;
  kelasEl.value = !semua && allowed.length ? allowed[0] : '';
}

function hitungJarak(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function updateWaktuStatus() {
  const now = new Date();
  const totalMin = getCurrentTotalMinutes(now);
  const punchOutCfg = getPunchOutConfig(now);
  const masaEl = document.getElementById('geoMasaSekarang');
  if (masaEl) masaEl.textContent = getMalaysiaTimeLabel(now);
  const tarikhEl = document.getElementById('geoTarikhSekarang');
  if (tarikhEl) tarikhEl.textContent = getMalaysiaDayLabel(now);
  const badge = document.getElementById('geoWaktuBadge');
  if (!badge) return;
  if (totalMin < GEO.jamHadir * 60) { badge.className = 'badge badge-blue'; badge.textContent = 'Sebelum Waktu'; }
  else if (totalMin < GEO.jamLewat * 60 + GEO.minLewat) { badge.className = 'badge badge-green'; badge.textContent = '✅ Waktu Hadir (7:00–7:29)'; }
  else if (totalMin < GEO.jamTidak * 60) { badge.className = 'badge badge-amber'; badge.textContent = '⚠️ Waktu Lewat (7:30–7:59)'; }
  else if (punchOutCfg && totalMin >= punchOutCfg.minutes) { badge.className = 'badge badge-blue'; badge.textContent = 'Waktu Punch-Out (' + punchOutCfg.label + ')'; }
  else { badge.className = 'badge badge-red'; badge.textContent = '❌ Melepasi Waktu (8:00+)'; }
}

async function updateGeoUserPanel() {
  const profil = await loadGuruProfile();
  if (!profil) return;
  const initials = (profil.nama || '?').split(' ').map(n => n[0] || '').join('').substring(0, 2).toUpperCase();
  const avatarEl = document.getElementById('geoUserAvatar');
  const namaEl = document.getElementById('geoUserNama');
  const jawEl = document.getElementById('geoUserJawatan');
  const emelEl = document.getElementById('geoUserEmel');
  if (avatarEl) avatarEl.textContent = initials;
  if (namaEl) namaEl.textContent = profil.nama || '-';
  if (jawEl) jawEl.textContent = profil.jawatan || '';
  if (emelEl) emelEl.textContent = profil.emel || '';
}

async function mulaAutoGPS() {
  await updateGeoUserPanel();
  ['geoActionDalam','geoActionLuar','geoActionGagal','panelKenyataanLuar','panelPilihanCuti','geoHasilPanel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  const teks = document.getElementById('geoStatusTeks');
  const sub = document.getElementById('geoStatusSub');
  const emoji = document.getElementById('geoStatusEmoji');
  if (teks) teks.textContent = 'Mendapatkan lokasi GPS...';
  if (sub) sub.textContent = 'Sila benarkan akses lokasi pada peranti anda';
  if (emoji) emoji.textContent = '📡';

  if (!navigator.geolocation) {
    if (teks) teks.textContent = 'GPS tidak disokong pada peranti ini';
    if (emoji) emoji.textContent = '❌';
    const gagal = document.getElementById('geoActionGagal');
    if (gagal) gagal.style.display = 'block';
    return;
  }
  navigator.geolocation.getCurrentPosition(
    pos => prosesGPSResult(pos),
    err => {
      if (teks) teks.textContent = 'GPS gagal — ' + (err.code === 1 ? 'Akses ditolak' : err.code === 3 ? 'Timeout' : err.message);
      if (sub) sub.textContent = 'Daftar secara manual atau benarkan akses lokasi';
      if (emoji) emoji.textContent = '⚠️';
      const gagal = document.getElementById('geoActionGagal');
      if (gagal) gagal.style.display = 'block';
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}

function prosesGPSResult(pos) {
  geoCoords = pos.coords;
  const jarak = hitungJarak(GEO.lat, GEO.lng, pos.coords.latitude, pos.coords.longitude);
  const dalamKawasan = jarak <= GEO.radius;
  const teks = document.getElementById('geoStatusTeks');
  const sub = document.getElementById('geoStatusSub');
  const emoji = document.getElementById('geoStatusEmoji');
  const panel = document.getElementById('geoStatusPanel');
  const jarakTeks = jarak < 1000 ? Math.round(jarak) + 'm' : (jarak / 1000).toFixed(2) + 'km';

  const spoofFlags = [];
  if (pos.coords.accuracy < 2) spoofFlags.push('Ketepatan <2m');
  if (pos.coords.speed > 30) spoofFlags.push('Kelajuan tidak munasabah');
  if (pos.coords.altitude === 0 && pos.coords.altitudeAccuracy === 0) spoofFlags.push('Altitude=0 tepat');

  if (spoofFlags.length >= 2) {
    if (teks) teks.textContent = '⚠️ GPS Spoofing dikesan';
    if (sub) sub.textContent = spoofFlags.join(' | ');
    if (emoji) emoji.textContent = '🚨';
    const mesej = '⚠️ *Amaran GPS Spoofing*\n\n' + (APP.user ? APP.user.name : '?') + ' mengesan GPS mock.\nFlags: ' + spoofFlags.join(', ');
    hantar_notif_gb_pk(mesej);
    const gagal = document.getElementById('geoActionGagal');
    if (gagal) gagal.style.display = 'block';
    return;
  }

  if (dalamKawasan) {
    if (emoji) emoji.textContent = '✅';
    if (teks) teks.textContent = 'Anda berada dalam kawasan sekolah';
    if (sub) sub.textContent = jarakTeks + ' dari SK Kiandongo';
    if (panel) { panel.style.background = 'rgba(16,185,129,0.06)'; panel.style.borderColor = 'rgba(16,185,129,0.25)'; }
    const dalam = document.getElementById('geoActionDalam');
    if (dalam) dalam.style.display = 'grid';
    const luar = document.getElementById('geoActionLuar');
    if (luar) luar.style.display = 'none';
    maybeAutoHadir(true);
  } else {
    if (emoji) emoji.textContent = '📍';
    if (teks) teks.textContent = 'Anda berada DI LUAR kawasan sekolah';
    if (sub) sub.textContent = jarakTeks + ' dari sekolah (had: 200m)';
    if (panel) { panel.style.background = 'rgba(239,68,68,0.06)'; panel.style.borderColor = 'rgba(239,68,68,0.2)'; }
    const luar = document.getElementById('geoActionLuar');
    if (luar) luar.style.display = 'grid';
    const dalam = document.getElementById('geoActionDalam');
    if (dalam) dalam.style.display = 'none';
  }
  maybeAutoPunchOut(true);
}

function isDalamGeofence(coords) {
  if (!coords) return false;
  return hitungJarak(GEO.lat, GEO.lng, coords.latitude, coords.longitude) <= GEO.radius;
}

function setGeoStatusMessage(title, subtitle, emoji) {
  const teks = document.getElementById('geoStatusTeks');
  const sub = document.getElementById('geoStatusSub');
  const emojiEl = document.getElementById('geoStatusEmoji');
  if (teks && title) teks.textContent = title;
  if (sub && typeof subtitle === 'string') sub.textContent = subtitle;
  if (emojiEl && emoji) emojiEl.textContent = emoji;
}

function getCurrentGeoCoords() {
  return new Promise(function(resolve) {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      function(pos) {
        geoCoords = pos.coords;
        resolve(pos.coords);
      },
      function() { resolve(null); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

async function getGuruKehadiranHariIni(profil, tarikh) {
  const data = await callWorker({ action: 'readSheet', sheetKey: 'KEHADIRAN_GURU' });
  if (!data.success) throw new Error(data.error || 'Gagal memuatkan rekod guru');
  const candidateEmails = getGuruProfileEmailCandidates(profil);
  return (data.rows || [])
    .map(parseKehadiranGuruRow)
    .filter(function(r) {
      if (!String(r.tarikh || '').startsWith(tarikh)) return false;
      const sameEmail = candidateEmails.some(function(email) {
        return String(r.email || '').toLowerCase() === email;
      });
      const sameName = String(r.nama || '').toLowerCase() === String(profil.nama || '').toLowerCase();
      return sameEmail || sameName;
    });
}

async function rekodPunchOutGuru(opts) {
  opts = opts || {};
  const profil = opts.profil || await loadGuruProfile();
  const now = opts.now instanceof Date ? opts.now : new Date();
  const tarikh = getTodayYMD(now);
  const masa = getCurrentTimeHM(now);
  const rowsHariIni = await getGuruKehadiranHariIni(profil, tarikh);
  if (rowsHariIni.some(function(r) { return isPunchOutStatus(r.status); })) {
    if (!opts.silent) showToast('Punch-out sudah direkod hari ini.', 'info');
    return { skipped: true };
  }
  if (!rowsHariIni.some(function(r) { return !isPunchOutStatus(r.status); })) {
    if (!opts.silent) showToast('Daftar kehadiran masuk dahulu sebelum punch-out.', 'error');
    return { skipped: true, missingCheckIn: true };
  }
  const coords = opts.coords || geoCoords;
  if (!isDalamGeofence(coords)) {
    if (!opts.silent) showToast('Punch-out hanya boleh dibuat dalam geofence sekolah.', 'error');
    return { skipped: true, outside: true };
  }
  const gpsStr = coords ? coords.latitude.toFixed(6) + ',' + coords.longitude.toFixed(6) : '';
  const jarak = coords ? Math.round(hitungJarak(GEO.lat, GEO.lng, coords.latitude, coords.longitude)) : 0;
  const catatan = opts.catatan || (opts.auto ? 'Punch out automatik' : 'Punch out manual');
  const userEmail = getCurrentAttendanceEmail(profil);
  const data = await callWorker({
    action: 'appendRow',
    sheetKey: 'KEHADIRAN_GURU',
    row: [profil.nama, tarikh, 'Punch Out', masa, catatan, userEmail, gpsStr]
  });
  if (!data.success) throw new Error(data.error || 'Gagal merekod punch-out');
  if (!opts.silent) {
    tunjukHasil('✅ Punch-out berjaya direkod!\n\n👤 ' + profil.nama + '\n⏰ Masa Keluar: ' + masa + '\n📍 GPS: ' + jarak + 'm dari sekolah', 'success');
    showToast('Punch-out direkod — ' + masa, 'success');
  }
  setTimeout(function() { loadKehadiranGuru(); }, 800);
  return { success: true, masa: masa };
}

async function punchOutManual() {
  const cfg = getPunchOutConfig(new Date());
  if (!cfg) { showToast('Punch-out automatik hanya digunakan pada hari bekerja.', 'info'); return; }
  const coords = await getCurrentGeoCoords();
  if (!coords) { showToast('GPS tidak dapat dikesan untuk punch-out.', 'error'); return; }
  await rekodPunchOutGuru({ coords: coords, auto: false });
}

async function maybeAutoHadir(forceCheck) {
  if (_autoHadirBusy || !APP.user) return;
  _autoHadirBusy = true;
  try {
    const coords = geoCoords || await getCurrentGeoCoords();
    if (!isDalamGeofence(coords)) return;
    if (!isWithinAutoHadirWindow(new Date())) {
      if (forceCheck) {
        setGeoStatusMessage('Tetingkap auto daftar hadir telah tamat', 'Auto punch-in hanya berjalan antara 7:00 pagi hingga sebelum 8:00 pagi.', 'ℹ️');
      }
      return;
    }
    const result = await autoHadir({ coords: coords, auto: true, silent: true, catatan: 'Daftar hadir automatik GPS' });
    if (result && result.success) {
      setGeoStatusMessage('Kehadiran auto berjaya direkod', 'Status: ' + result.status + ' pada ' + result.masa + '.', '✅');
      tunjukHasil('✅ Kehadiran automatik berjaya direkod.<br><br>📋 Status: ' + result.status + '<br>⏰ Masa: ' + result.masa + '<br>📍 Disahkan dalam geofence sekolah.', 'success');
      return;
    }
    if (result && result.existing) {
      setGeoStatusMessage('Kehadiran hari ini sudah wujud', 'Sistem mengesan rekod sedia ada, jadi tiada rekod baharu dibuat.', 'ℹ️');
      return;
    }
  } catch (e) {
    // silent
  } finally {
    _autoHadirBusy = false;
  }
}

async function maybeAutoPunchOut(forceCheck) {
  if (_autoPunchOutBusy || !APP.user) return;
  const now = new Date();
  const cfg = getPunchOutConfig(now);
  if (!cfg) return;
  const totalMin = getCurrentTotalMinutes(now);
  if (totalMin < cfg.minutes) return;
  _autoPunchOutBusy = true;
  try {
    const coords = geoCoords || await getCurrentGeoCoords();
    if (!isDalamGeofence(coords)) return;
    await rekodPunchOutGuru({ coords: coords, auto: true, silent: true, now: now, catatan: 'Punch out automatik ' + cfg.label });
  } catch (e) {
    // silent
  } finally {
    _autoPunchOutBusy = false;
  }
}

async function autoHadir(opts) {
  opts = opts || {};
  const profil = opts.profil || await loadGuruProfile();
  const now = opts.now instanceof Date ? opts.now : new Date();
  const tarikh = getTodayYMD(now);
  const masa = getCurrentTimeHM(now);
  const totalMin = getCurrentTotalMinutes(now);
  if (!opts.manual && !isWithinAutoHadirWindow(now)) {
    return { skipped: true, outsideWindow: true };
  }
  const status = totalMin < GEO.jamLewat * 60 + GEO.minLewat ? 'Hadir' : 'Lewat';
  const rowsHariIni = await getGuruKehadiranHariIni(profil, tarikh);
  if (rowsHariIni.some(function(r) { return !isPunchOutStatus(r.status); })) {
    if (!opts.silent) showToast('Kehadiran sudah direkod hari ini.', 'info');
    return { skipped: true, existing: true };
  }
  const coords = opts.coords || geoCoords;
  if (!isDalamGeofence(coords)) {
    if (!opts.silent) showToast('Daftar hadir hanya boleh dibuat dalam geofence sekolah.', 'error');
    return { skipped: true, outside: true };
  }
  const gpsStr = coords ? coords.latitude.toFixed(6) + ',' + coords.longitude.toFixed(6) : '';
  const jarak = coords ? Math.round(hitungJarak(GEO.lat, GEO.lng, coords.latitude, coords.longitude)) : 0;
  const userEmail = getCurrentAttendanceEmail(profil);
  const catatan = opts.catatan || '';
  try {
    const data = await callWorker({
      action: 'appendRow', sheetKey: 'KEHADIRAN_GURU',
      row: [profil.nama, tarikh, status, masa, catatan, userEmail, gpsStr]
    });
    if (!data.success) throw new Error(data.error);
    if (!opts.silent) {
      tunjukHasil('✅ Kehadiran berjaya direkod!\n\n👤 ' + profil.nama + '\n📋 Status: ' + status + '\n⏰ Masa: ' + masa + '\n📍 GPS: ' + jarak + 'm dari sekolah', 'success');
      showToast(status + ' direkod — ' + masa, 'success');
    }
    setTimeout(() => loadKehadiranGuru(), 1000);
    return { success: true, masa: masa, status: status };
  } catch(e) {
    if (!opts.silent) showToast('Gagal: ' + e.message, 'error');
    return { success: false, error: e };
  }
}

function showKenyataanLuar() {
  const el = document.getElementById('panelKenyataanLuar');
  const el2 = document.getElementById('panelPilihanCuti');
  if (el) el.style.display = 'block';
  if (el2) el2.style.display = 'none';
}

function showPilihanCuti() {
  const el = document.getElementById('panelPilihanCuti');
  const el2 = document.getElementById('panelKenyataanLuar');
  if (el) el.style.display = 'block';
  if (el2) el2.style.display = 'none';
}

async function submitBertugasLuar() {
  const profil = await loadGuruProfile();
  const jenis = document.getElementById('jenisLuar').value;
  const dest = document.getElementById('destinasiLuar').value.trim();
  if (!dest) { showToast('Sila isi destinasi/butiran tugas.', 'error'); return; }
  const now = new Date();
  const tarikh = getTodayYMD(now);
  const masa = getCurrentTimeHM(now);
  const catatan = jenis + ': ' + dest;
  const userEmail = getCurrentAttendanceEmail(profil);
  try {
    const data = await callWorker({ action: 'appendRow', sheetKey: 'KEHADIRAN_GURU', row: [profil.nama, tarikh, 'Tidak Berada', masa, catatan, userEmail, ''] });
    if (!data.success) throw new Error(data.error);
    const mesej = '📋 *Makluman Bertugas Luar*\n\n*' + profil.nama + '* (' + (profil.jawatan || 'Guru') + ')\nJenis: ' + jenis + '\nDestinasi: ' + dest + '\nTarikh: ' + tarikh + ' | ' + masa + '\n\n_SK Kiandongo_';
    await hantar_notif_gb_pk(mesej);
    tunjukHasil('📋 Bertugas luar direkod.\n\n' + catatan + '\n\nNotifikasi dihantar kepada GB & PK.', 'info');
    showToast('Bertugas luar direkod!', 'success');
    setTimeout(() => loadKehadiranGuru(), 1000);
  } catch(e) { showToast('Gagal: ' + e.message, 'error'); }
}

async function submitCuti(kod, nama_cuti) {
  const profil = await loadGuruProfile();
  const now = new Date();
  const tarikh = getTodayYMD(now);
  const masa = getCurrentTimeHM(now);
  const userEmail = getCurrentAttendanceEmail(profil);
  try {
    const data = await callWorker({ action: 'appendRow', sheetKey: 'KEHADIRAN_GURU', row: [profil.nama, tarikh, 'Cuti', masa, kod + ' - ' + nama_cuti, userEmail, ''] });
    if (!data.success) throw new Error(data.error);
    const mesej = '📋 *Makluman Cuti*\n\n*' + profil.nama + '* mengambil cuti:\n*' + kod + '* — ' + nama_cuti + '\nTarikh: ' + tarikh + '\n\n_SK Kiandongo_';
    await hantar_notif_gb_pk(mesej);
    tunjukHasil('📋 Cuti ' + kod + ' direkod.\n\nNotifikasi dihantar kepada GB & PK.', 'info');
    showToast('Cuti ' + kod + ' direkod!', 'success');
    setTimeout(() => loadKehadiranGuru(), 1000);
  } catch(e) { showToast('Gagal: ' + e.message, 'error'); }
}

async function logTanpaKenyataan() {
  const profil = await loadGuruProfile();
  const now = new Date();
  const tarikh = getTodayYMD(now);
  const masa = getCurrentTimeHM(now);
  const guardTK = 'ssh_notif_tk_' + tarikh + '_' + (profil.nama||'').replace(/\s/g,'');
  const userEmail = getCurrentAttendanceEmail(profil);
  if (localStorage.getItem(guardTK)) { showToast('TK sudah dilog hari ini.', 'error'); return; }
  try {
    const data = await callWorker({ action: 'appendRow', sheetKey: 'KEHADIRAN_GURU', row: [profil.nama, tarikh, 'Tanpa Kenyataan', masa, 'TK - Tiada kenyataan', userEmail, ''] });
    if (!data.success) throw new Error(data.error);
    const mesej = '🚨 *Amaran Tanpa Kenyataan*\n\n*' + profil.nama + '* tidak hadir tanpa kenyataan.\nTarikh: ' + tarikh + ' | ' + masa + '\n\nSila ambil tindakan.\n\n_SK Kiandongo_';
    await hantar_notif_gb_pk(mesej);
    localStorage.setItem(guardTK, '1');
    tunjukHasil('⚠️ Dilog sebagai Tanpa Kenyataan.\n\nNotifikasi dihantar kepada GB & PK.', 'error');
    showToast('Dilog sebagai Tanpa Kenyataan.', 'error');
    setTimeout(() => loadKehadiranGuru(), 1000);
  } catch(e) { showToast('Gagal: ' + e.message, 'error'); }
}

function tunjukHasil(teks, jenis) {
  jenis = jenis || 'success';
  const panel = document.getElementById('geoHasilPanel');
  const teksEl = document.getElementById('geoHasilTeks');
  if (!panel || !teksEl) return;
  panel.style.display = 'block';
  panel.style.background = jenis === 'success' ? 'rgba(16,185,129,0.08)' : jenis === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(26,79,160,0.06)';
  panel.style.borderColor = jenis === 'success' ? 'rgba(16,185,129,0.25)' : jenis === 'error' ? 'rgba(239,68,68,0.2)' : 'rgba(26,79,160,0.15)';
  teksEl.innerHTML = teks.replace(/\n/g, '<br>');
  ['geoActionDalam','geoActionLuar','panelKenyataanLuar','panelPilihanCuti'].forEach(function(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

async function getGbPkTelFromGuru() {
  try {
    const gurus = await getGuruList();
    const hasil = [];
    gurus.forEach(function(g) {
      const j = String(g.jawatan || '').trim().toLowerCase();
      const tel = String(g.telefon || '').trim();
      if (tel && (j.includes('guru besar') || j.includes('penolong kanan'))) hasil.push(tel);
    });
    return [...new Set(hasil)];
  } catch(e) { return []; }
}

async function hantar_notif_gb_pk(mesej) {
  if (!isNotifAutoEnabled() || !isGuruAttendanceNotifEnabled()) return;
  let targets = await getGbPkTelFromGuru();
  // Fallback ke GEO config jika tiada data guru
  if (!targets.length) targets = [GEO.gbTel, GEO.pkTel].filter(Boolean);
  for (const tel of targets) {
    try { await callFonnte(tel, mesej); logNotif('Guru Bertugas', tel, mesej, 'Berjaya'); await sleep(400); } catch(e) {}
  }
  try { await hantarTelegram(mesej); logNotif('Guru Bertugas', 'Telegram Admin', mesej, 'Berjaya'); } catch(e) {}
}

async function getGuruByJawatan(jawatanTarget) {
  const target = String(jawatanTarget || '').trim().toLowerCase();
  if (!target) return null;
  const gurus = await getGuruList();
  return gurus.find(function(guru) {
    return String((guru && guru.jawatan) || '').trim().toLowerCase() === target;
  }) || null;
}

async function hantarNotifikasiPelaporanKokumPK(payload) {
  const pkKokum = await getGuruByJawatan('Penolong Kanan Kokurikulum');
  if (!pkKokum) {
    logNotif('Pelaporan Kokum', 'PK Kokum', 'Profil PK Kokum tidak dijumpai.', 'Gagal');
    return { sent: false, reason: 'missing-profile' };
  }
  const telefon = String(pkKokum.telefon || '').trim();
  if (!telefon) {
    logNotif('Pelaporan Kokum', pkKokum.nama || 'PK Kokum', 'Nombor telefon PK Kokum tidak dijumpai.', 'Gagal');
    return { sent: false, reason: 'missing-phone', nama: pkKokum.nama || '' };
  }
  const tarikhDate = payload && payload.tarikh ? parseLocalDateYMD(payload.tarikh) : null;
  const tarikhLabel = tarikhDate
    ? tarikhDate.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })
    : (payload && payload.tarikh) || '-';
  const mesej = [
    '📘 *Pelaporan Kokurikulum Baharu*',
    '',
    'Guru penasihat: *' + (payload.namaGuru || '-') + '*',
    'Tarikh: ' + tarikhLabel + ' (' + (payload.hari || 'Rabu') + ')',
    'Kategori: ' + (payload.kategori || '-'),
    'Nama Program: ' + (payload.unit || '-'),
    'Tajuk/Fokus: ' + (payload.tajuk || '-'),
    'Masa: ' + (payload.masa || '-'),
    'Tempat: ' + (payload.tempat || '-'),
    'Kehadiran: Hadir ' + (payload.bilHadir || '0') + ' | Tidak hadir ' + (payload.bilTidakHadir || '0'),
    '',
    '_Dihantar automatik melalui SmartSchoolHub_'
  ].join('\n');
  const resp = await callFonnte(telefon, mesej);
  if (resp && (resp.status === true || resp.status === 'true')) {
    logNotif('Pelaporan Kokum', telefon, mesej, 'Berjaya');
    return { sent: true, nama: pkKokum.nama || '', telefon: telefon };
  }
  logNotif('Pelaporan Kokum', telefon, mesej, 'Gagal');
  throw new Error('Fonnte memberi respons tidak berjaya.');
}

async function sendTelegramLogged(type, target, mesej) {
  try {
    await hantarTelegram(mesej);
    logNotif(type, target || 'Telegram', mesej, 'Berjaya');
    return true;
  } catch (e) {
    logNotif(type, target || 'Telegram', mesej, 'Gagal');
    return false;
  }
}

function getGuruReminderIdentity(row) {
  const guru = Array.isArray(row) ? row : [];
  const phone = normalizePhoneKey(guru[4] || guru[6] || '');
  const email = normalizeGuruKey(guru[1] || '');
  const name = normalizeGuruKey(guru[0] || '');
  return phone || email || name;
}

function getGuruReminderGuardKey(tarikh, row) {
  const identity = getGuruReminderIdentity(row);
  return identity ? 'ssh_notif_guru_personal_' + tarikh + '_' + identity : '';
}

function dedupeGuruReminderRows(rows) {
  const seen = new Set();
  return (rows || []).filter(function(row) {
    const key = getGuruReminderIdentity(row);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function sendGuruAttendancePersonalReminderOnce(row, tarikh, resultBox) {
  const guardKey = getGuruReminderGuardKey(tarikh, row);
  if (!guardKey || localStorage.getItem(guardKey)) {
    return { skipped: true };
  }
  const tel = String((row && (row[4] || row[6])) || '').trim();
  if (!tel) return { skipped: true, missingTarget: true };
  const mesejGuru = renderAttendanceTemplate(getAttendanceTemplate('ssh_attendance_tpl_guru_personal', DEFAULT_ATTENDANCE_TEMPLATES.guruPersonal), {
    NAMA: row[0],
    TARIKH: tarikh,
    SEKOLAH: getSchoolTemplateName()
  });
  localStorage.setItem(guardKey, new Date().toISOString());
  try {
    await callFonnte(tel, mesejGuru);
    logNotif('Tidak Hadir Guru', tel, mesejGuru, 'Berjaya');
    if (resultBox) resultBox.textContent += 'Berjaya: ' + row[0] + ' -> ' + tel + '\n';
    await sleep(400);
    return { sent: true };
  } catch (e) {
    localStorage.removeItem(guardKey);
    logNotif('Tidak Hadir Guru', tel, mesejGuru, 'Gagal');
    if (resultBox) resultBox.textContent += 'Gagal: ' + row[0] + ' - ' + e.message + '\n';
    return { failed: true };
  }
}

async function getTidakHadirMuridList(tarikh, kelas) {
  const data = await callWorker({ action: 'readSheet', sheetKey: 'KEHADIRAN_MURID' });
  if (!data.success) throw new Error(data.error || 'Gagal');
  let rows = (data.rows || [])
    .map(parseKehadiranMuridRow)
    .filter(r => r.tarikh === tarikh && ['Tidak Hadir', 'Ponteng', 'Sakit'].includes(r.status));
  if (kelas) rows = rows.filter(r => r.kelas === kelas);
  return rows;
}

async function getGuruBelumIsiList(tarikh) {
  const [kehadiranData, guruData] = await Promise.all([
    callWorker({ action: 'readSheet', sheetKey: 'KEHADIRAN_GURU' }),
    callWorker({ action: 'readSheet', sheetKey: 'GURU' })
  ]);
  if (!kehadiranData.success || !guruData.success) throw new Error('Gagal mendapatkan data guru');
  const sudahIsi = new Set(
    (kehadiranData.rows || [])
      .map(parseKehadiranGuruRow)
      .filter(r => String(r.tarikh || '').startsWith(tarikh))
      .map(r => String(r.nama || '').toLowerCase())
  );
  const guruList = (guruData.rows || [])
    .filter(r => r[0] && String(r[0]).toLowerCase() !== 'nama')
    .filter(r => !['Pembantu Operasi'].includes(r[2] || ''));
  return dedupeGuruReminderRows(guruList.filter(r => !sudahIsi.has(String(r[0] || '').toLowerCase())));
}

async function openTambahKehadiranGuru() {
  const now = new Date();
  const totalMin = getCurrentTotalMinutes(now);
  let autoStatus = 'Hadir';
  if (totalMin >= GEO.jamLewat * 60 + GEO.minLewat && totalMin < GEO.jamTidak * 60) autoStatus = 'Lewat';
  else if (totalMin >= GEO.jamTidak * 60) autoStatus = 'Tidak Hadir';

  document.getElementById('kGuruTarikh').value = getTodayYMD(now);
  document.getElementById('kGuruMasa').value = getCurrentTimeHM(now);
  document.getElementById('kGuruStatus').value = autoStatus;
  document.getElementById('kGuruCatatan').value = '';

  const user = APP.user;
  if (!user) { showToast('Sila log masuk dahulu.', 'error'); return; }
  const namaLogin = user.name || user.email || '';
  const hiddenNama = document.getElementById('kGuruNama');
  if (hiddenNama) hiddenNama.value = namaLogin;
  document.getElementById('kGuruNamaDisplay').textContent = namaLogin;
  document.getElementById('kGuruEmelDisplay').textContent = user.email || '';
  const initials = namaLogin.split(' ').map(n => n[0] || '').join('').substring(0, 2).toUpperCase();
  document.getElementById('kGuruAvatar').textContent = initials;
  document.getElementById('kGuruJawatanDisplay').textContent = 'Memuatkan...';

  try {
    const gurus = await getGuruList();
    const profil = gurus.find(g =>
      (g.emel || '').toLowerCase() === (user.email || '').toLowerCase() ||
      (g.nama || '').toLowerCase() === namaLogin.toLowerCase()
    );
    if (profil) {
      document.getElementById('kGuruJawatanDisplay').textContent = profil.jawatan || '';
      if (profil.nama) {
        if (hiddenNama) hiddenNama.value = profil.nama;
        document.getElementById('kGuruNamaDisplay').textContent = profil.nama;
        const ini = profil.nama.split(' ').map(n => n[0] || '').join('').substring(0, 2).toUpperCase();
        document.getElementById('kGuruAvatar').textContent = ini;
      }
    } else {
      document.getElementById('kGuruJawatanDisplay').textContent = 'Guru';
    }
  } catch(e) { document.getElementById('kGuruJawatanDisplay').textContent = ''; }
  openModal('modalKehadiranGuru');
}

function autoFillGuru() {}

async function submitKehadiranGuru() {
  const nama = (document.getElementById('kGuruNama').value || '').trim();
  const tarikh = document.getElementById('kGuruTarikh').value;
  const masa = document.getElementById('kGuruMasa').value;
  const status = document.getElementById('kGuruStatus').value;
  const catatan = document.getElementById('kGuruCatatan').value.trim();
  if (!nama) { showToast('Maklumat pengguna tidak dijumpai.', 'error'); return; }
  if (!tarikh) { showToast('Tarikh wajib diisi.', 'error'); return; }
  try {
    const data = await callWorker({ action: 'appendRow', sheetKey: 'KEHADIRAN_GURU', row: [nama, tarikh, status, masa, catatan, APP.user ? APP.user.email : ''] });
    if (!data.success) throw new Error(data.error);
    closeModal('modalKehadiranGuru');
    showToast('✅ ' + nama + ' — ' + status + ' direkod!', 'success');
    loadKehadiranGuru();
  } catch(e) { showToast('Ralat: ' + e.message, 'error'); }
}

async function initKehadiranGuruModule() {
  await updateGeoUserPanel();
  mulaAutoGPS();
  maybeAutoPunchOut(true);
}

async function semakDanNotifGuruBelumIsi() {
  const now = new Date();
  const totalMin = getCurrentTotalMinutes(now);
  if (totalMin < 7 * 60 + 45 || totalMin > 8 * 60 + 5) return;
  const profil = await loadGuruProfile();
  if (!isPentadbir() && !isGuruBertugasMingguanCurrent(profil)) return;
  const tarikh = getTodayYMD(now);
  const guardKey = 'ssh_notif_peringatan_' + tarikh;
  if (localStorage.getItem(guardKey)) return;
  try {
    const [kehadiranData, guruData] = await Promise.all([
      callWorker({ action: 'readSheet', sheetKey: 'KEHADIRAN_GURU' }),
      callWorker({ action: 'readSheet', sheetKey: 'GURU' })
    ]);
    if (!kehadiranData.success || !guruData.success) return;
    const sudahIsi = new Set(
      (kehadiranData.rows || [])
        .map(parseKehadiranGuruRow)
        .filter(r => String(r.tarikh || '').startsWith(tarikh))
        .map(r => String(r.nama || '').toLowerCase())
    );
    const guruList = (guruData.rows || [])
      .filter(r => r[0] && String(r[0]).toLowerCase() !== 'nama')
      .filter(r => !['Pembantu Operasi'].includes(r[2] || ''));
    const belumIsi = dedupeGuruReminderRows(guruList.filter(r => !sudahIsi.has(String(r[0] || '').toLowerCase())));
    if (!belumIsi.length) return;
    const namaList = belumIsi.map(r => '- ' + r[0]).join('\n');
    const mesej = renderAttendanceTemplate(getAttendanceTemplate('ssh_attendance_tpl_guru_admin', DEFAULT_ATTENDANCE_TEMPLATES.guruAdmin), {
      TARIKH: tarikh,
      BILANGAN: belumIsi.length,
      SENARAI: namaList,
      SEKOLAH: getSchoolTemplateName()
    });
    await hantar_notif_gb_pk(mesej);
    localStorage.setItem(guardKey, '1');
    for (const g of belumIsi) {
      await sendGuruAttendancePersonalReminderOnce(g, tarikh);
    }
  } catch(e) {}
}

async function notifMuridTidakHadirJam9() {
  const now = new Date();
  const totalMin = getCurrentTotalMinutes(now);
  if (totalMin < 9 * 60 || totalMin > 9 * 60 + 10) return;
  const tarikh = getTodayYMD(now);
  if (localStorage.getItem('ssh_notif9_' + tarikh)) return;
  try {
    const kehadiranData = await callWorker({ action: 'readSheet', sheetKey: 'KEHADIRAN_MURID' });
    if (!kehadiranData.success) return;
    const tidakHadir = (kehadiranData.rows || [])
      .map(parseKehadiranMuridRow)
      .filter(r => r.tarikh === tarikh && ['Tidak Hadir', 'Sakit', 'Ponteng'].includes(r.status))
      .map(r => ({ nama: r.nama, kelas: r.kelas, status: r.status, telefon: r.telefon || '' }));
    if (!tidakHadir.length) return;
    const tpl = getAttendanceTemplate('ssh_attendance_tpl_murid_guardian', getLegacyMuridGuardianTemplate());
    let sent = 0;
    const namaList = tidakHadir.map(m => '- ' + m.nama + ' (' + m.kelas + ')').join('\n');
    const mesejTelegram = renderAttendanceTemplate(getAttendanceTemplate('ssh_attendance_tpl_murid_summary', DEFAULT_ATTENDANCE_TEMPLATES.muridSummary), {
      TARIKH: tarikh,
      KELAS: 'Semua Kelas',
      BILANGAN: tidakHadir.length,
      SENARAI: namaList,
      SEKOLAH: getSchoolTemplateName()
    });
    const tgOk = await sendTelegramLogged('Auto Tidak Hadir Murid', 'Telegram Admin', mesejTelegram);
    for (const m of tidakHadir) {
      if (!m.telefon) continue;
      const mesej = renderAttendanceTemplate(tpl, {
        NAMA: m.nama,
        KELAS: m.kelas,
        STATUS: m.status,
        TARIKH: tarikh,
        SEKOLAH: getSchoolTemplateName()
      });
      try { await callFonnte(m.telefon, mesej); logNotif('Auto Tidak Hadir Murid', m.telefon, mesej, 'Berjaya'); sent++; } catch(e) {}
      await sleep(500);
    }
    localStorage.setItem('ssh_notif9_' + tarikh, '1');
    if (sent > 0 || tgOk) showToast('📩 Notifikasi tidak hadir murid dihantar.', 'info');
  } catch(e) {}
}

setInterval(function() { updateWaktuStatus(); semakDanNotifGuruBelumIsi(); notifMuridTidakHadirJam9(); semakNotifHariLahirAuto(); maybeAutoHadir(false); maybeAutoPunchOut(false); }, 60000);
setInterval(updateWaktuStatus, 1000);

function parseKehadiranGuruRow(r) {
  const row = Array.isArray(r) ? r : [];
  const isNewFormat = row.length >= 6 && /^\d{4}-\d{2}-\d{2}$/.test(String(row[1] || '').trim()) && String(row[2] || '').includes('@');
  if (isNewFormat) {
    const parsed = {
      id: String(row[0] || '').trim(),
      tarikh: String(row[1] || '').trim(),
      email: String(row[2] || '').trim(),
      nama: String(row[3] || '').trim(),
      masa: String(row[4] || '').trim(),
      status: String(row[5] || '').trim(),
      catatan: String(row[15] || row[14] || '').trim(),
      gps: Boolean(String(row[6] || '').trim() || String(row[7] || '').trim()),
      raw: row
    };
    parsed[0] = parsed.nama;
    parsed[1] = parsed.tarikh;
    parsed[2] = parsed.status;
    parsed[3] = parsed.masa;
    parsed[4] = parsed.catatan;
    parsed[6] = parsed.gps ? '1' : '';
    return parsed;
  }
  const parsed = {
    id: '',
    tarikh: String(row[1] || '').trim(),
    email: String(row[5] || '').trim(),
    nama: String(row[0] || '').trim(),
    masa: String(row[3] || '').trim(),
    status: String(row[2] || '').trim(),
    catatan: String(row[4] || '').trim(),
    gps: Boolean(String(row[6] || '').trim()),
    raw: row
  };
  parsed[0] = parsed.nama;
  parsed[1] = parsed.tarikh;
  parsed[2] = parsed.status;
  parsed[3] = parsed.masa;
  parsed[4] = parsed.catatan;
  parsed[6] = parsed.gps ? '1' : '';
  return parsed;
}

function buildGuruAttendanceDisplayRows(rows) {
  const grouped = {};
  (rows || []).forEach(function(r) {
    const tarikh = String(r.tarikh || '').split('T')[0];
    const key = (r.nama || '') + '|' + tarikh;
    if (!grouped[key]) {
      grouped[key] = {
        nama: r.nama || '-',
        tarikh: tarikh,
        status: '',
        masaMasuk: '',
        masaKeluar: '',
        catatanMasuk: '',
        catatanKeluar: '',
        gpsMasuk: false,
        gpsKeluar: false
      };
    }
    const item = grouped[key];
    if (isPunchOutStatus(r.status)) {
      if (!item.masaKeluar || String(r.masa || '') > item.masaKeluar) {
        item.masaKeluar = String(r.masa || '');
        item.catatanKeluar = String(r.catatan || '');
      }
      item.gpsKeluar = item.gpsKeluar || Boolean(r.gps);
      return;
    }
    if (!item.masaMasuk || String(r.masa || '') < item.masaMasuk) {
      item.masaMasuk = String(r.masa || '');
      item.status = String(r.status || '');
      item.catatanMasuk = String(r.catatan || '');
    }
    item.gpsMasuk = item.gpsMasuk || Boolean(r.gps);
  });
  return Object.values(grouped).sort(function(a, b) {
    const tarikhCompare = String(b.tarikh || '').localeCompare(String(a.tarikh || ''));
    if (tarikhCompare !== 0) return tarikhCompare;
    return String(a.nama || '').localeCompare(String(b.nama || ''));
  });
}

function getAttendanceEntryMode(catatan) {
  const note = String(catatan || '').trim().toLowerCase();
  if (!note) return 'manual';
  if (note.includes('automatik') || note.includes('auto')) return 'auto';
  if (note.includes('manual')) return 'manual';
  if (note.includes('tk -') || note.includes('tanpa kenyataan')) return 'tk';
  if (note.includes('cuti')) return 'cuti';
  if (note.includes('bertugas luar') || note.includes('mesyuarat') || note.includes('taklimat') || note.includes('kursus')) return 'luar';
  return 'manual';
}

function buildAttendanceSourceBadges(row) {
  const badges = [];
  const masukMode = getAttendanceEntryMode(row.catatanMasuk);
  const keluarMode = getAttendanceEntryMode(row.catatanKeluar);
  if (row.masaMasuk) {
    badges.push(masukMode === 'auto'
      ? '<span class="badge badge-green">Masuk Auto</span>'
      : '<span class="badge badge-gray">Masuk Manual</span>');
  }
  if (row.masaKeluar) {
    badges.push(keluarMode === 'auto'
      ? '<span class="badge badge-blue">Keluar Auto</span>'
      : '<span class="badge badge-gray">Keluar Manual</span>');
  }
  return badges.join(' ');
}

function isWithinAutoHadirWindow(now) {
  const current = now instanceof Date ? now : new Date();
  const totalMin = getCurrentTotalMinutes(current);
  if (totalMin < GEO.jamHadir * 60 + GEO.minHadir) return false;
  if (totalMin >= GEO.jamTidak * 60 + GEO.minTidak) return false;
  return true;
}

// ── KEHADIRAN GURU — TABLE ─────────────────────────────────────
async function loadKehadiranGuru(options) {
  const opts = Object.assign({ silent: false, preserveTable: false, reason: 'manual' }, options || {});
  const tbody = document.getElementById('guruKehadiranBody');
  if (!tbody) return;
  if (_kehadiranGuruLoading) return;
  _kehadiranGuruLoading = true;
  if (!opts.preserveTable || !tbody.children.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="color:var(--muted);text-align:center;padding:20px">Memuat data kehadiran guru secara langsung...</td></tr>';
  }
  try {
    const data = await callWorker({ action: 'readSheet', sheetKey: 'KEHADIRAN_GURU' });
    if (!data.success) throw new Error(data.error || 'Gagal');
    const rows = (data.rows || []).map(parseKehadiranGuruRow);
    const groupedRows = buildGuruAttendanceDisplayRows(rows);
    const date = document.getElementById('guruFilterDate').value;
    let displayRows = groupedRows;
    if (date) displayRows = displayRows.filter(r => String(r.tarikh || '').startsWith(date));
    const hEl = document.getElementById('guru-stat-hadir');
    const tEl = document.getElementById('guru-stat-tidak');
    const cEl = document.getElementById('guru-stat-cuti');
    if (hEl) hEl.textContent = displayRows.filter(r => ['Hadir','Lewat'].includes(r.status)).length;
    if (tEl) tEl.textContent = displayRows.filter(r => ['Tidak Berada','Tanpa Kenyataan','Tidak Hadir'].includes(r.status)).length;
    if (cEl) cEl.textContent = displayRows.filter(r => ['Cuti','MC'].includes(r.status)).length;
    if (!displayRows.length) { tbody.innerHTML = '<tr><td colspan="7" style="color:var(--muted);text-align:center;padding:20px">Tiada rekod</td></tr>'; return; }
    tbody.innerHTML = displayRows.map(function(r) {
      const catatanGabung = [r.catatanMasuk, r.catatanKeluar ? 'Keluar: ' + r.catatanKeluar : ''].filter(Boolean).join(' | ');
      const sourceBadges = buildAttendanceSourceBadges(r);
      const statusHtml = statusBadge(r.status || '-') + (r.masaKeluar ? ' <span class="badge badge-blue">Punch Out</span>' : '') + (sourceBadges ? ' ' + sourceBadges : '');
      const gpsHtml = (r.gpsMasuk ? '<span class="badge badge-blue">Masuk</span>' : '') + (r.gpsKeluar ? ' <span class="badge badge-green">Keluar</span>' : '');
      return '<tr><td data-label="Nama"><strong>' + escapeHtml(r.nama || '-') + '</strong></td><td data-label="Tarikh">' + escapeHtml(r.tarikh || '-') + '</td><td data-label="Masa Masuk">' + escapeHtml(r.masaMasuk || '-') + '</td><td data-label="Masa Keluar">' + escapeHtml(r.masaKeluar || '-') + '</td><td data-label="Status">' + statusHtml + '</td><td data-label="Catatan" style="color:var(--muted);font-size:0.82rem">' + escapeHtml(catatanGabung) + '</td><td data-label="GPS">' + gpsHtml + '</td></tr>';
    }).join('');
    if (!opts.silent) showToast('Data kehadiran guru dikemas kini.', 'success');
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="7" style="color:var(--red);text-align:center;padding:20px">' + escapeHtml(e.message) + '</td></tr>';
    showToast(opts.silent ? 'Paparan live kehadiran guru terganggu: ' + e.message : e.message, 'error');
  } finally {
    _kehadiranGuruLoading = false;
  }
}

function filterByDate(jenis) {
  if (jenis === 'guru') loadKehadiranGuru();
  else loadKehadiranMurid();
}

// ── KEHADIRAN MURID ────────────────────────────────────────────
async function getMuridByKelas(kelas) {
  if (_muridCache[kelas]) return _muridCache[kelas];
  try {
    const data = await callWorker({ action: 'readSheet', sheetKey: 'MURID' });
    if (!data.success) throw new Error(data.error);
    const rows = (data.rows || []).filter(r => r[0] && String(r[0]).toLowerCase() !== 'nama');
    _muridCache = {};
    rows.forEach(r => {
      const k = r[1] || '';
      if (!_muridCache[k]) _muridCache[k] = [];
      _muridCache[k].push({ nama: r[0], kelas: r[1], jantina: r[2], telefon: r[4] || '', wali: r[5] || '' });
    });
  } catch(e) { showToast('Gagal muatkan senarai murid: ' + e.message, 'error'); return []; }
  return _muridCache[kelas] || [];
}

function parseKehadiranMuridRow(r) {
  const row = Array.isArray(r) ? r : [];
  let tarikh = row[2];
  let kelas = row[1] || '';
  let nama = row[0] || '';
  let status = row[3] || '';
  let telefon = row[4] || '';
  let catatan = row[5] || '';
  let extra = {};

  if (row.length >= 6 && /^\d{4}-\d{2}-\d{2}$/.test(String(row[1]))) {
    tarikh = row[1];
    kelas = row[2] || kelas;
    nama = row[3] || nama;
    status = row[5] || status;
    telefon = row[6] || row[4] || telefon;
    catatan = row[9] || row[5] || catatan;
    extra = {
      id: row[0] || '',
      guruEmail: row[7] || '',
      guruNama: row[8] || '',
      jantina: row[4] || '',
      dikemaskini: row[10] || '',
      oleh: row[11] || ''
    };
  }

  return {
    tarikh: String(tarikh || '').trim(),
    kelas: String(kelas || '').trim(),
    nama: String(nama || '').trim(),
    status: String(status || '').trim() === 'MC' ? 'Sakit' : String(status || '').trim(),
    telefon: String(telefon || '').trim(),
    catatan: String(catatan || '').trim(),
    raw: row,
    extra
  };
}

/* legacy removed: legacyOlderLoadKehadiranMurid
  const tbody = document.getElementById('muridKehadiranBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="color:var(--muted);text-align:center;padding:20px">Memuat data...</td></tr>';
  try {
    const data = await callWorker({ action: 'readSheet', sheetKey: 'KEHADIRAN_MURID' });
    if (!data.success) throw new Error(data.error || 'Gagal');
    const filterDate = document.getElementById('muridFilterDate');
    const filterKelas = document.getElementById('muridFilterKelas');
    let rows = (data.rows || []).map(parseKehadiranMuridRow).filter(r => r.nama && r.nama.toLowerCase() !== 'nama');
    if (filterDate && filterDate.value) rows = rows.filter(r => r.tarikh === filterDate.value);
    if (filterKelas && filterKelas.value) rows = rows.filter(r => r.kelas === filterKelas.value);
    const hadir = rows.filter(r => ['Hadir', 'Lewat'].includes(r.status)).length;
    const tidak = rows.filter(r => ['Tidak Hadir', 'Ponteng'].includes(r.status)).length;
    const cuti = rows.filter(r => ['Cuti','MC','Sakit'].includes(r.status)).length;
    const pct = rows.length ? Math.round((hadir / rows.length) * 100) : 0;
    const setEl = function(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('murid-stat-hadir', hadir);
    setEl('murid-stat-tidak', tidak);
    setEl('murid-stat-cuti', cuti);
    setEl('murid-stat-pct', rows.length ? pct + '%' : '—');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="color:var(--muted);text-align:center;padding:20px">Tiada rekod</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map((item, i) => {
      return '<tr><td><strong>' + (item.nama || '—') + '</strong></td><td><span class="badge badge-blue">' + (item.kelas || '—') + '</span></td><td>' + (item.tarikh || '—') + '</td><td>' + statusBadge(item.status) + '</td><td style="font-size:0.82rem">' + (item.telefon || '—') + '</td><td style="display:flex;gap:6px;flex-wrap:wrap">' + (item.status === 'Tidak Hadir' ? '<button class="btn btn-sm btn-success" onclick=\'notifSatuMurid(' + JSON.stringify(item.nama || '') + ',' + JSON.stringify(item.kelas || '') + ',' + JSON.stringify(item.tarikh || '') + ',' + JSON.stringify(item.telefon || '') + ')\'>📩</button>' : '') + '</td></tr>';
    }).join('');
    if (!opts.silent) showToast(rows.length + ' rekod kehadiran murid dikemas kini.', 'success');
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--red);text-align:center;padding:20px">' + escapeHtml(e.message) + '</td></tr>';
    showToast(opts.silent ? 'Paparan live kehadiran murid terganggu: ' + e.message : e.message, 'error');
  } finally {
    _kehadiranMuridLoading = false;
  }
}
*/

async function openTambahKehadiranMurid() {
  if (!APP.user) {
    showToast('Sila log masuk semula untuk sahkan akses kehadiran murid.', 'error');
    return;
  }
  const now = new Date();
  const tarikhEl = document.getElementById('kMuridTarikh');
  const kelasEl = document.getElementById('kMuridKelas');
  const bodyEl = document.getElementById('senaraKelasBody');
  const infoEl = document.getElementById('senaraKelasInfo');
  const searchEl = document.getElementById('muridAttendanceSearch');
  window._senaraKelasData = [];
  window._senaraKelasDataKelas = '';
  if (tarikhEl) tarikhEl.value = getTodayYMD(now);
  if (searchEl) searchEl.value = '';
  if (bodyEl) bodyEl.innerHTML = '<tr><td colspan="4" style="padding:24px;text-align:center;color:var(--muted)">Memeriksa akses dan memuatkan kelas...</td></tr>';
  if (infoEl) infoEl.textContent = 'Sila tunggu sebentar...';
  openModal('modalKehadiranMurid');
  refreshMuridAttendanceSummary();
  try {
    const access = await getKehadiranMuridAccess();
    const allowedClasses = Array.isArray(access && access.allowedClasses) ? access.allowedClasses : [];
    window._muridAttendanceAccess = Object.assign({ allowedClasses: allowedClasses, bolehSemuaKelas: false, mesej: '' }, access || {});
    enhanceMuridBulkActionsUI();
    if (kelasEl) renderKelasKehadiranOptions(kelasEl, window._muridAttendanceAccess);
    if (!allowedClasses.length) {
      if (bodyEl) bodyEl.innerHTML = '<tr><td colspan="4" style="padding:24px;text-align:center;color:var(--red)">Akses kehadiran murid belum ditetapkan untuk akaun ini.</td></tr>';
      if (infoEl) infoEl.textContent = window._muridAttendanceAccess.mesej || 'Akses kehadiran murid belum ditetapkan.';
      showToast(window._muridAttendanceAccess.mesej || 'Akses kehadiran murid belum ditetapkan untuk akaun ini.', 'error');
      return;
    }
    if (bodyEl) bodyEl.innerHTML = '<tr><td colspan="4" style="padding:24px;text-align:center;color:var(--muted)">Pilih kelas untuk paparkan senarai murid</td></tr>';
    if (infoEl) infoEl.textContent = window._muridAttendanceAccess.mesej || '';
    if (!window._muridAttendanceAccess.bolehSemuaKelas && allowedClasses.length === 1) await loadSenaraKelas();
  } catch (e) {
    window._muridAttendanceAccess = { allowedClasses: [], bolehSemuaKelas: false, mesej: e && e.message ? e.message : 'Gagal membuka modul kehadiran murid.' };
    if (bodyEl) bodyEl.innerHTML = '<tr><td colspan="4" style="padding:24px;text-align:center;color:var(--red)">' + escapeLaporanHtml(window._muridAttendanceAccess.mesej) + '</td></tr>';
    if (infoEl) infoEl.textContent = window._muridAttendanceAccess.mesej;
    showToast(window._muridAttendanceAccess.mesej, 'error');
  }
}

function enhanceMuridBulkActionsUI() {
  const modal = document.getElementById('modalKehadiranMurid');
  if (!modal) return;
  const label = Array.from(modal.querySelectorAll('span')).find(function(el) {
    return String(el.textContent || '').includes('Tetapkan semua:') || String(el.textContent || '').includes('Tindakan pukal:');
  });
  if (label) label.textContent = 'Tindakan pukal (default: Hadir):';

  const hadirBtn = modal.querySelector('button[onclick="setSemuaStatus(\'Hadir\')"]');
  const tidakBtn = modal.querySelector('button[onclick="setSemuaStatus(\'Tidak Hadir\')"]');
  const mcBtn = modal.querySelector('button[onclick="setSemuaStatus(\'MC\')"]') || modal.querySelector('button[onclick="setSemuaStatus(\'Sakit\')"]');
  if (hadirBtn) hadirBtn.textContent = 'Semua Hadir';
  if (tidakBtn) tidakBtn.textContent = 'Tidak Hadir';
  if (mcBtn) mcBtn.textContent = 'Sakit';

  if (!modal.querySelector('button[data-ponteng="true"]') && mcBtn && mcBtn.parentElement) {
    const pontengBtn = document.createElement('button');
    pontengBtn.className = 'btn btn-sm btn-danger';
    pontengBtn.textContent = 'Ponteng';
    pontengBtn.setAttribute('data-ponteng', 'true');
    pontengBtn.onclick = function() { setSemuaStatus('Ponteng'); };
    mcBtn.parentElement.appendChild(pontengBtn);
  }

  const searchEl = document.getElementById('muridAttendanceSearch');
  if (searchEl && !searchEl.dataset.bound) {
    searchEl.addEventListener('input', filterSenaraiKelasRows);
    searchEl.dataset.bound = 'true';
  }
}

function normalizeMuridSearchValue(value) {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function refreshMuridAttendanceSummary() {
  const rows = Array.from(document.querySelectorAll('#senaraKelasBody tr[data-murid-row="true"]'));
  const visibleRows = rows.filter(function(row) { return row.style.display !== 'none'; });
  const counts = { hadir: 0, tidak: 0, lain: 0 };

  visibleRows.forEach(function(row) {
    const statusEl = row.querySelector('select[data-status-select="true"]');
    const normalized = normalizeBulkMuridStatus(statusEl ? statusEl.value : 'Hadir');
    if (normalized === 'Hadir') counts.hadir += 1;
    else if (normalized === 'Tidak Hadir') counts.tidak += 1;
    else counts.lain += 1;
  });

  const totalEl = document.getElementById('muridAttendanceCountTotal');
  const visibleEl = document.getElementById('muridAttendanceCountVisible');
  const hadirEl = document.getElementById('muridAttendanceCountHadir');
  const tidakEl = document.getElementById('muridAttendanceCountTidak');
  const lainEl = document.getElementById('muridAttendanceCountLain');
  if (totalEl) totalEl.textContent = String(rows.length);
  if (visibleEl) visibleEl.textContent = String(visibleRows.length);
  if (hadirEl) hadirEl.textContent = String(counts.hadir);
  if (tidakEl) tidakEl.textContent = String(counts.tidak);
  if (lainEl) lainEl.textContent = String(counts.lain);
}

function filterSenaraiKelasRows() {
  const searchEl = document.getElementById('muridAttendanceSearch');
  const term = normalizeMuridSearchValue(searchEl ? searchEl.value : '');
  const rows = Array.from(document.querySelectorAll('#senaraKelasBody tr[data-murid-row="true"]'));
  rows.forEach(function(row) {
    const haystack = normalizeMuridSearchValue(row.getAttribute('data-murid-search') || '');
    row.style.display = !term || haystack.includes(term) ? '' : 'none';
  });
  refreshMuridAttendanceSummary();
}

async function loadSenaraKelas() {
  const kelasEl = document.getElementById('kMuridKelas');
  const kelas = kelasEl ? kelasEl.value : '';
  const tbody = document.getElementById('senaraKelasBody');
  const infoEl = document.getElementById('senaraKelasInfo');
  const access = window._muridAttendanceAccess || await getKehadiranMuridAccess();
  if (!kelas) {
    tbody.innerHTML = '<tr><td colspan="4" style="padding:24px;text-align:center;color:var(--muted)">Pilih kelas</td></tr>';
    window._senaraKelasData = [];
    window._senaraKelasDataKelas = '';
    if (infoEl) infoEl.textContent = access.mesej || '';
    refreshMuridAttendanceSummary();
    return;
  }
  if (!isKelasAllowedForKehadiran(access, kelas)) {
    if (kelasEl && !access.bolehSemuaKelas && access.allowedClasses.length === 1) kelasEl.value = access.allowedClasses[0];
    tbody.innerHTML = '<tr><td colspan="4" style="padding:24px;text-align:center;color:var(--red)">Anda tidak dibenarkan mengisi kehadiran untuk kelas ini.</td></tr>';
    window._senaraKelasData = [];
    window._senaraKelasDataKelas = '';
    if (infoEl) infoEl.textContent = access.mesej || 'Akses kelas tidak dibenarkan.';
    refreshMuridAttendanceSummary();
    showToast('Akses hanya dibenarkan untuk kelas yang ditetapkan.', 'error');
    return;
  }
  tbody.innerHTML = '<tr><td colspan="4" style="padding:20px;text-align:center;color:var(--muted)">⏳ Memuatkan...</td></tr>';
  refreshMuridAttendanceSummary();
  const murid = await getMuridByKelas(kelas);
  if (!murid.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="padding:20px;text-align:center;color:var(--red)">Tiada murid dalam kelas ' + kelas + '</td></tr>';
    window._senaraKelasData = [];
    window._senaraKelasDataKelas = '';
    if (infoEl) infoEl.textContent = access.mesej || '';
    refreshMuridAttendanceSummary();
    return;
  }
  tbody.innerHTML = murid.map((m, i) =>
    '<tr style="border-bottom:1px solid var(--border)"><td data-label="#" style="padding:10px 14px;color:var(--muted);font-size:0.8rem">' + (i+1) + '</td><td data-label="Nama Murid" style="padding:10px 14px"><strong style="font-size:0.88rem">' + m.nama + '</strong><div style="font-size:0.75rem;color:var(--muted)">' + (m.wali ? 'Wali: ' + m.wali : '') + '</div></td><td data-label="Status" style="padding:8px 10px"><select id="status_' + i + '" style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:0.82rem;background:#fff;width:100%"><option value="Hadir">✅ Hadir</option><option value="Tidak Hadir">❌ Tidak Hadir</option><option value="MC">🏥 MC</option><option value="Cuti">📋 Cuti</option><option value="Ponteng">🚫 Ponteng</option><option value="Lewat">⚠️ Lewat</option></select></td><td data-label="Catatan" style="padding:8px 10px"><input id="catatan_' + i + '" type="text" placeholder="catatan..." style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:0.82rem;width:100%;background:#fff"></td></tr>'
  ).join('');
  if (infoEl) infoEl.textContent = murid.length + ' murid dalam ' + kelas + ' • ' + (access.mesej || '');
  window._senaraKelasData = murid;
  window._senaraKelasDataKelas = kelas;
  murid.forEach(function(m, i) {
    const row = tbody.children[i];
    const statusEl = document.getElementById('status_' + i);
    const nameCell = row && row.children ? row.children[1] : null;
    if (row) {
      row.setAttribute('data-murid-row', 'true');
      row.setAttribute('data-murid-search', (m.nama || '') + ' ' + (m.wali || '') + ' ' + String(i + 1));
    }
    if (nameCell) {
      nameCell.className = 'murid-attendance-student';
      nameCell.innerHTML = '<strong>' + escapeLaporanHtml(m.nama || '—') + '</strong><div>' + escapeLaporanHtml(m.wali ? 'Wali: ' + m.wali : 'Tiada nama wali direkodkan') + '</div>';
    }
    if (statusEl) {
      statusEl.setAttribute('data-status-select', 'true');
      statusEl.setAttribute('onchange', 'refreshMuridAttendanceSummary()');
    }
  });
  filterSenaraiKelasRows();
}

function setSemuaStatus(status) {
  const murid = window._senaraKelasData || [];
  murid.forEach(function(_, i) {
    const sel = document.getElementById('status_' + i);
    if (sel) sel.value = status;
  });
  refreshMuridAttendanceSummary();
}

function normalizeBulkMuridStatus(status) {
  const raw = String(status || '').trim();
  if (raw === 'MC') return 'Sakit';
  return ['Tidak Hadir', 'Sakit', 'Cuti', 'Ponteng', 'Lewat'].includes(raw) ? raw : 'Hadir';
}

async function submitKehadiranKelas() {
  const kelas = document.getElementById('kMuridKelas').value;
  const tarikh = document.getElementById('kMuridTarikh').value;
  const murid = window._senaraKelasData || [];
  const access = window._muridAttendanceAccess || await getKehadiranMuridAccess();
  if (!kelas) { showToast('Sila pilih kelas.', 'error'); return; }
  if (!isKelasAllowedForKehadiran(access, kelas)) { showToast('Anda tidak dibenarkan mengisi kehadiran kelas ini.', 'error'); return; }
  if (!tarikh) { showToast('Sila pilih tarikh.', 'error'); return; }
  if ((window._senaraKelasDataKelas || '') !== kelas) { showToast('Sila muatkan semula senarai kelas sebelum simpan.', 'error'); return; }
  if (!murid.length) { showToast('Tiada senarai murid.', 'error'); return; }
  showToast('Menyemak rekod sedia ada...', 'info');
  const allTidakHadirList = [];
  let usedLegacyFallback = false;
  const allRowsToSave = murid.map(function(m, idx) {
    const statusEl = document.getElementById('status_' + idx);
    const catatanEl = document.getElementById('catatan_' + idx);
    const status = statusEl ? statusEl.value : 'Hadir';
    const catatan = catatanEl ? catatanEl.value : '';
    if (['Tidak Hadir', 'MC', 'Ponteng'].includes(status)) allTidakHadirList.push(m);
    return [m.nama, kelas, tarikh, status, m.telefon, catatan, APP.user ? APP.user.email : ''];
  });
  let rowsToSave = allRowsToSave;
  let tidakHadirList = allTidakHadirList;
  let skippedCount = 0;
  try {
    const duplicates = await findExistingKehadiranMuridDuplicates(allRowsToSave);
    if (duplicates.length === allRowsToSave.length) {
      showToast('Kehadiran kelas ' + kelas + ' untuk tarikh ini sudah lengkap disimpan.', 'info');
      return;
    }
    if (duplicates.length > 0) {
      const dupNames = new Set(duplicates.map(function(r) { return String(r[0] || '').trim().toLowerCase(); }));
      rowsToSave = allRowsToSave.filter(function(r) { return !dupNames.has(String(r[0] || '').trim().toLowerCase()); });
      tidakHadirList = allTidakHadirList.filter(function(m) { return !dupNames.has(String(m.nama || '').trim().toLowerCase()); });
      skippedCount = duplicates.length;
      showToast(skippedCount + ' rekod lama dikekalkan. Menyimpan ' + rowsToSave.length + ' rekod baru...', 'info');
    } else {
      showToast('Menyimpan ' + rowsToSave.length + ' rekod...', 'info');
    }
  } catch (dupErr) {
    showToast(dupErr.message, 'error');
    return;
  }
  if (!rowsToSave.length) {
    showToast('Tiada rekod baru untuk disimpan.', 'info');
    return;
  }
  try {
    const data = await callWorker({ action: 'appendRows', sheetKey: 'KEHADIRAN_MURID', rows: rowsToSave });
    if (!data.success) throw new Error(data.error || 'Gagal menyimpan rekod kehadiran murid.');
  } catch(e) {
    if (e && ['AUTH_REQUIRED','AUTH_FORBIDDEN','CLASS_FORBIDDEN','NO_ASSIGNED_CLASS','TEACHER_NOT_FOUND'].includes(e.code)) {
      showToast(e.message, 'error');
      return;
    }
    let fallbackOk = 0;
    let fallbackSkipped = 0;
    usedLegacyFallback = true;
    for (let idx = 0; idx < rowsToSave.length; idx++) {
      try {
        const fallbackData = await callWorker({ action: 'appendRow', sheetKey: 'KEHADIRAN_MURID', row: rowsToSave[idx] });
        if (!fallbackData.success) throw new Error(fallbackData.error || 'Gagal menyimpan rekod kehadiran murid.');
        fallbackOk++;
      } catch (fallbackErr) {
        if (fallbackErr && fallbackErr.code === 'DUPLICATE_KEHADIRAN_MURID') {
          fallbackSkipped++;
          continue;
        }
        if (fallbackErr && ['AUTH_REQUIRED','AUTH_FORBIDDEN','CLASS_FORBIDDEN','NO_ASSIGNED_CLASS','TEACHER_NOT_FOUND'].includes(fallbackErr.code)) {
          showToast(fallbackErr.message, 'error');
          return;
        }
        showToast(fallbackErr && fallbackErr.message ? fallbackErr.message : 'Gagal menyimpan rekod kehadiran murid.', 'error');
        return;
      }
    }
    if (!fallbackOk && fallbackSkipped > 0) {
      showToast('Semua rekod sudah disimpan sebelum ini.', 'info');
      closeModal('modalKehadiranMurid');
      return;
    }
    skippedCount += fallbackSkipped;
  }
  closeModal('modalKehadiranMurid');
  showToast((usedLegacyFallback ? '✅ Mod serasi lama. ' : '✅ ') + rowsToSave.length + ' rekod baru disimpan' + (skippedCount > 0 ? ' (' + skippedCount + ' rekod lama dikekalkan).' : '.'), 'success');
  if (tidakHadirList.length > 0 && isNotifAutoEnabled() && isMuridAttendanceNotifEnabled()) {
      var guardMurid = 'ssh_notif_wali_' + tarikh + '_' + kelas.replace(/\s/g,'');
      if (!localStorage.getItem(guardMurid)) {
      var namaList = tidakHadirList.map(function(m){ return '- ' + m.nama; }).join('\n');
      var mesejGroup = renderAttendanceTemplate(getAttendanceTemplate('ssh_attendance_tpl_murid_class_group', DEFAULT_ATTENDANCE_TEMPLATES.muridClassGroup), {
        TARIKH: tarikh,
        KELAS: kelas,
        BILANGAN: tidakHadirList.length,
        SENARAI: namaList,
        SEKOLAH: getSchoolTemplateName()
      });
      var groupTarget = getGroupKelas(kelas);
      var fonnteOK = false, tgOK = false;
      if (shouldNotifyMuridClassGroup() && groupTarget) {
        try { await callFonnte(groupTarget, mesejGroup); logNotif('Auto-Tidak Hadir', groupTarget, mesejGroup, 'Berjaya'); fonnteOK = true; } catch(e) {}
      }
      var mesejTG = renderAttendanceTemplate(getAttendanceTemplate('ssh_attendance_tpl_murid_summary', DEFAULT_ATTENDANCE_TEMPLATES.muridSummary), {
        TARIKH: tarikh,
        KELAS: kelas,
        BILANGAN: tidakHadirList.length,
        SENARAI: namaList,
        PEREKOD: APP.user ? APP.user.name : 'Sistem',
        SEKOLAH: getSchoolTemplateName()
      });
      if (shouldNotifyMuridTelegram()) {
        try { await hantarTelegram(mesejTG); tgOK = true; } catch(e) {}
      }
      localStorage.setItem(guardMurid, '1');
      var st = fonnteOK && tgOK ? 'WhatsApp + Telegram berjaya!' : fonnteOK ? 'WhatsApp berjaya' : tgOK ? 'Telegram berjaya' : 'Gagal hantar notifikasi';
      showToast(kelas + ': ' + st, fonnteOK||tgOK ? 'success' : 'error');
    } else {
      showToast('Notifikasi ' + kelas + ' sudah dihantar hari ini.', 'info');
    }
  }
}

function openTambahKehadiran(jenis) {
  if (jenis === 'guru') openTambahKehadiranGuru();
  else openTambahKehadiranMurid();
}
function submitKehadiran() { submitKehadiranKelas(); }

/* legacy removed: legacyLoadSenaraKelas
  const kelas = document.getElementById('kMuridKelas').value;
  const tbody = document.getElementById('senaraKelasBody');
  if (!kelas) {
    tbody.innerHTML = '<tr><td colspan="4" style="padding:24px;text-align:center;color:var(--muted)">Pilih kelas</td></tr>';
    return;
  }
  tbody.innerHTML = '<tr><td colspan="4" style="padding:20px;text-align:center;color:var(--muted)">Memuatkan...</td></tr>';
  const murid = await getMuridByKelas(kelas);
  if (!murid.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="padding:20px;text-align:center;color:var(--red)">Tiada murid dalam kelas ' + kelas + '</td></tr>';
    return;
  }
  tbody.innerHTML = murid.map((m, i) =>
    '<tr style="border-bottom:1px solid var(--border)">' +
      '<td style="padding:10px 14px;color:var(--muted);font-size:0.8rem">' + (i + 1) + '</td>' +
      '<td style="padding:10px 14px"><strong style="font-size:0.88rem">' + m.nama + '</strong><div style="font-size:0.75rem;color:var(--muted)">' + (m.wali ? 'Wali: ' + m.wali : '') + '</div></td>' +
      '<td style="padding:8px 10px"><select id="status_' + i + '" style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:0.82rem;background:#fff;width:100%">' +
        '<option value="Hadir" selected>Hadir</option>' +
        '<option value="Tidak Hadir">Tidak Hadir</option>' +
        '<option value="Sakit">Sakit</option>' +
        '<option value="Ponteng">Ponteng</option>' +
        '<option value="Cuti">Cuti</option>' +
      '</select></td>' +
      '<td style="padding:8px 10px"><input id="catatan_' + i + '" type="text" placeholder="catatan..." style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:0.82rem;width:100%;background:#fff"></td>' +
    '</tr>'
  ).join('');
  const infoEl = document.getElementById('senaraKelasInfo');
  if (infoEl) infoEl.textContent = murid.length + ' murid dalam ' + kelas + ' • Semua murid ditag Hadir secara automatik';
  window._senaraKelasData = murid;
}

*/
/* legacy removed: legacySubmitKehadiranKelas
  const kelas = document.getElementById('kMuridKelas').value;
  const tarikh = document.getElementById('kMuridTarikh').value;
  const murid = window._senaraKelasData || [];
  if (!kelas) { showToast('Sila pilih kelas.', 'error'); return; }
  if (!tarikh) { showToast('Sila pilih tarikh.', 'error'); return; }
  if (!murid.length) { showToast('Tiada senarai murid.', 'error'); return; }
  showToast('Menyimpan ' + murid.length + ' rekod...', 'info');
  let ok = 0, gagal = 0;
  const tidakHadirList = [];
  for (let idx = 0; idx < murid.length; idx++) {
    const m = murid[idx];
    const statusEl = document.getElementById('status_' + idx);
    const catatanEl = document.getElementById('catatan_' + idx);
    const status = normalizeBulkMuridStatus(statusEl ? statusEl.value : '');
    const catatan = catatanEl ? catatanEl.value : '';
    try {
      const data = await callWorker({ action: 'appendRow', sheetKey: 'KEHADIRAN_MURID', row: [m.nama, kelas, tarikh, status, m.telefon, catatan, APP.user ? APP.user.email : ''] });
      if (data.success) {
        ok++;
        if (status === 'Tidak Hadir' || status === 'Sakit' || status === 'Ponteng') tidakHadirList.push(m);
      } else {
        gagal++;
      }
    } catch (e) {
      gagal++;
    }
    await sleep(150);
  }
  closeModal('modalKehadiranMurid');
  showToast(ok + ' rekod disimpan' + (gagal ? ', ' + gagal + ' gagal' : '') + '.', ok > 0 ? 'success' : 'error');
  if (tidakHadirList.length > 0) {
    var guardMurid = 'ssh_notif_wali_' + tarikh + '_' + kelas.replace(/\s/g,'');
    if (!localStorage.getItem(guardMurid)) {
      var namaList = tidakHadirList.map(function(m){ return '- ' + m.nama; }).join('\n');
      var mesejGroup = 'Makluman Kehadiran - ' + kelas + '\n\nMurid tidak hadir pada ' + tarikh + ':\n\n' + namaList + '\n\n_SK Kiandongo_';
      var groupTarget = getGroupKelas(kelas);
      var fonnteOK = false, tgOK = false;
      if (groupTarget) {
        try { await callFonnte(groupTarget, mesejGroup); logNotif('Auto-Tidak Hadir', groupTarget, mesejGroup, 'Berjaya'); fonnteOK = true; } catch(e) {}
      }
      var mesejTG = 'Rekod Kehadiran ' + kelas + '\nTarikh: ' + tarikh + '\nTidak Hadir: ' + tidakHadirList.length + ' murid\n\n' + namaList + '\n\nDirekod oleh: ' + (APP.user ? APP.user.name : 'Sistem') + '\n_SK Kiandongo_';
      try { await callTelegramTopic(mesejTG); logNotif('Auto-Tidak Hadir', 'Telegram Topic', mesejTG, 'Berjaya'); tgOK = true; } catch(e) {}
      localStorage.setItem(guardMurid, '1');
      if (fonnteOK || tgOK) showToast('Notifikasi auto ketidakhadiran dihantar.', 'success');
    }
  }
  setTimeout(() => loadKehadiranMurid(), 1000);
}
*/
function generateLaporanKelas() { loadLegacyLaporanKelasData(); }

function resetLaporanStats(stats) {
  if (stats) stats.style.display = 'none';
  setText('lap-jumlah', '—');
  setText('lap-purata', '—');
  setText('lap-risiko', '—');
}

function binaRingkasanLaporanKelas(rows) {
  const kelasMap = {};
  rows.forEach(function(r) {
    const k = r.kelas || 'Tidak Dikenali';
    if (!kelasMap[k]) kelasMap[k] = { hadir: 0, tidak: 0, total: 0, murid: new Set() };
    kelasMap[k].murid.add(r.nama);
    kelasMap[k].total++;
    if (r.status === 'Hadir' || r.status === 'Lewat') kelasMap[k].hadir++;
    else if (['Tidak Hadir', 'Ponteng'].includes(r.status)) kelasMap[k].tidak++;
    else kelasMap[k].tidak++; // Fallback for other statuses like Cuti/MC in this simple count
  });
  return Object.entries(kelasMap).sort(function(a, b) { return a[0].localeCompare(b[0]); });
}

function renderLaporanKelasRows(kelasArr) {
  let jumlahMurid = 0, totalHadir = 0, totalRekod = 0, risiko = 0;
  const html = kelasArr.map(function(entry) {
    const k = entry[0], v = entry[1];
    const pct = v.total ? Math.round((v.hadir / v.total) * 100) : 0;
    const nm = v.murid.size;
    jumlahMurid += nm;
    totalHadir += v.hadir;
    totalRekod += v.total;
    if (pct < 80) risiko++;
    const avgH = nm ? (v.hadir / nm).toFixed(1) : '0';
    const avgT = nm ? (v.tidak / nm).toFixed(1) : '0';
    const sts = pct >= 90 ? '<span class="badge badge-green">Baik</span>' : pct >= 80 ? '<span class="badge badge-amber">Sederhana</span>' : '<span class="badge badge-red">Perlu Perhatian</span>';
    return '<tr><td><strong>' + k + '</strong></td><td>' + nm + '</td><td>' + avgH + ' hari</td><td>' + avgT + ' hari</td><td><strong>' + pct + '%</strong></td><td>' + sts + '</td></tr>';
  }).join('');
  return {
    html: html,
    jumlahMurid: jumlahMurid,
    purata: totalRekod ? Math.round((totalHadir / totalRekod) * 100) : 0,
    risiko: risiko
  };
}

async function loadLegacyLaporanKelasData() {
  const bulan = document.getElementById('laporanBulan').value;
  const kelas = document.getElementById('laporanKelas').value;
  const tbody = document.getElementById('laporanBody');
  const stats = document.getElementById('laporanStats');
  if (!bulan) { showToast('Sila pilih bulan.', 'error'); return; }
  resetLaporanStats(stats);
  tbody.innerHTML = '<tr><td colspan="6" style="color:var(--muted);text-align:center;padding:20px">Memuat data...</td></tr>';
  try {
    const data = await callWorker({ action: 'readSheet', sheetKey: 'KEHADIRAN_MURID' });
    if (!data.success) throw new Error(data.error || 'Gagal');
    let rows = (data.rows || []).map(parseKehadiranMuridRow).filter(r => r.tarikh && r.tarikh.startsWith(bulan));
    if (kelas) rows = rows.filter(r => r.kelas === kelas);
    const kelasArr = binaRingkasanLaporanKelas(rows);
    if (!kelasArr.length) { tbody.innerHTML = '<tr><td colspan="6" style="color:var(--muted);text-align:center;padding:20px">Tiada data untuk bulan ini</td></tr>'; return; }
    const summary = renderLaporanKelasRows(kelasArr);
    tbody.innerHTML = summary.html;
    if (stats) stats.style.display = 'grid';
    setText('lap-jumlah', summary.jumlahMurid);
    setText('lap-purata', summary.purata + '%');
    setText('lap-risiko', summary.risiko);
    showToast('Laporan kelas dimuatkan.', 'success');
  } catch(e) {
    resetLaporanStats(stats);
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--red);text-align:center;padding:20px">' + escapeHtml(e.message) + '</td></tr>';
    showToast(e.message, 'error');
  }
}

function exportLaporanCSV() {
  cetakLaporanGuruBertugasMingguan();
}

function getLaporanBertugasSectionMeta() {
  return [
    { key: 'info', title: 'Maklumat', cardId: 'laporanSectionInfo', navId: 'laporanNavInfo', note: 'Semak nama guru bertugas, minggu semasa dan tarikh laporan dahulu supaya seksyen lain kekal selari.' },
    { key: 'attendance', title: 'Kehadiran', cardId: 'laporanSectionAttendance', navId: 'laporanNavKehadiran', note: 'Muatkan data automatik dan semak sama ada rumusan kehadiran mencerminkan keadaan sebenar minggu ini.' },
    { key: 'aktiviti', title: 'Aktiviti', cardId: 'laporanSectionAktiviti', navId: 'laporanNavAktiviti', note: 'Isi aktiviti yang paling memberi gambaran minggu bertugas anda. Tiga catatan utama biasanya sudah memadai.' },
    { key: 'discipline', title: 'Disiplin', cardId: 'laporanSectionDisiplin', navId: 'laporanNavDisiplin', note: 'Fokus pada pemerhatian utama, kes sebenar, dan tindakan susulan yang penting untuk dirujuk semula.' },
    { key: 'rmt', title: 'RMT', cardId: 'laporanSectionRmt', navId: 'laporanNavRmt', note: 'Nyatakan status pelaksanaan, jumlah penerima, menu atau aduan secara ringkas dan padat.' },
    { key: 'classroom', title: 'Kelas', cardId: 'laporanSectionKelas', navId: 'laporanNavKebersihan', note: 'Muatkan senarai kelas dahulu sebelum menilai kebersihan dan keceriaan supaya kerja key-in lebih tersusun.' },
    { key: 'summary', title: 'Rumusan', cardId: 'laporanSectionRumusan', navId: 'laporanNavRumusan', note: 'Gunakan rumusan untuk merangkum keseluruhan minggu, bukan mengulang semula semua butiran satu per satu.' }
  ];
}

function buildLaporanBertugasHeroHtml() {
  return '' +
    '<div class="card weekly-report-hero">' +
      '<div class="weekly-report-hero-inner">' +
        '<div>' +
          '<div class="weekly-report-kicker">Laporan Mingguan Sekolah</div>' +
          '<h2>Ruang key-in yang lebih teratur, jelas dan mesra pengguna untuk guru bertugas mingguan.</h2>' +
          '<p>Gunakan pintasan di sebelah untuk lompat ke seksyen penting, semak kemajuan semasa anda, dan fokus pada bahagian yang masih belum lengkap tanpa perlu meneka-neka.</p>' +
          '<div class="weekly-report-chip-row">' +
            '<span class="weekly-report-chip">📍 <span id="laporanBertugasHeroWeek">Minggu semasa</span></span>' +
            '<span class="weekly-report-chip">👨‍🏫 <span id="laporanBertugasHeroGuru">Guru bertugas</span></span>' +
            '<span class="weekly-report-chip">🗓️ <span id="laporanBertugasHeroTarikh">Tarikh laporan belum dipilih</span></span>' +
          '</div>' +
        '</div>' +
        '<div class="weekly-report-hero-side">' +
          '<div class="weekly-report-progress-card">' +
            '<small>Kemajuan Laporan</small>' +
            '<strong id="laporanBertugasProgressText">0 / 7 seksyen siap</strong>' +
            '<div class="weekly-report-progress-track"><div id="laporanBertugasProgressFill" class="weekly-report-progress-fill"></div></div>' +
            '<div id="laporanBertugasProgressCaption" class="weekly-report-progress-caption">Mulakan dengan maklumat laporan di bawah.</div>' +
          '</div>' +
          '<div class="weekly-report-nav">' +
            '<button type="button" id="laporanNavInfo" onclick="scrollLaporanBertugasSection(\'laporanSectionInfo\')">Maklumat</button>' +
            '<button type="button" id="laporanNavKehadiran" onclick="scrollLaporanBertugasSection(\'laporanSectionAttendance\')">Kehadiran</button>' +
            '<button type="button" id="laporanNavAktiviti" onclick="scrollLaporanBertugasSection(\'laporanSectionAktiviti\')">Aktiviti</button>' +
            '<button type="button" id="laporanNavDisiplin" onclick="scrollLaporanBertugasSection(\'laporanSectionDisiplin\')">Disiplin</button>' +
            '<button type="button" id="laporanNavRmt" onclick="scrollLaporanBertugasSection(\'laporanSectionRmt\')">RMT</button>' +
            '<button type="button" id="laporanNavKebersihan" onclick="scrollLaporanBertugasSection(\'laporanSectionKelas\')">Kelas</button>' +
            '<button type="button" id="laporanNavRumusan" onclick="scrollLaporanBertugasSection(\'laporanSectionRumusan\')">Rumusan</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="weekly-report-stat-grid">' +
      '<div class="weekly-report-stat"><small>Seksyen Siap</small><strong id="laporanBertugasStatSiap">0 / 7</strong><span>Bilangan komponen utama yang telah mempunyai isi mencukupi untuk laporan.</span></div>' +
      '<div class="weekly-report-stat"><small>Auto Tersedia</small><strong id="laporanBertugasStatAuto">0</strong><span>Bahagian yang dibantu terus oleh data sistem atau maklumat auto minggu semasa.</span></div>' +
      '<div class="weekly-report-stat"><small>Fokus Seterusnya</small><strong id="laporanBertugasStatFokus">Mulakan laporan</strong><span id="laporanBertugasStatFokusDesc">Lengkapkan seksyen pertama yang masih kosong.</span></div>' +
    '</div>';
}

function enhanceLaporanGuruBertugasModuleLayout() {
  const root = document.getElementById('mod-laporan-kelas');
  if (!root) return;
  root.classList.add('weekly-report-shell');
  const header = root.querySelector('.page-header');
  if (header && !root.querySelector('.weekly-report-hero')) {
    header.insertAdjacentHTML('afterend', buildLaporanBertugasHeroHtml());
  }
  const cards = Array.from(root.querySelectorAll(':scope > .card')).filter(function(card) {
    return !card.classList.contains('weekly-report-hero') && !card.closest('.weekly-report-two-col');
  });
  const sectionMeta = getLaporanBertugasSectionMeta();
  cards.slice(0, sectionMeta.length).forEach(function(card, idx) {
    const meta = sectionMeta[idx];
    if (!meta) return;
    card.id = meta.cardId;
    card.classList.add('weekly-report-section');
    const headerEl = card.querySelector('.section-header');
    if (headerEl) {
      headerEl.classList.add('weekly-report-section-head');
      if (!card.querySelector('.weekly-report-note[data-note-for="' + meta.key + '"]')) {
        headerEl.insertAdjacentHTML('afterend', '<div class="weekly-report-note" data-note-for="' + meta.key + '">' + escapeLaporanHtml(meta.note) + '</div>');
      }
    }
  });
  const twoColPairs = [
    { selector: '.weekly-report-two-col[data-pair="ops"]', ids: ['laporanSectionDisiplin', 'laporanSectionRmt'] },
    { selector: '.weekly-report-two-col[data-pair="kelas"]', ids: ['laporanSectionKelas', 'laporanSectionRumusan'] }
  ];
  if (!root.querySelector(twoColPairs[0].selector)) {
    const left = document.getElementById('laporanSectionDisiplin');
    const right = document.getElementById('laporanSectionRmt');
    if (left && right && left.parentElement === root && right.parentElement === root) {
      const wrap = document.createElement('div');
      wrap.className = 'weekly-report-two-col';
      wrap.dataset.pair = 'ops';
      root.insertBefore(wrap, left);
      wrap.appendChild(left);
      wrap.appendChild(right);
    }
  }
  const kelasCard = document.getElementById('laporanSectionKelas');
  const rumusanCard = document.getElementById('laporanSectionRumusan');
  if (kelasCard && rumusanCard && kelasCard.parentElement === root && rumusanCard.parentElement === root) {
    const footerActions = Array.from(root.children).find(function(el) {
      return el.tagName === 'DIV' && el.querySelector && el.querySelector('.btn-success') && !el.classList.contains('weekly-report-stat-grid');
    });
    if (footerActions && !footerActions.classList.contains('weekly-report-footer')) {
      footerActions.className = 'weekly-report-footer';
      footerActions.innerHTML = '<div class="weekly-report-footer-card"><div><strong style="display:block;font-size:1rem;margin-bottom:6px">Semak akhir sebelum simpan atau cetak</strong><p>Kemajuan di atas membantu anda melihat bahagian yang masih perlu disentuh. Pastikan kehadiran, aktiviti dan rumusan mingguan telah disemak sebelum laporan disimpan.</p></div><div class="report-actions">' + footerActions.innerHTML + '</div></div>';
    }
  }
}

function scrollLaporanBertugasSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function ensureLaporanGuruBertugasBindings() {
  const root = document.getElementById('mod-laporan-kelas');
  if (!root || _laporanBertugasUiBound) return;
  root.addEventListener('input', function() { refreshLaporanGuruBertugasUI(); });
  root.addEventListener('change', function() { refreshLaporanGuruBertugasUI(); });
  _laporanBertugasUiBound = true;
}

function refreshLaporanGuruBertugasUI() {
  const root = document.getElementById('mod-laporan-kelas');
  if (!root) return;
  const info = getLaporanGuruBertugasCurrentInfo();
  const payload = getLaporanGuruBertugasPayload();
  const status = {
    info: !!(payload.namaGuru && payload.mingguLabel && payload.tarikhLaporan),
    attendance: !!((payload.kehadiran || []).length && payload.rumusanKehadiran),
    aktiviti: (payload.aktiviti || []).length >= 3,
    discipline: !!(payload.disiplin.statusUmum || payload.disiplin.kesSalahLaku || payload.disiplin.pakaianSeragam || payload.disiplin.bukuDemerit),
    rmt: !!(payload.rmt.statusPelaksanaan || payload.rmt.jumlahPenerima || payload.rmt.menuMinggu || payload.rmt.aduanMasalah),
    classroom: !!((payload.kebersihan || []).length || (payload.keceriaan || []).length || payload.keceriaanNota),
    summary: !!payload.rumusanMingguan
  };
  const meta = getLaporanBertugasSectionMeta();
  const completed = meta.filter(function(item) { return status[item.key]; }).length;
  const progress = Math.round((completed / meta.length) * 100);
  const nextItem = meta.find(function(item) { return !status[item.key]; });
  setText('laporanBertugasHeroWeek', payload.mingguLabel || info.mingguLabel || 'Minggu semasa');
  setText('laporanBertugasHeroGuru', payload.namaGuru || info.guru || 'Guru bertugas');
  setText('laporanBertugasHeroTarikh', payload.tarikhLaporan ? formatTarikhDisplay(payload.tarikhLaporan) : 'Tarikh laporan belum dipilih');
  setText('laporanBertugasProgressText', completed + ' / ' + meta.length + ' seksyen siap');
  setText('laporanBertugasProgressCaption', nextItem ? ('Fokus seterusnya: ' + nextItem.title + '.') : 'Semua seksyen utama sudah terisi. Laporan sedia untuk disemak akhir.');
  const fill = document.getElementById('laporanBertugasProgressFill');
  if (fill) fill.style.width = progress + '%';
  setText('laporanBertugasStatSiap', completed + ' / ' + meta.length);
  const autoReady = [
    !!(payload.namaGuru || info.guru),
    !!(payload.pembantuGuru || info.pembantu),
    !!(payload.kehadiran || []).length,
    !!((payload.kebersihan || []).length || (payload.keceriaan || []).length)
  ].filter(Boolean).length;
  setText('laporanBertugasStatAuto', autoReady);
  setText('laporanBertugasStatFokus', nextItem ? nextItem.title : 'Sedia disimpan');
  setText('laporanBertugasStatFokusDesc', nextItem ? nextItem.note : 'Semak semula bahasa, angka dan rumusan sebelum simpan atau cetak.');
  meta.forEach(function(item) {
    var nav = document.getElementById(item.navId);
    if (nav) nav.classList.toggle('is-done', !!status[item.key]);
  });
}

function getLaporanGuruBertugasCurrentInfo() {
  const isnin = getIsninMingguIni();
  const jumaat = addDaysYMD(isnin, 4);
  const entry = getGuruBertugasMinggu(isnin) || {};
  const mingguKe = entry.minggu ? String(entry.minggu) : '';
  const isninDate = parseLocalDateYMD(isnin);
  const jumaatDate = parseLocalDateYMD(jumaat);
  return {
    isnin: isnin,
    jumaat: jumaat,
    mingguKe: mingguKe,
    mingguLabel: (isninDate ? isninDate.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }) : isnin) +
      ' – ' +
      (jumaatDate ? jumaatDate.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }) : jumaat) +
      (mingguKe ? ' (Minggu Ke-' + mingguKe + ')' : ''),
    guru: entry.guru || (APP.user && APP.user.name) || '',
    jawatan: mingguKe ? ('Guru Bertugas Minggu Ke-' + mingguKe) : 'Guru Bertugas Mingguan',
    pembantu: entry.pembantu || ''
  };
}

function getLaporanGuruBertugasWeekDays() {
  const info = getLaporanGuruBertugasCurrentInfo();
  return ['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat'].map(function(hari, idx) {
    const ymd = addDaysYMD(info.isnin, idx);
    const date = parseLocalDateYMD(ymd);
    return {
      hari: hari,
      ymd: ymd,
      display: date ? date.toLocaleDateString('ms-MY', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ymd
    };
  });
}

function escapeLaporanHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getLaporanBertugasTrimmed(id) {
  return getTrimmedValue(id);
}

function normaliseLaporanBertugasClassName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toUpperCase();
}

function getLaporanBertugasYearFromClass(kelas) {
  const match = String(kelas || '').match(/\d+/);
  return match ? match[0] : '';
}

function getLaporanBertugasClassDisplayName(kelas) {
  const raw = String(kelas || '').trim().replace(/\s+/g, ' ');
  const year = getLaporanBertugasYearFromClass(raw);
  if (!year) return raw;
  const remainder = raw
    .replace(/^\s*(?:Tahun\s*)?\d+\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  const className = remainder
    ? remainder.split(' ').map(function(part) {
        if (!part) return '';
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }).join(' ')
    : '';
  return 'Tahun ' + year + (className ? ' ' + className : '');
}

function getLaporanBertugasClassKey(value) {
  const raw = String(value || '').trim().replace(/\s+/g, ' ');
  const year = getLaporanBertugasYearFromClass(raw);
  if (!year) return normaliseLaporanBertugasClassName(raw);
  const remainder = raw
    .replace(/^\s*(?:Tahun\s*)?\d+\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return normaliseLaporanBertugasClassName(year + ' ' + remainder);
}

function compareLaporanBertugasClasses(a, b) {
  const ay = Number(getLaporanBertugasYearFromClass(a.kelas || a) || 99);
  const by = Number(getLaporanBertugasYearFromClass(b.kelas || b) || 99);
  if (ay !== by) return ay - by;
  return String(a.kelas || a).localeCompare(String(b.kelas || b), 'ms');
}

function getLaporanBertugasAttendanceRows() {
  return Array.from(document.querySelectorAll('#laporanBertugasAttendanceBody tr')).map(function(tr) {
    const cells = Array.from(tr.querySelectorAll('td'));
    if (cells.length < 5) return null;
    return {
      hari: String(cells[0].textContent || '').trim(),
      tarikh: String(cells[1].textContent || '').trim(),
      hadir: String(cells[2].textContent || '').trim(),
      enrolmen: String(cells[3].textContent || '').trim(),
      peratus: String(cells[4].textContent || '').trim()
    };
  }).filter(Boolean);
}

function getLaporanBertugasAktivitiRows() {
  return Array.from(document.querySelectorAll('#laporanBertugasAktivitiBody tr')).map(function(tr) {
    const cells = Array.from(tr.querySelectorAll('td'));
    if (cells.length < 4) return null;
    const data = {
      bil: String(cells[0].textContent || '').trim(),
      kategori: String((cells[1].querySelector('input') || {}).value || '').trim(),
      aktiviti: String((cells[2].querySelector('input') || {}).value || '').trim(),
      tarikhHari: String((cells[3].querySelector('input') || {}).value || '').trim()
    };
    return (data.kategori || data.aktiviti || data.tarikhHari) ? data : null;
  }).filter(Boolean);
}

function getLaporanBertugasKebersihanRows() {
  return Array.from(document.querySelectorAll('#laporanBertugasKebersihanBody tr')).map(function(tr) {
    const cells = Array.from(tr.querySelectorAll('td'));
    if (cells.length < 5) return null;
    const data = {
      bil: String(cells[0].textContent || '').trim(),
      kelas: String((cells[1].querySelector('input') || {}).value || '').trim(),
      tahun: String((cells[2].querySelector('input') || {}).value || '').trim(),
      tahap: String((cells[3].querySelector('select') || {}).value || '').trim(),
      catatan: String((cells[4].querySelector('input') || {}).value || '').trim()
    };
    return (data.kelas || data.tahun || data.tahap || data.catatan) ? data : null;
  }).filter(Boolean);
}

function getLaporanBertugasKeceriaanRows() {
  return Array.from(document.querySelectorAll('#laporanBertugasKeceriaanBody tr')).map(function(tr) {
    const cells = Array.from(tr.querySelectorAll('td'));
    if (cells.length < 6) return null;
    const data = {
      tempat: String((cells[0].querySelector('input') || {}).value || '').trim(),
      tahun: String((cells[1].querySelector('input') || {}).value || '').trim(),
      kelas: String((cells[2].querySelector('input') || {}).value || '').trim(),
      guruKelas: String((cells[3].querySelector('input') || {}).value || '').trim(),
      markah: String((cells[4].querySelector('input') || {}).value || '').trim(),
      catatan: String((cells[5].querySelector('input') || {}).value || '').trim()
    };
    return (data.tempat || data.kelas || data.guruKelas || data.markah || data.catatan) ? data : null;
  }).filter(Boolean);
}

function setLaporanBertugasAiStatus(message, isError) {
  const box = document.getElementById('laporanBertugasAiStatus');
  if (!box) return;
  if (!message) {
    box.style.display = 'none';
    box.textContent = '';
    return;
  }
  box.style.display = 'block';
  box.style.background = isError ? 'rgba(239,68,68,0.10)' : 'rgba(26,79,160,0.08)';
  box.style.color = isError ? 'var(--red)' : 'var(--blue)';
  box.textContent = message;
}

function populateLaporanGuruBertugasClassTables(classes, guruList, savedKebersihan, savedKeceriaan) {
  const kebersihanBody = document.getElementById('laporanBertugasKebersihanBody');
  const keceriaanBody = document.getElementById('laporanBertugasKeceriaanBody');
  const guruMap = {};
  (guruList || []).forEach(function(guru) {
    const key = getLaporanBertugasClassKey(guru.kelas);
    if (key) guruMap[key] = guru.nama || '';
  });
  if (kebersihanBody) {
    kebersihanBody.innerHTML = classes.map(function(item, idx) {
      const saved = (savedKebersihan || []).find(function(entry) {
        return getLaporanBertugasClassKey(entry.kelas) === getLaporanBertugasClassKey(item.kelas || item.asalKelas);
      }) || {};
      const tahap = saved.tahap || 'Baik';
      return '<tr>' +
        '<td>' + (idx + 1) + '</td>' +
        '<td><input type="text" value="' + escapeLaporanHtml(saved.kelas || item.kelas) + '" style="width:100%"></td>' +
        '<td><input type="text" value="' + escapeLaporanHtml(saved.tahun || item.tahun) + '" style="width:100%"></td>' +
        '<td><select style="width:100%">' +
          ['Sangat Baik', 'Baik', 'Memuaskan', 'Kurang Memuaskan'].map(function(option) {
            return '<option value="' + option + '"' + (option === tahap ? ' selected' : '') + '>' + option + '</option>';
          }).join('') +
        '</select></td>' +
        '<td><input type="text" value="' + escapeLaporanHtml(saved.catatan || '') + '" placeholder="Contoh: Sudut bacaan perlu dikemas semula" style="width:100%"></td>' +
      '</tr>';
    }).join('');
  }
  if (keceriaanBody) {
    keceriaanBody.innerHTML = classes.map(function(item, idx) {
      const saved = (savedKeceriaan || []).find(function(entry) {
        return getLaporanBertugasClassKey(entry.kelas) === getLaporanBertugasClassKey(item.kelas || item.asalKelas);
      }) || {};
      const guruKelas = saved.guruKelas || guruMap[getLaporanBertugasClassKey(item.kelas || item.asalKelas)] || '';
      return '<tr>' +
        '<td><input type="text" value="' + escapeLaporanHtml(saved.tempat || String(idx + 1)) + '" style="width:100%"></td>' +
        '<td><input type="text" value="' + escapeLaporanHtml(saved.tahun || item.tahun) + '" style="width:100%"></td>' +
        '<td><input type="text" value="' + escapeLaporanHtml(saved.kelas || item.kelas) + '" style="width:100%"></td>' +
        '<td><input type="text" value="' + escapeLaporanHtml(guruKelas) + '" placeholder="Nama guru kelas" style="width:100%"></td>' +
        '<td><input type="text" value="' + escapeLaporanHtml(saved.markah || '') + '" placeholder="Contoh: 94.5%" style="width:100%"></td>' +
        '<td><input type="text" value="' + escapeLaporanHtml(saved.catatan || '') + '" placeholder="Contoh: Terbaik keseluruhan" style="width:100%"></td>' +
      '</tr>';
    }).join('');
  }
  refreshLaporanGuruBertugasUI();
}

function buildLaporanGuruBertugasAttendanceSummary(days) {
  const available = (days || []).filter(function(day) { return Number(day.enrolmen || 0) > 0; });
  if (!available.length) return 'Tiada data kehadiran murid direkodkan bagi minggu ini setakat ini.';
  const totalHadir = available.reduce(function(sum, item) { return sum + Number(item.hadir || 0); }, 0);
  const totalEnrolmen = available.reduce(function(sum, item) { return sum + Number(item.enrolmen || 0); }, 0);
  const purata = totalEnrolmen ? ((totalHadir / totalEnrolmen) * 100).toFixed(1) : '0.0';
  const rendah = available.filter(function(item) { return Number(item.peratus || 0) < 90; });
  let rumusan = 'Kehadiran keseluruhan minggu ini adalah ' + (Number(purata) >= 95 ? 'sangat baik' : Number(purata) >= 90 ? 'memuaskan' : 'perlu perhatian') + ' (' + purata + '%).';
  if (rendah.length) {
    rumusan += ' Hari yang memerlukan perhatian ialah ' + rendah.map(function(item) {
      return item.hari + ' (' + Number(item.peratus || 0).toFixed(1) + '%)';
    }).join(', ') + '.';
  } else {
    rumusan += ' Tiada penurunan kehadiran yang ketara direkodkan sepanjang minggu.';
  }
  return rumusan;
}

async function loadLaporanGuruBertugasAttendance() {
  const tbody = document.getElementById('laporanBertugasAttendanceBody');
  const summaryEl = document.getElementById('laporanBertugasAttendanceSummary');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="color:var(--muted);text-align:center;padding:20px">Memuat data kehadiran...</td></tr>';
  try {
    const days = getLaporanGuruBertugasWeekDays();
    const muridRes = await callWorker({ action: 'readSheet', sheetKey: 'MURID' });
    if (!muridRes.success) throw new Error(muridRes.error || 'Gagal mendapatkan data murid');
    const kehadiranRes = await callWorker({ action: 'readSheet', sheetKey: 'KEHADIRAN_MURID' });
    if (!kehadiranRes.success) throw new Error(kehadiranRes.error || 'Gagal mendapatkan data kehadiran murid');
    const muridRows = (muridRes.rows || []).filter(function(r) {
      return r[0] && String(r[0]).toLowerCase() !== 'nama' && Number(getLaporanBertugasYearFromClass(r[1] || '')) >= 1 && Number(getLaporanBertugasYearFromClass(r[1] || '')) <= 6;
    });
    const enrolmen = new Set(muridRows.map(function(r) {
      return getLaporanBertugasClassKey(r[1]) + '|' + String(r[0]).trim().toUpperCase();
    }));
    const latestAttendanceMap = {};
    (kehadiranRes.rows || []).map(parseKehadiranMuridRow).forEach(function(row) {
      const tahun = Number(getLaporanBertugasYearFromClass(row.kelas || ''));
      if (!(tahun >= 1 && tahun <= 6)) return;
      const key = [String(row.tarikh || ''), getLaporanBertugasClassKey(row.kelas || ''), String(row.nama || '').trim().toUpperCase()].join('|');
      if (key !== '||') latestAttendanceMap[key] = row;
    });
    const kehadiranRows = Object.values(latestAttendanceMap);
    const attendanceByDay = days.map(function(day) {
      const harian = kehadiranRows.filter(function(row) { return row.tarikh === day.ymd; });
      const hadir = harian.filter(function(row) { return row.status === 'Hadir' || row.status === 'Lewat'; }).length;
      const peratus = enrolmen.size ? ((hadir / enrolmen.size) * 100) : 0;
      return { hari: day.hari, ymd: day.ymd, display: day.display, hadir: hadir, enrolmen: enrolmen.size, peratus: peratus };
    });
    const purata = attendanceByDay.length ? (attendanceByDay.reduce(function(sum, item) { return sum + item.peratus; }, 0) / attendanceByDay.length) : 0;
    tbody.innerHTML = attendanceByDay.map(function(item) {
      return '<tr><td><strong>' + item.hari + '</strong></td><td>' + item.display + '</td><td>' + item.hadir + '</td><td>' + item.enrolmen + '</td><td>' + item.peratus.toFixed(1) + '%</td></tr>';
    }).join('') +
    '<tr style="background:rgba(26,79,160,0.06);font-weight:700"><td colspan="4">Purata Mingguan</td><td>' + purata.toFixed(1) + '%</td></tr>';
    if (summaryEl && !getLaporanBertugasTrimmed('laporanBertugasAttendanceSummary')) {
      summaryEl.value = buildLaporanGuruBertugasAttendanceSummary(attendanceByDay);
    }
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:var(--red);text-align:center;padding:20px">' + escapeLaporanHtml(e.message) + '</td></tr>';
    showToast(e.message, 'error');
  }
  refreshLaporanGuruBertugasUI();
}

async function loadLaporanGuruBertugasClassTables(savedData) {
  try {
    const muridRes = await callWorker({ action: 'readSheet', sheetKey: 'MURID' });
    if (!muridRes.success) throw new Error(muridRes.error || 'Gagal mendapatkan data murid');
    const guruList = await getGuruList();
    const kelasMap = {};
    (muridRes.rows || []).forEach(function(row) {
      const kelas = String(row[1] || '').trim();
      const tahun = getLaporanBertugasYearFromClass(kelas);
      if (!kelas || !tahun) return;
      const tahunNombor = Number(tahun);
      if (tahunNombor < 1 || tahunNombor > 6) return;
      const key = getLaporanBertugasClassKey(kelas);
      if (!kelasMap[key]) kelasMap[key] = {
        kelas: getLaporanBertugasClassDisplayName(kelas),
        tahun: tahun,
        asalKelas: kelas
      };
    });
    const classes = Object.values(kelasMap).sort(compareLaporanBertugasClasses);
    populateLaporanGuruBertugasClassTables(classes, guruList, savedData && savedData.kebersihan, savedData && savedData.keceriaan);
  } catch (e) {
    showToast(e.message, 'error');
  }
  refreshLaporanGuruBertugasUI();
}

function setLaporanGuruBertugasActivityRows(rows) {
  const tbody = document.getElementById('laporanBertugasAktivitiBody');
  if (!tbody || !rows || !rows.length) return;
  Array.from(tbody.querySelectorAll('tr')).forEach(function(tr, idx) {
    const data = rows[idx];
    if (!data) return;
    const cells = tr.querySelectorAll('td');
    if (cells[1] && cells[1].querySelector('input')) cells[1].querySelector('input').value = data.kategori || '';
    if (cells[2] && cells[2].querySelector('input')) cells[2].querySelector('input').value = data.aktiviti || '';
    if (cells[3] && cells[3].querySelector('input')) cells[3].querySelector('input').value = data.tarikhHari || '';
  });
  refreshLaporanGuruBertugasUI();
}

function populateLaporanGuruBertugasForm(saved) {
  if (!saved) return;
  setValue('laporanBertugasTarikhLaporan', saved.tarikhLaporan || '');
  setValue('laporanBertugasNamaGuru', saved.namaGuru || '');
  setValue('laporanBertugasJawatanGuru', saved.jawatanGuru || '');
  setValue('laporanBertugasMinggu', saved.mingguLabel || '');
  setValue('laporanBertugasPembantuGuru', saved.pembantuGuru || '');
  setValue('laporanBertugasTajuk', saved.tajuk || '');
  setValue('laporanBertugasAttendanceSummary', saved.rumusanKehadiran || '');
  setValue('laporanBertugasDisiplinStatusUmum', saved.disiplin && saved.disiplin.statusUmum || '');
  setValue('laporanBertugasDisiplinKes', saved.disiplin && saved.disiplin.kesSalahLaku || '');
  setValue('laporanBertugasDisiplinUniform', saved.disiplin && saved.disiplin.pakaianSeragam || '');
  setValue('laporanBertugasDisiplinDemerit', saved.disiplin && saved.disiplin.bukuDemerit || '');
  setValue('laporanBertugasRmtStatus', saved.rmt && saved.rmt.statusPelaksanaan || '');
  setValue('laporanBertugasRmtJumlah', saved.rmt && saved.rmt.jumlahPenerima || '');
  setValue('laporanBertugasRmtMenu', saved.rmt && saved.rmt.menuMinggu || '');
  setValue('laporanBertugasRmtAduan', saved.rmt && saved.rmt.aduanMasalah || '');
  setValue('laporanBertugasKeceriaanNota', saved.keceriaanNota || '');
  setValue('laporanBertugasRumusanMingguan', saved.rumusanMingguan || '');
  setLaporanGuruBertugasActivityRows(saved.aktiviti || []);
  refreshLaporanGuruBertugasUI();
}

function extractSavedLaporanBertugasRow(row) {
  if (!Array.isArray(row) || row.length < 16) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(row[2] || ''))) return null;
  try {
    return {
      mingguKe: row[0] || '',
      mingguLabel: row[1] || '',
      isnin: row[2] || '',
      jumaat: row[3] || '',
      tarikhLaporan: row[4] || '',
      namaGuru: row[5] || '',
      jawatanGuru: row[6] || '',
      pembantuGuru: row[7] || '',
      kehadiran: JSON.parse(row[8] || '[]'),
      rumusanKehadiran: row[9] || '',
      aktiviti: JSON.parse(row[10] || '[]'),
      disiplin: JSON.parse(row[11] || '{}'),
      rmt: JSON.parse(row[12] || '{}'),
      kebersihan: JSON.parse(row[13] || '[]'),
      keceriaan: JSON.parse(row[14] || '[]'),
      keceriaanNota: row[15] || '',
      rumusanMingguan: row[16] || '',
      savedAt: row[17] || '',
      savedBy: row[18] || '',
      tajuk: row[19] || ''
    };
  } catch (e) {
    return null;
  }
}

async function initLaporanGuruBertugasMingguanModule(forceReload) {
  enhanceLaporanGuruBertugasModuleLayout();
  ensureLaporanGuruBertugasBindings();
  const info = getLaporanGuruBertugasCurrentInfo();
  setValue('laporanBertugasNamaGuru', info.guru);
  setValue('laporanBertugasJawatanGuru', info.jawatan);
  setValue('laporanBertugasMinggu', info.mingguLabel);
  setValue('laporanBertugasPembantuGuru', info.pembantu);
  setValue('laporanBertugasTajuk', info.mingguKe ? ('Minggu Ke-' + info.mingguKe) : 'Laporan Mingguan');
  if (forceReload || !getLaporanBertugasTrimmed('laporanBertugasTarikhLaporan')) setValue('laporanBertugasTarikhLaporan', info.jumaat || getTodayYMD());
  setLaporanBertugasAiStatus('', false);
  let saved = null;
  try {
    const data = await callWorker({ action: 'readSheet', sheetKey: 'LAPORAN_BERTUGAS' });
    if (data.success) {
      const rows = (data.rows || []).map(extractSavedLaporanBertugasRow).filter(Boolean);
      saved = rows.reverse().find(function(entry) { return entry.isnin === info.isnin; }) || null;
    }
  } catch (e) {}
  if (saved) populateLaporanGuruBertugasForm(saved);
  await loadLaporanGuruBertugasClassTables(saved);
  await loadLaporanGuruBertugasAttendance();
  refreshLaporanGuruBertugasUI();
}

async function loadLaporanData() {
  await initLaporanGuruBertugasMingguanModule(false);
}

function getLaporanGuruBertugasPayload() {
  const info = getLaporanGuruBertugasCurrentInfo();
  return {
    mingguKe: info.mingguKe,
    mingguLabel: getLaporanBertugasTrimmed('laporanBertugasMinggu') || info.mingguLabel,
    isnin: info.isnin,
    jumaat: info.jumaat,
    tarikhLaporan: getLaporanBertugasTrimmed('laporanBertugasTarikhLaporan') || info.jumaat,
    namaGuru: getLaporanBertugasTrimmed('laporanBertugasNamaGuru') || info.guru,
    jawatanGuru: getLaporanBertugasTrimmed('laporanBertugasJawatanGuru') || info.jawatan,
    pembantuGuru: getLaporanBertugasTrimmed('laporanBertugasPembantuGuru') || info.pembantu,
    tajuk: getLaporanBertugasTrimmed('laporanBertugasTajuk'),
    kehadiran: getLaporanBertugasAttendanceRows(),
    rumusanKehadiran: getLaporanBertugasTrimmed('laporanBertugasAttendanceSummary'),
    aktiviti: getLaporanBertugasAktivitiRows(),
    disiplin: {
      statusUmum: getLaporanBertugasTrimmed('laporanBertugasDisiplinStatusUmum'),
      kesSalahLaku: getLaporanBertugasTrimmed('laporanBertugasDisiplinKes'),
      pakaianSeragam: getLaporanBertugasTrimmed('laporanBertugasDisiplinUniform'),
      bukuDemerit: getLaporanBertugasTrimmed('laporanBertugasDisiplinDemerit')
    },
    rmt: {
      statusPelaksanaan: getLaporanBertugasTrimmed('laporanBertugasRmtStatus'),
      jumlahPenerima: getLaporanBertugasTrimmed('laporanBertugasRmtJumlah'),
      menuMinggu: getLaporanBertugasTrimmed('laporanBertugasRmtMenu'),
      aduanMasalah: getLaporanBertugasTrimmed('laporanBertugasRmtAduan')
    },
    kebersihan: getLaporanBertugasKebersihanRows(),
    keceriaan: getLaporanBertugasKeceriaanRows(),
    keceriaanNota: getLaporanBertugasTrimmed('laporanBertugasKeceriaanNota'),
    rumusanMingguan: getLaporanBertugasTrimmed('laporanBertugasRumusanMingguan')
  };
}

async function simpanLaporanGuruBertugasMingguan() {
  const payload = getLaporanGuruBertugasPayload();
  if (!payload.tarikhLaporan) { showToast('Sila pilih tarikh laporan.', 'error'); return; }
  if ((payload.aktiviti || []).length < 3) {
    showToast('Sila isi sekurang-kurangnya 3 aktiviti/butiran untuk bahagian 2.', 'error');
    return;
  }
  try {
    const duplicate = await findExistingLaporanBertugasDuplicate(payload);
    if (duplicate) {
      showToast('Laporan guru bertugas untuk minggu ini sudah disimpan. Simpan dibatalkan.', 'error');
      return;
    }
  } catch (dupErr) {
    showToast(dupErr.message, 'error');
    return;
  }
  const row = [
    payload.mingguKe || '',
    payload.mingguLabel || '',
    payload.isnin || '',
    payload.jumaat || '',
    payload.tarikhLaporan || '',
    payload.namaGuru || '',
    payload.jawatanGuru || '',
    payload.pembantuGuru || '',
    JSON.stringify(payload.kehadiran || []),
    payload.rumusanKehadiran || '',
    JSON.stringify(payload.aktiviti || []),
    JSON.stringify(payload.disiplin || {}),
    JSON.stringify(payload.rmt || {}),
    JSON.stringify(payload.kebersihan || []),
    JSON.stringify(payload.keceriaan || []),
    payload.keceriaanNota || '',
    payload.rumusanMingguan || '',
    new Date().toISOString(),
    APP.user && APP.user.email ? APP.user.email : '',
    payload.tajuk || ''
  ];
  try {
    const data = await callWorker({ action: 'appendRow', sheetKey: 'LAPORAN_BERTUGAS', row: row });
    if (!data.success) throw new Error(data.error || 'Gagal menyimpan laporan');
    showToast('Laporan guru bertugas mingguan berjaya disimpan.', 'success');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function janaRumusanLaporanGuruBertugas() {
  if (!APP.workerUrl) { showToast('Worker URL diperlukan untuk ciri AI.', 'error'); return; }
  const btn = document.getElementById('laporanBertugasAiBtn');
  const payload = getLaporanGuruBertugasPayload();
  setLaporanBertugasAiStatus('AI sedang menjana rumusan mingguan berdasarkan semua kenyataan yang diisi guru bertugas.', false);
  if (btn) btn.disabled = true;
  const prompt = [
    'Tulis bahagian "Rumusan Mingguan" bagi laporan guru bertugas mingguan sekolah dalam Bahasa Malaysia formal.',
    'Fokus utama ialah merumuskan laporan mingguan berdasarkan kenyataan-kenyataan yang telah dikeyin oleh guru bertugas.',
    'Gunakan data dan kenyataan yang diberikan sahaja. Jangan reka fakta baharu.',
    'Sentuh perkara yang relevan seperti kehadiran murid, aktiviti sepanjang minggu, disiplin, pelaksanaan RMT, kebersihan kelas, pertandingan keceriaan, dan tindakan susulan jika ada.',
    'Hasil akhir mestilah 1 hingga 2 perenggan tanpa tajuk, nombor atau bullet.',
    'Maklumat laporan:\nGuru Bertugas: ' + (payload.namaGuru || '-') + '\nJawatan: ' + (payload.jawatanGuru || '-') + '\nMinggu: ' + (payload.mingguLabel || '-') + '\nTarikh Laporan: ' + (payload.tarikhLaporan || '-'),
    'Kehadiran murid mingguan:\n' + ((payload.kehadiran || []).map(function(item) {
      return [item.hari, item.tarikh, item.hadir + '/' + item.enrolmen, item.peratus].join(' | ');
    }).join('\n') || 'Tiada data'),
    'Rumusan kehadiran:\n' + (payload.rumusanKehadiran || 'Tiada catatan'),
    'Aktiviti sepanjang minggu:\n' + ((payload.aktiviti || []).map(function(item) {
      return (item.bil || '-') + '. [' + (item.kategori || '-') + '] ' + (item.aktiviti || '-') + ' - ' + (item.tarikhHari || '-');
    }).join('\n') || 'Tiada catatan'),
    'Tahap disiplin murid:\nStatus Umum: ' + (payload.disiplin.statusUmum || 'Tiada catatan') + '\nKes Salah Laku: ' + (payload.disiplin.kesSalahLaku || 'Tiada catatan') + '\nPakaian Seragam: ' + (payload.disiplin.pakaianSeragam || 'Tiada catatan') + '\nBuku Demerit: ' + (payload.disiplin.bukuDemerit || 'Tiada catatan'),
    'Status pelaksanaan RMT:\nStatus: ' + (payload.rmt.statusPelaksanaan || 'Tiada catatan') + '\nJumlah Penerima: ' + (payload.rmt.jumlahPenerima || 'Tiada catatan') + '\nMenu Minggu Ini: ' + (payload.rmt.menuMinggu || 'Tiada catatan') + '\nAduan / Masalah: ' + (payload.rmt.aduanMasalah || 'Tiada catatan'),
    'Tahap kebersihan kelas:\n' + ((payload.kebersihan || []).map(function(item) {
      return (item.bil || '-') + '. ' + (item.kelas || '-') + ' (Tahun ' + (item.tahun || '-') + ') - ' + (item.tahap || '-') + (item.catatan ? ' | ' + item.catatan : '');
    }).join('\n') || 'Tiada catatan'),
    'Pertandingan keceriaan kelas:\n' + ((payload.keceriaan || []).map(function(item) {
      return 'Tempat ' + (item.tempat || '-') + ': ' + (item.kelas || '-') + ' / Guru Kelas: ' + (item.guruKelas || '-') + ' / Markah: ' + (item.markah || '-') + (item.catatan ? ' / ' + item.catatan : '');
    }).join('\n') || 'Tiada catatan'),
    'Catatan penilaian keceriaan:\n' + (payload.keceriaanNota || 'Tiada catatan')
  ].join('\n\n');
  try {
    const data = await callWorkerAI(prompt, 'laporan_bertugas');
    if (!data.success || !data.content) throw new Error(data.error || 'Respons AI tidak sah');
    setValue('laporanBertugasRumusanMingguan', data.content.trim());
    setLaporanBertugasAiStatus('Rumusan mingguan berjaya dijana.', false);
    showToast('Rumusan mingguan berjaya dijana.', 'success');
  } catch (e) {
    setLaporanBertugasAiStatus('Gagal menjana rumusan mingguan: ' + e.message, true);
    showToast(e.message, 'error');
  } finally {
    if (btn) btn.disabled = false;
    refreshLaporanGuruBertugasUI();
  }
}

function buildLaporanGuruBertugasPrintTable(headers, rows, className) {
  return '<table class="print-table' + (className ? ' ' + className : '') + '"><thead><tr>' + headers.map(function(header) {
    return '<th>' + escapeLaporanHtml(header) + '</th>';
  }).join('') + '</tr></thead><tbody>' + rows.map(function(row) {
    return '<tr>' + row.map(function(cell) { return '<td>' + escapeLaporanHtml(cell) + '</td>'; }).join('') + '</tr>';
  }).join('') + '</tbody></table>';
}

function cetakLaporanGuruBertugasMingguan() {
  const payload = getLaporanGuruBertugasPayload();
  if (!payload.tarikhLaporan) { showToast('Sila pilih tarikh laporan dahulu.', 'error'); return; }
  const win = window.open('', '_blank');
  const attendanceRows = (payload.kehadiran || []).map(function(item) { return [item.hari || '', item.tarikh || '', item.hadir || '', item.enrolmen || '', item.peratus || '']; });
  const aktivitiRows = (payload.aktiviti || []).map(function(item) { return [item.bil || '', item.kategori || '', item.aktiviti || '', item.tarikhHari || '']; });
  const disiplinRows = [['Status Umum', payload.disiplin.statusUmum || '-'], ['Kes Salah Laku', payload.disiplin.kesSalahLaku || '-'], ['Pakaian Seragam', payload.disiplin.pakaianSeragam || '-'], ['Buku Demerit', payload.disiplin.bukuDemerit || '-']];
  const rmtRows = [['Status Pelaksanaan', payload.rmt.statusPelaksanaan || '-'], ['Jumlah Penerima RMT', payload.rmt.jumlahPenerima || '-'], ['Menu Minggu Ini', payload.rmt.menuMinggu || '-'], ['Aduan / Masalah', payload.rmt.aduanMasalah || '-']];
  const kebersihanRows = (payload.kebersihan || []).map(function(item) { return [item.bil || '', item.kelas || '', item.tahun || '', item.tahap || '', item.catatan || '-']; });
  const keceriaanRows = (payload.keceriaan || []).map(function(item) { return [item.tempat || '', item.tahun || '', item.kelas || '', item.guruKelas || '', item.markah || '', item.catatan || '-']; });
  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Laporan Guru Bertugas Mingguan</title>
  <style>
    :root{
      --navy:#1a4fa0;
      --blue:#214f88;
      --gold:#f5c518;
      --line:#4d78b4;
      --soft:#eef4fb;
      --ink:#10223f;
      --muted:#56697f;
    }
    *{box-sizing:border-box}
    body{
      margin:0;
      background:#fff;
      font-family:Calibri, Arial, sans-serif;
      color:var(--ink);
      -webkit-print-color-adjust:exact;
      print-color-adjust:exact;
    }
    .paper{
      max-width:100%;
      margin:0;
      background:#fff;
      padding:12mm;
      box-shadow:none;
    }
    .report-header{
      display:block;
      text-align:center;
      padding:10px 14px 14px;
      border:2px solid var(--line);
      background:#fff;
      margin-bottom:16px;
    }
    .report-logo{
      width:92px;
      height:92px;
      object-fit:contain;
      display:block;
      margin:0 auto 10px;
    }
    .header-copy .school{
      font-size:17px;
      font-weight:800;
      letter-spacing:.02em;
      color:var(--navy);
      text-transform:uppercase;
    }
    .header-copy .title{
      margin-top:6px;
      font-size:19px;
      font-weight:800;
      letter-spacing:.04em;
      color:#142f57;
      text-transform:uppercase;
    }
    .header-copy .subtitle{
      margin-top:4px;
      font-size:11pt;
      color:var(--muted);
    }
    .header-rule{
      width:220px;
      height:2px;
      margin:10px auto 0;
      background:linear-gradient(90deg, transparent, var(--line), transparent);
    }
    .report-section{
      margin-top:14px;
      border:1px solid #bfcfe3;
      page-break-inside:avoid;
      break-inside:avoid;
    }
    .report-section-title{
      padding:10px 12px;
      background:var(--blue);
      color:#fff;
      font-weight:800;
      font-size:12pt;
      text-transform:uppercase;
      letter-spacing:.02em;
    }
    .report-section-body{padding:12px}
    .report-note{
      margin-top:8px;
      color:var(--muted);
      font-size:10.5pt;
      line-height:1.55;
    }
    .summary-box{
      border:1px solid #bfd0e7;
      background:linear-gradient(180deg,#fff,#f8fbff);
      padding:12px 14px;
      line-height:1.65;
      white-space:pre-wrap;
      color:#14223a;
    }
    .print-table{
      width:100%;
      border-collapse:collapse;
      font-size:10.8pt;
      margin:0;
    }
    .print-table th,
    .print-table td{
      border:1px solid var(--line);
      padding:8px 9px;
      vertical-align:top;
    }
    .print-table th{
      background:#214f88;
      color:#fff;
      text-align:center;
      font-weight:800;
    }
    .print-table td{
      background:#fff;
    }
    .print-table tbody tr:nth-child(even) td{
      background:var(--soft);
    }
    .print-table.meta td:first-child{
      width:220px;
      background:#f2f7fd;
      font-weight:700;
    }
    .print-table .num{
      width:60px;
      text-align:center;
      font-weight:700;
    }
    .print-table .center{text-align:center}
    .signatures{
      display:flex;
      justify-content:space-between;
      gap:40px;
      margin-top:28px;
    }
    .sign-box{width:48%; text-align:center}
    .sign-line{
      border-top:1px solid #111;
      margin-top:56px;
      padding-top:8px;
    }
    .print-footer{
      margin-top:16px;
      text-align:center;
      color:var(--muted);
      font-size:10pt;
    }
    @page{
      size:A4;
      margin:12mm;
    }
    @media print{
      body{background:#fff}
      .paper{
        margin:0;
        padding:0;
        box-shadow:none;
        max-width:none;
      }
      .report-header{page-break-after:avoid}
      .report-section{page-break-inside:avoid}
    }
  </style>
</head>
<body>
  <div class="paper">
    <div class="report-header">
      <img class="report-logo" id="printReportLogo" src="assets/sk-kiandongo-logo.png" alt="Logo SK Kiandongo">
      <div class="header-copy">
        <div class="school">Sekolah Kebangsaan Kiandongo</div>
        <div class="title">Laporan Guru Bertugas Mingguan</div>
        <div class="subtitle">PPD Telupid-Tongod, Sabah</div>
        <div class="header-rule"></div>
      </div>
    </div>

    ${(() => {
      const metaTable = buildLaporanGuruBertugasPrintTable(
        ['Perkara', 'Maklumat'],
        [
          ['Guru Bertugas', payload.namaGuru || '-'],
          ['Jawatan / Peranan', payload.jawatanGuru || '-'],
          ['Pembantu Guru Bertugas', payload.pembantuGuru || '-'],
          ['Minggu', payload.mingguLabel || '-'],
          ['Tarikh Laporan', payload.tarikhLaporan || '-']
        ],
        'meta'
      );
      return `<section class="report-section"><div class="report-section-title">Maklumat Laporan</div><div class="report-section-body">${metaTable}</div></section>`;
    })()}

    <section class="report-section">
      <div class="report-section-title">1. Kehadiran Murid Harian dan Keseluruhan</div>
      <div class="report-section-body">
        ${buildLaporanGuruBertugasPrintTable(['Hari', 'Tarikh', 'Jumlah Murid Hadir', 'Jumlah Murid Enrolmen', 'Peratus Kehadiran (%)'], attendanceRows.length ? attendanceRows : [['-', '-', '-', '-', '-']])}
        <div class="report-note"><strong>Rumusan Kehadiran:</strong> ${escapeLaporanHtml(payload.rumusanKehadiran || '-')}</div>
      </div>
    </section>

    <section class="report-section">
      <div class="report-section-title">2. Kenyataan Aktiviti Sepanjang Minggu</div>
      <div class="report-section-body">
        ${buildLaporanGuruBertugasPrintTable(['Bil.', 'Kategori', 'Aktiviti / Butiran', 'Tarikh / Hari'], aktivitiRows.length ? aktivitiRows : [['-', '-', '-', '-']])}
      </div>
    </section>

    <section class="report-section">
      <div class="report-section-title">3. Kenyataan Tahap Disiplin Murid</div>
      <div class="report-section-body">
        ${buildLaporanGuruBertugasPrintTable(['Aspek Disiplin', 'Butiran / Catatan'], disiplinRows)}
      </div>
    </section>

    <section class="report-section">
      <div class="report-section-title">4. Status Pelaksanaan RMT</div>
      <div class="report-section-body">
        ${buildLaporanGuruBertugasPrintTable(['Perkara', 'Status / Maklumat'], rmtRows)}
      </div>
    </section>

    <section class="report-section">
      <div class="report-section-title">5. Tahap Kebersihan Kelas</div>
      <div class="report-section-body">
        ${buildLaporanGuruBertugasPrintTable(['Bil.', 'Nama Kelas', 'Tahun', 'Tahap Kebersihan', 'Catatan'], kebersihanRows.length ? kebersihanRows : [['-', '-', '-', '-', '-']])}
      </div>
    </section>

    <section class="report-section">
      <div class="report-section-title">6. Pertandingan Keceriaan Kelas</div>
      <div class="report-section-body">
        ${buildLaporanGuruBertugasPrintTable(['Tempat', 'Tahun', 'Nama Kelas', 'Guru Kelas', 'Markah (%)', 'Catatan'], keceriaanRows.length ? keceriaanRows : [['-', '-', '-', '-', '-', '-']])}
        <div class="report-note"><strong>Catatan Penilaian Keceriaan:</strong> ${escapeLaporanHtml(payload.keceriaanNota || '-')}</div>
      </div>
    </section>

    <section class="report-section">
      <div class="report-section-title">7. Rumusan Mingguan</div>
      <div class="report-section-body">
        <div class="summary-box">${escapeLaporanHtml(payload.rumusanMingguan || '-')}</div>
      </div>
    </section>

    <div class="signatures">
      <div class="sign-box">
        <div class="sign-line"><strong>${escapeLaporanHtml(payload.namaGuru || '________________')}</strong><br><span>${escapeLaporanHtml(payload.jawatanGuru || 'Guru Bertugas')}</span></div>
      </div>
      <div class="sign-box">
        <div class="sign-line"><strong>________________</strong><br><span>Guru Besar</span></div>
      </div>
    </div>
    <div class="print-footer">Laporan ini dijana melalui Smart School Hub dan sedia untuk cetakan rasmi.</div>
  </div>
  <script>
    (function(){
      var done = false;
      function printNow(){
        if (done) return;
        done = true;
        setTimeout(function(){ window.print(); }, 250);
      }
      var logo = document.getElementById('printReportLogo');
      if (!logo) { printNow(); return; }
      if (logo.complete) { printNow(); }
      else {
        logo.onload = printNow;
        logo.onerror = printNow;
      }
    })();
  <\/script>
</body>
</html>`);
  win.document.close();
}
async function hantarNotifTidakHadir() {
  const tarikh = document.getElementById('notifTarikh').value;
  const kelas = document.getElementById('notifKelas').value;
  if (!tarikh) { showToast('Sila pilih tarikh.', 'error'); return; }
  const resultBox = document.getElementById('notifResult');
  if (!isMuridAttendanceNotifEnabled()) {
    resultBox.textContent = 'Notifikasi kehadiran murid dinyahaktifkan dalam modul konfigurasi.';
    showToast('Notifikasi murid dinyahaktifkan dalam konfigurasi.', 'error');
    return;
  }
  if (!shouldNotifyMuridGuardian()) {
    resultBox.textContent = 'WhatsApp wali murid dimatikan dalam konfigurasi.';
    showToast('WhatsApp wali murid dimatikan dalam konfigurasi.', 'error');
    return;
  }
  resultBox.textContent = 'Memuat senarai murid tidak hadir...';
  try {
    const data = await callWorker({ action: 'readSheet', sheetKey: 'KEHADIRAN_MURID' });
    if (!data.success) throw new Error(data.error || 'Gagal');
    let rows = (data.rows || []).map(parseKehadiranMuridRow).filter(r => r.tarikh === tarikh && ['Tidak Hadir', 'Ponteng', 'Sakit'].includes(r.status));
    if (kelas) rows = rows.filter(r => r.kelas === kelas);
    if (!rows.length) { resultBox.textContent = 'Tiada murid tidak hadir / sakit / ponteng.'; showToast('Tiada rekod untuk dihantar.', 'info'); return; }
    resultBox.textContent = 'Menghantar ' + rows.length + ' notifikasi...\n';
    let sent = 0, failed = 0;
    for (const r of rows) {
      const telefon = r.telefon;
      if (!telefon) { resultBox.textContent += '⚠ ' + r.nama + ' — tiada nombor\n'; continue; }
      const tpl = getAttendanceTemplate('ssh_attendance_tpl_murid_guardian', getLegacyMuridGuardianTemplate());
      const mesej = renderAttendanceTemplate(tpl, {
        NAMA: r.nama,
        KELAS: r.kelas,
        STATUS: r.status || 'Tidak Hadir',
        TARIKH: tarikh,
        SEKOLAH: getSchoolTemplateName()
      });
      try {
        const resp = await callFonnte(telefon, mesej);
        if (resp.status === true || resp.status === 'true') { resultBox.textContent += '✅ ' + r.nama + ' → ' + telefon + '\n'; sent++; logNotif('Tidak Hadir', telefon, mesej, 'Berjaya'); }
        else { resultBox.textContent += '❌ ' + r.nama + ' — ' + JSON.stringify(resp) + '\n'; failed++; }
      } catch(err) { resultBox.textContent += '❌ ' + r.nama + ' — ' + err.message + '\n'; failed++; }
      await sleep(800);
    }
    resultBox.textContent += '\n─────\nBerjaya: ' + sent + '  |  Gagal: ' + failed;
    showToast('Notifikasi dihantar: ' + sent + '/' + rows.length, sent > 0 ? 'success' : 'error');
  } catch(e) { resultBox.textContent = 'Ralat: ' + e.message; showToast(e.message, 'error'); }
}

async function notifSatuMurid(nama, kelas, tarikh, telefon) {
  if (!telefon) { showToast('Tiada nombor telefon untuk ' + nama, 'error'); return; }
  showModule('notifikasi');
  document.getElementById('notifTarget').value = telefon;
  const tpl = getAttendanceTemplate('ssh_attendance_tpl_murid_guardian', getLegacyMuridGuardianTemplate());
  document.getElementById('notifMesej').value = renderAttendanceTemplate(tpl, {
    NAMA: nama,
    KELAS: kelas,
    STATUS: 'Tidak Hadir',
    TARIKH: tarikh,
    SEKOLAH: getSchoolTemplateName()
  });
  showToast('Mesej disediakan untuk ' + nama + '.', 'info');
}

async function hantarTelegramTidakHadirMuridManual() {
  const tarikh = document.getElementById('notifTarikh').value;
  const kelas = document.getElementById('notifKelas').value;
  if (!tarikh) { showToast('Sila pilih tarikh.', 'error'); return; }
  const resultBox = document.getElementById('notifResult');
  if (!isMuridAttendanceNotifEnabled()) {
    resultBox.textContent = 'Notifikasi kehadiran murid dinyahaktifkan dalam modul konfigurasi.';
    showToast('Notifikasi murid dinyahaktifkan dalam konfigurasi.', 'error');
    return;
  }
  const sendTelegram = shouldNotifyMuridTelegram();
  const sendGuardian = shouldNotifyMuridGuardian();
  if (!sendTelegram && !sendGuardian) {
    resultBox.textContent = 'Tiada saluran murid aktif. Aktifkan Telegram atau WhatsApp wali dalam konfigurasi.';
    showToast('Tiada saluran notifikasi murid aktif.', 'error');
    return;
    }
    resultBox.textContent = 'Memuat senarai murid tidak hadir...';
  try {
    const rows = await getTidakHadirMuridList(tarikh, kelas);
    if (!rows.length) { resultBox.textContent = 'Tiada murid tidak hadir / sakit / ponteng.'; showToast('Tiada rekod untuk dihantar.', 'info'); return; }
    resultBox.textContent = 'Menghantar ke ' + [sendTelegram ? 'Telegram' : '', sendGuardian ? 'WhatsApp wali' : ''].filter(Boolean).join(' dan ') + '...\n';
    const namaList = rows.map(r => '- ' + r.nama + ' (' + r.kelas + ')').join('\n');
    const mesejTelegram = renderAttendanceTemplate(getAttendanceTemplate('ssh_attendance_tpl_murid_summary', DEFAULT_ATTENDANCE_TEMPLATES.muridSummary), {
      TARIKH: tarikh,
      KELAS: kelas || 'Semua Kelas',
      BILANGAN: rows.length,
      SENARAI: namaList,
      SEKOLAH: getSchoolTemplateName()
    });
    const tgOk = sendTelegram ? await sendTelegramLogged('Tidak Hadir Murid', 'Telegram Admin', mesejTelegram) : false;
    let sent = 0, failed = 0;
    if (sendGuardian) {
    for (const r of rows) {
      const telefon = r.telefon;
      if (!telefon) { resultBox.textContent += '⚠ ' + r.nama + ' — tiada nombor\n'; continue; }
      const tpl = getAttendanceTemplate('ssh_attendance_tpl_murid_guardian', getLegacyMuridGuardianTemplate());
      const mesej = renderAttendanceTemplate(tpl, {
        NAMA: r.nama,
        KELAS: r.kelas,
        STATUS: r.status || 'Tidak Hadir',
        TARIKH: tarikh,
        SEKOLAH: getSchoolTemplateName()
      });
      try {
        const resp = await callFonnte(telefon, mesej);
        if (resp.status === true || resp.status === 'true') { sent++; logNotif('Tidak Hadir Murid', telefon, mesej, 'Berjaya'); resultBox.textContent += '✅ ' + r.nama + ' → ' + telefon + '\n'; }
        else { failed++; resultBox.textContent += '❌ ' + r.nama + ' — ' + JSON.stringify(resp) + '\n'; }
      } catch (err) {
        failed++;
        resultBox.textContent += '❌ ' + r.nama + ' — ' + err.message + '\n';
      }
      await sleep(800);
    }
    resultBox.textContent += '\n─────\nBerjaya: ' + sent + '  |  Gagal: ' + failed;
    } else {
      resultBox.textContent += 'WhatsApp wali dimatikan dalam konfigurasi.\n';
    }
    showToast('Notifikasi murid dihantar: ' + sent + '/' + rows.length, sent > 0 || tgOk ? 'success' : 'error');
  } catch (e) {
    resultBox.textContent = 'Ralat: ' + e.message;
    showToast(e.message, 'error');
  }
}

async function hantarTelegramGuruTidakHadirManual() {
  const today = (document.getElementById('notifGuruTarikh') || {}).value || getTodayYMD();
  const resultBox = document.getElementById('notifResult');
  if (!isGuruAttendanceNotifEnabled()) {
    resultBox.textContent = 'Notifikasi kehadiran guru dinyahaktifkan dalam modul konfigurasi.';
    showToast('Notifikasi guru dinyahaktifkan dalam konfigurasi.', 'error');
    return;
  }
  resultBox.textContent = 'Memuat senarai guru belum daftar...';
  try {
    const belumIsi = await getGuruBelumIsiList(today);
    if (!belumIsi.length) { resultBox.textContent = 'Tiada guru yang belum mendaftar kehadiran hari ini.'; showToast('Tiada rekod untuk dihantar.', 'info'); return; }
    const namaList = belumIsi.map(r => '- ' + r[0]).join('\n');
    const mesej = renderAttendanceTemplate(getAttendanceTemplate('ssh_attendance_tpl_guru_admin', DEFAULT_ATTENDANCE_TEMPLATES.guruAdmin), {
      TARIKH: today,
      BILANGAN: belumIsi.length,
      SENARAI: namaList,
      SEKOLAH: getSchoolTemplateName()
    });
    resultBox.textContent = 'Menghantar ke Telegram dan WhatsApp guru...\n';
    const tgOk = await sendTelegramLogged('Tidak Hadir Guru', 'Telegram Admin', mesej);
    let sent = 0;
    let skipped = 0;
    let failed = 0;
    for (const g of belumIsi) {
      const result = await sendGuruAttendancePersonalReminderOnce(g, today, resultBox);
      if (result.sent) sent++;
      else if (result.failed) failed++;
      else skipped++;
    }
    resultBox.textContent += '\n-----\nBerjaya: ' + sent + '  |  Dilangkau: ' + skipped + '  |  Gagal: ' + failed;
    showToast('Peringatan guru dihantar: ' + sent + '/' + belumIsi.length, sent > 0 || tgOk ? 'success' : 'error');
  } catch (e) {
    resultBox.textContent = 'Ralat: ' + e.message;
    showToast(e.message, 'error');
  }
}

function notifTidakHadirBatch() { showModule('notifikasi'); switchNotifTab('hantar'); showToast('Tetapkan tarikh dan kelas, kemudian klik Hantar.', 'info'); }

async function hantarNotifTersuai() {
  const target = document.getElementById('notifTarget').value.trim();
  const mesej = document.getElementById('notifMesej').value.trim();
  if (!target) { showToast('Sila masukkan nombor penerima.', 'error'); return; }
  if (!mesej) { showToast('Mesej tidak boleh kosong.', 'error'); return; }
  try {
    const resp = await callFonnte(target, mesej);
    if (resp.status === true || resp.status === 'true') {
      showToast('Mesej berjaya dihantar!', 'success');
      logNotif('Tersuai', target, mesej, 'Berjaya');
      document.getElementById('notifResult').textContent = '✅ Mesej berjaya dihantar ke ' + target;
    } else { document.getElementById('notifResult').textContent = '❌ Gagal: ' + JSON.stringify(resp); showToast('Gagal menghantar mesej.', 'error'); }
  } catch(e) { document.getElementById('notifResult').textContent = 'Ralat: ' + e.message; showToast(e.message, 'error'); }
}

function switchNotifTab(tab) {
  ['hantar','templat','log'].forEach(t => {
    const el = document.getElementById('notif-tab-' + t);
    if (el) el.style.display = t === tab ? 'block' : 'none';
  });
  document.querySelectorAll('.tab-btn').forEach(function(btn, i) {
    const tabs = ['hantar','templat','log'];
    btn.classList.toggle('active', tabs[i] === tab);
  });
  if (tab === 'log') loadNotifLog();
}

function simpanTemplat(jenis) {
  const key = jenis === 'tidakHadir' ? 'tpl_tidakHadir' : 'tpl_umum';
  const elId = jenis === 'tidakHadir' ? 'tplTidakHadir' : 'tplUmum';
  const el = document.getElementById(elId);
  if (el) localStorage.setItem(key, el.value);
  showToast('Templat disimpan.', 'success');
}

async function loadNotifLog() {
  const tbody = document.getElementById('notifLogBody');
  if (!tbody) return;
  const logs = getNotificationLogs();
  const today = getTodayYMD();
  const todayLogs = logs.filter(function(l) { return l.date === today; });
  const successLogs = todayLogs.filter(isSuccessfulNotifLog);
  const failedLogs = todayLogs.filter(function(l) { return !isSuccessfulNotifLog(l); });
  const latest = logs.length ? logs[logs.length - 1] : null;
  setText('notif-log-stat-today', todayLogs.length);
  setText('notif-log-stat-success', successLogs.length);
  setText('notif-log-stat-failed', failedLogs.length);
  setText('notif-log-stat-latest', latest ? (latest.type || '-') : '-');
  setHTML('notifLogActivityList', renderNotificationActivityItems(todayLogs, 8));
  if (!logs.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:var(--muted);text-align:center;padding:20px">Tiada log notifikasi.</td></tr>';
    return;
  }
  tbody.innerHTML = logs.slice().reverse().map(function(l) {
    return '<tr><td style="font-size:0.78rem;white-space:nowrap">' + escapeHtml(l.time || '') + '</td><td><span class="badge badge-blue">' + escapeHtml(l.type || '') + '</span></td><td style="font-size:0.82rem">' + escapeHtml(l.target || '') + '</td><td>' + getNotifLogStatusBadge(l) + '</td><td style="font-size:0.8rem;color:var(--muted)">' + escapeHtml(l.preview || '') + '</td></tr>';
  }).join('');
}

function logNotif(type, target, mesej, status) {
  const now = new Date();
  const entry = { time: now.toLocaleString('ms-MY', { timeZone: MALAYSIA_TIMEZONE }), date: getTodayYMD(now), type: type, target: target, status: status, preview: mesej.substring(0, 60).replace(/\n/g, ' ') };
  APP.notifLog.push(entry);
  if (APP.notifLog.length > 200) APP.notifLog.shift();
  localStorage.setItem('ssh_notif_log', JSON.stringify(APP.notifLog));
  renderAktivitiTerkini();
  if (isModuleVisible('notifikasi')) loadNotifLog();
}

// ── HARI LAHIR ─────────────────────────────────────────────────
async function loadHariLahir(forceHydrate) {
  hlData = normalizeStoredHLData(hlData);
  const fields = ['hl-tg-bot','hl-tg-chat','hl-tg-topic'];
  const keys = ['tgBot','tgChat','tgTopic'];
  fields.forEach((id, i) => { const el = document.getElementById(id); if (el) el.value = hlConfig[keys[i]] || ''; });
  syncGroupGuruFonnteInputs(hlConfig.fonnteGroup || '');
  renderBirthdayNotifConfigSummary();
  const filterPeranan = document.getElementById('hlFilterPeranan');
  const filterBulan = document.getElementById('hlFilterBulan');
  const peranan = filterPeranan ? filterPeranan.value : '';
  const bulan = filterBulan ? filterBulan.value : '';
  const today = getMalaysiaTodayDate();
  const todayM = today.getMonth() + 1, todayD = today.getDate();
  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);
  let filtered = hlData;
  if (peranan) filtered = filtered.filter(p => p.peranan === peranan);
  if (bulan) filtered = filtered.filter(p => p.bulan == bulan);
  const hariIni = hlData.filter(p => p.bulan == todayM && p.hari == todayD).length;
  const minggu = hlData.filter(function(p) {
    var days = daysUntilBirthday(p.bulan, p.hari);
    return days >= 0 && days <= 7;
  }).length;
  setText('hl-stat-hari-ini', hariIni);
  setText('hl-stat-minggu', minggu);
  setText('hl-stat-guru', hlData.filter(p => p.peranan !== 'Murid').length);
  setText('hl-stat-murid', hlData.filter(p => p.peranan === 'Murid').length);
  filtered.sort(function(a, b) { return daysUntilBirthday(a.bulan, a.hari) - daysUntilBirthday(b.bulan, b.hari); });
  const tbody = document.getElementById('hlBody');
  if (!tbody) return;
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="color:var(--muted);text-align:center;padding:24px">Tiada rekod. Import CSV atau tambah manual.</td></tr>';
    if (APP.workerUrl && (forceHydrate || !_birthdayHydratedOnce)) {
      try {
        await hydrateHariLahirFromBackend(!!forceHydrate);
        return loadHariLahir(false);
      } catch (e) {
        console.warn('Hydrasi Hari Lahir gagal:', e);
      }
    }
    return;
  }
  tbody.innerHTML = filtered.map(function(p, i) {
    const days = daysUntilBirthday(p.bulan, p.hari);
    const umur = hitungUmur(p.bulan, p.hari, p.tahun);
    const daysLbl = days === 0 ? '<span class="badge" style="background:rgba(245,197,24,0.2);color:#b45309">🎂 HARI INI!</span>' : days <= 7 ? '<span class="badge badge-amber">' + days + ' hari lagi</span>' : '<span style="color:var(--muted);font-size:0.82rem">' + days + ' hari</span>';
    return '<tr><td data-label="Nama"><strong>' + p.nama + '</strong></td><td data-label="Peranan"><span class="badge ' + (p.peranan === 'Murid' ? 'badge-blue' : 'badge-green') + '">' + p.peranan + '</span></td><td data-label="Kelas">' + (p.kelas || '—') + '</td><td data-label="Tarikh Lahir">' + p.hari + ' ' + BULAN[p.bulan] + ' ' + (p.tahun || '') + '</td><td data-label="Umur">' + (umur ? umur + ' thn' : '—') + '</td><td data-label="Hari Tinggal">' + daysLbl + '</td><td data-label="No. Telefon" style="font-size:0.82rem">' + (p.telefon || '—') + '</td><td data-label="Tindakan" style="display:flex;gap:5px;flex-wrap:wrap">' + (days === 0 ? '<button class="btn btn-sm btn-success" onclick="hantarUcapanSeorang(' + i + ')">🎉</button>' : '') + '<button class="btn btn-sm btn-danger" onclick="hapusHL(' + i + ')">✕</button></td></tr>';
  }).join('');
  if (APP.workerUrl && (forceHydrate || !_birthdayHydratedOnce)) {
    try {
      await hydrateHariLahirFromBackend(!!forceHydrate);
      renderBirthdayDashboard();
      if (forceHydrate) return loadHariLahir(false);
    } catch (e) {
      console.warn('Hydrasi Hari Lahir gagal:', e);
    }
  }
}

function daysUntilBirthday(bulan, hari) {
  const today = getMalaysiaTodayDate();
  const month = parseInt(bulan, 10);
  const day = parseInt(hari, 10);
  if (!month || !day || month < 1 || month > 12 || day < 1 || day > 31) return 9999;
  const bd = new Date(today.getFullYear(), month - 1, day);
  if (bd < today) bd.setFullYear(bd.getFullYear() + 1);
  const diff = Math.ceil((bd - today) / 86400000);
  return diff < 0 ? 0 : diff;
}

function hitungUmur(bulan, hari, tahun) {
  if (!tahun) return null;
  const today = getMalaysiaTodayDate();
  let age = today.getFullYear() - tahun;
  if (today.getMonth() + 1 < bulan || (today.getMonth() + 1 === bulan && today.getDate() < hari)) age--;
  return age;
}

function importHLCSV() {
  const file = document.getElementById('hlCsvInput').files[0];
  if (!file) { showToast('Pilih fail CSV dahulu.', 'error'); return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    const lines = e.target.result.split(/\r?\n/).filter(function(l) { return l.trim(); });
    let added = 0, skipped = 0;
    lines.forEach(function(line, idx) {
      if (idx === 0 && line.toLowerCase().includes('nama')) return;
      const cols = parseCSVLine(line);
      if (cols.length < 4) { skipped++; return; }
      const parts = parseBirthdayParts(cols[3]);
      if (!cols[0] || !parts) { skipped++; return; }
      var didChange = upsertHLRecord({
        nama: cols[0],
        peranan: cols[1] || 'Guru',
        kelas: cols[2] || '',
        hari: parts.day,
        bulan: parts.month,
        tahun: parts.year || null,
        telefon: cols[4] || ''
      }, function(item, normalized) {
        return item.nama === normalized.nama && item.peranan === normalized.peranan && item.kelas === normalized.kelas;
      });
      if (didChange) added++;
    });
    localStorage.setItem('ssh_hl_data', JSON.stringify(hlData));
    if (APP.workerUrl && APP.user && APP.user.idToken) {
      saveHariLahirToBackend().catch(function(err) {
        console.warn('Simpan backend Hari Lahir selepas import gagal:', err);
      });
    }
    const resultEl = document.getElementById('hlImportResult');
    if (resultEl) resultEl.textContent = '✅ ' + added + ' rekod diimport. ' + skipped + ' dilangkau.';
    showToast(added + ' rekod berjaya diimport!', 'success');
    loadHariLahir();
  };
  reader.readAsText(file);
}

async function hapusHL(idx) {
  hlData.splice(idx, 1);
  localStorage.setItem('ssh_hl_data', JSON.stringify(hlData));
  try {
    await saveHariLahirToBackend();
  } catch (e) {
    showToast('Data tempatan dikemaskini tetapi backend Hari Lahir gagal disimpan: ' + e.message, 'error');
  }
  loadHariLahir(false);
}
function openModalHariLahir() {
  const nama = prompt('Nama:'); if (!nama) return;
  const peranan = prompt('Peranan (Guru/Murid):') || 'Guru';
  const kelas = prompt('Kelas (kosong jika guru):') || '';
  const tarikh = prompt('Tarikh Lahir (DD/MM/YYYY):'); if (!tarikh) return;
  const telefon = prompt('No. Telefon (opsional):') || '';
  const parts = parseBirthdayParts(tarikh);
  if (!parts) { showToast('Format tarikh tidak sah. Gunakan DD/MM/YYYY.', 'error'); return; }
  upsertHLRecord({
    nama: nama,
    peranan: peranan,
    kelas: kelas,
    hari: parts.day,
    bulan: parts.month,
    tahun: parts.year || null,
    telefon: telefon
  }, function(item, normalized) {
    return item.nama === normalized.nama && item.peranan === normalized.peranan && item.kelas === normalized.kelas;
  });
  localStorage.setItem('ssh_hl_data', JSON.stringify(hlData));
  var finalize = function() {
    showToast(nama + ' ditambah.', 'success');
    loadHariLahir(false);
  };
  if (APP.workerUrl && APP.user && APP.user.idToken) {
    saveHariLahirToBackend().then(finalize).catch(function(e) {
      showToast('Rekod ditambah pada browser ini tetapi backend Hari Lahir gagal disimpan: ' + e.message, 'error');
      loadHariLahir(false);
    });
    return;
  }
  finalize();
}

async function hantarUcapanHariIni() {
  const today = getMalaysiaTodayDate();
  const todayYmd = getTodayYMD();
  const m = today.getMonth() + 1, d = today.getDate();
  const senarai = hlData.filter(p => p.bulan == m && p.hari == d);
  if (!senarai.length) { showToast('Tiada hari lahir hari ini.', 'info'); return; }
  let sent = 0;
  for (const p of senarai) {
    const umurNext = p.tahun ? hitungUmur(p.bulan, p.hari, p.tahun) + 1 : '';
    const mesej = buildUcapanHL(p, umurNext);
    let ok = false;
    try { await hantarTelegram(mesej); logNotif('Hari Lahir', p.nama, mesej, 'Berjaya'); ok = true; } catch(e) {}
    const fonnteTarget = getBirthdayFonnteTarget(p);
    if (fonnteTarget) {
      try { await callFonnte(fonnteTarget, mesej); logNotif('Hari Lahir', fonnteTarget, mesej, 'Berjaya'); ok = true; } catch(e) {}
    }
    if (ok) sent++;
    await sleep(500);
  }
  localStorage.setItem('ssh_notif_hl_' + todayYmd, '1');
  showToast('Ucapan dihantar untuk ' + sent + ' orang!', 'success');
}

function resetNotifHariLahirHariIni() {
  const todayYmd = getTodayYMD();
  const key = 'ssh_notif_hl_' + todayYmd;
  if (!localStorage.getItem(key)) {
    showToast('Guard hari lahir untuk hari ini belum wujud.', 'info');
    return;
  }
  localStorage.removeItem(key);
  showToast('Guard notifikasi hari lahir hari ini berjaya direset.', 'success');
}

async function hantarUcapanSeorang(idx) {
  const p = hlData[idx]; if (!p) return;
  const umurNext = p.tahun ? hitungUmur(p.bulan, p.hari, p.tahun) + 1 : '';
  const mesej = buildUcapanHL(p, umurNext);
  let ok = false;
  try { await hantarTelegram(mesej); logNotif('Hari Lahir', p.nama, mesej, 'Berjaya'); ok = true; } catch(e) {}
  const fonnteTarget = getBirthdayFonnteTarget(p);
  if (fonnteTarget) {
    try { await callFonnte(fonnteTarget, mesej); logNotif('Hari Lahir', fonnteTarget, mesej, 'Berjaya'); ok = true; } catch(e) {}
  }
  if (ok) showToast('Ucapan dihantar!', 'success');
  else showToast('Telegram / Fonnte gagal dihantar.', 'error');
}

async function semakNotifHariLahirAuto() {
  if (!isHLNotifEnabled()) return;
  const todayYmd = getTodayYMD();
  if (localStorage.getItem('ssh_notif_hl_' + todayYmd)) return;
  const today = getMalaysiaTodayDate();
  const m = today.getMonth() + 1;
  const d = today.getDate();
  const senarai = hlData.filter(function(p) { return p.bulan == m && p.hari == d; });
  if (!senarai.length) return;
  let sent = 0;
  for (const p of senarai) {
    const umurNext = p.tahun ? hitungUmur(p.bulan, p.hari, p.tahun) + 1 : '';
    const mesej = buildUcapanHL(p, umurNext);
    let ok = false;
    try { await hantarTelegram(mesej); logNotif('Auto Hari Lahir', p.nama, mesej, 'Berjaya'); ok = true; } catch(e) {}
    const fonnteTarget = getBirthdayFonnteTarget(p);
    if (fonnteTarget) {
      try { await callFonnte(fonnteTarget, mesej); logNotif('Auto Hari Lahir', fonnteTarget, mesej, 'Berjaya'); ok = true; } catch(e) {}
    }
    if (ok) sent++;
    await sleep(300);
  }
  if (sent > 0) {
    localStorage.setItem('ssh_notif_hl_' + todayYmd, '1');
    showToast('Notifikasi hari lahir automatik dihantar.', 'success');
  }
}

function buildUcapanHL(p, umur) {
  const isGuru = p.peranan !== 'Murid';
  const umurText = umur ? ' yang ke-*' + umur + '*' : '';
  if (isGuru) return '🎂 *Selamat Hari Lahir!*\n\nWarga SK Kiandongo mengucapkan *Selamat Hari Lahir' + umurText + '* kepada *' + p.nama + '*. Semoga sentiasa sihat dan bahagia! 🌟\n\n_SK Kiandongo_';
  return '🎉 *Happy Birthday!*\n\nGuru dan warga SK Kiandongo mengucapkan *Selamat Hari Lahir' + umurText + '* kepada *' + p.nama + '* (' + p.kelas + '). Semoga ceria dan berjaya! 📚✨\n\n_SK Kiandongo_';
}

function getBirthdayFonnteTarget(person) {
  if (!person) return '';
  if (String(person.peranan || '').trim() === 'Murid') {
    var kelas = String(person.kelas || '').trim();
    var directGroup = String(getGroupKelas(kelas) || '').trim();
    if (directGroup) return directGroup;
    var upper = kelas.toUpperCase();
    var matchedKelas = SENARAI_KELAS_MURID.find(function(item) {
      var target = String(item || '').toUpperCase();
      return upper.indexOf(target) !== -1 || target.indexOf(upper) !== -1;
    });
    return String(getGroupKelas(matchedKelas) || '').trim() || String(person.telefon || '').trim();
  }
  return String(hlConfig.fonnteGroup || '').trim() || String(person.telefon || '').trim();
}

async function hantarTelegram(mesej) {
  const { tgBot, tgChat, tgTopic } = hlConfig;
  if (!tgBot || !tgChat) throw new Error('Telegram config belum lengkap');
  const body = { chat_id: tgChat, text: mesej, parse_mode: 'Markdown' };
  if (tgTopic) body.message_thread_id = parseInt(tgTopic);
  const res = await fetch('https://api.telegram.org/bot' + tgBot + '/sendMessage', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || 'Telegram error');
  return data;
}

function normalizePhoneFonnte(num) {
  let clean = String(num || '').replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '60' + clean.substring(1);
  } else if (clean.startsWith('1')) {
    clean = '60' + clean;
  }
  return clean;
}

function normalizeFonnteTargetPart(part) {
  var raw = String(part || '').trim();
  if (!raw) return '';
  var variableParts = raw.split('|');
  var destination = String(variableParts[0] || '').trim();
  if (/@g\.us$/i.test(destination)) return raw;
  variableParts[0] = normalizePhoneFonnte(destination);
  return variableParts.filter(function(value) { return String(value || '').trim() !== ''; }).join('|');
}

function normalizeFonnteTarget(target) {
  return String(target || '')
    .split(',')
    .map(normalizeFonnteTargetPart)
    .filter(Boolean)
    .join(',');
}

async function getFonnteRuntimeToken() {
  var token = String(hlConfig.fonnteToken || '').trim();
  if (token) return token;
  await loadBackendOperationalConfig(true);
  token = String(hlConfig.fonnteToken || '').trim();
  if (token) return token;
  throw new Error('Token Fonnte belum dikonfigurasi. Sila simpan FONNTE_TOKEN dalam modul Konfigurasi.');
}

async function callFonnte(target, mesej) {
  const token = await getFonnteRuntimeToken();
  if (!target) throw new Error('Tiada nombor atau ID sasaran Fonnte.');
  const cleanTarget = normalizeFonnteTarget(target);
  const res = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: { 'Authorization': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ target: cleanTarget, message: mesej, countryCode: "0" })
  });
  const data = await res.json();
  if (!data.status) throw new Error(data.reason || data.detail || 'Fonnte error');
  return data;
}

async function callFonnteFile(target, caption, blob, filename) {
  const token = await getFonnteRuntimeToken();
  if (!target) throw new Error('Tiada nombor atau ID sasaran Fonnte.');
  const cleanTarget = normalizeFonnteTarget(target);
  const form = new FormData();
  form.append('target', cleanTarget);
  if (caption) form.append('message', caption);
  form.append('file', blob, filename || 'surat_amaran.jpg');
  form.append('countryCode', '0');
  const res = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: { 'Authorization': token },
    body: form
  });
  const data = await res.json();
  if (!data.status) throw new Error(data.reason || data.detail || 'Fonnte error');
  return data;
}

async function uploadLetterToWorker(blob, filename) {
  if (!APP.workerUrl) throw new Error('Worker URL belum disimpan.');
  const base64 = await new Promise(function(resolve, reject) {
    const reader = new FileReader();
    reader.onload = function() { resolve(reader.result.split(',')[1]); };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  const url = APP.workerUrl.replace(/\/+$/, '') + '/api';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'storeLetterFile', data: base64, mimeType: blob.type || 'image/jpeg', filename: filename || 'SuratAmaran.jpg' })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Gagal simpan fail ke Worker');
  if (!data.url || !/^https?:\/\//i.test(String(data.url))) {
    throw new Error('Worker tidak memulangkan URL fail surat yang sah.');
  }
  return data.url;
}

async function callFonnteUrl(target, caption, fileUrl, filename) {
  const token = await getFonnteRuntimeToken();
  if (!target) throw new Error('Tiada nombor atau ID sasaran Fonnte.');
  if (!fileUrl || !/^https?:\/\//i.test(String(fileUrl))) throw new Error('URL fail surat tidak sah.');
  const cleanTarget = normalizeFonnteTarget(target);
  const form = new FormData();
  form.append('target', cleanTarget);
  form.append('url', fileUrl);
  form.append('filename', filename || 'SuratAmaran.jpg');
  if (caption) form.append('message', caption);
  form.append('countryCode', '0');
  const res = await fetch('https://api.fonnte.com/send', {
    method: 'POST',
    headers: { 'Authorization': token },
    body: form
  });
  const data = await res.json();
  console.log('[Fonnte URL] respons:', JSON.stringify(data));
  if (!data.status) throw new Error(data.reason || data.detail || 'Fonnte error');
  return data;
}

async function sendFonnteMediaOnly(target, blob, filename) {
  var errors = [];
  try {
    var directResp = await callFonnteFile(target, '', blob, filename);
    return { status: true, method: 'Direct Upload', response: directResp };
  } catch (err) {
    errors.push('Direct Upload: ' + (err && err.message ? err.message : err));
  }

  try {
    var fileUrl = await uploadLetterToWorker(blob, filename);
    console.log('[Surat Amaran] URL fail:', fileUrl);
    var urlResp = await callFonnteUrl(target, '', fileUrl, filename);
    return { status: true, method: 'Worker URL', url: fileUrl, response: urlResp };
  } catch (err) {
    errors.push('Worker URL: ' + (err && err.message ? err.message : err));
  }

  throw new Error('Gagal hantar lampiran media Fonnte. ' + errors.join(' | '));
}

async function sendFonnteLetterLink(target, caption, blob, filename) {
  var fileUrl = await uploadLetterToWorker(blob, filename);
  var message = String(caption || '').trim();
  message += '\n\n📎 Pautan surat rasmi:\n' + fileUrl;
  message += '\n\nSila buka pautan di atas untuk melihat atau memuat turun surat rasmi. Hubungi pihak sekolah sekiranya pautan tidak dapat dibuka.';
  var response = await callFonnte(target, message);
  return { status: true, method: 'Text Link', url: fileUrl, response: response };
}

function loadHtml2Pdf() {
  return new Promise(function(resolve, reject) {
    if (window.html2pdf) { resolve(window.html2pdf); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.onload = function() { resolve(window.html2pdf); };
    script.onerror = function() { reject(new Error('Gagal muatkan pustaka html2pdf.js.')); };
    document.head.appendChild(script);
  });
}

async function janaPDFSuratAmaran(nama, kelas, telefon, tahap, jumlahHari, hariKonsekutif) {
  const html2pdfLib = await loadHtml2Pdf();
  await muatLogoSuratAmaran();
  const cfg = await getAmaranSekolahConfigAsync();
  const fullHtml = janaHtmlSuratAmaran(nama, kelas, telefon, tahap, jumlahHari, hariKonsekutif || 0, { noPrint: true, config: cfg }, { kpm: _amaranLogoKPM, sekolah: _amaranLogoSekolah, cop: _amaranCopSekolah });

  // Extract CSS and body — inject directly into main document to avoid iframe cross-origin issues
  const cssMatch = fullHtml.match(/<style>([\s\S]*?)<\/style>/i);
  const bodyMatch = fullHtml.match(/<body>([\s\S]*?)<\/body>/i);
  const cssContent = cssMatch ? cssMatch[1] : '';
  const bodyContent = bodyMatch ? bodyMatch[1] : '';

  const styleEl = document.createElement('style');
  styleEl.textContent = cssContent;
  document.head.appendChild(styleEl);

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:absolute;left:-9999px;top:0;width:210mm;background:#fff;overflow:visible;';
  wrapper.innerHTML = bodyContent;
  document.body.appendChild(wrapper);

  // Small delay so layout is computed before html2canvas captures
  await new Promise(function(r) { setTimeout(r, 200); });

  const paperEl = wrapper.querySelector('.paper') || wrapper.firstElementChild || wrapper;
  try {
    const blob = await html2pdfLib().set({
      margin: 0,
      filename: 'SuratAmaran_' + nama.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf',
      image: { type: 'jpeg', quality: 0.97 },
      html2canvas: { scale: 2, useCORS: true, allowTaint: true, logging: false, backgroundColor: '#ffffff', scrollX: 0, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(paperEl).outputPdf('blob');
    console.log('[PDF] Blob saiz:', blob && blob.size, 'bytes, jenis:', blob && blob.type);
    if (!blob || blob.size < 1000) throw new Error('PDF terlalu kecil atau kosong (' + (blob ? blob.size : 0) + ' bytes) — rendering gagal');
    return blob;
  } finally {
    if (styleEl.parentNode) document.head.removeChild(styleEl);
    if (wrapper.parentNode) document.body.removeChild(wrapper);
  }
}

// Generate letter as JPEG image — more reliable for WhatsApp group delivery than PDF documents
async function janaImejSuratAmaran(nama, kelas, telefon, tahap, jumlahHari, hariKonsekutif) {
  await muatLogoSuratAmaran();
  const cfg = await getAmaranSekolahConfigAsync();
  const fullHtml = janaHtmlSuratAmaran(nama, kelas, telefon, tahap, jumlahHari, hariKonsekutif || 0, { noPrint: true, config: cfg }, { kpm: _amaranLogoKPM, sekolah: _amaranLogoSekolah, cop: _amaranCopSekolah });
  const cssMatch = fullHtml.match(/<style>([\s\S]*?)<\/style>/i);
  const bodyMatch = fullHtml.match(/<body>([\s\S]*?)<\/body>/i);
  const styleEl = document.createElement('style');
  styleEl.textContent = cssMatch ? cssMatch[1] : '';
  document.head.appendChild(styleEl);
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:absolute;left:-9999px;top:0;width:794px;background:#fff;overflow:visible;';
  wrapper.innerHTML = bodyMatch ? bodyMatch[1] : fullHtml;
  document.body.appendChild(wrapper);
  await new Promise(function(r) { setTimeout(r, 300); });
  const paperEl = wrapper.querySelector('.paper') || wrapper.firstElementChild || wrapper;
  try {
    const html2canvasLib = (window.html2canvas) ? window.html2canvas : await (function() {
      return new Promise(function(resolve, reject) {
        if (window.html2canvas) { resolve(window.html2canvas); return; }
        // html2pdf bundles html2canvas — load it first if needed
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
        s.onload = function() { resolve(window.html2canvas); };
        s.onerror = function() { reject(new Error('Gagal muatkan html2canvas.')); };
        document.head.appendChild(s);
      });
    })();
    // Tunggu render & logo (biasanya 800ms lebih selamat untuk logo & font)
    await new Promise(r => setTimeout(r, 800));

    const paperEl = wrapper.querySelector('.paper') || wrapper.firstElementChild || wrapper;
    const canvas = await html2canvasLib(paperEl, {
      scale: 2.0, // Tingkatkan kualiti
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: 0
    });

    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.92));
    if (!blob || blob.size < 5000) throw new Error('Imej dijana tidak sah atau terlalu kecil.');
    console.log('[IMEJ] Saiz:', blob.size, 'bytes');
    return blob;
  } finally {
    if (styleEl.parentNode) document.head.removeChild(styleEl);
    if (wrapper.parentNode) document.body.removeChild(wrapper);
  }
}

async function hantarPDFSuratAmaran(nama, kelas, telefon, tahap, jumlahHari, hariKonsekutif) {
  if (!telefon) { showToast('Tiada nombor telefon wali untuk ' + nama, 'error'); return; }
  var cfg = await getAmaranSekolahConfigAsync();
  var tarikh = new Date().toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' });
  var info = TAHAP_AMARAN_INFO[tahap] || TAHAP_AMARAN_INFO[1];
  var m = { nama: nama, kelas: kelas, tahap: tahap, jumlahHari: jumlahHari, hariKonsekutif: hariKonsekutif || 0, tahapInfo: info };
  var caption = janaCaptionMediaSuratAmaran(m, cfg, tarikh);
  var filename = 'SuratAmaran_' + info.label.replace(/\s+/g, '') + '_' + nama.replace(/[^a-zA-Z0-9]/g, '_') + '.jpg';
  
  try {
    showToast('Menjana imej surat...', 'info');
    var blob = await janaImejSuratAmaran(nama, kelas, telefon, tahap, jumlahHari, hariKonsekutif);
    showToast('Muat naik surat dan hantar pautan WhatsApp...', 'info');
    var linkResult = await sendFonnteLetterLink(telefon, caption, blob, filename);
    showToast(info.label + ' berjaya dihantar sebagai pautan surat.', 'success');
    logNotif(info.label + ' WA', telefon, caption + '\n\nPautan: ' + linkResult.url, 'Berjaya');
  } catch(e) {
    console.error('Attendance Letter Error:', e);
    showToast('Ralat: ' + e.message, 'error');
  }
}

async function hantarPDFDariModal() {
  const modal = document.getElementById('modalPratinjauSuratAmaran');
  if (!modal) return;
  const { nama, kelas, telefon, tahap, jumlahHari, hariKonsekutif } = modal.dataset;
  if (!telefon) { showToast('Tiada nombor telefon wali dalam rekod ini.', 'error'); return; }
  await hantarPDFSuratAmaran(nama, kelas, telefon, parseInt(tahap), parseInt(jumlahHari), parseInt(hariKonsekutif));
}

async function testTelegram() {
  try {
    const mesej = '🧪 *Test dari Smart School Hub v2.0*\n\nSambungan Telegram berjaya! ✅';
    await sendTelegramLogged('Test Telegram', 'Telegram Admin', mesej);
    showToast('Test Telegram berjaya!', 'success');
  }
  catch(e) { showToast('Telegram gagal: ' + e.message, 'error'); }
}

async function testFonnte() {
  var target = String(hlConfig.fonnteTestGroup || '120363423994004887@g.us').trim(); // Test Group
  try {
    const mesej = '🧪 *Test dari Smart School Hub v2.0*\n\nSambungan Fonnte berjaya dihantar ke Test Group! ✅';
    await callFonnte(target, mesej);
    showToast('Test Fonnte berjaya dihantar ke Test Group!', 'success');
  } catch(e) {
    showToast('Fonnte gagal: ' + e.message, 'error');
  }
}

// ── LAPORAN OPR ────────────────────────────────────────────────
async function janaOPR(field) {
  const nama = (document.getElementById('opr-nama').value || '').trim();
  const anjuran = (document.getElementById('opr-anjuran').value || '').trim();
  const peserta = (document.getElementById('opr-peserta').value || '').trim();
  const tempat = (document.getElementById('opr-tempat').value || '').trim();
  if (!nama) { showToast('Sila isi Nama Program dahulu.', 'error'); return; }
  if (!APP.workerUrl) { showToast('Worker URL diperlukan untuk ciri AI.', 'error'); return; }
  const statusBox = document.getElementById('oprAIStatus');
  if (statusBox) { statusBox.style.display = 'block'; statusBox.textContent = '✨ Jana AI untuk "' + field + '"...'; }
  const textarea = document.getElementById('opr-' + field);
  if (textarea) { textarea.placeholder = '✨ AI sedang menjana...'; textarea.value = ''; }
  const konteks = 'Nama Program: ' + nama + '\nAnjuran: ' + (anjuran || '-') + '\nPeserta: ' + (peserta || '-') + '\nTempat: ' + (tempat || '-');
  const prompts = {
    objektif: 'Tulis maksimum 3 objektif program "' + nama + '" dalam Bahasa Malaysia formal untuk laporan OPR sekolah. Konteks: ' + konteks + '. Format bernombor ringkas. Terus tulis objektif sahaja.',
    aktiviti: 'Tulis maksimum 3 perkara utama bagi aktiviti yang dijalankan untuk program "' + nama + '" dalam Bahasa Malaysia formal. Konteks: ' + konteks + '. Format bernombor ringkas, bukan paragraf panjang. Terus tulis aktiviti sahaja.',
    kekuatan: 'Tulis maksimum 3 kekuatan program "' + nama + '" dalam Bahasa Malaysia formal. Konteks: ' + konteks + '. Format bernombor ringkas.',
    kelemahan: 'Tulis maksimum 3 kelemahan atau cadangan penambahbaikan untuk program "' + nama + '" dalam Bahasa Malaysia formal. Konteks: ' + konteks + '. Format bernombor ringkas.'
  };
  try {
    const data = await callWorkerAI(prompts[field], 'opr');
    if (data.success && data.content) {
      if (textarea) textarea.value = data.content.trim();
      if (statusBox) statusBox.textContent = '✅ Kandungan AI berjaya dijana.';
      showToast('AI selesai menjana ' + field + '.', 'success');
    } else throw new Error(data.error || 'Respons AI tidak sah');
  } catch(e) {
    if (statusBox) statusBox.textContent = '❌ AI gagal: ' + e.message;
    showToast('AI gagal: ' + e.message, 'error');
    if (textarea) textarea.placeholder = 'Taip manual atau cuba AI semula...';
  }
}

async function janaSemuaOPR() {
  const fields = ['objektif', 'aktiviti', 'kekuatan', 'kelemahan'];
  for (const f of fields) { await janaOPR(f); await sleep(600); }
}

function cetakOPR() {
  const get = function(id) { const el = document.getElementById(id); return el ? el.value : ''; };
  const nama = get('opr-nama');
  if (!nama) { showToast('Sila isi Nama Program dahulu.', 'error'); return; }
  const tarikh = get('opr-tarikh');
  const tarikhDate = tarikh ? parseLocalDateYMD(tarikh) : null;
  const tarikhFmt = tarikhDate ? tarikhDate.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const win = window.open('', '_blank');
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Laporan OPR - ' + nama + '</title><style>body{font-family:Arial,sans-serif;font-size:12pt;margin:2cm;color:#000}h1{font-size:14pt;text-align:center;text-transform:uppercase;margin-bottom:4px}h2{font-size:13pt;text-align:center;margin-bottom:20px}.header{text-align:center;margin-bottom:24px;border-bottom:2px solid #000;padding-bottom:14px}table{width:100%;border-collapse:collapse;margin-bottom:16px}td{padding:6px 10px;border:1px solid #999;vertical-align:top}td:first-child{width:35%;font-weight:bold;background:#f5f5f5}.section{margin:16px 0}.section h3{font-size:12pt;border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:8px}.section p{white-space:pre-wrap;line-height:1.7}.sign-row{display:flex;justify-content:space-between;margin-top:40px}.sign-box{text-align:center;width:40%}.sign-line{border-top:1px solid #000;margin-top:50px;padding-top:6px}@media print{body{margin:1.5cm}}</style></head><body><div class="header"><h1>' + get('opr-institusi') + '</h1><div style="font-size:11pt">' + get('opr-alamat') + '</div><h2 style="margin-top:16px">LAPORAN ONE PAGE REPORT (OPR)</h2></div><table><tr><td>Nama Program / Aktiviti</td><td>' + nama + '</td></tr><tr><td>Anjuran</td><td>' + (get('opr-anjuran') || '—') + '</td></tr><tr><td>Tarikh</td><td>' + tarikhFmt + '</td></tr><tr><td>Tempat</td><td>' + (get('opr-tempat') || '—') + '</td></tr><tr><td>Bilangan Peserta</td><td>' + (get('opr-peserta') || '—') + '</td></tr></table>' + (get('opr-objektif') ? '<div class="section"><h3>1. Objektif</h3><p>' + get('opr-objektif') + '</p></div>' : '') + (get('opr-aktiviti') ? '<div class="section"><h3>2. Aktiviti yang Dijalankan</h3><p>' + get('opr-aktiviti') + '</p></div>' : '') + (get('opr-kekuatan') ? '<div class="section"><h3>3. Kekuatan / Kejayaan</h3><p>' + get('opr-kekuatan') + '</p></div>' : '') + (get('opr-kelemahan') ? '<div class="section"><h3>4. Kelemahan / Cadangan</h3><p>' + get('opr-kelemahan') + '</p></div>' : '') + '<div class="sign-row"><div class="sign-box"><div class="sign-line"><strong>' + (get('opr-penyedia') || '( ........................... )') + '</strong><br><span style="font-size:10pt">' + (get('opr-jawatan') || 'Penyedia Laporan') + '</span></div></div><div class="sign-box"><div class="sign-line"><strong>' + (get('opr-gb') || '( ........................... )') + '</strong><br><span style="font-size:10pt">' + (get('opr-gb-jawatan') || 'Guru Besar') + '</span></div></div></div><script>window.onload=function(){window.print();};<\/script></body></html>');
  win.document.close();
}

function openOPRImagePicker(inputId, targetIndex) {
  const input = document.getElementById(inputId);
  _oprImageTargetIndex = Number.isInteger(targetIndex) ? targetIndex : -1;
  if (input) input.click();
}

function readFileAsDataUrl(file) {
  return new Promise(function(resolve, reject) {
    const reader = new FileReader();
    reader.onload = function() { resolve(String(reader.result || '')); };
    reader.onerror = function() { reject(new Error('Gagal membaca fail gambar.')); };
    reader.readAsDataURL(file);
  });
}

function resizeOPRImageDataUrl(dataUrl) {
  return new Promise(function(resolve) {
    const img = new Image();
    img.onload = function() {
      const maxWidth = 1400;
      const maxHeight = 1050;
      const ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
      const width = Math.max(1, Math.round(img.width * ratio));
      const height = Math.max(1, Math.round(img.height * ratio));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.86));
    };
    img.onerror = function() {
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
}

async function normalizeOPRImageFile(file, slotNumber) {
  const rawDataUrl = await readFileAsDataUrl(file);
  const resizedDataUrl = await resizeOPRImageDataUrl(rawDataUrl);
  return {
    id: 'opr-img-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    name: file && file.name ? file.name : ('Gambar ' + slotNumber),
    src: resizedDataUrl
  };
}

async function handleOPRImageSelection(event, source) {
  const input = event && event.target;
  const files = Array.from((input && input.files) || []).filter(function(file) {
    return file && /^image\//i.test(String(file.type || ''));
  });
  if (!files.length) {
    _oprImageTargetIndex = -1;
    return;
  }

  try {
    if (_oprImageTargetIndex >= 0 && _oprImageTargetIndex < OPR_IMAGE_MAX_COUNT) {
      const replacement = await normalizeOPRImageFile(files[0], _oprImageTargetIndex + 1);
      const nextImages = _oprImageItems.slice();
      nextImages[_oprImageTargetIndex] = replacement;
      _oprImageItems = nextImages.slice(0, OPR_IMAGE_MAX_COUNT);
      renderOPRImageGrid();
      showToast((source === 'camera' ? 'Gambar kamera' : 'Gambar') + ' berjaya dikemas kini.', 'success');
      return;
    }

    const availableSlots = OPR_IMAGE_MAX_COUNT - _oprImageItems.length;
    if (availableSlots <= 0) {
      showToast('Enam gambar sudah dipilih. Guna butang Tukar pada slot gambar untuk ganti.', 'info');
      return;
    }

    const selectedFiles = files.slice(0, availableSlots);
    const preparedImages = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      preparedImages.push(await normalizeOPRImageFile(selectedFiles[i], _oprImageItems.length + i + 1));
    }
    _oprImageItems = _oprImageItems.concat(preparedImages).slice(0, OPR_IMAGE_MAX_COUNT);
    renderOPRImageGrid();
    if (files.length > availableSlots) {
      showToast('Hanya 6 gambar pertama digunakan supaya cetakan OPR kekal satu muka surat.', 'info');
    }
    showToast((source === 'camera' ? 'Gambar kamera' : 'Gambar') + ' berjaya ditambah.', 'success');
  } catch (err) {
    showToast('Gagal memproses gambar: ' + err.message, 'error');
  } finally {
    _oprImageTargetIndex = -1;
    if (input) input.value = '';
  }
}

function removeOPRImage(imageId) {
  const nextImages = _oprImageItems.filter(function(item) { return item.id !== imageId; });
  if (nextImages.length === _oprImageItems.length) return;
  _oprImageItems = nextImages;
  renderOPRImageGrid();
  showToast('Gambar OPR dibuang.', 'info');
}

function renderOPRImageGrid() {
  const grid = document.getElementById('oprImageGrid');
  const status = document.getElementById('oprImageStatus');
  if (status) {
    status.textContent = _oprImageItems.length + ' / ' + OPR_IMAGE_MAX_COUNT + ' gambar dipilih. Minimum 6 gambar diperlukan untuk cetakan OPR satu muka surat.';
  }
  if (!grid) return;

  const slots = [];
  for (let index = 0; index < OPR_IMAGE_MAX_COUNT; index++) {
    const item = _oprImageItems[index];
    if (item) {
      slots.push(
        '<figure class="opr-image-slot">' +
          '<img class="opr-image-preview" src="' + item.src + '" alt="' + escapeHtml(item.name || ('Gambar ' + (index + 1))) + '">' +
          '<figcaption class="opr-image-caption">' +
            '<div class="opr-image-meta">' +
              '<strong>Gambar ' + (index + 1) + '</strong>' +
              '<span>Ketik Tukar atau Kamera untuk kemas kini slot ini</span>' +
            '</div>' +
            '<div class="opr-image-card-actions">' +
              '<button class="opr-image-action-btn" type="button" onclick="openOPRImagePicker(\'oprImageUploadInput\', ' + index + ')">Tukar</button>' +
              '<button class="opr-image-action-btn opr-image-action-btn-camera" type="button" onclick="openOPRImagePicker(\'oprCameraInput\', ' + index + ')">Kamera</button>' +
              '<button class="opr-image-remove" type="button" onclick="removeOPRImage(\'' + item.id + '\')">Buang</button>' +
            '</div>' +
          '</figcaption>' +
        '</figure>'
      );
    } else {
      slots.push(
        '<button class="opr-image-slot is-empty opr-image-slot-button" type="button" onclick="openOPRImagePicker(\'oprImageUploadInput\', ' + index + ')">' +
          '<div class="opr-image-placeholder">' +
            '<strong>Slot ' + (index + 1) + '</strong>' +
            '<span>Tekan untuk tambah gambar program</span>' +
            '<div class="opr-image-actions">' +
              '<span class="opr-slot-btn">Galeri</span>' +
              '<span class="opr-slot-btn opr-slot-btn-camera" onclick="event.stopPropagation();openOPRImagePicker(\'oprCameraInput\', ' + index + ')">Kamera</span>' +
            '</div>' +
          '</div>' +
        '</button>'
      );
    }
  }
  grid.innerHTML = slots.join('');
}

function compactOPRPrintText(value) {
  const text = String(value || '')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (!text) return '';
  return text;
}

function formatOPRPrintText(value) {
  const text = compactOPRPrintText(value);
  if (!text) {
    return '<span class="opr-print-empty">Belum diisi.</span>';
  }
  return escapeHtml(text).replace(/\n/g, '<br>');
}

function buildOPRPrintSection(title, value, extraClass) {
  return '<section class="opr-print-section' + (extraClass ? (' ' + extraClass) : '') + '">' +
    '<h3>' + escapeHtml(title) + '</h3>' +
    '<div class="opr-print-section-body">' + formatOPRPrintText(value) + '</div>' +
  '</section>';
}

function buildOPRPrintPhotoGrid(items) {
  return items.map(function(item, index) {
    return '<figure class="opr-print-photo">' +
      '<img src="' + item.src + '" alt="' + escapeHtml(item.name || ('Gambar ' + (index + 1))) + '">' +
      '<figcaption>Gambar ' + (index + 1) + '</figcaption>' +
    '</figure>';
  }).join('');
}

cetakOPR = function() {
  const get = function(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  };
  const nama = get('opr-nama');
  if (!nama) {
    showToast('Sila isi Nama Program dahulu.', 'error');
    return;
  }
  if (_oprImageItems.length < OPR_IMAGE_MIN_COUNT) {
    showToast('Sila tambah sekurang-kurangnya 6 gambar sebelum cetak OPR.', 'error');
    return;
  }
  const tarikh = get('opr-tarikh');
  const tarikhDate = tarikh ? parseLocalDateYMD(tarikh) : null;
  const tarikhFmt = tarikhDate ? tarikhDate.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const logoUrl = new URL('assets/sk-kiandongo-logo.png', window.location.href).href;
  const photos = _oprImageItems.slice(0, OPR_IMAGE_MAX_COUNT);
  const win = window.open('', '_blank');
  if (!win) {
    showToast('Popup cetakan disekat oleh pelayar. Benarkan popup dan cuba semula.', 'error');
    return;
  }

  win.document.write(`<!DOCTYPE html>
  <html lang="ms">
  <head>
    <meta charset="UTF-8">
    <title>Laporan OPR - ${escapeHtml(nama)}</title>
    <style>
      @page { size: A4 portrait; margin: 8mm; }
      :root {
        --navy: #10243e;
        --blue: #1d4fa3;
        --line: #d8e2f0;
        --text: #10243e;
        --muted: #5d6f85;
      }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        background: #edf4ff;
        color: var(--text);
        font-family: "Plus Jakarta Sans", Arial, sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body { font-size: 10px; }
      .opr-sheet {
        width: 194mm;
        min-height: 279mm;
        margin: 0 auto;
        padding: 9mm;
        background: #ffffff;
        border: 1px solid var(--line);
        border-radius: 18px;
        display: grid;
        grid-template-rows: auto auto 1fr auto;
        gap: 6mm;
        overflow: hidden;
      }
      .opr-header {
        display: grid;
        grid-template-columns: 18mm 1fr;
        gap: 5mm;
        align-items: center;
        padding-bottom: 4mm;
        border-bottom: 1px solid var(--line);
      }
      .opr-logo {
        width: 18mm;
        height: 18mm;
        object-fit: contain;
        border-radius: 50%;
        background: #fff;
      }
      .opr-title h1 {
        margin: 0;
        font-size: 15px;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: var(--navy);
      }
      .opr-title p {
        margin: 3px 0 0;
        font-size: 9.5px;
        color: var(--muted);
      }
      .opr-title .opr-subtitle {
        margin-top: 6px;
        display: inline-flex;
        padding: 4px 10px;
        border-radius: 999px;
        background: linear-gradient(135deg, rgba(245,197,24,0.18), rgba(29,79,163,0.08));
        color: var(--blue);
        font-size: 8.6px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .opr-meta-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 3mm;
      }
      .opr-meta-card {
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 3.2mm;
        background: linear-gradient(180deg, #ffffff, #f8fbff);
      }
      .opr-meta-card small {
        display: block;
        margin-bottom: 4px;
        font-size: 8px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--muted);
      }
      .opr-meta-card strong {
        display: block;
        font-size: 9.4px;
        line-height: 1.45;
        color: var(--navy);
      }
      .opr-main {
        display: grid;
        grid-template-columns: 1.1fr 0.9fr;
        gap: 5mm;
        min-height: 0;
      }
      .opr-copy-grid {
        display: grid;
        gap: 3.2mm;
        align-content: start;
      }
      .opr-print-section {
        border: 1px solid var(--line);
        border-radius: 14px;
        background: #fcfdff;
        padding: 3.2mm 3.4mm;
        min-height: 0;
      }
      .opr-print-section h3 {
        margin: 0 0 5px;
        font-size: 9px;
        color: var(--blue);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .opr-print-section-body {
        font-size: 8.9px;
        line-height: 1.5;
        white-space: pre-wrap;
        overflow: hidden;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 7;
      }
      .opr-print-empty {
        color: var(--muted);
        font-style: italic;
      }
      .opr-gallery-card {
        border: 1px solid var(--line);
        border-radius: 14px;
        background: linear-gradient(180deg, #ffffff, #f5f9ff);
        padding: 3.2mm;
        display: grid;
        gap: 3mm;
      }
      .opr-gallery-card h3 {
        margin: 0;
        font-size: 9px;
        color: var(--blue);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .opr-gallery-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 3mm;
      }
      .opr-print-photo {
        margin: 0;
        display: grid;
        gap: 4px;
      }
      .opr-print-photo img {
        width: 100%;
        height: 25mm;
        object-fit: cover;
        border-radius: 12px;
        border: 1px solid rgba(16, 36, 62, 0.10);
        background: #dbe7f7;
      }
      .opr-print-photo figcaption {
        font-size: 8.1px;
        font-weight: 700;
        text-align: center;
        color: var(--muted);
      }
      .opr-sign-row {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6mm;
        align-items: end;
      }
      .opr-sign-box {
        border-top: 1.5px solid #19355e;
        padding-top: 3mm;
        min-height: 18mm;
        text-align: center;
      }
      .opr-sign-box strong {
        display: block;
        font-size: 9.4px;
        color: var(--navy);
      }
      .opr-sign-box span {
        display: block;
        margin-top: 4px;
        font-size: 8.2px;
        color: var(--muted);
      }
      .opr-footer-note {
        margin-top: 2mm;
        font-size: 7.8px;
        text-align: right;
        color: var(--muted);
      }
      @media print {
        body { background: #fff; }
        .opr-sheet {
          width: auto;
          min-height: auto;
          border: none;
          border-radius: 0;
          padding: 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="opr-sheet">
      <div class="opr-header">
        <img class="opr-logo" src="${logoUrl}" alt="Logo ${escapeHtml(get('opr-institusi') || 'Sekolah')}">
        <div class="opr-title">
          <h1>${escapeHtml(get('opr-institusi') || 'Sekolah')}</h1>
          <p>${escapeHtml(get('opr-alamat') || 'Alamat sekolah')}</p>
          <span class="opr-subtitle">One Page Report (OPR)</span>
        </div>
      </div>
      <div class="opr-meta-grid">
        <div class="opr-meta-card"><small>Program</small><strong>${escapeHtml(nama)}</strong></div>
        <div class="opr-meta-card"><small>Anjuran</small><strong>${escapeHtml(get('opr-anjuran') || '—')}</strong></div>
        <div class="opr-meta-card"><small>Tarikh</small><strong>${escapeHtml(tarikhFmt)}</strong></div>
        <div class="opr-meta-card"><small>Tempat</small><strong>${escapeHtml(get('opr-tempat') || '—')}</strong></div>
        <div class="opr-meta-card"><small>Peserta</small><strong>${escapeHtml(get('opr-peserta') || '—')}</strong></div>
      </div>
      <div class="opr-main">
        <div class="opr-copy-grid">
          ${buildOPRPrintSection('Objektif', get('opr-objektif'))}
          ${buildOPRPrintSection('Aktiviti yang Dijalankan', get('opr-aktiviti'))}
          ${buildOPRPrintSection('Kekuatan / Kejayaan', get('opr-kekuatan'))}
          ${buildOPRPrintSection('Kelemahan / Cadangan', get('opr-kelemahan'))}
        </div>
        <div class="opr-gallery-card">
          <h3>Dokumentasi Program</h3>
          <div class="opr-gallery-grid">
            ${buildOPRPrintPhotoGrid(photos)}
          </div>
        </div>
      </div>
      <div>
        <div class="opr-sign-row">
          <div class="opr-sign-box">
            <strong>${escapeHtml(get('opr-penyedia') || '( ........................... )')}</strong>
            <span>${escapeHtml(get('opr-jawatan') || 'Penyedia Laporan')}</span>
          </div>
          <div class="opr-sign-box">
            <strong>${escapeHtml(get('opr-gb') || '( ........................... )')}</strong>
            <span>${escapeHtml(get('opr-gb-jawatan') || 'Guru Besar')}</span>
          </div>
        </div>
        <div class="opr-footer-note">Laporan ini dijana melalui Smart School Hub dalam format satu muka surat.</div>
      </div>
    </div>
    <script>window.onload=function(){window.print();};<\/script>
  </body>
  </html>`);
  win.document.close();
};

cetakOPR = function() {
  const get = function(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  };
  const nama = get('opr-nama');
  if (!nama) {
    showToast('Sila isi Nama Program dahulu.', 'error');
    return;
  }
  if (_oprImageItems.length < OPR_IMAGE_MIN_COUNT) {
    showToast('Sila tambah sekurang-kurangnya 6 gambar sebelum cetak OPR.', 'error');
    return;
  }

  const tarikh = get('opr-tarikh');
  const tarikhDate = tarikh ? parseLocalDateYMD(tarikh) : null;
  const tarikhFmt = tarikhDate ? tarikhDate.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const logoUrl = new URL('assets/sk-kiandongo-logo.png', window.location.href).href;
  const photos = _oprImageItems.slice(0, OPR_IMAGE_MAX_COUNT);
  const win = window.open('', '_blank');
  if (!win) {
    showToast('Popup cetakan disekat oleh pelayar. Benarkan popup dan cuba semula.', 'error');
    return;
  }

  win.document.write(`<!DOCTYPE html>
  <html lang="ms">
  <head>
    <meta charset="UTF-8">
    <title>Laporan OPR - ${escapeHtml(nama)}</title>
    <style>
      @page { size: A4 portrait; margin: 6mm; }
      :root {
        --navy: #10243e;
        --blue: #1d4fa3;
        --line: #d9e3f3;
        --text: #10243e;
        --muted: #5d6f85;
        --surface: #f7faff;
      }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        background: #edf4ff;
        color: var(--text);
        font-family: "Plus Jakarta Sans", Arial, sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body { font-size: 9.2px; }
      .opr-sheet {
        width: 197mm;
        min-height: 284mm;
        margin: 0 auto;
        padding: 7mm;
        background: #ffffff;
        border: 1px solid var(--line);
        border-radius: 20px;
        display: grid;
        grid-template-rows: auto auto 1fr auto;
        gap: 4.5mm;
        overflow: hidden;
      }
      .opr-header {
        display: grid;
        grid-template-columns: 17mm 1fr auto;
        gap: 4mm;
        align-items: center;
        padding-bottom: 4mm;
        border-bottom: 1px solid var(--line);
      }
      .opr-logo {
        width: 17mm;
        height: 17mm;
        object-fit: contain;
        border-radius: 50%;
        background: #fff;
      }
      .opr-title { min-width: 0; }
      .opr-title h1 {
        margin: 0;
        font-size: 14px;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: var(--navy);
      }
      .opr-title p {
        margin: 2px 0 0;
        font-size: 8.4px;
        color: var(--muted);
      }
      .opr-title .opr-subtitle {
        margin-top: 4px;
        display: inline-flex;
        padding: 3px 9px;
        border-radius: 999px;
        background: linear-gradient(135deg, rgba(246,199,68,0.22), rgba(29,79,163,0.10));
        color: var(--blue);
        font-size: 7.8px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .opr-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 16mm;
        padding: 4px 10px;
        border-radius: 16px;
        background: linear-gradient(135deg, #14396f, #1d4fa3);
        color: #fff;
        font-size: 7.8px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        text-align: center;
      }
      .opr-meta-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 2.5mm;
      }
      .opr-meta-card {
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 2.8mm;
        min-height: 18mm;
        background: linear-gradient(180deg, #ffffff, var(--surface));
      }
      .opr-meta-card.program { grid-column: span 2; }
      .opr-meta-card.place { grid-column: span 2; }
      .opr-meta-card.participants { grid-column: span 2; }
      .opr-meta-card small {
        display: block;
        margin-bottom: 3px;
        font-size: 7.4px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--muted);
      }
      .opr-meta-card strong {
        display: block;
        font-size: 8.6px;
        line-height: 1.32;
        color: var(--navy);
      }
      .opr-main {
        display: grid;
        grid-template-columns: 1.08fr 0.92fr;
        gap: 4mm;
        min-height: 0;
      }
      .opr-copy-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 2.5mm;
        align-content: start;
      }
      .opr-print-section {
        border: 1px solid var(--line);
        border-radius: 14px;
        background: #fcfdff;
        padding: 2.8mm 3mm;
        min-height: 0;
      }
      .opr-print-section h3 {
        margin: 0 0 4px;
        font-size: 8px;
        color: var(--blue);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .opr-print-section-body {
        font-size: 7.8px;
        line-height: 1.42;
        white-space: pre-wrap;
        overflow: hidden;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 7;
      }
      .opr-print-section.activity .opr-print-section-body {
        -webkit-line-clamp: 8;
      }
      .opr-print-empty {
        color: var(--muted);
        font-style: italic;
      }
      .opr-gallery-card {
        border: 1px solid var(--line);
        border-radius: 14px;
        background: linear-gradient(180deg, #ffffff, #f5f9ff);
        padding: 2.8mm;
        display: grid;
        gap: 2.4mm;
      }
      .opr-gallery-card h3 {
        margin: 0;
        font-size: 8px;
        color: var(--blue);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .opr-gallery-card p {
        margin: 0;
        font-size: 7.2px;
        color: var(--muted);
      }
      .opr-gallery-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 2.5mm;
      }
      .opr-print-photo {
        margin: 0;
        display: grid;
        gap: 3px;
      }
      .opr-print-photo img {
        width: 100%;
        height: 20mm;
        object-fit: cover;
        border-radius: 10px;
        border: 1px solid rgba(16, 36, 62, 0.10);
        background: #dbe7f7;
      }
      .opr-print-photo figcaption {
        font-size: 7.3px;
        font-weight: 700;
        text-align: center;
        color: var(--muted);
      }
      .opr-sign-row {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 4mm;
        align-items: end;
      }
      .opr-sign-box {
        border-top: 1.5px solid #19355e;
        padding-top: 2.5mm;
        min-height: 14mm;
        text-align: center;
      }
      .opr-sign-box strong {
        display: block;
        font-size: 8.5px;
        color: var(--navy);
      }
      .opr-sign-box span {
        display: block;
        margin-top: 3px;
        font-size: 7.4px;
        color: var(--muted);
      }
      .opr-footer-note {
        margin-top: 1.5mm;
        font-size: 6.9px;
        text-align: right;
        color: var(--muted);
      }
      @media print {
        body { background: #fff; }
        .opr-sheet {
          width: auto;
          min-height: auto;
          border: none;
          border-radius: 0;
          padding: 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="opr-sheet">
      <div class="opr-header">
        <img class="opr-logo" src="${logoUrl}" alt="Logo ${escapeHtml(get('opr-institusi') || 'Sekolah')}">
        <div class="opr-title">
          <h1>${escapeHtml(get('opr-institusi') || 'Sekolah')}</h1>
          <p>${escapeHtml(get('opr-alamat') || 'Alamat sekolah')}</p>
          <span class="opr-subtitle">One Page Report (OPR)</span>
        </div>
        <div class="opr-badge">Laporan Ringkas<br>1 Muka Surat</div>
      </div>
      <div class="opr-meta-grid">
        <div class="opr-meta-card program"><small>Program</small><strong>${escapeHtml(nama)}</strong></div>
        <div class="opr-meta-card"><small>Anjuran</small><strong>${escapeHtml(get('opr-anjuran') || '—')}</strong></div>
        <div class="opr-meta-card"><small>Tarikh</small><strong>${escapeHtml(tarikhFmt)}</strong></div>
        <div class="opr-meta-card place"><small>Tempat</small><strong>${escapeHtml(get('opr-tempat') || '—')}</strong></div>
        <div class="opr-meta-card participants"><small>Peserta</small><strong>${escapeHtml(get('opr-peserta') || '—')}</strong></div>
      </div>
      <div class="opr-main">
        <div class="opr-copy-grid">
          ${buildOPRPrintSection('Objektif', get('opr-objektif'), 230)}
          ${buildOPRPrintSection('Aktiviti yang Dijalankan', get('opr-aktiviti'), 300, 'activity')}
          ${buildOPRPrintSection('Kekuatan / Kejayaan', get('opr-kekuatan'), 230)}
          ${buildOPRPrintSection('Kelemahan / Cadangan', get('opr-kelemahan'), 230)}
        </div>
        <div class="opr-gallery-card">
          <h3>Dokumentasi Program</h3>
          <p>Enam foto utama aktiviti untuk rujukan pentadbiran dan eksport PDF.</p>
          <div class="opr-gallery-grid">
            ${buildOPRPrintPhotoGrid(photos)}
          </div>
        </div>
      </div>
      <div>
        <div class="opr-sign-row">
          <div class="opr-sign-box">
            <strong>${escapeHtml(get('opr-penyedia') || '( ........................... )')}</strong>
            <span>${escapeHtml(get('opr-jawatan') || 'Penyedia Laporan')}</span>
          </div>
          <div class="opr-sign-box">
            <strong>${escapeHtml(get('opr-gb') || '( ........................... )')}</strong>
            <span>${escapeHtml(get('opr-gb-jawatan') || 'Guru Besar')}</span>
          </div>
        </div>
        <div class="opr-footer-note">Laporan ini dijana melalui Smart School Hub dalam format satu muka surat.</div>
      </div>
    </div>
    <script>window.onload=function(){window.print();};<\/script>
  </body>
  </html>`);
  win.document.close();
};

cetakOPR = function() {
  const get = function(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
  };
  const nama = get('opr-nama');
  if (!nama) {
    showToast('Sila isi Nama Program dahulu.', 'error');
    return;
  }
  if (_oprImageItems.length < OPR_IMAGE_MIN_COUNT) {
    showToast('Sila tambah sekurang-kurangnya 6 gambar sebelum cetak OPR.', 'error');
    return;
  }

  const tarikh = get('opr-tarikh');
  const tarikhDate = tarikh ? parseLocalDateYMD(tarikh) : null;
  const tarikhFmt = tarikhDate ? tarikhDate.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const logoUrl = new URL('assets/sk-kiandongo-logo.png', window.location.href).href;
  const photos = _oprImageItems.slice(0, OPR_IMAGE_MAX_COUNT);
  const win = window.open('', '_blank');
  if (!win) {
    showToast('Popup cetakan disekat oleh pelayar. Benarkan popup dan cuba semula.', 'error');
    return;
  }

  win.document.write(`<!DOCTYPE html>
  <html lang="ms">
  <head>
    <meta charset="UTF-8">
    <title>Laporan OPR - ${escapeHtml(nama)}</title>
    <style>
      @page { size: A4 portrait; margin: 6mm; }
      :root {
        --navy: #0f172a;
        --blue: #1e40af;
        --blue-light: #3b82f6;
        --line: #e2e8f0;
        --text: #1e293b;
        --muted: #64748b;
        --surface: #f8fafc;
        --accent: #f59e0b;
        --page-h: 285mm;
        --base-font: 9.1px;
        --title-font: 14.5px;
        --meta-font: 8.4px;
        --section-title-font: 8px;
        --section-font: 7.4px;
        --note-font: 7px;
        --photo-h: 40mm;
      }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        background: #edf4ff;
        color: var(--text);
        font-family: "Plus Jakarta Sans", Arial, sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body { font-size: var(--base-font); }
      .opr-sheet {
        width: 197mm;
        height: var(--page-h);
        min-height: var(--page-h);
        margin: 0 auto;
        padding: 5.5mm 6.5mm;
        background: #ffffff;
        background-image: 
          radial-gradient(at 0% 0%, rgba(30, 64, 175, 0.03) 0px, transparent 50%),
          radial-gradient(at 100% 0%, rgba(245, 158, 11, 0.02) 0px, transparent 50%);
        border: 1px solid rgba(30, 64, 175, 0.1);
        border-radius: 18px;
        display: flex;
        flex-direction: column;
        gap: 2.8mm;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(0,0,0,0.05);
        position: relative;
      }
      .opr-sheet::before {
        content: "";
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 86c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm66-3c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm-40-39c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm50 38c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM20 53c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm12-32c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM8 43c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm76-13c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM34 56c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm44 26c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM22 8c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm42 82c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zm-4-48c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM54 2c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z' fill='%231e40af' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E");
        pointer-events: none;
        z-index: 0;
      }
      .opr-header, .opr-meta-grid, .opr-main, .opr-footer {
        position: relative;
        z-index: 1;
      }
      .opr-header {
        display: grid;
        grid-template-columns: 15mm 1fr auto;
        gap: 3.4mm;
        align-items: center;
        padding-bottom: 3.2mm;
        border-bottom: 1px solid var(--line);
      }
      .opr-logo {
        width: 15mm;
        height: 15mm;
        object-fit: contain;
        border-radius: 50%;
        background: #fff;
      }
      .opr-title { min-width: 0; }
      .opr-title h1 {
        margin: 0;
        font-size: var(--title-font);
        letter-spacing: 0.02em;
        text-transform: uppercase;
        color: var(--navy);
      }
      .opr-title p {
        margin: 2px 0 0;
        font-size: 7.2px;
        color: var(--muted);
      }
      .opr-title .opr-subtitle {
        margin-top: 5px;
        display: inline-flex;
        padding: 3px 12px;
        border-radius: 999px;
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(59, 130, 246, 0.1));
        color: var(--blue);
        font-size: 7.2px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        border: 1px solid rgba(30, 64, 175, 0.08);
      }
      .opr-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 14mm;
        padding: 4px 12px;
        border-radius: 14px;
        background: linear-gradient(135deg, #1e3a8a, #3b82f6);
        color: #fff;
        font-size: 7px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        text-align: center;
        box-shadow: 0 4px 10px rgba(30, 64, 175, 0.15);
        border: 1px solid rgba(255,255,255,0.1);
      }
      .opr-meta-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 2mm;
      }
      .opr-meta-card {
        border: 1px solid rgba(30, 64, 175, 0.08);
        border-radius: 10px;
        padding: 2.2mm 2.8mm;
        min-height: 15mm;
        background: linear-gradient(180deg, #ffffff, #f1f5f9);
        box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      }
      .opr-meta-card.program { grid-column: span 2; }
      .opr-meta-card.place { grid-column: span 2; }
      .opr-meta-card.participants { grid-column: span 2; }
      .opr-meta-card small {
        display: block;
        margin-bottom: 2px;
        font-size: 6.6px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--muted);
      }
      .opr-meta-card strong {
        display: block;
        font-size: var(--meta-font);
        line-height: 1.24;
        color: var(--navy);
      }
      .opr-main {
        display: grid;
        grid-template-columns: 0.98fr 1.02fr;
        gap: 3mm;
        min-height: 0;
        align-items: stretch;
        flex: 1 1 auto;
      }
      .opr-copy-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-auto-rows: 1fr;
        gap: 2mm;
        min-height: 0;
      }
      .opr-print-section {
        border: 1px solid rgba(30, 64, 175, 0.08);
        border-radius: 14px;
        background: #ffffff;
        padding: 2.4mm 2.8mm;
        min-height: 0;
        display: grid;
        grid-template-rows: auto 1fr;
        box-shadow: 0 2px 4px rgba(0,0,0,0.01);
      }
      .opr-print-section h3 {
        margin: 0 0 3px;
        font-size: var(--section-title-font);
        color: var(--blue);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .opr-print-section-body {
        font-size: var(--section-font);
        line-height: 1.3;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      .opr-print-empty {
        color: var(--muted);
        font-style: italic;
      }
      .opr-gallery-card {
        border: 1px solid rgba(30, 64, 175, 0.1);
        border-radius: 14px;
        background: linear-gradient(180deg, #ffffff, #f0f7ff);
        padding: 2.8mm;
        display: grid;
        grid-template-rows: auto 1fr;
        gap: 2.4mm;
        min-height: 0;
        box-shadow: 0 2px 6px rgba(0,0,0,0.02);
      }
      .opr-gallery-card h3 {
        margin: 0;
        font-size: var(--section-title-font);
        color: var(--blue);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .opr-gallery-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        align-content: start;
        gap: 2mm;
      }
      .opr-print-photo {
        margin: 0;
        display: grid;
        gap: 2px;
      }
      .opr-print-photo img {
        width: 100%;
        height: var(--photo-h);
        object-fit: contain;
        border-radius: 9px;
        border: 1px solid rgba(16, 36, 62, 0.10);
        background: #f0f4f8;
      }
      .opr-print-photo figcaption {
        font-size: 6.4px;
        font-weight: 700;
        text-align: center;
        color: var(--muted);
      }
      .opr-footer {
        display: grid;
        gap: 1.8mm;
        margin-top: 1mm;
      }
      .opr-sign-row {
        display: grid;
        grid-template-columns: 1fr;
        gap: 3mm;
        margin-top: 1mm;
      }
      .opr-sign-box {
        min-height: 20mm;
        border: 1px solid var(--line);
        border-radius: 12px;
        background: linear-gradient(180deg, #ffffff, #f8fbff);
        padding: 2.4mm 2.6mm;
        display: grid;
        gap: 2mm;
        align-content: space-between;
      }
      .opr-sign-label {
        font-size: 6.5px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--muted);
      }
      .opr-sign-line {
        border-top: 1.4px solid #19355e;
        padding-top: 1.8mm;
        text-align: center;
        width: 2cm;
        margin: 0 auto;
      }
      .opr-sign-box strong {
        display: block;
        font-size: 7.6px;
        color: var(--navy);
      }
      .opr-sign-box span {
        display: block;
        margin-top: 2px;
        font-size: 6.7px;
        color: var(--muted);
      }
      .opr-sign-date {
        margin-top: 3px;
        font-size: 6.3px;
        color: var(--muted);
      }
      .opr-footer-note {
        font-size: var(--note-font);
        text-align: right;
        color: var(--muted);
      }
      @media print {
        body { background: #fff; }
        .opr-sheet {
          width: auto;
          border: none;
          border-radius: 0;
        }
      }
    </style>
  </head>
  <body>
    <div class="opr-sheet" id="oprSheet">
      <div class="opr-header">
        <img class="opr-logo" src="${logoUrl}" alt="Logo ${escapeHtml(get('opr-institusi') || 'Sekolah')}">
        <div class="opr-title">
          <h1>${escapeHtml(get('opr-institusi') || 'Sekolah')}</h1>
          <p>${escapeHtml(get('opr-alamat') || 'Alamat sekolah')}</p>
          <span class="opr-subtitle">One Page Report (OPR)</span>
        </div>
        <div class="opr-badge">Laporan Ringkas<br>1 Muka Surat</div>
      </div>
      <div class="opr-meta-grid">
        <div class="opr-meta-card program"><small>Program</small><strong>${escapeHtml(nama)}</strong></div>
        <div class="opr-meta-card"><small>Anjuran</small><strong>${escapeHtml(get('opr-anjuran') || '—')}</strong></div>
        <div class="opr-meta-card"><small>Tarikh</small><strong>${escapeHtml(tarikhFmt)}</strong></div>
        <div class="opr-meta-card place"><small>Tempat</small><strong>${escapeHtml(get('opr-tempat') || '—')}</strong></div>
        <div class="opr-meta-card participants"><small>Peserta</small><strong>${escapeHtml(get('opr-peserta') || '—')}</strong></div>
      </div>
      <div class="opr-main">
        <div class="opr-copy-grid">
          ${buildOPRPrintSection('Objektif', get('opr-objektif'))}
          ${buildOPRPrintSection('Aktiviti yang Dijalankan', get('opr-aktiviti'), 'activity')}
          ${buildOPRPrintSection('Kekuatan / Kejayaan', get('opr-kekuatan'))}
          ${buildOPRPrintSection('Kelemahan / Cadangan', get('opr-kelemahan'))}
        </div>
        <div class="opr-gallery-card">
          <h3>Gambar Program</h3>
          <div class="opr-gallery-grid">
            ${buildOPRPrintPhotoGrid(photos)}
          </div>
          <div class="opr-sign-row">
            <div class="opr-sign-box">
              <div class="opr-sign-label">Disediakan Oleh</div>
              <div class="opr-sign-line">
                <strong>${escapeHtml(get('opr-penyedia') || '( ........................... )')}</strong>
                <span>${escapeHtml(get('opr-jawatan') || 'Penyedia Laporan')}</span>
                <div class="opr-sign-date">Tarikh: ${escapeHtml(tarikhFmt)}</div>
              </div>
            </div>
            <div class="opr-sign-box">
              <div class="opr-sign-label">Disahkan Oleh</div>
              <div class="opr-sign-line">
                <strong>${escapeHtml(get('opr-gb') || '( ........................... )')}</strong>
                <span>${escapeHtml(get('opr-gb-jawatan') || 'Guru Besar')}</span>
                <div class="opr-sign-date">Tarikh: ${escapeHtml(tarikhFmt)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="opr-footer">
        <div class="opr-footer-note">Laporan ini dijana melalui Smart School Hub dalam format satu muka surat.</div>
      </div>
    </div>
    <script>
      (function() {
        function fitSheet() {
          var root = document.documentElement;
          var sheet = document.getElementById('oprSheet');
          if (!sheet) return;
          var base = 8.9;
          var title = 13;
          var meta = 8.2;
          var sectionTitle = 7.7;
          var section = 7.1;
          var note = 6.7;
          var photo = 40;
          var tries = 0;
          while (sheet.scrollHeight > sheet.clientHeight && tries < 20) {
            base -= 0.16;
            title -= 0.18;
            meta -= 0.16;
            sectionTitle -= 0.12;
            section -= 0.16;
            note -= 0.08;
            photo -= 0.7;
            root.style.setProperty('--base-font', Math.max(base, 6) + 'px');
            root.style.setProperty('--title-font', Math.max(title, 10.5) + 'px');
            root.style.setProperty('--meta-font', Math.max(meta, 6.6) + 'px');
            root.style.setProperty('--section-title-font', Math.max(sectionTitle, 6.1) + 'px');
            root.style.setProperty('--section-font', Math.max(section, 5.7) + 'px');
            root.style.setProperty('--note-font', Math.max(note, 5.5) + 'px');
            root.style.setProperty('--photo-h', Math.max(photo, 25) + 'mm');
            tries++;
          }
        }
        window.onload = function() {
          fitSheet();
          requestAnimationFrame(function() {
            fitSheet();
            setTimeout(function() {
              fitSheet();
              window.print();
            }, 120);
          });
        };
      })();
    <\/script>
  </body>
  </html>`);
  win.document.close();
};

function setKokumStatus(msg, type) {
  const box = document.getElementById('kokumStatusBox');
  if (!box) return;
  box.style.display = 'block';
  box.textContent = msg || 'Sedia.';
  box.style.background = type === 'success'
    ? 'rgba(16,185,129,0.10)'
    : type === 'error'
      ? 'rgba(239,68,68,0.10)'
      : 'rgba(26,79,160,0.06)';
  box.style.border = type === 'success'
    ? '1px solid rgba(16,185,129,0.18)'
    : type === 'error'
      ? '1px solid rgba(239,68,68,0.18)'
      : '1px solid rgba(26,79,160,0.08)';
  box.style.color = type === 'success'
    ? 'var(--green)'
    : type === 'error'
      ? 'var(--red)'
      : 'var(--blue)';
}

function renderKokumDraftMeta() {
  const wrap = document.getElementById('kokumDraftMeta');
  if (!wrap) return;
  const draft = loadPelaporanKokumDraft();
  const pills = [];
  if (draft && draft.savedAt) {
    pills.push('<span class="badge badge-blue">Draf tempatan: ' + escapeHtml(formatD1EditorTimestamp(draft.savedAt)) + '</span>');
  } else {
    pills.push('<span class="badge badge-gray">Tiada draf tempatan</span>');
  }
  if (window._kokumLastServerSavedAt) {
    pills.push('<span class="badge badge-green">Disimpan ke D1: ' + escapeHtml(formatD1EditorTimestamp(window._kokumLastServerSavedAt)) + '</span>');
  }
  wrap.innerHTML = pills.join('');
}

function getKokumFieldValue(id) {
  const el = document.getElementById(id);
  return el ? String(el.value || '').trim() : '';
}

function setKokumFieldValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value == null ? '' : value;
}

function getKokumSelectedUnit() {
  return getKokumFieldValue('kokumUnit');
}

function getKokumSelectedTempat() {
  const selected = getKokumFieldValue('kokumTempat');
  if (selected === 'Lain-lain') return getKokumFieldValue('kokumTempatLain');
  return selected;
}

function syncKokumReporterFields(profil) {
  const resolvedProfile = profil || null;
  const namaGuru = (resolvedProfile && resolvedProfile.nama) || (APP.user && APP.user.name) || '';
  const emailGuru = (resolvedProfile && (resolvedProfile.emelRasmi || resolvedProfile.emel || resolvedProfile.emelLogin)) || (APP.user && APP.user.email) || '';
  setKokumFieldValue('kokumNamaGuru', namaGuru);
  setKokumFieldValue('kokumEmailGuru', emailGuru);
}

function normalizeKokumCategoryKey(value) {
  const normalized = String(value || '').trim().replace(/\s+/g, ' ').toUpperCase();
  return KOKUM_CATEGORY_ALIASES[normalized] || normalized;
}

function cloneKokumProgramOptions(source) {
  const base = source && typeof source === 'object' ? source : {};
  const cloned = {};
  Object.keys(DEFAULT_KOKUM_PROGRAM_OPTIONS).forEach(function(category) {
    const list = Array.isArray(base[category]) ? base[category] : DEFAULT_KOKUM_PROGRAM_OPTIONS[category];
    cloned[category] = list.map(function(item) { return String(item || '').trim(); }).filter(Boolean);
  });
  return cloned;
}

function getLocalKokumProgramConfig() {
  if (_kokumProgramConfig) return cloneKokumProgramOptions(_kokumProgramConfig);
  try {
    const raw = localStorage.getItem(KOKUM_PROGRAM_CONFIG_KEY);
    if (raw) {
      _kokumProgramConfig = cloneKokumProgramOptions(JSON.parse(raw));
      return cloneKokumProgramOptions(_kokumProgramConfig);
    }
  } catch (e) {}
  _kokumProgramConfig = cloneKokumProgramOptions(DEFAULT_KOKUM_PROGRAM_OPTIONS);
  return cloneKokumProgramOptions(_kokumProgramConfig);
}

function saveLocalKokumProgramConfig(config) {
  _kokumProgramConfig = cloneKokumProgramOptions(config);
  localStorage.setItem(KOKUM_PROGRAM_CONFIG_KEY, JSON.stringify(_kokumProgramConfig));
}

function collectKokumProgramsFromRows(rows, category) {
  const cat = normalizeKokumCategoryKey(category);
  const columnIndex = cat === 'UNIT BERUNIFORM' ? 9 : cat === 'KELAB DAN PERSATUAN' ? 10 : cat === 'SUKAN DAN PERMAINAN' ? 11 : -1;
  if (columnIndex < 0 || !Array.isArray(rows)) return [];
  return rows.map(function(row) {
    return String((row && row[columnIndex]) || '').trim();
  }).filter(Boolean);
}

function getKokumProgramListForCategory(category) {
  const cat = normalizeKokumCategoryKey(category);
  const config = getLocalKokumProgramConfig();
  const items = []
    .concat(DEFAULT_KOKUM_PROGRAM_OPTIONS[cat] || [])
    .concat(config[cat] || [])
    .concat(collectKokumProgramsFromRows(_guruData, cat))
    .concat(collectKokumProgramsFromRows(_muridData, cat));
  return Array.from(new Set(items.map(function(item) { return String(item || '').trim(); }).filter(Boolean)))
    .sort(function(a, b) { return a.localeCompare(b, 'ms', { sensitivity: 'base' }); });
}

function getKokumProgramConfigFromForm() {
  return {
    'UNIT BERUNIFORM': ((document.getElementById('kokumConfigUnitBeruniform') || {}).value || '').split(/\r?\n/).map(function(item) { return String(item || '').trim(); }).filter(Boolean),
    'KELAB DAN PERSATUAN': ((document.getElementById('kokumConfigKelabPersatuan') || {}).value || '').split(/\r?\n/).map(function(item) { return String(item || '').trim(); }).filter(Boolean),
    'SUKAN DAN PERMAINAN': ((document.getElementById('kokumConfigSukanPermainan') || {}).value || '').split(/\r?\n/).map(function(item) { return String(item || '').trim(); }).filter(Boolean)
  };
}

function fillKokumProgramConfigForm(config) {
  const normalized = cloneKokumProgramOptions(config);
  const fieldMap = {
    'UNIT BERUNIFORM': 'kokumConfigUnitBeruniform',
    'KELAB DAN PERSATUAN': 'kokumConfigKelabPersatuan',
    'SUKAN DAN PERMAINAN': 'kokumConfigSukanPermainan'
  };
  Object.keys(fieldMap).forEach(function(category) {
    const el = document.getElementById(fieldMap[category]);
    if (el) el.value = (normalized[category] || []).join('\n');
  });
  const meta = document.getElementById('kokumConfigProgramMeta');
  if (meta) {
    const total = Object.keys(fieldMap).reduce(function(sum, category) {
      return sum + (normalized[category] || []).length;
    }, 0);
    meta.textContent = total + ' program aktif dalam konfigurasi kokum';
  }
}

async function loadKokumProgramConfig(forceReload) {
  if (!forceReload && _kokumProgramConfig) {
    fillKokumProgramConfigForm(_kokumProgramConfig);
    return cloneKokumProgramOptions(_kokumProgramConfig);
  }
  let nextConfig = getLocalKokumProgramConfig();
  try {
    const data = await callWorker({ action: 'getConfig' });
    if (data && data.success && data.config && data.config.KOKUM_PROGRAM_OPTIONS_JSON) {
      nextConfig = cloneKokumProgramOptions(JSON.parse(data.config.KOKUM_PROGRAM_OPTIONS_JSON));
      saveLocalKokumProgramConfig(nextConfig);
    }
  } catch (e) {}
  fillKokumProgramConfigForm(nextConfig);
  return cloneKokumProgramOptions(nextConfig);
}

function renderKokumProgramOptions(selectedValue) {
  const currentSelected = typeof selectedValue === 'string' ? selectedValue : getKokumSelectedUnit();
  const category = normalizeKokumCategoryKey(getKokumFieldValue('kokumKategori'));
  const select = document.getElementById('kokumUnit');
  if (!select) return;
  const options = getKokumProgramListForCategory(category);
  const normalizedSelected = String(currentSelected || '').trim();
  const placeholder = category ? 'Pilih unit kokum' : 'Pilih kategori';
  select.options.length = 0;
  select.add(new Option(placeholder, ''));
  options.forEach(function(option) {
    const opt = new Option(option, option, false, normalizedSelected === option);
    select.add(opt);
  });
  if (normalizedSelected && options.includes(normalizedSelected)) {
    select.value = normalizedSelected;
  } else {
    select.value = '';
  }
}

function toggleKokumTempatCustomInput() {
  const customInput = document.getElementById('kokumTempatLain');
  if (!customInput) return;
  const shouldShow = getKokumFieldValue('kokumTempat') === 'Lain-lain';
  customInput.style.display = shouldShow ? 'block' : 'none';
  if (!shouldShow) customInput.value = '';
}

function renderKokumTempatOptions(selectedValue) {
  const unit = getKokumSelectedUnit();
  const select = document.getElementById('kokumTempat');
  const customInput = document.getElementById('kokumTempatLain');
  if (!select) return;
  const baseOptions = KOKUM_DEFAULT_LOCATIONS[unit] || ['Padang sekolah', 'Dewan sekolah', 'Kelas', 'Kawasan sekolah', 'Lain-lain'];
  const allowedYears = getKokumAllowedYears().slice();
  if (!allowedYears.includes(4)) allowedYears.push(4);
  const classOptions = allowedYears.map(function(year) {
    return KOKUM_CLASSROOM_OPTIONS[year];
  }).filter(Boolean);
  const options = Array.from(new Set(baseOptions.concat(classOptions))).sort(function(a, b) {
    return String(a || '').localeCompare(String(b || ''), 'ms', { sensitivity: 'base' });
  });
  const normalizedSelected = String(selectedValue || '').trim();
  const hasListedValue = options.includes(normalizedSelected);
  const placeholder = unit ? 'Pilih tempat' : 'Pilih unit kokum dahulu';
  select.options.length = 0;
  select.add(new Option(placeholder, ''));
  options.forEach(function(option) {
    select.add(new Option(option, option, false, normalizedSelected === option));
  });
  if (normalizedSelected && hasListedValue) {
    select.value = normalizedSelected;
  } else if (normalizedSelected && unit) {
    if (!options.includes('Lain-lain')) {
      select.add(new Option('Lain-lain', 'Lain-lain', false, true));
    } else {
      select.value = 'Lain-lain';
    }
    if (customInput) customInput.value = normalizedSelected;
  } else {
    select.value = '';
    if (customInput) customInput.value = '';
  }
  toggleKokumTempatCustomInput();
}

function applyKokumProgramDefaults() {
  const unit = getKokumSelectedUnit();
  const tajuk = document.getElementById('kokumTajuk');
  const objektif = document.getElementById('kokumObjektif');
  if (tajuk) {
    tajuk.value = '';
    tajuk.placeholder = unit
      ? 'Contoh: Pelaksanaan aktiviti ' + unit + ' sesi kokurikulum'
      : 'Isi fokus aktiviti berdasarkan program yang dipilih';
  }
  renderKokumTempatOptions(getKokumSelectedTempat());
  if (objektif) {
    objektif.placeholder = unit
      ? 'Contoh: Meningkatkan penglibatan murid dalam aktiviti ' + unit + '.'
      : 'Nyatakan objektif aktiviti kokum ini.';
  }
}

function getKokumHariLabel(dateYmd) {
  return 'Rabu';
}

function updateKokumDerivedAttendance() {
  const lelaki = Number(getKokumFieldValue('kokumBilLelaki') || '0');
  const perempuan = Number(getKokumFieldValue('kokumBilPerempuan') || '0');
  const hadir = Number(getKokumFieldValue('kokumBilHadir') || '0');
  if (!getKokumFieldValue('kokumBilHadir') && (lelaki || perempuan)) {
    setKokumFieldValue('kokumBilHadir', lelaki + perempuan);
  } else if (hadir && !getKokumFieldValue('kokumBilTidakHadir')) {
    const jumlah = lelaki + perempuan;
    if (jumlah >= hadir) setKokumFieldValue('kokumBilTidakHadir', Math.max(jumlah - hadir, 0));
  }
  renderPelaporanKokumStats();
}

function renderPelaporanKokumStats() {
  const lelaki = Number(getKokumFieldValue('kokumBilLelaki') || '0');
  const perempuan = Number(getKokumFieldValue('kokumBilPerempuan') || '0');
  const hadir = Number(getKokumFieldValue('kokumBilHadir') || '0');
  const tidak = Number(getKokumFieldValue('kokumBilTidakHadir') || '0');
  const jumlah = lelaki + perempuan;
  const pct = jumlah > 0 ? Math.round((hadir / jumlah) * 100) : 0;
  setText('kokumStatJumlah', String(jumlah));
  setText('kokumStatHadir', String(hadir));
  setText('kokumStatTidak', String(tidak));
  setText('kokumStatPeratus', pct + '%');
}

function getKokumSessionKey() {
  const masa = getKokumFieldValue('kokumMasa').toUpperCase();
  if (masa.indexOf('PETANG') !== -1) return 'petang';
  if (masa.indexOf('PAGI') !== -1) return 'pagi';
  return '';
}

function getKokumAllowedYears() {
  const session = getKokumSessionKey();
  if (session === 'petang') return [5, 6];
  if (session === 'pagi') return [3, 4, 5, 6];
  return [3, 4, 5, 6];
}

function getKokumYearFromClass(kelas) {
  const match = String(kelas || '').trim().match(/^(\d+)/);
  return match ? Number(match[1]) : 0;
}

function isKokumPresentStatus(status) {
  const s = String(status || '').trim().toLowerCase();
  return s === 'hadir' || s === 'lewat';
}

function normalizeKokumMembershipToken(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[()]/g, ' ')
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getKokumMembershipColumnIndex(category) {
  const normalized = normalizeKokumCategoryKey(category || '');
  if (normalized === 'UNIT BERUNIFORM') return 9;
  if (normalized === 'KELAB DAN PERSATUAN') return 10;
  if (normalized === 'SUKAN DAN PERMAINAN') return 11;
  return -1;
}

function getKokumMembershipAliases(unit) {
  const normalized = normalizeKokumMembershipToken(unit);
  if (!normalized) return [];
  if (normalized === 'KADET REMAJA SEKOLAH KRS' || normalized === 'KRS' || normalized === 'TKRS' || normalized === 'TUNAS KADET REMAJA SEKOLAH') {
    return ['KADET REMAJA SEKOLAH KRS', 'KRS', 'TKRS', 'TUNAS KADET REMAJA SEKOLAH'];
  }
  return [normalized];
}

function muridMatchesSelectedKokum(rawMembership, selectedUnit) {
  const selectedAliases = getKokumMembershipAliases(selectedUnit);
  if (!selectedAliases.length) return false;
  const memberships = String(rawMembership || '')
    .split(/[;,]+/)
    .map(function(item) { return normalizeKokumMembershipToken(item); })
    .filter(Boolean);
  return memberships.some(function(item) {
    return selectedAliases.includes(item);
  });
}

async function loadKokumMuridSourceRows() {
  if (Array.isArray(window._kokumMuridSourceRows) && window._kokumMuridSourceRows.length) {
    return window._kokumMuridSourceRows;
  }
  const localCacheLooksReady = Array.isArray(_muridData) && _muridData.some(function(row) {
    const normalized = padSheetRow(row, MURID_SHEET_HEADERS.length);
    return String(normalized[9] || '').trim() || String(normalized[10] || '').trim() || String(normalized[11] || '').trim();
  });
  if (localCacheLooksReady) {
    window._kokumMuridSourceRows = _muridData.map(function(row) {
      return padSheetRow(row, MURID_SHEET_HEADERS.length);
    });
    return window._kokumMuridSourceRows;
  }
  const csvCandidates = [
    'private-data/data_murid.csv',
    'sample-data/data_murid.sample.csv'
  ];
  let csvText = '';
  let loadedFrom = '';
  for (let i = 0; i < csvCandidates.length; i++) {
    const candidate = csvCandidates[i];
    try {
      const response = await fetch(candidate, { cache: 'no-store' });
      if (!response.ok) continue;
      csvText = await response.text();
      loadedFrom = candidate;
      if (String(csvText || '').trim()) break;
    } catch (e) {}
  }
  if (!String(csvText || '').trim()) {
    throw new Error('Gagal memuat data murid tempatan untuk penapisan kokum.');
  }
  const lines = String(csvText || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter(function(line) { return String(line || '').trim(); });
  if (!lines.length) return [];
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parsed = parseCSVLine(lines[i]);
    if (!parsed.length || !String(parsed[0] || '').trim()) continue;
    rows.push(padSheetRow(parsed, MURID_SHEET_HEADERS.length));
  }
  window._kokumMuridSourcePath = loadedFrom;
  window._kokumMuridSourceRows = rows;
  return rows;
}

function buildKokumAttendanceSummaryFromRows(muridRows, attendanceRows, options) {
  const config = options || {};
  const allowedYears = Array.isArray(config.allowedYears) ? config.allowedYears.slice() : [];
  const tarikh = String(config.tarikh || '').trim();
  const kategori = normalizeKokumCategoryKey(config.kategori || '');
  const unit = String(config.unit || '').trim();
  const membershipIndex = getKokumMembershipColumnIndex(kategori);
  if (!tarikh || !allowedYears.length || membershipIndex < 0 || !unit) {
    return { bilLelaki: 0, bilPerempuan: 0, bilHadir: 0, bilTidakHadir: 0, jumlahMurid: 0 };
  }

  const enrolledMap = new Map();
  (Array.isArray(muridRows) ? muridRows : []).forEach(function(rawRow) {
    const row = padSheetRow(rawRow, MURID_SHEET_HEADERS.length);
    const nama = String(row[0] || '').trim();
    const kelas = String(row[1] || '').trim();
    const jantina = String(row[2] || '').trim();
    if (!nama || !kelas) return;
    if (!allowedYears.includes(getKokumYearFromClass(kelas))) return;
    if (!muridMatchesSelectedKokum(row[membershipIndex], unit)) return;
    enrolledMap.set((kelas + '|' + nama).toUpperCase(), {
      nama: nama,
      kelas: kelas,
      jantina: jantina
    });
  });

  const latestAttendanceMap = new Map();
  (Array.isArray(attendanceRows) ? attendanceRows : []).forEach(function(rawRow) {
    const parsed = parseKehadiranMuridRow(rawRow);
    if (!parsed || parsed.tarikh !== tarikh || !parsed.nama || !parsed.kelas) return;
    const key = (parsed.kelas + '|' + parsed.nama).toUpperCase();
    if (!enrolledMap.has(key)) return;
    latestAttendanceMap.set(key, parsed);
  });

  let bilLelaki = 0;
  let bilPerempuan = 0;
  let bilHadir = 0;
  enrolledMap.forEach(function(murid, key) {
    const gender = String(murid.jantina || '').trim().toLowerCase();
    if (gender === 'lelaki') bilLelaki++;
    else if (gender === 'perempuan') bilPerempuan++;
    const attendance = latestAttendanceMap.get(key);
    if (attendance && isKokumPresentStatus(attendance.status)) bilHadir++;
  });

  const jumlahMurid = bilLelaki + bilPerempuan;
  return {
    bilLelaki: bilLelaki,
    bilPerempuan: bilPerempuan,
    bilHadir: bilHadir,
    bilTidakHadir: Math.max(jumlahMurid - bilHadir, 0),
    jumlahMurid: jumlahMurid
  };
}

async function loadKokumAttendanceSummaryFallback(tarikh, kategori, unit, allowedYears) {
  const muridRows = await loadKokumMuridSourceRows();
  let attendanceRows = [];
  if (APP.workerUrl) {
    const attendanceData = await callWorker({ action: 'readSheet', sheetKey: 'KEHADIRAN_MURID' });
    if (!attendanceData.success) {
      throw new Error(attendanceData.error || 'Gagal memuat rekod Kehadiran Murid untuk kokum.');
    }
    attendanceRows = attendanceData.rows || [];
  }
  return buildKokumAttendanceSummaryFromRows(muridRows, attendanceRows, {
    tarikh: tarikh,
    kategori: kategori,
    unit: unit,
    allowedYears: allowedYears
  });
}

async function loadKokumAttendanceSummary() {
  const tarikh = getKokumFieldValue('kokumTarikh');
  const allowedYears = getKokumAllowedYears();
  const kategori = normalizeKokumCategoryKey(getKokumFieldValue('kokumKategori'));
  const unit = getKokumSelectedUnit();
  if (!tarikh || !allowedYears.length || !kategori || !unit) {
    setKokumFieldValue('kokumBilLelaki', '');
    setKokumFieldValue('kokumBilPerempuan', '');
    setKokumFieldValue('kokumBilHadir', '');
    setKokumFieldValue('kokumBilTidakHadir', '');
    renderPelaporanKokumStats();
    if (kategori && !unit) {
      setKokumStatus('Pilih unit kokum dahulu untuk memaparkan kehadiran murid mengikut kategori kokum.', 'info');
    }
    return;
  }
  let summary = null;
  let sourceLabel = '';
  let workerError = '';
  if (APP.workerUrl) {
    try {
      const data = await callWorker({
        action: 'getKokumAttendanceSummary',
        tarikh: tarikh,
        kategori: kategori,
        unit: unit,
        allowedYears: allowedYears
      });
      if (!data.success || !data.summary) throw new Error(data.error || 'Gagal memuat data kehadiran kokum.');
      summary = data.summary;
      sourceLabel = 'backend';
    } catch (e) {
      workerError = e && e.message ? e.message : 'Gagal memuat ringkasan kokum.';
    }
  }

  if (!summary || !Number(summary.jumlahMurid || 0)) {
    try {
      summary = await loadKokumAttendanceSummaryFallback(tarikh, kategori, unit, allowedYears);
      sourceLabel = 'fallback';
    } catch (fallbackError) {
      summary = null;
      workerError = workerError || (fallbackError && fallbackError.message ? fallbackError.message : 'Gagal memuat ringkasan kokum.');
    }
  }

  if (!summary) {
    renderPelaporanKokumStats();
    setKokumStatus(workerError || 'Gagal memuat ringkasan kehadiran kokum.', 'error');
    return;
  }

  setKokumFieldValue('kokumBilLelaki', summary.bilLelaki || 0);
  setKokumFieldValue('kokumBilPerempuan', summary.bilPerempuan || 0);
  setKokumFieldValue('kokumBilHadir', summary.bilHadir || 0);
  setKokumFieldValue('kokumBilTidakHadir', summary.bilTidakHadir || 0);
  renderPelaporanKokumStats();
  const mesejDefaultSesi = getKokumSessionKey() ? '' : ' Penapisan sementara menggunakan murid Tahun 3 hingga 6 sehingga masa dipilih.';
  const mesejSumber = sourceLabel === 'fallback'
    ? ' Data sasaran kokum dipadankan melalui data murid tempatan dan kehadiran diambil daripada modul Kehadiran Murid.'
    : ' Kehadiran kokum dimuat automatik daripada backend modul Kehadiran Murid.';
  setKokumStatus('Ringkasan kehadiran untuk ' + unit + ' berjaya dimuat.' + mesejSumber + mesejDefaultSesi, 'info');
}

async function findExistingKokumDuplicate(payload) {
  if (!payload || !payload.tarikh || !payload.kategori) return null;
  const data = await callWorker({ action: 'readSheet', sheetKey: 'LAPORAN_KOKUM' });
  if (!data.success) throw new Error(data.error || 'Gagal menyemak duplicate laporan kokum.');
  const ownEmail = String(payload.emailGuru || '').trim().toLowerCase();
  const ownName = String(payload.namaGuru || '').trim().toLowerCase();
  const targetTarikh = String(payload.tarikh || '').trim();
  const targetKategori = normalizeKokumCategoryKey(payload.kategori || '');
  const rows = (data.rows || []).map(parsePelaporanKokumRow).filter(Boolean);
  return rows.find(function(item) {
    const sameTarikh = String(item.tarikh || '').trim() === targetTarikh;
    const sameKategori = normalizeKokumCategoryKey(item.kategori || '') === targetKategori;
    if (!sameTarikh || !sameKategori) return false;
    const itemEmail = String(item.emailGuru || '').trim().toLowerCase();
    const itemName = String(item.namaGuru || '').trim().toLowerCase();
    return (itemEmail && itemEmail !== ownEmail) || (!itemEmail && itemName && itemName !== ownName);
  }) || null;
}

async function checkKokumDuplicateOnSelection() {
  const payload = getPelaporanKokumPayload();
  if (!payload.tarikh || !payload.kategori || !payload.unit) return null;
  try {
    const duplicate = await findExistingKokumDuplicate(payload);
    if (!duplicate) return null;
    const mesej = 'Laporan bagi kategori ' + (duplicate.kategori || payload.kategori) + ' sudah dibuat oleh ' + (duplicate.namaGuru || 'guru lain') + ' pada ' + (duplicate.tarikh || payload.tarikh) + '.';
    setKokumStatus(mesej + ' Sila hentikan pengisian untuk elakkan duplicate laporan.', 'error');
    showToast('Duplicate laporan dikesan sebaik program dipilih.', 'error');
    return duplicate;
  } catch (e) {
    setKokumStatus(e.message, 'error');
    return null;
  }
}

function savePelaporanKokumDraft() {
  try {
    localStorage.setItem(KOKUM_DRAFT_STORAGE_KEY, JSON.stringify({
      savedAt: Date.now(),
      payload: getPelaporanKokumPayload()
    }));
    renderKokumDraftMeta();
    return true;
  } catch (e) {
    return false;
  }
}

function loadPelaporanKokumDraft() {
  try {
    const raw = localStorage.getItem(KOKUM_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.payload) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

function clearPelaporanKokumDraft() {
  try {
    localStorage.removeItem(KOKUM_DRAFT_STORAGE_KEY);
  } catch (e) {}
  renderKokumDraftMeta();
}

function schedulePelaporanKokumDraftSave() {
  clearTimeout(_kokumDraftTimer);
  _kokumDraftTimer = setTimeout(function() {
    if (savePelaporanKokumDraft()) {
      setKokumStatus('Draf pelaporan kokum disimpan secara automatik pada peranti ini.', 'info');
    }
  }, 500);
}

function bindKokumModuleEvents() {
  if (window._kokumUiBound) return;
  window._kokumUiBound = true;
  const tarikhInput = document.getElementById('kokumTarikh');
  const kategoriInput = document.getElementById('kokumKategori');
  const unitInput = document.getElementById('kokumUnit');
  const tempatInput = document.getElementById('kokumTempat');
  if (tarikhInput) {
    tarikhInput.addEventListener('change', function() {
      setKokumFieldValue('kokumHari', 'Rabu');
      loadKokumAttendanceSummary();
    });
  }
  if (kategoriInput) {
    kategoriInput.addEventListener('change', function() {
      renderKokumProgramOptions('');
      loadKokumAttendanceSummary();
      schedulePelaporanKokumDraftSave();
    });
  }
  const masaInput = document.getElementById('kokumMasa');
  if (masaInput) {
    masaInput.addEventListener('change', function() {
      loadKokumAttendanceSummary();
      schedulePelaporanKokumDraftSave();
    });
  }
  if (unitInput) {
    unitInput.addEventListener('change', async function() {
      applyKokumProgramDefaults();
      await loadKokumAttendanceSummary();
      const duplicate = await checkKokumDuplicateOnSelection();
      if (!duplicate) {
        setKokumStatus('Unit dipilih. Kehadiran murid kini ditapis mengikut unit kokum ini.', 'info');
      }
      schedulePelaporanKokumDraftSave();
    });
  }
  if (tempatInput) {
    tempatInput.addEventListener('change', function() {
      toggleKokumTempatCustomInput();
      schedulePelaporanKokumDraftSave();
    });
  }
  ['kokumBilLelaki', 'kokumBilPerempuan', 'kokumBilHadir'].forEach(function(id) {
    const input = document.getElementById(id);
    if (input) input.addEventListener('input', updateKokumDerivedAttendance);
  });
  const scope = document.getElementById('mod-pelaporan-kokum');
  if (scope) {
    scope.querySelectorAll('input, select, textarea').forEach(function(el) {
      el.addEventListener('input', schedulePelaporanKokumDraftSave);
      el.addEventListener('change', schedulePelaporanKokumDraftSave);
    });
  }
  window.addEventListener('beforeunload', function() {
    savePelaporanKokumDraft();
  });
}

function getPelaporanKokumPayload() {
  updateKokumDerivedAttendance();
  return {
    tarikh: getKokumFieldValue('kokumTarikh') || getTodayYMD(),
    hari: getKokumFieldValue('kokumHari'),
    namaGuru: getKokumFieldValue('kokumNamaGuru'),
    emailGuru: getKokumFieldValue('kokumEmailGuru'),
    kategori: getKokumFieldValue('kokumKategori'),
    unit: getKokumSelectedUnit(),
    masa: getKokumFieldValue('kokumMasa'),
    tempat: getKokumSelectedTempat(),
    tajuk: getKokumFieldValue('kokumTajuk'),
    objektif: getKokumFieldValue('kokumObjektif'),
    butiran: getKokumFieldValue('kokumButiran'),
    bilLelaki: getKokumFieldValue('kokumBilLelaki'),
    bilPerempuan: getKokumFieldValue('kokumBilPerempuan'),
    bilHadir: getKokumFieldValue('kokumBilHadir'),
    bilTidakHadir: getKokumFieldValue('kokumBilTidakHadir'),
    penglibatan: getKokumFieldValue('kokumPenglibatan'),
    pencapaian: getKokumFieldValue('kokumPencapaian'),
    isu: getKokumFieldValue('kokumIsu'),
    tindakanSusulan: getKokumFieldValue('kokumTindakanSusulan'),
    catatan: getKokumFieldValue('kokumCatatan')
  };
}

function populatePelaporanKokumForm(payload) {
  if (!payload) return;
  setKokumFieldValue('kokumTarikh', payload.tarikh || getTodayYMD());
  setKokumFieldValue('kokumHari', payload.hari || getKokumHariLabel(payload.tarikh || getTodayYMD()));
  setKokumFieldValue('kokumNamaGuru', payload.namaGuru || '');
  setKokumFieldValue('kokumEmailGuru', payload.emailGuru || (APP.user && APP.user.email ? APP.user.email : ''));
  setKokumFieldValue('kokumKategori', normalizeKokumCategoryKey(payload.kategori || ''));
  renderKokumProgramOptions(payload.unit || '');
  setKokumFieldValue('kokumMasa', payload.masa || '');
  renderKokumTempatOptions(payload.tempat || '');
  setKokumFieldValue('kokumTajuk', payload.tajuk || '');
  setKokumFieldValue('kokumObjektif', payload.objektif || '');
  setKokumFieldValue('kokumButiran', payload.butiran || '');
  setKokumFieldValue('kokumBilLelaki', payload.bilLelaki || '');
  setKokumFieldValue('kokumBilPerempuan', payload.bilPerempuan || '');
  setKokumFieldValue('kokumBilHadir', payload.bilHadir || '');
  setKokumFieldValue('kokumBilTidakHadir', payload.bilTidakHadir || '');
  setKokumFieldValue('kokumPenglibatan', payload.penglibatan || '');
  setKokumFieldValue('kokumPencapaian', payload.pencapaian || '');
  setKokumFieldValue('kokumIsu', payload.isu || '');
  setKokumFieldValue('kokumTindakanSusulan', payload.tindakanSusulan || '');
  setKokumFieldValue('kokumCatatan', payload.catatan || '');
  renderPelaporanKokumStats();
}

function parsePelaporanKokumRow(row) {
  if (!Array.isArray(row) || !row.length) return null;
  const first = String(row[0] || '').trim().toLowerCase();
  if (first === 'tarikh') return null;
  return {
    tarikh: row[0] || '',
    hari: row[1] || '',
    namaGuru: row[2] || '',
    emailGuru: row[3] || '',
    kategori: row[4] || '',
    unit: row[5] || '',
    masa: row[6] || '',
    tempat: row[7] || '',
    tajuk: row[8] || '',
    objektif: row[9] || '',
    butiran: row[10] || '',
    bilLelaki: row[11] || '',
    bilPerempuan: row[12] || '',
    bilHadir: row[13] || '',
    bilTidakHadir: row[14] || '',
    penglibatan: row[15] || '',
    pencapaian: row[16] || '',
    isu: row[17] || '',
    tindakanSusulan: row[18] || '',
    catatan: row[19] || '',
    dikemaskini: row[20] || '',
    oleh: row[21] || ''
  };
}

function renderPelaporanKokumHistory(rows) {
  const tbody = document.getElementById('kokumHistoryBody');
  const count = document.getElementById('kokumHistoryCount');
  if (!tbody || !count) return;
  const safeRows = Array.isArray(rows) ? rows : [];
  count.textContent = safeRows.length + ' rekod';
  if (!safeRows.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--muted);text-align:center;padding:24px">Belum ada laporan kokum yang direkodkan.</td></tr>';
    return;
  }
  tbody.innerHTML = safeRows.map(function(item) {
    const hadir = [item.bilHadir || '0', item.bilTidakHadir || '0'].join(' hadir / tidak');
    const kemaskini = item.dikemaskini ? new Date(item.dikemaskini).toLocaleString('ms-MY') : '—';
    return '<tr>' +
      '<td>' + escapeHtml(item.tarikh || '—') + '<br><span style="color:var(--muted);font-size:0.78rem">' + escapeHtml(item.hari || '') + '</span></td>' +
      '<td>' + escapeHtml(item.kategori || '—') + '</td>' +
      '<td><strong>' + escapeHtml(item.unit || item.tajuk || '—') + '</strong><br><span style="color:var(--muted);font-size:0.78rem">' + escapeHtml(item.tajuk || '') + '</span></td>' +
      '<td>' + escapeHtml(item.namaGuru || '—') + '</td>' +
      '<td>' + escapeHtml(hadir) + '</td>' +
      '<td>' + escapeHtml(kemaskini) + '</td>' +
    '</tr>';
  }).join('');
}

async function loadPelaporanKokumHistory() {
  try {
    const data = await callWorker({ action: 'readSheet', sheetKey: 'LAPORAN_KOKUM' });
    if (!data.success) throw new Error(data.error || 'Gagal memuatkan sejarah kokum.');
    const rows = (data.rows || []).map(parsePelaporanKokumRow).filter(Boolean).reverse().slice(0, 12);
    renderPelaporanKokumHistory(rows);
  } catch (e) {
    renderPelaporanKokumHistory([]);
    setKokumStatus(e.message, 'error');
  }
}

async function loadPelaporanKokumLatest() {
  try {
    const data = await callWorker({ action: 'readSheet', sheetKey: 'LAPORAN_KOKUM' });
    if (!data.success) throw new Error(data.error || 'Gagal memuatkan laporan terakhir kokum.');
    const latest = (data.rows || []).map(parsePelaporanKokumRow).filter(Boolean).reverse()[0];
    if (!latest) {
      showToast('Belum ada laporan kokum untuk dimuatkan.', 'info');
      return;
    }
    populatePelaporanKokumForm(latest);
    savePelaporanKokumDraft();
    setKokumStatus('Laporan kokum terakhir telah dimuatkan ke borang.', 'success');
    showToast('Laporan kokum terakhir dimuatkan.', 'success');
  } catch (e) {
    setKokumStatus(e.message, 'error');
    showToast(e.message, 'error');
  }
}

async function initPelaporanKokumModule(forceReload) {
  bindKokumModuleEvents();
  await loadKokumProgramConfig(false);
  const today = getTodayYMD();
  const profil = await loadGuruProfile();
  const defaultPayload = {
    tarikh: today,
    hari: 'Rabu',
    namaGuru: (profil && profil.nama) || (APP.user && APP.user.name) || '',
    emailGuru: (profil && (profil.emelRasmi || profil.emel || profil.emelLogin)) || (APP.user && APP.user.email) || ''
  };
  if (forceReload || !getKokumFieldValue('kokumTarikh')) {
    populatePelaporanKokumForm(defaultPayload);
  } else {
    if (!getKokumFieldValue('kokumHari')) setKokumFieldValue('kokumHari', getKokumHariLabel(getKokumFieldValue('kokumTarikh')));
    if (!getKokumFieldValue('kokumNamaGuru')) setKokumFieldValue('kokumNamaGuru', defaultPayload.namaGuru);
    if (!getKokumFieldValue('kokumEmailGuru')) setKokumFieldValue('kokumEmailGuru', defaultPayload.emailGuru);
    renderKokumProgramOptions(getKokumSelectedUnit());
  }
  const draft = loadPelaporanKokumDraft();
  if (draft && draft.payload && !forceReload) {
    populatePelaporanKokumForm(draft.payload);
    setKokumStatus('Draf pelaporan kokum tempatan telah dipulihkan.', 'success');
  } else {
    setKokumStatus('Borang pelaporan kokum sedia diisi.', 'info');
  }
  syncKokumReporterFields(profil);
  setKokumFieldValue('kokumKategori', normalizeKokumCategoryKey(getKokumFieldValue('kokumKategori')));
  setKokumFieldValue('kokumHari', 'Rabu');
  renderKokumProgramOptions(getKokumSelectedUnit());
  renderKokumTempatOptions(getKokumSelectedTempat());
  applyKokumProgramDefaults();
  await loadKokumAttendanceSummary();
  renderPelaporanKokumStats();
  renderKokumDraftMeta();
  await loadPelaporanKokumHistory();
}

async function simpanPelaporanKokum() {
  syncKokumReporterFields(await loadGuruProfile());
  const payload = getPelaporanKokumPayload();
  if (!payload.tajuk) {
    showToast('Sila isi tajuk atau fokus aktiviti kokum.', 'error');
    return;
  }
  if (!payload.kategori) {
    showToast('Sila pilih kategori kokum.', 'error');
    return;
  }
  if (!payload.unit) {
    showToast('Sila isi nama unit atau aktiviti kokum.', 'error');
    return;
  }
  try {
    const duplicate = await findExistingKokumDuplicate(payload);
    if (duplicate) {
      const mesej = 'Laporan sudah dibuat oleh ' + (duplicate.namaGuru || 'guru lain') + ' untuk kategori ' + (duplicate.kategori || payload.kategori) + ' pada ' + (duplicate.tarikh || payload.tarikh) + '.';
      setKokumStatus(mesej + ' Sila elakkan duplicate laporan.', 'error');
      showToast('Duplicate laporan dikesan. Simpan dibatalkan.', 'error');
      return;
    }
  } catch (e) {
    setKokumStatus(e.message, 'error');
    showToast(e.message, 'error');
    return;
  }
  const row = [
    payload.tarikh || '',
    payload.hari || '',
    payload.namaGuru || '',
    payload.emailGuru || '',
    payload.kategori || '',
    payload.unit || '',
    payload.masa || '',
    payload.tempat || '',
    payload.tajuk || '',
    payload.objektif || '',
    payload.butiran || '',
    payload.bilLelaki || '',
    payload.bilPerempuan || '',
    payload.bilHadir || '',
    payload.bilTidakHadir || '',
    payload.penglibatan || '',
    payload.pencapaian || '',
    payload.isu || '',
    payload.tindakanSusulan || '',
    payload.catatan || '',
    new Date().toISOString(),
    APP.user && APP.user.email ? APP.user.email : ''
  ];
  setKokumStatus('Menyimpan laporan kokum...', 'info');
  try {
    const data = await callWorker({ action: 'appendRow', sheetKey: 'LAPORAN_KOKUM', row: row });
    if (!data.success) throw new Error(data.error || 'Gagal menyimpan pelaporan kokum.');
    window._kokumLastServerSavedAt = Date.now();
    clearPelaporanKokumDraft();
    setKokumStatus('Pelaporan kokum berjaya disimpan.', 'success');
    showToast('Pelaporan kokum berjaya disimpan.', 'success');
    try {
      const notif = await hantarNotifikasiPelaporanKokumPK(payload);
      if (notif && notif.sent) {
        showToast('Notifikasi PK Kokum berjaya dihantar.', 'success');
      } else if (notif && notif.reason === 'missing-phone') {
        showToast('Laporan disimpan, tetapi nombor PK Kokum belum tersedia.', 'info');
      } else if (notif && notif.reason === 'missing-profile') {
        showToast('Laporan disimpan, tetapi profil PK Kokum belum dijumpai.', 'info');
      }
    } catch (notifError) {
      showToast('Laporan disimpan, tetapi notifikasi PK Kokum gagal dihantar.', 'info');
    }
    await loadPelaporanKokumHistory();
  } catch (e) {
    setKokumStatus(e.message, 'error');
    showToast(e.message, 'error');
  }
}

function cetakPelaporanKokum() {
  return cetakPelaporanKokumAsync();
}

async function cetakPelaporanKokumAsync() {
  syncKokumReporterFields(await loadGuruProfile());
  const payload = getPelaporanKokumPayload();
  if (!payload.tajuk) {
    showToast('Sila isi tajuk aktiviti kokum dahulu.', 'error');
    return;
  }
  try {
    const duplicate = await findExistingKokumDuplicate(payload);
    if (duplicate) {
      const mesej = 'Laporan sudah dibuat oleh ' + (duplicate.namaGuru || 'guru lain') + ' untuk kategori ' + (duplicate.kategori || payload.kategori) + ' pada ' + (duplicate.tarikh || payload.tarikh) + '.';
      setKokumStatus(mesej + ' Cetakan dihentikan untuk elakkan duplicate laporan.', 'error');
      showToast('Duplicate laporan dikesan. Cetakan dibatalkan.', 'error');
      return;
    }
  } catch (e) {
    setKokumStatus(e.message, 'error');
    showToast(e.message, 'error');
    return;
  }
  const win = window.open('', '_blank');
  const tarikhDate = payload.tarikh ? parseLocalDateYMD(payload.tarikh) : null;
  const tarikhFmt = tarikhDate ? tarikhDate.toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }) : '?';
  const logoUrl = new URL('assets/sk-kiandongo-logo.png', window.location.href).href;
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pelaporan Kokum - ${escapeHtml(payload.tajuk || 'Tanpa Tajuk')}</title>
  <style>
    :root {
      --ink: #163653;
      --muted: #5d7286;
      --line: #d4dde7;
      --panel: #f4f8fc;
      --accent: #1f5f93;
      --accent-soft: #e7f0f9;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background:
        radial-gradient(circle at top left, rgba(31, 95, 147, 0.10), transparent 32%),
        radial-gradient(circle at top right, rgba(245, 197, 24, 0.12), transparent 24%),
        linear-gradient(180deg, #edf4fb 0%, #f8fbfe 52%, #eef4fa 100%);
      color: #1e2b36;
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 11.5pt;
    }
    .page {
      max-width: 820px;
      margin: 0 auto;
      padding: 14px;
    }
    .sheet {
      background:
        linear-gradient(135deg, rgba(31, 95, 147, 0.035), transparent 18%),
        linear-gradient(0deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.98));
      border: 1px solid var(--line);
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 18px 45px rgba(22, 54, 83, 0.10);
      position: relative;
    }
    .sheet::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        linear-gradient(90deg, rgba(31, 95, 147, 0.055) 0 10px, transparent 10px calc(100% - 10px), rgba(245, 197, 24, 0.07) calc(100% - 10px) 100%),
        radial-gradient(circle at 18% 12%, rgba(31, 95, 147, 0.06), transparent 16%),
        radial-gradient(circle at 88% 14%, rgba(245, 197, 24, 0.08), transparent 12%);
      opacity: 0.85;
    }
    .sheet > * {
      position: relative;
      z-index: 1;
    }
    .hero {
      padding: 18px 22px 12px;
      background: linear-gradient(135deg, #fafdff 0%, #eef5fb 55%, #e3edf8 100%);
      border-bottom: 1px solid var(--line);
    }
    .hero-top {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .logo {
      width: 60px;
      height: 60px;
      object-fit: contain;
      border-radius: 14px;
      background: #fff;
      border: 1px solid rgba(22, 54, 83, 0.10);
      padding: 6px;
      box-shadow: 0 8px 18px rgba(22, 54, 83, 0.08);
    }
    .identity {
      flex: 1;
    }
    .eyebrow {
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--accent);
      margin-bottom: 4px;
    }
    .school {
      font-size: 1.3rem;
      font-weight: 800;
      color: var(--ink);
      line-height: 1.1;
      margin: 0;
    }
    .subtitle {
      font-size: 0.82rem;
      color: var(--muted);
      margin: 4px 0 0;
    }
    .title-band {
      margin-top: 12px;
      padding: 12px 14px;
      border: 1px solid var(--line);
      border-radius: 14px;
      background: #fff;
    }
    .title-band h2 {
      margin: 0;
      font-size: 1rem;
      color: var(--ink);
    }
    .title-band p {
      margin: 4px 0 0;
      font-size: 0.8rem;
      color: var(--muted);
    }
    .content {
      padding: 16px 22px 18px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      margin-bottom: 10px;
    }
    .card {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 12px;
      padding: 10px 12px;
      min-height: 58px;
    }
    .card-wide {
      grid-column: 1 / -1;
    }
    .label {
      font-size: 0.66rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 4px;
    }
    .value {
      font-size: 0.9rem;
      font-weight: 700;
      line-height: 1.28;
      color: var(--ink);
      white-space: pre-wrap;
    }
    .summary-block {
      margin: 10px 0 8px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(244,248,252,0.98) 100%);
      padding: 10px 12px 12px;
    }
    .summary-title {
      margin: 0 0 8px;
      font-size: 0.82rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--accent);
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
    }
    .stat {
      background: linear-gradient(180deg, #fff 0%, #f7fbff 100%);
      border: 1px solid rgba(31, 95, 147, 0.14);
      border-radius: 12px;
      padding: 10px 8px;
      text-align: center;
    }
    .big {
      font-size: 1.18rem;
      font-weight: 800;
      color: var(--ink);
    }
    .small {
      font-size: 0.74rem;
      color: var(--muted);
      margin-top: 2px;
    }
    .section {
      margin-top: 10px;
    }
    .section-head {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .section-no {
      width: 22px;
      height: 22px;
      border-radius: 999px;
      background: var(--accent-soft);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 800;
      color: var(--accent);
    }
    .section-title {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 800;
      color: var(--ink);
    }
    .section-body {
      border: 1px solid var(--line);
      border-radius: 12px;
      background: #fff;
      padding: 10px 12px;
      line-height: 1.45;
      white-space: pre-wrap;
      min-height: 58px;
    }
    .footer {
      display: flex;
      justify-content: flex-start;
      gap: 12px;
      align-items: flex-end;
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid var(--line);
    }
    .note {
      max-width: none;
      font-size: 0.74rem;
      line-height: 1.4;
      color: var(--muted);
    }
    .mark {
      position: absolute;
      right: 18px;
      bottom: 12px;
      font-size: 0.64rem;
      color: #8ca0b4;
    }
    @page {
      size: A4;
      margin: 8mm;
    }
    @media print {
      body {
        background:
          linear-gradient(180deg, #f7fbff 0%, #ffffff 100%);
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .page {
        padding: 0;
        max-width: none;
      }
      .sheet {
        border: 1px solid #d8e3ee;
        border-radius: 0;
        box-shadow: none;
      }
    }
    @media screen and (max-width: 720px) {
      .page {
        padding: 8px;
      }
      .hero-top, .footer {
        display: block;
      }
      .logo {
        margin-bottom: 12px;
      }
      .grid, .stats {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="sheet">
      <div class="hero">
        <div class="hero-top">
          <img class="logo" src="${escapeHtml(logoUrl)}" alt="Logo SK Kiandongo">
          <div class="identity">
            <div class="eyebrow">Smart School Hub</div>
            <h1 class="school">SK Kiandongo</h1>
            <p class="subtitle">Pelaporan Aktiviti Kokurikulum SK Kiandongo.</p>
          </div>
        </div>
        <div class="title-band">
          <h2>Pelaporan Aktiviti Kokurikulum SK Kiandongo</h2>
          <p>Dokumen rekod pelaksanaan aktiviti untuk simpanan sekolah dan rujukan pentadbir.</p>
        </div>
      </div>
      <div class="content">
        <div class="grid">
          <div class="card">
            <div class="label">Nama Guru Penasihat</div>
            <div class="value">${escapeHtml(payload.namaGuru || '?')}</div>
          </div>
          <div class="card">
            <div class="label">Tarikh dan Hari</div>
            <div class="value">${escapeHtml(tarikhFmt + (payload.hari ? ' (' + payload.hari + ')' : ''))}</div>
          </div>
          <div class="card">
            <div class="label">Kategori Kokum</div>
            <div class="value">${escapeHtml(payload.kategori || '?')}</div>
          </div>
          <div class="card">
            <div class="label">Unit Beruniform/Kelab dan Persatuan/Sukan dan Permainan</div>
            <div class="value">${escapeHtml(payload.unit || '?')}</div>
          </div>
          <div class="card">
            <div class="label">Masa dan Tempat</div>
            <div class="value">${escapeHtml((payload.masa || '?') + '\n' + (payload.tempat || '?'))}</div>
          </div>
          <div class="card card-wide">
            <div class="label">Tajuk / Fokus Aktiviti</div>
            <div class="value">${escapeHtml(payload.tajuk || '?')}</div>
          </div>
        </div>

        <div class="summary-block">
          <div class="summary-title">Rumusan Kehadiran Murid</div>
          <div class="stats">
            <div class="stat">
              <div class="label">Murid Lelaki</div>
              <div class="big">${escapeHtml(payload.bilLelaki || '0')}</div>
            </div>
            <div class="stat">
              <div class="label">Murid Perempuan</div>
              <div class="big">${escapeHtml(payload.bilPerempuan || '0')}</div>
            </div>
            <div class="stat">
              <div class="label">Jumlah Hadir</div>
              <div class="big">${escapeHtml(payload.bilHadir || '0')}</div>
            </div>
            <div class="stat">
              <div class="label">Tidak Hadir</div>
              <div class="big">${escapeHtml(payload.bilTidakHadir || '0')}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-head">
            <div class="section-no">1</div>
            <h3 class="section-title">Objektif / Tujuan</h3>
          </div>
          <div class="section-body">${escapeHtml(payload.objektif || '?')}</div>
        </div>

        <div class="section">
          <div class="section-head">
            <div class="section-no">2</div>
            <h3 class="section-title">Butiran Aktiviti</h3>
          </div>
          <div class="section-body">${escapeHtml(payload.butiran || '?')}</div>
        </div>

        <div class="footer">
          <div class="note">Dokumen ini dijana melalui Smart School Hub untuk tujuan rekod sekolah, semakan pentadbir, dan arkib pelaksanaan aktiviti kokurikulum.</div>
        </div>
      </div>
      <div class="mark">SK Kiandongo</div>
    </div>
  </div>
  <script>window.onload=function(){window.print();};<\/script>
</body>
</html>`;
  win.document.write(html);
  win.document.close();
}


async function getGuruList() {
  if (window._guruCache && window._guruCache.length) return window._guruCache;
  try {
    const data = await callWorker({ action: 'readSheet', sheetKey: 'GURU' });
    if (!data.success) throw new Error(data.error);
    window._guruCache = (data.rows || [])
      .filter(r => r[0] && String(r[0]).toLowerCase() !== 'nama')
      .map(function(r) {
        var normalized = normalizeGuruRow(r);
        return {
          nama: normalized[0],
          emel: normalized[1],
          jawatan: normalized[2],
          kelas: normalized[3],
          telefon: normalized[4],
          kokumUnitBeruniform: normalized[9],
          kokumKelabDanPersatuan: normalized[10],
          kokumSukanDanPermainan: normalized[11]
        };
      });
  } catch(e) { window._guruCache = []; }
  return window._guruCache;
}

async function loadDataGuru() {
  const tbody = document.getElementById('dataGuruBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="color:var(--muted);text-align:center;padding:20px">Memuat data...</td></tr>';
  try {
    const data = await callWorker({ action: 'readSheet', sheetKey: 'GURU' });
    if (!data.success) throw new Error(data.error || 'Gagal');
    var seenGuru = {};
    _guruData = (data.rows || [])
      .filter(r => r[0] && String(r[0]).toLowerCase() !== 'nama')
      .map(function(r) { return normalizeGuruRow(r); })
      .filter(function(r) {
        var key = (String(r[0] || '').trim() + '|' + String(r[1] || '').trim()).toLowerCase();
        if (seenGuru[key]) return false;
        seenGuru[key] = true;
        return true;
      });
    window._guruCache = _guruData.map(function(r) {
      return {
        nama: r[0],
        emel: r[1],
        jawatan: r[2],
        kelas: r[3],
        telefon: r[4],
        kokumUnitBeruniform: r[9] || '',
        kokumKelabDanPersatuan: r[10] || '',
        kokumSukanDanPermainan: r[11] || ''
      };
    });
    updateGuruStats();
    filterDataGuru();
    showToast('Data guru dimuatkan: ' + _guruData.length + ' rekod', 'success');
  } catch(e) { tbody.innerHTML = '<tr><td colspan="8" style="color:var(--red);text-align:center;padding:20px">' + escapeHtml(e.message) + '</td></tr>'; showToast(e.message, 'error'); }
}

async function loadDataMurid() {
  const tbody = document.getElementById('dataMuridBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="color:var(--muted);text-align:center;padding:20px">Memuat data murid...</td></tr>';
  try {
    const data = await callWorker({ action: 'readSheet', sheetKey: 'MURID' });
    if (!data.success) throw new Error(data.error || 'Gagal memuatkan data murid.');
    var seenMurid = {};
    _muridData = (data.rows || [])
      .filter(function(r) { return r[0] && String(r[0]).toLowerCase() !== 'nama'; })
      .map(function(r) { return normalizeMuridRow(r); })
      .filter(function(r) {
        var key = (String(r[0] || '').trim() + '|' + String(r[1] || '').trim()).toLowerCase();
        if (seenMurid[key]) return false;
        seenMurid[key] = true;
        return true;
      });
    _muridCache = {};
    window._kokumMuridSourceRows = _muridData.map(function(r) {
      return normalizeMuridRow(r);
    });
    updateMuridStats();
    filterDataMurid();
    showToast('Data murid dimuatkan: ' + _muridData.length + ' rekod', 'success');
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="8" style="color:var(--red);text-align:center;padding:20px">' + escapeHtml(e.message) + '</td></tr>';
    showToast(e.message, 'error');
  }
}

function updateGuruStats() {
  setText('dg-total', _guruData.length);
  setText('dg-aktif', _guruData.filter(r => (r[5] || '') === 'Aktif').length);
  setText('dg-kelas', _guruData.filter(r => (r[2] || '').includes('Kelas')).length);
  setText('dg-admin', _guruData.filter(r => ['Guru Besar','Penolong Kanan Pentadbiran','Penolong Kanan HEM','Penolong Kanan Kokum'].includes(r[2] || '')).length);
}

function updateMuridStats() {
  setText('dm-total', _muridData.length);
  setText('dm-lelaki', _muridData.filter(function(r) { return (r[2] || '') === 'Lelaki'; }).length);
  setText('dm-perempuan', _muridData.filter(function(r) { return (r[2] || '') === 'Perempuan'; }).length);
  var kelas = new Set(_muridData.map(function(r) { return String(r[1] || '').trim(); }).filter(Boolean));
  setText('dm-kelas', kelas.size);
}

function filterDataGuru() {
  const cari = ((document.getElementById('guruCari') || {}).value || '').toLowerCase();
  const jawatan = (document.getElementById('guruFilterJawatan') || {}).value || '';
  _guruFiltered = _guruData.filter(r => {
    const matchCari = !cari || (r[0] || '').toLowerCase().includes(cari) || (r[1] || '').toLowerCase().includes(cari);
    const matchJawatan = !jawatan || (r[2] || '') === jawatan;
    return matchCari && matchJawatan;
  });
  renderGuruTable();
}

function filterDataMurid() {
  const cari = ((document.getElementById('muridCari') || {}).value || '').toLowerCase();
  const kelas = (document.getElementById('muridFilterKelasData') || {}).value || '';
  const jantina = (document.getElementById('muridFilterJantina') || {}).value || '';
  _muridFiltered = _muridData.filter(function(r) {
    const matchCari = !cari || (r[0] || '').toLowerCase().includes(cari) || (r[5] || '').toLowerCase().includes(cari) || (r[4] || '').toLowerCase().includes(cari);
    const matchKelas = !kelas || (r[1] || '') === kelas;
    const matchJantina = !jantina || (r[2] || '') === jantina;
    return matchCari && matchKelas && matchJantina;
  });
  renderMuridTable();
}

function renderGuruTable() {
  const tbody = document.getElementById('dataGuruBody');
  if (!tbody) return;
  if (!_guruFiltered.length) { tbody.innerHTML = '<tr><td colspan="8" style="color:var(--muted);text-align:center;padding:20px">Tiada rekod dijumpai</td></tr>'; return; }
  tbody.innerHTML = _guruFiltered.map(function(r, i) {
    const globalIdx = _guruData.indexOf(r);
    const st = (r[5] || 'Aktif') === 'Aktif' ? '<span class="badge badge-green">Aktif</span>' : (r[5] || '') === 'Bercuti' ? '<span class="badge badge-amber">Bercuti</span>' : '<span class="badge badge-gray">Tidak Aktif</span>';
    return '<tr><td data-label="#" style="color:var(--muted);font-size:0.8rem">' + (i+1) + '</td><td data-label="Nama"><strong>' + escapeHtml(r[0] || '-') + '</strong></td><td data-label="Emel" style="font-size:0.82rem;color:var(--muted)">' + escapeHtml(r[1] || '-') + '</td><td data-label="Jawatan"><span class="badge badge-blue">' + escapeHtml(r[2] || '-') + '</span></td><td data-label="Guru Kelas">' + escapeHtml(r[3] || '-') + '</td><td data-label="No. Telefon" style="font-size:0.82rem">' + escapeHtml(r[4] || '-') + '</td><td data-label="Status">' + st + '</td><td data-label="Tindakan" style="display:flex;gap:5px;flex-wrap:wrap"><button class="btn btn-sm btn-secondary" onclick="editGuru(' + globalIdx + ')">Edit</button><button class="btn btn-sm btn-danger" onclick="confirmPadam(\'guru\',' + globalIdx + ',' + JSON.stringify(r[0] || '') + ')">Padam</button></td></tr>';
  }).join('');
}

function renderMuridTable() {
  const tbody = document.getElementById('dataMuridBody');
  if (!tbody) return;
  if (!_muridFiltered.length) { tbody.innerHTML = '<tr><td colspan="8" style="color:var(--muted);text-align:center;padding:20px">Tiada rekod dijumpai</td></tr>'; return; }
  tbody.innerHTML = _muridFiltered.map(function(r, i) {
    const globalIdx = _muridData.indexOf(r);
    const st = (r[7] || 'Aktif') === 'Aktif' ? '<span class="badge badge-green">Aktif</span>' : (r[7] || '') === 'Berpindah' ? '<span class="badge badge-amber">Berpindah</span>' : '<span class="badge badge-gray">Tidak Aktif</span>';
    var jantinaLabel = r[2] === 'Lelaki' ? 'Lelaki' : r[2] === 'Perempuan' ? 'Perempuan' : '-';
    return '<tr><td data-label="#" style="color:var(--muted);font-size:0.8rem">' + (i+1) + '</td><td data-label="Nama"><strong>' + escapeHtml(r[0] || '-') + '</strong></td><td data-label="Kelas"><span class="badge badge-blue">' + escapeHtml(r[1] || '-') + '</span></td><td data-label="Jantina">' + escapeHtml(jantinaLabel) + '</td><td data-label="Tarikh Lahir" style="font-size:0.82rem">' + escapeHtml(formatTarikhDisplay(r[3])) + '</td><td data-label="Wali / Telefon" style="font-size:0.82rem">' + escapeHtml(r[5] || '-') + '<br><span style="color:var(--muted)">' + escapeHtml(r[4] || '') + '</span></td><td data-label="Status">' + st + '</td><td data-label="Tindakan" style="display:flex;gap:5px;flex-wrap:wrap"><button class="btn btn-sm btn-secondary" onclick="editMurid(' + globalIdx + ')">Edit</button><button class="btn btn-sm btn-danger" onclick="confirmPadam(\'murid\',' + globalIdx + ',' + JSON.stringify(r[0] || '') + ')">Padam</button></td></tr>';
  }).join('');
}

function formatTarikhDisplay(tarikh) {
  if (!tarikh) return '—';
  var s = String(tarikh).trim();
  var birthParts = parseBirthdayParts(s);
  if (birthParts) return formatBirthdayParts(birthParts, '/');
  // ISO format dari Google Sheets: 2019-08-31T16:00:00.000Z
  // Tambah offset MYT (UTC+8) untuk elak timezone shift
  if (s.includes('T') || (s.includes('-') && s.length > 10)) {
    try {
      var ms = Date.parse(s);
      var MYT_OFFSET = 8 * 60 * 60 * 1000;
      var local = new Date(ms + MYT_OFFSET);
      var dd = String(local.getUTCDate()).padStart(2, '0');
      var mm = String(local.getUTCMonth() + 1).padStart(2, '0');
      var yyyy = local.getUTCFullYear();
      return dd + '/' + mm + '/' + yyyy;
    } catch(e) { return s; }
  }
  return s;
}

function isValidBirthdayParts(year, month, day) {
  if (!year || !month || !day) return false;
  var date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && (date.getUTCMonth() + 1) === month && date.getUTCDate() === day;
}

function parseBirthdayParts(tarikh) {
  if (!tarikh) return null;
  var s = String(tarikh).trim();
  if (!s) return null;
  var match = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    var daySlash = parseInt(match[1], 10);
    var monthSlash = parseInt(match[2], 10);
    var yearSlash = parseInt(match[3], 10);
    return isValidBirthdayParts(yearSlash, monthSlash, daySlash) ? { year: yearSlash, month: monthSlash, day: daySlash } : null;
  }
  match = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) {
    var yearDash = parseInt(match[1], 10);
    var monthDash = parseInt(match[2], 10);
    var dayDash = parseInt(match[3], 10);
    return isValidBirthdayParts(yearDash, monthDash, dayDash) ? { year: yearDash, month: monthDash, day: dayDash } : null;
  }
  match = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (match) {
    var yearSlashFirst = parseInt(match[1], 10);
    var monthSlashFirst = parseInt(match[2], 10);
    var daySlashFirst = parseInt(match[3], 10);
    return isValidBirthdayParts(yearSlashFirst, monthSlashFirst, daySlashFirst) ? { year: yearSlashFirst, month: monthSlashFirst, day: daySlashFirst } : null;
  }
  var isoMatch = s.match(/^(\d{4}-\d{2}-\d{2})T/);
  if (isoMatch) return parseBirthdayParts(isoMatch[1]);
  return null;
}

function formatBirthdayParts(parts, separator) {
  if (!parts) return '';
  var sep = separator || '-';
  var year = String(parts.year || '').padStart(4, '0');
  var month = String(parts.month || '').padStart(2, '0');
  var day = String(parts.day || '').padStart(2, '0');
  return sep === '/' ? (day + '/' + month + '/' + year) : (year + '-' + month + '-' + day);
}

function normalizeBirthdayToYMD(tarikh) {
  var parts = parseBirthdayParts(tarikh);
  return parts ? formatBirthdayParts(parts, '-') : '';
}

function normalizeStoredHLRecord(item) {
  if (!item || typeof item !== 'object') return null;
  var nama = String(item.nama || '').trim();
  if (!nama) return null;
  var peranan = String(item.peranan || 'Guru').trim() || 'Guru';
  var kelas = String(item.kelas || '').trim();
  var telefon = String(item.telefon || '').trim();
  var parts = null;

  if (item.bulan != null || item.hari != null || item.tahun != null) {
    var month = parseInt(item.bulan, 10);
    var day = parseInt(item.hari, 10);
    var year = item.tahun != null && item.tahun !== '' ? parseInt(item.tahun, 10) : null;
    if (month && day) {
      parts = isValidBirthdayParts(year || 2000, month, day) ? { month: month, day: day, year: year } : null;
    }
  }
  if (!parts) {
    parts = parseBirthdayParts(item.tarikh || item.birthDate || item.birthday || '');
  }
  if (!parts) return null;

  return {
    nama: nama,
    peranan: peranan,
    kelas: kelas,
    hari: parts.day,
    bulan: parts.month,
    tahun: parts.year || null,
    telefon: telefon
  };
}

function normalizeStoredHLData(data) {
  var changed = false;
  var seen = new Set();
  var normalized = [];
  (Array.isArray(data) ? data : []).forEach(function(item) {
    var record = normalizeStoredHLRecord(item);
    if (!record) {
      changed = true;
      return;
    }
    var key = [record.nama, record.peranan, record.kelas, record.hari, record.bulan, record.tahun || '', record.telefon].join('|');
    if (seen.has(key)) {
      changed = true;
      return;
    }
    seen.add(key);
    normalized.push(record);
    if (!changed && item && (
      String(item.nama || '').trim() !== record.nama ||
      String(item.peranan || 'Guru').trim() !== record.peranan ||
      String(item.kelas || '').trim() !== record.kelas ||
      String(item.telefon || '').trim() !== record.telefon ||
      Number(item.hari || 0) !== record.hari ||
      Number(item.bulan || 0) !== record.bulan ||
      String(item.tahun || '') !== String(record.tahun || '')
    )) {
      changed = true;
    }
  });
  if (changed) {
    localStorage.setItem('ssh_hl_data', JSON.stringify(normalized));
  }
  return normalized;
}

function removeHLRecordByMatch(predicate) {
  var before = hlData.length;
  hlData = hlData.filter(function(item) {
    return !predicate(item);
  });
  if (hlData.length !== before) {
    localStorage.setItem('ssh_hl_data', JSON.stringify(hlData));
    return true;
  }
  return false;
}

function upsertHLRecord(record, matchFn) {
  var normalizedRecord = normalizeStoredHLRecord(record);
  if (!normalizedRecord) return false;
  var idx = hlData.findIndex(function(item) {
    return matchFn(item, normalizedRecord);
  });
  if (idx === -1) {
    hlData.push(normalizedRecord);
    hlData = normalizeStoredHLData(hlData);
    return true;
  }
  var current = hlData[idx] || {};
  var merged = Object.assign({}, current, normalizedRecord);
  var changed = JSON.stringify(current) !== JSON.stringify(merged);
  if (changed) {
    hlData[idx] = merged;
    hlData = normalizeStoredHLData(hlData);
  }
  return changed;
}

const HARILAHIR_SHEET_HEADERS = ['Nama','Peranan','Kelas','Tarikh Lahir','Telefon'];

function buildHariLahirSheetRow(record) {
  var normalized = normalizeStoredHLRecord(record);
  if (!normalized) return null;
  var day = String(normalized.hari).padStart(2, '0');
  var month = String(normalized.bulan).padStart(2, '0');
  var year = normalized.tahun ? String(normalized.tahun) : '';
  return [
    normalized.nama,
    normalized.peranan,
    normalized.kelas,
    year ? (day + '/' + month + '/' + year) : (day + '/' + month + '/'),
    normalized.telefon || ''
  ];
}

function normalizeHariLahirSheetRows(rows) {
  return normalizeStoredHLData((Array.isArray(rows) ? rows : []).map(function(row) {
    return {
      nama: row && row[0],
      peranan: row && row[1],
      kelas: row && row[2],
      tarikh: row && row[3],
      telefon: row && row[4]
    };
  }));
}

function mergeBirthdayRecords(baseRecords, extraRecords) {
  var merged = normalizeStoredHLData(baseRecords);
  (Array.isArray(extraRecords) ? extraRecords : []).forEach(function(record) {
    var normalized = normalizeStoredHLRecord(record);
    if (!normalized) return;
    var idx = merged.findIndex(function(item) {
      return item.nama === normalized.nama && item.peranan === normalized.peranan && item.kelas === normalized.kelas;
    });
    if (idx === -1) merged.push(normalized);
    else merged[idx] = Object.assign({}, merged[idx], normalized);
  });
  return normalizeStoredHLData(merged);
}

function deriveBirthdayRecordsFromGuruRows(rows) {
  return (Array.isArray(rows) ? rows : []).map(function(row) {
    var normalizedRow = normalizeGuruRow(row);
    var parts = parseBirthdayParts(normalizedRow[7]);
    if (!normalizedRow[0] || !parts) return null;
    return {
      nama: normalizedRow[0],
      peranan: 'Guru',
      kelas: normalizedRow[3] || '',
      hari: parts.day,
      bulan: parts.month,
      tahun: parts.year || null,
      telefon: normalizedRow[4] || ''
    };
  }).filter(Boolean);
}

function deriveBirthdayRecordsFromMuridRows(rows) {
  return (Array.isArray(rows) ? rows : []).map(function(row) {
    var normalizedRow = normalizeMuridRow(row);
    var parts = parseBirthdayParts(normalizedRow[3]);
    if (!normalizedRow[0] || !parts) return null;
    return {
      nama: normalizedRow[0],
      peranan: 'Murid',
      kelas: normalizedRow[1] || '',
      hari: parts.day,
      bulan: parts.month,
      tahun: parts.year || null,
      telefon: normalizedRow[4] || ''
    };
  }).filter(Boolean);
}

async function saveHariLahirToBackend() {
  if (!APP.workerUrl || !APP.user || !APP.user.idToken) return false;
  var rows = [HARILAHIR_SHEET_HEADERS].concat(normalizeStoredHLData(hlData).map(function(record) {
    return buildHariLahirSheetRow(record);
  }).filter(Boolean));
  var data = await callWorker({ action: 'replaceSheet', sheetKey: 'HARILAHIR', rows: rows });
  if (!data.success) throw new Error(data.error || 'Gagal menyimpan data Hari Lahir.');
  return true;
}

async function hydrateHariLahirFromBackend(force) {
  if (!APP.workerUrl || (!force && _birthdayHydratedOnce)) return hlData;
  if (_birthdayHydrationPromise && !force) return _birthdayHydrationPromise;
  _birthdayHydrationPromise = (async function() {
    var results = await Promise.allSettled([
      callWorker({ action: 'readSheet', sheetKey: 'HARILAHIR' }),
      callWorker({ action: 'readSheet', sheetKey: 'GURU' }),
      callWorker({ action: 'readSheet', sheetKey: 'MURID' })
    ]);
    var merged = hlData.slice();
    var hariLahirRes = results[0];
    if (hariLahirRes.status === 'fulfilled' && hariLahirRes.value && hariLahirRes.value.success) {
      var rows = (hariLahirRes.value.rows || []).filter(function(row) {
        return row[0] && String(row[0]).toLowerCase() !== 'nama';
      });
      merged = normalizeHariLahirSheetRows(rows);
    }
    var guruRes = results[1];
    if (guruRes.status === 'fulfilled' && guruRes.value && guruRes.value.success) {
      merged = mergeBirthdayRecords(merged, deriveBirthdayRecordsFromGuruRows(guruRes.value.rows || []));
    }
    var muridRes = results[2];
    if (muridRes.status === 'fulfilled' && muridRes.value && muridRes.value.success) {
      merged = mergeBirthdayRecords(merged, deriveBirthdayRecordsFromMuridRows(muridRes.value.rows || []));
    }
    hlData = normalizeStoredHLData(merged);
    localStorage.setItem('ssh_hl_data', JSON.stringify(hlData));
    _birthdayHydratedOnce = true;
    return hlData;
  })();
  try {
    return await _birthdayHydrationPromise;
  } finally {
    _birthdayHydrationPromise = null;
  }
}

function refreshBirthdayViews() {
  var moduleEl = document.getElementById('mod-hari-lahir');
  if (moduleEl && moduleEl.style.display !== 'none' && typeof loadHariLahir === 'function') {
    loadHariLahir();
    return;
  }
  if (typeof renderBirthdayDashboard === 'function') {
    renderBirthdayDashboard();
  }
}

function normalizeGuruRow(row) {
  return padSheetRow(row, GURU_SHEET_HEADERS.length);
}

function normalizeMuridRow(row) {
  return padSheetRow(row, MURID_SHEET_HEADERS.length);
}

const GURU_SHEET_HEADERS = ['Nama','Emel','Jawatan','Guru Kelas','Telefon','Status','WhatsApp','Tarikh Lahir','Catatan','Kokum Unit Beruniform','Kokum Kelab Dan Persatuan','Kokum Sukan Dan Permainan','Dikemaskini','Oleh'];
const MURID_SHEET_HEADERS = ['Nama','Kelas','Jantina','Tarikh Lahir','Telefon Wali','Nama Wali','No. IC','Status','Catatan','Kokum Unit Beruniform','Kokum Kelab Dan Persatuan','Kokum Sukan Dan Permainan','Dikemaskini','Oleh'];

function padSheetRow(row, expectedLength) {
  var normalized = Array.isArray(row) ? row.slice() : [];
  while (normalized.length < expectedLength) normalized.push('');
  return normalized;
}

function buildGuruRowPayload(values, existingRow) {
  var preserved = padSheetRow(existingRow, GURU_SHEET_HEADERS.length);
  return [
    values.nama || '',
    values.emel || '',
    values.jawatan || 'Guru Akademik Biasa',
    values.kelas || '',
    values.telefon || '',
    values.status || 'Aktif',
    values.wa || '',
    preserved[7] || '',
    values.catatan || '',
    preserved[9] || '',
    preserved[10] || '',
    preserved[11] || '',
    new Date().toISOString(),
    APP.user ? APP.user.email : ''
  ];
}

function openModalGuru() {
  document.getElementById('modalGuruTitle').textContent = 'Tambah Guru';
  document.getElementById('guruEditIdx').value = '';
  ['g-nama','g-emel','g-telefon','g-wa','g-catatan'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  setValue('g-jawatan', 'Guru Akademik Biasa');
  setValue('g-kelas', '');
  setValue('g-status', 'Aktif');
  openModal('modalGuru');
}

function editGuru(idx) {
  const r = _guruData[idx]; if (!r) return;
  document.getElementById('modalGuruTitle').textContent = 'Edit Guru';
  document.getElementById('guruEditIdx').value = idx;
  setValue('g-nama', r[0]); setValue('g-emel', r[1]); setValue('g-jawatan', r[2] || 'Guru Akademik Biasa');
  setValue('g-kelas', r[3]); setValue('g-telefon', r[4]); setValue('g-wa', r[6]);
  setValue('g-status', r[5] || 'Aktif'); setValue('g-catatan', r[8]);
  openModal('modalGuru');
}

async function submitGuru() {
  const nama = getTrimmedValue('g-nama');
  if (!nama) { showToast('Nama wajib diisi.', 'error'); return; }
  const editIdx = document.getElementById('guruEditIdx').value;
  try {
    const existingRow = editIdx !== '' ? _guruData[parseInt(editIdx)] : null;
    const row = buildGuruRowPayload({
      nama: nama,
      emel: getTrimmedValue('g-emel'),
      jawatan: getTrimmedValue('g-jawatan'),
      kelas: getTrimmedValue('g-kelas'),
      telefon: getTrimmedValue('g-telefon'),
      status: getTrimmedValue('g-status'),
      wa: getTrimmedValue('g-wa'),
      catatan: getTrimmedValue('g-catatan')
    }, existingRow);
    if (editIdx !== '') {
      _guruData[parseInt(editIdx)] = row;
      await pushFullSheet('GURU', GURU_SHEET_HEADERS, _guruData);
      showToast('Data guru dikemaskini.', 'success');
    } else {
      const data = await callWorker({ action: 'appendRow', sheetKey: 'GURU', row: row });
      if (!data.success) throw new Error(data.error);
      _guruData.push(row);
      showToast('Guru berjaya ditambah!', 'success');
    }
    closeModal('modalGuru'); updateGuruStats(); filterDataGuru();
  } catch(e) { showToast('Ralat: ' + e.message, 'error'); }
}

function importGuruCSV() {
  const file = document.getElementById('guruCsvInput').files[0];
  if (!file) { showToast('Pilih fail CSV guru dahulu.', 'error'); return; }
  const reader = new FileReader();
  reader.onload = async function(e) {
    const lines = e.target.result.split(/\r?\n/).filter(function(l) { return l.trim(); });
    let added = 0, skipped = 0;
    const newRows = [];
    lines.forEach(function(line, idx) {
      if (idx === 0 && line.toLowerCase().replace(/"/g, '').startsWith('nama')) return;
      const cols = parseCSVLine(line);
      if (!cols[0]) { skipped++; return; }
      const row = buildGuruRowPayload({
        nama: cols[0] || '',
        emel: cols[1] || '',
        jawatan: cols[2] || 'Guru Kelas',
        kelas: cols[3] || '',
        telefon: cols[4] || '',
        status: cols[5] || 'Aktif',
        wa: cols[6] || '',
        catatan: cols[7] || ''
      });
      newRows.push(row);
      added++;
    });
    if (!newRows.length) { showToast('Tiada data sah.', 'error'); return; }
    let sent = 0;
    for (const row of newRows) {
      try {
        await callWorker({ action: 'appendRow', sheetKey: 'GURU', row: row });
        _guruData.push(row);
        sent++;
      } catch(e) { skipped++; }
    }
    showToast(sent + ' guru diimport!', 'success');
    updateGuruStats(); filterDataGuru();
  };
  reader.readAsText(file, 'UTF-8');
}

function downloadGuruTemplate() {
  const headers = 'Nama,Emel,Jawatan,Guru Kelas,No. Telefon,Status,WhatsApp,Catatan';
  const row = 'Cikgu Ali,ali@moe-dl.edu.my,Guru Kelas,4 MUTIARA,60123456789,Aktif,60123456789,Guru penasihat STEM';
  downloadCSV(headers + '\n' + row + '\n', 'templat_guru.csv');
}

function exportGuruCSV() {
  if (!_guruData.length) { showToast('Tiada data.', 'error'); return; }
  const headers = 'Nama,Emel,Jawatan,Guru Kelas,No. Telefon,Status,WhatsApp,Catatan,Tarikh Lahir';
  const rows = _guruData.map(function(r) {
    var normalized = padSheetRow(r, GURU_SHEET_HEADERS.length);
    return [
      normalized[0], normalized[1], normalized[2], normalized[3],
      normalized[4], normalized[5], normalized[6], normalized[8], normalized[7]
    ].map(function(c) { return '"' + (c || '') + '"'; }).join(',');
  });
  downloadCSV([headers].concat(rows).join('\n'), 'data_guru_skkiandongo.csv');
  showToast('CSV dieksport.', 'success');
}


function buildMuridRowPayload(values, existingRow) {
  var preserved = padSheetRow(existingRow, MURID_SHEET_HEADERS.length);
  return [
    values.nama || '',
    values.kelas || '',
    values.jantina || 'Lelaki',
    values.tarikhLahir || '',
    values.telefonWali || '',
    values.namaWali || '',
    values.noIc || '',
    values.status || 'Aktif',
    values.catatan || '',
    preserved[9] || '',
    preserved[10] || '',
    preserved[11] || '',
    new Date().toISOString(),
    APP.user ? APP.user.email : ''
  ];
}

function openModalMurid() {
  document.getElementById('modalMuridTitle').textContent = 'Tambah Murid';
  document.getElementById('muridEditIdx').value = '';
  ['m-nama','m-wali','m-telefon-wali','m-ic','m-catatan'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('m-kelas').value = '1 NILAM';
  document.getElementById('m-jantina').value = 'Lelaki';
  document.getElementById('m-status').value = 'Aktif';
  document.getElementById('m-tarikh-lahir').value = '';
  openModal('modalMurid');
}

function editMurid(idx) {
  const r = _muridData[idx]; if (!r) return;
  document.getElementById('modalMuridTitle').textContent = 'Edit Murid';
  document.getElementById('muridEditIdx').value = idx;
  setValue('m-nama', r[0]); setValue('m-kelas', r[1] || '1 NILAM'); setValue('m-jantina', r[2] || 'Lelaki');
  setValue('m-tarikh-lahir', toInputDate(r[3])); setValue('m-telefon-wali', r[4]); setValue('m-wali', r[5]);
  setValue('m-ic', r[6]); setValue('m-status', r[7] || 'Aktif'); setValue('m-catatan', r[8]);
  openModal('modalMurid');
}

function toInputDate(tarikh) {
  return normalizeBirthdayToYMD(tarikh);
}

async function submitMurid() {
  const nama = getTrimmedValue('m-nama');
  if (!nama) { showToast('Nama wajib diisi.', 'error'); return; }
  const tarikhRaw = getTrimmedValue('m-tarikh-lahir');
  let tarikhStored = tarikhRaw;
  if (tarikhRaw && tarikhRaw.includes('-')) { const p = tarikhRaw.split('-'); tarikhStored = p[2] + '/' + p[1] + '/' + p[0]; }
  const editIdx = document.getElementById('muridEditIdx').value;
  try {
    const existingRow = editIdx !== '' ? _muridData[parseInt(editIdx)] : null;
    const row = buildMuridRowPayload({
      nama: nama,
      kelas: getTrimmedValue('m-kelas'),
      jantina: getTrimmedValue('m-jantina'),
      tarikhLahir: tarikhStored,
      telefonWali: getTrimmedValue('m-telefon-wali'),
      namaWali: getTrimmedValue('m-wali'),
      noIc: getTrimmedValue('m-ic'),
      status: getTrimmedValue('m-status'),
      catatan: getTrimmedValue('m-catatan')
    }, existingRow);
    const duplicateIdx = findDuplicateMuridIndexByRow(row, editIdx !== '' ? parseInt(editIdx) : -1);
    if (duplicateIdx !== -1) {
      const duplicateRow = _muridData[duplicateIdx] || [];
      throw new Error('Rekod murid duplicate dikesan untuk ' + (duplicateRow[0] || nama) + ' dalam kelas ' + (duplicateRow[1] || row[1] || '-'));
    }
    if (editIdx !== '') { _muridData[parseInt(editIdx)] = row; await pushFullSheet('MURID', MURID_SHEET_HEADERS, _muridData); showToast('Data murid dikemaskini.', 'success'); }
    else { const data = await callWorker({ action: 'appendRow', sheetKey: 'MURID', row: row }); if (!data.success) throw new Error(data.error); _muridData.push(row); showToast('Murid berjaya ditambah!', 'success'); }
    closeModal('modalMurid'); updateMuridStats(); filterDataMurid();
    if (syncMuridToHariLahir(row)) refreshBirthdayViews();
  } catch(e) { showToast('Ralat: ' + e.message, 'error'); }
}

function syncMuridToHariLahir(row) {
  const parts = parseBirthdayParts(row && row[3]);
  if (!row || !row[0]) return false;
  const kelas = row[1] || '';
  if (!parts) {
    return removeHLRecordByMatch(function(h) { return h.nama === row[0] && h.peranan === 'Murid' && h.kelas === kelas; });
  }
  const payload = { nama: row[0], peranan: 'Murid', kelas: kelas, hari: parts.day, bulan: parts.month, tahun: parts.year || null, telefon: row[4] || '' };
  upsertHLRecord(payload, function(item, normalized) {
    return item.nama === normalized.nama && item.peranan === 'Murid' && item.kelas === normalized.kelas;
  });
  localStorage.setItem('ssh_hl_data', JSON.stringify(hlData));
  return true;
}

function importMuridCSV() {
  const file = document.getElementById('muridCsvInput').files[0];
  if (!file) { showToast('Pilih fail CSV dahulu.', 'error'); return; }
  const reader = new FileReader();
  reader.onload = async function(e) {
    const lines = e.target.result.split(/\r?\n/).filter(function(l) { return l.trim(); });
    let added = 0, skipped = 0;
    const newRows = [];
    const stagedRows = [];
    lines.forEach(function(line, idx) {
      if (idx === 0 && line.toLowerCase().replace(/"/g, '').startsWith('nama')) return;
      const cols = parseCSVLine(line);
      if (!cols[0]) { skipped++; return; }
      const row = buildMuridRowPayload({
        nama: cols[0] || '',
        kelas: cols[1] || '',
        jantina: cols[2] || 'Lelaki',
        tarikhLahir: cols[3] || '',
        telefonWali: cols[4] || '',
        namaWali: cols[5] || '',
        noIc: cols[6] || '',
        status: cols[7] || 'Aktif',
        catatan: cols[8] || ''
      });
      const duplicateExisting = findDuplicateMuridIndexByRow(row, -1) !== -1;
      const duplicateStaged = stagedRows.some(function(existing) {
        return isSameMuridDuplicate(getMuridDuplicateDescriptor(existing), getMuridDuplicateDescriptor(row));
      });
      if (duplicateExisting || duplicateStaged) { skipped++; return; }
      newRows.push(row);
      stagedRows.push(row);
      added++;
    });
    const resultEl = document.getElementById('muridImportResult');
    if (!newRows.length) { if (resultEl) resultEl.textContent = '⚠️ Tiada data sah.'; return; }
    if (resultEl) resultEl.textContent = 'Menghantar ' + added + ' rekod...';
    let sent = 0;
    for (const row of newRows) {
      try { await callWorker({ action: 'appendRow', sheetKey: 'MURID', row: row }); _muridData.push(row); sent++; syncMuridToHariLahir(row); } catch(e) { skipped++; }
    }
    if (resultEl) resultEl.innerHTML = '<span style="color:var(--green)">✅ ' + sent + ' rekod diimport.</span>' + (skipped ? ' ⚠️ ' + skipped + ' dilangkau.' : '');
    showToast(sent + ' murid diimport!', 'success');
    updateMuridStats(); filterDataMurid();
  };
  reader.readAsText(file, 'UTF-8');
}

function downloadMuridTemplate() { downloadCSV('Nama,Kelas,Jantina,Tarikh Lahir (DD/MM/YYYY),No. Telefon Wali,Nama Wali,No. IC,Status,Catatan,Kokum Unit Beruniform,Kokum Kelab Dan Persatuan,Kokum Sukan Dan Permainan\nAhmad bin Ali,4 MUTIARA,Lelaki,12/05/2016,60198765432,Ali bin Abu,160512-12-1234,Aktif,Contoh catatan,Pengakap,STEM,Bola Tampar\n', 'templat_murid.csv'); }

function exportMuridCSV() {
  if (!_muridData.length) { showToast('Tiada data.', 'error'); return; }
  const headers = 'Nama,Kelas,Jantina,Tarikh Lahir,Telefon Wali,Nama Wali,No. IC,Status,Catatan,Kokum Unit Beruniform,Kokum Kelab Dan Persatuan,Kokum Sukan Dan Permainan';
  const rows = _muridData.map(function(r) {
    var normalized = padSheetRow(r, MURID_SHEET_HEADERS.length);
    return normalized.slice(0, 12).map(function(c) { return '"' + (c || '') + '"'; }).join(',');
  });
  downloadCSV([headers].concat(rows).join('\n'), 'data_murid_skkiandongo.csv');
  showToast('CSV dieksport.', 'success');
}

async function getNormalizedSheetRows(sheetKey, expectedHeaders) {
  const data = await callWorker({ action: 'readSheet', sheetKey: sheetKey });
  if (!data.success) throw new Error(data.error || ('Gagal memuatkan sheet ' + sheetKey + '.'));
  return (data.rows || [])
    .filter(function(row) { return row[0] && String(row[0]).toLowerCase() !== 'nama'; })
    .map(function(row) { return padSheetRow(row, expectedHeaders.length); });
}

function setKokumConfigImportResult(id, html, isError) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = 'block';
  el.style.color = isError ? 'var(--red)' : 'var(--green)';
  el.innerHTML = html;
}

function downloadKokumGuruConfigTemplate() {
  downloadCSV(
    'Nama,Emel,Kokum Unit Beruniform,Kokum Kelab Dan Persatuan,Kokum Sukan Dan Permainan\n' +
    'BETTY BINTI JIM,g-34564753@moe-dl.edu.my,TKRS,Kelab Seni Muzik,Bola Tampar\n',
    'templat_kokum_guru.csv'
  );
}

function downloadKokumMuridConfigTemplate() {
  downloadCSV(
    'Nama,Kelas,Kokum Unit Beruniform,Kokum Kelab Dan Persatuan,Kokum Sukan Dan Permainan\n' +
    'AHMAD BIN ALI,4 MUTIARA,Pengakap,Kelab STEM,Bola Tampar\n',
    'templat_kokum_murid.csv'
  );
}

async function simpanKonfigurasiProgramKokum() {
  const config = getKokumProgramConfigFromForm();
  try {
    const payload = cloneKokumProgramOptions(config);
    const data = await callWorker({
      action: 'setConfig',
      config: { KOKUM_PROGRAM_OPTIONS_JSON: JSON.stringify(payload) }
    });
    if (!data.success) throw new Error(data.error || 'Gagal menyimpan konfigurasi program kokum.');
    saveLocalKokumProgramConfig(payload);
    fillKokumProgramConfigForm(payload);
    renderKokumProgramOptions(getKokumSelectedUnit());
    showToast('Konfigurasi program kokum berjaya disimpan.', 'success');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function resetKonfigurasiProgramKokum() {
  const defaults = cloneKokumProgramOptions(DEFAULT_KOKUM_PROGRAM_OPTIONS);
  saveLocalKokumProgramConfig(defaults);
  fillKokumProgramConfigForm(defaults);
  renderKokumProgramOptions(getKokumSelectedUnit());
  showToast('Senarai program kokum dikembalikan kepada tetapan asal tempatan.', 'success');
}

async function importKokumGuruConfigCSV() {
  const input = document.getElementById('kokumGuruConfigCsv');
  const file = input && input.files ? input.files[0] : null;
  if (!file) { showToast('Pilih fail CSV guru penasihat dahulu.', 'error'); return; }
  setKokumConfigImportResult('kokumGuruConfigResult', 'Memproses data guru penasihat...', false);
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const rows = await getNormalizedSheetRows('GURU', GURU_SHEET_HEADERS);
      const byName = new Map();
      const byEmail = new Map();
      rows.forEach(function(row, idx) {
        byName.set(String(row[0] || '').trim().toLowerCase(), idx);
        if (row[1]) byEmail.set(String(row[1] || '').trim().toLowerCase(), idx);
      });
      const lines = String(e.target.result || '').split(/\r?\n/).filter(function(line) { return line.trim(); });
      let updated = 0;
      let skipped = 0;
      lines.forEach(function(line, idx) {
        if (idx === 0 && line.toLowerCase().replace(/"/g, '').startsWith('nama')) return;
        const cols = parseCSVLine(line);
        const namaKey = String(cols[0] || '').trim().toLowerCase();
        const emailKey = String(cols[1] || '').trim().toLowerCase();
        const rowIndex = byEmail.get(emailKey) != null ? byEmail.get(emailKey) : byName.get(namaKey);
        if (rowIndex == null) { skipped++; return; }
        rows[rowIndex][9] = String(cols[2] || '').trim();
        rows[rowIndex][10] = String(cols[3] || '').trim();
        rows[rowIndex][11] = String(cols[4] || '').trim();
        rows[rowIndex][12] = new Date().toISOString();
        rows[rowIndex][13] = APP.user ? APP.user.email : '';
        updated++;
      });
      if (!updated) {
        setKokumConfigImportResult('kokumGuruConfigResult', 'Tiada padanan guru ditemui. Semak lajur Nama atau Emel.', true);
        return;
      }
      await pushFullSheet('GURU', GURU_SHEET_HEADERS, rows);
      _guruData = rows.slice();
      window._guruCache = [];
      renderKokumProgramOptions(getKokumSelectedUnit());
      setKokumConfigImportResult('kokumGuruConfigResult', 'Berjaya kemas kini <strong>' + updated + '</strong> guru penasihat.' + (skipped ? ' <span style="color:var(--gold2)">(' + skipped + ' baris dilangkau)</span>' : ''), false);
      showToast(updated + ' data guru penasihat dikemas kini.', 'success');
    } catch (err) {
      setKokumConfigImportResult('kokumGuruConfigResult', escapeHtml(err.message), true);
      showToast(err.message, 'error');
    }
  };
  reader.readAsText(file, 'UTF-8');
}

async function importKokumMuridConfigCSV() {
  const input = document.getElementById('kokumMuridConfigCsv');
  const file = input && input.files ? input.files[0] : null;
  if (!file) { showToast('Pilih fail CSV kokum murid dahulu.', 'error'); return; }
  setKokumConfigImportResult('kokumMuridConfigResult', 'Memproses data kokum murid...', false);
  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const rows = await getNormalizedSheetRows('MURID', MURID_SHEET_HEADERS);
      const byNameClass = new Map();
      rows.forEach(function(row, idx) {
        const key = String(row[0] || '').trim().toLowerCase() + '|' + String(row[1] || '').trim().toLowerCase();
        byNameClass.set(key, idx);
      });
      const lines = String(e.target.result || '').split(/\r?\n/).filter(function(line) { return line.trim(); });
      let updated = 0;
      let skipped = 0;
      lines.forEach(function(line, idx) {
        if (idx === 0 && line.toLowerCase().replace(/"/g, '').startsWith('nama')) return;
        const cols = parseCSVLine(line);
        const key = String(cols[0] || '').trim().toLowerCase() + '|' + String(cols[1] || '').trim().toLowerCase();
        const rowIndex = byNameClass.get(key);
        if (rowIndex == null) { skipped++; return; }
        rows[rowIndex][9] = String(cols[2] || '').trim();
        rows[rowIndex][10] = String(cols[3] || '').trim();
        rows[rowIndex][11] = String(cols[4] || '').trim();
        rows[rowIndex][12] = new Date().toISOString();
        rows[rowIndex][13] = APP.user ? APP.user.email : '';
        updated++;
      });
      if (!updated) {
        setKokumConfigImportResult('kokumMuridConfigResult', 'Tiada padanan murid ditemui. Gunakan kombinasi Nama dan Kelas.', true);
        return;
      }
      await pushFullSheet('MURID', MURID_SHEET_HEADERS, rows);
      _muridData = rows.slice();
      renderKokumProgramOptions(getKokumSelectedUnit());
      await loadKokumAttendanceSummary();
      renderPelaporanKokumStats();
      setKokumConfigImportResult('kokumMuridConfigResult', 'Berjaya kemas kini <strong>' + updated + '</strong> murid.' + (skipped ? ' <span style="color:var(--gold2)">(' + skipped + ' baris dilangkau)</span>' : ''), false);
      showToast(updated + ' data kokum murid dikemas kini.', 'success');
    } catch (err) {
      setKokumConfigImportResult('kokumMuridConfigResult', escapeHtml(err.message), true);
      showToast(err.message, 'error');
    }
  };
  reader.readAsText(file, 'UTF-8');
}

// ── KONFIGURASI ────────────────────────────────────────────────
function saveWorkerUrl() {
  const url = (document.getElementById('workerUrl').value || '').trim();
  if (!url) { showToast('Sila masukkan URL Worker.', 'error'); return; }
  try {
    const normalized = normalizeConfigUrl(url);
    if (!normalized) throw new Error('URL tidak sah.');
    persistBootstrapConfig(normalized, APP.googleClientId);
    const epEl = document.getElementById('workerEndpoint');
    if (epEl) epEl.value = normalized + '/api';
    setConfigStatus('✅ URL Worker disimpan: ' + normalized, true);
    showToast('URL Worker disimpan.', 'success');
    updateWorkerStatus(); // Auto-check status after saving
  } catch(e) { showToast('URL tidak sah.', 'error'); }
}

/* legacy removed: legacyOldCheckWorkerStatus
  setConfigStatus('🔍 Memeriksa status Worker...');
  try {
    const data = await callWorker({ action: 'getConfig' });
    if (data.success) { 
      setConfigStatus('✅ Worker berjalan.\n\n' + JSON.stringify(data.config, null, 2)); 
      renderConfigTable(data.config); 
      showToast('Worker OK!', 'success'); 
      updateWorkerStatus(); // Update the status indicator
    }
    else setConfigStatus('⚠️ Respons tidak dijangka:\n' + JSON.stringify(data, null, 2));
  } catch(e) { 
    setConfigStatus('❌ Gagal sambung ke Worker: ' + e.message); 
    showToast('Gagal sambung.', 'error'); 
    updateWorkerStatus(); // Update status even on failure
  }
}

*/
async function updateWorkerStatus() {
  const el = document.getElementById('workerStatus');
  if (!el || !APP.workerUrl) return;
  el.textContent = 'Memeriksa sambungan...';
  el.style.background = 'rgba(245,197,24,0.05)';
  el.style.borderColor = 'rgba(245,197,24,0.2)';
  el.style.color = 'var(--gold2)';
  try {
    const start = Date.now();
    const data = await callWorker({ action: 'ping' });
    const latency = Date.now() - start;
    if (data.success && data.worker === 'ok') {
      const backendLabel = data.backendMode === 'cloudflare-d1'
        ? 'Cloudflare D1'
        : data.backendMode === 'google-sheets'
          ? 'Google Sheets'
          : 'Tidak diketahui';
      const backendInfo = data.backendMode === 'cloudflare-d1'
        ? ' | D1 aktif sepenuhnya'
        : data.backendMode === 'google-sheets'
          ? ' | Google Sheets aktif'
          : ' | Backend belum dikonfigurasi';
      el.textContent = 'Tersambung (' + latency + 'ms) | Backend: ' + backendLabel + backendInfo;
      el.style.background = 'rgba(16,185,129,0.05)';
      el.style.borderColor = 'rgba(16,185,129,0.2)';
      el.style.color = 'var(--green)';
      renderWorkerD1CapacityStatus(data);
    } else {
      el.textContent = 'Respons tidak dijangka';
      el.style.background = 'rgba(245,197,24,0.05)';
      el.style.borderColor = 'rgba(245,197,24,0.2)';
      el.style.color = 'var(--gold2)';
      renderWorkerD1CapacityStatus(null, 'Respons ping tidak lengkap.');
    }
  } catch (e) {
    el.textContent = 'Gagal sambung: ' + e.message;
    el.style.background = 'rgba(239,68,68,0.05)';
    el.style.borderColor = 'rgba(239,68,68,0.2)';
    el.style.color = 'var(--red)';
    renderWorkerD1CapacityStatus(null, 'Semakan kapasiti D1 gagal: ' + e.message);
  }
}

function formatStorageBytes(bytes) {
  const safeBytes = Number(bytes) || 0;
  if (safeBytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(safeBytes) / Math.log(k)), sizes.length - 1);
  return parseFloat((safeBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function buildWorkerD1StatCard(label, value, color, compact) {
  return '<div style="background:#fff;border:1px solid var(--border);border-radius:14px;padding:14px;box-shadow:0 10px 24px rgba(15,23,42,.05)">' +
    '<div style="font-size:0.82rem;color:var(--muted);margin-bottom:6px">' + escapeHtml(label) + '</div>' +
    '<div style="font-size:' + (compact ? '1rem' : '1.5rem') + ';font-weight:800;color:' + color + ';line-height:1.3">' + value + '</div>' +
    '</div>';
}

function renderWorkerD1CapacityStatus(pingData, fallbackMessage) {
  const stats = document.getElementById('workerD1CapacityStats');
  const meta = document.getElementById('workerD1Meta');
  const badge = document.getElementById('workerD1Badge');
  if (!stats || !meta || !badge) return;
  if (!pingData || pingData.backendMode !== 'cloudflare-d1') {
    badge.className = 'badge badge-gray';
    badge.textContent = 'Tiada data';
    meta.textContent = fallbackMessage || 'Backend semasa bukan Cloudflare D1 atau data kapasiti belum tersedia.';
    stats.innerHTML = '<div style="border:1px dashed rgba(148,163,184,.4);border-radius:14px;padding:14px;background:#fff;color:var(--muted);font-size:0.88rem;text-align:center">' + escapeHtml(fallbackMessage || 'Kapasiti D1 belum boleh dipaparkan.') + '</div>';
    return;
  }
  if (!pingData.cloudflareD1Ready) {
    badge.className = 'badge badge-red';
    badge.textContent = 'Tidak sedia';
    meta.textContent = pingData.cloudflareD1Error || 'Binding D1 dikesan tetapi belum bersedia.';
    stats.innerHTML = '<div style="border:1px solid rgba(239,68,68,.14);border-radius:14px;padding:14px;background:#fff7f7;color:var(--red);font-size:0.88rem;text-align:center">' + escapeHtml(pingData.cloudflareD1Error || 'Semakan kapasiti D1 gagal.') + '</div>';
    return;
  }
  const summary = pingData.cloudflareD1Summary || {};
  const largestSheet = summary.largestSheet && summary.largestSheet.sheet_name
    ? summary.largestSheet.sheet_name + ' (' + Number(summary.largestSheet.data_count || 0) + ' rekod)'
    : '—';
  badge.className = 'badge badge-green';
  badge.textContent = 'Aktif';
  meta.textContent = 'Backend Cloudflare D1 aktif. Semakan terakhir: ' + (summary.checkedAt ? new Date(summary.checkedAt).toLocaleString('ms-MY') : '—');
  stats.innerHTML = [
    buildWorkerD1StatCard('Anggaran Storan', formatStorageBytes(summary.sizeBytes || 0), '#ea580c'),
    buildWorkerD1StatCard('Jumlah Sheet', String(Number(summary.sheetCount || 0)), 'var(--blue)'),
    buildWorkerD1StatCard('Jumlah Rekod', String(Number(summary.totalRecords || 0)), '#0f766e'),
    buildWorkerD1StatCard('Sheet Terbesar', escapeHtml(largestSheet), '#7c3aed', true)
  ].join('');
}

async function checkWorkerStatus() {
  setConfigStatus('Memeriksa status Worker...');
  try {
    const ping = await callWorker({ action: 'ping' });
    const data = await callWorker({ action: 'getConfig' });
    if (ping.success && data.success) {
      const configKeys = Object.keys(data.config || {});
      const backendLabel = ping.backendMode === 'cloudflare-d1'
        ? 'Cloudflare D1'
        : ping.backendMode === 'google-sheets'
          ? 'Google Sheets'
          : 'Tidak diketahui';
      const lines = [
        'Worker berjalan dengan baik.',
        '',
        'Worker URL: ' + (APP.workerUrl || '—'),
        'Backend aktif: ' + backendLabel,
        'Cloudflare D1 diset: ' + (ping.cloudflareD1Configured ? 'Ya' : 'Tidak'),
        'Cloudflare D1 sedia: ' + (ping.cloudflareD1Ready ? 'Ya' : 'Tidak'),
        'Google Sheets dikonfigurasi: ' + (ping.googleSheetsConfigured ? 'Ya' : 'Tidak'),
        'Bilangan kunci config: ' + configKeys.length,
        'Semakan: ' + (ping.timestamp || '—')
      ];
      setConfigStatus(lines.join('\n'));
      renderConfigTable(data.config);
      showToast('Worker OK!', 'success');
      updateWorkerStatus();
    } else {
      setConfigStatus('Respons tidak dijangka:\n' + JSON.stringify({ ping: ping, config: data }, null, 2));
    }
  } catch (e) {
    setConfigStatus('Gagal sambung ke Worker: ' + e.message);
    showToast('Gagal sambung.', 'error');
    updateWorkerStatus();
  }
}

async function saveConfig() {
  const key = (document.getElementById('configKey').value || '').trim();
  const value = (document.getElementById('configValue').value || '').trim();
  if (!key || !value) { showToast('Kunci dan nilai wajib diisi.', 'error'); return; }
  try {
    const data = await callWorker({ action: 'setConfig', config: { [key]: value } });
    if (data.success) { showToast("Config '" + key + "' disimpan.", 'success'); document.getElementById('configKey').value = ''; document.getElementById('configValue').value = ''; await loadConfig(); }
    else throw new Error(data.error || 'Gagal');
  } catch(e) { showToast(e.message, 'error'); }
}

async function loadConfig() {
  try {
    const data = await callWorker({ action: 'getConfig' });
    if (data.success) {
      applyBackendOperationalConfig(data.config || {});
      renderConfigTable(data.config);
      populateBirthdayNotifConfigInputs(data.config || {});
      populateAttendanceNotificationConfig(data.config || {});
      showToast('Config dimuatkan.', 'success');
    }
    else throw new Error(data.error);
  } catch(e) { showToast(e.message, 'error'); }
}

async function setupSheets() {
  try {
    const data = await callWorker({ action: 'setupAllSheets' });
    if (data.success) { showToast('Sheets berjaya disediakan!', 'success'); await loadConfig(); }
    else throw new Error(data.error);
  } catch(e) { showToast(e.message, 'error'); }
}

async function loadSheetData() {
  const key = (document.getElementById('sheetKey').value || '').trim();
  if (!key) { showToast('Sila masukkan nama sheet untuk dipaparkan.', 'error'); return; }
  try {
    const data = await callWorker({ action: 'readSheet', sheetKey: key });
    if (!data.success) throw new Error(data.error);
    renderSheetTable(data.rows, key);
    showToast("Sheet '" + key + "' dimuatkan.", 'success');
  } catch(e) { showToast(e.message, 'error'); }
}

function renderD1Summary(summary) {
  const tbody = document.getElementById('d1SummaryBody');
  const stats = document.getElementById('d1SummaryStats');
  if (!tbody) return;
  
  let rows = [];
  let sizeBytes = 0;
  if (summary && Array.isArray(summary.sheets)) {
    rows = summary.sheets.slice();
    sizeBytes = summary.sizeBytes || 0;
  } else {
    rows = Array.isArray(summary) ? summary.slice() : [];
  }

  const totalRecords = rows.reduce(function(sum, item) {
    const count = Number(item && (item.data_count != null ? item.data_count : (item.row_count != null ? item.row_count : item.rows)));
    return sum + (Number.isFinite(count) ? count : 0);
  }, 0);
  const largest = rows.slice().sort(function(a, b) {
    const countA = Number(a && (a.data_count != null ? a.data_count : (a.row_count != null ? a.row_count : a.rows)));
    const countB = Number(b && (b.data_count != null ? b.data_count : (b.row_count != null ? b.row_count : b.rows)));
    return (Number.isFinite(countB) ? countB : 0) - (Number.isFinite(countA) ? countA : 0);
  })[0];

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  if (stats) {
    stats.innerHTML = [
      '<div style="background:#fff;border:1px solid var(--border);border-radius:16px;padding:16px;box-shadow:0 10px 24px rgba(15,23,42,.05)"><div style="font-size:0.82rem;color:var(--muted);margin-bottom:6px">Kapasiti D1</div><div style="font-size:1.8rem;font-weight:800;color:#ea580c">' + formatBytes(sizeBytes) + '</div></div>',
      '<div style="background:#fff;border:1px solid var(--border);border-radius:16px;padding:16px;box-shadow:0 10px 24px rgba(15,23,42,.05)"><div style="font-size:0.82rem;color:var(--muted);margin-bottom:6px">Jumlah Sheet</div><div style="font-size:1.8rem;font-weight:800;color:var(--blue)">' + rows.length + '</div></div>',
      '<div style="background:#fff;border:1px solid var(--border);border-radius:16px;padding:16px;box-shadow:0 10px 24px rgba(15,23,42,.05)"><div style="font-size:0.82rem;color:var(--muted);margin-bottom:6px">Jumlah Rekod</div><div style="font-size:1.8rem;font-weight:800;color:#0f766e">' + totalRecords + '</div></div>',
      '<div style="background:#fff;border:1px solid var(--border);border-radius:16px;padding:16px;box-shadow:0 10px 24px rgba(15,23,42,.05)"><div style="font-size:0.82rem;color:var(--muted);margin-bottom:6px">Sheet Terbesar</div><div style="font-size:1rem;font-weight:800;color:#7c3aed">' + escapeHtml(largest ? (largest.sheet_name || largest.sheetKey || largest.sheet || '—') : '—') + '</div></div>'
    ].join('');
  }
  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="2" style="color:var(--muted);text-align:center;padding:16px">Tiada data dalam D1.</td></tr>';
    return;
  }
  tbody.innerHTML = rows.map(function(item) {
    var sheet = escapeHtml(item.sheet_name || item.sheetKey || item.sheet || '—');
    var count = item.data_count != null ? item.data_count : (item.row_count != null ? item.row_count : (item.rows != null ? item.rows : '0'));
    return '<tr><td data-label="Sheet"><strong>' + sheet + '</strong></td><td data-label="Bilangan Rekod">' + count + '</td></tr>';
  }).join('');
}

const D1_EDITABLE_SHEETS = ['GURU', 'MURID', 'KEHADIRAN_GURU', 'KEHADIRAN_MURID', 'LAPORAN_KOKUM', 'HARILAHIR'];
const D1_EDITOR_WIDE_COLUMNS = ['nama', 'nama_guru', 'nama_murid', 'catatan', 'jawatan', 'guru_nama', 'guru_email', 'email_guru', 'telefon', 'telefon_wali', 'nama wali', 'jenis_cuti', 'user_agent'];
const D1_EDITOR_MEDIUM_COLUMNS = ['kelas', 'status', 'tarikh', 'masa_daftar', 'dikemaskini', 'oleh', 'jantina', 'telefon', 'telefon_wali', 'whatsapp'];
const D1_EDITOR_NUMERIC_COLUMNS = ['latitud', 'longitud', 'jarak_meter', 'accuracy_gps', 'row_index'];
const D1_EDITOR_TECHNICAL_COLUMNS = ['latitud', 'longitud', 'jarak_meter', 'dalam_geofence', 'mock_location', 'developer_mode', 'accuracy_gps', 'gps_spoofing_flag', 'ip_address', 'user_agent'];
const D1_EDITOR_STATUS_OPTIONS = ['Hadir', 'Lewat', 'Tidak Hadir', 'Tidak Berada', 'Ponteng', 'Sakit', 'MC', 'Cuti', 'Tanpa Kenyataan', 'Punch Out'];

function setD1EditorStatus(msg, type) {
  const box = document.getElementById('d1EditorStatus');
  if (!box) return;
  const tone = type || 'info';
  box.textContent = msg || 'Sedia untuk mengedit.';
  box.style.background = tone === 'success'
    ? 'rgba(16,185,129,0.10)'
    : tone === 'error'
      ? 'rgba(239,68,68,0.10)'
      : 'rgba(248,250,252,1)';
  box.style.color = tone === 'success'
    ? 'var(--green)'
    : tone === 'error'
      ? 'var(--red)'
      : 'var(--muted)';
  box.style.border = tone === 'success'
    ? '1px solid rgba(16,185,129,0.18)'
    : tone === 'error'
      ? '1px solid rgba(239,68,68,0.18)'
      : '1px solid rgba(26,79,160,0.08)';
}

function formatD1EditorTimestamp(ts) {
  if (!ts) return '';
  try {
    return new Date(ts).toLocaleString('ms-MY');
  } catch (e) {
    return '';
  }
}

function renderD1EditorDraftMeta() {
  const wrap = document.getElementById('d1EditorDraftMeta');
  if (!wrap) return;
  const pills = [];
  if (APP.d1Editor.draftDirty) {
    pills.push('<span class="badge badge-amber">Draf belum disimpan ke D1</span>');
  } else {
    pills.push('<span class="badge badge-green">Selaras dengan paparan semasa</span>');
  }
  if (APP.d1Editor.lastDraftSavedAt) {
    pills.push('<span class="badge badge-blue">Draf tempatan: ' + escapeHtml(formatD1EditorTimestamp(APP.d1Editor.lastDraftSavedAt)) + '</span>');
  }
  if (APP.d1Editor.lastServerSavedAt) {
    pills.push('<span class="badge badge-green">Disimpan ke D1: ' + escapeHtml(formatD1EditorTimestamp(APP.d1Editor.lastServerSavedAt)) + '</span>');
  }
  if (!APP.d1Editor.lastDraftSavedAt && !APP.d1Editor.lastServerSavedAt) {
    pills.push('<span class="badge badge-gray">Belum ada rekod simpanan untuk sesi ini</span>');
  }
  wrap.innerHTML = pills.join('');
}

function getD1SelectedSheetKey() {
  const select = document.getElementById('d1EditableSheetKey');
  const selected = String(select && select.value ? select.value : APP.d1Editor.sheetKey || 'GURU').trim();
  return D1_EDITABLE_SHEETS.includes(selected) ? selected : 'GURU';
}

function getD1EditorRows() {
  return Array.isArray(APP.d1Editor.rows) ? APP.d1Editor.rows : [];
}

function getD1EditorDraftStorageKey(sheetKey) {
  return D1_EDITOR_DRAFT_KEY_PREFIX + String(sheetKey || APP.d1Editor.sheetKey || 'GURU').trim().toUpperCase();
}

function saveD1EditorDraft(options) {
  const opts = options || {};
  const sheetKey = String(opts.sheetKey || APP.d1Editor.sheetKey || getD1SelectedSheetKey() || 'GURU').trim().toUpperCase();
  const rows = Array.isArray(opts.rows) ? opts.rows : getD1EditorRows();
  if (!rows.length) return false;
  try {
    const savedAt = Date.now();
    localStorage.setItem(getD1EditorDraftStorageKey(sheetKey), JSON.stringify({
      sheetKey: sheetKey,
      savedAt: savedAt,
      rows: rows
    }));
    APP.d1Editor.lastDraftSavedAt = savedAt;
    return true;
  } catch (e) {
    return false;
  }
}

function loadD1EditorDraft(sheetKey) {
  try {
    const raw = localStorage.getItem(getD1EditorDraftStorageKey(sheetKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.rows) || !parsed.rows.length) return null;
    return {
      sheetKey: String(parsed.sheetKey || sheetKey || '').trim().toUpperCase(),
      savedAt: Number(parsed.savedAt || 0),
      rows: parsed.rows.map(function(row) {
        return Array.isArray(row) ? row.slice() : [];
      })
    };
  } catch (e) {
    return null;
  }
}

function clearD1EditorDraft(sheetKey) {
  try {
    localStorage.removeItem(getD1EditorDraftStorageKey(sheetKey));
  } catch (e) {
    // noop
  }
}

function scheduleD1EditorDraftSave() {
  clearTimeout(_d1EditorDraftTimer);
  _d1EditorDraftTimer = setTimeout(function() {
    syncD1EditorFromInputs({ skipDraftSave: true });
    if (saveD1EditorDraft()) {
      APP.d1Editor.draftDirty = true;
      setD1EditorStatus('Draf editor D1 disimpan secara automatik pada peranti ini.', 'info');
      renderD1EditorDraftMeta();
    }
  }, 500);
}

function initD1EditorDraftBehavior() {
  if (_d1EditorDraftBound) return;
  _d1EditorDraftBound = true;
  document.addEventListener('input', function(event) {
    const target = event && event.target;
    if (!target || !target.closest) return;
    if (!target.closest('#d1EditorBody') && !target.closest('#d1EditorCardList')) return;
    APP.d1Editor.draftDirty = true;
    renderD1EditorDraftMeta();
    scheduleD1EditorDraftSave();
  });
  document.addEventListener('change', function(event) {
    const target = event && event.target;
    if (!target || !target.closest) return;
    if (!target.closest('#d1EditorBody') && !target.closest('#d1EditorCardList')) return;
    APP.d1Editor.draftDirty = true;
    renderD1EditorDraftMeta();
    scheduleD1EditorDraftSave();
  });
  window.addEventListener('beforeunload', function() {
    syncD1EditorFromInputs({ skipDraftSave: true });
    saveD1EditorDraft();
  });
}

function getD1EditorHeader() {
  const rows = getD1EditorRows();
  return rows.length ? rows[0] : [];
}

function getD1EditorDataRows() {
  const rows = getD1EditorRows();
  return rows.length > 1 ? rows.slice(1) : [];
}

function getD1EditorSearchTerm() {
  const input = document.getElementById('d1EditorSearch');
  return String(input && input.value ? input.value : '').trim().toLowerCase();
}

function getD1EditorStatusFilter() {
  const select = document.getElementById('d1EditorStatusFilter');
  return String(select && select.value ? select.value : '').trim().toLowerCase();
}

function shouldShowD1TechnicalColumns() {
  const toggle = document.getElementById('d1EditorShowTechnical');
  return Boolean(toggle && toggle.checked);
}

function normalizeD1EditorColumnKey(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
}

function formatD1EditorColumnLabel(value) {
  const raw = String(value || '').trim();
  if (!raw) return 'Kolum';
  return raw
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, function(chr) { return chr.toUpperCase(); });
}

function getD1EditorColumnWidth(headerName) {
  const key = normalizeD1EditorColumnKey(headerName);
  if (D1_EDITOR_WIDE_COLUMNS.includes(key) || key.indexOf('nama') !== -1 || key.indexOf('catatan') !== -1) return 260;
  if (D1_EDITOR_MEDIUM_COLUMNS.includes(key) || key.indexOf('kelas') !== -1 || key.indexOf('status') !== -1) return 180;
  if (D1_EDITOR_NUMERIC_COLUMNS.includes(key)) return 130;
  if (key.indexOf('tarikh') !== -1 || key.indexOf('masa') !== -1) return 150;
  return 150;
}

function shouldUseD1EditorTextarea(headerName) {
  const key = normalizeD1EditorColumnKey(headerName);
  return D1_EDITOR_WIDE_COLUMNS.includes(key) || key.indexOf('nama') !== -1 || key.indexOf('catatan') !== -1 || key.indexOf('user_agent') !== -1;
}

function getD1EditorInputMode(headerName) {
  const key = normalizeD1EditorColumnKey(headerName);
  if (D1_EDITOR_NUMERIC_COLUMNS.includes(key)) return 'decimal';
  if (key.indexOf('telefon') !== -1) return 'tel';
  if (key.indexOf('email') !== -1) return 'email';
  return 'text';
}

function getD1EditorFieldType(headerName) {
  const key = normalizeD1EditorColumnKey(headerName);
  if (key === 'status') return 'status';
  if (key.indexOf('tarikh') !== -1) return 'date';
  if (key.indexOf('masa') !== -1) return 'time';
  if (D1_EDITOR_NUMERIC_COLUMNS.includes(key)) return 'number';
  if (key.indexOf('telefon') !== -1) return 'tel';
  if (key.indexOf('email') !== -1) return 'email';
  return 'text';
}

function getD1EditorBadgeClassForStatus(value) {
  const s = String(value || '').trim().toLowerCase();
  if (!s) return 'badge-gray';
  if (s === 'hadir') return 'badge-green';
  if (s === 'punch out' || s === 'punch-out' || s === 'keluar') return 'badge-blue';
  if (s === 'lewat' || s === 'sakit' || s === 'mc' || s.indexOf('cuti') !== -1) return 'badge-amber';
  if (s === 'tidak hadir' || s === 'tidak berada' || s === 'ponteng' || s === 'tanpa kenyataan') return 'badge-red';
  return 'badge-gray';
}

function getD1EditorFieldHint(headerName) {
  const key = normalizeD1EditorColumnKey(headerName);
  if (key === 'status') return '<span class="badge ' + getD1EditorBadgeClassForStatus('') + '">Pilih status</span>';
  if (D1_EDITOR_TECHNICAL_COLUMNS.includes(key)) return '<span class="badge badge-gray">Data teknikal</span>';
  if (key.indexOf('tarikh') !== -1) return '<span class="badge badge-blue">Tarikh</span>';
  if (key.indexOf('masa') !== -1) return '<span class="badge badge-blue">Masa</span>';
  if (D1_EDITOR_NUMERIC_COLUMNS.includes(key)) return '<span class="badge badge-gray">Nombor</span>';
  return '';
}

function getD1EditorStickyStyle(colIndex, isHeader) {
  if (colIndex > 1) return '';
  const left = colIndex === 0 ? 0 : 210;
  const bg = isHeader ? '#f8fafc' : '#ffffff';
  const shadow = colIndex === 1 ? 'box-shadow:inset 1px 0 0 rgba(15,23,42,.06);' : '';
  return 'position:sticky;left:' + left + 'px;z-index:' + (isHeader ? 3 : 2) + ';background:' + bg + ';' + shadow;
}

function shouldUseD1CardLayout() {
  const sheetKey = APP.d1Editor.sheetKey || getD1SelectedSheetKey();
  if (!window.matchMedia || !window.matchMedia('(max-width: 560px)').matches) return false;
  return sheetKey === 'GURU' || sheetKey === 'MURID';
}

function getD1EditorCardSummary(row, header) {
  const keyMap = {};
  header.forEach(function(cell, index) {
    keyMap[normalizeD1EditorColumnKey(cell)] = index;
  });
  function readValue(keys) {
    for (let i = 0; i < keys.length; i += 1) {
      const idx = keyMap[keys[i]];
      if (idx == null) continue;
      const value = row[idx];
      if (value != null && String(value).trim()) return String(value).trim();
    }
    return '';
  }
  return {
    title: readValue(['nama', 'nama_guru', 'nama_murid', 'fullname']),
    subtitle: readValue(['kelas', 'tahun', 'jawatan', 'emel']),
    status: readValue(['status'])
  };
}

function getD1EditorCardColumns(visibleColumns) {
  const priority = ['nama', 'nama_guru', 'nama_murid', 'kelas', 'tahun', 'status', 'emel', 'telefon', 'no_telefon', 'catatan', 'notes'];
  const ranked = visibleColumns.map(function(column, index) {
    const rank = priority.indexOf(column.key);
    return {
      column: column,
      rank: rank === -1 ? 999 + index : rank
    };
  }).sort(function(a, b) {
    return a.rank - b.rank;
  });
  return ranked.map(function(item) { return item.column; });
}

function renderD1EditableCards(dataRows, visibleColumns, header) {
  const cardList = document.getElementById('d1EditorCardList');
  const tableWrap = document.getElementById('d1EditorTableWrap');
  if (!cardList || !tableWrap) return;

  if (!shouldUseD1CardLayout()) {
    tableWrap.style.display = '';
    cardList.style.display = '';
    cardList.innerHTML = '';
    return;
  }

  tableWrap.style.display = 'none';
  cardList.style.display = 'grid';

  if (!dataRows.length) {
    cardList.innerHTML = '<div class="d1-editor-card"><div style="color:var(--muted);text-align:center;padding:6px 0">Tiada rekod sepadan dengan penapis semasa.</div></div>';
    return;
  }

  const cardColumns = getD1EditorCardColumns(visibleColumns);
  cardList.innerHTML = dataRows.map(function(item) {
    const row = item.row;
    const rowIndex = item.rowIndex;
    const summary = getD1EditorCardSummary(row, header);
    const rowTone = summary.status ? getD1EditorBadgeClassForStatus(summary.status) : 'badge-gray';
    const accent = rowTone === 'badge-green'
      ? 'rgba(16,185,129,0.12)'
      : rowTone === 'badge-amber'
        ? 'rgba(245,158,11,0.14)'
        : rowTone === 'badge-red'
          ? 'rgba(239,68,68,0.12)'
          : rowTone === 'badge-blue'
            ? 'rgba(26,79,160,0.12)'
            : 'rgba(148,163,184,0.14)';
    const fields = cardColumns.map(function(column) {
      const value = row[column.colIndex] == null ? '' : String(row[column.colIndex]);
      return buildD1EditorField(rowIndex, column.colIndex, column.cell, value);
    }).join('');
    return '<div class="d1-editor-card" style="border-left:4px solid ' + accent + '">' +
      '<div class="d1-editor-card-header">' +
        '<div>' +
          '<p class="d1-editor-card-title">' + escapeHtml(summary.title || 'Rekod ' + (rowIndex + 1)) + '</p>' +
          '<p class="d1-editor-card-subtitle">' + escapeHtml(summary.subtitle || 'Maklumat ringkas dipaparkan untuk semakan mudah.') + '</p>' +
        '</div>' +
        '<span class="badge ' + rowTone + '">' + escapeHtml(summary.status || 'Belum ditetapkan') + '</span>' +
      '</div>' +
      '<div class="d1-editor-card-grid">' + fields + '</div>' +
      '<div class="d1-editor-card-actions"><button class="btn btn-sm btn-danger" onclick="removeD1EditorRow(' + rowIndex + ')">Buang</button></div>' +
    '</div>';
  }).join('');
}

function initD1EditorResponsiveBehavior() {
  if (APP.d1EditorResponsiveBound) return;
  APP.d1EditorResponsiveBound = true;
  window.addEventListener('resize', function() {
    if (!APP.d1Editor || !APP.d1Editor.rows || !APP.d1Editor.rows.length) return;
    renderD1EditableSheet();
  });
}

function buildD1EditorField(rowIndex, colIndex, headerName, value) {
  const safeValue = value == null ? '' : String(value);
  const label = formatD1EditorColumnLabel(headerName);
  const width = getD1EditorColumnWidth(headerName);
  const fieldBaseStyle = 'width:100%;padding:9px 10px;border:1px solid var(--border);border-radius:10px;font:inherit;background:#fff;color:var(--text);';
  const hintHtml = getD1EditorFieldHint(headerName);
  const labelHtml = '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px"><div style="font-size:0.68rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.04em">' + escapeHtml(label) + '</div>' + hintHtml + '</div>';
  const fieldType = getD1EditorFieldType(headerName);
  if (fieldType === 'status') {
    const currentClass = getD1EditorBadgeClassForStatus(safeValue);
    const options = ['<option value=""></option>'].concat(D1_EDITOR_STATUS_OPTIONS.map(function(option) {
      return '<option value="' + escapeHtml(option) + '"' + (safeValue === option ? ' selected' : '') + '>' + escapeHtml(option) + '</option>';
    })).join('');
    return '<div style="min-width:' + width + 'px">' + labelHtml + '<div style="display:grid;gap:8px"><span class="badge ' + currentClass + '">' + escapeHtml(safeValue || 'Belum ditetapkan') + '</span><select data-d1-row="' + rowIndex + '" data-d1-col="' + colIndex + '" style="' + fieldBaseStyle + 'min-width:' + width + 'px">' + options + '</select></div></div>';
  }
  if (shouldUseD1EditorTextarea(headerName)) {
    return '<div style="min-width:' + width + 'px">' + labelHtml + '<textarea data-d1-row="' + rowIndex + '" data-d1-col="' + colIndex + '" rows="2" style="' + fieldBaseStyle + 'min-width:' + width + 'px;resize:vertical;line-height:1.45">' + escapeHtml(safeValue) + '</textarea></div>';
  }
  const htmlType = fieldType === 'date' ? 'date' : fieldType === 'time' ? 'time' : fieldType === 'email' ? 'email' : fieldType === 'tel' ? 'tel' : fieldType === 'number' ? 'number' : 'text';
  const stepAttr = fieldType === 'number' ? ' step="any"' : '';
  return '<div style="min-width:' + width + 'px">' + labelHtml + '<input data-d1-row="' + rowIndex + '" data-d1-col="' + colIndex + '" type="' + htmlType + '" inputmode="' + getD1EditorInputMode(headerName) + '"' + stepAttr + ' value="' + escapeHtml(safeValue) + '" style="' + fieldBaseStyle + 'min-width:' + width + 'px"></div>';
}

function updateD1EditorMeta(filteredRows) {
  const sheetKey = APP.d1Editor.sheetKey || getD1SelectedSheetKey();
  const title = document.getElementById('d1EditorTitle');
  const meta = document.getElementById('d1EditorMeta');
  const count = document.getElementById('d1EditorCount');
  const searchTerm = getD1EditorSearchTerm();
  const statusFilter = getD1EditorStatusFilter();
  const totalRows = getD1EditorDataRows().length;
  const visibleRows = Number.isFinite(filteredRows) ? filteredRows : totalRows;
  let suffix = 'Kolum kiri akan kekal semasa anda scroll untuk memudahkan semakan nama dan identiti.';
  if (searchTerm || statusFilter) {
    suffix = 'Penapis aktif: ' +
      (searchTerm ? 'carian "' + searchTerm + '"' : '') +
      (searchTerm && statusFilter ? ' + ' : '') +
      (statusFilter ? 'status ' + statusFilter : '') + '.';
  }
  if (title) title.textContent = 'Editor D1 · ' + sheetKey;
  if (meta) meta.textContent = 'Edit terus kandungan sheet ' + sheetKey + ' dan simpan semula ke Cloudflare D1. ' + suffix;
  if (count) count.textContent = visibleRows === totalRows ? String(totalRows) : (visibleRows + ' / ' + totalRows);
}

function renderD1EditableSheet() {
  const thead = document.getElementById('d1EditorHead');
  const tbody = document.getElementById('d1EditorBody');
  const cardList = document.getElementById('d1EditorCardList');
  const tableWrap = document.getElementById('d1EditorTableWrap');
  if (!thead || !tbody) return;
  const rows = getD1EditorRows();
  const header = getD1EditorHeader();

  if (!rows.length || !header.length) {
    updateD1EditorMeta(0);
    renderD1EditorDraftMeta();
    thead.innerHTML = '';
    tbody.innerHTML = '<tr><td style="color:var(--muted);text-align:center;padding:18px">Tiada struktur sheet untuk dipaparkan.</td></tr>';
    if (cardList) cardList.innerHTML = '';
    if (tableWrap) tableWrap.style.display = '';
    return;
  }

  const visibleColumns = header.map(function(cell, colIndex) {
    return { cell: cell, colIndex: colIndex, key: normalizeD1EditorColumnKey(cell) };
  }).filter(function(column) {
    return shouldShowD1TechnicalColumns() || !D1_EDITOR_TECHNICAL_COLUMNS.includes(column.key);
  });

  thead.innerHTML = '<tr>' +
    visibleColumns.map(function(column, visibleIndex) {
      const width = getD1EditorColumnWidth(column.cell);
      return '<th style="min-width:' + width + 'px;' + getD1EditorStickyStyle(visibleIndex, true) + '">' + escapeHtml(formatD1EditorColumnLabel(column.cell || 'Kolum')) + '</th>';
    }).join('') +
    '<th style="width:88px;position:sticky;right:0;z-index:3;background:#f8fafc">Tindakan</th></tr>';

  const searchTerm = getD1EditorSearchTerm();
  const statusFilter = getD1EditorStatusFilter();
  const dataRows = getD1EditorDataRows().map(function(row, rowIndex) {
    return { row: row, rowIndex: rowIndex };
  }).filter(function(item) {
    const row = item.row || [];
    const haystack = row.map(function(cell) { return String(cell == null ? '' : cell).toLowerCase(); }).join(' ');
    const matchesSearch = !searchTerm || haystack.includes(searchTerm);
    if (!matchesSearch) return false;
    if (!statusFilter) return true;
    const statusIdx = header.findIndex(function(cell) { return normalizeD1EditorColumnKey(cell) === 'status'; });
    if (statusIdx === -1) return true;
    return String(row[statusIdx] == null ? '' : row[statusIdx]).trim().toLowerCase() === statusFilter;
  });

  updateD1EditorMeta(dataRows.length);
  renderD1EditorDraftMeta();

  if (!dataRows.length) {
    tbody.innerHTML = '<tr><td colspan="' + (visibleColumns.length + 1) + '" style="color:var(--muted);text-align:center;padding:18px">Tiada rekod sepadan dengan penapis semasa.</td></tr>';
    renderD1EditableCards(dataRows, visibleColumns, header);
    return;
  }

  tbody.innerHTML = dataRows.map(function(item) {
    const row = item.row;
    const rowIndex = item.rowIndex;
    const statusIdx = header.findIndex(function(cell) { return normalizeD1EditorColumnKey(cell) === 'status'; });
    const rowStatus = statusIdx >= 0 ? String(row[statusIdx] == null ? '' : row[statusIdx]) : '';
    const rowTone = rowStatus ? getD1EditorBadgeClassForStatus(rowStatus) : 'badge-gray';
    const rowBg = rowTone === 'badge-green'
      ? 'rgba(16,185,129,0.04)'
      : rowTone === 'badge-amber'
        ? 'rgba(245,158,11,0.05)'
        : rowTone === 'badge-red'
          ? 'rgba(239,68,68,0.04)'
          : rowTone === 'badge-blue'
            ? 'rgba(26,79,160,0.04)'
            : '#fff';
    const cells = visibleColumns.map(function(column, visibleIndex) {
      const width = getD1EditorColumnWidth(column.cell);
      const value = row[column.colIndex] == null ? '' : String(row[column.colIndex]);
      return '<td style="vertical-align:top;min-width:' + width + 'px;background:' + rowBg + ';' + getD1EditorStickyStyle(visibleIndex, false) + '">' + buildD1EditorField(rowIndex, column.colIndex, column.cell, value) + '</td>';
    }).join('');
    return '<tr>' + cells + '<td style="vertical-align:top;position:sticky;right:0;background:' + rowBg + ';z-index:2"><button class="btn btn-sm btn-danger" onclick="removeD1EditorRow(' + rowIndex + ')">Buang</button></td></tr>';
  }).join('');
  renderD1EditableCards(dataRows, visibleColumns, header);
}

function clearD1EditorFilters() {
  const searchInput = document.getElementById('d1EditorSearch');
  const statusInput = document.getElementById('d1EditorStatusFilter');
  const technicalInput = document.getElementById('d1EditorShowTechnical');
  if (searchInput) searchInput.value = '';
  if (statusInput) statusInput.value = '';
  if (technicalInput) technicalInput.checked = false;
  renderD1EditableSheet();
  setD1EditorStatus('Penapis editor D1 telah dikosongkan.', 'success');
}

function syncD1EditorFromInputs() {
  let options = arguments.length > 0 && arguments[0] ? arguments[0] : {};
  const rows = getD1EditorRows();
  const header = getD1EditorHeader();
  if (!rows.length || !header.length) return;
  const nextRows = [header.slice()];
  const inputs = document.querySelectorAll('#d1EditorBody [data-d1-row][data-d1-col], #d1EditorCardList [data-d1-row][data-d1-col]');
  const dataRows = getD1EditorDataRows().map(function(row) { return row.slice(); });
  inputs.forEach(function(input) {
    const rowIndex = Number(input.getAttribute('data-d1-row'));
    const colIndex = Number(input.getAttribute('data-d1-col'));
    if (!Number.isFinite(rowIndex) || !Number.isFinite(colIndex) || !dataRows[rowIndex]) return;
    dataRows[rowIndex][colIndex] = input.value;
  });
  dataRows.forEach(function(row) {
    while (row.length < header.length) row.push('');
    nextRows.push(row.slice(0, header.length));
  });
  APP.d1Editor.rows = nextRows;
  if (!options.skipDraftSave) saveD1EditorDraft({ rows: nextRows });
}

async function loadD1Summary() {
  try {
    const data = await callWorker({ action: 'getSummary' });
    if (!data.success) throw new Error(data.error || 'Gagal memuat ringkasan D1.');
    renderD1Summary(data.summary || []);
    setD1EditorStatus('Ringkasan D1 berjaya dimuatkan.', 'success');
  } catch (e) {
    setD1EditorStatus(e.message, 'error');
  }
}

async function loadD1EditableSheet() {
  const sheetKey = getD1SelectedSheetKey();
  APP.d1Editor.sheetKey = sheetKey;
  APP.d1Editor.draftRestored = false;
  APP.d1Editor.draftDirty = false;
  APP.d1Editor.lastDraftSavedAt = 0;
  initD1EditorResponsiveBehavior();
  initD1EditorDraftBehavior();
  setD1EditorStatus('Memuatkan sheet ' + sheetKey + '...', 'info');
  try {
    const data = await callWorker({ action: 'readSheet', sheetKey: sheetKey });
    if (!data.success) throw new Error(data.error || 'Gagal memuatkan sheet ' + sheetKey + '.');
    APP.d1Editor.rows = Array.isArray(data.rows) ? data.rows.map(function(row) {
      return Array.isArray(row) ? row.slice() : [];
    }) : [];
    const draft = loadD1EditorDraft(sheetKey);
    if (draft && Array.isArray(draft.rows) && draft.rows.length) {
      APP.d1Editor.rows = draft.rows.map(function(row) {
        return Array.isArray(row) ? row.slice() : [];
      });
      APP.d1Editor.draftRestored = true;
      APP.d1Editor.draftDirty = true;
      APP.d1Editor.lastDraftSavedAt = draft.savedAt || 0;
    }
    renderD1EditableSheet();
    if (APP.d1Editor.draftRestored) {
      const savedAt = draft && draft.savedAt ? formatD1EditorTimestamp(draft.savedAt) : '';
      setD1EditorStatus('Draf tempatan untuk sheet ' + sheetKey + ' dipulihkan' + (savedAt ? ' (' + savedAt + ')' : '') + '.', 'success');
      showToast('Draf editor D1 dipulihkan untuk sheet ' + sheetKey + '.', 'info');
    } else {
      setD1EditorStatus('Sheet ' + sheetKey + ' berjaya dimuatkan.', 'success');
    }
  } catch (e) {
    APP.d1Editor.rows = [];
    APP.d1Editor.draftDirty = false;
    renderD1EditableSheet();
    setD1EditorStatus(e.message, 'error');
  }
}

function addD1EditorRow() {
  syncD1EditorFromInputs();
  const header = getD1EditorHeader();
  if (!header.length) {
    setD1EditorStatus('Header sheet tidak dijumpai. Muat semula editor dahulu.', 'error');
    return;
  }
  APP.d1Editor.rows.push(new Array(header.length).fill(''));
  renderD1EditableSheet();
  setD1EditorStatus('Baris baharu ditambah pada sheet ' + APP.d1Editor.sheetKey + '.', 'success');
}

function removeD1EditorRow(rowIndex) {
  syncD1EditorFromInputs();
  const rows = getD1EditorRows();
  if (rows.length <= 1) return;
  const dataIndex = Number(rowIndex) + 1;
  if (!Number.isFinite(dataIndex) || dataIndex < 1 || dataIndex >= rows.length) return;
  rows.splice(dataIndex, 1);
  APP.d1Editor.rows = rows;
  renderD1EditableSheet();
  setD1EditorStatus('Baris dipadam daripada sheet ' + APP.d1Editor.sheetKey + '.', 'success');
}

function resetD1Editor() {
  clearD1EditorDraft(APP.d1Editor.sheetKey || getD1SelectedSheetKey());
  APP.d1Editor.draftDirty = false;
  APP.d1Editor.lastDraftSavedAt = 0;
  loadD1EditableSheet();
}

async function saveD1EditableSheet() {
  syncD1EditorFromInputs();
  const sheetKey = APP.d1Editor.sheetKey || getD1SelectedSheetKey();
  const rows = getD1EditorRows();
  if (!rows.length) {
    setD1EditorStatus('Tiada data untuk disimpan.', 'error');
    return;
  }
  setD1EditorStatus('Menyimpan sheet ' + sheetKey + '...', 'info');
  try {
    const data = await callWorker({ action: 'replaceSheet', sheetKey: sheetKey, rows: rows });
    if (!data.success) throw new Error(data.error || 'Gagal menyimpan sheet ' + sheetKey + '.');
    clearD1EditorDraft(sheetKey);
    APP.d1Editor.draftRestored = false;
    APP.d1Editor.draftDirty = false;
    APP.d1Editor.lastDraftSavedAt = 0;
    APP.d1Editor.lastServerSavedAt = Date.now();
    renderD1EditableSheet();
    setD1EditorStatus('Sheet ' + sheetKey + ' berjaya disimpan.', 'success');
    showToast('Sheet ' + sheetKey + ' berjaya disimpan ke D1.', 'success');
    loadD1Summary();
  } catch (e) {
    setD1EditorStatus(e.message, 'error');
    showToast(e.message, 'error');
  }
}

async function clearD1SelectedSheet() {
  const sheetKey = APP.d1Editor.sheetKey || getD1SelectedSheetKey();
  setD1EditorStatus('Mengosongkan sheet ' + sheetKey + '...', 'info');
  try {
    const data = await callWorker({ action: 'clearSheet', sheetKey: sheetKey });
    if (!data.success) throw new Error(data.error || 'Gagal mengosongkan sheet ' + sheetKey + '.');
    clearD1EditorDraft(sheetKey);
    APP.d1Editor.draftDirty = false;
    APP.d1Editor.lastDraftSavedAt = 0;
    await loadD1EditableSheet();
    await loadD1Summary();
    setD1EditorStatus('Sheet ' + sheetKey + ' berjaya dikosongkan.', 'success');
    showToast('Sheet ' + sheetKey + ' telah dikosongkan.', 'success');
  } catch (e) {
    setD1EditorStatus(e.message, 'error');
    showToast(e.message, 'error');
  }
}

async function clearD1AllData() {
  setD1EditorStatus('Mengosongkan semua data D1...', 'info');
  try {
    const data = await callWorker({ action: 'clearAllData' });
    if (!data.success) throw new Error(data.error || 'Gagal mengosongkan semua data D1.');
    D1_EDITABLE_SHEETS.forEach(function(sheetKey) {
      clearD1EditorDraft(sheetKey);
    });
    APP.d1Editor.draftDirty = false;
    APP.d1Editor.lastDraftSavedAt = 0;
    await loadD1EditableSheet();
    await loadD1Summary();
    setD1EditorStatus('Semua data D1 berjaya dikosongkan.', 'success');
    showToast('Semua data D1 telah dikosongkan.', 'success');
  } catch (e) {
    setD1EditorStatus(e.message, 'error');
    showToast(e.message, 'error');
  }
}

function renderConfigTable(config) {
  if (!config) return;
  const card = document.getElementById('configPreviewCard');
  if (card) card.style.display = 'block';
  const tbody = document.getElementById('configTableBody');
  if (!tbody) return;
  tbody.innerHTML = Object.entries(config).map(function(entry) {
    return '<tr><td><strong>' + escapeHtml(entry[0]) + '</strong></td><td style="font-family:monospace;font-size:0.85rem">' + escapeHtml(entry[1]) + '</td></tr>';
  }).join('');
}

function renderSheetTable(rows, key) {
  const wrap = document.getElementById('sheetPreview');
  const title = document.getElementById('sheetPreviewTitle');
  if (!rows || !rows.length) {
    if (title) title.textContent = key ? 'Sheet: ' + key + ' (tiada data)' : 'Pratonton Sheet';
    if (wrap) wrap.style.display = 'none';
    return;
  }
  if (wrap) wrap.style.display = 'block';
  if (title) title.textContent = 'Sheet: ' + key;
  const thead = document.getElementById('sheetTableHead');
  const tbody = document.getElementById('sheetTableBody');
  if (thead) thead.innerHTML = '<tr>' + rows[0].map(c => '<th>' + escapeHtml(c || '') + '</th>').join('') + '</tr>';
  if (tbody) tbody.innerHTML = rows.slice(1).map(r => '<tr>' + r.map(c => '<td>' + escapeHtml(c || '') + '</td>').join('') + '</tr>').join('');
}

function setConfigStatus(msg) { const box = document.getElementById('configStatus'); if (box) box.textContent = msg; }
function clearConfigStatus() { const box = document.getElementById('configStatus'); if (box) box.textContent = 'Status akan dipaparkan di sini.'; }

// ── SHARED HELPERS ─────────────────────────────────────────────
/* legacy removed: legacyOlderStatusBadge
  if (!status) return '<span class="badge badge-gray">—</span>';
  const s = String(status).toLowerCase();
  if (s === 'hadir') return '<span class="badge badge-green">✓ Hadir</span>';
  if (s === 'tidak hadir' || s === 'tidak berada') return '<span class="badge badge-red">✕ ' + status + '</span>';
  if (s === 'mc') return '<span class="badge badge-amber">🏥 MC</span>';
  if (s.includes('cuti')) return '<span class="badge badge-amber">📋 ' + status + '</span>';
  if (s === 'lewat') return '<span class="badge badge-amber">⚠️ Lewat</span>';
  if (s === 'tanpa kenyataan') return '<span class="badge badge-red">⚠️ Tanpa Kenyataan</span>';
  return '<span class="badge badge-gray">' + status + '</span>';
}

*/
function openModal(id) { const el = document.getElementById(id); if (el) el.style.display = 'grid'; }
function closeModal(id) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }

function showToast(msg, type) {
  type = type || 'info';
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const icon = document.createElement('span');
  icon.className = 'toast-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = icons[type] || 'ℹ️';
  const message = document.createElement('span');
  message.className = 'toast-message';
  message.textContent = String(msg || '');
  toast.append(icon, message);
  container.appendChild(toast);
  setTimeout(function() { toast.style.opacity = '0'; toast.style.transform = 'translateX(40px)'; toast.style.transition = '0.3s'; setTimeout(function() { toast.remove(); }, 350); }, 3500);
}

function parseCSVLine(line) {
  const result = [];
  let cur = '', inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQuote = !inQuote; continue; }
    if (c === ',' && !inQuote) { result.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  result.push(cur.trim());
  return result;
}

function downloadCSV(csvContent, filename) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

// Close modal on backdrop click
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.modal-backdrop').forEach(function(backdrop) {
    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) backdrop.style.display = 'none';
    });
  });
});
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) refreshAttendanceModuleIfVisible(true);
});
window.addEventListener('focus', function() {
  refreshAttendanceModuleIfVisible(true);
});

function statusBadge(status) {
  if (!status) return '<span class="badge badge-gray">-</span>';
  const s = String(status).toLowerCase();
  if (s === 'hadir') return '<span class="badge badge-green">Hadir</span>';
  if (s === 'punch out' || s === 'punch-out' || s === 'keluar') return '<span class="badge badge-blue">Punch Out</span>';
  if (s === 'tidak hadir' || s === 'tidak berada') return '<span class="badge badge-red">' + status + '</span>';
  if (s === 'ponteng') return '<span class="badge badge-red">Ponteng</span>';
  if (s === 'mc' || s === 'sakit') return '<span class="badge badge-amber">Sakit</span>';
  if (s.includes('cuti')) return '<span class="badge badge-amber">' + status + '</span>';
  if (s === 'lewat') return '<span class="badge badge-amber">Lewat</span>';
  if (s === 'tanpa kenyataan') return '<span class="badge badge-red">Tanpa Kenyataan</span>';
  return '<span class="badge badge-gray">' + status + '</span>';
}

function updateDashboardMurid(allMurid, today) {
  var todayMurid = allMurid.filter(function(r){ return r.tarikh === today; });
  var hadir = todayMurid.filter(function(r){ return ['Hadir', 'Lewat'].includes(r.status); }).length;
  var tidakHadir = todayMurid.filter(function(r){ return ['Tidak Hadir', 'Sakit', 'Ponteng'].includes(r.status); });
  var total = todayMurid.length;
  var pct = total ? Math.round((hadir / total) * 100) : 0;
  setText('dash-murid-hadir', hadir);
  setText('dash-tidak-hadir', tidakHadir.length);
  setText('dash-murid-pct', total ? pct + '% hadir' : '');
  renderWeeklyChart(allMurid);
  renderMuridTidakHadirDash(tidakHadir);
}

// ══ SISTEM AMARAN KEHADIRAN MURID ══════════════════════════════════════════
var TAHAP_AMARAN_INFO = [
  { tahap: 0, label: 'Normal', warna: '#22c55e', warnaText: '#166534', ikon: '✅', keterangan: '' },
  { tahap: 1, label: 'Amaran 1', warna: '#f59e0b', warnaText: '#92400e', ikon: '⚠️', keterangan: 'Guru kelas mengeluarkan Surat Amaran 1. Rekod dalam APDM. Maklumkan ibu bapa melalui panggilan / WhatsApp / surat rasmi.' },
  { tahap: 2, label: 'Amaran 2', warna: '#f97316', warnaText: '#7c2d12', ikon: '🔶', keterangan: 'Surat Amaran 2 dikeluarkan. Ibu bapa dipanggil hadir ke sekolah. Guru Disiplin / PK HEM dilibatkan.' },
  { tahap: 3, label: 'Amaran 3', warna: '#ef4444', warnaText: '#7f1d1d', ikon: '🚨', keterangan: 'Surat Amaran 3 dikeluarkan. Kes serius. Murid dirujuk kaunselor dan intervensi khusus dilaksanakan.' },
  { tahap: 4, label: 'Buang Sekolah', warna: '#7c3aed', warnaText: '#2e1065', ikon: '🚫', keterangan: 'Proses buang sekolah dijalankan mengikut prosedur penuh KPM. Kes dirujuk PPD/JPN. Dokumentasi lengkap wajib.' }
];

function tentukTahapAmaran(jumlahHari, hariKonsekutif) {
  if (jumlahHari >= 60 || hariKonsekutif >= 31) return 4;
  if (jumlahHari >= 40 || hariKonsekutif >= 17) return 3;
  if (jumlahHari >= 20 || hariKonsekutif >= 10) return 2;
  if (jumlahHari >= 10 || hariKonsekutif >= 3) return 1;
  return 0;
}

function kiraTidakHadirMurid(allRows) {
  const map = {};
  const statusAbsent = ['Tidak Hadir', 'Ponteng'];
  allRows.forEach(function(r) {
    if (!r.nama || r.nama.toLowerCase() === 'nama') return;
    const key = (r.nama + '|' + r.kelas).toLowerCase();
    if (!map[key]) map[key] = { nama: r.nama, kelas: r.kelas, telefon: r.telefon || '', tarikhAbsent: [], tarikhAll: [] };
    if (r.tarikh) {
      map[key].tarikhAll.push({ tarikh: r.tarikh, status: r.status });
      if (statusAbsent.includes(r.status) && !map[key].tarikhAbsent.includes(r.tarikh)) {
        map[key].tarikhAbsent.push(r.tarikh);
      }
    }
    if (r.telefon && !map[key].telefon) map[key].telefon = r.telefon;
  });
  Object.values(map).forEach(function(m) {
    m.jumlahHari = m.tarikhAbsent.length;
    const sorted = m.tarikhAll.slice().sort(function(a, b) { return a.tarikh < b.tarikh ? -1 : a.tarikh > b.tarikh ? 1 : 0; });
    let maxStreak = 0, streak = 0;
    sorted.forEach(function(d) {
      if (['Tidak Hadir', 'Ponteng'].includes(d.status)) { streak++; if (streak > maxStreak) maxStreak = streak; }
      else { streak = 0; }
    });
    m.hariKonsekutif = maxStreak;
    m.tahap = tentukTahapAmaran(m.jumlahHari, m.hariKonsekutif);
    m.tahapInfo = TAHAP_AMARAN_INFO[m.tahap];
  });
  return map;
}

async function loadAmaranKehadiran() {
  const container = document.getElementById('amaranKehadiranBody');
  const statsDiv = document.getElementById('amaranKehadiranStats');
  if (!container) return;
  container.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--muted)">Menganalisis data kehadiran semua murid...</td></tr>';
  if (statsDiv) statsDiv.innerHTML = '';
  try {
    const data = await callWorker({ action: 'readSheet', sheetKey: 'KEHADIRAN_MURID' });
    if (!data.success) throw new Error(data.error || 'Gagal membaca data');
    const allRows = (data.rows || []).map(parseKehadiranMuridRow).filter(function(r) { return r.nama && r.nama.toLowerCase() !== 'nama'; });
    if (!allRows.length) { container.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--muted)">Tiada data kehadiran</td></tr>'; return; }
    const muridMap = kiraTidakHadirMurid(allRows);
    const allMurid = Object.values(muridMap);
    const muridAmaran = allMurid.filter(function(m) { return m.tahap > 0; }).sort(function(a, b) { return b.tahap - a.tahap || b.jumlahHari - a.jumlahHari; });
    const counts = [0, 0, 0, 0, 0];
    allMurid.forEach(function(m) { counts[m.tahap]++; });
    if (statsDiv) {
      statsDiv.innerHTML =
        '<div class="stat-card"><div class="stat-icon amber"><span style="font-size:1rem">⚠️</span></div><div class="stat-info"><small>Amaran 1</small><strong>' + counts[1] + '</strong></div></div>' +
        '<div class="stat-card"><div class="stat-icon red"><span style="font-size:1rem">🔶</span></div><div class="stat-info"><small>Amaran 2</small><strong>' + counts[2] + '</strong></div></div>' +
        '<div class="stat-card"><div class="stat-icon red"><span style="font-size:1rem">🚨</span></div><div class="stat-info"><small>Amaran 3</small><strong>' + counts[3] + '</strong></div></div>' +
        '<div class="stat-card"><div class="stat-icon" style="background:rgba(124,58,237,0.12)"><span style="font-size:1rem">🚫</span></div><div class="stat-info"><small>Buang Sekolah</small><strong>' + counts[4] + '</strong></div></div>';
    }
    if (!muridAmaran.length) { container.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--muted)">Tiada murid memerlukan surat amaran pada masa ini.</td></tr>'; showToast('Tiada murid yang perlu amaran.', 'success'); return; }
    container.innerHTML = muridAmaran.map(function(m) {
      const info = m.tahapInfo;
      const bs = 'background:' + info.warna + '22;color:' + info.warnaText + ';border:1px solid ' + info.warna + ';padding:2px 8px;border-radius:12px;font-size:0.78rem;font-weight:700';
      return '<tr>' +
        '<td data-label="Nama Murid"><strong>' + escapeHtml(m.nama) + '</strong></td>' +
        '<td data-label="Kelas"><span class="badge badge-blue">' + escapeHtml(m.kelas) + '</span></td>' +
        '<td data-label="Jumlah Hari" style="font-weight:700;color:#ef4444">' + m.jumlahHari + ' hari</td>' +
        '<td data-label="Berturut" style="font-size:0.9rem">' + m.hariKonsekutif + ' hari</td>' +
        '<td data-label="Tahap"><span style="' + bs + '">' + info.ikon + ' ' + info.label + '</span></td>' +
        '<td data-label="Tindakan" style="display:flex;gap:6px;flex-wrap:wrap">' +
          '<button class="btn btn-sm" style="background:var(--blue,#1a4fa0);color:#fff" onclick=\'pratinjauSuratAmaran(' + JSON.stringify(m.nama) + ',' + JSON.stringify(m.kelas) + ',' + JSON.stringify(m.telefon) + ',' + m.tahap + ',' + m.jumlahHari + ',' + m.hariKonsekutif + ')\'>📄 Pratinjau</button>' +
          (m.telefon ? '<button class="btn btn-sm btn-success" onclick=\'hantarPDFSuratAmaran(' + JSON.stringify(m.nama) + ',' + JSON.stringify(m.kelas) + ',' + JSON.stringify(m.telefon) + ',' + m.tahap + ',' + m.jumlahHari + ',' + m.hariKonsekutif + ')\'>📨 Pautan Surat ke WA</button>' : '') +
        '</td></tr>';
    }).join('');
    showToast(muridAmaran.length + ' murid memerlukan tindakan amaran.', 'warning');
  } catch(e) {
    container.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--red)">' + escapeHtml(e.message) + '</td></tr>';
    showToast('Ralat analisis amaran: ' + e.message, 'error');
  }
}

// ── Konfigurasi Surat Amaran ──────────────────────────────────────────────
function getAmaranSekolahConfig() {
  return {
    nama:      localStorage.getItem('AMARAN_CFG_NAMA')    || 'SEKOLAH KEBANGSAAN KIANDONGO',
    alamat1:   localStorage.getItem('AMARAN_CFG_ALAMAT1') || 'PETI SURAT 123, 89357 KIANDONGO,',
    alamat2:   localStorage.getItem('AMARAN_CFG_ALAMAT2') || 'KUNAK, SABAH.',
    tel:       localStorage.getItem('AMARAN_CFG_TEL')     || '089-873123',
    emel:      localStorage.getItem('AMARAN_CFG_EMEL')    || 'xba1234@moe.edu.my',
    guruBesar: localStorage.getItem('AMARAN_CFG_GB')      || 'NAMA GURU BESAR',
    rujukan:   localStorage.getItem('AMARAN_CFG_RUJUKAN') || 'SKKNDGO.700-7/1/2'
  };
}
async function getGuruBesarNameFromData() {
  try {
    const gurus = await getGuruList();
    const gb = (gurus || []).find(function(guru) {
      return String(guru && guru.jawatan || '').toLowerCase().includes('guru besar');
    });
    return String(gb && gb.nama || '').trim();
  } catch(e) {
    return '';
  }
}
async function getAmaranSekolahConfigAsync() {
  var cfg = getAmaranSekolahConfig();
  var namaGb = await getGuruBesarNameFromData();
  if (namaGb) cfg.guruBesar = namaGb;
  return cfg;
}
function simpanAmaranSekolahConfig() {
  var map = { AMARAN_CFG_NAMA:'cfg-amaran-nama', AMARAN_CFG_ALAMAT1:'cfg-amaran-alamat1', AMARAN_CFG_ALAMAT2:'cfg-amaran-alamat2', AMARAN_CFG_TEL:'cfg-amaran-tel', AMARAN_CFG_EMEL:'cfg-amaran-emel', AMARAN_CFG_GB:'cfg-amaran-gb', AMARAN_CFG_RUJUKAN:'cfg-amaran-rujukan' };
  Object.keys(map).forEach(function(k) { var el = document.getElementById(map[k]); if (el) localStorage.setItem(k, el.value.trim()); });
  showToast('Konfigurasi surat amaran disimpan.', 'success');
}
function muatAmaranSekolahConfigUI() {
  var cfg = getAmaranSekolahConfig();
  var map = { 'cfg-amaran-nama':'nama','cfg-amaran-alamat1':'alamat1','cfg-amaran-alamat2':'alamat2','cfg-amaran-tel':'tel','cfg-amaran-emel':'emel','cfg-amaran-gb':'guruBesar','cfg-amaran-rujukan':'rujukan' };
  Object.keys(map).forEach(function(id) { var el = document.getElementById(id); if (el) el.value = cfg[map[id]]; });
}

// ── Logo loader ───────────────────────────────────────────────────────────
var _amaranLogoKPM = null, _amaranLogoSekolah = null, _amaranCopSekolah = null;
var AMARAN_ASSET_VERSION = 'surat-amaran-kpm-20260504';
function _blobToBase64(blob) {
  return new Promise(function(resolve) { var r = new FileReader(); r.onload = function(){ resolve(r.result); }; r.onerror = function(){ resolve(''); }; r.readAsDataURL(blob); });
}
async function muatLogoSuratAmaran() {
  if (_amaranLogoKPM !== null && _amaranLogoSekolah !== null && _amaranCopSekolah !== null) return;
  var results = await Promise.all([
    fetch('./assets/logo.png?v=' + AMARAN_ASSET_VERSION, { cache: 'reload' }).then(function(r){ return r.blob(); }).then(_blobToBase64).catch(function(){ return ''; }),
    fetch('./assets/sk-kiandongo-logo.png?v=' + AMARAN_ASSET_VERSION, { cache: 'reload' }).then(function(r){ return r.blob(); }).then(_blobToBase64).catch(function(){ return ''; }),
    fetch('./assets/cop-sekolah.png?v=' + AMARAN_ASSET_VERSION, { cache: 'reload' }).then(function(r){ return r.blob(); }).then(_blobToBase64).catch(function(){ return ''; })
  ]);
  _amaranLogoKPM = results[0] || ''; _amaranLogoSekolah = results[1] || ''; _amaranCopSekolah = results[2] || '';
}

// ── Jana HTML Surat Amaran (format rasmi KPM) ────────────────────────────
function janaHtmlSuratAmaran(nama, kelas, telefon, tahap, jumlahHari, hariKonsekutif, opts, logos) {
  var cfg = (opts && opts.config) || getAmaranSekolahConfig();
  var lg = logos || {};
  var tahun = new Date().getFullYear();
  var tarikhHariIni = new Date().toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' });
  var noPrint = opts && opts.noPrint;
  var tajukMap = { 1:'SURAT AMARAN PERTAMA KETIDAKHADIRAN MURID', 2:'SURAT AMARAN KEDUA KETIDAKHADIRAN MURID', 3:'SURAT AMARAN KETIGA KETIDAKHADIRAN MURID (TINDAKAN SERIUS)', 4:'NOTIS TINDAKAN BUANG SEKOLAH' };
  var perMap   = { 1:'SURAT AMARAN PERTAMA KETIDAKHADIRAN MURID KE SEKOLAH', 2:'SURAT AMARAN KEDUA KETIDAKHADIRAN MURID KE SEKOLAH', 3:'SURAT AMARAN KETIGA KETIDAKHADIRAN MURID (TINDAKAN SERIUS)', 4:'NOTIS TINDAKAN BUANG SEKOLAH' };
  var rujMap   = { 1:'01', 2:'02', 3:'03', 4:'04' };
  var tajuk = tajukMap[tahap] || tajukMap[1];
  var perHeading = perMap[tahap] || perMap[1];
  var rujukan = cfg.rujukan + ' (' + (rujMap[tahap] || '01') + '/' + tahun + ')';
  var pRow = function(n, txt) { return '<p class="p-row"><span class="p-num">' + n + '.</span><span class="p-txt">' + txt + '</span></p>'; };
  var paraMap = {
    1: pRow(1,'Dengan segala hormatnya perkara di atas dirujuk.') +
       pRow(2,'Dimaklumkan bahawa anak tuan/puan, <strong>' + escapeHtml(nama) + '</strong>, dari kelas ' + escapeHtml(kelas) + ' telah tidak hadir ke sekolah tanpa sebab munasabah selama tiga (3) hari berturut-turut atau sepuluh (10) hari secara tidak berturut-turut.') +
       pRow(3,'Sehubungan itu, pihak sekolah memandang serius perkara ini dan berharap agar tuan/puan dapat memastikan kehadiran anak ke sekolah adalah konsisten.') +
       pRow(4,'Kerjasama tuan/puan untuk memaklumkan sebab ketidakhadiran serta mengambil tindakan segera amat dihargai.'),
    2: pRow(1,'Dengan segala hormatnya perkara di atas dirujuk.') +
       pRow(2,'Dimaklumkan bahawa anak tuan/puan, <strong>' + escapeHtml(nama) + '</strong> masih gagal hadir ke sekolah walaupun Surat Amaran Pertama telah dikeluarkan.') +
       pRow(3,'Ketidakhadiran ini telah mencapai <strong>' + jumlahHari + ' hari</strong> terkumpul / tambahan sebepas Amaran 1 dan amat membimbangkan.') +
       pRow(4,'Sehubungan itu, tuan/puan dikehendaki hadir ke sekolah untuk sesi perbincangan bagi tindakan lanjut seperti butiran berikut:') +
       '<div class="indent"><span class="ind-lbl">Tarikh</span><span class="ind-col">:</span><span class="ind-val">&nbsp;</span></div>' +
       '<div class="indent"><span class="ind-lbl">Masa</span><span class="ind-col">:</span><span class="ind-val">&nbsp;</span></div>' +
       '<div class="indent"><span class="ind-lbl">Tempat</span><span class="ind-col">:</span><span class="ind-val">Pejabat Sekolah</span></div>' +
       '<p class="p-row" style="margin-top:8px"><span class="p-num">5.</span><span class="p-txt">Kehadiran tuan/puan adalah penting bagi membincangkan langkah intervensi demi kebajikan anak tuan/puan.</span></p>',
    3: pRow(1,'Dengan segala hormatnya perkara di atas dirujuk.') +
       pRow(2,'Walaupun pelbagai peringatan dan tindakan telah diambil, anak tuan/puan, <strong>' + escapeHtml(nama) + '</strong> masih tidak hadir ke sekolah tanpa sebab munasabah.') +
       pRow(3,'Ketidakhadiran kini telah mencapai tahap kritikal dan boleh membawa kepada tindakan disiplin termasuk cadangan buang sekolah mengikut peraturan yang ditetapkan oleh Kementerian Pendidikan Malaysia.') +
       pRow(4,'Sehubungan itu, tuan/puan diminta hadir ke sekolah dengan segera untuk sesi perbincangan bersama pihak pentadbir.'),
    4: pRow(1,'Dengan segala hormatnya perkara di atas dirujuk.') +
       pRow(2,'Dimaklumkan bahawa anak tuan/puan, <strong>' + escapeHtml(nama) + '</strong> telah direkodkan tidak hadir ke sekolah sebanyak <strong>' + jumlahHari + ' hari</strong> tanpa sebab munasabah sepanjang tahun ' + tahun + '.') +
       pRow(3,'Pihak sekolah telah mengeluarkan tiga (3) surat amaran berturut-turut namun tiada penambahbaikan yang nyata dalam kehadiran murid tersebut.') +
       pRow(4,'Sehubungan itu, pihak sekolah akan memulakan proses tindakan buang sekolah mengikut prosedur yang ditetapkan oleh Kementerian Pendidikan Malaysia dan kes ini akan dirujuk kepada PPD/JPN.')
  };
  var isi = paraMap[tahap] || paraMap[1];
  var logoKPMTag = lg.kpm ? '<img src="' + lg.kpm + '" class="hdr-logo hdr-logo-kpm" alt="Kementerian Pendidikan Malaysia">' : '<div class="hdr-logo-ph"></div>';
  var logoSkTag  = lg.sekolah ? '<img src="' + lg.sekolah + '" class="hdr-logo" alt="Sekolah">' : '<div class="hdr-logo-ph"></div>';
  var copTag = lg.cop ? '<img src="' + lg.cop + '" class="cop-img" alt="Cop Sekolah">' : '';
  var CSS = '*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Times New Roman",Times,serif;font-size:12pt;color:#000;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}.paper{max-width:210mm;margin:0 auto;padding:18mm 20mm 14mm 25mm;min-height:297mm}.hdr{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:4px}.hdr-logo{width:90px;height:90px;object-fit:contain;flex-shrink:0}.hdr-logo-kpm{width:115px;height:90px}.hdr-logo-ph{width:90px;height:90px;flex-shrink:0}.hdr-mid{flex:1;text-align:center;line-height:1.55}.hdr-sekolah{font-size:13.5pt;font-weight:bold;text-transform:uppercase;letter-spacing:.01em}.hdr-info{font-size:10.5pt;margin-top:3px}.hdr-rule{border:none;border-top:2.5px solid #000;margin:5px 0 0}.tajuk{text-align:center;font-size:13pt;font-weight:bold;text-transform:uppercase;text-decoration:underline;margin:12px 0 14px}.ref-blk{display:flex;flex-direction:column;align-items:flex-end;margin-bottom:14px}.ref-row{display:flex;margin-bottom:3px;font-size:11.5pt;width:300px}.ref-lbl{width:82px;flex-shrink:0}.ref-col{width:16px;text-align:center}.ref-val{flex:1}.kepada{margin-bottom:14px;font-size:11.5pt;line-height:1.85}.salam{margin-bottom:10px;font-size:11.5pt}.per{font-size:11.5pt;font-weight:bold;text-decoration:underline;margin-bottom:12px}.body-paras{font-size:11.5pt;line-height:1.8}.p-row{display:flex;margin-bottom:9px}.p-num{width:22px;flex-shrink:0}.p-txt{flex:1}.indent{display:flex;margin:3px 0 3px 22px;font-size:11.5pt}.ind-lbl{width:70px;flex-shrink:0}.ind-col{width:14px}.ind-val{flex:1;border-bottom:1px solid #000;min-width:100px}.closing{margin:14px 0 4px;font-size:11.5pt}.berkhidmat{font-size:11.5pt;font-weight:bold;font-style:italic;margin:4px 0 10px}.yang-amanah{font-size:11.5pt}.sign-section{display:flex;justify-content:space-between;align-items:flex-end;margin-top:14px}.sign-left{font-size:11.5pt}.sign-dots{letter-spacing:1px;margin:44px 0 2px}.sign-name{font-weight:bold}.cop-box{min-width:110px;width:120px;height:92px;display:flex;align-items:center;justify-content:center}.cop-img{max-width:118px;max-height:90px;object-fit:contain}.footer-note{font-size:8.5pt;color:#444;font-style:italic;margin-top:18px;padding-top:6px;border-top:1px solid #999;text-align:center}@media print{body{font-size:11pt}.paper{padding:14mm 18mm 12mm 22mm}}';
  return '<!DOCTYPE html><html lang="ms"><head><meta charset="UTF-8"><title>' + escapeHtml(tajuk) + ' - ' + escapeHtml(nama) + '</title><style>' + CSS + '</style></head><body>' +
    '<div class="paper">' +
    '<div class="hdr">' + logoKPMTag + '<div class="hdr-mid"><div class="hdr-sekolah">' + escapeHtml(cfg.nama) + '</div><div class="hdr-info">' + escapeHtml(cfg.alamat1) + '<br>' + escapeHtml(cfg.alamat2) + '<br>TEL : ' + escapeHtml(cfg.tel) + '<br>E-MEL : ' + escapeHtml(cfg.emel) + '</div></div>' + logoSkTag + '</div>' +
    '<hr class="hdr-rule">' +
    '<div class="tajuk">' + escapeHtml(tajuk) + '</div>' +
    '<div class="ref-blk"><div class="ref-row"><span class="ref-lbl">Ruj. Kami</span><span class="ref-col">:</span><span class="ref-val">' + escapeHtml(rujukan) + '</span></div><div class="ref-row"><span class="ref-lbl">Tarikh</span><span class="ref-col">:</span><span class="ref-val">' + tarikhHariIni + '</span></div></div>' +
    '<div class="kepada">Kepada:<br>Ibu Bapa / Penjaga<br><strong>' + escapeHtml(nama) + '</strong><br>' + escapeHtml(kelas) + '</div>' +
    '<div class="salam">Tuan/Puan,</div>' +
    '<div class="per">PER: ' + escapeHtml(perHeading) + '</div>' +
    '<div class="body-paras">' + isi + '</div>' +
    '<div class="closing">Sekian, terima kasih.</div>' +
    '<div class="berkhidmat">"BERKHIDMAT UNTUK NEGARA"</div>' +
    '<div class="yang-amanah">Yang menjalankan amanah,</div>' +
    '<div class="sign-section"><div class="sign-left"><div class="sign-dots">.............................................</div><div class="sign-name">(' + escapeHtml(cfg.guruBesar) + ')</div><div>Guru Besar</div><div>' + escapeHtml(cfg.nama) + '</div></div><div class="cop-box">' + copTag + '</div></div>' +
    '<div class="footer-note">Nota: Surat ini adalah cetakan komputer dan tidak memerlukan tandatangan basah sekiranya dicetak melalui sistem rasmi sekolah.</div>' +
    '</div>' + (noPrint ? '' : '<script>window.onload=function(){window.print();};<\/script>') + '</body></html>';
}

async function pratinjauSuratAmaran(nama, kelas, telefon, tahap, jumlahHari, hariKonsekutif) {
  const info = TAHAP_AMARAN_INFO[tahap] || TAHAP_AMARAN_INFO[1];
  const modal = document.getElementById('modalPratinjauSuratAmaran');
  const frame = document.getElementById('framePratinjauSuratAmaran');
  const title = document.getElementById('modalPratinjauSuratAmaranTitle');
  if (!modal || !frame) return;
  if (title) title.textContent = info.ikon + ' ' + info.label + ' — ' + nama + ' (' + kelas + ')';
  modal.dataset.nama = nama; modal.dataset.kelas = kelas; modal.dataset.telefon = telefon || '';
  modal.dataset.tahap = String(tahap); modal.dataset.jumlahHari = String(jumlahHari); modal.dataset.hariKonsekutif = String(hariKonsekutif || 0);
  modal.style.display = 'flex';
  frame.srcdoc = '<div style="font-family:sans-serif;padding:24px;color:#555">Memuatkan logo dan surat...</div>';
  await muatLogoSuratAmaran();
  const cfg = await getAmaranSekolahConfigAsync();
  const html = janaHtmlSuratAmaran(nama, kelas, telefon, tahap, jumlahHari, hariKonsekutif || 0, { config: cfg }, { kpm: _amaranLogoKPM, sekolah: _amaranLogoSekolah, cop: _amaranCopSekolah });
  try { frame.srcdoc = html; } catch(e) { const doc = frame.contentDocument || frame.contentWindow.document; doc.open(); doc.write(html); doc.close(); }
}

function tutupModalPratinjauSuratAmaran() {
  const modal = document.getElementById('modalPratinjauSuratAmaran');
  if (modal) modal.style.display = 'none';
}

async function cetakSuratAmaranDariModal() {
  const modal = document.getElementById('modalPratinjauSuratAmaran');
  if (!modal) return;
  await muatLogoSuratAmaran();
  const cfg = await getAmaranSekolahConfigAsync();
  const html = janaHtmlSuratAmaran(modal.dataset.nama, modal.dataset.kelas, modal.dataset.telefon, parseInt(modal.dataset.tahap), parseInt(modal.dataset.jumlahHari), parseInt(modal.dataset.hariKonsekutif), { config: cfg }, { kpm: _amaranLogoKPM, sekolah: _amaranLogoSekolah, cop: _amaranCopSekolah });
  const win = window.open('', '_blank');
  if (!win) { showToast('Sila benarkan popup untuk mencetak surat.', 'error'); return; }
  win.document.write(html); win.document.close();
}

async function hantarNotifSuratAmaran(nama, kelas, telefon, tahap, jumlahHari) {
  if (!telefon) { showToast('Tiada nombor telefon wali untuk ' + nama, 'error'); return; }
  const info = TAHAP_AMARAN_INFO[tahap] || TAHAP_AMARAN_INFO[1];
  const sekolah = getSchoolTemplateName();
  const tarikhHariIni = new Date().toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' });
  const mesej = '🏫 *' + sekolah + '*\n\n' + info.ikon + ' *' + info.label.toUpperCase() + ' — AMARAN KEHADIRAN*\n\n' +
    'Kepada ibu bapa / penjaga *' + nama + '* (' + kelas + '),\n\n' +
    'Anak jagaan tuan/puan telah direkodkan *tidak hadir sebanyak ' + jumlahHari + ' hari* pada tahun ini dan telah mencapai tahap *' + info.label + '*.\n\n' +
    '*Tindakan diperlukan:*\n' + info.keterangan + '\n\n' +
    'Sila hubungi pihak sekolah untuk maklumat lanjut.\n\n📅 ' + tarikhHariIni;
  try {
    const resp = await callFonnte(telefon, mesej);
    if (resp.status === true || resp.status === 'true') {
      showToast('Notifikasi ' + info.label + ' berjaya dihantar kepada wali ' + nama, 'success');
      logNotif(info.label + ' Kehadiran', telefon, mesej, 'Berjaya');
    } else {
      showToast('Gagal hantar notifikasi: ' + JSON.stringify(resp), 'error');
    }
  } catch(e) { showToast('Ralat hantar notifikasi: ' + e.message, 'error'); }
}

async function insertDummyDataAmaranLegacy() {
  const btn = event && event.target;
  if (btn) { btn.disabled = true; btn.textContent = 'Memasukkan...'; }
  const guruEmail = (APP.user && APP.user.email) ? APP.user.email : 'ujian@sekolah.edu.my';
  const tahun = new Date().getFullYear();
  // 12 hari tidak hadir → Amaran 1 (≥10 hari)
  const tarikhList = [
    tahun + '-01-06', tahun + '-01-07', tahun + '-01-08',
    tahun + '-01-13', tahun + '-01-14', tahun + '-01-20',
    tahun + '-02-03', tahun + '-02-10', tahun + '-02-17',
    tahun + '-03-03', tahun + '-03-10', tahun + '-03-17'
  ];
  const rows = tarikhList.map(function(tarikh) {
    return ['[UJIAN] Ali bin Abu', '4 MUTIARA', tarikh, 'Tidak Hadir', '60123456789', 'Data ujian amaran', guruEmail];
  });
  try {
    let ok = 0;
    for (const row of rows) {
      const res = await callWorker({ action: 'appendRow', sheetKey: 'KEHADIRAN_MURID', row: row });
      if (res.success) ok++;
      await sleep(200);
    }
    showToast(ok + ' rekod ujian berjaya dimasukkan. Klik "Semak Amaran" untuk lihat hasilnya.', 'success');
    await loadAmaranKehadiran();
  } catch(e) {
    showToast('Gagal masukkan data ujian: ' + e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<svg class="lucide-icon" width="14" height="14"><use href="#lucide-flask-conical"></use></svg> Masuk Data Ujian'; }
  }
}

async function buangDummyDataAmaran() {
  try {
    const data = await callWorker({ action: 'readSheet', sheetKey: 'KEHADIRAN_MURID' });
    if (!data.success) throw new Error(data.error);
    const allRows = data.rows || [];
    // Kekal baris header + baris BUKAN [UJIAN]
    const filtered = allRows.filter(function(r) {
      const nama = String(Array.isArray(r) ? (r[3] || r[0] || '') : '');
      return !nama.toLowerCase().startsWith('[ujian]');
    });
    if (filtered.length === allRows.length) { showToast('Tiada data ujian untuk dibuang.', 'info'); return false; }
    const res = await callWorker({ action: 'replaceSheet', sheetKey: 'KEHADIRAN_MURID', rows: filtered });
    if (!res.success) throw new Error(res.error);
    showToast((allRows.length - filtered.length) + ' rekod ujian dibuang.', 'success');
    return true;
  } catch(e) {
    showToast('Gagal buang data ujian: ' + e.message, 'error');
    return false;
  }
}

async function insertDummyDataAmaran() {
  const btn = event && event.target;
  if (btn) { btn.disabled = true; btn.textContent = 'Memasukkan...'; }
  const guruEmail = (APP.user && APP.user.email) ? APP.user.email : 'ujian@sekolah.edu.my';
  const tahun = new Date().getFullYear();
  const pad = function(n) { return String(n).padStart(2, '0'); };
  const janaTarikh = function(month, count) {
    const dates = [];
    for (let i = 1; i <= count; i++) {
      dates.push(tahun + '-' + pad(month + Math.floor((i - 1) / 25)) + '-' + pad(((i - 1) % 25) + 1));
    }
    return dates;
  };
  // Semua tarikh mesti lepas (sebelum hari ini) — Jana dalam tahun semasa, bulan 1-4 sahaja
  // Tahap 1: ≥10 hari | Tahap 2: ≥20 | Tahap 3: ≥40 | Tahap 4 (Buang): ≥60
  const senaraiUjian = [
    { nama: '[UJIAN] Ali bin Abu', kelas: '4 MUTIARA', telefon: '60123456789', hari: 12, bulan: 1, catatan: 'Data ujian Amaran 1' },
    { nama: '[UJIAN] Balan anak Bujang', kelas: '5 DELIMA', telefon: '60123456780', hari: 22, bulan: 1, catatan: 'Data ujian Amaran 2' },
    { nama: '[UJIAN] Chong Mei Lin', kelas: '6 BAIDURI', telefon: '60123456781', hari: 42, bulan: 1, catatan: 'Data ujian Amaran 3' },
    { nama: '[UJIAN] Dayang Nur Aina', kelas: '3 KRISTAL', telefon: '60123456782', hari: 62, bulan: 1, catatan: 'Data ujian Buang Sekolah' }
  ];
  const rows = [];
  senaraiUjian.forEach(function(item) {
    janaTarikh(item.bulan, item.hari).forEach(function(tarikh) {
      rows.push([item.nama, item.kelas, tarikh, 'Tidak Hadir', item.telefon, item.catatan, guruEmail]);
    });
  });
  try {
    // Buang data ujian lama dahulu untuk elak duplicate error
    if (btn) btn.textContent = 'Semak data lama...';
    await buangDummyDataAmaran();
    if (btn) btn.textContent = 'Memasukkan ' + rows.length + ' rekod...';
    const res = await callWorker({ action: 'appendRows', sheetKey: 'KEHADIRAN_MURID', rows: rows });
    if (res.success) {
      showToast(rows.length + ' rekod ujian (4 tahap amaran) berjaya dimasukkan.', 'success');
      await loadAmaranKehadiran();
    } else {
      throw new Error(res.error || 'Gagal menyimpan rekod.');
    }
  } catch(e) {
    showToast('Gagal masukkan data ujian: ' + e.message, 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<svg class="lucide-icon" width="14" height="14"><use href="#lucide-flask-conical"></use></svg> Masuk Data Ujian'; }
  }
}

async function hantarAmaranKeGroupUjian() {
  const testGroup = String(hlConfig.fonnteTestGroup || '120363423994004887@g.us').trim();
  showToast('Mengambil data amaran...', 'info');
  try {
    const data = await callWorker({ action: 'readSheet', sheetKey: 'KEHADIRAN_MURID' });
    if (!data.success) throw new Error(data.error || 'Gagal membaca data');
    const allRows = (data.rows || []).map(parseKehadiranMuridRow).filter(function(r) { return r.nama && r.nama.toLowerCase() !== 'nama'; });
    const muridMap = kiraTidakHadirMurid(allRows);
    const muridAmaran = Object.values(muridMap).filter(function(m) { return m.tahap > 0; }).sort(function(a, b) { return b.tahap - a.tahap || b.jumlahHari - a.jumlahHari; });
    if (!muridAmaran.length) { showToast('Tiada murid yang perlu amaran.', 'info'); return; }
    var cfg = await getAmaranSekolahConfigAsync();
    var tarikh = new Date().toLocaleDateString('ms-MY', { day: '2-digit', month: 'long', year: 'numeric' });
    showToast('Jana dan hantar ' + muridAmaran.length + ' surat amaran ke group ujian...', 'info');
    var sent = 0, failed = 0;
    for (var i = 0; i < muridAmaran.length; i++) {
      var m = muridAmaran[i];
      try {
        showToast('Jana surat ' + (i + 1) + '/' + muridAmaran.length + ' — ' + m.nama + '...', 'info');
        var caption = janaCaptionMediaSuratAmaran(m, cfg, tarikh);
        var filename = 'SuratAmaran_' + m.tahapInfo.label.replace(/\s+/g, '') + '_' + m.nama.replace(/[^a-zA-Z0-9]/g, '_') + '.jpg';
        var blob = await janaImejSuratAmaran(m.nama, m.kelas, m.telefon, m.tahap, m.jumlahHari, m.hariKonsekutif);
        showToast('Hantar pautan surat ' + (i + 1) + '/' + muridAmaran.length + ' — ' + m.nama + '...', 'info');
        var linkResult = await sendFonnteLetterLink(testGroup, caption, blob, filename);
        sent++;
        logNotif(m.tahapInfo.label + ' GroupUjian', testGroup, caption + '\n\nPautan: ' + linkResult.url, 'Berjaya');
        await sleep(1500);
      } catch(err) { failed++; console.error('Gagal hantar untuk ' + m.nama + ':', err); showToast('Gagal ' + m.nama + ': ' + (err && err.message ? err.message : 'Ralat tidak diketahui'), 'error'); }
    }
    showToast('Selesai! Surat dihantar: ' + sent + '/' + muridAmaran.length + (failed > 0 ? ' (' + failed + ' gagal)' : ''), sent > 0 ? 'success' : 'error');
  } catch(e) { showToast('Ralat: ' + e.message, 'error'); }
}

function janaWATeksSuratAmaran(m, cfg, tarikh) {
  var info = m.tahapInfo;
  var garis = '━━━━━━━━━━━━━━━━━━━━━━━━━━';
  var rujukan = cfg.rujukan + '/' + new Date().getFullYear();
  var paraUtama = {
    1: 'Dimaklumkan bahawa anak/jagaan tuan/puan telah *tidak hadir ke sekolah tanpa sebab yang munasabah* sebanyak *' + m.jumlahHari + ' hari* sehingga tarikh surat ini.\n\nTuan/Puan dipohon mengambil perhatian serius dan memastikan kehadiran anak/jagaan tuan/puan pada setiap hari persekolahan.',
    2: 'Dimaklumkan bahawa anak/jagaan tuan/puan telah *tidak hadir ke sekolah tanpa sebab yang munasabah* sebanyak *' + m.jumlahHari + ' hari* sehingga tarikh surat ini.\n\nIni merupakan *amaran kedua* yang dikeluarkan. Tuan/Puan dipohon hadir ke sekolah bersama anak/jagaan tuan/puan untuk sesi perbincangan dengan pihak sekolah.',
    3: 'Dimaklumkan bahawa anak/jagaan tuan/puan telah *tidak hadir ke sekolah tanpa sebab yang munasabah* sebanyak *' + m.jumlahHari + ' hari* sehingga tarikh surat ini.\n\nIni merupakan *amaran ketiga dan muktamad*. Pihak sekolah akan mengambil tindakan selanjutnya termasuk melaporkan kepada Pejabat Pendidikan Daerah.',
    4: 'Dimaklumkan bahawa anak/jagaan tuan/puan telah *tidak hadir ke sekolah tanpa sebab yang munasabah* sebanyak *' + m.jumlahHari + ' hari* sehingga tarikh surat ini.\n\n⛔ *AMARAN TERAKHIR:* Pihak sekolah terpaksa mengemukakan kes ini kepada Pejabat Pendidikan Daerah untuk tindakan lanjut termasuk kemungkinan *dibuang sekolah*.'
  };
  return garis + '\n' +
    '🏫 *' + cfg.nama + '*\n' +
    '_' + cfg.alamat1 + (cfg.alamat2 ? ' ' + cfg.alamat2 : '') + '_\n' +
    '_Tel: ' + cfg.tel + '_\n' +
    garis + '\n\n' +
    'Ruj: ' + rujukan + '\n' +
    'Tarikh: ' + tarikh + '\n\n' +
    '*Kepada:*\n' +
    'Ibu Bapa / Penjaga\n' +
    '_' + m.nama + '_\n' +
    '_Kelas: ' + m.kelas + '_\n\n' +
    garis + '\n' +
    info.ikon + ' *PER: ' + info.label.toUpperCase() + ' KEHADIRAN MURID*\n' +
    garis + '\n\n' +
    'Dengan hormatnya perkara di atas adalah dirujuk.\n\n' +
    (paraUtama[m.tahap] || paraUtama[1]) + '\n\n' +
    'Kerjasama tuan/puan amat dihargai.\n\n' +
    'Sekian, terima kasih.\n\n' +
    garis + '\n' +
    '_Yang menurut perintah,_\n\n' +
    '*' + cfg.guruBesar + '*\n' +
    '_Guru Besar_\n' +
    '_' + cfg.nama + '_\n' +
    garis + '\n' +
    '_📱 Dihantar melalui SmartSchoolHub_';
}

// ══ END SISTEM AMARAN KEHADIRAN MURID ═════════════════════════════════════

function janaCaptionMediaSuratAmaran(m, cfg, tarikh) {
  var info = m.tahapInfo || TAHAP_AMARAN_INFO[m.tahap] || TAHAP_AMARAN_INFO[1];
  return '🏫 *' + cfg.nama + '*\n\n' +
    'Dilampirkan imej surat rasmi *' + info.label + ' Kehadiran* untuk:\n\n' +
    'Nama: *' + m.nama + '*\n' +
    'Kelas: *' + m.kelas + '*\n' +
    'Jumlah tidak hadir: *' + m.jumlahHari + ' hari*\n' +
    'Tarikh: ' + tarikh + '\n\n' +
    'Sila rujuk lampiran surat dan hubungi pihak sekolah untuk tindakan lanjut.';
}

async function loadKehadiranMurid(options) {
  const opts = Object.assign({ silent: false, preserveTable: false, reason: 'manual' }, options || {});
  const tbody = document.getElementById('muridKehadiranBody');
  if (!tbody) return;
  if (_kehadiranMuridLoading) return;
  _kehadiranMuridLoading = true;
  if (!opts.preserveTable || !tbody.children.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--muted);text-align:center;padding:20px">Memuat data kehadiran murid secara langsung...</td></tr>';
  }
  try {
    const data = await callWorker({ action: 'readSheet', sheetKey: 'KEHADIRAN_MURID' });
    if (!data.success) throw new Error(data.error || 'Gagal');
    const filterDate = document.getElementById('muridFilterDate');
    const filterKelas = document.getElementById('muridFilterKelas');
    let rows = (data.rows || []).map(parseKehadiranMuridRow).filter(r => r.nama && r.nama.toLowerCase() !== 'nama');
    if (filterDate && filterDate.value) rows = rows.filter(r => r.tarikh === filterDate.value);
    if (filterKelas && filterKelas.value) rows = rows.filter(r => r.kelas === filterKelas.value);
    const hadir = rows.filter(r => ['Hadir', 'Lewat'].includes(r.status)).length;
    const tidak = rows.filter(r => ['Tidak Hadir', 'Ponteng'].includes(r.status)).length;
    const cuti = rows.filter(r => ['Cuti', 'Sakit'].includes(r.status)).length;
    const pct = rows.length ? Math.round((hadir / rows.length) * 100) : 0;
    setText('murid-stat-hadir', hadir);
    setText('murid-stat-tidak', tidak);
    setText('murid-stat-cuti', cuti);
    setText('murid-stat-pct', rows.length ? pct + '%' : '-');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="color:var(--muted);text-align:center;padding:20px">Tiada rekod</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map((item) => {
      const bolehNotif = ['Tidak Hadir', 'Ponteng'].includes(item.status);
      return '<tr><td data-label="Nama Murid"><strong>' + (item.nama || '-') + '</strong></td><td data-label="Kelas"><span class="badge badge-blue">' + (item.kelas || '-') + '</span></td><td data-label="Tarikh">' + (item.tarikh || '-') + '</td><td data-label="Status">' + statusBadge(item.status) + '</td><td data-label="No. Telefon Wali" style="font-size:0.82rem">' + (item.telefon || '-') + '</td><td data-label="Tindakan" style="display:flex;gap:6px;flex-wrap:wrap">' + (bolehNotif ? '<button class="btn btn-sm btn-success" onclick=\'notifSatuMurid(' + JSON.stringify(item.nama || '') + ',' + JSON.stringify(item.kelas || '') + ',' + JSON.stringify(item.tarikh || '') + ',' + JSON.stringify(item.telefon || '') + ')\'>📩</button>' : '') + '</td></tr>';
    }).join('');
    if (!opts.silent) showToast(rows.length + ' rekod kehadiran murid dikemas kini.', 'success');
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--red);text-align:center;padding:20px">' + escapeHtml(e.message) + '</td></tr>';
    showToast(opts.silent ? 'Paparan live kehadiran murid terganggu: ' + e.message : e.message, 'error');
  } finally {
    _kehadiranMuridLoading = false;
  }
}

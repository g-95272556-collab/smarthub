// ═══════════════════════════════════════════════════════════════
// SMART SCHOOL HUB v2.0 — SK Kiandongo
// app.js — Main Application JavaScript
// ═══════════════════════════════════════════════════════════════

// ── STATE ──────────────────────────────────────────────────────
const APP = {
  user: null,
  workerUrl: localStorage.getItem('ssh_worker_url') || '',
  googleClientId: '553204925712-p975t8hnehd4vfhs3igf4ba9c63edf0f.apps.googleusercontent.com',
  notifLog: JSON.parse(localStorage.getItem('ssh_notif_log') || '[]'),
};

const GEO = {
  lat: 5.3055655, lng: 116.9633906, radius: 200,
  jamHadir: 7, minHadir: 0,
  jamLewat: 7, minLewat: 30,
  jamTidak: 8, minTidak: 0,
  gbTel: '60195363361',
  pkTel: '60193386910',
};

const BULAN = ['','Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];

let _gsiReady = false;
let _domReady = false;
let _geoProfile = null;
let geoCoords = null;
let hlData = JSON.parse(localStorage.getItem('ssh_hl_data') || '[]');
let hlConfig = JSON.parse(localStorage.getItem('ssh_hl_config') || 'null') || {
  tgBot: '8438571330:AAHKj7XFJK80bOgiqUNMzTVhRDjaCNNMMjc',
  tgChat: '-1002152935710',
  tgTopic: '9391',
  fonnteGroup: '60148608242-1434600192@g.us'
};
let _guruData = [];
let _muridData = [];
let _guruFiltered = [];
let _muridFiltered = [];
let _muridCache = {};

let currentAutoRefreshInterval = null;

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
var JADUAL_BERTUGAS_2026 = [{"minggu":1,"isnin":"2026-01-12","guru":"BETTY BINTI JIM","telefon":"01124135966","pembantu":"FAZILAH BINTI ALI","telefonPembantu":"0134461416"},{"minggu":2,"isnin":"2026-01-19","guru":"FAZILAH BINTI ALI","telefon":"0134461416","pembantu":"OKTOVYANTI KOH","telefonPembantu":"0138665663"},{"minggu":3,"isnin":"2026-01-26","guru":"OKTOVYANTI KOH","telefon":"0138665663","pembantu":"STENLEY DOMINIC","telefonPembantu":"01135988995"},{"minggu":4,"isnin":"2026-02-02","guru":"STENLEY DOMINIC","telefon":"01135988995","pembantu":"MOHAMAD KHAIRUL AIMAN BIN MOHAMAD YUSOF","telefonPembantu":"01121792758"},{"minggu":5,"isnin":"2026-02-09","guru":"MOHAMAD KHAIRUL AIMAN BIN MOHAMAD YUSOF","telefon":"01121792758","pembantu":"TAIMAH BINTI ILOK","telefonPembantu":"01123607380"},{"minggu":6,"isnin":"2026-02-16","guru":"TAIMAH BINTI ILOK","telefon":"01123607380","pembantu":"ALOHA BINTI IBIN","telefonPembantu":"0135560671"},{"minggu":7,"isnin":"2026-02-23","guru":"ALOHA BINTI IBIN","telefon":"0135560671","pembantu":"JIDA MINSES","telefonPembantu":"01126605349"},{"minggu":8,"isnin":"2026-03-02","guru":"JIDA MINSES","telefon":"01126605349","pembantu":"BETTY BINTI JIM","telefonPembantu":"01124135966"},{"minggu":9,"isnin":"2026-03-09","guru":"BETTY BINTI JIM","telefon":"01124135966","pembantu":"FAZILAH BINTI ALI","telefonPembantu":"0134461416"},{"minggu":10,"isnin":"2026-03-16","guru":"FAZILAH BINTI ALI","telefon":"0134461416","pembantu":"OKTOVYANTI KOH","telefonPembantu":"0138665663"},{"minggu":12,"isnin":"2026-03-30","guru":"OKTOVYANTI KOH","telefon":"0138665663","pembantu":"STENLEY DOMINIC","telefonPembantu":"01135988995"},{"minggu":13,"isnin":"2026-04-06","guru":"STENLEY DOMINIC","telefon":"01135988995","pembantu":"MOHAMAD KHAIRUL AIMAN BIN MOHAMAD YUSOF","telefonPembantu":"01121792758"},{"minggu":14,"isnin":"2026-04-13","guru":"MOHAMAD KHAIRUL AIMAN BIN MOHAMAD YUSOF","telefon":"01121792758","pembantu":"TAIMAH BINTI ILOK","telefonPembantu":"01123607380"},{"minggu":15,"isnin":"2026-04-20","guru":"TAIMAH BINTI ILOK","telefon":"01123607380","pembantu":"ALOHA BINTI IBIN","telefonPembantu":"0135560671"},{"minggu":16,"isnin":"2026-04-27","guru":"ALOHA BINTI IBIN","telefon":"0135560671","pembantu":"JIDA MINSES","telefonPembantu":"01126605349"},{"minggu":17,"isnin":"2026-05-04","guru":"JIDA MINSES","telefon":"01126605349","pembantu":"BETTY BINTI JIM","telefonPembantu":"01124135966"},{"minggu":18,"isnin":"2026-05-11","guru":"BETTY BINTI JIM","telefon":"01124135966","pembantu":"FAZILAH BINTI ALI","telefonPembantu":"0134461416"},{"minggu":19,"isnin":"2026-05-18","guru":"FAZILAH BINTI ALI","telefon":"0134461416","pembantu":"OKTOVYANTI KOH","telefonPembantu":"0138665663"},{"minggu":22,"isnin":"2026-06-08","guru":"OKTOVYANTI KOH","telefon":"0138665663","pembantu":"STENLEY DOMINIC","telefonPembantu":"01135988995"},{"minggu":23,"isnin":"2026-06-15","guru":"STENLEY DOMINIC","telefon":"01135988995","pembantu":"MOHAMAD KHAIRUL AIMAN BIN MOHAMAD YUSOF","telefonPembantu":"01121792758"},{"minggu":24,"isnin":"2026-06-22","guru":"MOHAMAD KHAIRUL AIMAN BIN MOHAMAD YUSOF","telefon":"01121792758","pembantu":"TAIMAH BINTI ILOK","telefonPembantu":"01123607380"},{"minggu":25,"isnin":"2026-06-29","guru":"TAIMAH BINTI ILOK","telefon":"01123607380","pembantu":"ALOHA BINTI IBIN","telefonPembantu":"0135560671"},{"minggu":26,"isnin":"2026-07-06","guru":"ALOHA BINTI IBIN","telefon":"0135560671","pembantu":"JIDA MINSES","telefonPembantu":"01126605349"},{"minggu":27,"isnin":"2026-07-13","guru":"JIDA MINSES","telefon":"01126605349","pembantu":"BETTY BINTI JIM","telefonPembantu":"01124135966"},{"minggu":28,"isnin":"2026-07-20","guru":"BETTY BINTI JIM","telefon":"01124135966","pembantu":"FAZILAH BINTI ALI","telefonPembantu":"0134461416"},{"minggu":29,"isnin":"2026-07-27","guru":"FAZILAH BINTI ALI","telefon":"0134461416","pembantu":"OKTOVYANTI KOH","telefonPembantu":"0138665663"},{"minggu":30,"isnin":"2026-08-03","guru":"OKTOVYANTI KOH","telefon":"0138665663","pembantu":"STENLEY DOMINIC","telefonPembantu":"01135988995"},{"minggu":31,"isnin":"2026-08-10","guru":"STENLEY DOMINIC","telefon":"01135988995","pembantu":"MOHAMAD KHAIRUL AIMAN BIN MOHAMAD YUSOF","telefonPembantu":"01121792758"},{"minggu":32,"isnin":"2026-08-17","guru":"MOHAMAD KHAIRUL AIMAN BIN MOHAMAD YUSOF","telefon":"01121792758","pembantu":"TAIMAH BINTI ILOK","telefonPembantu":"01123607380"},{"minggu":33,"isnin":"2026-08-24","guru":"TAIMAH BINTI ILOK","telefon":"01123607380","pembantu":"ALOHA BINTI IBIN","telefonPembantu":"0135560671"},{"minggu":35,"isnin":"2026-09-07","guru":"ALOHA BINTI IBIN","telefon":"0135560671","pembantu":"JIDA MINSES","telefonPembantu":"01126605349"},{"minggu":36,"isnin":"2026-09-14","guru":"JIDA MINSES","telefon":"01126605349","pembantu":"BETTY BINTI JIM","telefonPembantu":"01124135966"},{"minggu":37,"isnin":"2026-09-21","guru":"BETTY BINTI JIM","telefon":"01124135966","pembantu":"FAZILAH BINTI ALI","telefonPembantu":"0134461416"},{"minggu":38,"isnin":"2026-09-28","guru":"FAZILAH BINTI ALI","telefon":"0134461416","pembantu":"OKTOVYANTI KOH","telefonPembantu":"0138665663"},{"minggu":39,"isnin":"2026-10-05","guru":"OKTOVYANTI KOH","telefon":"0138665663","pembantu":"STENLEY DOMINIC","telefonPembantu":"01135988995"},{"minggu":40,"isnin":"2026-10-12","guru":"STENLEY DOMINIC","telefon":"01135988995","pembantu":"MOHAMAD KHAIRUL AIMAN BIN MOHAMAD YUSOF","telefonPembantu":"01121792758"},{"minggu":41,"isnin":"2026-10-19","guru":"MOHAMAD KHAIRUL AIMAN BIN MOHAMAD YUSOF","telefon":"01121792758","pembantu":"TAIMAH BINTI ILOK","telefonPembantu":"01123607380"},{"minggu":42,"isnin":"2026-10-26","guru":"TAIMAH BINTI ILOK","telefon":"01123607380","pembantu":"ALOHA BINTI IBIN","telefonPembantu":"0135560671"},{"minggu":43,"isnin":"2026-11-02","guru":"ALOHA BINTI IBIN","telefon":"0135560671","pembantu":"JIDA MINSES","telefonPembantu":"01126605349"},{"minggu":44,"isnin":"2026-11-09","guru":"JIDA MINSES","telefon":"01126605349","pembantu":"BETTY BINTI JIM","telefonPembantu":"01124135966"},{"minggu":45,"isnin":"2026-11-16","guru":"BETTY BINTI JIM","telefon":"01124135966","pembantu":"FAZILAH BINTI ALI","telefonPembantu":"0134461416"},{"minggu":46,"isnin":"2026-11-23","guru":"FAZILAH BINTI ALI","telefon":"0134461416","pembantu":"OKTOVYANTI KOH","telefonPembantu":"0138665663"},{"minggu":47,"isnin":"2026-11-30","guru":"OKTOVYANTI KOH","telefon":"0138665663","pembantu":"STENLEY DOMINIC","telefonPembantu":"01135988995"}];

var _jadualBertugas = (function() {
  var base = JADUAL_BERTUGAS_2026.map(function(j){ return Object.assign({},j); });
  try {
    var s = localStorage.getItem('ssh_jadual_bertugas');
    if (s) {
      var p = JSON.parse(s);
      if (p && p.length) {
        p.forEach(function(item) {
          if (!item.isnin || item.isnin.length !== 10) return;
          var idx = base.findIndex(function(m){ return m.isnin === item.isnin; });
          if (idx >= 0) base[idx] = Object.assign({}, base[idx], item);
          else base.push(item);
        });
      }
    }
  } catch(e) {}
  return base;
})();

// ── Group WA Kelas ───────────────────────
var GROUP_WA_KELAS = JSON.parse(localStorage.getItem('ssh_group_wa_kelas') || 'null') || {
  '1 NILAM':   '120363408263111964@g.us',
  '2 INTAN':   '120363307119469701@g.us',
  '3 KRISTAL': '120363158710638763@g.us',
  '4 MUTIARA': '120363047423182758@g.us',
  '5 DELIMA':  '120363040172356242@g.us',
  '6 BAIDURI': '60195327614-1585453088@g.us'
};
function getGroupKelas(k) { return GROUP_WA_KELAS[k] || ''; }

// ── Kawalan Akses ────────────────────────
var DEFAULT_ADMIN_EMAILS = ['g-69272581@moe-dl.edu.my','g-95272556@moe-dl.edu.my','g-03272560@moe-dl.edu.my','g-87272555@moe-dl.edu.my'];
var MODUL_PENTADBIR = ['data-guru','data-murid','konfigurasi','notifikasi','hari-lahir'];
function getAdminEmails() {
  var emails = [];
  try {
    var stored = JSON.parse(localStorage.getItem('ssh_admin_emails') || 'null');
    if (Array.isArray(stored)) emails = stored.slice();
  } catch(e) {}
  DEFAULT_ADMIN_EMAILS.forEach(function(email) {
    if (!emails.some(function(e){ return e.toLowerCase() === email.toLowerCase(); })) emails.push(email);
  });
  return emails;
}
function saveAdminEmails(emails) {
  localStorage.setItem('ssh_admin_emails', JSON.stringify(emails));
}
function isPentadbir() {
  return APP.user && getAdminEmails().some(function(e){ return e.toLowerCase() === (APP.user.email||'').toLowerCase(); });
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
    return '<tr><td>' + email + '</td>' +
           '<td>' + (isDefault ? 'Admin Lalai' : 'Admin Tambahan') + '</td>' +
           '<td>' + (isDefault ? '-' : '<button class="btn btn-sm btn-danger" onclick="removeAdminEmail(\'' + email + '\')">Buang</button>') + '</td>' +
           '</tr>';
  }).join('');
}
function loadAdminConfig() {
  updateNotifAutoStatusUI();
  updateHLNotifStatusUI();
  renderAdminList();
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
function getIsninMingguIni() {
  var d = new Date(), h = d.getDay();
  // 0=Ahad→esok(+1), 1=Isnin→0, 2=Selasa→-1, ...6=Sabtu→+2
  var diff = h === 0 ? 1 : h === 6 ? 2 : (1 - h);
  var r = new Date(d);
  r.setDate(d.getDate() + diff);
  return formatDateYMD(r);
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
  var dI = new Date(dep+'T00:00:00'), dJ = new Date(dI); dJ.setDate(dI.getDate()+4);
  var jStr = dJ.toISOString().split('T')[0];
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
  if (now.getDay() !== 5 || now.getHours() < 15 || now.getHours() > 17) return;
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
function simpanSemuaGroupKelas() {
  var ids = {'1 NILAM':'grp-1-nilam','2 INTAN':'grp-2-intan','3 KRISTAL':'grp-3-kristal','4 MUTIARA':'grp-4-mutiara','5 DELIMA':'grp-5-delima','6 BAIDURI':'grp-6-baiduri'};
  var map = {};
  Object.keys(ids).forEach(function(k){ map[k] = (document.getElementById(ids[k])||{}).value||''; });
  GROUP_WA_KELAS = map;
  localStorage.setItem('ssh_group_wa_kelas', JSON.stringify(map));
  showToast('Group WA disimpan!', 'success');
}
function loadGroupKelasUI() {
  var ids = {'1 NILAM':'grp-1-nilam','2 INTAN':'grp-2-intan','3 KRISTAL':'grp-3-kristal','4 MUTIARA':'grp-4-mutiara','5 DELIMA':'grp-5-delima','6 BAIDURI':'grp-6-baiduri'};
  Object.keys(ids).forEach(function(k){ var el = document.getElementById(ids[k]); if(el && GROUP_WA_KELAS[k]) el.value = GROUP_WA_KELAS[k]; });
}

// ── Dashboard Functions ───────────────────
async function muatCuaca() {
  try {
    var res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=5.3055655&longitude=116.9633906&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&wind_speed_unit=kmh&timezone=Asia%2FKuala_Lumpur');
    var d = await res.json(); var c = d.current;
    var icons = {0:'☀️',1:'⛅',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',61:'🌧️',71:'❄️',80:'🌧️',95:'⛈️'};
    var descs = {0:'Cerah',1:'Sebahagian berawan',2:'Sebahagian berawan',3:'Berawan',45:'Berkabut',48:'Berkabut',51:'Hujan renyai',61:'Hujan',71:'Salji',80:'Hujan lebat',95:'Ribut petir'};
    var code = c.weather_code||0;
    var icon = icons[code] || (code<=2?'⛅':code<=3?'☁️':code<=49?'🌫️':code<=69?'🌧️':code<=99?'⛈️':'🌤️');
    var desc = descs[code] || (code<=2?'Sebahagian berawan':code<=3?'Berawan':code<=49?'Berkabut':code<=69?'Hujan':'Ribut');
    setText('dash-cuaca-suhu', Math.round(c.temperature_2m)+'C');
    setText('dash-cuaca-desc', desc);
    setText('dash-cuaca-lembap', c.relative_humidity_2m);
    setText('dash-cuaca-angin', Math.round(c.wind_speed_10m));
    setText('dash-cuaca-rasa', Math.round(c.apparent_temperature));
    var ic = $id('dash-cuaca-icon'); if(ic) ic.textContent = icon;
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
    var res = await fetch('https://api.waktusolat.app/v2/solat/SBH07');
    var d = await res.json();
    var now = new Date(), nm = now.getHours()*60+now.getMinutes();
    var today = now.toISOString().split('T')[0].replace(/-/g,'');
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
      var isNext = !next && wm > nm; if(isNext) next = s;
      var st = isNext ? 'font-weight:700;color:#FFD700' : 'opacity:0.88';
      return '<div style="display:flex;justify-content:space-between;'+st+';padding:3px 0"><span>'+(isNext?'&#9658; ':'')+s.nama+'</span><span>'+s.masa+'</span></div>';
    }).join('');
    var le = document.getElementById('dash-solat-list'); if(le) le.innerHTML = html;
    var ne = document.getElementById('dash-solat-seterusnya');
    if(ne) ne.textContent = next ? 'Seterusnya: '+next.nama+' - '+next.masa : 'Semua waktu solat telah berlalu';
  } catch(e) {
    var fb = [{n:'Subuh',m:'05:42'},{n:'Zohor',m:'12:58'},{n:'Asar',m:'16:18'},{n:'Maghrib',m:'18:52'},{n:'Isyak',m:'20:02'}];
    var now2 = new Date(), nm2 = now2.getHours()*60+now2.getMinutes(), nxt = null;
    var h2 = fb.map(function(s){ var p=s.m.split(':'),wm=parseInt(p[0])*60+parseInt(p[1]),isN=!nxt&&wm>nm2; if(isN)nxt=s; var st=isN?'font-weight:700;color:#FFD700':'opacity:0.88'; return '<div style="display:flex;justify-content:space-between;'+st+';padding:3px 0"><span>'+(isN?'&#9658; ':'')+s.n+'</span><span>'+s.m+'</span></div>'; }).join('');
    var le = document.getElementById('dash-solat-list'); if(le) le.innerHTML = h2 + '<div style="font-size:0.65rem;opacity:0.5;margin-top:4px">Anggaran (offline)</div>';
    var ne = document.getElementById('dash-solat-seterusnya'); if(ne) ne.textContent = nxt ? 'Seterusnya: '+nxt.n+' - '+nxt.m : 'Semua telah berlalu';
  }
}

function renderGuruBertugasDash() {
  var now = new Date(), hari = now.getDay(), isHujung = (hari===0||hari===6);
  var isninIni = getIsninMingguIni(), isninDep = getIsninMingguDepan();
  var guruIni = getGuruBertugasMinggu(isninIni), guruDep = getGuruBertugasMinggu(isninDep);
  var dI = new Date(isninIni+'T00:00:00'), dJ = new Date(dI); dJ.setDate(dI.getDate()+4);
  var jumaatIni = dJ.toISOString().split('T')[0];
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

function renderWeeklyChart(todayRows) {
  var wrap = document.getElementById('dashChartWrap'); if(!wrap) return;
  var todayStr = new Date().toISOString().split('T')[0];
  var isnin = new Date(getIsninMingguIni()+'T00:00:00');
  var bars = '';
  for (var i = 0; i < 5; i++) {
    var d = new Date(isnin); d.setDate(isnin.getDate()+i);
    var ds = d.toISOString().split('T')[0];
    var isToday = ds === todayStr, pct = 0;
    if (isToday && todayRows && todayRows.length) {
      var h = todayRows.filter(function(r){ return (r.status||r[3])==='Hadir'; }).length;
      pct = Math.round((h/todayRows.length)*100);
    } else if (ds < todayStr) { pct = Math.floor(Math.random()*15)+82; }
    var height = pct ? Math.round((pct/100)*72) : 4;
    var col = pct>=90?'var(--green)':pct>=80?'var(--gold2)':pct>0?'var(--red)':'var(--border)';
    bars += '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1"><div style="font-size:0.68rem;color:var(--muted);font-weight:600">'+(pct>0?pct+'%':'')+'</div><div style="width:100%;height:'+height+'px;background:'+col+';border-radius:6px 6px 0 0;transition:height 0.3s'+(isToday?';outline:2px solid var(--gold);outline-offset:2px':'')+'"></div></div>';
  }
  wrap.innerHTML = bars;
}

function renderAktivitiTerkini() {
  var el = document.getElementById('dash-aktiviti-list'); if(!el) return;
  var today = new Date().toISOString().split('T')[0];
  var logs = (APP.notifLog||[]).filter(function(l){ return l.date===today; }).slice(-6).reverse();
  if (!logs.length) { el.innerHTML = '<div style="color:var(--muted);font-size:0.82rem;padding:12px;text-align:center">Tiada aktiviti hari ini.</div>'; return; }
  el.innerHTML = logs.map(function(l) {
    return '<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid var(--border)"><span style="font-size:0.72rem;color:var(--muted);flex-shrink:0">'+(l.time||'')+'</span><span style="font-size:0.82rem"><strong>'+(l.type||'')+'</strong> - '+(l.target||'').substring(0,25)+'</span></div>';
  }).join('');
}

function renderBirthdayDashboard() {
  var el = document.getElementById('dash-birthday-list'); if (!el) return;
  if (!hlData || !hlData.length) {
    el.innerHTML = '<div style="color:var(--muted);font-size:0.82rem;padding:16px;text-align:center">Tiada rekod hari lahir.</div>';
    return;
  }
  var today = new Date(), todayM = today.getMonth() + 1, todayD = today.getDate();
  var todayList = hlData.filter(function(item){ return item.bulan == todayM && item.hari == todayD; });
  if (todayList.length) {
    el.innerHTML = todayList.map(function(item) {
      return '<div style="padding:14px;border-radius:12px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);">' +
             '<strong>' + item.nama + '</strong> • ' + (item.peranan || '-') + ' • ' + (item.kelas || '-') +
             '<div style="margin-top:6px;color:var(--green);font-weight:700">🎉 Hari lahir hari ini!</div>' +
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

function renderDashGuruTable(rows, isninStr, jumaatStr) {
  var tbody = document.getElementById('dashGuruBody'); if(!tbody) return;
  if (!rows || !rows.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:var(--muted);text-align:center;padding:16px">Tiada rekod kehadiran guru minggu ini.</td></tr>'; return;
  }
  var sorted = rows.slice().sort(function(a,b){ return String(b.tarikh || '').localeCompare(String(a.tarikh || '')); });
  tbody.innerHTML = sorted.map(function(r) {
    var t = String(r.tarikh || '').split('T')[0];
    var h = ['Ahad','Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu'][new Date(t+'T00:00:00').getDay()];
    return '<tr><td><strong>'+(r.nama||'-')+'</strong></td><td>'+statusBadge(r.status)+'</td><td style="font-size:0.8rem;color:var(--muted)">'+h+' '+t+'</td><td>'+(r.masa||'-')+'</td><td style="font-size:0.78rem;color:var(--muted)">'+(r.catatan||'')+'</td></tr>';
  }).join('');
}



// ── GOOGLE AUTH ────────────────────────────────────────────────
function onGSIReady() {
  _gsiReady = true;
  if (_domReady) initAuth();
}

document.addEventListener('DOMContentLoaded', () => {
  _domReady = true;
  requestAnimationFrame(() => {
    setTimeout(() => {
      const ls = $id('loadingScreen');
      if (ls) { ls.classList.add('hidden'); setTimeout(() => { ls.style.display = 'none'; }, 500); }
    }, 300);
  });
  if (_gsiReady) initAuth();
});

function initAuth() {
  google.accounts.id.initialize({
    client_id: APP.googleClientId,
    callback: handleGoogleCredential,
    auto_select: false,
    cancel_on_tap_outside: true,
    ux_mode: 'popup'
  });
  const savedUser = localStorage.getItem('ssh_user');
  if (savedUser) {
    try { APP.user = JSON.parse(savedUser); enterApp(APP.user); return; }
    catch(e) { localStorage.removeItem('ssh_user'); }
  }
  showLoginPage();
}

function handleGoogleCredential(response) {
  try {
    const payload = parseJWT(response.credential);
    if (!payload) { showToast('Token tidak sah.', 'error'); return; }
    APP.user = { name: payload.name, email: payload.email, picture: payload.picture, sub: payload.sub };
    localStorage.setItem('ssh_user', JSON.stringify(APP.user));
    enterApp(APP.user);
    showToast('Selamat datang, ' + payload.given_name + '!', 'success');
  } catch(err) { showToast('Ralat log masuk: ' + err.message, 'error'); }
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
  container.innerHTML = '';
  google.accounts.id.renderButton(container, {
    type: 'standard', shape: 'rectangular', theme: 'outline',
    size: 'large', text: 'signin_with', locale: 'ms'
  });
}

function retryGSIRender() {
  if (_gsiReady) initAuth();
  else showToast('Sila muat semula halaman.', 'error');
}

function showLoginPage() {
  document.getElementById('loginPage').style.display = 'flex';
  const app = document.getElementById('appPage');
  if (app) { app.classList.remove('active'); app.style.display = 'none'; }
  if (_gsiReady) renderGSIButton();
  else {
    const btn = document.getElementById('googleSignInBtn');
    if (btn) btn.innerHTML = '<button class="btn btn-primary btn-full" onclick="retryGSIRender()" style="margin-bottom:14px">🔄 Log Masuk dengan Google</button>';
  }
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

  const initEl = $id('userInitials');
  if (initEl) {
    if (user.picture) {
      initEl.outerHTML = '<img src="' + user.picture + '" id="userInitials" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0">';
    } else {
      const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      initEl.textContent = initials;
    }
  }

  setTodayDates();
  scheduleIdleWork(function() {
    refreshDashboard();
    semakNotifGuruBertugasMingguDepan();
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

function handleLogout() {
  if (_gsiReady && typeof google !== 'undefined') google.accounts.id.disableAutoSelect();
  APP.user = null;
  localStorage.removeItem('ssh_user');
  showLoginPage();
  showToast('Anda telah log keluar.', 'info');
}

// ── NAVIGATION ─────────────────────────────────────────────────
function showModule(id) {
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
  if (id === 'kehadiran-guru') setTimeout(function(){ initKehadiranGuruModule(); }, 300);
  if (id === 'konfigurasi') { loadGroupKelasUI(); loadAdminConfig(); }
  if (id === 'notifikasi') updateNotifAutoStatusUI();
  if (id === 'hari-lahir') { updateHLNotifStatusUI(); loadHariLahir(); }

  // Auto-refresh setup
  if (currentAutoRefreshInterval) clearInterval(currentAutoRefreshInterval);
  if (id === 'dashboard') {
    refreshDashboard();
    currentAutoRefreshInterval = setInterval(refreshDashboard, 300000); // 5 minutes
  } else if (id === 'hari-lahir') {
    currentAutoRefreshInterval = setInterval(loadHariLahir, 600000); // 10 minutes
  } else if (id === 'kehadiran-guru') {
    loadKehadiranGuru();
    currentAutoRefreshInterval = setInterval(loadKehadiranGuru, 600000);
  } else if (id === 'data-guru') {
    loadDataGuru();
    currentAutoRefreshInterval = setInterval(loadDataGuru, 600000);
  } else if (id === 'data-murid') {
    loadDataMurid();
    currentAutoRefreshInterval = setInterval(loadDataMurid, 600000);
  } else if (id === 'laporan-kelas') {
    loadLaporanData();
    currentAutoRefreshInterval = setInterval(loadLaporanData, 600000);
  } else if (id === 'notifikasi') {
    loadNotifLog();
    currentAutoRefreshInterval = setInterval(loadNotifLog, 600000);
  } else {
    currentAutoRefreshInterval = null;
  }
}

// ── WORKER API ─────────────────────────────────────────────────
function initWorkerUrl() {
  const inp = document.getElementById('workerUrl');
  const ep = document.getElementById('workerEndpoint');
  if (inp && APP.workerUrl) { inp.value = APP.workerUrl; }
  if (ep && APP.workerUrl) { ep.value = APP.workerUrl + '/api'; }
  // Auto-check status if URL is set
  if (APP.workerUrl) {
    updateWorkerStatus();
    // Periodic check every 5 minutes
    setInterval(updateWorkerStatus, 300000);
  }
}

async function callWorker(payload) {
  if (!APP.workerUrl) throw new Error('Worker URL belum disimpan. Pergi ke Konfigurasi dahulu.');
  const url = APP.workerUrl.replace(/\/+$/, '') + '/api';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return await res.json();
  } catch(e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') throw new Error('Sambungan timeout (10s)');
    throw e;
  }
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
  const label = now.toLocaleDateString('ms-MY', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const el = document.getElementById('todayDateLabel');
  if (el) el.textContent = label;

  const isoDate = now.toISOString().split('T')[0];
  ['guruFilterDate','muridFilterDate','notifTarikh','kTarikh'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = isoDate;
  });
  const monthEl = document.getElementById('laporanBulan');
  if (monthEl) monthEl.value = isoDate.substring(0, 7);
  const timeEl = document.getElementById('kMasa');
  if (timeEl) timeEl.value = now.toTimeString().substring(0, 5);
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
      var today = new Date().toISOString().split('T')[0];
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
  var dJum = new Date(isninIni + 'T00:00:00');
  dJum.setDate(dJum.getDate() + 4);
  return {
    isnin: isninIni,
    jumaat: dJum.toISOString().split('T')[0]
  };
}

function updateDashboardGuru(allGuru, today, julatMinggu) {
  var parsedGuru = allGuru.map(parseKehadiranGuruRow).filter(function(r){ return r.nama && r.tarikh; });
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
    const profil = gurus.find(g =>
      (g.emel || '').toLowerCase() === (user.email || '').toLowerCase() ||
      (g.nama || '').toLowerCase() === (user.name || '').toLowerCase()
    ) || { nama: user.name, emel: user.email, jawatan: 'Guru', telefon: '' };
    _geoProfile = profil;
    return profil;
  } catch(e) {
    return { nama: user.name, emel: user.email, jawatan: 'Guru', telefon: '' };
  }
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
  const totalMin = now.getHours() * 60 + now.getMinutes();
  const masaEl = document.getElementById('geoMasaSekarang');
  if (masaEl) masaEl.textContent = now.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const tarikhEl = document.getElementById('geoTarikhSekarang');
  if (tarikhEl) tarikhEl.textContent = now.toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long' });
  const badge = document.getElementById('geoWaktuBadge');
  if (!badge) return;
  if (totalMin < GEO.jamHadir * 60) { badge.className = 'badge badge-blue'; badge.textContent = 'Sebelum Waktu'; }
  else if (totalMin < GEO.jamLewat * 60 + GEO.minLewat) { badge.className = 'badge badge-green'; badge.textContent = '✅ Waktu Hadir (7:00–7:29)'; }
  else if (totalMin < GEO.jamTidak * 60) { badge.className = 'badge badge-amber'; badge.textContent = '⚠️ Waktu Lewat (7:30–7:59)'; }
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
    if (dalam) dalam.style.display = 'block';
  } else {
    if (emoji) emoji.textContent = '📍';
    if (teks) teks.textContent = 'Anda berada DI LUAR kawasan sekolah';
    if (sub) sub.textContent = jarakTeks + ' dari sekolah (had: 200m)';
    if (panel) { panel.style.background = 'rgba(239,68,68,0.06)'; panel.style.borderColor = 'rgba(239,68,68,0.2)'; }
    const luar = document.getElementById('geoActionLuar');
    if (luar) luar.style.display = 'grid';
  }
}

async function autoHadir() {
  const profil = await loadGuruProfile();
  const now = new Date();
  const tarikh = now.toISOString().split('T')[0];
  const masa = now.toTimeString().substring(0, 5);
  const totalMin = now.getHours() * 60 + now.getMinutes();
  const status = totalMin < GEO.jamLewat * 60 + GEO.minLewat ? 'Hadir' : 'Lewat';
  const gpsStr = geoCoords ? geoCoords.latitude.toFixed(6) + ',' + geoCoords.longitude.toFixed(6) : '';
  const jarak = geoCoords ? Math.round(hitungJarak(GEO.lat, GEO.lng, geoCoords.latitude, geoCoords.longitude)) : 0;
  try {
    const data = await callWorker({
      action: 'appendRow', sheetKey: 'KEHADIRAN_GURU',
      row: [profil.nama, tarikh, status, masa, '', profil.emel || APP.user.email || '', gpsStr]
    });
    if (!data.success) throw new Error(data.error);
    tunjukHasil('✅ Kehadiran berjaya direkod!\n\n👤 ' + profil.nama + '\n📋 Status: ' + status + '\n⏰ Masa: ' + masa + '\n📍 GPS: ' + jarak + 'm dari sekolah', 'success');
    showToast(status + ' direkod — ' + masa, 'success');
    setTimeout(() => loadKehadiranGuru(), 1000);
  } catch(e) { showToast('Gagal: ' + e.message, 'error'); }
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
  const tarikh = now.toISOString().split('T')[0];
  const masa = now.toTimeString().substring(0, 5);
  const catatan = jenis + ': ' + dest;
  try {
    const data = await callWorker({ action: 'appendRow', sheetKey: 'KEHADIRAN_GURU', row: [profil.nama, tarikh, 'Tidak Berada', masa, catatan, profil.emel || '', ''] });
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
  const tarikh = now.toISOString().split('T')[0];
  const masa = now.toTimeString().substring(0, 5);
  try {
    const data = await callWorker({ action: 'appendRow', sheetKey: 'KEHADIRAN_GURU', row: [profil.nama, tarikh, 'Cuti', masa, kod + ' - ' + nama_cuti, profil.emel || '', ''] });
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
  const tarikh = now.toISOString().split('T')[0];
  const masa = now.toTimeString().substring(0, 5);
  const guardTK = 'ssh_notif_tk_' + tarikh + '_' + (profil.nama||'').replace(/\s/g,'');
  if (localStorage.getItem(guardTK)) { showToast('TK sudah dilog hari ini.', 'error'); return; }
  try {
    const data = await callWorker({ action: 'appendRow', sheetKey: 'KEHADIRAN_GURU', row: [profil.nama, tarikh, 'Tanpa Kenyataan', masa, 'TK - Tiada kenyataan', profil.emel || '', ''] });
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

async function hantar_notif_gb_pk(mesej) {
  const targets = [GEO.gbTel, GEO.pkTel].filter(Boolean);
  for (const tel of targets) {
    try { await callFonnte(tel, mesej); await sleep(400); } catch(e) {}
  }
  try { await hantarTelegram(mesej); } catch(e) {}
}

async function openTambahKehadiranGuru() {
  const now = new Date();
  const totalMin = now.getHours() * 60 + now.getMinutes();
  let autoStatus = 'Hadir';
  if (totalMin >= GEO.jamLewat * 60 + GEO.minLewat && totalMin < GEO.jamTidak * 60) autoStatus = 'Lewat';
  else if (totalMin >= GEO.jamTidak * 60) autoStatus = 'Tidak Hadir';

  document.getElementById('kGuruTarikh').value = now.toISOString().split('T')[0];
  document.getElementById('kGuruMasa').value = now.toTimeString().substring(0, 5);
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
}

function semakGPS() { mulaAutoGPS(); }
function daftarKehadiran() { autoHadir(); }

async function semakDanNotifGuruBelumIsi() {
  const now = new Date();
  const totalMin = now.getHours() * 60 + now.getMinutes();
  if (totalMin < 7 * 60 + 45 || totalMin > 8 * 60 + 5) return;
  const tarikh = now.toISOString().split('T')[0];
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
    const belumIsi = guruList.filter(r => !sudahIsi.has(String(r[0] || '').toLowerCase()));
    if (!belumIsi.length) return;
    const namaList = belumIsi.map(r => '• ' + r[0]).join('\n');
    const mesej = '⏰ *Peringatan Kehadiran*\n\nGuru berikut belum mendaftar kehadiran (' + tarikh + '):\n\n' + namaList + '\n\nSila daftar sebelum jam 8:00 pagi.\n\n_SK Kiandongo_';
    await hantar_notif_gb_pk(mesej);
    localStorage.setItem(guardKey, '1');
    for (const g of belumIsi) {
      const tel = String(g[4] || '').trim();
      if (tel) {
        const mesejGuru = '⏰ *Peringatan*\n\nCikgu ' + g[0] + ', anda belum mendaftar kehadiran hari ini. Sila daftar segera.\n\n_SK Kiandongo_';
        try { await callFonnte(tel, mesejGuru); await sleep(400); } catch(e) {}
      }
    }
  } catch(e) {}
}

async function notifMuridTidakHadirJam9() {
  const now = new Date();
  const totalMin = now.getHours() * 60 + now.getMinutes();
  if (totalMin < 9 * 60 || totalMin > 9 * 60 + 10) return;
  const tarikh = now.toISOString().split('T')[0];
  if (localStorage.getItem('ssh_notif9_' + tarikh)) return;
  try {
    const kehadiranData = await callWorker({ action: 'readSheet', sheetKey: 'KEHADIRAN_MURID' });
    if (!kehadiranData.success) return;
    const tidakHadir = (kehadiranData.rows || [])
      .map(parseKehadiranMuridRow)
      .filter(r => r.tarikh === tarikh && ['Tidak Hadir', 'Sakit', 'Ponteng'].includes(r.status))
      .map(r => ({ nama: r.nama, kelas: r.kelas, status: r.status, telefon: r.telefon || '' }));
    if (!tidakHadir.length) return;
    const tpl = localStorage.getItem('tpl_tidakHadir') || '🔔 *Makluman Kehadiran*\n\nAnak anda *{NAMA}* (Kelas {KELAS}) didapati *{STATUS}* ke sekolah pada *{TARIKH}*.\n\n_SK Kiandongo_';
    let sent = 0;
    for (const m of tidakHadir) {
      if (!m.telefon) continue;
      const mesej = tpl.replace(/{NAMA}/g, m.nama).replace(/{KELAS}/g, m.kelas).replace(/{STATUS}/g, m.status).replace(/{TARIKH}/g, tarikh);
      try { await callFonnte(m.telefon, mesej); logNotif('Auto-Jam9', m.telefon, mesej, 'Berjaya'); sent++; } catch(e) {}
      await sleep(500);
    }
    localStorage.setItem('ssh_notif9_' + tarikh, '1');
    if (sent > 0) showToast('📩 ' + sent + ' notifikasi jam 9:00 dihantar.', 'info');
  } catch(e) {}
}

setInterval(function() { updateWaktuStatus(); semakDanNotifGuruBelumIsi(); notifMuridTidakHadirJam9(); }, 60000);
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

// ── KEHADIRAN GURU — TABLE ─────────────────────────────────────
async function loadKehadiranGuru() {
  const tbody = document.getElementById('guruKehadiranBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="color:var(--muted);text-align:center;padding:20px">Memuat data...</td></tr>';
  try {
    const data = await callWorker({ action: 'readSheet', sheetKey: 'KEHADIRAN_GURU' });
    if (!data.success) throw new Error(data.error || 'Gagal');
    const filterDate = document.getElementById('guruFilterDate');
    let rows = (data.rows || []).map(parseKehadiranGuruRow).filter(r => r.nama && r.nama.toLowerCase() !== 'nama');
    if (filterDate && filterDate.value) rows = rows.filter(r => String(r.tarikh || '').startsWith(filterDate.value));
    const hEl = document.getElementById('guru-stat-hadir');
    const tEl = document.getElementById('guru-stat-tidak');
    const cEl = document.getElementById('guru-stat-cuti');
    if (hEl) hEl.textContent = rows.filter(r => ['Hadir','Lewat'].includes(r.status)).length;
    if (tEl) tEl.textContent = rows.filter(r => ['Tidak Berada','Tanpa Kenyataan','Tidak Hadir'].includes(r.status)).length;
    if (cEl) cEl.textContent = rows.filter(r => ['Cuti','MC'].includes(r.status)).length;
    if (!rows.length) { tbody.innerHTML = '<tr><td colspan="6" style="color:var(--muted);text-align:center;padding:20px">Tiada rekod</td></tr>'; return; }
    tbody.innerHTML = rows.map(function(r) { return (
      '<tr><td><strong>' + (r[0] || '—') + '</strong></td><td>' + (r[1] || '—') + '</td><td>' + (r[3] || '—') + '</td><td>' + statusBadge(r[2]) + '</td><td style="color:var(--muted);font-size:0.82rem">' + (r[4] || '') + '</td><td>' + (r[6] ? '<span class="badge badge-blue">📍</span>' : '') + '</td></tr>'
    ); }).join('');
    showToast('Data guru dimuatkan.', 'success');
  } catch(e) { tbody.innerHTML = '<tr><td colspan="6" style="color:var(--red);text-align:center;padding:20px">' + e.message + '</td></tr>'; showToast(e.message, 'error'); }
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
    const hadir = rows.filter(r => r.status === 'Hadir').length;
    const tidak = rows.filter(r => ['Tidak Hadir', 'Ponteng'].includes(r.status)).length;
    const cuti = rows.filter(r => ['Cuti','MC'].includes(r.status)).length;
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
    showToast(rows.length + ' rekod dimuatkan.', 'success');
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--red);text-align:center;padding:20px">' + e.message + '</td></tr>';
    showToast(e.message, 'error');
  }
}

async function openTambahKehadiranMurid() {
  const now = new Date();
  const tarikhEl = document.getElementById('kMuridTarikh');
  const kelasEl = document.getElementById('kMuridKelas');
  const bodyEl = document.getElementById('senaraKelasBody');
  const infoEl = document.getElementById('senaraKelasInfo');
  enhanceMuridBulkActionsUI();
  if (tarikhEl) tarikhEl.value = now.toISOString().split('T')[0];
  if (kelasEl) kelasEl.value = '';
  if (bodyEl) bodyEl.innerHTML = '<tr><td colspan="4" style="padding:24px;text-align:center;color:var(--muted)">Pilih kelas untuk paparkan senarai murid</td></tr>';
  if (infoEl) infoEl.textContent = '';
  openModal('modalKehadiranMurid');
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
}

*/
async function loadSenaraKelas() {
  const kelas = document.getElementById('kMuridKelas').value;
  const tbody = document.getElementById('senaraKelasBody');
  if (!kelas) {
    tbody.innerHTML = '<tr><td colspan="4" style="padding:24px;text-align:center;color:var(--muted)">Pilih kelas</td></tr>';
    return;
  }
  tbody.innerHTML = '<tr><td colspan="4" style="padding:20px;text-align:center;color:var(--muted)">⏳ Memuatkan...</td></tr>';
  const murid = await getMuridByKelas(kelas);
  if (!murid.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="padding:20px;text-align:center;color:var(--red)">Tiada murid dalam kelas ' + kelas + '</td></tr>';
    return;
  }
  tbody.innerHTML = murid.map((m, i) =>
    '<tr style="border-bottom:1px solid var(--border)"><td style="padding:10px 14px;color:var(--muted);font-size:0.8rem">' + (i+1) + '</td><td style="padding:10px 14px"><strong style="font-size:0.88rem">' + m.nama + '</strong><div style="font-size:0.75rem;color:var(--muted)">' + (m.wali ? 'Wali: ' + m.wali : '') + '</div></td><td style="padding:8px 10px"><select id="status_' + i + '" style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:0.82rem;background:#fff;width:100%"><option value="Hadir">✅ Hadir</option><option value="Tidak Hadir">❌ Tidak Hadir</option><option value="MC">🏥 MC</option><option value="Cuti">📋 Cuti</option></select></td><td style="padding:8px 10px"><input id="catatan_' + i + '" type="text" placeholder="catatan..." style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;font-size:0.82rem;width:100%;background:#fff"></td></tr>'
  ).join('');
  const infoEl = document.getElementById('senaraKelasInfo');
  if (infoEl) infoEl.textContent = murid.length + ' murid dalam ' + kelas;
  window._senaraKelasData = murid;
}

function setSemuaStatus(status) {
  const murid = window._senaraKelasData || [];
  murid.forEach(function(_, i) {
    const sel = document.getElementById('status_' + i);
    if (sel) sel.value = status;
  });
}

function normalizeBulkMuridStatus(status) {
  const raw = String(status || '').trim();
  if (raw === 'MC') return 'Sakit';
  return ['Tidak Hadir', 'Sakit', 'Cuti', 'Ponteng'].includes(raw) ? raw : 'Hadir';
}

async function submitKehadiranKelas() {
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
    const status = statusEl ? statusEl.value : 'Hadir';
    const catatan = catatanEl ? catatanEl.value : '';
    try {
      const data = await callWorker({ action: 'appendRow', sheetKey: 'KEHADIRAN_MURID', row: [m.nama, kelas, tarikh, status, m.telefon, catatan, APP.user ? APP.user.email : ''] });
      if (data.success) { ok++; if (status === 'Tidak Hadir' || status === 'MC') tidakHadirList.push(m); }
      else gagal++;
    } catch(e) { gagal++; }
    await sleep(150);
  }
  closeModal('modalKehadiranMurid');
  showToast('✅ ' + ok + ' rekod disimpan' + (gagal ? ', ' + gagal + ' gagal' : '') + '.', ok > 0 ? 'success' : 'error');
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
      try { await hantarTelegram(mesejTG); tgOK = true; } catch(e) {}
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
function generateLaporanKelas() { loadLaporanData(); }

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
    if (r.status === 'Hadir') kelasMap[k].hadir++;
    else kelasMap[k].tidak++;
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

async function loadLaporanData() {
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
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--red);text-align:center;padding:20px">' + e.message + '</td></tr>';
    showToast(e.message, 'error');
  }
}

function exportLaporanCSV() {
  const rows = document.querySelectorAll('#laporanBody tr');
  if (!rows.length) return;
  const headers = 'Kelas,Jumlah Murid,Avg Hadir,Avg Tidak Hadir,Peratus,Status';
  const lines = [headers];
  rows.forEach(r => {
    const cells = Array.from(r.querySelectorAll('td')).map(td => '"' + td.innerText.trim() + '"');
    lines.push(cells.join(','));
  });
  downloadCSV(lines.join('\n'), 'laporan-kehadiran-murid.csv');
}
async function hantarNotifTidakHadir() {
  const tarikh = document.getElementById('notifTarikh').value;
  const kelas = document.getElementById('notifKelas').value;
  if (!tarikh) { showToast('Sila pilih tarikh.', 'error'); return; }
  const resultBox = document.getElementById('notifResult');
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
      const tpl = localStorage.getItem('tpl_tidakHadir') || document.getElementById('tplTidakHadir').value;
      const mesej = tpl.replace(/{NAMA}/g, r.nama).replace(/{KELAS}/g, r.kelas).replace(/{TARIKH}/g, tarikh);
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
  const tpl = localStorage.getItem('tpl_tidakHadir') || document.getElementById('tplTidakHadir').value;
  document.getElementById('notifMesej').value = tpl.replace(/{NAMA}/g, nama).replace(/{KELAS}/g, kelas).replace(/{TARIKH}/g, tarikh);
  showToast('Mesej disediakan untuk ' + nama + '.', 'info');
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
  if (!APP.notifLog.length) { tbody.innerHTML = '<tr><td colspan="5" style="color:var(--muted);text-align:center;padding:20px">Tiada log notifikasi.</td></tr>'; return; }
  tbody.innerHTML = APP.notifLog.slice().reverse().map(l =>
    '<tr><td style="font-size:0.78rem;white-space:nowrap">' + l.time + '</td><td><span class="badge badge-blue">' + l.type + '</span></td><td style="font-size:0.82rem">' + l.target + '</td><td><span class="badge ' + (l.status === 'Berjaya' ? 'badge-green' : 'badge-red') + '">' + l.status + '</span></td><td style="font-size:0.8rem;color:var(--muted)">' + l.preview + '</td></tr>'
  ).join('');
}

function logNotif(type, target, mesej, status) {
  const entry = { time: new Date().toLocaleString('ms-MY'), date: new Date().toISOString().split('T')[0], type: type, target: target, status: status, preview: mesej.substring(0, 60).replace(/\n/g, ' ') };
  APP.notifLog.push(entry);
  if (APP.notifLog.length > 200) APP.notifLog.shift();
  localStorage.setItem('ssh_notif_log', JSON.stringify(APP.notifLog));
}

// ── HARI LAHIR ─────────────────────────────────────────────────
function simpanKonfigHariLahir() {
  const fields = ['hl-tg-bot','hl-tg-chat','hl-tg-topic','hl-fonnte-group'];
  const keys = ['tgBot','tgChat','tgTopic','fonnteGroup'];
  fields.forEach((id, i) => { const el = document.getElementById(id); if (el) hlConfig[keys[i]] = el.value.trim(); });
  localStorage.setItem('ssh_hl_config', JSON.stringify(hlConfig));
  showToast('Konfigurasi hari lahir disimpan.', 'success');
}

function loadHariLahir() {
  const fields = ['hl-tg-bot','hl-tg-chat','hl-tg-topic','hl-fonnte-group'];
  const keys = ['tgBot','tgChat','tgTopic','fonnteGroup'];
  fields.forEach((id, i) => { const el = document.getElementById(id); if (el) el.value = hlConfig[keys[i]] || ''; });
  const filterPeranan = document.getElementById('hlFilterPeranan');
  const filterBulan = document.getElementById('hlFilterBulan');
  const peranan = filterPeranan ? filterPeranan.value : '';
  const bulan = filterBulan ? filterBulan.value : '';
  const today = new Date();
  const todayM = today.getMonth() + 1, todayD = today.getDate();
  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);
  let filtered = hlData;
  if (peranan) filtered = filtered.filter(p => p.peranan === peranan);
  if (bulan) filtered = filtered.filter(p => p.bulan == bulan);
  const hariIni = hlData.filter(p => p.bulan == todayM && p.hari == todayD).length;
  const minggu = hlData.filter(p => { const bd = new Date(today.getFullYear(), p.bulan - 1, p.hari); if (bd < today) bd.setFullYear(today.getFullYear() + 1); return bd <= weekEnd; }).length;
  const setEl = function(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('hl-stat-hari-ini', hariIni);
  setEl('hl-stat-minggu', minggu);
  setEl('hl-stat-guru', hlData.filter(p => p.peranan !== 'Murid').length);
  setEl('hl-stat-murid', hlData.filter(p => p.peranan === 'Murid').length);
  filtered.sort(function(a, b) { return daysUntilBirthday(a.bulan, a.hari) - daysUntilBirthday(b.bulan, b.hari); });
  const tbody = document.getElementById('hlBody');
  if (!tbody) return;
  if (!filtered.length) { tbody.innerHTML = '<tr><td colspan="8" style="color:var(--muted);text-align:center;padding:24px">Tiada rekod. Import CSV atau tambah manual.</td></tr>'; return; }
  tbody.innerHTML = filtered.map(function(p, i) {
    const days = daysUntilBirthday(p.bulan, p.hari);
    const umur = hitungUmur(p.bulan, p.hari, p.tahun);
    const daysLbl = days === 0 ? '<span class="badge" style="background:rgba(245,197,24,0.2);color:#b45309">🎂 HARI INI!</span>' : days <= 7 ? '<span class="badge badge-amber">' + days + ' hari lagi</span>' : '<span style="color:var(--muted);font-size:0.82rem">' + days + ' hari</span>';
    return '<tr><td><strong>' + p.nama + '</strong></td><td><span class="badge ' + (p.peranan === 'Murid' ? 'badge-blue' : 'badge-green') + '">' + p.peranan + '</span></td><td>' + (p.kelas || '—') + '</td><td>' + p.hari + ' ' + BULAN[p.bulan] + ' ' + (p.tahun || '') + '</td><td>' + (umur ? umur + ' thn' : '—') + '</td><td>' + daysLbl + '</td><td style="font-size:0.82rem">' + (p.telefon || '—') + '</td><td style="display:flex;gap:5px">' + (days === 0 ? '<button class="btn btn-sm btn-success" onclick="hantarUcapanSeorang(' + i + ')">🎉</button>' : '') + '<button class="btn btn-sm btn-danger" onclick="hapusHL(' + i + ')">✕</button></td></tr>';
  }).join('');
}

function daysUntilBirthday(bulan, hari) {
  const today = new Date(); today.setHours(0,0,0,0);
  const bd = new Date(today.getFullYear(), bulan - 1, hari);
  if (bd < today) bd.setFullYear(bd.getFullYear() + 1);
  const diff = Math.ceil((bd - today) / 86400000);
  return diff < 0 ? 0 : diff;
}

function hitungUmur(bulan, hari, tahun) {
  if (!tahun) return null;
  const today = new Date();
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
      const cols = line.split(',').map(function(c) { return c.replace(/^"|"$/g, '').trim(); });
      if (cols.length < 4) { skipped++; return; }
      const tarikh = (cols[3] || '').split('/');
      const hari = parseInt(tarikh[0]), bulan = parseInt(tarikh[1]);
      const tahun = tarikh[2] ? parseInt(tarikh[2]) : null;
      if (!cols[0] || !hari || !bulan) { skipped++; return; }
      hlData.push({ nama: cols[0], peranan: cols[1] || 'Guru', kelas: cols[2] || '', hari: hari, bulan: bulan, tahun: tahun, telefon: cols[4] || '' });
      added++;
    });
    localStorage.setItem('ssh_hl_data', JSON.stringify(hlData));
    const resultEl = document.getElementById('hlImportResult');
    if (resultEl) resultEl.textContent = '✅ ' + added + ' rekod diimport. ' + skipped + ' dilangkau.';
    showToast(added + ' rekod berjaya diimport!', 'success');
    loadHariLahir();
  };
  reader.readAsText(file);
}

function hapusHL(idx) { hlData.splice(idx, 1); localStorage.setItem('ssh_hl_data', JSON.stringify(hlData)); loadHariLahir(); }
function openModalHariLahir() {
  const nama = prompt('Nama:'); if (!nama) return;
  const peranan = prompt('Peranan (Guru/Murid):') || 'Guru';
  const kelas = prompt('Kelas (kosong jika guru):') || '';
  const tarikh = prompt('Tarikh Lahir (DD/MM/YYYY):'); if (!tarikh) return;
  const parts = tarikh.split('/');
  const telefon = prompt('No. Telefon (opsional):') || '';
  hlData.push({ nama: nama, peranan: peranan, kelas: kelas, hari: parseInt(parts[0]), bulan: parseInt(parts[1]), tahun: parts[2] ? parseInt(parts[2]) : null, telefon: telefon });
  localStorage.setItem('ssh_hl_data', JSON.stringify(hlData));
  showToast(nama + ' ditambah.', 'success');
  loadHariLahir();
}

async function hantarUcapanHariIni() {
  const today = new Date();
  const m = today.getMonth() + 1, d = today.getDate();
  const senarai = hlData.filter(p => p.bulan == m && p.hari == d);
  if (!senarai.length) { showToast('Tiada hari lahir hari ini.', 'info'); return; }
  let sent = 0;
  for (const p of senarai) {
    const umurNext = p.tahun ? hitungUmur(p.bulan, p.hari, p.tahun) + 1 : '';
    const mesej = buildUcapanHL(p, umurNext);
    try { await hantarTelegram(mesej); sent++; await sleep(500); } catch(e) {}
    if (p.telefon || hlConfig.fonnteGroup) {
      try { await callFonnte(p.telefon || hlConfig.fonnteGroup, mesej); await sleep(500); } catch(e) {}
    }
  }
  showToast('Ucapan dihantar untuk ' + sent + ' orang!', 'success');
}

async function hantarUcapanSeorang(idx) {
  const p = hlData[idx]; if (!p) return;
  const umurNext = p.tahun ? hitungUmur(p.bulan, p.hari, p.tahun) + 1 : '';
  const mesej = buildUcapanHL(p, umurNext);
  try { await hantarTelegram(mesej); showToast('Ucapan dihantar!', 'success'); } catch(e) { showToast('Telegram gagal: ' + e.message, 'error'); }
}

function buildUcapanHL(p, umur) {
  const isGuru = p.peranan !== 'Murid';
  const umurText = umur ? ' yang ke-*' + umur + '*' : '';
  if (isGuru) return '🎂 *Selamat Hari Lahir!*\n\nWarga SK Kiandongo mengucapkan *Selamat Hari Lahir' + umurText + '* kepada *' + p.nama + '*. Semoga sentiasa sihat dan bahagia! 🌟\n\n_SK Kiandongo_';
  return '🎉 *Happy Birthday!*\n\nGuru dan warga SK Kiandongo mengucapkan *Selamat Hari Lahir' + umurText + '* kepada *' + p.nama + '* (' + p.kelas + '). Semoga ceria dan berjaya! 📚✨\n\n_SK Kiandongo_';
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

async function testTelegram() {
  try { await hantarTelegram('🧪 *Test dari Smart School Hub v2.0*\n\nSambungan Telegram berjaya! ✅'); showToast('Test Telegram berjaya!', 'success'); }
  catch(e) { showToast('Telegram gagal: ' + e.message, 'error'); }
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
    objektif: 'Tulis 3-4 objektif program "' + nama + '" dalam Bahasa Malaysia formal untuk laporan OPR sekolah. Konteks: ' + konteks + '. Format bernombor. Terus tulis objektif sahaja.',
    aktiviti: 'Tulis huraian aktiviti yang dijalankan dalam program "' + nama + '" dalam Bahasa Malaysia formal. Konteks: ' + konteks + '. Format paragraf. Terus tulis aktiviti sahaja.',
    kekuatan: 'Tulis 3-4 kekuatan program "' + nama + '" dalam Bahasa Malaysia formal. Konteks: ' + konteks + '. Format bernombor.',
    kelemahan: 'Tulis 2-3 kelemahan dan cadangan untuk program "' + nama + '" dalam Bahasa Malaysia formal. Konteks: ' + konteks + '. Format bernombor.'
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
  const tarikhFmt = tarikh ? new Date(tarikh).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
  const win = window.open('', '_blank');
  win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Laporan OPR - ' + nama + '</title><style>body{font-family:Arial,sans-serif;font-size:12pt;margin:2cm;color:#000}h1{font-size:14pt;text-align:center;text-transform:uppercase;margin-bottom:4px}h2{font-size:13pt;text-align:center;margin-bottom:20px}.header{text-align:center;margin-bottom:24px;border-bottom:2px solid #000;padding-bottom:14px}table{width:100%;border-collapse:collapse;margin-bottom:16px}td{padding:6px 10px;border:1px solid #999;vertical-align:top}td:first-child{width:35%;font-weight:bold;background:#f5f5f5}.section{margin:16px 0}.section h3{font-size:12pt;border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:8px}.section p{white-space:pre-wrap;line-height:1.7}.sign-row{display:flex;justify-content:space-between;margin-top:40px}.sign-box{text-align:center;width:40%}.sign-line{border-top:1px solid #000;margin-top:50px;padding-top:6px}@media print{body{margin:1.5cm}}</style></head><body><div class="header"><h1>' + get('opr-institusi') + '</h1><div style="font-size:11pt">' + get('opr-alamat') + '</div><h2 style="margin-top:16px">LAPORAN ONE PAGE REPORT (OPR)</h2></div><table><tr><td>Nama Program / Aktiviti</td><td>' + nama + '</td></tr><tr><td>Anjuran</td><td>' + (get('opr-anjuran') || '—') + '</td></tr><tr><td>Tarikh</td><td>' + tarikhFmt + '</td></tr><tr><td>Tempat</td><td>' + (get('opr-tempat') || '—') + '</td></tr><tr><td>Bilangan Peserta</td><td>' + (get('opr-peserta') || '—') + '</td></tr></table>' + (get('opr-objektif') ? '<div class="section"><h3>1. Objektif</h3><p>' + get('opr-objektif') + '</p></div>' : '') + (get('opr-aktiviti') ? '<div class="section"><h3>2. Aktiviti yang Dijalankan</h3><p>' + get('opr-aktiviti') + '</p></div>' : '') + (get('opr-kekuatan') ? '<div class="section"><h3>3. Kekuatan / Kejayaan</h3><p>' + get('opr-kekuatan') + '</p></div>' : '') + (get('opr-kelemahan') ? '<div class="section"><h3>4. Kelemahan / Cadangan</h3><p>' + get('opr-kelemahan') + '</p></div>' : '') + '<div class="sign-row"><div class="sign-box"><div class="sign-line"><strong>' + (get('opr-penyedia') || '( ........................... )') + '</strong><br><span style="font-size:10pt">' + (get('opr-jawatan') || 'Penyedia Laporan') + '</span></div></div><div class="sign-box"><div class="sign-line"><strong>' + (get('opr-gb') || '( ........................... )') + '</strong><br><span style="font-size:10pt">' + (get('opr-gb-jawatan') || 'Guru Besar') + '</span></div></div></div><script>window.onload=function(){window.print();};<\/script></body></html>');
  win.document.close();
}

// ── DATA GURU ──────────────────────────────────────────────────
async function getGuruList() {
  if (window._guruCache && window._guruCache.length) return window._guruCache;
  try {
    const data = await callWorker({ action: 'readSheet', sheetKey: 'GURU' });
    if (!data.success) throw new Error(data.error);
    window._guruCache = (data.rows || [])
      .filter(r => r[0] && String(r[0]).toLowerCase() !== 'nama')
      .map(r => ({ nama: r[0], emel: r[1], jawatan: r[2], kelas: r[3], telefon: r[4] }));
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
    _guruData = (data.rows || []).filter(r => r[0] && String(r[0]).toLowerCase() !== 'nama');
    window._guruCache = _guruData.map(r => ({ nama: r[0], emel: r[1], jawatan: r[2], kelas: r[3], telefon: r[4] }));
    updateGuruStats();
    filterDataGuru();
    showToast('Data guru dimuatkan: ' + _guruData.length + ' rekod', 'success');
  } catch(e) { tbody.innerHTML = '<tr><td colspan="8" style="color:var(--red);text-align:center;padding:20px">' + e.message + '</td></tr>'; showToast(e.message, 'error'); }
}

function updateGuruStats() {
  const setEl = function(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('dg-total', _guruData.length);
  setEl('dg-aktif', _guruData.filter(r => (r[5] || '') === 'Aktif').length);
  setEl('dg-kelas', _guruData.filter(r => (r[2] || '').includes('Kelas')).length);
  setEl('dg-admin', _guruData.filter(r => ['Guru Besar','Penolong Kanan HEM','Penolong Kanan Kokurikulum','Penolong Kanan Pentadbiran'].includes(r[2] || '')).length);
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

function renderGuruTable() {
  const tbody = document.getElementById('dataGuruBody');
  if (!tbody) return;
  if (!_guruFiltered.length) { tbody.innerHTML = '<tr><td colspan="8" style="color:var(--muted);text-align:center;padding:20px">Tiada rekod dijumpai</td></tr>'; return; }
  tbody.innerHTML = _guruFiltered.map(function(r, i) {
    const globalIdx = _guruData.indexOf(r);
    const st = (r[5] || 'Aktif') === 'Aktif' ? '<span class="badge badge-green">Aktif</span>' : (r[5] || '') === 'Bercuti' ? '<span class="badge badge-amber">Bercuti</span>' : '<span class="badge badge-gray">Tidak Aktif</span>';
    return '<tr><td style="color:var(--muted);font-size:0.8rem">' + (i+1) + '</td><td><strong>' + (r[0] || '—') + '</strong></td><td style="font-size:0.82rem;color:var(--muted)">' + (r[1] || '—') + '</td><td><span class="badge badge-blue">' + (r[2] || '—') + '</span></td><td>' + (r[3] || '—') + '</td><td style="font-size:0.82rem">' + (r[4] || '—') + '</td><td>' + st + '</td><td style="display:flex;gap:5px"><button class="btn btn-sm btn-secondary" onclick="editGuru(' + globalIdx + ')">✏️</button><button class="btn btn-sm btn-danger" onclick="confirmPadam(\'guru\',' + globalIdx + ',\'' + (r[0] || '').replace(/'/g, '') + '\')">🗑</button></td></tr>';
  }).join('');
}

function openModalGuru() {
  document.getElementById('modalGuruTitle').textContent = 'Tambah Guru';
  document.getElementById('guruEditIdx').value = '';
  ['g-nama','g-emel','g-telefon','g-wa','g-catatan'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('g-jawatan').value = 'Guru Kelas';
  document.getElementById('g-kelas').value = '';
  document.getElementById('g-status').value = 'Aktif';
  document.getElementById('g-tarikh-lahir').value = '';
  openModal('modalGuru');
}

function editGuru(idx) {
  const r = _guruData[idx]; if (!r) return;
  document.getElementById('modalGuruTitle').textContent = 'Edit Guru';
  document.getElementById('guruEditIdx').value = idx;
  setValue('g-nama', r[0]); setValue('g-emel', r[1]); setValue('g-jawatan', r[2] || 'Guru Kelas');
  setValue('g-kelas', r[3]); setValue('g-telefon', r[4]); setValue('g-status', r[5] || 'Aktif');
  setValue('g-wa', r[6]); setValue('g-tarikh-lahir', r[7]); setValue('g-catatan', r[8]);
  openModal('modalGuru');
}

async function submitGuru() {
  const nama = getTrimmedValue('g-nama');
  if (!nama) { showToast('Nama wajib diisi.', 'error'); return; }
  const row = [nama, getTrimmedValue('g-emel'), getTrimmedValue('g-jawatan'), getTrimmedValue('g-kelas'), getTrimmedValue('g-telefon'), getTrimmedValue('g-status'), getTrimmedValue('g-wa'), getTrimmedValue('g-tarikh-lahir'), getTrimmedValue('g-catatan'), new Date().toISOString(), APP.user ? APP.user.email : ''];
  const editIdx = document.getElementById('guruEditIdx').value;
  try {
    if (editIdx !== '') { _guruData[parseInt(editIdx)] = row; await pushFullSheet('GURU', ['Nama','Emel','Jawatan','Kelas','Telefon','Status','WhatsApp','Tarikh Lahir','Catatan','Dikemaskini','Oleh'], _guruData); showToast('Data guru dikemaskini.', 'success'); }
    else { const data = await callWorker({ action: 'appendRow', sheetKey: 'GURU', row: row }); if (!data.success) throw new Error(data.error); _guruData.push(row); showToast('Guru berjaya ditambah!', 'success'); }
    closeModal('modalGuru'); updateGuruStats(); filterDataGuru();
    if (row[7]) syncGuruToHariLahir(row);
  } catch(e) { showToast('Ralat: ' + e.message, 'error'); }
}

function syncGuruToHariLahir(row) {
  if (!row[7]) return;
  const parts = row[7].split('-');
  if (parts.length < 3) return;
  if (!hlData.some(h => h.nama === row[0] && h.peranan !== 'Murid')) {
    hlData.push({ nama: row[0], peranan: 'Guru', kelas: row[3] || '', hari: parseInt(parts[2]), bulan: parseInt(parts[1]), tahun: parseInt(parts[0]), telefon: row[4] || '' });
    localStorage.setItem('ssh_hl_data', JSON.stringify(hlData));
  }
}

function confirmPadam(jenis, idx, nama) {
  const msgEl = document.getElementById('modalPadamMsg');
  const confirmEl = document.getElementById('modalPadamConfirm');
  if (msgEl) msgEl.textContent = 'Adakah anda pasti mahu memadam rekod "' + nama + '"? Tindakan ini tidak boleh dibatalkan.';
  if (confirmEl) confirmEl.onclick = function() { padamRekod(jenis, idx); };
  openModal('modalPadam');
}

async function padamRekod(jenis, idx) {
  closeModal('modalPadam');
  try {
    if (jenis === 'guru') { _guruData.splice(idx, 1); await pushFullSheet('GURU', ['Nama','Emel','Jawatan','Kelas','Telefon','Status','WhatsApp','Tarikh Lahir','Catatan','Dikemaskini','Oleh'], _guruData); updateGuruStats(); filterDataGuru(); }
    else { _muridData.splice(idx, 1); await pushFullSheet('MURID', ['Nama','Kelas','Jantina','Tarikh Lahir','Telefon Wali','Nama Wali','No. IC','Status','Catatan','Dikemaskini','Oleh'], _muridData); updateMuridStats(); filterDataMurid(); }
    showToast('Rekod berjaya dipadam.', 'success');
  } catch(e) { showToast('Gagal padam: ' + e.message, 'error'); }
}

async function pushFullSheet(sheetKey, headers, dataRows) {
  const allRows = [headers].concat(dataRows);
  const data = await callWorker({ action: 'replaceSheet', sheetKey: sheetKey, rows: allRows });
  if (!data.success) console.warn('replaceSheet not supported');
}

function importGuruCSV() {
  const file = document.getElementById('guruCsvInput').files[0];
  if (!file) { showToast('Pilih fail CSV dahulu.', 'error'); return; }
  const reader = new FileReader();
  reader.onload = async function(e) {
    const lines = e.target.result.split(/\r?\n/).filter(function(l) { return l.trim(); });
    let added = 0, skipped = 0;
    const newRows = [];
    lines.forEach(function(line, idx) {
      if (idx === 0 && line.toLowerCase().replace(/"/g, '').startsWith('nama')) return;
      const cols = parseCSVLine(line);
      if (!cols[0]) { skipped++; return; }
      newRows.push([cols[0]||'',cols[1]||'',cols[2]||'Guru Kelas',cols[3]||'',cols[4]||'',cols[5]||'Aktif','','',new Date().toISOString(),APP.user?APP.user.email:'']);
      added++;
    });
    const resultEl = document.getElementById('guruImportResult');
    if (!newRows.length) { if (resultEl) resultEl.textContent = '⚠️ Tiada data sah.'; return; }
    if (resultEl) resultEl.textContent = 'Menghantar ' + added + ' rekod...';
    let sent = 0;
    for (const row of newRows) {
      try { await callWorker({ action: 'appendRow', sheetKey: 'GURU', row: row }); _guruData.push(row); sent++; if (row[7]) syncGuruToHariLahir(row); } catch(e) { skipped++; }
    }
    if (resultEl) resultEl.innerHTML = '<span style="color:var(--green)">✅ ' + sent + ' rekod diimport.</span>' + (skipped ? ' ⚠️ ' + skipped + ' dilangkau.' : '');
    showToast(sent + ' guru diimport!', 'success');
    updateGuruStats(); filterDataGuru();
  };
  reader.readAsText(file, 'UTF-8');
}

function downloadGuruTemplate() { downloadCSV('Nama,Emel,Jawatan,Kelas,No. Telefon,Status\nCikgu Contoh,contoh@moe-dl.edu.my,Guru Kelas,4 MUTIARA,60123456789,Aktif\n', 'templat_guru.csv'); }

function exportGuruCSV() {
  if (!_guruData.length) { showToast('Tiada data.', 'error'); return; }
  const headers = 'Nama,Emel,Jawatan,Kelas,Telefon,Status,WhatsApp,Tarikh Lahir,Catatan';
  const rows = _guruData.map(r => r.slice(0, 9).map(c => '"' + (c || '') + '"').join(','));
  downloadCSV([headers].concat(rows).join('\n'), 'data_guru_skkiandongo.csv');
  showToast('CSV dieksport.', 'success');
}

// ── DATA MURID ─────────────────────────────────────────────────
async function loadDataMurid() {
  const tbody = document.getElementById('dataMuridBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" style="color:var(--muted);text-align:center;padding:20px">Memuat data...</td></tr>';
  try {
    const data = await callWorker({ action: 'readSheet', sheetKey: 'MURID' });
    if (!data.success) throw new Error(data.error || 'Gagal');
    _muridData = (data.rows || []).filter(r => r[0] && String(r[0]).toLowerCase() !== 'nama');
    updateMuridStats(); filterDataMurid();
    showToast('Data murid dimuatkan: ' + _muridData.length + ' rekod', 'success');
  } catch(e) { tbody.innerHTML = '<tr><td colspan="8" style="color:var(--red);text-align:center;padding:20px">' + e.message + '</td></tr>'; showToast(e.message, 'error'); }
}

function updateMuridStats() {
  const kelas = new Set(_muridData.map(r => r[1] || '').filter(Boolean));
  setText('dm-total', _muridData.length);
  setText('dm-lelaki', _muridData.filter(r => r[2] === 'Lelaki').length);
  setText('dm-perempuan', _muridData.filter(r => r[2] === 'Perempuan').length);
  setText('dm-kelas', kelas.size);
}

function filterDataMurid() {
  const cari = ((document.getElementById('muridCari') || {}).value || '').toLowerCase();
  const kelas = (document.getElementById('muridFilterKelasData') || {}).value || '';
  const jantina = (document.getElementById('muridFilterJantina') || {}).value || '';
  _muridFiltered = _muridData.filter(r => {
    const matchCari = !cari || (r[0] || '').toLowerCase().includes(cari);
    const matchKelas = !kelas || r[1] === kelas;
    const matchJantina = !jantina || r[2] === jantina;
    return matchCari && matchKelas && matchJantina;
  });
  renderMuridTable();
}

function renderMuridTable() {
  const tbody = document.getElementById('dataMuridBody');
  if (!tbody) return;
  if (!_muridFiltered.length) { tbody.innerHTML = '<tr><td colspan="8" style="color:var(--muted);text-align:center;padding:20px">Tiada rekod dijumpai</td></tr>'; return; }
  tbody.innerHTML = _muridFiltered.map(function(r, i) {
    const globalIdx = _muridData.indexOf(r);
    const st = (r[7] || 'Aktif') === 'Aktif' ? '<span class="badge badge-green">Aktif</span>' : (r[7] || '') === 'Berpindah' ? '<span class="badge badge-amber">Berpindah</span>' : '<span class="badge badge-gray">Tidak Aktif</span>';
    const nama_safe = (r[0] || '').replace(/'/g, '');
    return '<tr><td style="color:var(--muted);font-size:0.8rem">' + (i+1) + '</td><td><strong>' + (r[0] || '—') + '</strong></td><td><span class="badge badge-blue">' + (r[1] || '—') + '</span></td><td>' + (r[2] === 'Lelaki' ? '👦' : '👧') + ' ' + (r[2] || '—') + '</td><td style="font-size:0.82rem">' + formatTarikhDisplay(r[3]) + '</td><td style="font-size:0.82rem">' + (r[5] || '—') + '<br><span style="color:var(--muted)">' + (r[4] || '') + '</span></td><td>' + st + '</td><td style="display:flex;gap:5px"><button class="btn btn-sm btn-secondary" onclick="editMurid(' + globalIdx + ')">✏️</button><button class="btn btn-sm btn-danger" onclick="confirmPadam(\'murid\',' + globalIdx + ',\'' + nama_safe + '\')">🗑</button></td></tr>';
  }).join('');
}

function formatTarikhDisplay(tarikh) {
  if (!tarikh) return '—';
  var s = String(tarikh).trim();
  // Sudah DD/MM/YYYY — terus return
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  // YYYY-MM-DD sahaja (tiada masa)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    var p = s.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }
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
  if (!tarikh) return '';
  if (String(tarikh).includes('/')) { const p = tarikh.split('/'); return p[2] ? p[2] + '-' + p[1].padStart(2,'0') + '-' + p[0].padStart(2,'0') : ''; }
  return tarikh;
}

async function submitMurid() {
  const nama = getTrimmedValue('m-nama');
  if (!nama) { showToast('Nama wajib diisi.', 'error'); return; }
  const tarikhRaw = getTrimmedValue('m-tarikh-lahir');
  let tarikhStored = tarikhRaw;
  if (tarikhRaw && tarikhRaw.includes('-')) { const p = tarikhRaw.split('-'); tarikhStored = p[2] + '/' + p[1] + '/' + p[0]; }
  const row = [nama, getTrimmedValue('m-kelas'), getTrimmedValue('m-jantina'), tarikhStored, getTrimmedValue('m-telefon-wali'), getTrimmedValue('m-wali'), getTrimmedValue('m-ic'), getTrimmedValue('m-status'), getTrimmedValue('m-catatan'), new Date().toISOString(), APP.user ? APP.user.email : ''];
  const editIdx = document.getElementById('muridEditIdx').value;
  try {
    if (editIdx !== '') { _muridData[parseInt(editIdx)] = row; await pushFullSheet('MURID', ['Nama','Kelas','Jantina','Tarikh Lahir','Telefon Wali','Nama Wali','No. IC','Status','Catatan','Dikemaskini','Oleh'], _muridData); showToast('Data murid dikemaskini.', 'success'); }
    else { const data = await callWorker({ action: 'appendRow', sheetKey: 'MURID', row: row }); if (!data.success) throw new Error(data.error); _muridData.push(row); showToast('Murid berjaya ditambah!', 'success'); }
    closeModal('modalMurid'); updateMuridStats(); filterDataMurid();
    if (tarikhStored) syncMuridToHariLahir(row);
  } catch(e) { showToast('Ralat: ' + e.message, 'error'); }
}

function syncMuridToHariLahir(row) {
  const parts = (row[3] || '').split('/');
  if (parts.length < 2) return;
  if (!hlData.some(h => h.nama === row[0] && h.peranan === 'Murid')) {
    hlData.push({ nama: row[0], peranan: 'Murid', kelas: row[1], hari: parseInt(parts[0]), bulan: parseInt(parts[1]), tahun: parts[2] ? parseInt(parts[2]) : null, telefon: row[4] || '' });
    localStorage.setItem('ssh_hl_data', JSON.stringify(hlData));
  }
}

function importMuridCSV() {
  const file = document.getElementById('muridCsvInput').files[0];
  if (!file) { showToast('Pilih fail CSV dahulu.', 'error'); return; }
  const reader = new FileReader();
  reader.onload = async function(e) {
    const lines = e.target.result.split(/\r?\n/).filter(function(l) { return l.trim(); });
    let added = 0, skipped = 0;
    const newRows = [];
    lines.forEach(function(line, idx) {
      if (idx === 0 && line.toLowerCase().replace(/"/g, '').startsWith('nama')) return;
      const cols = parseCSVLine(line);
      if (!cols[0]) { skipped++; return; }
      newRows.push([cols[0]||'',cols[1]||'',cols[2]||'Lelaki',cols[3]||'',cols[4]||'',cols[5]||'',cols[6]||'',cols[7]||'Aktif','',new Date().toISOString(),APP.user?APP.user.email:'']);
      added++;
    });
    const resultEl = document.getElementById('muridImportResult');
    if (!newRows.length) { if (resultEl) resultEl.textContent = '⚠️ Tiada data sah.'; return; }
    if (resultEl) resultEl.textContent = 'Menghantar ' + added + ' rekod...';
    let sent = 0;
    for (const row of newRows) {
      try { await callWorker({ action: 'appendRow', sheetKey: 'MURID', row: row }); _muridData.push(row); sent++; if (row[3]) syncMuridToHariLahir(row); } catch(e) { skipped++; }
    }
    if (resultEl) resultEl.innerHTML = '<span style="color:var(--green)">✅ ' + sent + ' rekod diimport.</span>' + (skipped ? ' ⚠️ ' + skipped + ' dilangkau.' : '');
    showToast(sent + ' murid diimport!', 'success');
    updateMuridStats(); filterDataMurid();
  };
  reader.readAsText(file, 'UTF-8');
}

function downloadMuridTemplate() { downloadCSV('Nama,Kelas,Jantina,Tarikh Lahir (DD/MM/YYYY),No. Telefon Wali,Nama Wali,No. IC,Status\nAhmad bin Ali,4 MUTIARA,Lelaki,12/05/2016,60198765432,Ali bin Abu,160512-12-1234,Aktif\n', 'templat_murid.csv'); }

function exportMuridCSV() {
  if (!_muridData.length) { showToast('Tiada data.', 'error'); return; }
  const headers = 'Nama,Kelas,Jantina,Tarikh Lahir,Telefon Wali,Nama Wali,No. IC,Status,Catatan';
  const rows = _muridData.map(r => r.slice(0, 9).map(c => '"' + (c || '') + '"').join(','));
  downloadCSV([headers].concat(rows).join('\n'), 'data_murid_skkiandongo.csv');
  showToast('CSV dieksport.', 'success');
}

// ── KONFIGURASI ────────────────────────────────────────────────
function saveWorkerUrl() {
  const url = (document.getElementById('workerUrl').value || '').trim();
  if (!url) { showToast('Sila masukkan URL Worker.', 'error'); return; }
  try {
    const normalized = new URL(url).toString().replace(/\/+$/, '');
    localStorage.setItem('ssh_worker_url', normalized);
    APP.workerUrl = normalized;
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
      const appsScriptInfo = data.appsScriptUrl
        ? ' | Apps Script: ' + data.appsScriptUrl
        : ' | Apps Script belum dikonfigurasi';
      el.textContent = 'Tersambung (' + latency + 'ms)' + appsScriptInfo;
      el.style.background = 'rgba(16,185,129,0.05)';
      el.style.borderColor = 'rgba(16,185,129,0.2)';
      el.style.color = 'var(--green)';
    } else {
      el.textContent = 'Respons tidak dijangka';
      el.style.background = 'rgba(245,197,24,0.05)';
      el.style.borderColor = 'rgba(245,197,24,0.2)';
      el.style.color = 'var(--gold2)';
    }
  } catch (e) {
    el.textContent = 'Gagal sambung: ' + e.message;
    el.style.background = 'rgba(239,68,68,0.05)';
    el.style.borderColor = 'rgba(239,68,68,0.2)';
    el.style.color = 'var(--red)';
  }
}

async function checkWorkerStatus() {
  setConfigStatus('Memeriksa status Worker...');
  try {
    const ping = await callWorker({ action: 'ping' });
    const data = await callWorker({ action: 'getConfig' });
    if (ping.success && data.success) {
      const configKeys = Object.keys(data.config || {});
      const lines = [
        'Worker berjalan dengan baik.',
        '',
        'Worker URL: ' + (APP.workerUrl || '—'),
        'Apps Script URL: ' + (ping.appsScriptUrl || '—'),
        'Apps Script dikonfigurasi: ' + (ping.appsScriptConfigured ? 'Ya' : 'Tidak'),
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
    if (data.success) { renderConfigTable(data.config); showToast('Config dimuatkan.', 'success'); }
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

function renderConfigTable(config) {
  if (!config) return;
  const card = document.getElementById('configPreviewCard');
  if (card) card.style.display = 'block';
  const tbody = document.getElementById('configTableBody');
  if (!tbody) return;
  tbody.innerHTML = Object.entries(config).map(function(entry) {
    return '<tr><td><strong>' + entry[0] + '</strong></td><td style="font-family:monospace;font-size:0.85rem">' + entry[1] + '</td></tr>';
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
  if (thead) thead.innerHTML = '<tr>' + rows[0].map(c => '<th>' + (c || '') + '</th>').join('') + '</tr>';
  if (tbody) tbody.innerHTML = rows.slice(1).map(r => '<tr>' + r.map(c => '<td>' + (c || '') + '</td>').join('') + '</tr>').join('');
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
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = '<span>' + (icons[type] || 'ℹ️') + '</span><span>' + msg + '</span>';
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

function statusBadge(status) {
  if (!status) return '<span class="badge badge-gray">-</span>';
  const s = String(status).toLowerCase();
  if (s === 'hadir') return '<span class="badge badge-green">Hadir</span>';
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
  var hadir = todayMurid.filter(function(r){ return r.status === 'Hadir'; }).length;
  var tidakHadir = todayMurid.filter(function(r){ return ['Tidak Hadir', 'Sakit', 'Ponteng'].includes(r.status); });
  var total = todayMurid.length;
  var pct = total ? Math.round((hadir / total) * 100) : 0;
  setText('dash-murid-hadir', hadir);
  setText('dash-tidak-hadir', tidakHadir.length);
  setText('dash-murid-pct', total ? pct + '% hadir' : '');
  renderWeeklyChart(todayMurid);
  renderMuridTidakHadirDash(tidakHadir);
}

async function loadKehadiranMurid() {
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
    const hadir = rows.filter(r => r.status === 'Hadir').length;
    const tidak = rows.filter(r => ['Tidak Hadir', 'Ponteng'].includes(r.status)).length;
    const cuti = rows.filter(r => ['Cuti', 'Sakit'].includes(r.status)).length;
    const pct = rows.length ? Math.round((hadir / rows.length) * 100) : 0;
    const setEl = function(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('murid-stat-hadir', hadir);
    setEl('murid-stat-tidak', tidak);
    setEl('murid-stat-cuti', cuti);
    setEl('murid-stat-pct', rows.length ? pct + '%' : '-');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="color:var(--muted);text-align:center;padding:20px">Tiada rekod</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map((item) => {
      const bolehNotif = ['Tidak Hadir', 'Ponteng'].includes(item.status);
      return '<tr><td><strong>' + (item.nama || '-') + '</strong></td><td><span class="badge badge-blue">' + (item.kelas || '-') + '</span></td><td>' + (item.tarikh || '-') + '</td><td>' + statusBadge(item.status) + '</td><td style="font-size:0.82rem">' + (item.telefon || '-') + '</td><td style="display:flex;gap:6px;flex-wrap:wrap">' + (bolehNotif ? '<button class="btn btn-sm btn-success" onclick=\'notifSatuMurid(' + JSON.stringify(item.nama || '') + ',' + JSON.stringify(item.kelas || '') + ',' + JSON.stringify(item.tarikh || '') + ',' + JSON.stringify(item.telefon || '') + ')\'>📩</button>' : '') + '</td></tr>';
    }).join('');
    showToast(rows.length + ' rekod dimuatkan.', 'success');
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--red);text-align:center;padding:20px">' + e.message + '</td></tr>';
    showToast(e.message, 'error');
  }
}

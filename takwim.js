// ═══════════════════════════════════════════════════════════════
// TAKWIM / KALENDER SEKOLAH — SmartSchoolHub v2.0
// takwim.js — Module untuk mengelola takwim/kalender sekolah
// ═══════════════════════════════════════════════════════════════

// Storage Keys
const TAKWIM_STORAGE_KEY = 'ssh_takwim_events';

// Warna tetap mengikut kategori — digunakan di grid, legenda & senarai
const TAKWIM_KATEGORI_WARNA = {
  'Penggal Sekolah':    '#1e40af',  // Biru tua
  'Cuti Sekolah':       '#dc2626',  // Merah
  'Cuti Tambahan KPM':  '#b45309',  // Coklat emas
  'Cuti Umum':          '#047857',  // Hijau
  'Cuti Negeri Sabah':  '#6d28d9',  // Ungu
  'Cuti Peristiwa':     '#0f766e',  // Teal gelap — cuti peristiwa khas
  'Akademik':           '#0e7490',  // Teal — aktiviti akademik
  'HEM':                '#be185d',  // Pink — hal ehwal murid
  'KoKum':              '#15803d',  // Hijau tua — kokurikulum
  'KoAkademik':         '#c2410c',  // Oren — ko-akademik
  'Aktiviti':           '#0369a1',  // Biru
  'Peperiksaan':        '#7c3aed',  // Ungu
  'Mesyuarat':          '#475569',  // Kelabu slate
  'Sukan':              '#0891b2',  // Cyan
  'Lain-lain':          '#6b7280',  // Kelabu neutral
};

function getKategoriWarna(event) {
  return TAKWIM_KATEGORI_WARNA[event.kategori] || event.warna || '#6b7280';
}

// Paparan Dashboard — Default bulan semasa
let takwimCurrentMonth = new Date();

// ──────────────────────────────────────────────────────────────
// SYNC STATUS
// ──────────────────────────────────────────────────────────────

function _takwimSetSyncStatus(status) {
  // status: 'synced' | 'syncing' | 'offline' | 'error'
  const el = document.getElementById('takwim-sync-status');
  if (!el) return;
  const map = {
    synced:  { text: '✓ Tersimpan', color: '#059669' },
    syncing: { text: '⟳ Menyegerak…', color: '#d97706' },
    offline: { text: '⚡ Mod Luar Talian', color: '#6b7280' },
    error:   { text: '✕ Gagal segerak', color: '#dc2626' }
  };
  const s = map[status] || map.offline;
  el.textContent = s.text;
  el.style.color = s.color;
}

// ──────────────────────────────────────────────────────────────
// API HELPERS — panggil Worker D1
// ──────────────────────────────────────────────────────────────

function _takwimWorkerUrl() {
  return (typeof APP !== 'undefined' && APP.workerUrl)
    ? APP.workerUrl.replace(/\/+$/, '') + '/api'
    : null;
}

function _takwimAuth() {
  return (typeof APP !== 'undefined' && APP.user)
    ? { idToken: APP.user.idToken || '', email: APP.user.email || '',
        name: APP.user.name || '', sub: APP.user.sub || '' }
    : null;
}

async function _takwimApiFetch(payload) {
  const url = _takwimWorkerUrl();
  const auth = _takwimAuth();
  if (!url || !auth) return { success: false, offline: true };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, auth }),
      signal: AbortSignal.timeout(8000)
    });
    return await res.json();
  } catch (e) {
    return { success: false, offline: true, error: e.message };
  }
}

// ──────────────────────────────────────────────────────────────
// LOAD & INIT
// ──────────────────────────────────────────────────────────────

async function initTakwimModule() {
  // 1. Seed 2026 ke localStorage jika tiada
  const existing = getTakwimEvents();
  const has2026 = existing.some(e => (e.id || '').startsWith('ps2026-'));
  if (!has2026) loadTakwim2026('merge');

  // 2. Render dari localStorage dahulu (pantas)
  renderDashboardTakwim();
  loadTakwimConfigUI();

  // 3. Segerak dari D1 di latar belakang
  _takwimSyncFromD1();
}

async function _takwimSyncFromD1() {
  const url = _takwimWorkerUrl();
  if (!url) { _takwimSetSyncStatus('offline'); return; }

  _takwimSetSyncStatus('syncing');
  const data = await _takwimApiFetch({ action: 'getTakwimEvents' });

  if (data.offline) { _takwimSetSyncStatus('offline'); return; }
  if (!data.success) { _takwimSetSyncStatus('error'); return; }

  // D1 ada data — guna sebagai sumber kebenaran
  if (Array.isArray(data.events) && data.events.length > 0) {
    localStorage.setItem(TAKWIM_STORAGE_KEY, JSON.stringify(data.events));
    renderDashboardTakwim();
    renderTakwimConfigList();
  } else {
    // D1 kosong — tolak data localStorage ke D1
    const local = getTakwimEvents();
    if (local.length > 0) {
      await _takwimApiFetch({ action: 'replaceTakwimEvents', events: local });
    }
  }
  _takwimSetSyncStatus('synced');
}

// ──────────────────────────────────────────────────────────────
// DATA MANAGEMENT — Simpan & Muat Events
// ──────────────────────────────────────────────────────────────

function loadTakwimEvents() {
  const stored = localStorage.getItem(TAKWIM_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Ralat parse takwim events:', e);
      return [];
    }
  }
  return [];
}

function saveTakwimEvents(events) {
  localStorage.setItem(TAKWIM_STORAGE_KEY, JSON.stringify(events));
  renderDashboardTakwim();
  renderTakwimConfigList();
}

function getTakwimEvents() {
  return loadTakwimEvents();
}

// ──────────────────────────────────────────────────────────────
// DASHBOARD TAKWIM — Paparan Kalender & Peristiwa Akan Datang
// ──────────────────────────────────────────────────────────────

function renderDashboardTakwim() {
  const events = getTakwimEvents();
  const year = takwimCurrentMonth.getFullYear();
  const month = takwimCurrentMonth.getMonth();

  // Update label bulan
  const options = { month: 'long', year: 'numeric', locale: 'ms-MY' };
  const monthLabel = takwimCurrentMonth.toLocaleDateString('ms-MY', options);
  const labelEl = document.getElementById('dash-takwim-label');
  if (labelEl) labelEl.textContent = monthLabel;

  // Render kalender grid
  renderTakwimGrid(year, month, events);

  // Render acara akan datang
  renderTakwimUpcomingEvents(events);

  // Render legenda kategori
  renderTakwimLegend(events);
}

function renderTakwimGrid(year, month, events) {
  const gridEl = document.getElementById('dash-takwim-grid');
  if (!gridEl) return;

  gridEl.innerHTML = '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const normalizedEvents = events.map(e => {
    const s = new Date(e.tarikh); s.setHours(0, 0, 0, 0);
    const en = e.tarikhAkhir ? new Date(e.tarikhAkhir) : new Date(e.tarikh);
    en.setHours(0, 0, 0, 0);
    return { ...e, _start: s, _end: en };
  });

  // ── Header hari ──────────────────────────────────────────────
  const daysHeader = ['Ahd', 'Isn', 'Sel', 'Rab', 'Kha', 'Jum', 'Sab'];
  const headerRow = document.createElement('div');
  headerRow.style.cssText = `
    display:grid;grid-template-columns:repeat(7,1fr);gap:3px;
    margin-bottom:6px;
  `;
  daysHeader.forEach((day, idx) => {
    const d = document.createElement('div');
    d.textContent = day;
    const isSun = idx === 0, isSat = idx === 6;
    d.style.cssText = `
      padding: 5px 2px;
      text-align: center;
      font-weight: 700;
      font-size: 0.68rem;
      letter-spacing: 0.04em;
      border-radius: 6px;
      background: ${isSun ? 'rgba(220,38,38,0.08)' : isSat ? 'rgba(8,145,178,0.08)' : 'rgba(26,79,160,0.05)'};
      color: ${isSun ? '#dc2626' : isSat ? '#0369a1' : 'var(--muted)'};
    `;
    headerRow.appendChild(d);
  });
  gridEl.appendChild(headerRow);

  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const cellsContainer = document.createElement('div');
  cellsContainer.style.cssText = 'display:grid;grid-template-columns:repeat(7,1fr);gap:3px';

  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(startDate);
    cellDate.setDate(cellDate.getDate() + i);
    cellDate.setHours(0, 0, 0, 0);

    const isCurrentMonth = cellDate.getMonth() === month;
    const isToday = cellDate.getTime() === today.getTime();
    const isSunday = cellDate.getDay() === 0;
    const isSaturday = cellDate.getDay() === 6;

    const dayEvents = normalizedEvents.filter(e =>
      cellDate >= e._start && cellDate <= e._end
    );
    const hasEvents = dayEvents.length > 0;

    let cellBg, cellBorder, cellShadow;
    if (isToday) {
      cellBg = 'linear-gradient(135deg,rgba(26,79,160,0.10) 0%,rgba(99,102,241,0.08) 100%)';
      cellBorder = '1.5px solid rgba(26,79,160,0.55)';
      cellShadow = '0 2px 8px rgba(26,79,160,0.12)';
    } else if (!isCurrentMonth) {
      cellBg = 'rgba(0,0,0,0.018)';
      cellBorder = '1px solid rgba(0,0,0,0.05)';
      cellShadow = 'none';
    } else if (isSunday) {
      cellBg = hasEvents ? '#fff' : 'rgba(254,242,242,0.6)';
      cellBorder = '1px solid rgba(220,38,38,0.12)';
      cellShadow = 'none';
    } else if (isSaturday) {
      cellBg = hasEvents ? '#fff' : 'rgba(240,249,255,0.7)';
      cellBorder = '1px solid rgba(8,145,178,0.12)';
      cellShadow = 'none';
    } else {
      cellBg = '#fff';
      cellBorder = '1px solid var(--border)';
      cellShadow = hasEvents ? '0 1px 4px rgba(0,0,0,0.06)' : 'none';
    }

    const cell = document.createElement('div');
    cell.style.cssText = `
      padding: 5px 4px 4px;
      min-height: 64px;
      border: ${cellBorder};
      border-radius: 8px;
      background: ${cellBg};
      font-size: 0.7rem;
      overflow: hidden;
      position: relative;
      cursor: pointer;
      transition: box-shadow 0.15s, background 0.15s;
      box-shadow: ${cellShadow};
    `;

    // ── Nombor tarikh ─────────────────────────────────────────
    const dateWrap = document.createElement('div');
    dateWrap.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:3px';

    const dateEl = document.createElement('div');
    if (isToday) {
      dateEl.style.cssText = `
        width: 22px; height: 22px;
        background: var(--blue);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-weight: 800; font-size: 0.75rem;
        color: #fff;
        flex-shrink: 0;
      `;
    } else {
      dateEl.style.cssText = `
        font-weight: ${isSunday ? '700' : '600'};
        font-size: 0.72rem;
        color: ${isSunday ? '#dc2626' : isSaturday ? '#0369a1' : isCurrentMonth ? 'var(--text)' : 'var(--muted)'};
        opacity: ${isCurrentMonth ? '1' : '0.45'};
        line-height: 1;
      `;
    }
    dateEl.textContent = cellDate.getDate();
    dateWrap.appendChild(dateEl);
    cell.appendChild(dateWrap);

    // ── Acara ─────────────────────────────────────────────────
    if (hasEvents) {
      const eventsWrap = document.createElement('div');
      eventsWrap.style.cssText = 'display:flex;flex-direction:column;gap:2px';

      const MAX_SHOW = 3;
      dayEvents.slice(0, MAX_SHOW).forEach(event => {
        const isStart  = cellDate.getTime() === event._start.getTime();
        const isEnd    = cellDate.getTime() === event._end.getTime();
        const isSingle = isStart && isEnd;
        const showText = isStart || (isSunday && !isSingle);

        const ml = (!isStart && !isSingle) ? '-4px' : '0';
        const mr = (!isEnd   && !isSingle) ? '-4px' : '0';
        const rl = (isStart  || isSingle)  ? '4px'  : '0';
        const rr = (isEnd    || isSingle)  ? '4px'  : '0';

        const warna = getKategoriWarna(event);
        const badge = document.createElement('div');
        badge.style.cssText = `
          background: ${warna};
          color: #fff;
          padding: ${showText ? '2px 5px' : '5px 0'};
          border-radius: ${rl} ${rr} ${rr} ${rl};
          font-size: 0.6rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          opacity: ${isCurrentMonth ? '1' : '0.45'};
          margin-left: ${ml};
          margin-right: ${mr};
          min-height: ${showText ? 'auto' : '7px'};
          line-height: 1.3;
          letter-spacing: 0.01em;
        `;
        badge.textContent = showText ? event.tajuk : '';
        badge.title = event.tajuk + (event._start < event._end
          ? ` (${event._start.toLocaleDateString('ms-MY', {day:'numeric',month:'short'})} – ${event._end.toLocaleDateString('ms-MY', {day:'numeric',month:'short'})})`
          : '');
        eventsWrap.appendChild(badge);
      });

      if (dayEvents.length > MAX_SHOW) {
        const more = document.createElement('div');
        more.textContent = `+${dayEvents.length - MAX_SHOW}`;
        more.style.cssText = `
          font-size:0.58rem;color:var(--blue);font-weight:700;
          padding: 1px 4px;
          background: rgba(26,79,160,0.08);
          border-radius: 4px;
          display: inline-block;
          margin-top: 1px;
        `;
        eventsWrap.appendChild(more);
      }

      cell.appendChild(eventsWrap);
    }

    cell.addEventListener('mouseenter', () => {
      if (!isToday) cell.style.boxShadow = '0 3px 12px rgba(0,0,0,0.10)';
      if (!isToday && isCurrentMonth) cell.style.background = isSunday ? 'rgba(254,226,226,0.6)' : isSaturday ? 'rgba(224,242,254,0.7)' : '#f5f7ff';
    });
    cell.addEventListener('mouseleave', () => {
      cell.style.boxShadow = cellShadow;
      cell.style.background = cellBg;
    });

    cellsContainer.appendChild(cell);
  }

  gridEl.appendChild(cellsContainer);
}

function renderTakwimUpcomingEvents(events) {
  const upcomingEl = document.getElementById('dash-takwim-upcoming');
  if (!upcomingEl) return;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcoming = events
    .filter(e => {
      const start = new Date(e.tarikh); start.setHours(0,0,0,0);
      const end = e.tarikhAkhir ? new Date(e.tarikhAkhir) : start;
      end.setHours(23,59,59,999);
      return end >= now;
    })
    .sort((a, b) => (a.tarikh < b.tarikh ? -1 : a.tarikh > b.tarikh ? 1 : 0))
    .slice(0, 5);

  upcomingEl.innerHTML = '';

  if (upcoming.length === 0) {
    upcomingEl.innerHTML = `<div style="color:var(--muted);font-size:0.82rem;padding:12px;text-align:center">Tiada acara akan datang.</div>`;
    return;
  }

  const BULAN = ['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ago','Sep','Okt','Nov','Dis'];
  const HARI  = ['Ahad','Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu'];

  upcoming.forEach(event => {
    const evtWarna = getKategoriWarna(event);
    const startDate = new Date(event.tarikh); startDate.setHours(0,0,0,0);
    const endDate = event.tarikhAkhir ? new Date(event.tarikhAkhir) : new Date(startDate);
    endDate.setHours(0,0,0,0);

    const diffMs = startDate - now;
    const diffDays = Math.round(diffMs / 86400000);
    const isOngoing = startDate <= now && endDate >= now;
    const daysLeft = isOngoing
      ? Math.round((endDate - now) / 86400000)
      : diffDays;

    let countdownText, countdownColor;
    if (isOngoing) {
      countdownText = daysLeft === 0 ? 'Tamat hari ini' : `Tamat ${daysLeft} hari lagi`;
      countdownColor = '#dc2626';
    } else if (diffDays === 0) {
      countdownText = 'Hari ini';
      countdownColor = '#059669';
    } else if (diffDays === 1) {
      countdownText = 'Esok';
      countdownColor = '#d97706';
    } else {
      countdownText = `${diffDays} hari lagi`;
      countdownColor = evtWarna;
    }

    const duration = Math.round((endDate - startDate) / 86400000) + 1;
    const durationText = duration > 1 ? `${duration} hari` : HARI[startDate.getDay()];

    const card = document.createElement('div');
    card.style.cssText = `
      display: flex;
      align-items: stretch;
      gap: 0;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid ${evtWarna}30;
      box-shadow: 0 2px 8px ${evtWarna}12;
      background: #fff;
      transition: box-shadow 0.15s, transform 0.15s;
      cursor: default;
    `;
    card.addEventListener('mouseenter', () => {
      card.style.boxShadow = `0 4px 16px ${evtWarna}28`;
      card.style.transform = 'translateY(-1px)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.boxShadow = `0 2px 8px ${evtWarna}12`;
      card.style.transform = '';
    });

    // Blok tarikh kiri
    card.innerHTML = `
      <div style="
        width: 52px; min-width: 52px;
        background: ${evtWarna};
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        padding: 10px 4px;
        flex-shrink: 0;
      ">
        <div style="font-size:1.15rem;font-weight:900;color:#fff;line-height:1">${startDate.getDate()}</div>
        <div style="font-size:0.62rem;font-weight:700;color:rgba(255,255,255,0.85);letter-spacing:0.04em;margin-top:2px">${BULAN[startDate.getMonth()]}</div>
        <div style="font-size:0.58rem;color:rgba(255,255,255,0.7);margin-top:1px">${startDate.getFullYear()}</div>
      </div>
      <div style="flex:1;padding:9px 12px;display:flex;flex-direction:column;justify-content:center;gap:3px;min-width:0">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          ${isOngoing ? `<span style="font-size:0.6rem;font-weight:700;background:#dc262618;color:#dc2626;border:1px solid #dc262630;border-radius:20px;padding:1px 7px">● Berlangsung</span>` : ''}
          <span style="font-size:0.65rem;font-weight:600;background:${evtWarna}15;color:${evtWarna};border:1px solid ${evtWarna}30;border-radius:20px;padding:1px 7px">${event.kategori}</span>
        </div>
        <div style="font-weight:700;font-size:0.85rem;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${event.tajuk}</div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:0.68rem;color:var(--muted)">${durationText}</span>
          <span style="font-size:0.68rem;font-weight:700;color:${countdownColor}">${countdownText}</span>
        </div>
      </div>
    `;

    upcomingEl.appendChild(card);
  });
}

function renderTakwimLegend(events) {
  const legendEl = document.getElementById('dash-takwim-legend');
  if (!legendEl) return;

  // Kumpul kategori unik yang ada dalam events bulan semasa
  const activeCategories = [...new Set(events.map(e => e.kategori))];
  // Susun mengikut urutan dalam TAKWIM_KATEGORI_WARNA, kemudian lain-lain
  const orderedKeys = Object.keys(TAKWIM_KATEGORI_WARNA);
  const sorted = [
    ...orderedKeys.filter(k => activeCategories.includes(k)),
    ...activeCategories.filter(k => !orderedKeys.includes(k))
  ];

  legendEl.innerHTML = '';

  sorted.forEach(cat => {
    const warna = TAKWIM_KATEGORI_WARNA[cat] || '#6b7280';
    const item = document.createElement('div');
    item.style.cssText = `
      display: flex; align-items: center; gap: 5px;
      padding: 3px 9px 3px 4px;
      background: ${warna}14;
      border: 1px solid ${warna}35;
      border-left: 3px solid ${warna};
      border-radius: 0 20px 20px 0;
      cursor: default;
      transition: background 0.15s;
    `;
    item.title = cat;
    item.addEventListener('mouseenter', () => item.style.background = `${warna}28`);
    item.addEventListener('mouseleave', () => item.style.background = `${warna}14`);

    const lbl = document.createElement('span');
    lbl.textContent = cat;
    lbl.style.cssText = 'font-size:0.68rem;font-weight:600;color:var(--text);white-space:nowrap';

    item.appendChild(lbl);
    legendEl.appendChild(item);
  });
}

// ──────────────────────────────────────────────────────────────
// NAVIGASI BULAN
// ──────────────────────────────────────────────────────────────

function navigateTakwimBulan(direction) {
  if (direction === 0) {
    // Kembali ke bulan semasa
    takwimCurrentMonth = new Date();
  } else {
    // ±1 bulan
    takwimCurrentMonth.setMonth(takwimCurrentMonth.getMonth() + direction);
  }
  renderDashboardTakwim();
}

// ──────────────────────────────────────────────────────────────
// KONFIGURASI ADMIN — Tambah/Edit/Padam Events
// ──────────────────────────────────────────────────────────────

function loadTakwimConfigUI() {
  updateTakwimConfigSummary();
  populateTakwimYearFilter();
  renderTakwimConfigList();
}

function populateTakwimYearFilter() {
  const events = getTakwimEvents();
  const filterEl = document.getElementById('takwim-config-filter');
  if (!filterEl) return;

  const years = [...new Set(events.map(e => new Date(e.tarikh).getFullYear()))].sort((a, b) => b - a);

  const currentOptions = filterEl.innerHTML;
  if (years.length > 0) {
    const yearOptions = years.map(year => `<option value="${year}">${year}</option>`).join('');
    filterEl.innerHTML = currentOptions.split('</option>')[0] + '</option>' + yearOptions;
  }
}

function updateTakwimConfigSummary() {
  const events = getTakwimEvents();
  const summaryEl = document.getElementById('takwim-config-summary');
  if (summaryEl) {
    summaryEl.textContent = `${events.length} acara`;
  }
}

function resetTakwimForm() {
  document.getElementById('takwim-edit-id').value = '';
  document.getElementById('takwim-input-tarikh').value = '';
  document.getElementById('takwim-input-tarikh-akhir').value = '';
  document.getElementById('takwim-input-tajuk').value = '';
  document.getElementById('takwim-input-kategori').value = 'Cuti';
  document.getElementById('takwim-input-warna').value = '#1A4FA0';
  document.getElementById('takwim-input-catatan').value = '';
  document.getElementById('takwim-save-label').textContent = 'Tambah Acara';
}

async function simpanTakwimEvent() {
  const id = document.getElementById('takwim-edit-id').value;
  const tarikh = document.getElementById('takwim-input-tarikh').value;
  const tarikhAkhir = document.getElementById('takwim-input-tarikh-akhir').value;
  const tajuk = document.getElementById('takwim-input-tajuk').value;
  const kategori = document.getElementById('takwim-input-kategori').value;
  const warna = document.getElementById('takwim-input-warna').value;
  const catatan = document.getElementById('takwim-input-catatan').value;

  if (!tarikh || !tajuk) {
    showToast('Sila isi tarikh mula dan tajuk acara.', 'warning');
    return;
  }

  const newEvent = {
    id: id || Date.now().toString(),
    tarikh, tarikhAkhir: tarikhAkhir || null,
    tajuk, kategori, warna, catatan
  };

  // Simpan ke localStorage dahulu
  const events = getTakwimEvents();
  if (id) {
    const idx = events.findIndex(e => e.id === id);
    if (idx !== -1) events[idx] = newEvent; else events.push(newEvent);
  } else {
    events.push(newEvent);
  }
  saveTakwimEvents(events);
  resetTakwimForm();
  showToast(`Acara "${tajuk}" disimpan.`, 'success');
  if (typeof trackActivity === 'function') {
    trackActivity('konfigurasi', `Acara takwim "${tajuk}" disimpan`, null, 'sukses');
  }

  // Sync ke D1 di latar belakang
  _takwimSetSyncStatus('syncing');
  const res = await _takwimApiFetch({ action: 'saveTakwimEvent', event: newEvent });
  _takwimSetSyncStatus(res.offline ? 'offline' : res.success ? 'synced' : 'error');
  if (!res.success && !res.offline) showToast('Amaran: gagal segerak ke pelayan.', 'warning');
}

function editTakwimEvent(id) {
  const events = getTakwimEvents();
  const event = events.find(e => e.id === id);
  if (!event) return;

  document.getElementById('takwim-edit-id').value = event.id;
  document.getElementById('takwim-input-tarikh').value = event.tarikh;
  document.getElementById('takwim-input-tarikh-akhir').value = event.tarikhAkhir || '';
  document.getElementById('takwim-input-tajuk').value = event.tajuk;
  document.getElementById('takwim-input-kategori').value = event.kategori;
  document.getElementById('takwim-input-warna').value = event.warna;
  document.getElementById('takwim-input-catatan').value = event.catatan;
  document.getElementById('takwim-save-label').textContent = 'Simpan Perubahan';

  // Scroll ke form
  const formEl = document.getElementById('takwim-input-tarikh');
  if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function padamTakwimEvent(id) {
  if (!confirm('Padam acara ini? Tindakan ini tidak boleh dibatalkan.')) return;

  let events = getTakwimEvents();
  const deletedEvent = events.find(e => e.id === id);
  events = events.filter(e => e.id !== id);
  saveTakwimEvents(events);
  showToast('Acara telah dipadamkan.', 'success');
  if (typeof trackActivity === 'function' && deletedEvent) {
    trackActivity('konfigurasi', `Acara takwim "${deletedEvent.tajuk}" dipadamkan`, null, 'sukses');
  }

  // Sync ke D1
  _takwimSetSyncStatus('syncing');
  const res = await _takwimApiFetch({ action: 'deleteTakwimEvent', id });
  _takwimSetSyncStatus(res.offline ? 'offline' : res.success ? 'synced' : 'error');
}

function renderTakwimConfigList() {
  const tableBody = document.getElementById('takwim-config-body');
  if (!tableBody) return;

  const events = getTakwimEvents();
  const searchVal = document.getElementById('takwim-config-cari')?.value || '';
  const filterVal = document.getElementById('takwim-config-filter')?.value || '';

  let filtered = events;

  // Search
  if (searchVal.trim()) {
    const q = searchVal.toLowerCase();
    filtered = filtered.filter(e =>
      e.tajuk.toLowerCase().includes(q) ||
      e.kategori.toLowerCase().includes(q)
    );
  }

  // Filter tahun
  if (filterVal) {
    const year = parseInt(filterVal);
    filtered = filtered.filter(e => new Date(e.tarikh).getFullYear() === year);
  }

  // Susun mengikut tarikh (tertua dahulu) — pakai string compare supaya ISO date selamat
  filtered = filtered.slice().sort((a, b) => {
    const da = a.tarikh || '9999';
    const db = b.tarikh || '9999';
    return da < db ? -1 : da > db ? 1 : 0;
  });

  tableBody.innerHTML = '';

  if (filtered.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px">Tiada acara ditemui.</td></tr>`;
    return;
  }

  filtered.forEach(event => {
    const row = document.createElement('tr');
    const tarikh = new Date(event.tarikh);
    const tarikhStr = tarikh.toLocaleDateString('ms-MY', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    row.innerHTML = `
      <td>${tarikhStr}</td>
      <td><strong>${event.tajuk}</strong></td>
      <td><span class="badge" style="background:${getKategoriWarna(event)}20;color:${getKategoriWarna(event)};border:1px solid ${getKategoriWarna(event)}40">${event.kategori}</span></td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${event.catatan || '—'}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-sm btn-secondary" onclick="editTakwimEvent('${event.id}')"><svg class="lucide-icon" width="14" height="14"><use href="#lucide-edit-3"></use></svg></button>
        <button class="btn btn-sm btn-danger" onclick="padamTakwimEvent('${event.id}')"><svg class="lucide-icon" width="14" height="14"><use href="#lucide-trash-2"></use></svg></button>
      </td>
    `;

    tableBody.appendChild(row);
  });

  updateTakwimConfigSummary();
}

// ──────────────────────────────────────────────────────────────
// EXPORT / IMPORT
// ──────────────────────────────────────────────────────────────

function exportTakwimEvents() {
  const events = getTakwimEvents();
  const dataStr = JSON.stringify(events, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `takwim-sekolah-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast('Takwim telah diekspor.', 'success');
}

function importTakwimEvents(fileInput) {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) {
        showToast('Format JSON tidak sah. Pastikan file adalah array events.', 'error');
        return;
      }

      const existing = getTakwimEvents();
      // Elak duplikasi ID
      const existingIds = new Set(existing.map(ev => ev.id));
      const toAdd = imported.filter(ev => !existingIds.has(ev.id));
      const merged = [...existing, ...toAdd];
      saveTakwimEvents(merged);
      showToast(`${toAdd.length} acara diimport (${imported.length - toAdd.length} duplikat dilangkau).`, 'success');
      fileInput.value = '';

      // Sync ke D1
      _takwimSetSyncStatus('syncing');
      const res = await _takwimApiFetch({ action: 'replaceTakwimEvents', events: merged });
      _takwimSetSyncStatus(res.offline ? 'offline' : res.success ? 'synced' : 'error');
    } catch (error) {
      showToast('Ralat membaca file JSON: ' + error.message, 'error');
    }
  };
  reader.readAsText(file);
}

// ──────────────────────────────────────────────────────────────
// DATA TAKWIM PERSEKOLAHAN 2026 — KUMPULAN B (SK Kiandongo, Sabah)
// Sumber: Surat Siaran KPM Bil. 3 Tahun 2025 & Jabatan Perdana Menteri (HKA 2026)
// ──────────────────────────────────────────────────────────────

function loadTakwim2026(mode = 'merge') {
  const TAKWIM_2026 = [

    // ── PENGGAL & CUTI SEKOLAH ──────────────────────────────────
    {
      id: 'ps2026-penggal1-mula',
      tarikh: '2026-01-12', tarikhAkhir: '2026-03-20',
      tajuk: 'Penggal 1 (Kumpulan B)', kategori: 'Penggal Sekolah',
      warna: '#1A4FA0', catatan: 'Mula persekolahan Penggal 1 – 12 Jan hingga 20 Mac 2026'
    },
    {
      id: 'ps2026-cuti-penggal1',
      tarikh: '2026-03-21', tarikhAkhir: '2026-03-29',
      tajuk: 'Cuti Penggal 1', kategori: 'Cuti Sekolah',
      warna: '#dc2626', catatan: '9 hari cuti — sekolah buka semula 30 Mac 2026'
    },
    {
      id: 'ps2026-penggal2-mula',
      tarikh: '2026-03-30', tarikhAkhir: '2026-05-22',
      tajuk: 'Penggal 2 (Kumpulan B)', kategori: 'Penggal Sekolah',
      warna: '#1A4FA0', catatan: 'Penggal 2 – 30 Mac hingga 22 Mei 2026'
    },
    {
      id: 'ps2026-cuti-tengah-tahun',
      tarikh: '2026-05-23', tarikhAkhir: '2026-06-07',
      tajuk: 'Cuti Pertengahan Tahun', kategori: 'Cuti Sekolah',
      warna: '#dc2626', catatan: '16 hari cuti — sekolah buka semula 8 Jun 2026'
    },
    {
      id: 'ps2026-penggal3-mula',
      tarikh: '2026-06-08', tarikhAkhir: '2026-08-28',
      tajuk: 'Penggal 3 (Kumpulan B)', kategori: 'Penggal Sekolah',
      warna: '#1A4FA0', catatan: 'Penggal 3 – 8 Jun hingga 28 Ogos 2026'
    },
    {
      id: 'ps2026-cuti-penggal3',
      tarikh: '2026-08-29', tarikhAkhir: '2026-09-06',
      tajuk: 'Cuti Penggal 3', kategori: 'Cuti Sekolah',
      warna: '#dc2626', catatan: '9 hari cuti — sekolah buka semula 7 Sep 2026'
    },
    {
      id: 'ps2026-penggal4-mula',
      tarikh: '2026-09-07', tarikhAkhir: '2026-12-04',
      tajuk: 'Penggal 4 (Kumpulan B)', kategori: 'Penggal Sekolah',
      warna: '#1A4FA0', catatan: 'Penggal 4 – 7 Sep hingga 4 Dis 2026'
    },
    {
      id: 'ps2026-cuti-akhir-tahun',
      tarikh: '2026-12-05', tarikhAkhir: '2026-12-31',
      tajuk: 'Cuti Akhir Tahun', kategori: 'Cuti Sekolah',
      warna: '#dc2626', catatan: '27 hari cuti akhir tahun 2026'
    },

    // ── CUTI TAMBAHAN KPM (PERAYAAN) ────────────────────────────
    {
      id: 'ps2026-tambahan-cny1',
      tarikh: '2026-02-16', tarikhAkhir: null,
      tajuk: 'Cuti Tambahan KPM — Tahun Baru Cina', kategori: 'Cuti Tambahan KPM',
      warna: '#d97706', catatan: 'Isnin sebelum Tahun Baru Cina (17-18 Feb)'
    },
    {
      id: 'ps2026-tambahan-cny2',
      tarikh: '2026-02-19', tarikhAkhir: '2026-02-20',
      tajuk: 'Cuti Tambahan KPM — Tahun Baru Cina', kategori: 'Cuti Tambahan KPM',
      warna: '#d97706', catatan: 'Khamis–Jumaat selepas Tahun Baru Cina (19–20 Feb)'
    },
    {
      id: 'ps2026-tambahan-raya',
      tarikh: '2026-03-19', tarikhAkhir: '2026-03-20',
      tajuk: 'Cuti Tambahan KPM — Hari Raya Aidilfitri', kategori: 'Cuti Tambahan KPM',
      warna: '#d97706', catatan: 'Khamis–Jumaat sebelum Cuti Penggal 1 / Hari Raya (19–20 Mac)'
    },
    {
      id: 'ps2026-tambahan-deepavali',
      tarikh: '2026-11-09', tarikhAkhir: null,
      tajuk: 'Cuti Tambahan KPM — Deepavali', kategori: 'Cuti Tambahan KPM',
      warna: '#d97706', catatan: 'Isnin sebelum Deepavali (10 Nov)'
    },

    // ── CUTI UMUM PERSEKUTUAN (SABAH) ───────────────────────────
    {
      id: 'ps2026-cu-tahunbaru',
      tarikh: '2026-01-01', tarikhAkhir: null,
      tajuk: 'Tahun Baru', kategori: 'Cuti Umum',
      warna: '#059669', catatan: 'Hari Tahun Baru — Khamis'
    },
    {
      id: 'ps2026-cu-cny1',
      tarikh: '2026-02-17', tarikhAkhir: null,
      tajuk: 'Tahun Baru Cina (Hari Pertama)', kategori: 'Cuti Umum',
      warna: '#b91c1c', catatan: 'Selasa — Semua negeri'
    },
    {
      id: 'ps2026-cu-cny2',
      tarikh: '2026-02-18', tarikhAkhir: null,
      tajuk: 'Tahun Baru Cina (Hari Kedua)', kategori: 'Cuti Umum',
      warna: '#b91c1c', catatan: 'Rabu — Semua negeri'
    },
    {
      id: 'ps2026-cu-nuzulquran',
      tarikh: '2026-03-07', tarikhAkhir: null,
      tajuk: 'Nuzul Al-Quran', kategori: 'Cuti Umum',
      warna: '#059669', catatan: 'Sabtu — Jatuh hujung minggu, tiada cuti gantian dinyatakan'
    },
    {
      id: 'ps2026-cu-raya1',
      tarikh: '2026-03-21', tarikhAkhir: null,
      tajuk: 'Hari Raya Aidilfitri (Hari Pertama)', kategori: 'Cuti Umum',
      warna: '#059669', catatan: 'Sabtu — Jatuh dalam Cuti Penggal 1'
    },
    {
      id: 'ps2026-cu-raya2',
      tarikh: '2026-03-22', tarikhAkhir: null,
      tajuk: 'Hari Raya Aidilfitri (Hari Kedua)', kategori: 'Cuti Umum',
      warna: '#059669', catatan: 'Ahad — Jatuh dalam Cuti Penggal 1'
    },
    {
      id: 'ps2026-cu-pekerja',
      tarikh: '2026-05-01', tarikhAkhir: null,
      tajuk: 'Hari Pekerja', kategori: 'Cuti Umum',
      warna: '#059669', catatan: 'Jumaat — Semua negeri'
    },
    {
      id: 'ps2026-cu-haji',
      tarikh: '2026-05-27', tarikhAkhir: null,
      tajuk: 'Hari Raya Aidiladha', kategori: 'Cuti Umum',
      warna: '#059669', catatan: 'Rabu — Jatuh dalam Cuti Pertengahan Tahun'
    },
    {
      id: 'ps2026-cu-wesak',
      tarikh: '2026-05-31', tarikhAkhir: null,
      tajuk: 'Hari Wesak', kategori: 'Cuti Umum',
      warna: '#7c3aed', catatan: 'Ahad — Jatuh dalam Cuti Pertengahan Tahun'
    },
    {
      id: 'ps2026-cu-agong',
      tarikh: '2026-06-01', tarikhAkhir: null,
      tajuk: 'Hari Keputeraan Yang di-Pertuan Agong', kategori: 'Cuti Umum',
      warna: '#059669', catatan: 'Isnin — Jatuh dalam Cuti Pertengahan Tahun'
    },
    {
      id: 'ps2026-cu-muharam',
      tarikh: '2026-06-17', tarikhAkhir: null,
      tajuk: 'Awal Muharram', kategori: 'Cuti Umum',
      warna: '#059669', catatan: 'Rabu — Tahun Baru Islam 1448H'
    },
    {
      id: 'ps2026-cu-maulidur',
      tarikh: '2026-08-25', tarikhAkhir: null,
      tajuk: 'Maulidur Rasul', kategori: 'Cuti Umum',
      warna: '#059669', catatan: 'Selasa — Hari Keputeraan Nabi Muhammad SAW'
    },
    {
      id: 'ps2026-cu-kebangsaan',
      tarikh: '2026-08-31', tarikhAkhir: null,
      tajuk: 'Hari Kebangsaan', kategori: 'Cuti Umum',
      warna: '#1A4FA0', catatan: 'Isnin — Jatuh dalam Cuti Penggal 3'
    },
    {
      id: 'ps2026-cu-malaysia',
      tarikh: '2026-09-16', tarikhAkhir: null,
      tajuk: 'Hari Malaysia', kategori: 'Cuti Umum',
      warna: '#1A4FA0', catatan: 'Rabu — Peringatan penubuhan Malaysia 1963'
    },
    {
      id: 'ps2026-cu-deepavali',
      tarikh: '2026-11-10', tarikhAkhir: null,
      tajuk: 'Hari Deepavali', kategori: 'Cuti Umum',
      warna: '#7c3aed', catatan: 'Selasa — Semua negeri kecuali Sarawak'
    },
    {
      id: 'ps2026-cu-krismas',
      tarikh: '2026-12-25', tarikhAkhir: null,
      tajuk: 'Hari Krismas', kategori: 'Cuti Umum',
      warna: '#dc2626', catatan: 'Jumaat — Jatuh dalam Cuti Akhir Tahun'
    },

    // ── CUTI UMUM SABAH KHUSUS ──────────────────────────────────
    {
      id: 'ps2026-sabah-ydpn',
      tarikh: '2026-03-30', tarikhAkhir: null,
      tajuk: 'Hari Keputeraan Yang di-Pertua Negeri Sabah', kategori: 'Cuti Negeri Sabah',
      warna: '#0f766e', catatan: 'Isnin — Ulang tahun kelahiran Tun Juhar Mahiruddin (29 Mac, diperhatikan 30 Mac)'
    },
    {
      id: 'ps2026-sabah-goodfriday',
      tarikh: '2026-04-03', tarikhAkhir: null,
      tajuk: 'Good Friday', kategori: 'Cuti Negeri Sabah',
      warna: '#0f766e', catatan: 'Jumaat — Khusus Sabah & Sarawak'
    },
    {
      id: 'ps2026-sabah-kaamatan1',
      tarikh: '2026-05-30', tarikhAkhir: null,
      tajuk: 'Pesta Kaamatan (Hari Pertama)', kategori: 'Cuti Negeri Sabah',
      warna: '#0f766e', catatan: 'Sabtu — Jatuh dalam Cuti Pertengahan Tahun'
    },
    {
      id: 'ps2026-sabah-kaamatan2',
      tarikh: '2026-05-31', tarikhAkhir: null,
      tajuk: 'Pesta Kaamatan (Hari Kedua)', kategori: 'Cuti Negeri Sabah',
      warna: '#0f766e', catatan: 'Ahad — Jatuh dalam Cuti Pertengahan Tahun'
    },
    {
      id: 'ps2026-sabah-krismas-eve',
      tarikh: '2026-12-24', tarikhAkhir: null,
      tajuk: 'Cuti Krismas (Sabah)', kategori: 'Cuti Negeri Sabah',
      warna: '#0f766e', catatan: 'Khamis — Cuti tambahan Krismas khusus Sabah, jatuh dalam Cuti Akhir Tahun'
    },
  ];

  const existing = getTakwimEvents();

  let finalEvents;
  if (mode === 'replace') {
    // Buang semua rekod 2026 yang ada, ganti dengan data baru
    const nonYear2026 = existing.filter(e => {
      const y = new Date(e.tarikh).getFullYear();
      return y !== 2026;
    });
    finalEvents = [...nonYear2026, ...TAKWIM_2026];
  } else {
    // Merge: tambah sahaja rekod yang belum ada (ikut ID)
    const existingIds = new Set(existing.map(e => e.id));
    const toAdd = TAKWIM_2026.filter(e => !existingIds.has(e.id));
    finalEvents = [...existing, ...toAdd];
    if (toAdd.length === 0) {
      showToast('Takwim 2026 sudah pun dimuat. Tiada rekod baru ditambah.', 'info');
      return;
    }
  }

  saveTakwimEvents(finalEvents);
  showToast(
    mode === 'replace'
      ? `Takwim 2026 dimuatkan semula. ${TAKWIM_2026.length} acara diisi.`
      : `${TAKWIM_2026.filter(e => !new Set(existing.map(x=>x.id)).has(e.id)).length} acara takwim 2026 ditambah.`,
    'success'
  );
  if (typeof trackActivity === 'function') {
    trackActivity('takwim', 'Takwim Persekolahan 2026 Kumpulan B dimuatkan', null, 'sukses');
  }

  // Sync ke D1 di latar belakang
  _takwimSetSyncStatus('syncing');
  _takwimApiFetch({ action: 'replaceTakwimEvents', events: finalEvents })
    .then(res => _takwimSetSyncStatus(res.offline ? 'offline' : res.success ? 'synced' : 'error'));
}

// ──────────────────────────────────────────────────────────════
// Default Toast fallback (jika tidak ada di app.js)
// ──────────────────────────────────────────────────────────────

function showToast(msg, type = 'info') {
  if (typeof window.showToast === 'function') {
    window.showToast(msg, type);
  } else {
    const n = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
    console.log(`[${type.toUpperCase()}] ${msg}`);
  }
}

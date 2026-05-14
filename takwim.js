// ═══════════════════════════════════════════════════════════════
// TAKWIM / KALENDER SEKOLAH — SmartSchoolHub v2.0
// takwim.js — Module untuk mengelola takwim/kalender sekolah
// ═══════════════════════════════════════════════════════════════

// Storage Keys
const TAKWIM_STORAGE_KEY = 'ssh_takwim_events';

// Paparan Dashboard — Default bulan semasa
let takwimCurrentMonth = new Date();

// ──────────────────────────────────────────────────────────────
// LOAD & INIT
// ──────────────────────────────────────────────────────────────

function initTakwimModule() {
  loadTakwimEvents();
  renderDashboardTakwim();
  loadTakwimConfigUI();
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
// DASHBOARD TAKWIM — Paparan Kalender & Acara Akan Datang
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

  // Header hari
  const daysHeader = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'];
  const headerRow = document.createElement('div');
  headerRow.style.cssText = 'display:grid; grid-template-columns:repeat(7,1fr); gap:2px; margin-bottom:8px; font-weight:700; font-size:0.75rem; text-align:center; color:var(--muted)';
  daysHeader.forEach(day => {
    const dayEl = document.createElement('div');
    dayEl.textContent = day;
    dayEl.style.padding = '4px';
    headerRow.appendChild(dayEl);
  });
  gridEl.appendChild(headerRow);

  // Cells untuk hari bulan
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const cellsContainer = document.createElement('div');
  cellsContainer.style.cssText = 'display:grid; grid-template-columns:repeat(7,1fr); gap:2px; min-height:200px';

  // 42 hari (6 baris × 7 kolom)
  for (let i = 0; i < 42; i++) {
    const cellDate = new Date(startDate);
    cellDate.setDate(cellDate.getDate() + i);

    const cell = document.createElement('div');
    cell.style.cssText = `
      padding: 6px 4px;
      min-height: 50px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: ${cellDate.getMonth() !== month ? 'rgba(0,0,0,0.02)' : '#fff'};
      font-size: 0.7rem;
      overflow: hidden;
      position: relative;
      cursor: pointer;
      transition: all 0.2s;
    `;

    if (cellDate.getMonth() === month) {
      cell.style.background = '#fff';
    }

    // Tarikh
    const dateEl = document.createElement('div');
    dateEl.textContent = cellDate.getDate();
    dateEl.style.cssText = `
      font-weight: 700;
      color: ${cellDate.getMonth() === month ? 'var(--text)' : 'var(--muted)'};
      margin-bottom: 2px;
    `;
    cell.appendChild(dateEl);

    // Events untuk hari ini
    const dayEvents = events.filter(e => {
      const eDate = new Date(e.tarikh);
      return eDate.getDate() === cellDate.getDate() &&
             eDate.getMonth() === cellDate.getMonth() &&
             eDate.getFullYear() === cellDate.getFullYear();
    });

    if (dayEvents.length > 0) {
      const eventsContainer = document.createElement('div');
      eventsContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 2px;
        flex: 1;
        justify-content: flex-start;
      `;

      dayEvents.slice(0, 2).forEach(event => {
        const badge = document.createElement('div');
        badge.style.cssText = `
          background: ${event.warna};
          color: #fff;
          padding: 1px 3px;
          border-radius: 2px;
          font-size: 0.6rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          opacity: 0.9;
        `;
        badge.textContent = event.tajuk;
        badge.title = event.tajuk;
        eventsContainer.appendChild(badge);
      });

      if (dayEvents.length > 2) {
        const moreEl = document.createElement('div');
        moreEl.textContent = `+${dayEvents.length - 2}`;
        moreEl.style.cssText = `
          font-size: 0.6rem;
          color: var(--blue);
          font-weight: 700;
        `;
        eventsContainer.appendChild(moreEl);
      }

      cell.appendChild(eventsContainer);
    }

    cell.addEventListener('mouseenter', () => {
      cell.style.background = cellDate.getMonth() === month ? 'var(--blue-light)' : 'rgba(0,0,0,0.04)';
      cell.style.boxShadow = 'inset 0 0 8px rgba(0,0,0,0.05)';
    });

    cell.addEventListener('mouseleave', () => {
      cell.style.background = cellDate.getMonth() === month ? '#fff' : 'rgba(0,0,0,0.02)';
      cell.style.boxShadow = 'none';
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
    .filter(e => new Date(e.tarikh) >= now)
    .sort((a, b) => new Date(a.tarikh) - new Date(b.tarikh))
    .slice(0, 5);

  upcomingEl.innerHTML = '';

  if (upcoming.length === 0) {
    upcomingEl.innerHTML = `<div style="color:var(--muted);font-size:0.82rem;padding:12px;text-align:center">Tiada acara akan datang.</div>`;
    return;
  }

  upcoming.forEach(event => {
    const eventCard = document.createElement('div');
    eventCard.style.cssText = `
      padding: 10px;
      border-radius: 8px;
      background: #f8f9fa;
      border-left: 4px solid ${event.warna};
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.8rem;
    `;

    const tarikh = new Date(event.tarikh);
    const tarikhStr = tarikh.toLocaleDateString('ms-MY', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });

    eventCard.innerHTML = `
      <div style="flex-shrink:0;width:50px;text-align:center;color:var(--muted)">
        <div style="font-size:0.7rem;font-weight:700">${tarikh.getDate()}</div>
        <div style="font-size:0.65rem">${['Jan', 'Feb', 'Mac', 'Apr', 'Mei', 'Jun', 'Jul', 'Ago', 'Sep', 'Okt', 'Nov', 'Dis'][tarikh.getMonth()]}</div>
      </div>
      <div style="flex:1">
        <div style="font-weight:700;color:var(--text)">${event.tajuk}</div>
        <div style="font-size:0.7rem;color:var(--muted)">${event.kategori}</div>
      </div>
    `;

    upcomingEl.appendChild(eventCard);
  });
}

function renderTakwimLegend(events) {
  const legendEl = document.getElementById('dash-takwim-legend');
  if (!legendEl) return;

  const categories = [...new Set(events.map(e => e.kategori))];

  legendEl.innerHTML = '';

  categories.forEach(cat => {
    const event = events.find(e => e.kategori === cat);
    if (event) {
      const badge = document.createElement('div');
      badge.style.cssText = `
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background: rgba(0,0,0,0.02);
        border-radius: 4px;
      `;

      const colorDot = document.createElement('div');
      colorDot.style.cssText = `
        width: 8px;
        height: 8px;
        background: ${event.warna};
        border-radius: 50%;
      `;

      const label = document.createElement('span');
      label.textContent = cat;
      label.style.fontSize = '0.7rem';

      badge.appendChild(colorDot);
      badge.appendChild(label);
      legendEl.appendChild(badge);
    }
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

function simpanTakwimEvent() {
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

  const events = getTakwimEvents();
  const newEvent = {
    id: id || Date.now().toString(),
    tarikh,
    tarikhAkhir: tarikhAkhir || null,
    tajuk,
    kategori,
    warna,
    catatan
  };

  if (id) {
    // Edit
    const idx = events.findIndex(e => e.id === id);
    if (idx !== -1) events[idx] = newEvent;
  } else {
    // Tambah baru
    events.push(newEvent);
  }

  saveTakwimEvents(events);
  resetTakwimForm();
  showToast(`Acara "${tajuk}" disimpan.`, 'success');
  // Track activity
  if (typeof trackActivity === 'function') {
    trackActivity('konfigurasi', `Acara takwim "${tajuk}" disimpan`, null, 'sukses');
  }
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

function padamTakwimEvent(id) {
  if (!confirm('Padam acara ini? Tindakan ini tidak boleh dibatalkan.')) return;

  let events = getTakwimEvents();
  const deletedEvent = events.find(e => e.id === id);
  events = events.filter(e => e.id !== id);
  saveTakwimEvents(events);
  showToast('Acara telah dipadamkan.', 'success');
  // Track activity
  if (typeof trackActivity === 'function' && deletedEvent) {
    trackActivity('konfigurasi', `Acara takwim "${deletedEvent.tajuk}" dipadamkan`, null, 'sukses');
  }
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
      <td><span class="badge" style="background:${event.warna}20;color:${event.warna};border:1px solid ${event.warna}40">${event.kategori}</span></td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${event.catatan || '—'}</td>
      <td style="white-space:nowrap">
        <button class="btn btn-sm btn-secondary" onclick="editTakwimEvent('${event.id}')"><svg class="lucide-icon" width="14" height="14"><use href="#lucide-edit-2"></use></svg></button>
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
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (!Array.isArray(imported)) {
        showToast('Format JSON tidak sah. Pastikan file adalah array events.', 'error');
        return;
      }

      const events = getTakwimEvents();
      const newEvents = [...events, ...imported];
      saveTakwimEvents(newEvents);
      showToast(`${imported.length} acara telah diimport.`, 'success');
      fileInput.value = '';
    } catch (error) {
      showToast('Ralat membaca file JSON: ' + error.message, 'error');
    }
  };
  reader.readAsText(file);
}

// ──────────────────────────────────────────────────────────════
// Default Toast fallback (jika tidak ada di app.js)
// ────────────────────
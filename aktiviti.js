// ========================================================
// AKTIVITI TERKINI & LOG SISTEM
// ========================================================

const AKTIVITI_STORAGE_KEY = 'ssh_aktiviti_log';

/**
 * Track a new activity/event in the system log
 */
function trackActivity(jenis, perihal, user = null, status = 'sukses') {
  try {
    const currentUser = user || (APP.currentUser ? APP.currentUser.nama : 'Sistem');
    const activity = {
      id: Date.now().toString(),
      masa: new Date().toISOString(),
      jenis: jenis,
      perihal: perihal,
      pengguna: currentUser,
      status: status
    };

    let aktiviti = JSON.parse(localStorage.getItem(AKTIVITI_STORAGE_KEY) || '[]');
    aktiviti.unshift(activity);

    if (aktiviti.length > 500) {
      aktiviti = aktiviti.slice(0, 500);
    }

    localStorage.setItem(AKTIVITI_STORAGE_KEY, JSON.stringify(aktiviti));
  } catch (e) {
    console.error('Error tracking activity:', e);
  }
}

function loadAktiviti() {
  try {
    return JSON.parse(localStorage.getItem(AKTIVITI_STORAGE_KEY) || '[]');
  } catch (e) {
    console.error('Error loading activities:', e);
    return [];
  }
}

function renderAktiviti() {
  const activities = loadAktiviti();
  const tbody = document.getElementById('aktivitiTableBody');

  if (!tbody) return;

  if (activities.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--muted)">Tiada aktiviti direkod.</td></tr>';
    updateAktivitStats(activities);
    return;
  }

  tbody.innerHTML = activities.map(act => {
    const mas = new Date(act.masa);
    const tarikh = mas.toLocaleDateString('ms-MY', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const waktu = mas.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });

    const statusColor = act.status === 'sukses' ? 'var(--green)' : act.status === 'gagal' ? 'var(--red)' : 'var(--amber)';
    const statusIcon = act.status === 'sukses' ? 'checkmark' : act.status === 'gagal' ? 'x' : 'dot';
    const statusSymbol = act.status === 'sukses' ? '✓' : act.status === 'gagal' ? '✗' : '⋯';

    return '<tr><td style="font-size:0.85rem">' + tarikh + '<br><span style="color:var(--muted)">' + waktu + '</span></td><td style="font-size:0.85rem"><span style="background:rgba(59,130,246,0.1);padding:3px 8px;border-radius:4px;color:var(--blue)">' + escapeHtml(act.jenis) + '</span></td><td style="font-size:0.85rem;color:var(--text)">' + escapeHtml(act.perihal) + '</td><td style="font-size:0.85rem;color:var(--muted)">' + escapeHtml(act.pengguna) + '</td><td style="font-size:0.85rem;color:' + statusColor + ';font-weight:600">' + statusSymbol + ' ' + act.status + '</td></tr>';
  }).join('');

  updateAktivitStats(activities);
}

function updateAktivitStats(activities) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const todayCount = activities.filter(a => {
    const aDate = new Date(a.masa);
    aDate.setHours(0, 0, 0, 0);
    return aDate.getTime() === today.getTime();
  }).length;

  const weekCount = activities.filter(a => {
    const aDate = new Date(a.masa);
    return aDate >= weekAgo;
  }).length;

  const el1 = document.getElementById('aktivitiCountToday');
  const el2 = document.getElementById('aktivitiCountThisWeek');
  const el3 = document.getElementById('aktivitiCountTotal');

  if (el1) el1.textContent = todayCount;
  if (el2) el2.textContent = weekCount;
  if (el3) el3.textContent = activities.length;
}

function filterAktiviti() {
  const startDate = document.getElementById('aktivitiFilterStartDate') ? document.getElementById('aktivitiFilterStartDate').value : '';
  const endDate = document.getElementById('aktivitiFilterEndDate') ? document.getElementById('aktivitiFilterEndDate').value : '';
  const filterType = document.getElementById('aktivitiFilterType') ? document.getElementById('aktivitiFilterType').value : '';

  let activities = loadAktiviti();

  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    activities = activities.filter(a => new Date(a.masa) >= start);
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    activities = activities.filter(a => new Date(a.masa) <= end);
  }

  if (filterType) {
    activities = activities.filter(a => a.jenis === filterType);
  }

  const tbody = document.getElementById('aktivitiTableBody');
  if (!tbody) return;

  if (activities.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--muted)">Tiada aktiviti menyuai penapis.</td></tr>';
    return;
  }

  tbody.innerHTML = activities.map(act => {
    const mas = new Date(act.masa);
    const tarikh = mas.toLocaleDateString('ms-MY', { year: 'numeric', month: '2-digit', day: '2-digit' });
    const waktu = mas.toLocaleTimeString('ms-MY', { hour: '2-digit', minute: '2-digit' });

    const statusColor = act.status === 'sukses' ? 'var(--green)' : act.status === 'gagal' ? 'var(--red)' : 'var(--amber)';
    const statusSymbol = act.status === 'sukses' ? '✓' : act.status === 'gagal' ? '✗' : '⋯';

    return '<tr><td style="font-size:0.85rem">' + tarikh + '<br><span style="color:var(--muted)">' + waktu + '</span></td><td style="font-size:0.85rem"><span style="background:rgba(59,130,246,0.1);padding:3px 8px;border-radius:4px;color:var(--blue)">' + escapeHtml(act.jenis) + '</span></td><td style="font-size:0.85rem;color:var(--text)">' + escapeHtml(act.perihal) + '</td><td style="font-size:0.85rem;color:var(--muted)">' + escapeHtml(act.pengguna) + '</td><td style="font-size:0.85rem;color:' + statusColor + ';font-weight:600">' + statusSymbol + ' ' + act.status + '</td></tr>';
  }).join('');

  showToast(activities.length + ' aktiviti dijumpai.', 'info');
}

function resetAktivitFilter() {
  const el1 = document.getElementById('aktivitiFilterStartDate');
  const el2 = document.getElementById('aktivitiFilterEndDate');
  const el3 = document.getElementById('aktivitiFilterType');

  if (el1) el1.value = '';
  if (el2) el2.value = '';
  if (el3) el3.value = '';

  renderAktiviti();
  showToast('Penapis direset.', 'info');
}

function refreshAktiviti() {
  renderAktiviti();
  showToast('Aktiviti dimuat semula.', 'info');
}

function exportAktiviti() {
  const activities = loadAktiviti();

  if (activities.length === 0) {
    showToast('Tiada aktiviti untuk dieksport.', 'error');
    return;
  }

  const headers = ['Tarikh & Masa', 'Jenis', 'Perihal', 'Pengguna', 'Status'];
  const rows = activities.map(a => {
    const mas = new Date(a.masa);
    const tarikh = mas.toLocaleDateString('ms-MY');
    const waktu = mas.toLocaleTimeString('ms-MY');
    return [
      tarikh + ' ' + waktu,
      a.jenis,
      a.perihal,
      a.pengguna,
      a.status
    ];
  });

  let csv = headers.join(',') + '\n';
  csv += rows.map(r => r.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  const tarikh = new Date().toISOString().split('T')[0];

  link.setAttribute('href', url);
  link.setAttribute('download', 'aktiviti-' + tarikh + '.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Aktiviti berjaya dieksport.', 'success');
}

function clearAktiviti() {
  if (!confirm('Adakah anda pasti ingin memadamkan SEMUA aktiviti? Tindakan ini tidak boleh dibatalkan.')) {
    return;
  }

  localStorage.removeItem(AKTIVITI_STORAGE_KEY);
  renderAktiviti();
  showToast('Semua aktiviti telah dipadamkan.', 'success');
}

// ============================================================
// SmartSchoolHub - Safe Import Template
// Jalankan dalam Console (F12) semasa SmartSchoolHub dibuka
//
// Tujuan:
// - Elak simpan data peribadi sebenar terus dalam repo
// - Guna sample fixture atau data yang dimuatkan secara tempatan
//
// Cara guna cepat:
// 1. Pastikan Worker URL sudah diset dalam aplikasi
// 2. Muatkan fail sample CSV dari folder `sample-data/`
// 3. Ubah / tambah data dalam pembolehubah di bawah jika perlu
// 4. Paste fail ini dalam console atau jalankan terus dari repo tempatan
//
// Nota:
// - Jangan commit data sebenar murid/guru ke dalam fail ini
// - Jika perlu import data sebenar, simpan di folder tempatan yang diignore Git
// ============================================================

(async function () {
  const WORKER = localStorage.getItem('ssh_worker_url');
  if (!WORKER) {
    alert('Worker URL tidak dijumpai. Sila set Worker URL dalam Konfigurasi dahulu.');
    return;
  }

  const SAMPLE_GURU_ROWS = [
    ['CONTOH GURU BESAR', 'guru.besar@example.edu.my', 'Guru Besar', '-', '60110000001', 'Aktif', '60110000001', '1980-01-10', 'Sample data']
  ];

  const SAMPLE_MURID_ROWS = [
    ['MURID CONTOH SATU', '1 NILAM', 'Lelaki', '2019-01-15', '60110000011', 'PENJAGA CONTOH', 'SAMPLE-IC-001', 'Aktif', 'Sample data']
  ];

  const SAMPLE_HL_DATA = [
    { nama: 'CONTOH GURU BESAR', peranan: 'Guru', kelas: '', hari: 10, bulan: 1, tahun: 1980, telefon: '60110000001' },
    { nama: 'MURID CONTOH SATU', peranan: 'Murid', kelas: '1 NILAM', hari: 15, bulan: 1, tahun: 2019, telefon: '60110000011' }
  ];

  async function push(sheetKey, row) {
    const res = await fetch(WORKER.replace(/\/+$/, '') + '/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'appendRow', sheetKey: sheetKey, row: row })
    });
    return res.json();
  }

  function sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function getRowsFromWindow(name, fallbackRows) {
    if (Array.isArray(window[name]) && window[name].length) return window[name];
    return fallbackRows;
  }

  async function importSheetRows(sheetKey, rows, label) {
    console.log('Import ' + label + ': ' + rows.length + ' rekod');
    let ok = 0;
    let fail = 0;
    for (const row of rows) {
      try {
        const result = await push(sheetKey, row);
        if (result && result.success) ok++;
        else fail++;
      } catch (e) {
        fail++;
      }
      await sleep(250);
    }
    console.log(label + ': ' + ok + ' berjaya, ' + fail + ' gagal');
  }

  const guruRows = getRowsFromWindow('SMARTSCHOOLHUB_IMPORT_GURU_ROWS', SAMPLE_GURU_ROWS);
  const muridRows = getRowsFromWindow('SMARTSCHOOLHUB_IMPORT_MURID_ROWS', SAMPLE_MURID_ROWS);
  const hlData = Array.isArray(window.SMARTSCHOOLHUB_IMPORT_HL_DATA) && window.SMARTSCHOOLHUB_IMPORT_HL_DATA.length
    ? window.SMARTSCHOOLHUB_IMPORT_HL_DATA
    : SAMPLE_HL_DATA;

  console.log('Mula import template SmartSchoolHub...');
  await importSheetRows('GURU', guruRows, 'Guru');
  await importSheetRows('MURID', muridRows, 'Murid');
  localStorage.setItem('ssh_hl_data', JSON.stringify(hlData));
  console.log('Hari Lahir: ' + hlData.length + ' rekod disimpan dalam localStorage aplikasi.');
  alert(
    'Import template selesai.\n\n' +
    'Guru: ' + guruRows.length + ' rekod\n' +
    'Murid: ' + muridRows.length + ' rekod\n' +
    'Hari Lahir: ' + hlData.length + ' rekod\n\n' +
    'Untuk data sebenar, muatkan data dari fail tempatan yang tidak ditrack Git.'
  );
})();

# SmartSchoolHub (xbasmarthub) — Konteks Projek
_Dikemaskini: 2026-05-07_

## Fail Utama
- `D:\smarthub\app.js` — frontend JS utama (semua fungsi modul)
- `D:\smarthub\index.html` — UI HTML tunggal (SPA)
- `D:\smarthub\SmartSchoolHub_Worker.js` — Cloudflare Worker (backend, D1, AI)
- `D:\smarthub\runtime-config.js` — konfigurasi runtime
- `D:\smarthub\dskp_embedded.js` — database DSKP KPM embedded

## Backend — Cloudflare D1
- Binding: `env.DB`
- Jadual utama: `sheet_rows` (sheet_name TEXT, row_index INT, row_json TEXT, updated_at TEXT)
- Fungsi sedia ada: `d1ReadSheet(env, sheetKey)`, `d1UpdateSheetValues()`, `d1AppendRows()`
- Flag: `shouldUseCloudflareD1(env)` — semak `env.CLOUDFLARE_D1_BACKEND === "1" && env.DB`

## Data Murid dalam D1
- Sheet name: `MURID`
- Headers (ikut index): `["Nama","Kelas","Jantina","Tarikh Lahir","Telefon Wali","Nama Wali","No. IC","Status","Catatan","Kokum Unit Beruniform","Kokum Kelab Dan Persatuan","Kokum Sukan Dan Permainan","Dikemaskini","Oleh"]`
- Nama = index 0, Kelas = index 1
- Query: `SELECT row_json FROM sheet_rows WHERE sheet_name = 'MURID' ORDER BY row_index ASC`

## Senarai Kelas (STUDENT_CLASSES)
```js
["1 NILAM","2 INTAN","3 KRISTAL","4 MUTIARA","5 DELIMA","6 BAIDURI"]
```
Defined dalam `SmartSchoolHub_Worker.js` baris 20.

## Modul Lembaran Kerja (LK)
- Diinit: `lkInitModule()` — dipanggil bila navigasi ke `#lembaran-kerja`
- Fungsi cetak sedia ada: `lkCetakOutput()` — baris 12115 dalam `app.js`
- UI field sedia ada: `lkJenis`, `lkTahun`, `lkSubjek`, `lkTopik`, `lkBilSoalan`, `lkMasaMenjawab`, `lkGuruPenyedia`, `lkKodKertas`
- **Tiada field kelas** dalam UI LK — perlu tambah dropdown `lkKelas`
- **Tiada field tarikh** dalam UI LK — guna `new Date()` auto
- Butang cetak sedia ada (index.html baris 2995): `onclick="lkCetakOutput()"`

### lkCetakOutput() — Struktur
- PDPC: nama/kelas/tarikh **KOSONG** (garisan kosong) — baris 12297-12302
- UASA/PBD-AT: MAKLUMAT CALON **KOSONG** — baris 12211-12213
- Buka `window.open()` → `w.document.write()` → `w.print()`
- Pisah skema jawapan ke window kedua jika ada

## Pelan Integrasi Cetak Murid dari D1 (belum dilaksanakan)
3 perubahan diperlukan:
1. `index.html` — tambah `<select id="lkKelas">` dalam form LK + butang "👥 Cetak Semua Murid"
2. `SmartSchoolHub_Worker.js` — tambah endpoint `GET /murid?kelas=...` query D1 tapis nama+kelas
3. `app.js` — tambah `lkCetakSemuaMurid()` — fetch murid, loop, satu halaman per murid, satu window print

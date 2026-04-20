# Reset Backend Smart School Hub

Panduan ini untuk mula semula dari kosong dengan Google Sheet baru, Apps Script baru, dan Worker yang menunjuk ke deployment baru.

## 1. Cipta Google Sheet baru

Nama cadangan:

`SKKIANDONGO_MASTERDB_V2_BAHARU`

Tak perlu cipta tab manual. Skrip akan buat sendiri tab berikut:

- `GURU`
- `MURID`
- `KEHADIRAN_GURU`
- `KEHADIRAN_MURID`
- `LAPORAN_BERTUGAS`
- `BIRTHDAY_LOG`
- `HARILAHIR`
- `CONFIG`

## 2. Cipta Apps Script baru

Dalam Google Sheet baru:

1. `Extensions` → `Apps Script`
2. Padam kod default `Code.gs`
3. Salin semua kandungan fail [SmartSchoolHub_AppsScript_Clean.gs](D:/SmartSchoolHub/sshub/SmartSchoolHub_AppsScript_Clean.gs)
4. Simpan projek

Nama cadangan projek:

`SmartSchoolHub Backend Baru`

## 3. Deploy Apps Script sebagai Web App

1. Klik `Deploy` → `New deployment`
2. Jenis deployment: `Web app`
3. `Execute as`: `Me`
4. `Who has access`: `Anyone`
5. Klik `Deploy`
6. Salin URL `/exec`

Contoh format:

`https://script.google.com/macros/s/AKfycb.../exec`

## 4. Jalankan setup pertama

Sebelum `WORKER_SECRET` diisi, backend benarkan bootstrap tanpa token.

Dari frontend SmartSchoolHub:

1. buka modul `Konfigurasi`
2. isi `Cloudflare Worker URL` lama dahulu jika worker sedia ada masih hidup
3. klik `Semak Status`
4. klik `Setup Sheets`

Atau terus dari Apps Script editor:

1. pilih fungsi `setupAllSheets`
2. klik `Run`

Selepas siap, tab dan header akan diwujudkan.

## 5. Isi CONFIG minimum

Dalam tab `CONFIG`, isi nilai ini:

- `WORKER_SECRET`
- `ADMIN_EMAIL`
- `SCHOOL_LAT`
- `SCHOOL_LNG`
- `SCHOOL_RADIUS`

Jika guna notifikasi/AI, isi juga:

- `FONNTE_TOKEN`
- `FONNTE_GROUP`
- `TELEGRAM_BOT`
- `TELEGRAM_CHAT`
- `TELEGRAM_TOPIC`
- `DEEPSEEK_API_KEY`

## 6. Selaraskan Cloudflare Worker

Dalam Worker environment variables, pastikan:

- `APPS_SCRIPT_URL` = URL deployment Apps Script baru
- `WORKER_SECRET` = sama tepat seperti `CONFIG.WORKER_SECRET`

Kedua-dua ini mesti padan.

## 7. Selaraskan frontend

Dalam SmartSchoolHub:

1. buka `Konfigurasi`
2. isi `Cloudflare Worker URL`
3. klik `Simpan URL`
4. klik `Semak Status`

Selepas patch semasa, status worker akan tunjuk sekali URL Apps Script aktif. Ini memudahkan semakan sama ada worker benar-benar menunjuk ke backend baru.

## 8. Import data asas

Untuk dashboard berfungsi betul, sekurang-kurangnya sheet berikut perlu ada data:

- `GURU`
- `MURID`

Format header sudah disediakan oleh skrip. Import data ikut susunan kolum yang sama.

## 9. Format kehadiran yang disokong

Frontend masih boleh menghantar format ringkas.

### `KEHADIRAN_GURU`

Frontend hantar:

`[nama, tarikh, status, masa, catatan, email, gps]`

Apps Script akan tukar ke format sheet penuh.

### `KEHADIRAN_MURID`

Frontend hantar:

`[nama, kelas, tarikh, status, telefonWali, catatan, guruEmail]`

Apps Script akan tukar ke format sheet penuh dan isi `jantina` serta `guru_nama` jika jumpa padanan.

## 10. Ujian paling ringkas

Selepas semuanya siap:

1. log masuk ke SmartSchoolHub
2. buat satu rekod `Kehadiran Guru`
3. buat satu rekod `Kehadiran Murid`
4. buka dashboard dan klik `Muat Semula`

Jika masih tiada paparan, semak hanya 3 perkara ini:

1. adakah `workerUrl` dalam frontend betul
2. adakah `APPS_SCRIPT_URL` dalam Worker menunjuk ke deployment baru
3. adakah `WORKER_SECRET` sama pada Worker dan `CONFIG`

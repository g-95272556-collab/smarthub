# Smart School Hub v2.0 - SK Kiandongo
## Project Instructions

### Stack
- Frontend: `index.html` dan `app.js`
- Backend: `SmartSchoolHub_Worker.js`
- Database aktif: Google Apps Script + Google Sheets melalui `SmartSchoolHub_AppsScript_Clean.gs`
- Legacy reference: `SmartSchoolHub_AppsScript.js`
- Notifikasi: Fonnte (WhatsApp) + Telegram Bot

### Konfigurasi Penting
```text
Google Client ID : 553204925712-p975t8hnehd4vfhs3igf4ba9c63edf0f.apps.googleusercontent.com
Worker URL       : https://smartschoolhub-skkiandongo.g-95272556.workers.dev
Apps Script URL  : https://script.google.com/macros/s/AKfycbyiNIHZ0XffgFFKJABM2FK7d1bU6-AuwPI4AMzTxxeOjV6j6bYhGlci6X8nbK1iOFbx/exec
Telegram Bot     : 8438571330:AAHKj7XFJK80bOgiqUNMzTVhRDjaCNNMMjc
Telegram Chat ID : -1002152935710
Telegram Topic   : 9391
Fonnte Group     : 60148608242-1434600192@g.us
GB Tel           : 60195363361
PK Tel           : 60193386910
```

### Backend Aktif
- Google Sheet aktif: `SKKIANDONGO_MASTERDB_V2_BAHARU`
- Apps Script aktif: deployment pada URL di atas
- Worker mesti guna:
  - `APPS_SCRIPT_URL` = URL Apps Script aktif
  - `WORKER_SECRET` = nilai yang sama seperti `CONFIG > WORKER_SECRET`

### Sekolah
```text
Nama     : SK Kiandongo, Tongod, Sabah
Kod      : XBA2238
Lat/Lng  : 5.3055655, 116.9633906
Radius   : 200m
Kelas    : 1 NILAM, 2 INTAN, 3 KRISTAL, 4 MUTIARA, 5 DELIMA, 6 BAIDURI
```

### Waktu Operasi
```text
Hadir  : 7:00 - 7:29
Lewat  : 7:30 - 7:59
Tidak  : 8:00 ke atas
Notif peringatan guru : 7:45-8:05
Notif murid tidak hadir : 9:00
```

### Peraturan Pembangunan
1. Semua JavaScript kekal dalam `app.js`.
2. Jangan inject JS melalui string luar.
3. Uji syntax selepas ubah fail utama.
4. Untuk reset backend, rujuk `BACKEND_RESET_GUIDE.md`.
5. Untuk backend baru, utamakan `SmartSchoolHub_AppsScript_Clean.gs`.

### Fail-fail
- `index.html` - struktur HTML dan CSS
- `app.js` - logik frontend
- `SmartSchoolHub_Worker.js` - Cloudflare Worker
- `SmartSchoolHub_AppsScript_Clean.gs` - backend aktif yang bersih
- `SmartSchoolHub_AppsScript.js` - backend lama / legacy reference
- `BACKEND_RESET_GUIDE.md` - panduan setup semula dari kosong
- `data_guru.csv` - data guru/staf
- `data_murid.csv` - data murid
- `data_harilahir.csv` - data hari lahir
- `import_data.js` - templat import selamat tanpa data sebenar
- `sample-data/` - sample fixture untuk pembangunan dan demo

### Nota Penyelenggaraan
- `Status & Output` dalam modul konfigurasi hanya untuk diagnostik sambungan.
- `Config Semasa` hanya memaparkan sheet `CONFIG`.
- `Paparkan Sheet Data` digunakan untuk semak sheet tertentu seperti `GURU`, `MURID`, `KEHADIRAN_GURU`, `KEHADIRAN_MURID`.

# Audit SmartSchoolHub - 2026-05-08

## Ringkasan

Audit ini menggabungkan dapatan semakan repo semasa dengan dapatan tambahan yang diberikan. Fokus utama ialah keselamatan, build readiness, GitHub readiness, struktur kod, prestasi, dan risiko penyelenggaraan.

Status semasa:

- Build web lulus.
- Build Android lulus selepas pembaikan aliran `www`.
- `npm audit` kini 0 vulnerability.
- Tiada live secret pattern dikesan dalam scan asas repo.
- Commit dan push belum dibuat.

## Isu Sudah Diselesaikan Dalam Working Tree

### 1. Dependency audit

Masalah:

- `npm audit` asal menunjukkan 11 vulnerability.
- Punca terbesar datang daripada `@capacitor/assets`, dependency dev yang tidak digunakan oleh skrip repo.

Tindakan:

- Buang `@capacitor/assets`.
- Jalankan `npm audit fix` untuk dependency yang boleh dikemas kini tanpa force.

Status:

- `npm audit --json` melaporkan 0 vulnerability.

### 2. Android build readiness

Masalah:

- `capacitor.config.json` menetapkan `webDir` kepada `www`.
- Skrip `build:android` asal tidak menjana folder `www`.
- `npx cap doctor` gagal dengan mesej `app/src/main/assets directory is missing in android`.

Tindakan:

- Tambah `scripts/build-www.js`.
- Tambah skrip `build:android-web`.
- Kemas kini `build:android` supaya menjalankan `build:web`, salin aset ke `www`, kemudian `npx cap sync android`.

Status:

- `npm run build:android` lulus.
- `npx cap doctor` melaporkan Android OK.

### 3. Risiko XSS pada output Gemini

Masalah:

- Output teks Gemini digunakan sebagai HTML.
- Output AI perlu dianggap input tidak dipercayai.

Tindakan:

- Escape teks Gemini sebelum dimasukkan ke `innerHTML`.
- Kekalkan imej inline melalui token HTML dalaman yang terkawal.
- Encode API key pada URL Gemini.

Status:

- `node --check app.js` lulus.
- Build web lulus.

### 4. Ikon Lucide tidak wujud

Masalah:

- `index.html` merujuk `lucide-list-alert`, tetapi ikon itu tiada dalam versi `lucide` yang digunakan.

Tindakan:

- Tukar rujukan kepada ikon sedia ada, `lucide-alert-triangle`.
- Baiki `scripts/build-icons.js` supaya sprite SVG diganti pada lokasi asal, bukan dipindahkan ke awal `<body>`.

Status:

- `npm run build:web` lulus tanpa amaran ikon.

### 5. GitHub readiness ignore untuk env tempatan

Masalah:

- `.env`, `.env.*`, dan `env.js` belum dinyatakan secara eksplisit dalam `.gitignore`.

Tindakan:

- Tambah ignore untuk fail env tempatan dan runtime override.

Status:

- Fail env tempatan tidak akan masuk Git secara tidak sengaja.

### 6. `LAUNCH_DATE` boleh dikonfigurasi

Masalah:

- `index.html` mengandungi fallback `LAUNCH_DATE = '2026-06-08'`.
- Tarikh perasmian perlu boleh diubah tanpa edit logic splash.

Tindakan:

- Tambah `launchDate` dalam `runtime-config.js`.
- Muatkan `runtime-config.js` dalam `<head>`.
- Splash membaca `window.SMARTSCHOOLHUB_RUNTIME_CONFIG.launchDate` dengan fallback selamat.

Status:

- Tarikh splash kini boleh ditukar melalui runtime config.

## Dapatan Sah Yang Masih Belum Dibuat

### 1. Rahsia runtime masih perlu polisi operasi yang ketat

Status semasa:

- `.clasp.json`, `.wrangler`, `private-data`, `www`, `.env`, `.env.*`, dan `env.js` sudah di-ignore.
- Scan asas tidak jumpa live secret pattern.

Cadangan:

- Pastikan production secret terus berada di platform secret / backend config, bukan source code.

### 2. Google token verification Worker utama

Status semasa:

- `workers/google-oauth-core.mjs` sudah verify Google ID token menggunakan JWK/WebCrypto.
- `SmartSchoolHub_Worker.js` utama kini verify Google ID token menggunakan JWK/WebCrypto.
- Semakan `aud`, `iss`, `exp`, `nbf`, `email_verified`, dan domain email dikekalkan.

Status:

- Selesai. Corak verification Google lebih konsisten antara OAuth worker dan Worker utama.

Catatan:

- JWK dan actor cache masih dalam memori Worker. Ini sesuai sebagai hardening ringan.

### 3. Token notifikasi dan Gemini masih boleh berada di `localStorage`

Status semasa:

- Sistem menyokong konfigurasi Telegram, Fonnte, dan Gemini melalui UI.
- Sebahagian nilai disimpan dalam `localStorage` untuk runtime browser.

Risiko:

- Jika peranti/browser dikongsi, token boleh terdedah kepada sesi pengguna lain pada peranti sama.

Cadangan:

- Untuk production, utamakan simpanan secret di Worker/platform secret/D1 config terlindung.
- Frontend hanya papar status masked, bukan token penuh selepas disimpan.

### 4. Validasi backend baseline

Status semasa:

- Worker kini menolak payload simpanan rosak untuk `appendRow`, `appendRows`, dan `replaceSheet`.
- Validasi meliputi `sheetKey`, bentuk array row, bilangan lajur munasabah, jenis nilai cell, dan panjang cell.
- Validasi domain/duplicate sedia ada masih kekal untuk guru, murid, kehadiran, kokum, dan laporan bertugas.

Status:

- Selesai untuk baseline server-side.

Cadangan:

- Audit borang frontend satu per satu masih sesuai dibuat dalam refactor/QA khusus.
- Tambah validasi enum/tarikh/telefon lebih ketat secara berperingkat jika ada laporan data rosak.

### 5. Rate limit dan logging API

Status semasa:

- Worker sudah ada method check, `WORKER_SECRET`, Google identity, dan `authorizeRequest`.
- Rate limit memori ringan sudah ditambah untuk `/ai/*`, `/token`, dan action API.
- Logging ringkas ditambah untuk permintaan sensitif dan rate limited event tanpa mencetak secret.

Status:

- Selesai untuk baseline.

Cadangan production:

- Jika trafik meningkat, pindahkan rate limit ke Durable Object atau KV supaya konsisten antara isolate/region.

### 6. Worker AI output hardening

Status semasa:

- URL Gemini dalam Worker kini encode `GEMINI_API_KEY`.
- Teks Gemini fallback dalam Worker kini di-escape sebelum dijadikan HTML.
- `DEEPSEEK_API_KEY` yang tiada dipulangkan sebagai ralat konfigurasi khusus.

Status:

- Selesai untuk baseline.

## Dapatan Jangka Panjang

### 1. `index.html` dan `app.js` terlalu besar

Status semasa:

- SPA masih bertumpu pada `index.html` dan `app.js`.
- Ini memudahkan deploy statik, tetapi menyukarkan maintenance.

Cadangan jangka panjang:

- Pecahkan modul mengikut domain: auth, dashboard, kehadiran, laporan, notifikasi, konfigurasi, AI lembaran kerja.
- Gunakan ES modules atau bundler seperti Vite.
- Jangan refactor besar dalam commit sama dengan security/build fix.

### 2. Struktur frontend boleh dimodenkan

Cadangan:

- Vite boleh digunakan sebagai langkah sederhana tanpa terus lompat ke React/Vue.
- React/Vue hanya berbaloi jika mahu rombak state management dan UI secara besar.

Keputusan audit:

- Ini relevan, tetapi bukan blocker commit pembaikan semasa.

### 3. Dokumentasi deployment dan modul

Cadangan:

- Tambah nota cara tambah modul baru.
- Tambah `.env.example` jika workflow env tempatan hendak diperkenalkan.
- Dokumentasikan aliran `build:web`, `build:android`, Apps Script sync, Cloudflare Worker, dan Netlify function.

## Dapatan Kurang Relevan Atau Perlu Dilaraskan

### 1. `jsonwebtoken` di Node

Catatan:

- Repo ini tidak menggunakan backend Node biasa untuk API utama.
- Backend utama ialah Cloudflare Worker dan Netlify Function.
- Library `jsonwebtoken` bukan pilihan utama untuk Worker runtime.

Cadangan lebih tepat:

- Gunakan WebCrypto/JWK verification seperti dalam `workers/google-oauth-core.mjs`.

### 2. "Tarikh pelancaran menghalang akses selepas perasmian"

Catatan:

- Logik semasa tidak menghalang akses secara kekal.
- Ia memaparkan splash pada atau selepas tarikh launch sehingga user klik rasmi.

Cadangan tetap sah:

- Jadikan tarikh configurable supaya tidak perlu edit HTML.

### 3. "Rahsia terselit dalam fail .js"

Catatan:

- Scan asas tidak jumpa live secret pattern.
- Namun ada nama key dan placeholder config dalam kod, itu normal.

Risiko sebenar:

- Runtime token boleh disimpan melalui UI dan berada dalam browser storage.

## Verifikasi Yang Telah Dilakukan

Perintah yang telah lulus:

```powershell
npm ci
npm audit --json
npm run build:web
npm run build:android
npx cap doctor
node --check app.js
node --check SmartSchoolHub_Worker.js
node --check workers\google-oauth-core.mjs
node --check netlify\functions\google-oauth.mjs
node --check service-worker.js
node --check scripts\build-icons.js
node --check scripts\build-www.js
git diff --check
```

## Cadangan Susunan Commit

### Commit 1: audit/build/security fix

Kandungan:

- Dependency audit fix.
- Gemini output sanitization.
- Icon sprite/build fix.
- Android `www` build pipeline.
- Mobile/iOS CSS fix sedia ada jika mahu dimasukkan bersama.

### Commit 2: GitHub readiness hardening

Kandungan:

- Tambah dokumentasi `.env.example` jika perlu.
- Perketat polisi runtime secret dan deployment notes.

### Commit 3: auth/backend hardening

Kandungan:

- Samakan Google token verification dalam `SmartSchoolHub_Worker.js` dengan JWK/WebCrypto.
- Tambah rate limit/logging endpoint sensitif.
- Ketatkan validasi server-side.

### Commit 4: refactor besar

Kandungan:

- Pecahkan `index.html` dan `app.js` kepada modul.
- Pertimbang Vite atau struktur ES modules.

Nota:

- Refactor besar tidak digalakkan bercampur dengan security/build fix kerana risiko regression tinggi.

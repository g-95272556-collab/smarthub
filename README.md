# SmartSchoolHub

SmartSchoolHub ialah aplikasi sekolah berasaskan SPA statik untuk pengurusan operasi harian sekolah seperti kehadiran guru, kehadiran murid, laporan guru bertugas mingguan, data guru dan murid, notifikasi, konfigurasi, serta integrasi backend melalui Cloudflare Worker dan Google Apps Script.

## Struktur Utama

- `index.html`
  Antara muka utama aplikasi.
- `app.js`
  Logik frontend utama untuk semua modul.
- `SmartSchoolHub_Worker.js`
  Backend Cloudflare Worker untuk API, konfigurasi, dan operasi D1.
- `SmartSchoolHub_AppsScript_Clean.gs`
  Sumber utama Apps Script untuk sync/deploy melalui `clasp`.
- `apps-script/appsscript.json`
  Konfigurasi manifest Apps Script.
- `scripts/sync-apps-script.ps1`
  Skrip untuk menyalin `SmartSchoolHub_AppsScript_Clean.gs` ke `apps-script/Code.gs` sebelum push/deploy Apps Script.
- `migrations/`
  Fail migrasi untuk Cloudflare D1.
- `assets/`
  Ikon dan aset statik aplikasi/PWA.

## Fail Sokongan

- `package.json`
  Tooling tempatan untuk `clasp`.
- `wrangler.toml`
  Konfigurasi Cloudflare Worker.
- `manifest.webmanifest`, `service-worker.js`, `offline.html`
  Sokongan PWA/offline.
- `sample-data/`
  Fixture contoh yang selamat untuk demo, pembangunan, dan struktur import.

## Persediaan Tempatan

Keperluan asas:

- Node.js
- npm
- Akaun Google untuk Apps Script
- Akaun Cloudflare jika mahu deploy Worker

Pasang dependency:

```powershell
npm install
```

## Aliran Apps Script

1. Salin `.clasp.json.example` menjadi `.clasp.json`
2. Isi `scriptId` Apps Script sebenar
3. Log masuk `clasp`
4. Sync fail sumber

```powershell
npm run apps:sync
```

Push/deploy Apps Script:

```powershell
npm run apps:push
npm run apps:deploy
```

Nota:

- `.clasp.json` tidak dipush ke GitHub kerana ia konfigurasi tempatan.
- `apps-script/Code.gs` dijana oleh proses sync dan juga diabaikan oleh Git.

## Aliran Cloudflare Worker

Semak konfigurasi dalam `wrangler.toml`, kemudian deploy ikut aliran kerja Cloudflare anda. Folder ini mengandungi kod Worker dan migrasi D1, tetapi rahsia/secret tempatan tidak disimpan dalam repo.

## Worker Google OAuth Baharu

Repo ini kini mengandungi worker OAuth berasingan yang boleh digunakan pada dua platform hosting:

- `GoogleOAuth_Worker.js`
  Entrypoint Cloudflare Worker khusus untuk verifikasi Google OAuth.
- `workers/google-oauth-core.mjs`
  Teras kongsi berasaskan Web Fetch API untuk Cloudflare dan Netlify.
- `netlify/functions/google-oauth.mjs`
  Netlify Function yang memetakan laluan yang sama supaya frontend boleh guna endpoint seragam.
- `wrangler.google-oauth.toml`
  Konfigurasi Cloudflare berasingan untuk deploy worker OAuth tanpa mengganggu `SmartSchoolHub_Worker.js`.

Endpoint yang disediakan:

- `POST /auth/google`
- `POST /auth/google/verify`
- `GET /auth/google/config`
- `GET /auth/google/health`

Body minimum untuk verifikasi:

```json
{
  "credential": "<google_id_token>"
}
```

Respons berjaya akan memulangkan profil ringkas pengguna yang telah disahkan seperti `email`, `name`, `sub`, `picture`, `hd`, `aud`, dan `iss`.

Pembolehubah persekitaran yang disokong:

- `GOOGLE_CLIENT_ID` atau `GOOGLE_CLIENT_IDS`
- `GOOGLE_ALLOWED_EMAIL_DOMAINS`
- `ALLOWED_ORIGINS`

Contoh laluan penggunaan:

- Cloudflare: deploy melalui `wrangler.google-oauth.toml`
- Netlify: function akan tersedia pada laluan `/.netlify/functions/google-oauth` dan juga laluan tersuai `/auth/google`

Nota keselamatan:

- Worker ini mengesahkan tandatangan JWT Google menggunakan JWK Google dan memeriksa `aud`, `iss`, `exp`, `email_verified`, dan domain email yang dibenarkan.
- Google menyarankan verifikasi tandatangan token di backend; implementasi ini ikut pendekatan itu dan tidak bergantung pada endpoint `tokeninfo` untuk aliran utama.

## GitHub Readiness

Repo ini telah dibersihkan untuk GitHub:

- cache tempatan dan folder sementara tidak disertakan
- fail sensitif tempatan diabaikan melalui `.gitignore`
- artifak jana semula seperti `apps-script/Code.gs` tidak dimasukkan ke repo

## Security and Data Handling

- Rujuk `SECURITY.md` sebelum berkongsi repo ini lebih luas.
- Jangan simpan token hidup atau secret operasi terus dalam source code.
- Repo ini masih menjejak beberapa fail dokumen sekolah yang perlu dinilai semula jika repo ingin dijadikan awam.
- Rujuk `DATA_MIGRATION_PLAN.md` untuk laluan migrasi daripada data sebenar kepada sample/template.
- Jika anda perlukan data sebenar untuk operasi tempatan, letakkan fail CSV di `private-data/` supaya modul tertentu boleh cuba membacanya tanpa menjejaknya dalam Git.
- Jika anda perlukan dokumen operasi sebenar seperti eksport `.xlsx` atau sumber `.docx`, simpan secara tempatan di luar repo tracked.

## License

Repo ini menggunakan lesen konservatif `All Rights Reserved` setakat ini supaya kandungan kod, aset, dan data tidak diberi kebenaran penggunaan semula secara terbuka tanpa keputusan yang jelas.

## Nota Projek

- Frontend utama masih berasaskan fail statik tunggal `index.html` + `app.js`
- Backend boleh menggunakan Cloudflare Worker / D1 dan aliran Apps Script bergantung kepada konfigurasi semasa
- Beberapa dokumen sekolah dan fail rujukan dimasukkan kerana ia menjadi sumber kerja sebenar untuk modul tertentu

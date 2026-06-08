# SmartSchoolHub SK Kiandongo

Salinan kerja statik bagi `xbasmarthub.netlify.app` untuk tujuan pembangunan, semakan, dan deploy semula ke Netlify.

## Ringkasan

SmartSchoolHub ialah static SPA/PWA untuk pengurusan sekolah. Repo ini mengandungi shell UI, modul logik utama, cache PWA, konfigurasi runtime, dan fungsi Netlify untuk penyelarasan konfigurasi.

## Struktur Projek

```text
.
|-- assets/
|-- app.js
|-- aktiviti.js
|-- dskp_embedded.js
|-- index.html
|-- manifest.webmanifest
|-- offline.html
|-- runtime-config.js
|-- service-worker.js
|-- splash-perasmian.js
|-- style.css
|-- takwim.js
|-- config/
|-- netlify/
|-- netlify.toml
|-- _redirects
|-- scripts/
```

## Fail Utama

- `app.js`: logik utama aplikasi, login, modul, dan notifikasi.
- `index.html`: shell utama dan markup semua modul.
- `style.css`: gaya UI dan responsif.
- `runtime-config.js`: URL backend, OAuth, versi app, dan tarikh splash.
- `service-worker.js`: cache PWA.
- `takwim.js`: modul takwim sekolah.
- `aktiviti.js`: modul aktiviti.

## Dokumen Penting

- `PRODUCTION_PLAN.md`: pelan produksi dan checklist release.
- `SECURITY.md`: prinsip keselamatan aplikasi.
- `DEPLOYMENT_SECURITY.md`: kawalan keselamatan semasa deploy.

## Jalankan Lokal

```powershell
Set-Location "D:\Pull Netlify"
npm run serve
```

Buka `http://localhost:8080`.

## Semak Sebelum Deploy

```powershell
Set-Location "D:\Pull Netlify"
npm run verify
```

Semakan ini memastikan fail teras wujud dan rujukan utama deploy tidak tercicir.

## Deploy Netlify

1. Push repo ini ke GitHub.
2. Di Netlify, pilih `Add new site` > `Import an existing project`.
3. Sambung ke repo GitHub tersebut.
4. Tetapan build:
   - Build command: kosongkan
   - Publish directory: `.`
5. Deploy site.

## Function `db-config`

Repo ini mengandungi function [netlify/functions/db-config.js](</D:/Pull Netlify/netlify/functions/db-config.js>) untuk:

- baca semua config Blob atau satu key tertentu
- simpan config melalui `POST { config: {...} }`
- simpan satu key melalui `POST { key, value }`
- sync Blob ke D1 melalui `POST ?sync=d1`

Environment variables yang disyorkan di Netlify:

- `WORKER_URL`
- `WORKER_SECRET`
- `ADMIN_WORKER_SECRET`

Function ini menerima key `TAKWIM_GURU_NOTIF_*`, jadi konfigurasi mesej takwim guru boleh disimpan ke Blob dan diselaraskan ke D1 selepas redeploy.

## Nota Penting

- Aplikasi ini ialah static SPA/PWA.
- `runtime-config.js` masih menghala ke worker production semasa. Ubah dahulu jika mahu guna backend lain.
- `service-worker.js` mengawal cache shell app. Jika aset utama berubah, naikkan `CACHE_NAME`.

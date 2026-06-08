# SmartSchoolHub SK Kiandongo

Salinan kerja statik bagi `xbasmarthub.netlify.app` untuk tujuan edit, semakan, dan deploy semula ke Netlify.

## Struktur projek

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
|-- netlify.toml
|-- _redirects
`-- scripts/
```

## Fail yang selalu diedit

- `runtime-config.js`: URL worker, OAuth Google, versi app, tarikh splash.
- `index.html`: shell utama dan markup modul.
- `style.css`: gaya UI.
- `app.js`: logik utama aplikasi.
- `takwim.js`: modul takwim.
- `aktiviti.js`: modul aktiviti.
- `service-worker.js`: cache PWA.

## Cara jalankan lokal

```powershell
Set-Location "D:\Pull Netlify\xbasmarthub.netlify.app"
npm run serve
```

Buka `http://localhost:8080`.

## Cara semak sebelum deploy

```powershell
Set-Location "D:\Pull Netlify\xbasmarthub.netlify.app"
npm run verify
```

Semakan ini memastikan fail teras wujud dan rujukan utama deploy tidak tercicir.

## Cara deploy ke Netlify

1. Push repo ini ke GitHub.
2. Di Netlify, pilih `Add new site` > `Import an existing project`.
3. Sambung ke repo GitHub tersebut.
4. Tetapan build:
   - Build command: kosongkan
   - Publish directory: `.`
5. Deploy site.

## Netlify Function `db-config`

Repo ini kini mengandungi function [netlify/functions/db-config.js](D:\Pull Netlify\xbasmarthub.netlify.app\netlify\functions\db-config.js) untuk:

- baca semua config Blob atau satu key tertentu
- simpan config melalui `POST { config: {...} }`
- simpan satu key melalui `POST { key, value }`
- sync Blob ke D1 melalui `POST ?sync=d1`

Environment variables yang disyorkan di Netlify:

- `WORKER_URL`
- `WORKER_SECRET`
- `ADMIN_WORKER_SECRET`

Function ini sudah menerima key `TAKWIM_GURU_NOTIF_*`, jadi konfigurasi mesej peringatan takwim guru boleh disimpan ke Blob dan kemudian diselaraskan ke D1 selepas redeploy.

## Nota penting

- Aplikasi ini ialah static SPA/PWA.
- `runtime-config.js` masih menghala ke worker production semasa. Ubah dahulu jika mahu guna backend lain.
- `service-worker.js` mengawal cache shell app. Jika aset utama berubah, naikkan `CACHE_NAME`.

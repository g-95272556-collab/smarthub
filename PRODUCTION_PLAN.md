# Production Plan

## Matlamat

Menjadikan SmartSchoolHub stabil untuk penggunaan sekolah harian, deploy konsisten, dan mudah diselenggara tanpa ganggu data sedia ada.

## Fasa Kerja

### Fasa 1: Stabiliti

- Sahkan semua fail wajib wujud dan `npm run verify` lulus.
- Semak aliran login Google, reload cache, dan fallback offline.
- Pastikan notifikasi takwim, kehadiran guru, dan modul murid berfungsi tanpa ralat runtime.

### Fasa 2: Keselamatan

- Kurangkan permukaan serangan pada `index.html`, `app.js`, dan `service-worker.js`.
- Elak inline handler baharu kecuali benar-benar perlu.
- Pastikan semua mesej yang dipaparkan atau dihantar keluar melalui sanitasi yang sesuai.

### Fasa 3: Deploy

- Sahkan `runtime-config.js` menunjuk ke backend yang betul.
- Semak `netlify.toml`, `service-worker.js`, dan cache version sebelum release.
- Deploy hanya selepas semakan lokal dan ujian login selesai.

## Kriteria Siap Production

- Login boleh dibuka dan tamat dengan betul.
- Rekod kehadiran, takwim, dan konfigurasi boleh disimpan.
- Cache PWA tidak mengunci versi baharu selepas update.
- Fail deploy lulus verifikasi asas.

## Checklist Release

- `npm run verify`
- Semak `git status`
- Uji login dan satu aliran data utama
- Sahkan `runtime-config.js`
- Deploy ke Netlify


# Security Policy

## Skop

Dokumen ini merangkumi keselamatan aplikasi statik SmartSchoolHub, termasuk frontend, konfigurasi runtime, cache PWA, dan integrasi backend.

## Prinsip Keselamatan

- Anggap semua input pengguna sebagai tidak dipercayai.
- Sanitasi teks sebelum dipaparkan semula dalam DOM.
- Jangan tambah inline script atau inline event handler tanpa sebab kukuh.
- Simpan rahsia dan token hanya pada tempat yang sesuai, bukan dalam markup awam.

## Risiko Utama

- XSS melalui `innerHTML`, template notifikasi, atau preview HTML.
- Kebocoran maklumat melalui log debug atau mesej ralat yang terlalu terperinci.
- Cache PWA lama yang memaparkan logik atau konfigurasi lama.
- Pendedahan URL backend atau token dalam fail yang boleh diakses umum.

## Kawalan Yang Disyorkan

- Gunakan fungsi sanitasi sebelum render HTML yang datang dari data dinamik.
- Kekalkan `service-worker.js` dengan cache version yang jelas.
- Pastikan `runtime-config.js` hanya mengandungi nilai yang memang perlu dipublis.
- Semak semua template mesej sebelum disimpan ke backend.

## Pelaporan Isu Keselamatan

Jika jumpa isu keselamatan, utamakan pembaikan pada sumber fail dan uji semula secara lokal sebelum deploy. Untuk isu kritikal, jangan deploy dahulu.


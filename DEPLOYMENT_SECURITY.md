# Deployment Security

## Tujuan

Dokumen ini menerangkan langkah keselamatan sebelum dan semasa deploy ke Netlify.

## Sebelum Deploy

- Jalankan `npm run verify`.
- Semak `git status` supaya hanya perubahan yang dirancang masuk commit.
- Pastikan `runtime-config.js` menghala ke environment yang betul.
- Pastikan `netlify.toml` dan `_redirects` masih betul.
- Semak mesej takwim dan notifikasi supaya tiada data sensitif terselit.

## Semasa Deploy

- Deploy dari branch yang telah disemak.
- Jangan publish fail sementara atau fail debug.
- Pastikan service worker versi baharu ikut perubahan asset.

## Selepas Deploy

- Uji login.
- Uji satu aliran data utama.
- Uji fallback offline.
- Semak console browser untuk error.
- Sahkan cache tidak memaparkan UI lama.

## Perkara Yang Jangan Dibuat

- Jangan force deploy tanpa semakan login.
- Jangan simpan token sulit dalam fail yang dipublish.
- Jangan biarkan debug panel atau ralat verbose kekal pada production jika tidak diperlukan.


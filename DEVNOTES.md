# SMARTHUB DEV NOTES — Rujukan Dalaman

## PROTOKOL WAJIB SEBELUM COMMIT

Sebelum commit APA-APA perubahan, semak semua perkara berikut:

1. **Null reference** — grep semua rujukan JS kepada elemen HTML yang diubah/dipadam. Contoh: `document.getElementById('x').value` akan crash jika `x` dipadam dari HTML.
2. **Semua engine path** — sebarang fix pada lembaran kerja mesti disemak untuk ketiga-tiga path: `deepseek`, `hybrid`, `gemini`. Fix pada satu tidak automatik fix yang lain.
3. **Map key** — jangan guna string placeholder sebagai key dalam object (imgMap). Guna **index berangka** (`imgByIndex[0]`, `[1]`...) kerana string boleh ada perbezaan whitespace/kes.
4. **Skop jenis** — fix untuk `pbd-pt` mesti disemak untuk `pbd-at`, `uasa`, dan fasa A/B/CD/JAWAPAN juga.
5. **Konsistensi placeholder** — Worker (DeepSeek) dan app.js (Gemini) mesti guna placeholder yang **sama**: `[GAMBAR: deskripsi]`. Jangan campur `[IMEJ:]` dan `[GAMBAR:]`.
6. **Max tokens Worker** — `lembaran_kerja: 6000`. Jangan kurangkan — output akan terpotong.
7. **Selesai SEMUA isu yang dijangka sebelum commit** — jangan commit separuh siap.

---

## ISU LEPAS & PENYELESAIAN

| # | Isu | Punca | Fix |
|---|-----|-------|-----|
| 1 | `Cannot read properties of null (reading 'value')` | Elemen HTML dipadam tapi JS masih rujuk `.value` terus | Tambah null guard `(getElementById('x') \|\| {}).value` atau padam rujukan |
| 2 | Imej tidak diselitkan ke soalan | `imgMap` guna string placeholder sebagai key — mismatch whitespace/kes antara `exec()` dan `replace()` | Guna `imgByIndex[index]` berasaskan urutan |
| 3 | Nota tambahan diabaikan oleh AI | Nota diletakkan di tengah senarai metadata — AI anggap maklumat sampingan | Letak di **hujung prompt** sebagai `⚠️ ARAHAN KHAS DARIPADA GURU (WAJIB)` |
| 4 | Header murid berganda (Nama/Kelas/Tarikh 2x) | Output box ada `lk-print-header` dengan ruangan murid, template cetak pula jana sekali lagi | Buang Nama/Kelas/Tarikh dari output box — template cetak yang jana |
| 5 | Gemini jana teks/huruf dalam gambar | Prompt tidak melarang dengan tegas | Tambah `DILARANG KERAS: jangan tulis apa-apa teks, huruf, nombor, label` |
| 6 | Placeholder tidak konsisten `[IMEJ:]` vs `[GAMBAR:]` | Worker system prompt guna `[GAMBAR:]`, app.js prompt guna `[IMEJ:]` | Seragamkan semua ke `[GAMBAR:]`. Regex parse: `/\[(?:GAMBAR\|IMEJ):/` untuk backward compat |
| 7 | Bilangan soalan bergambar tidak dikawal | AI bebas pilih bilangan — nota guru di hujung prompt masih tidak cukup kuat | Parse nota → ekstrak angka → masukkan dalam arahan format sebagai `Buat TEPAT N soalan bergambar` untuk **semua jenis** (bukan pbd-pt sahaja) |
| 8 | Kuota Gemini habis separuh jalan — imej baki jadi placeholder tapi tiada amaran | `Promise.all` jana semua imej serentak — jika kuota habis, semua gagal tanpa tahu mana yang berjaya | Tukar ke `for` loop sequential + `break` jika `isQuota` error |
| 9 | Nama model Gemini salah — 404 error | Model `gemini-2.0-flash-preview-image-generation` tidak wujud | Model betul: `gemini-3.1-flash-image-preview` (semak docs sebelum guna model baru) |

---

## STRUKTUR KOD PENTING

```
app.js
├── lkBinaSumber(phase)          — bina prompt untuk AI (semua engine kongsi ini)
├── callWorkerAI(prompt, type)   — hantar ke DeepSeek via Worker
├── callWorkerAIGemini(prompt)   — Gemini standalone (teks + imej)
├── callHybridDeepSeekGemini()   — Hybrid: DeepSeek teks + Gemini imej
├── _geminiApiCall(key, prompt, modality, system) — helper Gemini API
│   ├── modality='TEXT' → gemini-2.0-flash
│   └── modality='IMAGE' → gemini-3.1-flash-image-preview
└── janaLembaranKerja()          — fungsi utama — routing ke engine

SmartSchoolHub_Worker.js
└── systemPrompts.lembaran_kerja — system prompt DeepSeek
    └── max_tokens: 6000
```

## PERATURAN IMAGE GENERATION

- Placeholder: `[GAMBAR: deskripsi ringkas]`
- Parse regex: `/\[(?:GAMBAR|IMEJ):\s*([^\]]+)\]/gi`
- Simpan hasil: `imgByIndex[index]` — BUKAN string key
- Jana: sequential `for` loop — BUKAN `Promise.all`
- Break jika `imgErr.isQuota === true`

## GIT WORKFLOW

1. Clone: `git clone https://github.com/g-95272556-collab/smarthub.git`
2. Push guna PAT: `git remote set-url origin https://TOKEN@github.com/g-95272556-collab/smarthub.git`
3. Selepas push: `git remote set-url origin https://github.com/g-95272556-collab/smarthub.git`
4. **Revoke token selepas guna**: https://github.com/settings/tokens

# Takwim Sekolah — Panduan Cepat (Quick Start)

## ✅ Setup (SUDAH SIAP GUNA)

Fitur Takwim/Kalender Sekolah **sudah terintegrasi penuh** dalam SmartSchoolHub v2.0. Tiada setup tambahan diperlukan.

### File-file baru yang ditambah:
- `takwim.js` — Modul JavaScript untuk manage takwim
- `TAKWIM.md` — Dokumentasi lengkap
- `sample-data/takwim-sample-2026.json` — Sample data untuk testing

## 🚀 Cara Guna

### 1. Lihat Takwim di Dashboard
1. Login ke SmartSchoolHub
2. Buka **Papan Pemuka**
3. Scroll ke bawah — ada **2 bagian takwim**:
   - **Takwim Sekolah** — Kalender visual bulan semasa
   - **Acara Akan Datang** — Senarai 5 acara terdekat

### 2. Tambah Acara (Admin sahaja)
1. Buka **Konfigurasi**
2. Klik **Takwim / Kalender Sekolah**
3. Isi borang:
   ```
   Tarikh Mula: [2026-06-15]
   Tajuk: Cuti Hari Raya
   Kategori: Cuti
   Warna: Pilih merah
   Catatan: (opsional)
   ```
4. Klik **Tambah Acara** ✓

### 3. Cari/Edit/Padam Acara
Di senarai acara:
- **Cari** — Taip tajuk/kategori di kotak carian
- **Edit** — Klik 🖊️ butang, ubah, klik Simpan Perubahan
- **Padam** — Klik 🗑️ butang, potong pasti

### 4. Backup Data (PENTING)
Secara berkala:
1. Buka **Konfigurasi → Takwim**
2. Klik **Eksport JSON**
3. File akan dimuat turun (nama: `takwim-sekolah-YYYY-MM-DD.json`)
4. Simpan di folder selamat (Google Drive, USB, dsb)

### 5. Restore Data (Jika hilang)
1. Buka **Konfigurasi → Takwim**
2. Klik **Import JSON**
3. Pilih file yang disimpan
4. Klik **Import** ✓

## 📋 Kategori Acara (Pilihan)

| Kategori | Warna Cadangan | Contoh |
|----------|---|---|
| **Cuti** | 🔴 Merah (#ef4444) | Cuti Hari Raya, Cuti Akhir Tahun |
| **PBD** | 🔵 Biru (#3b82f6) | Pentaksiran Berkala |
| **UASA** | 🟣 Ungu (#8b5cf6) | Ujian Akhir Sekolah |
| **Mesyuarat** | 🟢 Hijau (#10b981) | Mesyuarat Guru, Mesyuarat Ibu Bapa |
| **Aktiviti Sekolah** | 🔵 Cyan (#06b6d4) | Sukan, Aktiviti Kelas |
| **Kokurikulum** | 🩷 Pink (#ec4899) | Latihan Badan Beruniform |
| **PBPPP** | 🟡 Emas (#facc15) | Pembelajaran Seumur Hidup |
| **PLC** | 🟠 Jingga (#f97316) | Professional Learning Community |
| **Sambutan** | 🟡 Emas (#facc15) | Hari Malaysia, Hari Kemerdekaan |
| **Lain-lain** | ⚫ Abu-abu | Kategori lain |

## 💡 Tips Penggunaan

### ✓ Yang patut dilakukan:
- **Backup bulanan** — Export JSON setiap bulan
- **Update berkala** — Tambah acara sebaik-baiknya dua bulan lebih awal
- **Gunakan warna konsisten** — Cuti selalu merah, PBD selalu biru, dsb
- **Catatan ringkas** — Lokasi, waktu, sasaran acara

### ✗ Jangan lakukan:
- ❌ Hapus data tanpa backup terlebih dahulu
- ❌ Ubah data sambil sedang viewing di browser lain (refresh sebelum edit)
- ❌ Import JSON berulang kali — akan ada duplikat

## 🔧 Troubleshooting

### P: Acara saya tidak papar di dashboard
A: Klik **Muat Semula** dashboard atau refresh browser (F5)

### P: Filter tahun tidak ada
A: Tambah acara dari tahun berbeza dulu; filter muncul otomatis

### P: Kalender tidak seimbang/aneh
A: Pastikan format tarikh adalah **YYYY-MM-DD** (cth: 2026-06-15)

### P: Data hilang selepas refresh
A: Data disimpan di **localStorage**. Jika cache dibersih, data hilang. 
**Solusi:** Selalu backup dengan Eksport JSON

## 📥 Test dengan Sample Data

Kami sediakan data sample untuk tahun 2026:

1. Download file: `sample-data/takwim-sample-2026.json`
2. Buka **Konfigurasi → Takwim**
3. Klik **Import JSON**
4. Pilih file sample
5. Klik **Import** ✓

Anda akan dapat 12 acara sample (cuti, PBD, UASA, aktiviti, dsb)

## 📱 Mobile Usage

Takwim **fully responsive** di tablet & phone:
- Kalender auto-adjust untuk layar kecil
- Form mudah isi dengan keyboard virtual
- Semua fungsi tetap berfungsi

## 🔐 Data Privacy

- **Semua data disimpan di browser anda** — Tidak ada server sync
- **Tiada cloud upload** — Sepenuhnya di device
- **Offline mode** — Berfungsi tanpa internet

## 📞 Support / Bug Report

Jika ada masalah atau cadangan fitur:
1. Check **TAKWIM.md** untuk dokumentasi lengkap
2. Check **Troubleshooting** section di atas
3. Contact: g-95272556@moe-dl.edu.my

## 🎯 Next Steps (Plan)

Fitur-fitur akan datang (tidak dijanjikan timeline):
- ☐ Sinkronisasi dengan Google Calendar
- ☐ Notifikasi SMS/WhatsApp untuk acara penting
- ☐ Integrasi dengan Jadual Waktu (auto-highlight cuti)
- ☐ Export ke iCal format
- ☐ Sharing acara dengan parent

---

**Version:** 1.0  
**Setup Date:** 14 Mei 2026  
**Status:** ✅ Production Ready  
**Tested in:** SK Kiandongo, Tongod, Sabah

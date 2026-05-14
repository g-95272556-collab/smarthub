# Modul Takwim / Kalender Sekolah — SmartSchoolHub v2.0

## Ringkasan

Modul **Takwim/Kalender Sekolah** membenarkan admin SK Kiandongo menguruskan acara-acara penting sekolah (cuti, pentaksiran, aktiviti, mesyuarat, dsb) dengan mudah. Acara-acara ini akan dipaparkan secara automatik di **Papan Pemuka** untuk semua pengguna.

## Fitur

### 1. Paparan Dashboard
- **Kalender Bulanan** — Grid visual dengan semua acara bulan semasa
- **Senarai Acara Akan Datang** — 5 acara terdekat dengan tarikh dan kategori
- **Legenda Kategori** — Warna penanda untuk setiap kategori acara
- **Navigasi Bulan** — Butang untuk lihat bulan sebelumnya/seterusnya/bulan semasa

### 2. Menu Konfigurasi (Admin)
Akses melalui **Modul Konfigurasi → Takwim/Kalender Sekolah**

#### Form Tambah/Edit Acara
- **Tarikh Mula** (diperlukan) — Format: YYYY-MM-DD
- **Tarikh Akhir** (pilihan) — Untuk acara berbilang hari
- **Tajuk Acara** (diperlukan) — Nama acara (maksimal 120 aksara)
- **Kategori** — Pilih dari senarai:
  - Cuti
  - PBD / Pentaksiran
  - UASA
  - Mesyuarat
  - Aktiviti Sekolah
  - Kokurikulum
  - PBPPP
  - PLC
  - Sambutan / Majlis
  - Lain-lain
- **Warna Penanda** — Color picker untuk visual identification
- **Catatan** (pilihan) — Ringkasan/lokasi/sasaran acara

#### Senarai Acara
- Carian tajuk/kategori
- Filter mengikut tahun
- Edit atau Padam acara
- Paparan ringkas dengan tarikh, tajuk, kategori, catatan

#### Import/Export
- **Eksport JSON** — Muat turun semua acara dalam format JSON
- **Import JSON** — Muat naik takwim dari file JSON

## Struktur Data

Setiap acara disimpan dengan struktur:

```json
{
  "id": "1715000400000",
  "tarikh": "2026-05-14",
  "tarikhAkhir": null,
  "tajuk": "Cuti Hari Wesak",
  "kategori": "Cuti",
  "warna": "#1A4FA0",
  "catatan": "Semua sekolah tutup"
}
```

## Penyimpanan Data

- **Tempat Simpan** — Browser's localStorage (key: `ssh_takwim_events`)
- **Backup** — Gunakan fitur Export JSON untuk backup manual
- **Sinkronisasi** — Semua perubahan dimuat semula automatik di dashboard

## Fungsi JavaScript

### Untuk Developer

```javascript
// Load acara dari storage
getTakwimEvents()

// Simpan acara ke storage
saveTakwimEvents(events)

// Init module di dashboard
initTakwimModule()

// Render kalender
renderDashboardTakwim()

// Navigasi bulan
navigateTakwimBulan(direction)  // -1 sebelumnya, 0 semasa, 1 seterusnya

// Konfigurasi
simpanTakwimEvent()      // Simpan dari form
editTakwimEvent(id)      // Edit acara
padamTakwimEvent(id)     // Padam acara

// Import/Export
exportTakwimEvents()     // Download JSON
importTakwimEvents(file) // Upload JSON
```

## Integrasi dengan Modul Lain

- **Dashboard** — Paparan ringkas acara akan datang dan kalender bulan
- **Notifikasi** — Boleh diperluas untuk hantar notifikasi acara penting
- **Jadual Waktu** — Boleh integrate dengan jadual untuk paparkan cuti

## Contoh Data Sample

Untuk testing, import JSON berikut ke dalam Takwim:

```json
[
  {
    "id": "1715000400000",
    "tarikh": "2026-05-30",
    "tarikhAkhir": "2026-06-01",
    "tajuk": "Cuti Hari Gawai",
    "kategori": "Cuti",
    "warna": "#ef4444",
    "catatan": "Cuti sekolah rasmi"
  },
  {
    "id": "1715000400001",
    "tarikh": "2026-06-15",
    "tarikhAkhir": null,
    "tajuk": "PBD Kuartal 1",
    "kategori": "PBD",
    "warna": "#3b82f6",
    "catatan": "Pentaksiran berkala untuk semua subjek"
  },
  {
    "id": "1715000400002",
    "tarikh": "2026-07-10",
    "tarikhAkhir": null,
    "tajuk": "Mesyuarat Guru Besar & Guru Besar Kanan",
    "kategori": "Mesyuarat",
    "warna": "#10b981",
    "catatan": "Dewan Guru, pukul 14:00"
  }
]
```

## Panduan Admin

### Tambah Acara Baru
1. Buka **Konfigurasi → Takwim/Kalender Sekolah**
2. Isi borang:
   - Tarikh Mula (wajib)
   - Tajuk Acara (wajib)
   - Pilih Kategori
   - Pilih Warna
   - (Opsional) Tarikh Akhir dan Catatan
3. Klik **Tambah Acara**

### Edit Acara
1. Cari acara di senarai
2. Klik butang **Edit** (🖊️)
3. Ubah maklumat yang diperlukan
4. Klik **Simpan Perubahan**

### Padam Acara
1. Cari acara di senarai
2. Klik butang **Padam** (🗑️)
3. Potong **PASTI**

### Backup Data
1. Klik **Eksport JSON**
2. File akan dimuat turun dengan nama `takwim-sekolah-YYYY-MM-DD.json`
3. Simpan di lokasi selamat

### Restore Data
1. Klik **Import JSON**
2. Pilih file JSON yang disimpan sebelumnya
3. Acara-acara akan ditambah ke takwim

## Catatan Teknikal

- **Browser Compatibility** — Semua browser moden dengan localStorage support
- **Offline Mode** — Berfungsi sepenuhnya tanpa internet connection
- **Performance** — Optimized untuk 100+ events tanpa lag
- **Mobile Responsive** — Kalender dan form fully responsive di tablet/phone
- **No Server Required** — Semua data disimpan di browser; tiada sync ke server (untuk versi current)

## Future Enhancement

Fitur-fitur yang boleh ditambah:
- Sinkronisasi dengan Google Calendar
- Notifikasi otomatis untuk acara penting
- Integrasi dengan Jadual Waktu untuk auto-highlight cuti
- Export ke iCal format
- Sharing acara dengan parent melalui WhatsApp/Telegram
- SMS/WhatsApp reminder 1 hari sebelum acara

## Troubleshooting

| Masalah | Penyelesaian |
|---------|-----------|
| Acara tidak papar di dashboard | Refresh dashboard dengan klik **Muat Semula** |
| Form tidak simpan acara | Pastikan Tarikh Mula dan Tajuk diisi |
| Data hilang selepas refresh browser | Backup lost; gunakan Eksport untuk backup masa depan |
| Filter tahun tidak menunjuk | Tambah lebih banyak acara dari tahun berbeza |

---

**Versi:** 1.0  
**Dibuat:** Mei 2026  
**Dikemaskini:** 14 Mei 2026  
**Diuji di:** SK Kiandongo, Tongod, Sabah

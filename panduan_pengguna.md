# Panduan Lengkap Penggunaan SmartSchoolHub (xbasmarthub)

Selamat datang ke panduan rasmi SmartSchoolHub (xbasmarthub) SK Kiandongo. Panduan ini disediakan khas untuk Guru dan Pentadbir bagi memudahkan penggunaan aplikasi secara harian.

Aplikasi SmartSchoolHub dibina berasaskan PWA (Progressive Web App). Ia membolehkan pengguna memasang aplikasi terus ke dalam peranti tanpa perlu melalui Google Play Store atau Apple App Store.

---

## 1. Panduan Instalasi (PWA)

### 1.1 PC / Laptop (Windows / Mac)
**Pelayar Web Disyorkan:** Google Chrome atau Microsoft Edge.

1. Buka pelayar web dan layari `https://xbasmarthub.netlify.app`.
2. Setelah halaman utama dimuatkan, lihat pada hujung sebelah kanan kotak URL (Address Bar).
3. Anda akan melihat satu ikon **"Install"** atau ikon berbentuk monitor komputer dengan tanda anak panah ke bawah. Klik ikon tersebut.
4. Tetingkap kecil akan muncul. Klik **Install**.
5. Aplikasi xbasmarthub akan dibuka di dalam tetingkapnya tersendiri dan ikon pintasan (shortcut) akan wujud di Desktop / Taskbar anda.

### 1.2 Android (Telefon Bimbit)
**Pelayar Web Disyorkan:** Google Chrome.

1. Buka aplikasi Google Chrome dan layari `https://xbasmarthub.netlify.app`.
2. Tunggu sehingga halaman selesai dimuatkan. Satu mesej pop-up kecil mungkin muncul di bahagian bawah skrin yang bertulis **"Add xbasmarthub to Home screen"**. Jika ia muncul, ketik pada mesej tersebut.
3. Jika mesej pop-up tidak muncul, ketik pada butang menu tiga titik (⋮) di penjuru atas kanan pelayar web.
4. Pilih **"Add to Home screen"** atau **"Install app"**.
5. Sahkan dengan menekan butang **Add / Install**.
6. Ikon xbasmarthub kini berada di skrin utama (Home Screen) telefon anda.

### 1.3 iPhone / iPad (iOS / iPadOS)
**Pelayar Web Wajib:** Safari.

1. Buka aplikasi Safari dan layari `https://xbasmarthub.netlify.app`.
2. Di bahagian bawah skrin (iPhone) atau atas (iPad), ketik pada ikon **Share** (berbentuk kotak dengan anak panah menghala ke atas).
3. Tatal (scroll) senarai ke atas sedikit sehingga anda menjumpai pilihan **"Add to Home Screen"**. Ketik pada pilihan tersebut.
4. Nama aplikasi akan dipaparkan. Klik **Add** di penjuru atas kanan.
5. Ikon xbasmarthub kini wujud di skrin utama peranti anda.

### 1.4 Tablet Android
Prosesnya adalah sama persis seperti di telefon pintar Android. Sila gunakan Google Chrome, klik menu tiga titik (⋮) dan pilih **"Add to Home screen"** atau **"Install app"**.

---

## 2. Log Masuk (Login)

Bagi menggunakan sistem, pengguna perlu melog masuk:
1. Buka aplikasi xbasmarthub.
2. Di halaman log masuk, isikan butiran log masuk atau gunakan log masuk **Single Sign-On (SSO)** yang disediakan oleh sekolah (contoh: e-mel moe-dl.edu.my).
3. Selepas berjaya, anda akan dibawa ke halaman utama (Dashboard) berdasarkan peranan anda (Guru atau Pentadbir).

---

## 3. Panduan Khas Untuk Guru

Apabila anda log masuk sebagai Guru, paparan utama anda difokuskan kepada maklumat yang paling anda perlukan untuk menjalankan tugas harian.

### 3.1 Dashboard Utama
- Memaparkan notis dan pengumuman rasmi sekolah yang terkini.
- Semak imbas ringkasan aktiviti hari ini.

### 3.2 Modul Takwim Sekolah
- Untuk melihat jadual, mesyuarat, dan acara rasmi sekolah.
- **Cara Penggunaan**: Klik menu **Takwim**. Anda boleh melihat susunan acara mengikut tarikh atau paparan kalendar. Takwim ini dikemas kini oleh pentadbir secara masa nyata (real-time).

### 3.3 Modul Aktiviti & Kokurikulum
- Digunakan untuk merekod pelaporan kehadiran aktiviti dan mengurus maklumat aktiviti semasa.
- **Cara Penggunaan**: Klik menu **Aktiviti**. Pilih aktiviti yang berkenaan untuk membaca ringkasan arahan atau maklumat terperinci yang dimasukkan oleh penyelaras.

### 3.4 Modul DSKP (Dokumen Standard Kurikulum dan Pentaksiran)
- Modul sokongan pantas untuk menyemak DSKP subjek anda secara digital tanpa perlu mencari di tempat lain.
- **Cara Penggunaan**: Klik menu **DSKP**, pilih mata pelajaran, tahun, dan semak kandungan.

---

## 4. Panduan Khas Untuk Pentadbir

Pentadbir (Admin) mempunyai akses tambahan untuk mengubah konfigurasi dan data aplikasi. Log masuk menggunakan ID Pentadbir untuk mengaktifkan fungsi penyuntingan.

### 4.1 Pengurusan Takwim
- **Menambah/Mengemaskini Takwim**: Pentadbir boleh menambah entri takwim baharu, mengemas kini tarikh, atau memadam takwim lapuk. 
- Tindakan anda akan terus dipaparkan pada aplikasi semua guru apabila mereka memuat semula sistem (sync).

### 4.2 Pengurusan Aktiviti
- Tambah atau buang maklumat berkaitan aktiviti, kelab, persatuan, dan kokurikulum sekolah. 
- Kemaskini maklumat pelaporan atau muat naik dokumen (jika berkaitan).

### 4.3 Konfigurasi & Tetapan (Config)
- Pentadbir boleh menukar tetapan konfigurasi seperti notifikasi (`TAKWIM_GURU_NOTIF_*`) melalui halaman tetapan pentadbir.
- Semua tetapan diselaraskan dengan pelayan pangkalan data utama sekolah (Cloudflare D1 / Blob).
- Sila pastikan anda mengemaskini konfigurasi dengan berhati-hati kerana ia memberi impak kepada seluruh aplikasi sekolah.

---

## 5. Tips, Bantuan & Sokongan

- **Aplikasi Terasa Lambat atau Data Tidak Dikemas Kini?** Memandangkan aplikasi ini adalah PWA, ia menyimpan cache secara automatik untuk kelajuan (berfungsi sewaktu 'offline'). Jika anda mahu data terbaru, pastikan peranti berhubung ke internet dan tekan ikon/butang **Muat Semula (Refresh / Reload)**.
- **Ruang Storan Rendah?** xbasmarthub dibina menggunakan saiz fail yang sangat kecil dan ringan. Ia menjimatkan ruang berbanding aplikasi tradisional dan menjimatkan penggunaan data internet anda.
- Jika terdapat masalah log masuk atau kerosakan teknikal, sila berhubung terus dengan Unit ICT Sekolah / Admin SmartSchoolHub.

---

**Disediakan Oleh**: Unit ICT / Pembangun SmartSchoolHub
**Bagi Kegunaan**: SK Kiandongo
**Tahun**: 2026

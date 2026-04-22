# Data Migration Plan

## Tujuan

Kurangkan pendedahan data peribadi dalam repo tanpa mematikan aliran kerja SmartSchoolHub yang sedang aktif.

## Keadaan Semasa

Repo masih menjejak:

- beberapa fail `.xlsx`
- beberapa fail `.docx`

Sebahagian fail ini mengandungi data peribadi sebenar.

## Pelan Disyorkan

### Fasa 1

- tambah `sample-data/` untuk fixture pembangunan yang selamat
- tukar util bantuan seperti `import_data.js` supaya tidak lagi menyimpan data sebenar dalam source
- keluarkan CSV guru, murid, dan hari lahir daripada fail tracked di root repo

### Fasa 2

- pindahkan data sebenar ke folder tempatan seperti `private-data/`
- ubah dokumentasi dan proses operasi supaya import data sebenar datang dari storan selamat
- gunakan sample/template dalam repo untuk demo dan pembangunan

### Fasa 3

- jika repo akan dikongsi luas atau dijadikan awam, buang data sensitif daripada Git history
- putar semua secret yang pernah berada dalam commit lama

## Prinsip Migrasi

- jangan padam sumber operasi sebenar secara mendadak jika modul masih bergantung padanya
- sediakan template dan sample terlebih dahulu
- pindahkan data sebenar hanya selepas laluan operasi baharu telah diuji

# SIAP - Sistem Informasi Absensi Pegawai
## Panduan Deployment & Penggunaan

---

## 📁 STRUKTUR FILE

```
absensi-pegawai/
├── index.html              ← File utama aplikasi
├── style.css               ← Stylesheet
├── app.js                  ← Logic aplikasi
├── google-apps-script.js   ← Script untuk integrasi Google Drive
└── README.md               ← Panduan ini
```

---

## 🚀 CARA DEPLOY KE SERVER

### Option A: Web Server Biasa (Apache/Nginx)
1. Upload semua file ke folder public_html atau www
2. Pastikan index.html bisa diakses dari browser
3. Selesai! Tidak butuh database server (menggunakan localStorage)

### Option B: GitHub Pages (Gratis)
1. Buat repository baru di GitHub
2. Upload semua file
3. Aktifkan GitHub Pages di Settings → Pages
4. Akses via URL: https://username.github.io/nama-repo

### Option C: Netlify / Vercel (Gratis)
1. Drag-drop folder ke netlify.com/drop
2. Dapatkan URL otomatis dalam hitungan detik

### Option D: Localhost untuk Demo
1. Buka file index.html langsung di browser
2. Atau gunakan: `python3 -m http.server 8080`

---

## 👤 AKUN DEFAULT

| Username | Password    | Role   |
|----------|-------------|--------|
| admin    | admin123    | Admin  |
| pegawai  | pegawai123  | Staff  |
| budi     | budi123     | Staff  |
| dewi     | dewi123     | Staff  |

---

## 🔧 FITUR APLIKASI

### ✅ Login & Keamanan
- Login dengan NIP atau Username
- Session tersimpan di browser
- Ganti password

### ✅ Absensi GPS
- Deteksi lokasi otomatis via GPS browser
- Tampil koordinat + alamat (Nominatim)
- Jam Masuk / Istirahat / Kembali / Pulang

### ✅ Data Pegawai (Admin)
- Tambah, edit, hapus pegawai
- Golongan PNS dan PPPK
- Pangkat/Golongan Ruang lengkap (Ia s.d. IVe)
- Golongan PPPK lengkap (V s.d. IX)
- Jabatan, unit kerja, kontak

### ✅ Laporan Presensi
- Filter per bulan, tahun, pegawai
- Statistik ringkasan
- Export CSV (bisa dibuka di Excel)
- Kirim langsung ke Google Drive

### ✅ Dashboard
- Statistik kehadiran bulanan
- Status absensi hari ini

---

## 📤 INTEGRASI GOOGLE DRIVE

### Langkah-langkah:
1. Buka https://script.google.com
2. Klik **+ Proyek Baru**
3. Hapus kode default, paste isi file `google-apps-script.js`
4. (Opsional) Ganti `FOLDER_ID` dengan ID folder Drive tujuan
5. Klik **Deploy** → **Deployment Baru**
6. Pilih tipe: **Web App**
7. Jalankan sebagai: **Saya**
8. Siapa yang punya akses: **Semua orang**
9. Klik **Deploy** → izinkan akses
10. Salin **URL Deployment**
11. Di aplikasi SIAP: Laporan → Generate → **📤 Google Drive**
12. Tempel URL dan klik Kirim

---

## 💾 PENYIMPANAN DATA

Aplikasi menggunakan **localStorage** browser sebagai database:
- Data tersimpan di browser yang digunakan
- Untuk multi-user/multi-device, disarankan migrasi ke backend (PHP+MySQL)
- Data aman selama browser tidak di-clear

---

## 🔄 UPGRADE KE DATABASE SERVER

Untuk produksi skala besar, tambahkan backend:
- **PHP + MySQL**: Ganti fungsi DB.get/set dengan fetch() ke API PHP
- **Supabase**: Database PostgreSQL gratis dengan REST API
- **Firebase**: Database realtime Google gratis tier

---

## 📞 SUPPORT

Jika ada pertanyaan, hubungi developer atau buka dokumentasi di README ini.

© 2026 SIAP - Sistem Informasi Absensi Pegawai

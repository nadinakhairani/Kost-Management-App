# Kost Data Management App

Aplikasi Web CRUD (Create, Read, Update, Delete) sederhana untuk mengelola data kamar, penghuni, pembayaran listrik, dan pembayaran tahunan sewa kost. Proyek ini dibuat menggunakan **Node.js, Express.js, dan SQL Server** sebagai backend, serta **HTML, CSS (Bootstrap 5), dan Vanilla JavaScript** sebagai frontend. Cocok digunakan sebagai referensi tugas kuliah praktikum basis data (SQL II).

---

## Fitur Utama & Kueri SQL II

Aplikasi ini mencakup fitur akademis yang memanfaatkan perintah SQL Server berikut:
1. **JOIN**: Menggabungkan data penghuni dengan kamar, serta mencocokkan pembayaran dengan data penghuni.
2. **LIKE**: Pencarian data penghuni berdasarkan nama secara fleksibel.
3. **GROUP BY, COUNT & SUM**:
   - Menghitung jumlah penghuni per kamar (`COUNT` & `GROUP BY`).
   - Akumulasi total pembayaran listrik bulanan (`SUM` & `GROUP BY`).
   - Akumulasi total pendapatan sewa tahunan (`SUM` & `GROUP BY`).

---

## Struktur Folder Project

```
kost-management-app/
├── database/
│   └── schema.sql          # Script inisialisasi tabel & data dummy (SQL Server)
├── public/                 # Folder static files frontend (SPA)
│   ├── css/
│   │   └── style.css       # File styling custom (Premium dashboard theme)
│   ├── js/
│   │   └── app.js          # File logic ajax fetch, DOM manipulation, & navigation
│   └── index.html          # Struktur halaman utama & modal forms
├── src/                    # Folder source code backend
│   ├── config/
│   │   └── db.js           # Konfigurasi koneksi pool ke MS SQL Server
│   ├── controllers/
│   │   ├── kamar.js        # Controller logika bisnis Data Kamar
│   │   ├── penghuni.js     # Controller logika bisnis Data Penghuni (dengan pencarian & filter)
│   │   ├── listrik.js      # Controller logika bisnis Pembayaran Listrik
│   │   ├── tahunan.js      # Controller logika bisnis Pembayaran Tahunan
│   │   └── laporan.js      # Controller logika agregasi laporan dashboard
│   ├── routes/
│   │   ├── kamar.js        # Router Data Kamar
│   │   ├── penghuni.js     # Router Data Penghuni
│   │   ├── listrik.js      # Router Pembayaran Listrik
│   │   ├── tahunan.js      # Router Pembayaran Tahunan
│   │   └── laporan.js      # Router Dashboard & Laporan Aggregasi
│   └── server.js           # Entry point utama Express.js web server
├── .env                    # File konfigurasi port server & kredensial database
├── package.json            # Daftar dependency Node.js (express, mssql, dotenv, cors)
└── README.md               # Dokumentasi instalasi dan cara penggunaan
```

---

## Langkah Instalasi & Cara Menjalankan Project

### Prerequisites (Prasyarat)
Pastikan Anda sudah menginstal aplikasi berikut di komputer Anda:
1. **Node.js** (versi 16 atau lebih baru)
2. **Microsoft SQL Server** (Express/Developer Edition)
3. **SQL Server Management Studio (SSMS)** atau ekstensi SQL Server di VS Code.

---

### Langkah 1: Pengaturan Database di SQL Server

1. Buka **SQL Server Management Studio (SSMS)** dan hubungkan ke server database Anda (misalnya `localhost` atau `.\SQLEXPRESS`).
2. Buat database baru bernama `kost_db`. Anda dapat menjalankannya lewat Query Analyzer:
   ```sql
   CREATE DATABASE kost_db;
   ```
3. Buka file [schema.sql](file:///C:/Users/Acer/.gemini/antigravity/scratch/kost-management-app/database/schema.sql) yang terletak di folder `/database`.
4. Salin seluruh isi skrip tersebut dan jalankan (Execute) di dalam database `kost_db`. Skrip ini akan membuat tabel:
   - `Kamar`
   - `Penghuni`
   - `PembayaranListrik`
   - `PembayaranTahunan`
   serta mengisi data awal (dummy seeds) secara otomatis.

---

### Langkah 2: Setup Konfigurasi Backend

1. Buka folder root proyek di code editor Anda.
2. Buka file [.env](file:///C:/Users/Acer/.gemini/antigravity/scratch/kost-management-app/.env) di editor Anda.
3. Ubah kredensial database agar sesuai dengan pengaturan SQL Server lokal Anda:
   ```env
   # Server configuration
   PORT=3000

   # SQL Server database credentials
   DB_USER=sa
   DB_PASSWORD=MasukkanPasswordSQLServerAnda
   DB_SERVER=localhost
   DB_DATABASE=kost_db
   DB_PORT=1433
   DB_ENCRYPT=false
   ```
   *Catatan: Pastikan fitur SQL Server Authentication aktif di SQL Server Anda dan port default `1433` dalam kondisi enabled.*

---

### Langkah 3: Menginstal Dependency & Menjalankan Aplikasi

1. Buka Command Prompt, PowerShell, atau terminal di folder `kost-management-app`.
2. Instal library-library yang diperlukan dengan mengetik:
   ```bash
   npm install
   ```
3. Jalankan server backend dengan perintah:
   ```bash
   npm start
   ```
4. Jika berhasil, terminal akan menampilkan pesan:
   ```text
   ===================================================
    Kost Data Management App is running!
    Web Server: http://localhost:3000
   ===================================================
   ```
5. Buka web browser Anda dan akses alamat:
   **[http://localhost:3000](http://localhost:3000)**

---

## Penjelasan Singkat Kueri SQL dalam Controller

Bagi mahasiswa yang menggunakannya sebagai tugas kuliah SQL II, berikut letak kueri penting yang digunakan:

1. **JOIN & LIKE (Nama)**:
   - File: [src/controllers/penghuni.js](file:///C:/Users/Acer/.gemini/antigravity/scratch/kost-management-app/src/controllers/penghuni.js)
   - Digunakan untuk mengambil detail nama kamar dari tabel `Kamar` menggunakan `LEFT JOIN` dan mencocokkan pencarian nama penghuni dengan operator `LIKE`.

2. **JOIN (Pembayaran)**:
   - File: [src/controllers/listrik.js](file:///C:/Users/Acer/.gemini/antigravity/scratch/kost-management-app/src/controllers/listrik.js) & [src/controllers/tahunan.js](file:///C:/Users/Acer/.gemini/antigravity/scratch/kost-management-app/src/controllers/tahunan.js)
   - Menghubungkan tabel pembayaran dengan tabel `Penghuni` (`INNER JOIN`) guna menampilkan nama penghuni yang membayar.

3. **COUNT, GROUP BY, SUM (Laporan)**:
   - File: [src/controllers/laporan.js](file:///C:/Users/Acer/.gemini/antigravity/scratch/kost-management-app/src/controllers/laporan.js)
   - `getPenghuniPerKamarReport`: Menggunakan `COUNT` dan `GROUP BY` untuk menghitung kapasitas terisi per kamar kost.
   - `getListrikReport` & `getTahunanReport`: Menggunakan `SUM` dan `GROUP BY` untuk rekap bulanan/tahunan total pendapatan sewa maupun listrik.

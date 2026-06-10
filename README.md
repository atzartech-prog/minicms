# MiniCMS 🚀

MiniCMS adalah Sistem Manajemen Konten (CMS) ultra-ringan berbasis flat-file JSON. Aplikasi ini dirancang dengan antarmuka modern premium, fitur pratinjau langsung (live preview), dan kemampuan berjalan dalam dua mode operasional (dengan server Node.js atau sebagai web statis murni).

## 🌟 Fitur Utama
*   **Flat-file JSON Database**: Semua postingan disimpan dalam format berkas `.json` sederhana (`data/posts.json`).
*   **Dual Mode Execution**:
    1.  **API Server Mode**: Berjalan menggunakan Express.js untuk sinkronisasi otomatis langsung ke berkas JSON server.
    2.  **Local Sync Mode**: Berjalan tanpa server (statis murni, misalnya di **GitHub Pages**). Menyimpan revisi di LocalStorage dan dilengkapi tombol **Ekspor JSON** untuk mengunduh berkas database baru.
*   **Live Preview**: Pratinjau langsung tampilan artikel blog secara real-time saat Anda mengetik di editor.
*   **Helper Toolbar**: Tombol pintasan di editor untuk menyisipkan tag HTML (Heading, Bold, List, Link, Code) secara instan.
*   **Aesthetics Premium**: Tema gelap (default) & terang dengan efek glassmorphism, responsive dashboard layout, dan notifikasi Toast yang dinamis.
*   **Fully Responsive**: Optimal digunakan di layar desktop maupun perangkat mobile.

## 📁 Struktur Proyek
```text
minicms/
├── data/
│   └── posts.json       # Flat-file database postingan
├── public/
│   ├── index.html       # Antarmuka SPA utama
│   ├── style.css        # Gaya tampilan (Vanilla CSS)
│   └── app.js           # Logika aplikasi (SPA, editor, fallback)
├── server.js            # Node.js backend (Express server & REST API)
├── package.json         # Konfigurasi dependensi npm
└── README.md            # Panduan petunjuk dokumentasi
```

## 🛠️ Panduan Menjalankan Lokal

### Cara 1: Menggunakan Node.js Server (API Mode)
Jika perangkat Anda memiliki Node.js terinstal:
1.  Buka terminal/command prompt di direktori proyek `minicms`.
2.  Pasang dependensi Express:
    ```bash
    npm install
    ```
3.  Jalankan server:
    ```bash
    npm start
    ```
4.  Buka browser Anda di: `http://localhost:3000`

### Cara 2: Tanpa Server (Static Mode / File local)
Jika perangkat Anda tidak memiliki Node.js terinstal:
1.  Cukup buka direktori `public` dan klik ganda berkas `index.html` untuk menjalankannya langsung di browser.
2.  Status database akan menampilkan **Local Sync (Static)**.
3.  Anda dapat membuat, mengedit, atau menghapus postingan secara bebas. Perubahan akan tersimpan di browser Anda.
4.  Untuk menerapkan perubahan secara permanen pada file proyek, klik **Ekspor JSON** di sidebar, lalu timpa berkas `data/posts.json` lama dengan berkas yang baru diunduh.

## 🌐 Deploy ke GitHub Pages
Karena MiniCMS mendukung *Local Sync Mode*, Anda dapat men-deploy folder `/public` dan `data/posts.json` ke layanan hosting statis gratis seperti **GitHub Pages**:
1.  Buat repositori baru di GitHub.
2.  Unggah seluruh isi folder proyek ini.
3.  Aktifkan fitur **Pages** pada pengaturan repositori GitHub Anda dan arahkan source ke folder root atau folder `public`.

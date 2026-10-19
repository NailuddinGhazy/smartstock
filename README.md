# SmartStock POS

SmartStock adalah aplikasi web kasir dan manajemen persediaan. Aplikasi terdiri dari frontend React yang berjalan terpisah dari backend Laravel API.

## Fitur

- **Dashboard** — Ringkasan jumlah produk, transaksi, pendapatan, nilai stok, produk terbaru, dan grafik penjualan tujuh hari terakhir.
- **Produk** — Menampilkan, menambah, mengubah, dan menghapus data produk.
- **Stok Barang** — Menampilkan status stok (menipis pada 5 unit atau kurang) dan menambah atau mengurangi stok.
- **Kasir dan transaksi** — Mencari produk, mengelola keranjang, memvalidasi jumlah terhadap stok, menyimpan transaksi, mengurangi stok, dan melihat atau mencetak nota.
- **Riwayat penjualan** — Menampilkan transaksi yang tersimpan beserta produk dan jumlahnya.
- **Laporan** — Merangkum pendapatan, jumlah transaksi, unit terjual, produk terlaris, grafik, dan riwayat untuk hari, minggu, bulan, tahun, tanggal, atau semua transaksi.
- **Login dan logout** — Menggunakan autentikasi sesi Laravel; endpoint bisnis memerlukan login.

## Teknologi

- **Frontend:** React 19, Vite, JavaScript, CSS, Lucide React, Recharts.
- **Backend:** PHP `^8.3`, Laravel `^13.17`, Laravel Sanctum.
- **Database bawaan:** SQLite. Laravel juga memiliki konfigurasi koneksi MySQL.

## Struktur proyek

```text
smartstock/
├── backend/                 # Aplikasi Laravel, API, migrasi, dan database
│   ├── app/
│   ├── database/migrations/
│   ├── routes/api.php
│   ├── routes/web.php
│   └── README.md
├── smartstock/
│   └── frontend/            # Aplikasi React + Vite
│       ├── src/
│       ├── public/
│       └── README.md
└── README.md
```

## Persyaratan

- PHP 8.3 atau lebih baru dengan ekstensi yang dibutuhkan Laravel dan PDO SQLite.
- Composer.
- Node.js dan npm.
- MySQL hanya jika memilih MySQL alih-alih SQLite.

## Menjalankan untuk pengembangan

Gunakan dua terminal dari direktori proyek.

### 1. Siapkan backend

Di terminal pertama:

```powershell
cd backend
composer install
Copy-Item .env.example .env
php artisan key:generate
if (-not (Test-Path database/database.sqlite)) { New-Item -ItemType File database/database.sqlite }
php artisan migrate
```

Konfigurasi `.env.example` sudah memilih SQLite. Secara default, Laravel memakai `backend/database/database.sqlite`. Jika ingin memakai MySQL, ubah `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, dan `DB_PASSWORD` pada `backend/.env`, lalu siapkan databasenya sebelum menjalankan migrasi.

Untuk login, buat akun sendiri melalui Tinker:

```powershell
php artisan tinker
```

```php
\App\Models\User::create([
    'name' => 'Admin',
    'email' => 'admin@example.com',
    'password' => 'GantiDenganPasswordKuat',
]);
```

Model User meng-hash password saat disimpan. Sebagai alternatif untuk pengembangan saja, `php artisan db:seed` membuat akun `test@example.com` dengan password `password`; jangan gunakan akun contoh tersebut di lingkungan publik.

Jalankan server backend:

```powershell
php artisan serve
```

Backend berjalan pada `http://localhost:8000`.

### 2. Siapkan frontend

Di terminal kedua, dari direktori root proyek:

```powershell
cd smartstock/frontend
npm install
npm run dev
```

Buka `http://localhost:5173`.

## Integrasi lokal

Frontend menggunakan `http://localhost:8000` sebagai alamat API di `src/api.js`. Konfigurasi CORS backend mengizinkan origin `http://localhost:5173`, dan permintaan menggunakan cookie sesi serta perlindungan CSRF Sanctum.

Untuk pengembangan lokal, pastikan `backend/.env` memiliki domain stateful yang mencakup origin frontend dan host backend, misalnya:

```dotenv
SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:8000,127.0.0.1:5173,127.0.0.1:8000
```

Jika host, port, atau domain diubah, sesuaikan juga `backend/config/cors.php` dan alamat API di `smartstock/frontend/src/api.js`. Nilai saat ini ditujukan untuk pengembangan lokal, bukan deployment publik.

## Perintah pemeriksaan

Jalankan dari direktori frontend:

```powershell
npm run lint
npm run build
```

Jalankan tes backend dari direktori `backend`:

```powershell
php artisan test
```

Tes backend yang tersedia saat ini adalah tes contoh untuk memastikan halaman Laravel merespons dengan sukses.

## Catatan data

Migrasi membuat tabel pengguna dan sesi Laravel, produk, transaksi, detail transaksi, serta tabel infrastruktur Laravel. Produk memiliki nama, kategori, harga, dan stok. Transaksi menyimpan total dan setiap detail menyimpan produk, kuantitas, harga saat transaksi, dan subtotal. Produk yang telah direferensikan oleh detail transaksi tidak dapat dihapus karena relasi database membatasi penghapusan tersebut.

Jangan commit `backend/.env` atau memasukkan kredensial maupun data produksi ke repositori. File impor spreadsheet/CSV di `backend/` adalah data sumber; kode aplikasi tidak otomatis mengimpor file tersebut.

## Lisensi

Belum ada lisensi khusus proyek yang dinyatakan.

# Backend SmartStock

Backend ini adalah API Laravel untuk aplikasi SmartStock POS. Backend juga menangani login/logout berbasis sesi dan mengirim halaman sambutan Laravel pada route `/`.

## Stack

- PHP `^8.3`
- Laravel `^13.17`
- Laravel Sanctum `^4.0` untuk autentikasi SPA berbasis cookie/sesi
- SQLite sebagai koneksi database bawaan; MySQL juga tersedia melalui konfigurasi Laravel
- PhpSpreadsheet `^5.10` terpasang sebagai dependensi, tetapi belum ada alur kode aplikasi yang mengimpor file spreadsheet/CSV secara otomatis.

## Menyiapkan lingkungan lokal

Jalankan dari direktori `backend`:

```powershell
composer install
Copy-Item .env.example .env
php artisan key:generate
```

Konfigurasi bawaan memakai SQLite di `database/database.sqlite`. Jika file database belum ada, buat sebelum menjalankan migrasi:

```powershell
if (-not (Test-Path database/database.sqlite)) { New-Item -ItemType File database/database.sqlite }
php artisan migrate
```

Untuk memakai MySQL, ubah `DB_CONNECTION` menjadi `mysql` dan isi `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, serta `DB_PASSWORD` pada `.env`. Buat databasenya terlebih dahulu.

Tambahkan domain lokal frontend dan backend ke `.env` agar Sanctum mengenali permintaan SPA:

```dotenv
SANCTUM_STATEFUL_DOMAINS=localhost:5173,localhost:8000,127.0.0.1:5173,127.0.0.1:8000
```

Konfigurasi CORS saat ini hanya mengizinkan `http://localhost:5173` dan memakai credentials. Untuk port atau domain lain, perbarui `config/cors.php` serta `SANCTUM_STATEFUL_DOMAINS`.

### Membuat pengguna

Tidak ada akun administrator bawaan yang dibuat oleh migrasi. Buat akun melalui Tinker:

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

Password di-hash oleh cast model User. Untuk pengembangan saja, `php artisan db:seed` membuat `test@example.com` dengan password `password`; jangan gunakan akun ini pada deployment publik.

### Menjalankan server

```powershell
php artisan serve
```

Server lokal berjalan di `http://localhost:8000`.

## Endpoint yang digunakan frontend

Login dan logout berada pada route web, sedangkan data aplikasi berada pada route API. Semua endpoint bisnis pada `/api/*` memerlukan sesi login Sanctum.

| Method | Path | Keterangan |
| --- | --- | --- |
| `POST` | `/login` | Validasi email dan password, lalu membuat sesi login. |
| `POST` | `/logout` | Mengakhiri sesi dan membuat ulang token CSRF. |
| `GET` | `/api/user` | Mengembalikan pengguna yang sedang login. |
| `GET` | `/api/products` | Mengambil daftar produk terbaru. |
| `POST` | `/api/products` | Membuat produk dengan `name`, `category`, `price`, dan `stock`. |
| `PUT` | `/api/products/{product}` | Memperbarui seluruh field produk tersebut. |
| `DELETE` | `/api/products/{product}` | Menghapus produk jika tidak direferensikan detail transaksi. |
| `PATCH` | `/api/products/{product}/stock` | Mengubah stok dengan nilai `stock` bilangan bulat non-negatif. |
| `GET` | `/api/transactions` | Mengambil transaksi terbaru berikut detail dan data produk. |
| `POST` | `/api/transactions` | Membuat transaksi dari array `items` berisi `product_id` dan `quantity`. |

Validasi produk mewajibkan nama dan kategori teks, harga numerik non-negatif, serta stok bilangan bulat non-negatif. Transaksi harus berisi setidaknya satu produk unik dengan kuantitas bilangan bulat positif. Backend menghitung total dari harga database, memeriksa stok terbaru, menyimpan transaksi dan detail, lalu mengurangi stok dalam satu transaksi database.

Contoh payload transaksi:

```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 2
    }
  ]
}
```

## Skema database

- `users`, `sessions`, dan `password_reset_tokens`: autentikasi Laravel.
- `products`: nama, kategori (default `Umum`), harga, stok, dan timestamp.
- `transactions`: total transaksi dan timestamp.
- `transaction_details`: relasi transaksi/produk, kuantitas, harga saat penjualan, dan subtotal. Produk yang sudah memiliki detail transaksi dilindungi dari penghapusan.

## Tes

```powershell
php artisan test
```

Tes yang tersedia masih berupa tes contoh Laravel untuk route `/`; belum mencakup pengujian alur API produk, stok, autentikasi, atau transaksi.

Untuk petunjuk menjalankan frontend dan keseluruhan aplikasi, lihat [README proyek](../README.md).

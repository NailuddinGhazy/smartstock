# Frontend SmartStock

Frontend SmartStock adalah aplikasi kasir dan manajemen stok satu halaman yang dibuat dengan React dan Vite. Aplikasi mengambil produk dan transaksi dari backend Laravel; fitur internal hanya tersedia setelah login.

## Fitur antarmuka

- **Dashboard:** ringkasan jumlah produk dan transaksi, pendapatan, nilai stok, lima produk terbaru, serta grafik penjualan tujuh hari terakhir.
- **Produk:** menampilkan daftar produk serta menambah, mengubah, dan menghapus produk.
- **Stok Barang:** daftar stok dan status; stok 5 unit atau kurang ditandai menipis, dengan aksi tambah/kurang satu unit.
- **Transaksi:** pencarian produk, keranjang dengan pengaturan kuantitas, konfirmasi penjualan, nota yang dapat dicetak, dan riwayat transaksi.
- **Laporan:** filter hari ini, minggu ini, minggu pilihan, bulan ini, tahun ini, tanggal pilihan, atau semua transaksi; menampilkan pendapatan, jumlah transaksi, unit terjual, produk terlaris, grafik, dan riwayat.
- **Autentikasi:** login dan logout dengan sesi Laravel Sanctum serta cookie CSRF.

## Teknologi

- React `^19.2.8` dan React DOM
- Vite `^8.3.0` dengan plugin React
- Lucide React untuk ikon
- Recharts untuk grafik
- ESLint untuk pemeriksaan kode

## Menjalankan untuk pengembangan

```powershell
npm install
npm run dev
```

Vite menampilkan alamat lokal (secara default `http://localhost:5173`). Backend Laravel harus berjalan di `http://localhost:8000`; lihat [panduan backend](../../backend/README.md) untuk menyiapkannya.

Frontend memanggil API yang ditetapkan langsung sebagai `http://localhost:8000` di `src/api.js`. Permintaan menyertakan credentials dan token CSRF untuk metode yang mengubah data. CORS backend saat ini hanya mengizinkan `http://localhost:5173`. Jika host atau port berubah, sesuaikan alamat API dan konfigurasi CORS/stateful Sanctum backend sebelum menguji aplikasi.

## Perintah

```powershell
npm run lint
npm run build
npm run preview
```

- `npm run lint` menjalankan ESLint.
- `npm run build` menghasilkan bundle produksi di `dist/`.
- `npm run preview` menyajikan hasil build secara lokal untuk pemeriksaan.

## Data dan batasan saat ini

Data produk dan transaksi dimuat dari Laravel; laporan dihitung di browser dari transaksi yang diambil backend. Login menggunakan email/password pengguna yang telah dibuat di backend. Frontend belum menyediakan halaman pendaftaran pengguna, impor CSV/Excel, atau konfigurasi URL API melalui environment variable.

Kolom pencarian pada halaman Produk saat ini belum memfilter daftar; pencarian produk tersedia pada tampilan kasir.

Lihat [README proyek](../../README.md) untuk panduan menjalankan frontend dan backend bersama-sama.

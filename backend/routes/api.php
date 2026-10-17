<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionDetail;

// Route untuk mengecek user yang sedang login.
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Semua route bisnis wajib login.
Route::middleware('auth:sanctum')->group(function () {

    Route::get('/products', function () {
        return Product::latest()->get();
    });

    Route::post('/products', function (Request $request) {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
        ]);

        $product = Product::create($validated);

        return response()->json($product, 201);
    });

    Route::delete('/products/{product}', function (Product $product) {
        $product->delete();

        return response()->noContent();
    });


    Route::patch('/products/{product}/stock', function (Request $request, Product $product) {
        $validated = $request->validate([
            'stock' => 'required|integer|min:0',
        ]);

        $product->update([
            'stock' => $validated['stock'],
        ]);

        return response()->json($product);
    });


    Route::put('/products/{product}', function (Request $request, Product $product) {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
        ]);

        $product->update($validated);

        return response()->json($product);
    });

    Route::post('/transactions', function (Request $request) {
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|integer|distinct|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $transaction = DB::transaction(function () use ($validated) {
            // Urutkan ID agar penguncian stok lebih konsisten.
            $productIds = collect($validated['items'])
                ->pluck('product_id')
                ->sort()
                ->values();

            // Ambil dan kunci semua produk yang akan dibeli.
            $products = Product::whereIn('id', $productIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $total = 0;
            $details = [];

            // Periksa seluruh stok dan hitung total dari database.
            foreach ($validated['items'] as $index => $item) {
                $product = $products->get($item['product_id']);

                if (!$product) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        "items.$index.product_id" => [
                            'Produk tidak ditemukan.',
                        ],
                    ]);
                }

                if ($item['quantity'] > $product->stock) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        "items.$index.quantity" => [
                            "Stok {$product->name} tidak mencukupi.",
                        ],
                    ]);
                }

                $subtotal = $product->price * $item['quantity'];
                $total += $subtotal;

                $details[] = [
                    'product' => $product,
                    'quantity' => $item['quantity'],
                    'price' => $product->price,
                    'subtotal' => $subtotal,
                ];
            }

            // Simpan satu transaksi utama.
            $transaction = Transaction::create([
                'total' => $total,
            ]);

            // Simpan detail setiap produk dan kurangi stoknya.
            foreach ($details as $detail) {
                $transaction->details()->create([
                    'product_id' => $detail['product']->id,
                    'quantity' => $detail['quantity'],
                    'price' => $detail['price'],
                    'subtotal' => $detail['subtotal'],
                ]);

                $detail['product']->decrement(
                    'stock',
                    $detail['quantity']
                );
            }

            return $transaction->load('details.product');
        });

        return response()->json($transaction, 201);
    });

    Route::get('/transactions', function () {
        return \App\Models\Transaction::with('details.product')
            ->latest()
            ->get();
    });


});

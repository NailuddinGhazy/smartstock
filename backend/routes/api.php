<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionDetail;

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
        'product_id' => 'required|integer|exists:products,id',
        'quantity' => 'required|integer|min:1',
    ]);

    try {
        $transaction = DB::transaction(function () use ($validated) {
            $product = Product::whereKey($validated['product_id'])
                ->lockForUpdate()
                ->firstOrFail();

            $quantity = $validated['quantity'];

            if ($quantity > $product->stock) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'quantity' => ['Stok tidak mencukupi.'],
                ]);
            }

            $subtotal = $product->price * $quantity;

            $transaction = Transaction::create([
                'total' => $subtotal,
            ]);

            $transaction->details()->create([
                'product_id' => $product->id,
                'quantity' => $quantity,
                'price' => $product->price,
                'subtotal' => $subtotal,
            ]);

            $product->decrement('stock', $quantity);

            return $transaction->load('details.product');
        });

        return response()->json($transaction, 201);
    } catch (\Illuminate\Validation\ValidationException $error) {
        throw $error;
    }
});
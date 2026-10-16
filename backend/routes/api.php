<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Models\Product;

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

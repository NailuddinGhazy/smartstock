<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::post('/login', function (Request $request) {
    $credentials = $request->validate([
        'email' => 'required|email',
        'password' => 'required|string',
    ]);

    if (! Auth::attempt($credentials)) {
        return response()->json([
            'message' => 'Email atau password salah.',
        ], 401);
    }

    $request->session()->regenerate();

    return response()->json([
        'message' => 'Login berhasil.',
        'user' => $request->user(),
    ]);
});

Route::post('/logout', function (Request $request) {
    Auth::guard('web')->logout();

    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return response()->json([
        'message' => 'Logout berhasil.',
    ]);
});
<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProductController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

// Authentication Routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Temporary Image Upload Route
Route::middleware('auth:sanctum')->post('/upload-temp', function (Request $request) {
    $request->validate(['image' => 'required|image|max:10240']); // 10MB max
    $path = $request->file('image')->store('temp');
    return response()->json([
        'url' => Storage::url($path)
    ]);
});

// Product Enhancement Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/products/analyze', [ProductController::class, 'analyze']);
    Route::post('/products/enhance', [ProductController::class, 'enhance']);
    Route::get('/user', [AuthController::class, 'user']);
});

// Frontend Routes - Handled by React
Route::view('/login', 'app')->name('login');
Route::view('/register', 'app')->name('register');
Route::view('/{any}', 'app')->where('any', '.*');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
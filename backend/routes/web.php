<?php

use Illuminate\Support\Facades\Route;

// Serve static dist assets (FIRST - highest priority)
Route::get('/dist/{path}', function ($path) {
    $file = public_path('dist/' . $path);
    if (file_exists($file)) {
        // Set appropriate content-type
        $ext = pathinfo($file, PATHINFO_EXTENSION);
        $mimeTypes = [
            'js' => 'application/javascript',
            'css' => 'text/css',
            'svg' => 'image/svg+xml',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'json' => 'application/json'
        ];
        $mime = $mimeTypes[$ext] ?? 'application/octet-stream';
        return response()->file($file, ['Content-Type' => $mime]);
    }
    abort(404);
})->where('path', '.*');

// Serve SPA frontend ONLY for UI routes (not /api)
Route::get('/', function () {
    return response()->file(public_path('dist/index.html'));
})->name('home');

Route::get('/{any}', function () {
    return response()->file(public_path('dist/index.html'));
})->where('any', '^(?!api)(?!up).*$')->name('spa');



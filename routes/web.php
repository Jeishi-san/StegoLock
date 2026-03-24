<?php

use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Document upload route
    Route::post('/documents/upload', [DocumentController::class, 'upload'])
        ->name('documents.upload');
});

use App\Http\Controllers\WikiFeedController;
Route::get('/wiki/random/{p}', [WikiFeedController::class, 'fetchRandomWiki']);
Route::get('/wiki/export', [WikiFeedController::class, 'exportToTxt']);
Route::post('/covers/text/generate', [WikiFeedController::class, 'exportToTxt']);

require __DIR__.'/auth.php';

<?php

namespace App\Http\Controllers;

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



Route::middleware('auth', 'verified')->group(function () {

    // Route::get('/myDocuments', function () {
    //     return Inertia::render('MyDocuments');
    // })->name('myDocuments');

    Route::get('/myDocuments', [DocumentController::class, 'index'])
        ->name('myDocuments');

    Route::get('/folder', function () {
        return Inertia::render('Folder');
    })->name('folder');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');


    // Document upload route
    Route::post('/documents/upload', [DocumentController::class, 'upload'])
        ->name('documents.upload');

    Route::post('/documents/lock', [DocumentController::class, 'lock'])
        ->name('documents.lock');

    Route::post('/documents/unlock', [DocumentController::class, 'unlock'])
        ->name('documents.unlock');

    Route::post('/documents/delete', [DocumentController::class, 'delete'])
        ->name('documents.delete');

    Route::get('/documents/status/{id}', [DocumentController::class, 'getStatus']);

    Route::get('/documents/download/{id}', [DocumentController::class, 'download']);

    Route::post('/documents/keep', [DocumentController::class, 'keep'])
        ->name('documents.keep');

    Route::get('/documents/getFileInfo/{id}', [DocumentController::class, 'getStorageInfo']);

});

use App\Http\Controllers\WikiFeedController;
Route::get('/wiki/random/{p}', [WikiFeedController::class, 'fetchRandomWiki']);
Route::get('/wiki/export', [WikiFeedController::class, 'exportToTxt']);
Route::post('/covers/text/generate', [WikiFeedController::class, 'exportToTxt']);
Route::post('/covers/scan', [CoverController::class, 'scan_cover']);

require __DIR__.'/auth.php';

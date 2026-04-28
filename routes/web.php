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

    Route::get('/myFolders', [FolderController::class, 'index'])
        ->name('myFolders');

    Route::get('/allDocuments', [DocumentController::class, 'allDocumentsIndex'])
        ->name('allDocuments');

    Route::get('/sharedDocuments', [DocumentController::class, 'sharedIndex'])
        ->name('sharedDocuments');
        
    Route::get('/starredDocuments', [StarredController::class, 'index'])
        ->name('starredDocuments');

    Route::get('/manageStorage', [DocumentController::class, 'manageStorage'])
        ->name('manageStorage');
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

    Route::post('/documents/star/toggle', [StarredController::class, 'toggleStar'])
        ->name('documents.star.toggle');


    // Folder Management
    Route::get('/folders', [FolderController::class, 'index']);
    Route::post('/folders', [FolderController::class, 'store']);
    Route::put('/folders/{id}', [FolderController::class, 'update']);
    Route::delete('/folders/{id}', [FolderController::class, 'destroy']);
    Route::put('/documents/{id}/move', [DocumentController::class, 'moveDocument']);
    Route::put('/documents/{id}/rename', [DocumentController::class, 'rename']);

    // Document Sharing
    Route::post('/documents/share', [DocumentController::class, 'share'])
        ->name('documents.share');
    Route::post('/documents/share/accept', [DocumentController::class, 'acceptShare'])
        ->name('documents.share.accept');
    Route::post('/documents/share/remove', [DocumentController::class, 'removeAccess'])
        ->name('documents.share.remove');
    Route::get('/documents/activity/{id}', [DocumentController::class, 'getActivity']);
    Route::get('/documents/recipients/{id}', [DocumentController::class, 'getRecipients']);

    // Folder Sharing
    Route::post('/folders/share', [DocumentController::class, 'shareFolder'])
        ->name('folders.share');
    Route::post('/folders/share/accept', [DocumentController::class, 'acceptFolderShare'])
        ->name('folders.share.accept');

});

// Admin Routes
Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    
    // Dashboard
    Route::get('/dashboard', function () {
        return inertia('Admin/Dashboard');
    })->name('dashboard');

    // User Management
    Route::get('/users', function () {
        return inertia('Admin/Users');
    })->name('users.index');

    // System Monitoring
    Route::get('/system/stats', function () {
        return inertia('Admin/SystemMonitoring');
    })->name('system.stats');

    // Administrative Group (Superadmin Only)
    Route::middleware(['role:superadmin'])->group(function () {
        Route::get('/admins', function () {
            return inertia('Admin/Users'); // Placeholder or specific Admin management page
        })->name('admins.index');
        Route::post('/admins/{user}/promote', [\App\Http\Controllers\Admin\AdminManagementController::class, 'promote'])->name('admins.promote');
        Route::post('/admins/{user}/demote', [\App\Http\Controllers\Admin\AdminManagementController::class, 'demote'])->name('admins.demote');
    });

    // System Management (DB & Storage Admin + Superadmin)
    Route::middleware('role:db_storage_admin,superadmin')->group(function () {
        Route::patch('/users/{user}/storage-limit', [\App\Http\Controllers\Admin\SystemManagementController::class, 'updateStorageLimit'])->name('system.storage-limit');
    });
});

use App\Http\Controllers\WikiFeedController;
Route::get('/wiki/random/{p}', [WikiFeedController::class, 'fetchRandomWiki']);
Route::get('/wiki/export', [WikiFeedController::class, 'exportToTxt']);
Route::post('/covers/text/generate', [WikiFeedController::class, 'exportToTxt']);
Route::post('/covers/scan', [CoverController::class, 'scan_cover']);

require __DIR__.'/auth.php';

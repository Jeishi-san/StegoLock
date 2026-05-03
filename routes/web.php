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
    
    // All Admin Users (user_admin, db_storage_admin, superadmin)
    Route::middleware('role:user_admin,db_storage_admin,superadmin')->group(function () {
        // Dashboard
        Route::get('/dashboard', [\App\Http\Controllers\Admin\AdminDashboardController::class, 'index'])->name('dashboard');
    });
    
    // User Management (Accessible by user_admin and superadmin)
    Route::middleware('role:user_admin,superadmin')->group(function () {
        Route::get('/users', [\App\Http\Controllers\Admin\UserManagementController::class, 'index'])->name('users.index');
        Route::post('/users', [\App\Http\Controllers\Admin\UserManagementController::class, 'store'])->name('users.store');
        Route::get('/users/{user}/activities', [\App\Http\Controllers\Admin\UserManagementController::class, 'getUserActivities'])->name('users.activities');
        Route::patch('/users/{user}/update-role', [\App\Http\Controllers\Admin\UserManagementController::class, 'updateRole'])->name('users.update-role');
        Route::patch('/users/{user}/toggle-status', [\App\Http\Controllers\Admin\UserManagementController::class, 'toggleStatus'])->name('users.toggle-status');
        Route::patch('/users/{user}/update-quota', [\App\Http\Controllers\Admin\UserManagementController::class, 'updateQuota'])->name('users.update-quota');
        Route::delete('/users/{user}', [\App\Http\Controllers\Admin\UserManagementController::class, 'deleteUser'])->name('users.destroy');
    });

    // Cloud Management
    Route::middleware('role:db_storage_admin,superadmin')->group(function () {
        Route::get('/cloud', [\App\Http\Controllers\Admin\SystemManagementController::class, 'cloudIndex'])->name('cloud.index');
    });

    // Database Management
    Route::middleware('role:db_storage_admin,superadmin')->group(function () {
        Route::get('/database', [\App\Http\Controllers\Admin\SystemManagementController::class, 'databaseIndex'])->name('database.index');
    });

    // Administrative Group (Superadmin Only Actions)
    Route::middleware(['role:superadmin'])->group(function () {
        Route::post('/users/{user}/promote', [\App\Http\Controllers\Admin\AdminManagementController::class, 'promote'])->name('admins.promote');
        Route::post('/users/{user}/demote', [\App\Http\Controllers\Admin\AdminManagementController::class, 'demote'])->name('admins.demote');
    });

    // System Management (DB & Storage Admin + Superadmin)
    Route::middleware('role:db_storage_admin,superadmin')->group(function () {
        Route::patch('/users/{user}/storage-limit', [\App\Http\Controllers\Admin\SystemManagementController::class, 'updateStorageLimit'])->name('system.storage-limit');
        
        // Covers
        Route::get('/covers', [\App\Http\Controllers\CoverController::class, 'index'])->name('covers.index');
        Route::post('/covers/upload-candidate', [\App\Http\Controllers\CoverController::class, 'uploadCandidate'])->name('covers.upload-candidate');
        Route::post('/covers/scan', [\App\Http\Controllers\CoverController::class, 'scan_cover'])->name('covers.scan');
        Route::post('/covers/audit', [\App\Http\Controllers\CoverController::class, 'auditIntegrity'])->name('covers.audit');
        Route::post('/covers/cleanup', [\App\Http\Controllers\CoverController::class, 'cleanupOrphans'])->name('covers.cleanup');
        
        // Wiki Feed Management (for text cover generation)
        Route::get('/wiki/random/{p}', [WikiFeedController::class, 'fetchRandomWiki'])->name('wiki.random');
        Route::post('/covers/text/generate', [WikiFeedController::class, 'exportToTxt'])->name('covers.text.generate');
    });
});

require __DIR__.'/auth.php';

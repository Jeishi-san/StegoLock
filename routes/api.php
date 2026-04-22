<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FolderController;

// Route::middleware('auth:sanctum')->group(function () {

    Route::get('/folders', [FolderController::class, 'index']);
    Route::post('/folders', [FolderController::class, 'store']);
    Route::put('/folders/{id}', [FolderController::class, 'update']);
    Route::delete('/folders/{id}', [FolderController::class, 'destroy']);

// });

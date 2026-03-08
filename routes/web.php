<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\AuthController;

# Route call codes

/*
# Code 1
Route::get('/', function () {
    return inertia('Page', ['parameter' => 'value']);
});

# Code 2
Route::inertia('/', 'Page', ['parameter' => 'value']);
*/

//Route::inertia('/', 'Login');
//Route::inertia('/signup', 'Signup');

//Route::inertia('/userview', 'MyDocuments');

Route::inertia('/', 'Main');

Route::inertia('/test_encrypt', 'FileEncryptor');

Route::inertia('/test_decrypt', 'FileDecryptor');

Route::inertia('/test_uploadencrypted', 'FileUploadEncrypted');

Route::inertia('/test_upload', 'FileUpload');

#---------------------------------------------------------------------#
// Route::post('/register', [AuthController::class, 'register']);
// Route::post('/login', [AuthController::class, 'login']);
#---------------------------------------------------------------------#

Route::get('/admin', function () {
    return Inertia::render('AdminLayout');
});

Route::get('/admin/login', function () {
    return Inertia::render('pages/AdminLoginPage');
});

Route::inertia('/admin', 'AdminDashboardPage')
    ->middleware(['auth:admin']);

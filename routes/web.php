<?php

use Illuminate\Support\Facades\Route;

# Route call codes

/*
# Code 1
Route::get('/', function () {
    return inertia('Page', ['parameter' => 'value']);
});

# Code 2
Route::inertia('/', 'Page', ['parameter' => 'value']);
*/

Route::inertia('/', 'Login');
Route::inertia('/signup', 'Signup');

Route::inertia('/userview', 'MyDocuments');

Route::inertia('/main', 'Main');



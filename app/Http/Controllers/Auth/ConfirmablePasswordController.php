<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ConfirmablePasswordController extends Controller
{
    /**
     * Show the confirm password view.
     */
    public function show(): Response
    {
        return Inertia::render('Auth/ConfirmPassword');
    }

    /**
     * Confirm the user's password.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        // Verify password using custom auth system
        $auth_salt = base64_decode($user->auth_salt);
        $password_derivedKey = hash_pbkdf2(
            'sha256',
            $request->password,
            $auth_salt,
            100000,
            32,
            true
        );

        if (!hash_equals(base64_encode($password_derivedKey), $user->password_hash)) {
            throw ValidationException::withMessages([
                'password' => __('auth.password'),
            ]);
        }

        $request->session()->put('auth.password_confirmed_at', time());

        $user = $request->user();
        $redirectRoute = $user->isUserAdmin() || $user->isDbStorageAdmin() || $user->isSuperadmin() 
            ? 'admin.dashboard' 
            : 'myDocuments';
        
        return redirect()->intended(route($redirectRoute, absolute: false));
    }
}

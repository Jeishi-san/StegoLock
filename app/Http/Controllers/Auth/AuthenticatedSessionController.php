<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        //Retrieve user by email
        $user = \App\Models\User::where('email', strtolower($request->email))->first();

        if (!$user) {
            return back()->withErrors(['email' => 'Invalid credentials']);
        }
        //Decode the stored salt
        $salt = base64_decode($user->auth_salt);

        //Derive key from user input password
        $password_derivedKey = hash_pbkdf2(
            'sha256',
            $request->password,
            $salt,
            100000,
            32,
            true
        );

        //Compare using constant-time check
        if (!hash_equals(base64_encode($password_derivedKey), $user->password_hash)) {
            return back()->withErrors(['email' => 'Invalid credentials']);
        }

        //Derive master key from password hash + mk_salt
        $mk_salt = base64_decode($user->mk_salt);
        $master_key = hash_pbkdf2(
            'sha256',
            $password_derivedKey, // raw bytes of password PBKDF2
            $mk_salt,
            100000,
            32,
            true
        );

        // Optionally: attach master key to user object/session for StegoLock use
        $user->master_key = $master_key; // in-memory only, not stored in DB

        // 6️⃣ Login user manually
        Auth::login($user);

        // 7️⃣ Regenerate session
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}

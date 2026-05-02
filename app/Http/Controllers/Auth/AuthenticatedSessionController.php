<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
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
        $email = $request->string('email')->trim()->lower()->toString();

        // Retrieve user by normalized email
        $user = User::query()->where('email', '=', $email)->first();

        if (!$user) {
            return back()->withErrors(['email' => 'Invalid credentials']);
        }

        // Decode salts
        $auth_salt = base64_decode($user->auth_salt);
        $ek_salt = base64_decode($user->ek_salt);

        // Derive key from input password
        $password_derivedKey = hash_pbkdf2(
            'sha256',
            $request->password,
            $auth_salt,
            100000,
            32,
            true
        );

        // Verify password
        if (!hash_equals(base64_encode($password_derivedKey), $user->password_hash)) {
            return back()->withErrors(['email' => 'Invalid credentials']);
        }

        // Decrypt master key
        $encryption_key = hash_pbkdf2('sha256', $password_derivedKey, $ek_salt, 100000, 32, true);

        $master_key = openssl_decrypt(
            base64_decode($user->master_key_enc),
            'aes-256-gcm',
            $encryption_key,
            OPENSSL_RAW_DATA,
            base64_decode($user->nonce),
            base64_decode($user->tag)
        );

        if ($master_key === false) {
            return back()->withErrors(['email' => 'Failed to decrypt master key']);
        }

        // Store master key in Redis via TemporaryKeyStorage
        $storage = new \App\Services\TemporaryKeyStorage();
        $token = $storage->store($master_key, $user->id);

        // Store token in session instead of master key
        session(['master_key_token' => $token]);
        session()->forget(['master_key', 'master_key_expires_at']);

        // Regenerate session first (prevents session fixation)
        $request->session()->regenerate();

        // Login user manually
        Auth::login($user);

        // Redirect based on role
        if ($user->isUserAdmin() || $user->isDbStorageAdmin() || $user->isSuperadmin()) {
            return redirect()->intended(route('dashboard', absolute: false));
        }

        return redirect()->intended(route('myDocuments', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        // Delete master key token from Redis if exists
        $token = session('master_key_token');
        if ($token) {
            $storage = new \App\Services\TemporaryKeyStorage();
            $storage->delete($token);
            session()->forget('master_key_token');
        }

        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}

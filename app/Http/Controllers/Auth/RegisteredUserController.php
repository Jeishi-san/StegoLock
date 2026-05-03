<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Config\Constant;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        //PBKDF2 on password
        $auth_salt = random_bytes(Constant::AUTH_SALT_LEN);

        $password_derivedKey = hash_pbkdf2(
            'sha256',
            $request->password,
            $auth_salt,
            100000,
            32,
            true
        );

        //Master Key Generation
        $master_key = random_bytes(Constant::MK_LEN);

        //Encryption Key Derivation
        $ek_salt = random_bytes(Constant::EK_SALT_LEN);
        $encryption_key = hash_pbkdf2(
            'sha256',
            $password_derivedKey,
            $ek_salt,
            100000,
            32,
            true
        );

        //Master Key Encryption
        $nonce = random_bytes(Constant::NONCE_LEN); // Generate a nonce for AES-GCM
        $tag = ''; // Will hold authentication tag

        $master_key_enc = openssl_encrypt(
            $master_key,
            'aes-256-gcm',
            $encryption_key,
            OPENSSL_RAW_DATA,
            $nonce,
            $tag
        );

        //Create user in DB (use direct assignment to bypass $guarded)
        $user = new User();
        $user->name = $request->name;
        $user->email = $request->email;
        $user->password_hash = base64_encode($password_derivedKey);
        $user->auth_salt = base64_encode($auth_salt);
        $user->ek_salt = base64_encode($ek_salt);
        $user->master_key_enc = base64_encode($master_key_enc);
        $user->nonce = base64_encode($nonce);
        $user->tag = base64_encode($tag);
        $user->save();

        event(new Registered($user));

        // Log the user in using custom auth
        $auth_salt = base64_decode($user->auth_salt);
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
        $ek_salt = base64_decode($user->ek_salt);
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

        // Login user manually
        Auth::login($user);

        // Redirect based on role (match login logic)
        if ($user->isUserAdmin() || $user->isDbStorageAdmin() || $user->isSuperadmin()) {
            return redirect()->intended(route('admin.dashboard', absolute: false));
        }

        return redirect()->intended(route('myDocuments', absolute: false));
    }
}

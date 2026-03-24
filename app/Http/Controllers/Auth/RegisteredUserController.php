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

        //Create user in DB
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password_hash' => base64_encode($password_derivedKey),
            'auth_salt' => base64_encode($auth_salt),
            'ek_salt' => base64_encode($ek_salt),
            'master_key_enc' => base64_encode($master_key_enc),
            'nonce' => base64_encode($nonce),
            'tag' => base64_encode($tag),
        ]);

        event(new Registered($user));

        return redirect()
            ->route('login')
            ->with('success', 'Registration successful. Please log in to continue.');
        }
}

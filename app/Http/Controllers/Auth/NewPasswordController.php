<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class NewPasswordController extends Controller
{
    /**
     * Display the password reset view.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('Auth/ResetPassword', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]);
    }

    /**
     * Handle an incoming new password request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // Here we will attempt to reset the user's password. If it is successful we
        // will update the password on an actual user model and persist it to the
        // database. Otherwise we will parse the error and return the response.
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user) use ($request) {
                // Generate new salts
                $authSalt = random_bytes(16);
                $ekSalt = random_bytes(16);
                $masterKey = random_bytes(32);
                $nonce = random_bytes(12);

                // Derive key from new password using PBKDF2
                $derivedKey = hash_pbkdf2('sha256', $request->password, $authSalt, 100000, 32, true);

                // Hash the derived key for password verification
                $passwordHash = base64_encode($derivedKey);

                // Encrypt master key with derived key
                $tag = '';
                $masterKeyEnc = openssl_encrypt(
                    $masterKey,
                    'aes-256-gcm',
                    $derivedKey,
                    OPENSSL_RAW_DATA,
                    $nonce,
                    $tag
                );

                $user->forceFill([
                    'password_hash' => $passwordHash,
                    'auth_salt' => base64_encode($authSalt),
                    'ek_salt' => base64_encode($ekSalt),
                    'master_key_enc' => base64_encode($masterKeyEnc),
                    'nonce' => base64_encode($nonce),
                    'tag' => base64_encode($tag),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        // If the password was successfully reset, we will redirect the user back to
        // the application's home authenticated view. If there is an error we can
        // redirect them back to where they came from with their error message.
        if ($status == Password::PASSWORD_RESET) {
            return redirect()->route('login')->with('status', __($status));
        }

        throw ValidationException::withMessages([
            'email' => [trans($status)],
        ]);
    }
}

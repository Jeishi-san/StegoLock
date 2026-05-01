<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class PasswordController extends Controller
{
    /**
     * Update the user's password.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $user = $request->user();

        // Verify current password using custom auth system
        $auth_salt = base64_decode($user->auth_salt);
        $password_derivedKey = hash_pbkdf2(
            'sha256',
            $validated['current_password'],
            $auth_salt,
            100000,
            32,
            true
        );

        if (!hash_equals(base64_encode($password_derivedKey), $user->password_hash)) {
            return back()->withErrors(['current_password' => __('auth.password')]);
        }

        // Generate new salts and derive key from new password
        $newAuthSalt = random_bytes(16);
        $newEkSalt = random_bytes(16);
        $newDerivedKey = hash_pbkdf2(
            'sha256',
            $validated['password'],
            $newAuthSalt,
            100000,
            32,
            true
        );

        // Hash the new derived key for password verification
        $newPasswordHash = base64_encode($newDerivedKey);

        // Derive encryption key from password derived key and ek_salt
        $ekSalt = base64_decode($user->ek_salt);
        $encryptionKey = hash_pbkdf2('sha256', $password_derivedKey, $ekSalt, 100000, 32, true);

        // Decrypt master key
        $masterKey = openssl_decrypt(
            base64_decode($user->master_key_enc),
            'aes-256-gcm',
            $encryptionKey,
            OPENSSL_RAW_DATA,
            base64_decode($user->nonce),
            base64_decode($user->tag)
        );

        if ($masterKey === false) {
            return back()->withErrors(['current_password' => 'Failed to decrypt master key']);
        }

        // Re-encrypt master key with new derived key
        $newEkSalt = random_bytes(16);
        $newEncryptionKey = hash_pbkdf2('sha256', $newDerivedKey, $newEkSalt, 100000, 32, true);
        $newNonce = random_bytes(12);
        $newTag = '';
        $newMasterKeyEnc = openssl_encrypt(
            $masterKey,
            'aes-256-gcm',
            $newEncryptionKey,
            OPENSSL_RAW_DATA,
            $newNonce,
            $newTag
        );

        // Update user with new password hash and salts
        $user->update([
            'password_hash' => $newPasswordHash,
            'auth_salt' => base64_encode($newAuthSalt),
            'ek_salt' => base64_encode($newEkSalt),
            'master_key_enc' => base64_encode($newMasterKeyEnc),
            'nonce' => base64_encode($newNonce),
            'tag' => base64_encode($newTag),
        ]);

        return back();
    }
}

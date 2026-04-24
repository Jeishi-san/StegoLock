<?php

namespace App\Services;

use App\Config\Constant;
use Illuminate\Support\Facades\Storage;

class CryptoService
{
    /**
     * Unwraps a DEK using a Master Key
     */
    public function unwrapDek(string $encryptedDek, string $masterKey, string $nonce, string $tag, string $salt): ?string
    {
        $wrappingKey = hash_hkdf('sha256', $masterKey, 32, 'dek-wrapping-key', $salt);

        $dek = openssl_decrypt(
            $encryptedDek,
            'aes-256-gcm',
            $wrappingKey,
            OPENSSL_RAW_DATA,
            $nonce,
            $tag
        );

        return $dek ?: null;
    }

    /**
     * Wraps a DEK using a Master Key
     */
    public function wrapDek(string $dek, string $masterKey): array
    {
        $salt = random_bytes(Constant::DK_SALT_LEN);
        $wrappingKey = hash_hkdf('sha256', $masterKey, 32, 'dek-wrapping-key', $salt);
        $nonce = random_bytes(Constant::NONCE_LEN);
        $tag = '';

        $encryptedDek = openssl_encrypt(
            $dek,
            'aes-256-gcm',
            $wrappingKey,
            OPENSSL_RAW_DATA,
            $nonce,
            $tag
        );

        return [
            'encrypted_dek' => $encryptedDek,
            'nonce' => $nonce,
            'tag' => $tag,
            'salt' => $salt
        ];
    }

    /**
     * Encrypts plaintext using a DEK
     */
    public function encrypt(string $plaintext, string $dek): array
    {
        $nonce = random_bytes(Constant::NONCE_LEN);
        $tag = '';
        $ciphertext = openssl_encrypt(
            $plaintext,
            'aes-256-gcm',
            $dek,
            OPENSSL_RAW_DATA,
            $nonce,
            $tag
        );

        return [
            'ciphertext' => $ciphertext,
            'nonce' => $nonce,
            'tag' => $tag
        ];
    }

    /**
     * Decrypts ciphertext using a DEK
     */
    public function decrypt(string $ciphertext, string $dek, string $nonce, string $tag): ?string
    {
        $plaintext = openssl_decrypt(
            $ciphertext,
            'aes-256-gcm',
            $dek,
            OPENSSL_RAW_DATA,
            $nonce,
            $tag
        );

        return $plaintext ?: null;
    }
}

<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return $this->withPassword('password');
    }

    /**
     * Create user with a specific plain text password
     */
    public function withPassword(string $plainPassword): array
    {
        $authSalt = random_bytes(16);
        $ekSalt = random_bytes(16);
        $masterKey = random_bytes(32);
        $nonce = random_bytes(12);

        // Derive key from password using PBKDF2 (for password verification)
        $derivedKey = hash_pbkdf2('sha256', $plainPassword, $authSalt, 100000, 32, true);

        // Hash the derived key for password verification
        $passwordHash = base64_encode($derivedKey);

        // Derive encryption key from derived key + ek_salt (matching controller logic)
        $encryptionKey = hash_pbkdf2('sha256', $derivedKey, $ekSalt, 100000, 32, true);

        // Encrypt master key with encryption key
        $tag = '';
        $masterKeyEnc = openssl_encrypt(
            $masterKey,
            'aes-256-gcm',
            $encryptionKey,
            OPENSSL_RAW_DATA,
            $nonce,
            $tag
        );

        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password_hash' => $passwordHash,
            'auth_salt' => base64_encode($authSalt),
            'ek_salt' => base64_encode($ekSalt),
            'master_key_enc' => base64_encode($masterKeyEnc),
            'nonce' => base64_encode($nonce),
            'tag' => base64_encode($tag),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}

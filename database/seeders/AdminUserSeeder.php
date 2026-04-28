<?php

namespace Database\Seeders;

use App\Models\User;
use App\Config\Constant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admins = [
            [
                'email' => 'superadmin@stegolock.com',
                'name' => 'System Owner',
                'role' => User::ROLE_SUPERADMIN,
                'password' => 'password'
            ],
            [
                'email' => 'user.admin@stegolock.com',
                'name' => 'User Manager',
                'role' => User::ROLE_USER_ADMIN,
                'password' => 'password'
            ],
            [
                'email' => 'system.admin@stegolock.com',
                'name' => 'System Administrator',
                'role' => User::ROLE_DB_STORAGE_ADMIN,
                'password' => 'password'
            ],
            [
                'email' => 'user@example.com',
                'name' => 'Standard User',
                'role' => User::ROLE_USER,
                'password' => 'password'
            ],
        ];

        foreach ($admins as $adminData) {
            $this->createUser($adminData);
        }
    }

    private function createUser($data)
    {
        // Replicate logic from RegisteredUserController
        $auth_salt = random_bytes(Constant::AUTH_SALT_LEN);
        $password_derivedKey = hash_pbkdf2('sha256', $data['password'], $auth_salt, 100000, 32, true);

        $master_key = random_bytes(Constant::MK_LEN);
        $ek_salt = random_bytes(Constant::EK_SALT_LEN);
        $encryption_key = hash_pbkdf2('sha256', $password_derivedKey, $ek_salt, 100000, 32, true);

        $nonce = random_bytes(Constant::NONCE_LEN);
        $tag = '';

        $master_key_enc = openssl_encrypt(
            $master_key,
            'aes-256-gcm',
            $encryption_key,
            OPENSSL_RAW_DATA,
            $nonce,
            $tag
        );

        User::updateOrCreate(
            ['email' => $data['email']],
            [
                'name' => $data['name'],
                'password_hash' => base64_encode($password_derivedKey),
                'auth_salt' => base64_encode($auth_salt),
                'ek_salt' => base64_encode($ek_salt),
                'master_key_enc' => base64_encode($master_key_enc),
                'nonce' => base64_encode($nonce),
                'tag' => base64_encode($tag),
                'role' => $data['role'],
                'email_verified_at' => now(),
            ]
        );
    }
}

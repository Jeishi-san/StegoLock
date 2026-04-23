<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class TestUsersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $testUsers = [
            // Admin users
            [
                'name' => 'Admin User',
                'email' => 'admin@stegolock.test',
                'password_hash' => Hash::make('password123'),
                'auth_salt' => base64_encode(random_bytes(16)),
                'ek_salt' => base64_encode(random_bytes(16)),
                'master_key_enc' => base64_encode(random_bytes(48)),
                'nonce' => base64_encode(random_bytes(12)),
                'tag' => base64_encode(random_bytes(16)),
                'email_verified_at' => now(),
                'storage_limit' => 1024 * 1024 * 1024 * 10, // 10 GB
            ],
            // Owner test user
            [
                'name' => 'Document Owner',
                'email' => 'owner@stegolock.test',
                'password_hash' => Hash::make('password123'),
                'auth_salt' => base64_encode(random_bytes(16)),
                'ek_salt' => base64_encode(random_bytes(16)),
                'master_key_enc' => base64_encode(random_bytes(48)),
                'nonce' => base64_encode(random_bytes(12)),
                'tag' => base64_encode(random_bytes(16)),
                'email_verified_at' => now(),
                'storage_limit' => 1024 * 1024 * 1024 * 2, // 2 GB
            ],
            // Standard viewer users
            [
                'name' => 'Alice Viewer',
                'email' => 'alice@stegolock.test',
                'password_hash' => Hash::make('password123'),
                'auth_salt' => base64_encode(random_bytes(16)),
                'ek_salt' => base64_encode(random_bytes(16)),
                'master_key_enc' => base64_encode(random_bytes(48)),
                'nonce' => base64_encode(random_bytes(12)),
                'tag' => base64_encode(random_bytes(16)),
                'email_verified_at' => now(),
                'storage_limit' => 1024 * 1024 * 1024, // 1 GB
            ],
            [
                'name' => 'Bob Viewer',
                'email' => 'bob@stegolock.test',
                'password_hash' => Hash::make('password123'),
                'auth_salt' => base64_encode(random_bytes(16)),
                'ek_salt' => base64_encode(random_bytes(16)),
                'master_key_enc' => base64_encode(random_bytes(48)),
                'nonce' => base64_encode(random_bytes(12)),
                'tag' => base64_encode(random_bytes(16)),
                'email_verified_at' => now(),
                'storage_limit' => 1024 * 1024 * 1024, // 1 GB
            ],
            [
                'name' => 'Charlie Viewer',
                'email' => 'charlie@stegolock.test',
                'password_hash' => Hash::make('password123'),
                'auth_salt' => base64_encode(random_bytes(16)),
                'ek_salt' => base64_encode(random_bytes(16)),
                'master_key_enc' => base64_encode(random_bytes(48)),
                'nonce' => base64_encode(random_bytes(12)),
                'tag' => base64_encode(random_bytes(16)),
                'email_verified_at' => now(),
                'storage_limit' => 1024 * 1024 * 1024, // 1 GB
            ],
            [
                'name' => 'Diana Viewer',
                'email' => 'diana@stegolock.test',
                'password_hash' => Hash::make('password123'),
                'auth_salt' => base64_encode(random_bytes(16)),
                'ek_salt' => base64_encode(random_bytes(16)),
                'master_key_enc' => base64_encode(random_bytes(48)),
                'nonce' => base64_encode(random_bytes(12)),
                'tag' => base64_encode(random_bytes(16)),
                'email_verified_at' => now(),
                'storage_limit' => 1024 * 1024 * 1024, // 1 GB
            ],
            [
                'name' => 'Eve Viewer',
                'email' => 'eve@stegolock.test',
                'password_hash' => Hash::make('password123'),
                'auth_salt' => base64_encode(random_bytes(16)),
                'ek_salt' => base64_encode(random_bytes(16)),
                'master_key_enc' => base64_encode(random_bytes(48)),
                'nonce' => base64_encode(random_bytes(12)),
                'tag' => base64_encode(random_bytes(16)),
                'email_verified_at' => now(),
                'storage_limit' => 1024 * 1024 * 1024, // 1 GB
            ],
            // Special test users
            [
                'name' => 'Revoked User',
                'email' => 'revoked@stegolock.test',
                'password_hash' => Hash::make('password123'),
                'auth_salt' => base64_encode(random_bytes(16)),
                'ek_salt' => base64_encode(random_bytes(16)),
                'master_key_enc' => base64_encode(random_bytes(48)),
                'nonce' => base64_encode(random_bytes(12)),
                'tag' => base64_encode(random_bytes(16)),
                'email_verified_at' => now(),
                'storage_limit' => 1024 * 1024 * 512, // 512 MB
            ],
            [
                'name' => 'Read Only User',
                'email' => 'readonly@stegolock.test',
                'password_hash' => Hash::make('password123'),
                'auth_salt' => base64_encode(random_bytes(16)),
                'ek_salt' => base64_encode(random_bytes(16)),
                'master_key_enc' => base64_encode(random_bytes(48)),
                'nonce' => base64_encode(random_bytes(12)),
                'tag' => base64_encode(random_bytes(16)),
                'email_verified_at' => now(),
                'storage_limit' => 0,
            ],
            [
                'name' => 'Test User 10',
                'email' => 'test10@stegolock.test',
                'password_hash' => Hash::make('password123'),
                'auth_salt' => base64_encode(random_bytes(16)),
                'ek_salt' => base64_encode(random_bytes(16)),
                'master_key_enc' => base64_encode(random_bytes(48)),
                'nonce' => base64_encode(random_bytes(12)),
                'tag' => base64_encode(random_bytes(16)),
                'email_verified_at' => now(),
                'storage_limit' => 1024 * 1024 * 1024, // 1 GB
            ],
        ];

        foreach ($testUsers as $userData) {
            User::create($userData);
        }

        $this->command->info('Created 10 test users successfully!');
        $this->command->info('Login email: admin@stegolock.test / password123');
        $this->command->info('All users have password: password123');
    }
}

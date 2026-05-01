<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PasswordUpdateTest extends TestCase
{
    use RefreshDatabase;

    public function test_password_can_be_updated(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->put('/password', [
                'current_password' => 'password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        // Refresh user from database
        $user = $user->refresh();

        // Verify the password was updated by checking with the new password
        $auth_salt = base64_decode($user->auth_salt);
        $new_password_derivedKey = hash_pbkdf2('sha256', 'new-password', $auth_salt, 100000, 32, true);

        $this->assertTrue(
            hash_equals(base64_encode($new_password_derivedKey), $user->password_hash),
            'Password hash should match new password'
        );

        // Verify master key can be decrypted with new password
        $ek_salt = base64_decode($user->ek_salt);
        $encryption_key = hash_pbkdf2('sha256', $new_password_derivedKey, $ek_salt, 100000, 32, true);

        $master_key = openssl_decrypt(
            base64_decode($user->master_key_enc),
            'aes-256-gcm',
            $encryption_key,
            OPENSSL_RAW_DATA,
            base64_decode($user->nonce),
            base64_decode($user->tag)
        );

        $this->assertNotFalse($master_key, 'Master key should be decryptable with new password');
    }

    public function test_correct_password_must_be_provided_to_update_password(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->put('/password', [
                'current_password' => 'wrong-password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ]);

        $response
            ->assertSessionHasErrors('current_password')
            ->assertRedirect('/profile');
    }
}

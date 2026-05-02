<?php

namespace Tests\Unit\Services;

use App\Services\TemporaryKeyStorage;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class TemporaryKeyStorageTest extends TestCase
{
    protected TemporaryKeyStorage $storage;
    protected string $testKey = 'test-master-key-1234567890';
    protected int $userIdA = 1;
    protected int $userIdB = 2;

    protected function setUp(): void
    {
        parent::setUp();
        $this->storage = new TemporaryKeyStorage();
        $this->storage->setTtl(3600); // Default TTL for most tests

        // Clean up any existing test keys
        $this->flushTestKeys();
    }

    protected function tearDown(): void
    {
        $this->flushTestKeys();
        parent::tearDown();
    }

    protected function flushTestKeys(): void
    {
        Cache::store('array')->flush();
    }

    /**
     * UT-001: test_store_returns_token()
     * Call store('test-key', $userId) → Returns 64-char random token
     * Priority: HIGH
     */
    public function test_store_returns_token(): void
    {
        $token = $this->storage->store($this->testKey, $this->userIdA);

        $this->assertIsString($token);
        $this->assertEquals(64, strlen($token)); // 32 bytes bin2hex = 64 chars
        $this->assertMatchesRegularExpression('/^[a-f0-9]{64}$/', $token);
    }

    /**
     * UT-002: test_retrieve_returns_original_key()
     * Store key, then retrieve with token → Returns exact original key
     * Priority: HIGH
     */
    public function test_retrieve_returns_original_key(): void
    {
        $token = $this->storage->store($this->testKey, $this->userIdA);
        $retrieved = $this->storage->retrieve($token, $this->userIdA);

        $this->assertEquals($this->testKey, $retrieved);
    }

    /**
     * UT-003: test_retrieve_returns_null_for_invalid_token()
     * Retrieve with random token → Returns null
     * Priority: HIGH
     */
    public function test_retrieve_returns_null_for_invalid_token(): void
    {
        $invalidToken = bin2hex(random_bytes(32));
        $retrieved = $this->storage->retrieve($invalidToken, $this->userIdA);

        $this->assertNull($retrieved);
    }

    /**
     * UT-004: test_delete_removes_token()
     * Store, delete, then retrieve → Token gone, retrieve returns null
     * Priority: HIGH
     */
    public function test_delete_removes_token(): void
    {
        $token = $this->storage->store($this->testKey, $this->userIdA);
        $this->assertNotNull($this->storage->retrieve($token, $this->userIdA));

        $this->storage->delete($token);
        $this->assertNull($this->storage->retrieve($token, $this->userIdA));
    }

    /**
     * UT-005: test_token_expires_after_ttl()
     * Store key, wait 1 hour, retrieve → Returns null (expired)
     * Priority: MEDIUM
     */
    public function test_token_expires_after_ttl(): void
    {
        // Set very short TTL for testing
        $this->storage->setTtl(1); // 1 second
        $token = $this->storage->store($this->testKey, $this->userIdA);

        // Wait for TTL to expire
        sleep(2);

        $retrieved = $this->storage->retrieve($token, $this->userIdA);
        $this->assertNull($retrieved);
    }

    /**
     * UT-006: test_different_users_cannot_access_each_others_keys()
     * User A stores, User B tries retrieve → User B gets null
     * Priority: HIGH
     */
    public function test_different_users_cannot_access_each_others_keys(): void
    {
        $token = $this->storage->store($this->testKey, $this->userIdA);

        // User B tries to retrieve
        $retrievedByB = $this->storage->retrieve($token, $this->userIdB);
        $this->assertNull($retrievedByB);

        // User A can still retrieve
        $retrievedByA = $this->storage->retrieve($token, $this->userIdA);
        $this->assertEquals($this->testKey, $retrievedByA);
    }

    /**
     * UT-007: test_encryption_at_rest()
     * Check Redis value is encrypted → Redis stores encrypted value, not plaintext
     * Priority: HIGH
     */
    public function test_encryption_at_rest(): void
    {
        $token = $this->storage->store($this->testKey, $this->userIdA);
        $redisKey = 'temp_key:' . $token;

        $payload = Cache::store('array')->get($redisKey);

        $this->assertNotNull($payload);
        $data = json_decode($payload, true);

        // Payload should contain encrypted key, not plaintext
        $this->assertArrayHasKey('key', $data);
        $this->assertNotEquals($this->testKey, $data['key']);

        // Verify the encrypted key can be decrypted to the original
        $decrypted = Crypt::decryptString($data['key']);
        $this->assertEquals($this->testKey, $decrypted);
    }

    /**
     * UT-008: test_concurrent_store_operations()
     * 100 concurrent stores → All tokens unique, all retrievable
     * Priority: MEDIUM
     */
    public function test_concurrent_store_operations(): void
    {
        $tokens = [];
        $errors = [];

        // Simulate concurrent stores (sequential in test but check uniqueness)
        for ($i = 0; $i < 100; $i++) {
            $token = $this->storage->store($this->testKey . $i, $this->userIdA);
            $tokens[] = $token;

            // Verify token is retrievable immediately
            $retrieved = $this->storage->retrieve($token, $this->userIdA);
            if ($retrieved !== $this->testKey . $i) {
                $errors[] = "Failed to retrieve token {$i}";
            }
        }

        // Check all tokens are unique
        $uniqueTokens = array_unique($tokens);
        $this->assertCount(100, $uniqueTokens, 'All tokens should be unique');

        // Check no retrieval errors
        $this->assertEmpty($errors, implode(', ', $errors));
    }

    /**
     * UT-009: test_token_collision_resistance()
     * Generate 10,000 tokens, check uniqueness → No collisions
     * Priority: LOW
     */
    public function test_token_collision_resistance(): void
    {
        $tokens = [];
        for ($i = 0; $i < 10000; $i++) {
            $token = $this->storage->store($this->testKey . $i, $this->userIdA);
            $tokens[] = $token;
        }

        $uniqueTokens = array_unique($tokens);
        $this->assertCount(10000, $uniqueTokens, 'No token collisions in 10,000 generations');
    }

    /**
     * UT-010: test_special_characters_in_key()
     * Store key with binary data → Retrieve returns exact binary
     * Priority: HIGH
     */
    public function test_special_characters_in_key(): void
    {
        // Binary data including null bytes and special characters
        $binaryKey = random_bytes(128) . "\x00\x01\x02\x03" . 'special-chars-😊';

        $token = $this->storage->store($binaryKey, $this->userIdA);
        $retrieved = $this->storage->retrieve($token, $this->userIdA);

        $this->assertEquals($binaryKey, $retrieved);
    }
}

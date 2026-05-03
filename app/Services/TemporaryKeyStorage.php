<?php

namespace App\Services;

use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class TemporaryKeyStorage
{
    /**
     * Token time-to-live in seconds (default: 1 hour)
     */
    protected int $ttl;

    /**
     * Cache store name used for temporary keys.
     * Supports any Laravel cache driver: redis, array, file, database, memcached, etc.
     */
    protected string $store;

    /**
     * Cache key prefix for temporary keys
     */
    protected string $prefix = 'temp_key:';

    /**
     * Create a new temporary key storage instance.
     *
     * The cache driver can be configured via:
     * - config/temporary-key-storage.php ('store' key)
     * - env variable: TEMPORARY_KEY_STORAGE_STORE
     *
     * Supported drivers: 'redis', 'array', 'file', 'database', 'memcached'
     * Default: 'redis' (falls back to 'array' if Redis unavailable)
     */
    public function __construct()
    {
        $desiredStore = config('temporary-key-storage.store', 'redis');

        // Validate the store is configured in cache.php
        $availableStores = array_keys(config('cache.stores', []));

        if (!in_array($desiredStore, $availableStores)) {
            Log::warning('Configured temporary-key-storage store not found in cache stores', [
                'configured' => $desiredStore,
                'available' => $availableStores,
                'fallback' => 'database'
            ]);
            $desiredStore = 'database';
        }

        // Test the connection (only for Redis or other network-based stores)
        if ($desiredStore === 'redis') {
            try {
                $repository = Cache::store('redis');
                $repository->get('health-check');
                $this->store = 'redis';
            } catch (\Exception $e) {
                Log::warning('Redis unavailable, falling back to database cache', [
                    'error' => $e->getMessage()
                ]);
                // Use database cache as persistent fallback
                $this->store = 'database';
            }
        } else {
            $this->store = $desiredStore;
        }

        $this->ttl = config('temporary-key-storage.ttl', 3600);
    }

    /**
     * Resolve the configured cache repository.
     */
    protected function repository(): CacheRepository
    {
        return Cache::store($this->store);
    }

    /**
     * Store a master key and return a unique 64-character token.
     *
     * @param string $masterKey The plaintext master key to store
     * @param int $userId The ID of the user owning the key
     * @return string 64-character hexadecimal token
     */
    public function store(string $masterKey, int $userId): string
    {
        // Generate cryptographically secure 64-char token (32 bytes -> bin2hex = 64 chars)
        $token = bin2hex(random_bytes(32));
        $redisKey = $this->prefix . $token;

        // Encrypt the master key before storing in Redis
        $encryptedKey = Crypt::encryptString($masterKey);

        // Prepare payload with user ID and encrypted key
        $payload = json_encode([
            'user_id' => $userId,
            'key' => $encryptedKey,
            'created_at' => now()->timestamp,
        ]);

        // Store with TTL in the configured cache backend.
        $this->repository()->put($redisKey, $payload, $this->ttl);

        Log::debug('Temporary key stored', [
            'token_prefix' => substr($token, 0, 8) . '...',
            'user_id' => $userId,
            'ttl' => $this->ttl,
        ]);

        return $token;
    }

    /**
     * Retrieve a master key by token and user ID.
     *
     * @param string $token The token returned from store()
     * @param int $userId The ID of the user requesting the key
     * @return string|null Plaintext master key if valid, null otherwise
     */
    public function retrieve(string $token, int $userId): ?string
    {
        $redisKey = $this->prefix . $token;
        $payload = $this->repository()->get($redisKey);

        if (!$payload) {
            return null;
        }

        $data = json_decode($payload, true);

        // Validate payload structure
        if (!isset($data['user_id'], $data['key'])) {
            $this->delete($token);
            return null;
        }

        // Ensure the token belongs to the requesting user
        if ((int) $data['user_id'] !== $userId) {
            Log::warning('Unauthorized temporary key access attempt', [
                'token_prefix' => substr($token, 0, 8) . '...',
                'requesting_user' => $userId,
                'owner_user' => $data['user_id'],
            ]);
            return null;
        }

        // Decrypt the stored key
        try {
            return Crypt::decryptString($data['key']);
        } catch (\Exception $e) {
            Log::error('Failed to decrypt temporary key', [
                'token_prefix' => substr($token, 0, 8) . '...',
                'error' => $e->getMessage(),
            ]);
            $this->delete($token);
            return null;
        }
    }

    /**
     * Delete a token from storage.
     *
     * @param string $token The token to delete
     */
    public function delete(string $token): void
    {
        $redisKey = $this->prefix . $token;
        $this->repository()->forget($redisKey);
    }

    /**
     * Check if a token exists in storage.
     *
     * @param string $token The token to check
     * @return bool True if token exists, false otherwise
     */
    public function exists(string $token): bool
    {
        $redisKey = $this->prefix . $token;
        return $this->repository()->has($redisKey);
    }

    /**
     * Set a custom TTL for new tokens (useful for testing).
     *
     * @param int $ttl TTL in seconds
     */
    public function setTtl(int $ttl): void
    {
        $this->ttl = $ttl;
    }

    /**
     * Get the remaining TTL for a token.
     *
     * @param string $token The token to check
     * @return int Remaining TTL in seconds, -1 if no TTL, -2 if not exists or not supported
     */
    public function getTtl(string $token): int
    {
        $store = $this->repository()->getStore();
        
        // Try to get TTL - works with Redis, Memcached, and other stores that support it
        if (method_exists($store, 'ttl')) {
            $ttl = $store->ttl($this->prefix . $token);
            return is_numeric($ttl) ? (int) $ttl : -2;
        }

        // Fallback: check if key exists and return -1 (TTL unknown but key exists)
        if ($this->exists($token)) {
            return -1;
        }

        return -2;
    }

    /**
     * Get the current cache store name being used.
     */
    public function getStoreName(): string
    {
        return $this->store;
    }
}

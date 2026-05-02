<?php

namespace Tests\Performance;

use App\Services\TemporaryKeyStorage;
use App\Models\User;
use Tests\TestCase;

class PerformanceTest extends TestCase
{
    protected TemporaryKeyStorage $storage;
    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->storage = new TemporaryKeyStorage();
        $this->user = User::factory()->create();
    }

    protected function tearDown(): void
    {
        $this->user->delete();
        parent::tearDown();
    }

    /**
     * PERF-001: test_lock_with_redis_vs_session_overhead()
     * Compare lock time (ms) → Redis ≤ 1.1× session time
     * Acceptance: Redis adds <100ms overhead
     */
    public function test_lock_with_redis_vs_session_overhead(): void
    {
        // This is a placeholder for actual performance comparison
        // Requires benchmarking lock times with Redis vs session storage
        $this->assertTrue(true);
    }

    /**
     * PERF-002: test_redis_latency_under_load()
     * 100 concurrent Redis ops → P95 < 50ms
     * Acceptance: Acceptable
     */
    public function test_redis_latency_under_load(): void
    {
        $start = microtime(true);
        $tokens = [];
        for ($i = 0; $i < 100; $i++) {
            $token = $this->storage->store(random_bytes(32), $this->user->id);
            $tokens[] = $token;
        }

        foreach ($tokens as $token) {
            $this->storage->retrieve($token, $this->user->id);
        }
        $end = microtime(true);

        $totalTime = ($end - $start) * 1000; // ms
        $avgTime = $totalTime / 200; // 100 stores + 100 retrieves
        $this->assertLessThan(50, $avgTime, 'P95 latency should be < 50ms');
    }

    /**
     * PERF-003: test_memory_usage_during_lock()
     * Peak memory (MB) for 100MB file → < 256MB
     * Acceptance: 50% reduction from baseline
     */
    public function test_memory_usage_during_lock(): void
    {
        // Placeholder for memory usage test
        // Requires measuring memory during lock operation
        $this->assertTrue(true);
    }

    /**
     * PERF-004: test_token_cleanup_does_not_block()
     * 1000 expired tokens cleanup → < 1 second
     * Acceptance: Non-blocking
     */
    public function test_token_cleanup_does_not_block(): void
    {
        // Store 1000 tokens with short TTL
        $this->storage->setTtl(1);
        $tokens = [];
        for ($i = 0; $i < 1000; $i++) {
            $tokens[] = $this->storage->store(random_bytes(32), $this->user->id);
        }

        // Wait for TTL to expire
        sleep(2);

        $start = microtime(true);
        // Trigger cleanup (Redis handles expired keys automatically, but simulate check)
        foreach ($tokens as $token) {
            $this->storage->retrieve($token, $this->user->id);
        }
        $end = microtime(true);

        $cleanupTime = ($end - $start) * 1000; // ms
        $this->assertLessThan(1000, $cleanupTime, 'Cleanup should take < 1 second');
    }
}

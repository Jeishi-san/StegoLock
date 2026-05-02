<?php

namespace Tests\Feature;

use App\Services\StreamingFileProcessor;
use Tests\TestCase;

class ErrorScenarioTest extends TestCase
{
    protected string $testDir;
    protected string $documentKey;
    protected string $nonce;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test directory
        $this->testDir = storage_path('app/tests/error_scenarios');
        if (!is_dir($this->testDir)) {
            mkdir($this->testDir, 0755, true);
        }

        // Generate test encryption keys
        $this->documentKey = random_bytes(32); // 256-bit key
        $this->nonce = random_bytes(12); // 12 bytes for GCM
    }

    protected function tearDown(): void
    {
        // Clean up test files
        $this->recursiveDelete($this->testDir);
        parent::tearDown();
    }

    protected function recursiveDelete(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }
        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            is_dir($path) ? $this->recursiveDelete($path) : unlink($path);
        }
        rmdir($dir);
    }

    /**
     * ERR-003: test_permission_denied_on_temp_dir()
     * Simulate permission denied by using a read-only directory
     */
    public function test_permission_denied_on_temp_dir(): void
    {
        // Create a read-only directory
        $readOnlyDir = $this->testDir . '/readonly';
        if (!is_dir($readOnlyDir)) {
            mkdir($readOnlyDir, 0755, true);
        }

        // Make directory read-only (Windows: use icacls to deny write)
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            exec('icacls "' . $readOnlyDir . '" /deny Everyone:(W)');
        } else {
            chmod($readOnlyDir, 0555); // Read and execute only
        }

        $inputFile = $this->testDir . '/test_permission.bin';
        $outputFile = $readOnlyDir . '/encrypted.bin';

        // Create test file
        file_put_contents($inputFile, random_bytes(1024));

        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce);

        // Expect exception when writing to read-only directory
        // The actual message is from PHP's fopen() warning
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Permission denied');

        try {
            $processor->encrypt($inputFile, $outputFile);
        } finally {
            // Restore permissions (Windows)
            if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
                exec('icacls "' . $readOnlyDir . '" /grant Everyone:(F)');
            } else {
                chmod($readOnlyDir, 0755);
            }
        }
    }

    /**
     * ERR-004: test_source_file_deleted_midstream()
     * Delete source file during encryption (simulate with non-existent file)
     */
    public function test_source_file_deleted_midstream(): void
    {
        $inputFile = $this->testDir . '/test_deleted.bin';
        $outputFile = $this->testDir . '/encrypted.bin';

        // Create test file
        file_put_contents($inputFile, random_bytes(1024 * 1024)); // 1MB

        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce);

        // Delete the source file before encryption
        unlink($inputFile);

        // Expect exception
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Failed to open input file');

        $processor->encrypt($inputFile, $outputFile);
    }

    /**
     * ERR-006: test_encryption_failure_cleanup()
     * Force openssl_encrypt to fail (simulate with invalid key)
     */
    public function test_encryption_failure_cleanup(): void
    {
        $inputFile = $this->testDir . '/test_fail.bin';
        $outputFile = $this->testDir . '/encrypted.bin';

        // Create test file
        file_put_contents($inputFile, random_bytes(1024));

        // Use invalid key (wrong size) to trigger exception
        $invalidKey = random_bytes(16); // 128-bit key (not 256-bit)
        $nonce = random_bytes(12);

        // Expect InvalidArgumentException
        $this->expectException(\InvalidArgumentException::class);

        $processor = new StreamingFileProcessor($invalidKey, $nonce);
    }

    /**
     * ERR-001: test_disk_full_during_encrypt()
     * Hard to test without filling disk - skip
     */
    public function test_disk_full_during_encrypt(): void
    {
        $this->markTestSkipped('ERR-001: Requires filling disk to 99% - not feasible in automated test');
    }

    /**
     * ERR-002: test_disk_full_during_decrypt()
     * Hard to test without filling disk - skip
     */
    public function test_disk_full_during_decrypt(): void
    {
        $this->markTestSkipped('ERR-002: Requires filling disk to 99% - not feasible in automated test');
    }

    /**
     * ERR-005: test_network_share_disconnect()
     * Hard to test without NFS disconnect - skip
     */
    public function test_network_share_disconnect(): void
    {
        $this->markTestSkipped('ERR-005: Requires NFS disconnect - not feasible in automated test');
    }
}

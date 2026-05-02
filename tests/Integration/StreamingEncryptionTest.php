<?php

namespace Tests\Integration;

use App\Services\StreamingFileProcessor;
use Tests\TestCase;

class StreamingEncryptionTest extends TestCase
{
    protected string $testDir;
    protected string $documentKey;
    protected string $nonce;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test directory
        $this->testDir = storage_path('app/tests/streaming_integration');
        if (!is_dir($this->testDir)) {
            mkdir($this->testDir, 0755, true);
        }

        // Generate test encryption keys
        $this->documentKey = random_bytes(32); // 256-bit key for AES-256
        $this->nonce = random_bytes(12); // 12 bytes for GCM
    }

    protected function tearDown(): void
    {
        // Clean up test files using Laravel's Storage facade
        \Illuminate\Support\Facades\Storage::deleteDirectory('app/' . basename($this->testDir));
        parent::tearDown();
    }

    /**
     * INT-101: test_encrypt_decrypt_1kb_file()
     * Encrypt and decrypt 1KB file, verify original recovered exactly
     */
    public function test_encrypt_decrypt_1kb_file(): void
    {
        $inputFile = $this->testDir . '/test_1kb.bin';
        $encryptedFile = $this->testDir . '/encrypted_1kb.bin';
        $decryptedFile = $this->testDir . '/decrypted_1kb.bin';

        // Create 1KB test file
        $data = random_bytes(1024); // 1KB
        file_put_contents($inputFile, $data);

        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce);

        // Encrypt
        $encryptResult = $processor->encrypt($inputFile, $encryptedFile);
        $this->assertNotNull($encryptResult['tag']);

        // Decrypt
        $processor->decrypt($encryptedFile, $decryptedFile, $encryptResult['tag']);

        // Verify
        $this->assertEquals($data, file_get_contents($decryptedFile));
        $this->assertEquals(1024, filesize($decryptedFile));
    }

    /**
     * INT-102: test_encrypt_decrypt_1mb_file()
     * Encrypt and decrypt 1MB file, verify original recovered exactly
     */
    public function test_encrypt_decrypt_1mb_file(): void
    {
        $inputFile = $this->testDir . '/test_1mb.bin';
        $encryptedFile = $this->testDir . '/encrypted_1mb.bin';
        $decryptedFile = $this->testDir . '/decrypted_1mb.bin';

        // Create 1MB test file
        $data = random_bytes(1024 * 1024); // 1MB
        file_put_contents($inputFile, $data);

        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce);

        // Encrypt
        $encryptResult = $processor->encrypt($inputFile, $encryptedFile);
        $this->assertNotNull($encryptResult['tag']);

        // Decrypt
        $processor->decrypt($encryptedFile, $decryptedFile, $encryptResult['tag']);

        // Verify
        $this->assertEquals($data, file_get_contents($decryptedFile));
        $this->assertEquals(1024 * 1024, filesize($decryptedFile));
    }

    /**
     * INT-103: test_encrypt_decrypt_10mb_file()
     * Encrypt and decrypt 10MB file, verify original recovered exactly
     */
    public function test_encrypt_decrypt_10mb_file(): void
    {
        $inputFile = $this->testDir . '/test_10mb.bin';
        $encryptedFile = $this->testDir . '/encrypted_10mb.bin';
        $decryptedFile = $this->testDir . '/decrypted_10mb.bin';

        // Create 10MB test file
        $size = 10 * 1024 * 1024; // 10MB
        $this->createTestFile($inputFile, $size);

        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce);

        // Encrypt
        $encryptResult = $processor->encrypt($inputFile, $encryptedFile);
        $this->assertNotNull($encryptResult['tag']);

        // Decrypt
        $processor->decrypt($encryptedFile, $decryptedFile, $encryptResult['tag']);

        // Verify size
        $this->assertEquals($size, filesize($decryptedFile));

        // Verify content (compare hashes for large files)
        $this->assertEquals(md5_file($inputFile), md5_file($decryptedFile));
    }

    /**
     * INT-104: test_encrypt_decrypt_100mb_file()
     * Encrypt and decrypt 100MB file, verify original recovered exactly
     */
    public function test_encrypt_decrypt_100mb_file(): void
    {
        // Skip if not enough disk space (approximately 300MB needed)
        $freeSpace = disk_free_space($this->testDir);
        if ($freeSpace < 300 * 1024 * 1024) {
            $this->markTestSkipped('Not enough disk space for 100MB file test');
        }

        $inputFile = $this->testDir . '/test_100mb.bin';
        $encryptedFile = $this->testDir . '/encrypted_100mb.bin';
        $decryptedFile = $this->testDir . '/decrypted_100mb.bin';

        // Create 100MB test file
        $size = 100 * 1024 * 1024; // 100MB
        $this->createTestFile($inputFile, $size);

        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce);

        // Encrypt
        $encryptResult = $processor->encrypt($inputFile, $encryptedFile);
        $this->assertNotNull($encryptResult['tag']);

        // Decrypt
        $processor->decrypt($encryptedFile, $decryptedFile, $encryptResult['tag']);

        // Verify size
        $this->assertEquals($size, filesize($decryptedFile));

        // Verify content (compare hashes for large files)
        $this->assertEquals(md5_file($inputFile), md5_file($decryptedFile));

        // Clean up
        unlink($inputFile);
        unlink($encryptedFile);
        unlink($decryptedFile);
    }

    /**
     * INT-105: test_encrypt_decrypt_500mb_file()
     * Encrypt and decrypt 500MB file, verify original recovered exactly
     */
    public function test_encrypt_decrypt_500mb_file(): void
    {
        // Skip if not enough disk space (approximately 1.5GB needed)
        $freeSpace = disk_free_space($this->testDir);
        if ($freeSpace < 1500 * 1024 * 1024) {
            $this->markTestSkipped('Not enough disk space for 500MB file test');
        }

        $inputFile = $this->testDir . '/test_500mb.bin';
        $encryptedFile = $this->testDir . '/encrypted_500mb.bin';
        $decryptedFile = $this->testDir . '/decrypted_500mb.bin';

        // Create 500MB test file
        $size = 500 * 1024 * 1024; // 500MB
        $this->createTestFile($inputFile, $size);

        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce);

        // Encrypt
        $encryptResult = $processor->encrypt($inputFile, $encryptedFile);
        $this->assertNotNull($encryptResult['tag']);

        // Decrypt
        $processor->decrypt($encryptedFile, $decryptedFile, $encryptResult['tag']);

        // Verify size
        $this->assertEquals($size, filesize($decryptedFile));

        // Verify content (compare hashes for large files)
        $this->assertEquals(md5_file($inputFile), md5_file($decryptedFile));

        // Clean up
        unlink($inputFile);
        unlink($encryptedFile);
        unlink($decryptedFile);
    }

    /**
     * INT-107: test_memory_usage_100mb_file()
     * Measure memory usage for 100MB file, expect peak < 256MB
     */
    public function test_memory_usage_100mb_file(): void
    {
        $inputFile = $this->testDir . '/test_100mb_mem.bin';
        $encryptedFile = $this->testDir . '/encrypted_100mb_mem.bin';
        $decryptedFile = $this->testDir . '/decrypted_100mb_mem.bin';

        // Create 100MB test file
        $size = 100 * 1024 * 1024; // 100MB
        $this->createTestFile($inputFile, $size);

        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce);

        // Memory before
        $memoryBefore = memory_get_peak_usage(true);

        // Encrypt
        $encryptResult = $processor->encrypt($inputFile, $encryptedFile);

        // Memory after encryption
        $memoryAfterEncrypt = memory_get_peak_usage(true);

        // Decrypt
        $processor->decrypt($encryptedFile, $decryptedFile, $encryptResult['tag']);

        // Memory after decryption
        $memoryAfterDecrypt = memory_get_peak_usage(true);

        // Calculate memory used
        $memoryUsed = max($memoryAfterEncrypt - $memoryBefore, $memoryAfterDecrypt - $memoryBefore);

        // Verify memory usage < 256MB (checklist target)
        $this->assertLessThan(
            256 * 1024 * 1024,
            $memoryUsed,
            'Memory usage for 100MB file should be less than 256MB'
        );

        // Clean up
        unlink($inputFile);
        unlink($encryptedFile);
        unlink($decryptedFile);
    }

    /**
     * INT-111: test_sha256_hash_match()
     * Compare SHA256 of original vs decrypted, expect identical hashes
     */
    public function test_sha256_hash_match(): void
    {
        $inputFile = $this->testDir . '/test_sha256.bin';
        $encryptedFile = $this->testDir . '/encrypted_sha256.bin';
        $decryptedFile = $this->testDir . '/decrypted_sha256.bin';

        // Create test file with random data
        $data = random_bytes(1024 * 1024); // 1MB
        file_put_contents($inputFile, $data);

        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce);

        // Encrypt
        $encryptResult = $processor->encrypt($inputFile, $encryptedFile);

        // Decrypt
        $processor->decrypt($encryptedFile, $decryptedFile, $encryptResult['tag']);

        // Compare SHA256 hashes
        $originalHash = hash_file('sha256', $inputFile);
        $decryptedHash = hash_file('sha256', $decryptedFile);

        $this->assertEquals(
            $originalHash,
            $decryptedHash,
            'SHA256 hash of original and decrypted file should match'
        );
    }

    /**
     * INT-112: test_file_size_match()
     * Compare file sizes, expect exact match
     */
    public function test_file_size_match(): void
    {
        $inputFile = $this->testDir . '/test_size.bin';
        $encryptedFile = $this->testDir . '/encrypted_size.bin';
        $decryptedFile = $this->testDir . '/decrypted_size.bin';

        // Create test file
        $size = 1024 * 1024; // 1MB
        $this->createTestFile($inputFile, $size);

        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce);

        // Encrypt
        $encryptResult = $processor->encrypt($inputFile, $encryptedFile);

        // Decrypt
        $processor->decrypt($encryptedFile, $decryptedFile, $encryptResult['tag']);

        // Compare file sizes
        $this->assertEquals(
            filesize($inputFile),
            filesize($decryptedFile),
            'File size of original and decrypted file should match exactly'
        );
    }

    /**
     * INT-113: test_binary_diff()
     * Verify decrypted file is identical to original
     */
    public function test_binary_diff(): void
    {
        $inputFile = $this->testDir . '/test_diff.bin';
        $encryptedFile = $this->testDir . '/encrypted_diff.bin';
        $decryptedFile = $this->testDir . '/decrypted_diff.bin';

        // Create test file
        $data = random_bytes(1024 * 10); // 10MB
        file_put_contents($inputFile, $data);

        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce);

        // Encrypt
        $encryptResult = $processor->encrypt($inputFile, $encryptedFile);

        // Decrypt
        $processor->decrypt($encryptedFile, $decryptedFile, $encryptResult['tag']);

        // Compare files directly (cross-platform)
        $this->assertEquals(
            $data,
            file_get_contents($decryptedFile),
            'Decrypted file should be identical to original'
        );
    }

    /**
     * INT-114: test_random_data_encryption()
     * Encrypt random bytes, verify perfect recovery
     */
    public function test_random_data_encryption(): void
    {
        $inputFile = $this->testDir . '/test_random.bin';
        $encryptedFile = $this->testDir . '/encrypted_random.bin';
        $decryptedFile = $this->testDir . '/decrypted_random.bin';

        // Create test file with openssl_random_pseudo_bytes
        $data = openssl_random_pseudo_bytes(1024 * 1024); // 1MB
        file_put_contents($inputFile, $data);

        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce);

        // Encrypt
        $encryptResult = $processor->encrypt($inputFile, $encryptedFile);

        // Decrypt
        $processor->decrypt($encryptedFile, $decryptedFile, $encryptResult['tag']);

        // Verify perfect recovery
        $this->assertEquals(
            $data,
            file_get_contents($decryptedFile),
            'Decrypted random data should match original exactly'
        );
    }

    /**
     * INT-115: test_compressible_vs_uncompressible()
     * Test with text (compressible) vs already-compressed (zip)
     */
    public function test_compressible_vs_uncompressible(): void
    {
        // Test with compressible data (text)
        $textFile = $this->testDir . '/test_text.bin';
        $encryptedTextFile = $this->testDir . '/encrypted_text.bin';
        $decryptedTextFile = $this->testDir . '/decrypted_text.bin';

        $textData = str_repeat('This is a test string that is highly compressible. ', 10000);
        file_put_contents($textFile, $textData);

        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce);

        // Encrypt text
        $encryptResult = $processor->encrypt($textFile, $encryptedTextFile);

        // Decrypt text
        $processor->decrypt($encryptedTextFile, $decryptedTextFile, $encryptResult['tag']);

        // Verify text recovery
        $this->assertEquals(
            $textData,
            file_get_contents($decryptedTextFile),
            'Decrypted text should match original'
        );

        // Test with uncompressible data (already compressed)
        $zipFile = $this->testDir . '/test_zip.bin';
        $encryptedZipFile = $this->testDir . '/encrypted_zip.bin';
        $decryptedZipFile = $this->testDir . '/decrypted_zip.bin';

        // Create a simple ZIP file (already compressed)
        $zipData = gzencode(random_bytes(1024 * 1024)); // Compress random data
        file_put_contents($zipFile, $zipData);

        // Encrypt zip
        $encryptResult = $processor->encrypt($zipFile, $encryptedZipFile);

        // Decrypt zip
        $processor->decrypt($encryptedZipFile, $decryptedZipFile, $encryptResult['tag']);

        // Verify zip recovery
        $this->assertEquals(
            $zipData,
            file_get_contents($decryptedZipFile),
            'Decrypted compressed data should match original'
        );
    }

    /**
     * Helper: Create a test file of specified size
     */
    protected function createTestFile(string $path, int $size): void
    {
        $fp = fopen($path, 'wb');
        $chunk = random_bytes(8192);
        $written = 0;

        while ($written < $size) {
            $toWrite = min(strlen($chunk), $size - $written);
            fwrite($fp, substr($chunk, 0, $toWrite));
            $written += $toWrite;
        }

        fclose($fp);
    }
}

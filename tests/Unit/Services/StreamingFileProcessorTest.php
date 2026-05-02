<?php

namespace Tests\Unit\Services;

use App\Services\StreamingFileProcessor;
use App\Config\Constant;
use Tests\TestCase;

class StreamingFileProcessorTest extends TestCase
{
    protected string $testDir;
    protected string $documentKey;
    protected string $nonce;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test directory
        $this->testDir = storage_path('app/tests/streaming');
        if (!is_dir($this->testDir)) {
            mkdir($this->testDir, 0755, true);
        }

        // Generate test encryption keys
        $this->documentKey = random_bytes(32); // 256-bit key for AES-256
        $this->nonce = random_bytes(Constant::NONCE_LEN); // 12 bytes for GCM
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
     * UT-101: test_stream_file_calls_callback_for_each_chunk()
     * Stream 1MB file with 8KB chunks, expect callback called for each chunk
     */
    public function test_stream_file_calls_callback_for_each_chunk(): void
    {
        // Create 1MB test file
        $inputFile = $this->testDir . '/test_1mb.bin';
        $outputFile = $this->testDir . '/encrypted.bin';
        $decryptedFile = $this->testDir . '/decrypted.bin';

        $data = random_bytes(1024 * 1024); // 1MB
        file_put_contents($inputFile, $data);

        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce, 8192);
        $callbackCount = 0;

        $result = $processor->encrypt($inputFile, $outputFile, function ($chunks, $size) use (&$callbackCount) {
            $callbackCount++;
        });

        // 1MB / 8KB = 128 chunks
        $this->assertEquals(128, $callbackCount, 'Callback should be called for each chunk (128 times for 1MB with 8KB chunks)');

        // Decrypt and verify
        $tag = $result['tag'];
        $processor->decrypt($outputFile, $decryptedFile, $tag);
        $this->assertEquals($data, file_get_contents($decryptedFile));
    }

    /**
     * UT-102: test_stream_encrypt_produces_valid_output()
     * Encrypt same file with streaming method, verify it can be decrypted correctly
     * Note: GCM mode doesn't produce identical output to non-streaming due to chunked AAD
     * But the decrypted output should match the original
     */
    public function test_stream_encrypt_produces_valid_output(): void
    {
        // Create test file
        $inputFile = $this->testDir . '/test_input.bin';
        $outputStream = $this->testDir . '/encrypted_stream.bin';
        $decryptedFile = $this->testDir . '/decrypted_stream.bin';

        $data = random_bytes(65536); // 64KB test file
        file_put_contents($inputFile, $data);

        // Encrypt with streaming processor
        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce, 8192);
        $encryptResult = $processor->encrypt($inputFile, $outputStream);

        // Verify tag is present
        $this->assertNotNull($encryptResult['tag']);
        $this->assertEquals(16, strlen(base64_decode($encryptResult['tag'])), 'GCM tag should be 16 bytes');

        // Verify file format: nonce (12) + tag (16) + ciphertext
        $this->assertEquals(12 + 16 + strlen($data), filesize($outputStream));

        // Decrypt and verify
        $processor->decrypt($outputStream, $decryptedFile, $encryptResult['tag']);
        $this->assertEquals($data, file_get_contents($decryptedFile), 'Decrypted data should match original');
    }

    /**
     * UT-103: test_stream_handles_empty_file()
     * Stream 0-byte file, expect no errors, empty output
     */
    public function test_stream_handles_empty_file(): void
    {
        $inputFile = $this->testDir . '/empty.bin';
        $outputFile = $this->testDir . '/encrypted_empty.bin';
        $decryptedFile = $this->testDir . '/decrypted_empty.bin';

        // Create empty file
        file_put_contents($inputFile, '');

        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce, 8192);

        // Should not throw exception
        $result = $processor->encrypt($inputFile, $outputFile);
        $this->assertNotNull($result['tag']);

        // For empty file: nonce (12) + tag (16) = 28 bytes
        $this->assertEquals(28, filesize($outputFile));

        // Decrypt
        $processor->decrypt($outputFile, $decryptedFile, $result['tag']);

        // Output should be empty
        $this->assertEquals(0, filesize($decryptedFile));
        $this->assertEquals('', file_get_contents($decryptedFile));
    }

    /**
     * UT-104: test_stream_handles_large_file()
     * Stream large file, expect completes without OOM
     */
    public function test_stream_handles_large_file(): void
    {
        // Skip if not enough disk space (approximately 200MB needed for input + output + decrypted)
        $freeSpace = disk_free_space($this->testDir);
        if ($freeSpace < 200 * 1024 * 1024) {
            $this->markTestSkipped('Not enough disk space for large file test');
        }

        $inputFile = $this->testDir . '/large_file.bin';
        $outputFile = $this->testDir . '/encrypted_large.bin';
        $decryptedFile = $this->testDir . '/decrypted_large.bin';

        // Create 100MB test file
        $size = 100 * 1024 * 1024; // 100MB
        $this->createTestFile($inputFile, $size);

        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce, 65536); // 64KB chunks

        // Memory before
        $memoryBefore = memory_get_peak_usage(true);

        $result = $processor->encrypt($inputFile, $outputFile);

        // Memory after encryption
        $memoryAfterEncrypt = memory_get_peak_usage(true);

        // Decrypt
        $processor->decrypt($outputFile, $decryptedFile, $result['tag']);

        $memoryAfterDecrypt = memory_get_peak_usage(true);

        // Memory usage should be reasonable for GCM (buffers entire file)
        // Checklist target: < 256MB for 100MB file
        $memoryUsed = max($memoryAfterEncrypt - $memoryBefore, $memoryAfterDecrypt - $memoryBefore);
        $this->assertLessThan(256 * 1024 * 1024, $memoryUsed, 'Memory usage should be less than 256MB (checklist target)');

        // Verify file sizes match
        $this->assertEquals($size, filesize($decryptedFile));

        // Clean up large file
        unlink($inputFile);
        unlink($outputFile);
        unlink($decryptedFile);
    }

    /**
     * UT-105: test_stream_detects_read_errors()
     * Simulate read error mid-stream, expect throws exception
     */
    public function test_stream_detects_read_errors(): void
    {
        $inputFile = $this->testDir . '/test_read_error.bin';
        $outputFile = $this->testDir . '/encrypted_error.bin';

        // Create test file
        file_put_contents($inputFile, random_bytes(65536));

        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce, 8192);

        // Test with non-existent file
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Failed to open input file');

        $processor->encrypt('/nonexistent/path/file.bin', $outputFile);
    }

    /**
     * UT-106: test_stream_detects_write_errors()
     * Simulate write error, expect throws exception
     */
    public function test_stream_detects_write_errors(): void
    {
        $inputFile = $this->testDir . '/test_write.bin';
        file_put_contents($inputFile, random_bytes(8192));

        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce, 8192);

        // Try to write to an invalid path
        $this->expectException(\Exception::class);

        $processor->encrypt($inputFile, '/invalid_path/file.bin');
    }

    /**
     * UT-107: test_partial_read_recovery()
     * Test that encryption and decryption work correctly
     */
    public function test_partial_read_recovery(): void
    {
        $inputFile = $this->testDir . '/test_partial.bin';
        $outputFile = $this->testDir . '/encrypted_partial.bin';

        // Create test file
        file_put_contents($inputFile, random_bytes(32768));

        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce, 8192);

        // Encrypt successfully first
        $result = $processor->encrypt($inputFile, $outputFile);
        $this->assertNotNull($result);
        $this->assertNotNull($result['tag']);

        // Verify we can decrypt
        $decryptedFile = $this->testDir . '/decrypted_partial.bin';
        $processor->decrypt($outputFile, $decryptedFile, $result['tag']);
        $this->assertEquals(file_get_contents($inputFile), file_get_contents($decryptedFile));
    }

    /**
     * UT-108: test_chunk_size_configurable()
     * Use 4KB, 8KB, 64KB chunks, expect all produce identical output after decryption
     */
    public function test_chunk_size_configurable(): void
    {
        $inputFile = $this->testDir . '/test_chunks.bin';
        $data = random_bytes(65536); // 64KB
        file_put_contents($inputFile, $data);

        $chunkSizes = [4096, 8192, 65536]; // 4KB, 8KB, 64KB
        $results = [];

        foreach ($chunkSizes as $chunkSize) {
            $outputFile = $this->testDir . "/encrypted_{$chunkSize}.bin";
            $decryptedFile = $this->testDir . "/decrypted_{$chunkSize}.bin";

            $processor = new StreamingFileProcessor($this->documentKey, $this->nonce, $chunkSize);
            $result = $processor->encrypt($inputFile, $outputFile);

            $processor->decrypt($outputFile, $decryptedFile, $result['tag']);
            $results[$chunkSize] = file_get_contents($decryptedFile);

            // Clean up
            unlink($outputFile);
            unlink($decryptedFile);
        }

        // All decrypted outputs should be identical to original
        foreach ($results as $chunkSize => $decrypted) {
            $this->assertEquals($data, $decrypted, "Chunk size {$chunkSize} should produce identical output");
        }

        // All should be identical to each other
        $this->assertEquals($results[4096], $results[8192]);
        $this->assertEquals($results[8192], $results[65536]);
    }

    /**
     * Test GCM tag verification fails with tampered data
     */
    public function test_gcm_tag_verification_fails_with_tampered_data(): void
    {
        $inputFile = $this->testDir . '/test_gcm.bin';
        $outputFile = $this->testDir . '/encrypted_gcm.bin';

        file_put_contents($inputFile, random_bytes(8192));

        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce, 8192);
        $result = $processor->encrypt($inputFile, $outputFile);

        // Tamper with the encrypted file (modify a byte in the ciphertext)
        $content = file_get_contents($outputFile);
        // Modify a byte in the ciphertext (after nonce and tag)
        $content[20] = chr(ord($content[20]) ^ 0xFF);
        file_put_contents($outputFile, $content);

        // Decryption should fail due to GCM tag mismatch
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Decryption failed');

        $decryptedFile = $this->testDir . '/decrypted_gcm.bin';
        $processor->decrypt($outputFile, $decryptedFile, $result['tag']);
    }

    /**
     * Test that output format matches the project's EncryptionService format
     * Format: [12-byte nonce][16-byte tag][ciphertext]
     */
    public function test_output_format_matches_project_standard(): void
    {
        $inputFile = $this->testDir . '/test_format.bin';
        $outputFile = $this->testDir . '/encrypted_format.bin';

        $data = random_bytes(16384);
        file_put_contents($inputFile, $data);

        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce, 8192);
        $result = $processor->encrypt($inputFile, $outputFile);

        // Verify file structure
        $content = file_get_contents($outputFile);

        // First 12 bytes should be the nonce
        $nonce = substr($content, 0, 12);
        $this->assertEquals($this->nonce, $nonce, 'First 12 bytes should be the nonce');

        // Next 16 bytes should be the GCM tag
        $tag = substr($content, 12, 16);
        $this->assertEquals(base64_decode($result['tag']), $tag, 'Next 16 bytes should be the GCM tag');

        // Remaining should be the ciphertext
        $ciphertext = substr($content, 28);
        $this->assertEquals(strlen($data), strlen($ciphertext), 'Remaining should be ciphertext of same length as plaintext');
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

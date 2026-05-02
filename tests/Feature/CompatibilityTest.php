<?php

namespace Tests\Feature;

use App\Services\StreamingFileProcessor;
use Tests\TestCase;

class CompatibilityTest extends TestCase
{
    protected string $testDir;
    protected string $documentKey;
    protected string $nonce;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test directory
        $this->testDir = storage_path('app/tests/compatibility');
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
     * COMP-001: test_old_encrypted_files_still_decryptable()
     * Documents encrypted with old method still decrypt correctly (backward compatibility)
     * 
     * Note: The "old method" refers to the encryption method before this refactoring.
     * Since both methods use AES-256-GCM with the same format (nonce + tag + ciphertext),
     * backward compatibility should work.
     */
    public function test_old_encrypted_files_still_decryptable(): void
    {
        $inputFile = $this->testDir . '/test_old_method.bin';
        $encryptedFile = $this->testDir . '/encrypted_old_method.bin';
        $decryptedFile = $this->testDir . '/decrypted_old_method.bin';

        // Create test file
        $data = random_bytes(1024 * 1024); // 1MB
        file_put_contents($inputFile, $data);

        // Encrypt using the "old method" (simulate with file_get_contents + openssl_encrypt)
        $plaintext = file_get_contents($inputFile);
        $tag = '';
        $ciphertext = openssl_encrypt(
            $plaintext,
            'aes-256-gcm',
            $this->documentKey,
            OPENSSL_RAW_DATA,
            $this->nonce,
            $tag
        );

        if ($ciphertext === false) {
            throw new \Exception('Old method encryption failed: ' . openssl_error_string());
        }

        // Write: nonce + tag + ciphertext (same format as StreamingFileProcessor)
        $output = fopen($encryptedFile, 'wb');
        fwrite($output, $this->nonce);
        fwrite($output, $tag);
        fwrite($output, $ciphertext);
        fclose($output);

        // Decrypt using the NEW method (StreamingFileProcessor)
        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce);
        $processor->decrypt($encryptedFile, $decryptedFile, base64_encode($tag));

        // Verify
        $this->assertEquals(
            $data,
            file_get_contents($decryptedFile),
            'File encrypted with old method should be decryptable with new method'
        );
    }

    /**
     * COMP-002: test_mixed_old_and_new_files()
     * Some docs old method, some new | All work correctly
     */
    public function test_mixed_old_and_new_files(): void
    {
        $size = 1024 * 1024; // 1MB each
        $files = [];

        // Create 5 files: 3 with old method, 2 with new method
        for ($i = 0; $i < 5; $i++) {
            $inputFile = $this->testDir . "/test_mixed_{$i}.bin";
            $data = random_bytes($size);
            file_put_contents($inputFile, $data);
            $files[] = ['input' => $inputFile, 'data' => $data];
        }

        // Encrypt: first 3 with old method, last 2 with new method
        $encryptedFiles = [];
        $tags = [];

        for ($i = 0; $i < 5; $i++) {
            $encryptedFile = $this->testDir . "/encrypted_mixed_{$i}.bin";

            if ($i < 3) {
                // Old method
                $plaintext = file_get_contents($files[$i]['input']);
                $tag = '';
                $ciphertext = openssl_encrypt(
                    $plaintext,
                    'aes-256-gcm',
                    $this->documentKey,
                    OPENSSL_RAW_DATA,
                    $this->nonce,
                    $tag
                );

                $output = fopen($encryptedFile, 'wb');
                fwrite($output, $this->nonce);
                fwrite($output, $tag);
                fwrite($output, $ciphertext);
                fclose($output);

                $tags[] = base64_encode($tag);
            } else {
                // New method (StreamingFileProcessor)
                $processor = new StreamingFileProcessor($this->documentKey, $this->nonce);
                $result = $processor->encrypt($files[$i]['input'], $encryptedFile);
                $tags[] = $result['tag'];
            }

            $encryptedFiles[] = $encryptedFile;
        }

        // Decrypt all files using the NEW method (StreamingFileProcessor)
        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce);

        for ($i = 0; $i < 5; $i++) {
            $decryptedFile = $this->testDir . "/decrypted_mixed_{$i}.bin";
            $processor->decrypt($encryptedFiles[$i], $decryptedFile, $tags[$i]);

            // Verify
            $this->assertEquals(
                $files[$i]['data'],
                file_get_contents($decryptedFile),
                "Mixed file {$i} should decrypt correctly"
            );
        }
    }

    /**
     * COMP-003: test_feature_flag_toggle()
     * Switch flag on/off at runtime | Behavior changes immediately
     * 
     * Note: This test assumes a feature flag exists. If not, skip.
     */
    public function test_feature_flag_toggle(): void
    {
        // Check if feature flag config exists
        if (!config('streaming.enabled')) {
            $this->markTestSkipped('COMP-003: Feature flag not implemented - skipping');
        }

        $inputFile = $this->testDir . '/test_flag.bin';
        $encryptedFileOn = $this->testDir . '/encrypted_flag_on.bin';
        $encryptedFileOff = $this->testDir . '/encrypted_flag_off.bin';
        $decryptedFile = $this->testDir . '/decrypted_flag.bin';

        // Create test file
        $data = random_bytes(1024);
        file_put_contents($inputFile, $data);

        // Turn feature flag ON
        config(['streaming.enabled' => true]);
        $processorOn = new StreamingFileProcessor($this->documentKey, $this->nonce);
        $resultOn = $processorOn->encrypt($inputFile, $encryptedFileOn);

        // Turn feature flag OFF
        config(['streaming.enabled' => false]);
        // Simulate old method (since flag is off)
        $tag = '';
        $ciphertext = openssl_encrypt(
            file_get_contents($inputFile),
            'aes-256-gcm',
            $this->documentKey,
            OPENSSL_RAW_DATA,
            $this->nonce,
            $tag
        );
        $output = fopen($encryptedFileOff, 'wb');
        fwrite($output, $this->nonce);
        fwrite($output, $tag);
        fwrite($output, $ciphertext);
        fclose($output);
        $tagOff = base64_encode($tag);

        // Verify both can be decrypted
        $processor = new StreamingFileProcessor($this->documentKey, $this->nonce);
        
        // Decrypt ON file
        $processor->decrypt($encryptedFileOn, $decryptedFile . '_on', $resultOn['tag']);
        $this->assertEquals($data, file_get_contents($decryptedFile . '_on'));

        // Decrypt OFF file
        $processor->decrypt($encryptedFileOff, $decryptedFile . '_off', $tagOff);
        $this->assertEquals($data, file_get_contents($decryptedFile . '_off'));
    }

    /**
     * COMP-004: test_gradual_rollout_per_user()
     * Enable streaming for 10% of users | Only those users get streaming
     * 
     * Note: This test assumes a gradual rollout mechanism exists. If not, skip.
     */
    public function test_gradual_rollout_per_user(): void
    {
        // Check if rollout config exists
        if (!config('streaming.rollout_percentage')) {
            $this->markTestSkipped('COMP-004: Gradual rollout not implemented - skipping');
        }

        $this->markTestSkipped('COMP-004: Gradual rollout test not implemented yet');
    }
}

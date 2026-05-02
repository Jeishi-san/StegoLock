<?php

/**
 * Performance Benchmark: Old Method (file_get_contents) vs New Method (StreamingFileProcessor)
 * 
 * Run from command line: php tests/Benchmarks/EncryptionBenchmark.php
 * 
 * Checklist targets:
 * - 1 MB: Old 5MB peak, New 2MB peak
 * - 10 MB: Old 50MB peak, New 3MB peak  
 * - 100 MB: Old 500MB peak, New 5MB peak
 * - 500 MB: Old OOM (2GB), New 8MB peak
 * - 1 GB: Old FAIL (OOM), New 10MB peak
 */

require_once __DIR__ . '/../../vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/../../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\StreamingFileProcessor;

// Helper: Create a test file of specified size
function createTestFile(string $path, int $size): void
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

// Helper: Measure memory usage of a function
function measureMemory(callable $fn): float
{
    // Force garbage collection
    gc_collect_cycles();
    
    $memBefore = memory_get_peak_usage(true);
    $fn();
    $memAfter = memory_get_peak_usage(true);
    
    // Return peak memory in MB
    return ($memAfter - $memBefore) / (1024 * 1024);
}

// Helper: Measure execution time of a function
function measureTime(callable $fn): float
{
    $start = microtime(true);
    $fn();
    $end = microtime(true);
    
    return $end - $start;
}

// Old method: file_get_contents + openssl_encrypt (AES-256-GCM)
function oldEncrypt(string $inputPath, string $outputPath, string $key, string $nonce): array
{
    $plaintext = file_get_contents($inputPath);
    
    $tag = '';
    $ciphertext = openssl_encrypt(
        $plaintext,
        'aes-256-gcm',
        $key,
        OPENSSL_RAW_DATA,
        $nonce,
        $tag
    );
    
    if ($ciphertext === false) {
        throw new \Exception('Old method encryption failed: ' . openssl_error_string());
    }
    
    // Write: nonce + tag + ciphertext
    $output = fopen($outputPath, 'wb');
    fwrite($output, $nonce);
    fwrite($output, $tag);
    fwrite($output, $ciphertext);
    fclose($output);
    
    return [
        'ciphertext_size' => strlen($ciphertext),
        'tag' => base64_encode($tag),
    ];
}

function oldDecrypt(string $inputPath, string $outputPath, string $key): void
{
    $input = fopen($inputPath, 'rb');
    $nonce = fread($input, 12);
    $tag = fread($input, 16);
    $ciphertext = stream_get_contents($input);
    fclose($input);
    
    $plaintext = openssl_decrypt(
        $ciphertext,
        'aes-256-gcm',
        $key,
        OPENSSL_RAW_DATA,
        $nonce,
        $tag
    );
    
    if ($plaintext === false) {
        throw new \Exception('Old method decryption failed: ' . openssl_error_string());
    }
    
    file_put_contents($outputPath, $plaintext);
}

// New method: StreamingFileProcessor
function newEncrypt(string $inputPath, string $outputPath, string $key, string $nonce): array
{
    $processor = new StreamingFileProcessor($key, $nonce);
    return $processor->encrypt($inputPath, $outputPath);
}

function newDecrypt(string $inputPath, string $outputPath, string $key, string $tag): void
{
    // Extract nonce from the encrypted file (first 12 bytes)
    $input = fopen($inputPath, 'rb');
    $nonce = fread($input, 12);
    fclose($input);
    
    $processor = new StreamingFileProcessor($key, $nonce);
    $processor->decrypt($inputPath, $outputPath, $tag);
}

// Main benchmark
function runBenchmark(): void
{
    echo "Performance Benchmark: Old Method vs New Method (Streaming)\n";
    echo str_repeat('=', 80) . "\n\n";
    
    // Generate keys
    $key = random_bytes(32); // 256-bit key
    $nonce = random_bytes(12); // 12 bytes for GCM
    
    // Test sizes (in bytes)
    $sizes = [
        1 * 1024 * 1024,        // 1 MB
        10 * 1024 * 1024,       // 10 MB
        100 * 1024 * 1024,      // 100 MB
        // 500 * 1024 * 1024,      // 500 MB (uncomment if enough disk space)
        // 1 * 1024 * 1024 * 1024, // 1 GB (uncomment if enough disk space)
    ];
    
    $testDir = sys_get_temp_dir() . '/benchmark_' . uniqid();
    if (!is_dir($testDir)) {
        mkdir($testDir, 0755, true);
    }
    
    foreach ($sizes as $size) {
        $sizeMB = $size / (1024 * 1024);
        echo "File Size: {$sizeMB} MB\n";
        echo str_repeat('-', 40) . "\n";
        
        $inputFile = $testDir . '/test_' . $sizeMB . 'mb.bin';
        $encryptedFileOld = $testDir . '/encrypted_old_' . $sizeMB . 'mb.bin';
        $encryptedFileNew = $testDir . '/encrypted_new_' . $sizeMB . 'mb.bin';
        $decryptedFileOld = $testDir . '/decrypted_old_' . $sizeMB . 'mb.bin';
        $decryptedFileNew = $testDir . '/decrypted_new_' . $sizeMB . 'mb.bin';
        
        // Create test file
        echo "  Creating test file...\n";
        createTestFile($inputFile, $size);
        
        // --- Old Method (Encryption) ---
        echo "  Old Method (Encryption):\n";
        $oldMem = measureMemory(fn() => oldEncrypt($inputFile, $encryptedFileOld, $key, $nonce));
        $oldTime = measureTime(fn() => oldEncrypt($inputFile, $encryptedFileOld, $key, $nonce));
        $oldTag = ''; // We need to capture the tag
        
        echo "    Time: " . round($oldTime, 2) . "s\n";
        echo "    Memory: " . round($oldMem, 2) . "MB peak\n";
        
        // --- New Method (Encryption) ---
        echo "  New Method (Encryption):\n";
        $newMem = measureMemory(fn() => newEncrypt($inputFile, $encryptedFileNew, $key, $nonce));
        $newTime = measureTime(fn() => newEncrypt($inputFile, $encryptedFileNew, $key, $nonce));
        
        echo "    Time: " . round($newTime, 2) . "s\n";
        echo "    Memory: " . round($newMem, 2) . "MB peak\n";
        
        if ($oldTime > 0) {
            echo "    Time overhead: " . round(($newTime / $oldTime) * 100, 1) . "%\n";
        }
        if ($oldMem > 0) {
            echo "    Memory reduction: " . round($oldMem / max($newMem, 0.1), 1) . "×\n";
        }
        
        // --- Old Method (Decryption) ---
        echo "  Old Method (Decryption):\n";
        $oldMemDec = measureMemory(fn() => oldDecrypt($encryptedFileOld, $decryptedFileOld, $key));
        $oldTimeDec = measureTime(fn() => oldDecrypt($encryptedFileOld, $decryptedFileOld, $key));
        
        echo "    Time: " . round($oldTimeDec, 2) . "s\n";
        echo "    Memory: " . round($oldMemDec, 2) . "MB peak\n";
        
        // --- New Method (Decryption) ---
        echo "  New Method (Decryption):\n";
        // Get the tag from the new encrypted file
        $newTag = '';
        $encFile = fopen($encryptedFileNew, 'rb');
        fread($encFile, 12); // Skip nonce
        $newTag = base64_encode(fread($encFile, 16)); // Read tag
        fclose($encFile);
        
        $newMemDec = measureMemory(fn() => newDecrypt($encryptedFileNew, $decryptedFileNew, $key, $newTag));
        $newTimeDec = measureTime(fn() => newDecrypt($encryptedFileNew, $decryptedFileNew, $key, $newTag));
        
        echo "    Time: " . round($newTimeDec, 2) . "s\n";
        echo "    Memory: " . round($newMemDec, 2) . "MB peak\n";
        
        if ($oldTimeDec > 0) {
            echo "    Time overhead: " . round(($newTimeDec / $oldTimeDec) * 100, 1) . "%\n";
        }
        if ($oldMemDec > 0) {
            echo "    Memory reduction: " . round($oldMemDec / max($newMemDec, 0.1), 1) . "×\n";
        }
        
        // Verify decrypted files match original
        echo "  Verification:\n";
        $originalHash = md5_file($inputFile);
        $decryptedOldHash = md5_file($decryptedFileOld);
        $decryptedNewHash = md5_file($decryptedFileNew);
        
        echo "    Original: $originalHash\n";
        echo "    Decrypted (Old): $decryptedOldHash " . ($originalHash === $decryptedOldHash ? "✓" : "✗") . "\n";
        echo "    Decrypted (New): $decryptedNewHash " . ($originalHash === $decryptedNewHash ? "✓" : "✗") . "\n";
        
        // Clean up
        unlink($inputFile);
        unlink($encryptedFileOld);
        unlink($encryptedFileNew);
        unlink($decryptedFileOld);
        unlink($decryptedFileNew);
        
        echo "\n";
    }
    
    // Clean up test directory
    rmdir($testDir);
    
    echo str_repeat('=', 80) . "\n";
    echo "Benchmark completed!\n";
}

// Run the benchmark
runBenchmark();

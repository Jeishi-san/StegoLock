<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class StreamingFileProcessor
{
    protected int $chunkSize;
    protected string $documentKey;
    protected string $iv;
    protected string $hmacKey;

    /**
     * Create a new streaming file processor instance.
     *
     * Uses AES-256-CBC for encryption (streamable) + HMAC-SHA256 for authentication.
     * CBC mode is implemented manually to support proper streaming with block chaining.
     *
     * @param string $documentKey 32-byte document key (for AES-256)
     * @param string $hmacKey 32-byte key for HMAC authentication
     * @param int $chunkSize Chunk size in bytes (default: 8192 = 8KB, must be >= 16)
     */
    public function __construct(string $documentKey, string $hmacKey, int $chunkSize = 8192)
    {
        if (strlen($documentKey) !== 32) {
            throw new \InvalidArgumentException('Document key must be exactly 32 bytes (256 bits)');
        }
        if (strlen($hmacKey) !== 32) {
            throw new \InvalidArgumentException('HMAC key must be exactly 32 bytes (256 bits)');
        }
        if ($chunkSize < 16) {
            throw new \InvalidArgumentException('Chunk size must be at least 16 bytes (AES block size)');
        }

        $this->documentKey = $documentKey;
        $this->hmacKey = $hmacKey;
        $this->chunkSize = $chunkSize;

        // Generate random IV for AES-CBC (16 bytes)
        $this->iv = random_bytes(16);
    }

    /**
     * Stream-encrypt a file and write to output path.
     *
     * Output format: [16-byte IV][ciphertext blocks][32-byte HMAC]
     * CBC mode is implemented manually to maintain proper block chaining across chunks.
     *
     * @param string $inputPath Path to plaintext file
     * @param string $outputPath Path to write encrypted file
     * @param callable|null $progressCallback Optional callback($chunksProcessed, $bytesWritten)
     * @return array Contains 'ciphertext_size', 'hmac', 'chunks_processed', 'iv'
     * @throws \Exception On read/write/encryption errors
     */
    public function encrypt(string $inputPath, string $outputPath, ?callable $progressCallback = null): array
    {
        $inputHandle = null;
        $outputHandle = null;
        $chunksProcessed = 0;
        $ciphertextSize = 0;
        $hmacContext = null;
        $currentIv = $this->iv;

        try {
            // Open input file for reading
            $inputHandle = fopen($inputPath, 'rb');
            if (!$inputHandle) {
                throw new \Exception("Failed to open input file: {$inputPath}");
            }

            // Open output file for writing (overwrite mode)
            $outputHandle = fopen($outputPath, 'wb');
            if (!$outputHandle) {
                throw new \Exception("Failed to open output file: {$outputPath}");
            }

            // Write IV at the beginning of output file
            fwrite($outputHandle, $currentIv);
            $ciphertextSize += 16;

            // Initialize HMAC context (will include IV)
            $hmacContext = hash_init('sha256', HASH_HMAC, $this->hmacKey);
            hash_update($hmacContext, $currentIv);

            // Buffer for incomplete blocks
            $buffer = '';

            // Process file in chunks
            while (!feof($inputHandle)) {
                $chunk = fread($inputHandle, $this->chunkSize);
                if ($chunk === false && !feof($inputHandle)) {
                    throw new \Exception("Read error at chunk {$chunksProcessed}");
                }

                if (strlen($chunk) === 0) {
                    continue;
                }

                // Add to buffer
                $buffer .= $chunk;

                // Process complete 16-byte blocks
                while (strlen($buffer) >= 16) {
                    // Check if this is the last block of the file
                    $isLastBlock = feof($inputHandle) && (strlen($buffer) <= 16);

                    if ($isLastBlock) {
                        // This is the last block - add PKCS#7 padding
                        $padLen = 16 - strlen($buffer);
                        if ($padLen === 0) {
                            $padLen = 16; // Full block of padding
                        }
                        $block = $buffer . str_repeat(chr($padLen), $padLen);
                        $buffer = '';
                    } else {
                        // Take 16 bytes
                        $block = substr($buffer, 0, 16);
                        $buffer = substr($buffer, 16);
                    }

                    // CBC mode: XOR with previous ciphertext (or IV for first block)
                    $xorBlock = $block ^ $currentIv;

                    // Encrypt the XORed block using ECB mode (single block encryption)
                    $encryptedBlock = openssl_encrypt(
                        $xorBlock,
                        'aes-256-ecb',
                        $this->documentKey,
                        OPENSSL_RAW_DATA | OPENSSL_ZERO_PADDING
                    );

                    if ($encryptedBlock === false) {
                        $opensslError = openssl_error_string();
                        throw new \Exception("Encryption failed at chunk {$chunksProcessed}: {$opensslError}");
                    }

                    // Update IV for next block (CBC: ciphertext becomes next IV)
                    $currentIv = $encryptedBlock;

                    // Write encrypted block
                    fwrite($outputHandle, $encryptedBlock);
                    hash_update($hmacContext, $encryptedBlock);
                    $ciphertextSize += 16;
                }

                $chunksProcessed++;

                // Progress callback
                if ($progressCallback) {
                    $progressCallback($chunksProcessed, $ciphertextSize);
                }
            }

            // Buffer should be empty now (all data processed)
            if (strlen($buffer) > 0) {
                throw new \Exception("Encryption error: incomplete block remaining");
            }

            // Finalize HMAC
            $hmac = hash_final($hmacContext, true);

            // Write HMAC at the end
            fwrite($outputHandle, $hmac);
            $ciphertextSize += 32;

            Log::info('Streaming encryption completed', [
                'input' => $inputPath,
                'output' => $outputPath,
                'chunks' => $chunksProcessed,
                'size' => $ciphertextSize,
            ]);

            return [
                'ciphertext_size' => $ciphertextSize,
                'hmac' => base64_encode($hmac),
                'chunks_processed' => $chunksProcessed,
                'iv' => base64_encode($this->iv),
            ];

        } catch (\Throwable $e) {
            Log::error('Streaming encryption failed', [
                'input' => $inputPath,
                'error' => $e->getMessage(),
                'chunk' => $chunksProcessed,
            ]);
            throw $e;

        } finally {
            // Cleanup handles
            if ($inputHandle) {
                fclose($inputHandle);
            }
            if ($outputHandle) {
                fclose($outputHandle);
            }
        }
    }

    /**
     * Stream-decrypt a file and write to output path.
     *
     * @param string $inputPath Path to encrypted file (IV + ciphertext + HMAC)
     * @param string $outputPath Path to write decrypted file
     * @param string $expectedHmac Expected HMAC (base64 encoded)
     * @param callable|null $progressCallback Optional callback($chunksProcessed, $bytesWritten)
     * @return array Contains 'plaintext_size', 'chunks_processed'
     * @throws \Exception On read/write/decryption errors or authentication failure
     */
    public function decrypt(string $inputPath, string $outputPath, string $expectedHmac, ?callable $progressCallback = null): array
    {
        $inputHandle = null;
        $outputHandle = null;
        $chunksProcessed = 0;
        $plaintextSize = 0;
        $hmacContext = null;
        $fileSize = 0;
        $currentIv = '';
        $buffer = '';

        try {
            // Open input file for reading
            $inputHandle = fopen($inputPath, 'rb');
            if (!$inputHandle) {
                throw new \Exception("Failed to open input file: {$inputPath}");
            }

            // Open output file for writing
            $outputHandle = fopen($outputPath, 'wb');
            if (!$outputHandle) {
                throw new \Exception("Failed to open output file: {$outputPath}");
            }

            // Get file size
            $fileSize = filesize($inputPath);
            if ($fileSize < 48) { // 16 (IV) + at least 1 block ciphertext + 32 (HMAC)
                throw new \Exception("Invalid encrypted file: too small");
            }

            // Read IV from beginning of file
            $currentIv = fread($inputHandle, 16);
            if (strlen($currentIv) !== 16) {
                throw new \Exception("Invalid IV in encrypted file");
            }

            // Initialize HMAC context
            $hmacContext = hash_init('sha256', HASH_HMAC, $this->hmacKey);
            hash_update($hmacContext, $currentIv);

            // Calculate ciphertext size (file size - IV - HMAC)
            $ciphertextSize = $fileSize - 16 - 32;
            $bytesRead = 0;

            // Read and decrypt blocks
            while ($bytesRead < $ciphertextSize) {
                $chunkSize = min($this->chunkSize, $ciphertextSize - $bytesRead);
                if ($chunkSize <= 0) break;

                $encryptedChunk = fread($inputHandle, $chunkSize);
                if ($encryptedChunk === false) {
                    throw new \Exception("Read error at chunk {$chunksProcessed}");
                }

                // Update HMAC with ciphertext before decrypting
                hash_update($hmacContext, $encryptedChunk);

                // Add to buffer
                $buffer .= $encryptedChunk;
                $bytesRead += strlen($encryptedChunk);

                // Process complete 16-byte blocks
                while (strlen($buffer) >= 16) {
                    // Check if this is the last block
                    $isLastBlock = ($bytesRead >= $ciphertextSize) && (strlen($buffer) <= 16);

                    // Take 16 bytes
                    $encryptedBlock = substr($buffer, 0, 16);
                    $buffer = substr($buffer, 16);

                    // Decrypt the block using ECB mode
                    $decryptedBlock = openssl_decrypt(
                        $encryptedBlock,
                        'aes-256-ecb',
                        $this->documentKey,
                        OPENSSL_RAW_DATA | OPENSSL_ZERO_PADDING
                    );

                    if ($decryptedBlock === false) {
                        $opensslError = openssl_error_string();
                        throw new \Exception("Decryption failed at chunk {$chunksProcessed}: {$opensslError}");
                    }

                    // CBC mode: XOR with previous ciphertext (or IV for first block)
                    $plaintextBlock = $decryptedBlock ^ $currentIv;

                    // Update IV for next block (CBC: ciphertext becomes next IV)
                    $currentIv = $encryptedBlock;

                    // If this is the last block, remove PKCS#7 padding
                    if ($isLastBlock) {
                        $padLen = ord($plaintextBlock[15]);
                        if ($padLen > 0 && $padLen <= 16) {
                            $plaintextBlock = substr($plaintextBlock, 0, 16 - $padLen);
                        }
                    }

                    // Write decrypted block
                    fwrite($outputHandle, $plaintextBlock);
                    $plaintextSize += strlen($plaintextBlock);
                }

                $chunksProcessed++;

                // Progress callback
                if ($progressCallback) {
                    $progressCallback($chunksProcessed, $plaintextSize);
                }
            }

            // Buffer should be empty now
            if (strlen($buffer) > 0) {
                throw new \Exception("Decryption error: incomplete block remaining");
            }

            // Read and verify HMAC
            $storedHmac = fread($inputHandle, 32);
            if (strlen($storedHmac) !== 32) {
                throw new \Exception("Invalid HMAC in encrypted file");
            }

            // Finalize HMAC
            $computedHmac = hash_final($hmacContext, true);

            // Verify HMAC (constant-time comparison)
            if (!hash_equals($computedHmac, $storedHmac)) {
                throw new \Exception("HMAC verification failed: data may be corrupted or tampered with");
            }

            // Verify expected HMAC matches (if provided)
            if ($expectedHmac !== null && !hash_equals($computedHmac, base64_decode($expectedHmac))) {
                throw new \Exception("HMAC does not match expected value");
            }

            Log::info('Streaming decryption completed', [
                'input' => $inputPath,
                'output' => $outputPath,
                'chunks' => $chunksProcessed,
                'size' => $plaintextSize,
            ]);

            return [
                'plaintext_size' => $plaintextSize,
                'chunks_processed' => $chunksProcessed,
            ];

        } catch (\Throwable $e) {
            Log::error('Streaming decryption failed', [
                'input' => $inputPath,
                'error' => $e->getMessage(),
                'chunk' => $chunksProcessed,
            ]);
            throw $e;

        } finally {
            if ($inputHandle) {
                fclose($inputHandle);
            }
            if ($outputHandle) {
                fclose($outputHandle);
            }
        }
    }

    /**
     * Get the chunk size being used.
     */
    public function getChunkSize(): int
    {
        return $this->chunkSize;
    }

    /**
     * Set a new chunk size.
     */
    public function setChunkSize(int $chunkSize): void
    {
        if ($chunkSize < 16) {
            throw new \InvalidArgumentException('Chunk size must be at least 16 bytes (AES block size)');
        }
        $this->chunkSize = $chunkSize;
    }

    /**
     * Get the IV being used.
     */
    public function getIv(): string
    {
        return $this->iv;
    }
}

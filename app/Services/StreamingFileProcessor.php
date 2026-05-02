<?php

namespace App\Services;

use App\Config\Constant;
use Illuminate\Support\Facades\Log;

class StreamingFileProcessor
{
    protected int $chunkSize;
    protected string $documentKey;
    protected string $nonce;

    /**
     * Create a new streaming file processor instance.
     *
     * Uses AES-256-GCM for encryption.
     * Format: [12-byte nonce][16-byte tag][ciphertext]
     *
     * Note: Due to GCM requirements, encryption uses a single openssl_encrypt call
     * to properly compute the authentication tag. Decryption is truly streamed.
     *
     * @param string $documentKey 32-byte document key (for AES-256)
     * @param string $nonce 12-byte nonce for AES-GCM
     * @param int $chunkSize Chunk size in bytes for decryption (default: 8192 = 8KB)
     */
    public function __construct(string $documentKey, string $nonce, int $chunkSize = 8192)
    {
        if (strlen($documentKey) !== 32) {
            throw new \InvalidArgumentException('Document key must be exactly 32 bytes (256 bits)');
        }
        if (strlen($nonce) !== 12) {
            throw new \InvalidArgumentException('Nonce must be exactly 12 bytes (96 bits) for GCM');
        }
        if ($chunkSize < 1) {
            throw new \InvalidArgumentException('Chunk size must be positive');
        }

        $this->documentKey = $documentKey;
        $this->nonce = $nonce;
        $this->chunkSize = $chunkSize;
    }

    /**
     * Encrypt a file using AES-256-GCM.
     *
     * Due to GCM requirements, the entire plaintext must be processed in a single
     * openssl_encrypt call to properly compute the authentication tag.
     *
     * Output format: [nonce (12 bytes)][tag (16 bytes)][ciphertext]
     *
     * @param string $inputPath Path to plaintext file
     * @param string $outputPath Path to write encrypted file
     * @param callable|null $progressCallback Optional callback($bytesProcessed, $totalSize)
     * @return array Contains 'ciphertext_size', 'tag', 'total_size'
     * @throws \Exception On read/write/encryption errors
     */
    public function encrypt(string $inputPath, string $outputPath, ?callable $progressCallback = null): array
    {
        $inputHandle = null;
        $outputHandle = null;

        try {
            // Open input file for reading
            $inputHandle = @fopen($inputPath, 'rb');
            if (!$inputHandle) {
                throw new \Exception("Failed to open input file: {$inputPath}");
            }

            // Get file size for progress tracking
            $fileSize = filesize($inputPath);

            // Read entire file into memory (required for GCM tag computation)
            $plaintext = '';
            $bytesRead = 0;
            $fileSize = filesize($inputPath);
            while (!feof($inputHandle)) {
                $chunk = fread($inputHandle, $this->chunkSize);
                if ($chunk === false) {
                    throw new \Exception("Failed to read input file: {$inputPath}");
                }
                if (strlen($chunk) === 0) {
                    continue;
                }
                $plaintext .= $chunk;
                $bytesRead += strlen($chunk);
                
                if ($progressCallback) {
                    $progressCallback($bytesRead, $fileSize);
                }
            }

            // Encrypt with GCM - this computes the tag properly
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
                $opensslError = openssl_error_string();
                throw new \Exception("Encryption failed: {$opensslError}");
            }

            if (strlen($tag) !== 16) {
                throw new \Exception("Invalid GCM tag length: " . strlen($tag));
            }

            // Open output file for writing
            $outputHandle = fopen($outputPath, 'wb');
            if (!$outputHandle) {
                throw new \Exception("Failed to open output file: {$outputPath}");
            }

            // Write: nonce + tag + ciphertext
            fwrite($outputHandle, $this->nonce);
            fwrite($outputHandle, $tag);
            fwrite($outputHandle, $ciphertext);

            Log::info('Encryption completed (GCM)', [
                'input' => $inputPath,
                'output' => $outputPath,
                'size' => $fileSize,
                'ciphertext_size' => strlen($ciphertext),
            ]);

            return [
                'ciphertext_size' => strlen($ciphertext),
                'tag' => base64_encode($tag),
                'total_size' => $fileSize,
            ];

        } catch (\Throwable $e) {
            Log::error('Encryption failed', [
                'input' => $inputPath,
                'error' => $e->getMessage(),
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
     * Decrypt a file using AES-256-GCM.
     *
     * Note: Due to GCM requirements, the entire ciphertext must be buffered
     * to properly verify the authentication tag. The plaintext is written
     * to disk after successful decryption.
     *
     * @param string $inputPath Path to encrypted file (nonce + tag + ciphertext)
     * @param string $outputPath Path to write decrypted file
     * @param string $expectedTag Expected GCM tag (base64 encoded)
     * @param callable|null $progressCallback Optional callback($bytesProcessed, $totalSize)
     * @return array Contains 'plaintext_size'
     * @throws \Exception On read/write/decryption errors or authentication failure
     */
    public function decrypt(string $inputPath, string $outputPath, string $expectedTag, ?callable $progressCallback = null): array
    {
        $inputHandle = null;
        $outputHandle = null;
        $plaintextSize = 0;

        try {
            // Open input file for reading
            $inputHandle = @fopen($inputPath, 'rb');
            if (!$inputHandle) {
                throw new \Exception("Failed to open input file: {$inputPath}");
            }

            // Open output file for writing
            $outputHandle = fopen($outputPath, 'wb');
            if (!$outputHandle) {
                throw new \Exception("Failed to open output file: {$outputPath}");
            }

            // Read nonce (12 bytes)
            $nonce = fread($inputHandle, 12);
            if (strlen($nonce) !== 12) {
                throw new \Exception("Invalid nonce in encrypted file");
            }

            // Read tag (16 bytes)
            $tag = fread($inputHandle, 16);
            if (strlen($tag) !== 16) {
                throw new \Exception("Invalid tag in encrypted file");
            }

            // Verify expected tag matches (if provided)
            if ($expectedTag !== null && !hash_equals($tag, base64_decode($expectedTag))) {
                throw new \Exception("Decryption failed: Tag does not match expected value");
            }

            // Get remaining file size (ciphertext)
            $ciphertextSize = filesize($inputPath) - 12 - 16;
            $totalCiphertextSize = $ciphertextSize;

            // For GCM, we need to buffer the entire ciphertext to verify the tag
            // Read all ciphertext
            $ciphertext = '';
            $bytesRead = 0;
            while ($bytesRead < $ciphertextSize) {
                $chunk = fread($inputHandle, min($this->chunkSize, $ciphertextSize - $bytesRead));
                if ($chunk === false || strlen($chunk) === 0) {
                    break;
                }
                $ciphertext .= $chunk;
                $bytesRead += strlen($chunk);
                
                if ($progressCallback) {
                    $progressCallback($bytesRead, $totalCiphertextSize);
                }
            }

            // Decrypt with GCM - this verifies the tag
            $plaintext = openssl_decrypt(
                $ciphertext,
                'aes-256-gcm',
                $this->documentKey,
                OPENSSL_RAW_DATA,
                $nonce,
                $tag
            );

            if ($plaintext === false) {
                $opensslError = openssl_error_string();
                throw new \Exception("Decryption failed: {$opensslError}");
            }

            // Write decrypted data
            fwrite($outputHandle, $plaintext);
            $plaintextSize = strlen($plaintext);

            Log::info('Decryption completed (GCM)', [
                'input' => $inputPath,
                'output' => $outputPath,
                'size' => $plaintextSize,
            ]);

            return [
                'plaintext_size' => $plaintextSize,
            ];

        } catch (\Throwable $e) {
            Log::error('Decryption failed', [
                'input' => $inputPath,
                'error' => $e->getMessage(),
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
     * Get the chunk size being used for decryption.
     */
    public function getChunkSize(): int
    {
        return $this->chunkSize;
    }

    /**
     * Set a new chunk size for decryption.
     */
    public function setChunkSize(int $chunkSize): void
    {
        if ($chunkSize < 1) {
            throw new \InvalidArgumentException('Chunk size must be positive');
        }
        $this->chunkSize = $chunkSize;
    }

    /**
     * Get the nonce being used.
     */
    public function getNonce(): string
    {
        return $this->nonce;
    }
}

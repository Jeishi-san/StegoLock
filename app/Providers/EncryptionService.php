<?php

namespace App\Providers;

use App\Services\TemporaryKeyStorage;
use Illuminate\Support\Facades\Auth;
use App\Models\Document;
use Illuminate\Support\Facades\Storage;
use App\Config\Constant;

class EncryptionService
{
    public function encrypt(int $documentId, string $temp_filePath)
    {
        $encPath = null; // Initialize to avoid undefined variable errors
        //print or display "encryption ongoing..."
        $document = Document::where('document_id', $documentId)->first();
        if (!$document) {
            throw new \Exception("Missing document");
        }
        try {
            // 1. Read the uploaded plaintext file
            $plaintext = file_get_contents(Storage::path($temp_filePath));

            // 2. Generate a random document key salt (32 bytes)
            $dk_salt = random_bytes(Constant::DK_SALT_LEN);

            // 3. Get master key from Redis via TemporaryKeyStorage
            $token = session('master_key_token');
            $userId = Auth::id();
            if (!$token || !$userId) {
                throw new \Exception('Master key token not found in session or user not authenticated.');
            }

            $storage = new TemporaryKeyStorage();
            $masterKey = $storage->retrieve($token, $userId);
            if (!$masterKey) {
                throw new \Exception('Master key not found or expired.');
            }

            // 4. Derive the document key using HKDF | Output length: 32 bytes (256-bit key)
            $documentKey = hash_hkdf('sha256', $masterKey, 32, 'document-enc-key', $dk_salt);

            // 5. AES-256-GCM encryption
            $nonce = random_bytes(Constant::NONCE_LEN); // 96-bit recommended IV/nonce
            $tag = '';
            $ciphertext = openssl_encrypt(
                $plaintext,
                'aes-256-gcm',
                $documentKey,
                OPENSSL_RAW_DATA,
                $nonce,
                $tag
            );

            if ($ciphertext === false) {
                $opensslError = openssl_error_string();
                \Illuminate\Support\Facades\Log::error('EncryptionService: openssl_encrypt failed', [
                    'openssl_error' => $opensslError,
                ]);
                throw new \Exception('AES-256-GCM encryption failed: ' . $opensslError);
            }

            // 5. Save encrypted file (store nonce/IV + tag + ciphertext)
            $encPath = 'temp/encrypted/' . pathinfo(basename(''.$temp_filePath), PATHINFO_FILENAME) . '.stegolock';

            Storage::put($encPath, $nonce . $tag . $ciphertext);

            //6. Update the database with encryption info
            $document->update([
                'dk_salt' => base64_encode($dk_salt),
                'encrypted_size' => strlen($ciphertext),
                'status' => 'encrypted'
            ]);

            // Safe to delete uploaded file
            Storage::delete($temp_filePath);

        } catch (\Throwable $e) {
            // Update document with failure info
            $document->update([
                'status' => 'failed',
                'error_message' => json_encode(['Encryption failed', $e->getMessage()])
            ]);

            //return back()->with('error', $document->error_message);
        }

        //return data for Segmentation
        return [
            'document_id' => $document->document_id,
            'encPath' => $encPath
        ];
    }
}

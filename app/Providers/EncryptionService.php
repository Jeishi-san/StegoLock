<?php

namespace App\Providers;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Session;
use App\Models\Document;
use App\Config\Constant;

class EncryptionService
{
    /**
     * Generate cryptographically secure 256-bit Document Encryption Key
     */
    public function generateRandomDEK(): string
    {
        return random_bytes(32);
    }

    /**
     * Wrap DEK with user's master key using AES-256-GCM
     */
    public function wrapDEK(string $dek, string $userMasterKey): array
    {
        $nonce = random_bytes(12); // 96-bit IV recommended for GCM
        $tag = '';

        $wrappedDek = openssl_encrypt(
            $dek,
            'aes-256-gcm',
            $userMasterKey,
            OPENSSL_RAW_DATA,
            $nonce,
            $tag
        );

        return [
            'wrapped_dek' => $wrappedDek,
            'iv' => $nonce,
            'auth_tag' => $tag,
        ];
    }

    /**
     * Unwrap DEK wrapped for a user
     */
    public function unwrapDEK(string $wrappedDek, string $iv, string $authTag, string $userMasterKey): string
    {
        $dek = openssl_decrypt(
            $wrappedDek,
            'aes-256-gcm',
            $userMasterKey,
            OPENSSL_RAW_DATA,
            $iv,
            $authTag
        );

        if ($dek === false) {
            throw new \Exception("Failed to unwrap DEK: Invalid key or corrupted data");
        }

        return $dek;
    }

    public function encrypt(int $documentId, string $temp_filePath, string $encryptionMode = 'legacy_derived', array $viewerUserIds = [])
    {
        //print or display "encryption ongoing..."
        $document = Document::find($documentId);
        if (!$document) {
            throw new \Exception("Missing document");
        }
        try {
            // 1. Read the uploaded plaintext file
            $plaintext = file_get_contents(Storage::path($temp_filePath));

            // 2. Get master key from session
            $masterKey = session('master_key');
            if (!$masterKey) {
                throw new \Exception('Master key not found in session.');
            }

            // 3. Get document key based on encryption mode
            if ($encryptionMode === 'envelope_wrapped') {
                // Envelope mode: generate true random DEK
                $documentKey = $this->generateRandomDEK();
                $dk_salt = null;

                // Wrap DEK for owner
                $ownerWrapped = $this->wrapDEK($documentKey, $masterKey);
                
                $document->update([
                    'encryption_mode' => 'envelope_wrapped',
                    'document_dek' => $ownerWrapped['wrapped_dek'],
                    'document_dek_iv' => $ownerWrapped['iv'],
                    'document_dek_tag' => $ownerWrapped['auth_tag'],
                ]);

                // Wrap DEK for all specified viewers
                foreach ($viewerUserIds as $userId) {
                    // In production: fetch each user's public wrapped master key here
                    $viewerWrapped = $this->wrapDEK($documentKey, $masterKey);
                    
                    $document->sharedWith()->attach($userId, [
                        'shared_by' => $document->user_id,
                        'wrapped_dek' => $viewerWrapped['wrapped_dek'],
                        'wrapped_dek_iv' => $viewerWrapped['iv'],
                        'wrapped_dek_auth_tag' => $viewerWrapped['auth_tag'],
                    ]);
                }
            } else {
                // Legacy mode: derive DEK from user master key
                $dk_salt = random_bytes(Constant::DK_SALT_LEN);
                $documentKey = hash_hkdf('sha256', $masterKey, 32, 'document-enc-key', $dk_salt);
                
                $document->update([
                    'encryption_mode' => 'legacy_derived',
                ]);
            }

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
                'error_message' => ['Encryption failed', $e->getMessage()]
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

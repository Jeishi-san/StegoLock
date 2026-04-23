<?php

namespace App\Services;

use Illuminate\Support\Facades\Auth;
use App\Models\Document;
use App\Providers\EncryptionService;

class DocumentDecryptionService
{
    public function __construct(
        protected EncryptionService $encryptionService
    ) {}

    /**
     * Decrypt document using appropriate mode for current user
     */
    public function decryptDocument(Document $document, string $userMasterKey): string
    {
        // Get encrypted file from storage
        $encryptedData = file_get_contents(storage_path("app/temp/encrypted/{$document->document_id}.stegolock"));
        
        // Extract encryption parameters
        $nonce = substr($encryptedData, 0, 12);
        $tag = substr($encryptedData, 12, 16);
        $ciphertext = substr($encryptedData, 28);

        // Get DEK based on encryption mode
        $documentKey = $this->getDocumentKeyForUser($document, $userMasterKey);

        // Decrypt document content
        $plaintext = openssl_decrypt(
            $ciphertext,
            'aes-256-gcm',
            $documentKey,
            OPENSSL_RAW_DATA,
            $nonce,
            $tag
        );

        if ($plaintext === false) {
            throw new \Exception("Document decryption failed");
        }

        return $plaintext;
    }

    /**
     * Retrieve and unwrap DEK for current user
     */
    protected function getDocumentKeyForUser(Document $document, string $userMasterKey): string
    {
        if ($document->isEnvelopeMode()) {
            $currentUserId = Auth::id();

            // Check if user is owner
            if ($document->user_id === $currentUserId) {
                // Owner: unwrap from document record
                return $this->encryptionService->unwrapDEK(
                    $document->document_dek,
                    $document->document_dek_iv,
                    $document->document_dek_tag,
                    $userMasterKey
                );
            }

            // Shared user: unwrap from grant
            $wrappedDek = $document->getWrappedDekForUser($currentUserId);
            
            if (!$wrappedDek) {
                throw new \Exception("No access grant found for this document");
            }

            return $this->encryptionService->unwrapDEK(
                $wrappedDek->wrapped_dek,
                $wrappedDek->iv,
                $wrappedDek->auth_tag,
                $userMasterKey
            );
        }

        // Legacy mode: derive DEK
        return hash_hkdf('sha256', $userMasterKey, 32, 'document-enc-key', base64_decode($document->dk_salt));
    }
}

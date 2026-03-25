<?php

namespace App\Jobs;

use App\Config\Constant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\Document;
use Illuminate\Support\Facades\Storage;

class EncryptDocumentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $documentId;
    protected $filePath;

    /**
     * Create a new job instance.
     *
     * @param int $documentId
     * @param string $filePath
     */
    public function __construct(int $documentId, string $filePath)
    {
        $this->documentId = $documentId;
        $this->filePath = $filePath;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $document = Document::find($this->documentId);
        if (!$document) return;

        try {
            // 1. Read the uploaded plaintext file
            $plaintext = file_get_contents(Storage::path($this->filePath));

            // 2. Generate a random document key salt (32 bytes)
            $dk_salt = random_bytes(Constant::DK_SALT_LEN);

            // 3. Get master key from session
            $masterKey = session('master_key');
            if (!$masterKey) {
                throw new \Exception('Master key not found in session.');
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

            // 5. Save encrypted file (store nonce/IV + tag + ciphertext)
            $encPath = 'uploads/encrypted/' . $document->document_id . '.enc';
            Storage::put($encPath, $nonce . $tag . $ciphertext);

            // 6. Update the database with encryption info
            $document->update([
                'dk_salt' => base64_encode($dk_salt),
                'encrypted_size' => strlen($ciphertext),
                'status' => 'encrypted'
            ]);

            // Safe to delete uploaded file
            Storage::delete($this->filePath);

            // Segmentation
            SegmentDocumentJob::dispatchSync($document->document_id, $encPath, base64_encode($masterKey));

        } catch (\Throwable $e) {
            // Update document with failure info
            $document->update([
                'status' => 'failed',
                'error_message' => $e->getMessage()
            ]);
        }
    }
}

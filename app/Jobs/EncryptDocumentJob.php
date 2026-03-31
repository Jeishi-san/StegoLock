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
use App\Providers\B2Service;

class EncryptDocumentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $documentId;
    protected $temp_filedata;

    /**
     * Create a new job instance.
     *
     * @param int $documentId
     * @param array $temp_filedata
     */
    public function __construct(int $documentId, array $temp_filedata)
    {
        $this->documentId = $documentId;
        $this->temp_filedata = $temp_filedata;
    }

    /**
     * Execute the job.
     */
    public function handle()
    {
        $this->encrypt();
    }

    public function encrypt()
    {
        //print or display "encryption ongoing..."
        $document = Document::find($this->documentId);
        if (!$document) {
            throw new \Exception("Missing document");
        }

        $b2 = new B2Service();
        $fileInfo = $this->temp_filedata;


        try {
            // 1. Read the uploaded plaintext file
            try {
                $plaintext = $b2->readfile($fileInfo['fileId'], $fileInfo['fileName']);

            } catch (\Throwable $e) {
                return back()->with('error', $e->getMessage());
            }

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
            $encPath = 'temp-encrypted/' . pathinfo(basename($fileInfo['fileName']), PATHINFO_FILENAME) . '.stegolock';

            try {
                $path = Storage::disk('b2')->put($encPath, $nonce . $tag . $ciphertext);

                if (!$path) {
                    throw new \Exception('Encryption process stopped: empty encryption file path');
                }

            } catch (\Throwable $e) {
                return back()->with('error', $e->getMessage());
            }

            //6. Update the database with encryption info
            $document->update([
                'dk_salt' => base64_encode($dk_salt),
                'encrypted_size' => strlen($ciphertext),
                'status' => 'encrypted'
            ]);

            // Safe to delete uploaded file
            $uploadedFileDeleted = $b2->deleteFile($fileInfo['fileId'], $fileInfo['fileName']);
            if(!$uploadedFileDeleted) {
                throw new \Exception('Failed to delete temporary file');
            }
        } catch (\Throwable $e) {
            // Update document with failure info
            $document->update([
                'status' => 'failed',
                'error_message' => ['Encryption failed', $e->getMessage()]
            ]);

            return back()->with('error', $document->error_message);
        }

        //Segmentation
        SegmentDocumentJob::dispatchSync($document->document_id, $encPath);
    }

    public function retryUntil(): ?\DateTimeInterface
    {
        return now()->addMinutes(1);
    }

    public function failed(\Throwable $exception): void
    {
        // Handle the failure
    }
}

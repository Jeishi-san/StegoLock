<?php

namespace App\Jobs;

use App\Config\Constant;
use App\Models\Document;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class DecryptDocumentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected string $documentId;
    protected string $stegolock_file;

    public function __construct(string $documentId, string $stegolock_file)
    {
        $this->documentId = $documentId;
        $this->stegolock_file = $stegolock_file;
    }

    public function handle()
    {
        $document = Document::find($this->documentId);
        if (!$document) return;

        $masterKey = session('master_key');
        if (!$masterKey) {
            throw new \Exception('Master key not found in session.');
        }

        try {
            // Read reconstructed encrypted file
            $encPath = 'uploads/reconstructed/' . $this->stegolock_file;
            $data = file_get_contents(Storage::path($encPath));

            if ($data === false) {
                throw new \Exception('Encrypted file not found.');
            }

            // Get components
            $nonceLen = Constant::NONCE_LEN; // e.g., 12 bytes
            $tagLen = 16; // GCM tag is 16 bytes

            $nonce = substr($data, 0, $nonceLen);
            $tag = substr($data, $nonceLen, $tagLen);
            $ciphertext = substr($data, $nonceLen + $tagLen);

            // 3. Re-derive document key
            $dk_salt = base64_decode($document->dk_salt);

            $documentKey = hash_hkdf(
                'sha256',
                $masterKey,
                32,
                'document-enc-key',
                $dk_salt
            );

            // 4. Decrypt
            $plaintext = openssl_decrypt(
                $ciphertext,
                'aes-256-gcm',
                $documentKey,
                OPENSSL_RAW_DATA,
                $nonce,
                $tag
            );

            if ($plaintext === false) {
                throw new \Exception('Decryption failed. Possible tampering or wrong key.');
            }

            // 5. Save decrypted file
            $outputPath = 'uploads/decrypted/' . $document->filename;
            Storage::put($outputPath, $plaintext);

            // 6. Update document
            $document->update([
                'status' => 'decrypted'
            ]);

            // Safe to delete decrypted file
            Storage::delete($encPath);

            //return to user for download
            //delete after download / retain files, this leads to new securing process
            //return back()->with('success', 'File retrieved: ' . basename($outputPath));

        } catch (\Throwable $e) {
            $document->update([
                'status' => 'failed',
                'error_message' => 'Decryption failed: ' . $e->getMessage()
            ]);
        }
    }
}

// namespace App\Jobs;

// use App\Models\Document;
// use App\Config\Constant;
// use Illuminate\Bus\Queueable;
// use Illuminate\Contracts\Queue\ShouldQueue;
// use Illuminate\Foundation\Bus\Dispatchable;
// use Illuminate\Queue\InteractsWithQueue;
// use Illuminate\Queue\SerializesModels;
// use Illuminate\Support\Facades\Storage;

// class DecryptDocumentJob implements ShouldQueue
// {
//     use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

//     protected int $documentId;
//     protected string $filePath;
//     protected string $originalFilename;

//     public function __construct(int $documentId, string $filePath, string $originalFilename)
//     {
//         $this->documentId = $documentId;
//         $this->filePath = $filePath;
//         $this->originalFilename = $originalFilename;
//     }

//     public function handle(): void
//     {
//         $document = Document::find($this->documentId);
//         if (!$document) {
//             throw new \Exception('Document not found.');
//         }

//         // 1. Get master key
//         $masterKey = session('master_key');
//         if (!$masterKey) {
//             throw new \Exception('Master key not available.');
//         }

//         // 2. Load encrypted file
//         if (!Storage::exists($this->filePath)) {
//             throw new \Exception('Encrypted file not found.');
//         }

//         $encryptedData = Storage::get($this->filePath);

//         // 3. Extract nonce, tag, ciphertext
//         $nonceLength = Constant::NONCE_LEN; // 12
//         $tagLength = 16;

//         $nonce = substr($encryptedData, 0, $nonceLength);
//         $tag = substr($encryptedData, $nonceLength, $tagLength);
//         $ciphertext = substr($encryptedData, $nonceLength + $tagLength);

//         if (!$nonce || !$tag || !$ciphertext) {
//             throw new \Exception('Corrupted encrypted file.');
//         }

//         // 4. Re-derive document key using stored dk_salt
//         $dk_salt = base64_decode($document->dk_salt);

//         $documentKey = hash_hkdf(
//             'sha256',
//             $masterKey,
//             32,
//             'document-enc-key',
//             $dk_salt
//         );

//         // 5. Decrypt
//         $plaintext = openssl_decrypt(
//             $ciphertext,
//             'aes-256-gcm',
//             $documentKey,
//             OPENSSL_RAW_DATA,
//             $nonce,
//             $tag
//         );

//         if ($plaintext === false) {
//             throw new \Exception('Decryption failed. Integrity check failed.');
//         }

//         // 6. Save decrypted file
//         $decryptedPath = 'decrypted/' . $this->originalFilename;
//         Storage::put($decryptedPath, $plaintext);
//     }
//}

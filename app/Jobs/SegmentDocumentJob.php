<?php

namespace App\Jobs;

use App\Models\Document;
use App\Models\Fragment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use App\Providers\B2Service;

class SegmentDocumentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected string $documentId;
    protected string $filePath;

    public function __construct(string $documentId, string $filePath)
    {
        $this->documentId = $documentId;
        $this->filePath = $filePath;
    }

    public function handle(): void
    {
        $this->segment();
    }

    public function segment()
    {
        //print or display "segmentation ongoing..."
        $document = Document::find($this->documentId);
        if (!$document) return;

        $b2 = new B2Service();

        $encryptionFileInfo = []; //the encrypted file to segment

        try
        {
            $encryptionFileList = $b2->listFiles()['files'];

            foreach ($encryptionFileList as $file) {
                if ($file['fileName'] === $this->filePath) {
                    $encryptionFileInfo[] = $file;
                    break;
                }
            }
        } catch (\Throwable $e) {
            // Handle the error
            return back()->withErrors(['error' => 'File fetch error' . $e->getMessage()]);
        }

        try {

            //$ciphertext = file_get_contents(Storage::path($this->filePath));
            $ciphertext = $b2->readfile($encryptionFileInfo[0]['fileId'], $encryptionFileInfo[0]['fileName']);

            if ($ciphertext === false) return;

            $ciphertextLength = strlen($ciphertext);

            if ($ciphertextLength > 512000) {
                // > 500 KB → random fragment size between 64 KB and 256 KB
                $fragmentSize = random_int(65536, 262144);
                $fragments = str_split($ciphertext, $fragmentSize);
            } elseif ($ciphertextLength > 102400) {
                // 100 KB < length ≤ 500 KB → split into 5 equal-ish fragments
                $numFragments = 5;
                $fragments = [];
                $partSize = intdiv($ciphertextLength, $numFragments);
                $remainder = $ciphertextLength % $numFragments;

                $offset = 0;
                for ($i = 0; $i < $numFragments; $i++) {
                    $size = $partSize + ($i < $remainder ? 1 : 0); // distribute remainder
                    $fragments[] = substr($ciphertext, $offset, $size);
                    $offset += $size;
                }
            } else {
                // ≤ 100 KB → split into 3 equal-ish fragments
                $numFragments = 3;
                $fragments = [];
                $partSize = intdiv($ciphertextLength, $numFragments);
                $remainder = $ciphertextLength % $numFragments;

                $offset = 0;
                for ($i = 0; $i < $numFragments; $i++) {
                    $size = $partSize + ($i < $remainder ? 1 : 0); // distribute remainder
                    $fragments[] = substr($ciphertext, $offset, $size);
                    $offset += $size;
                }
            }

            $totalSize = 0;

            foreach ($fragments as $index => $frag) {
                Fragment::create([
                    'fragment_id' => (string) Str::uuid(),
                    'document_id' => $this->documentId,
                    'index' => $index,
                    'blob' => base64_encode($frag),
                    'size' => strlen($frag),
                    'hash' => hash('sha256', $frag),
                    'status' => 'floating',
                ]);

                $totalSize += strlen($frag);
            }

            // Verification BEFORE deletion
            if ($totalSize !== $ciphertextLength) {
                throw new \Exception('Fragmentation failed: size mismatch');
            }

            // Update the database with fragments info

            $document->update([
                'fragment_count' => count($fragments),
                'status' => 'fragmented'
            ]);

            // Safe to delete encrypted file
            $encryptedFileDeleted = $b2->deleteFile($encryptionFileInfo[0]['fileId'], $encryptionFileInfo[0]['fileName']);
            if(!$encryptedFileDeleted) {
                throw new \Exception('Failed to delete temporary file');
            }
        } catch (\Throwable $e) {
            // Update document with failure info
            $document->update([
                'status' => 'failed',
                'error_message' => ['Segmentation failed', $e->getMessage()]
            ]);
        }

        //Dispatch cover file generation and mapping
        MapFragmentsToCoversJob::dispatchSync($this->documentId);
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

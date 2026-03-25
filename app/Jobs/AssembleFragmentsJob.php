<?php

namespace App\Jobs;

use App\Models\Fragment;
use App\Models\Document;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class AssembleFragmentsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected string $documentId;
    protected string $masterKey;

    public function __construct(string $documentId, string $masterKey)
    {
        $this->documentId = $documentId;
        $this->masterKey = $masterKey;
    }

    public function handle(): void
    {
        $document = Document::find($this->documentId);
        if (!$document) return;

        try {
            // 1. Get all fragments ordered
            $fragments = Fragment::where('document_id', $this->documentId)
                ->orderBy('index')
                ->get();

            if ($fragments->isEmpty()) {
                throw new \Exception('No fragments found.');
            }

            // 2. Validate completeness (index sequence must be continuous)
            $expectedIndex = 0;
            foreach ($fragments as $fragment) {
                if ($fragment->index !== $expectedIndex) {
                    throw new \Exception("Missing fragment at index {$expectedIndex}");
                }
                $expectedIndex++;
            }

            // 3. Reconstruct binary ciphertext
            $reconstructed = '';

            foreach ($fragments as $fragment) {
                $binary = base64_decode($fragment->blob);

                // 4. Integrity check
                $hashCheck = hash('sha256', $binary);
                if ($hashCheck !== $fragment->hash) {
                    throw new \Exception("Fragment integrity failed at index {$fragment->index}");
                }

                $reconstructed .= $binary;
            }

            // 5. Save reconstructed encrypted file
            $outputPath = 'uploads/reconstructed/' . $this->documentId . '.enc';
            Storage::put($outputPath, $reconstructed);

            // 6. Update document
            $document->update([
                'status' => 'reconstructed'
            ]);

            //Decrypt
            DecryptDocumentJob::dispatchSync($document->document_id, $this->masterKey);

        } catch (\Throwable $e) {
            $document->update([
                'status' => 'failed',
                'error_message' => $e->getMessage()
            ]);
        }
    }
}

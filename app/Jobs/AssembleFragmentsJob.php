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
    protected array $fragmentBin;

    public function __construct(string $documentId, array $fragmentBin)
    {
        $this->documentId = $documentId;
        $this->fragmentBin = $fragmentBin;
    }

    public function handle()
    {
        $document = Document::find($this->documentId);
        if (!$document) return;

        try {
            // check fragment integrity
            $frag = [];
            foreach ($this->fragmentBin as $fragment) {
                $fragment_in_DB = Fragment::findOrFail($fragment[0]);
                $fragmentBinaryData = file_get_contents(storage_path('app/private/temp/bin/' . $fragment[1] . '.bin'));

                if ($fragment_in_DB->hash !== hash('sha256',$fragmentBinaryData)) {
                    throw new \Exception("Fragment integrity failed");
                }

                //temp store fragment_id, fragment index, binarydata, binary filename
                $frag[] = [$fragment_in_DB->fragment_id, $fragment_in_DB->index, $fragmentBinaryData, $fragment[1]];
            }

            //sort by index
            usort($frag, function ($a, $b) {
                return $a[1] <=> $b[1];
            });

            // Reconstruct binary ciphertext
            $reconstructed = '';

            foreach ($frag as $fragment) {
                $binary = $fragment[2];
                $reconstructed .= $binary;
            }

            // Save reconstructed encrypted file
            $outputPath = 'temp/reconstructed/' . bin2hex(random_bytes(16)) . time() . '.stegolock';
            Storage::put($outputPath, $reconstructed);

            // 6. Update document
            $document->update([
                'status' => 'reconstructed'
            ]);

            //delete fragment bin
            foreach ($frag as $fragment) {
                unlink(storage_path('app/private/temp/bin/' . $fragment[3] . '.bin'));
            }

            //Decrypt
            DecryptDocumentJob::dispatchSync($document->document_id, basename($outputPath));

        } catch (\Throwable $e) {
            $document->update([
                'status' => 'failed',
                'error_message' => 'File reconstruction failed' . $e->getMessage()
            ]);
        }
    }
}

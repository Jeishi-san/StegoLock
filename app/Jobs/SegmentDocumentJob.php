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

class SegmentDocumentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected string $documentId;
    protected string $filePath;
    protected string $masterKey;

    public function __construct(string $documentId, string $filePath, string $masterKey)
    {
        $this->documentId = $documentId;
        $this->filePath = $filePath;
        $this->masterKey = $masterKey;
    }

    public function handle(): void
    {
        $ciphertext = file_get_contents(Storage::path($this->filePath));
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
        $document = Document::find($this->documentId);
        if (!$document) return;

        $document->update([
            'fragment_count' => count($fragments),
            'status' => 'fragmented'
        ]);

        // Safe to delete encrypted file
        Storage::delete($this->filePath);

        //Dispatch cover file generation and mapping
        dd('YOU\'RE ABOUT TO MAP FRAGMENTS FOR DOCUMENT: '.$this->documentId);
        //MapFragmentsToCoversJob::dispatch($this->documentId);

        //test
        //AssembleFragmentsJob::dispatchSync($document->document_id, $this->masterKey);

        //test
        //$samp_Fragment = Fragment::find('2d52491d-286d-47ad-9c75-a2f67f0eb85f');
        //EmbedFragmentJob::dispatchSync();//$samp_Fragment

        //test
        //$samp_Fragment = Fragment::find('2d52491d-286d-47ad-9c75-a2f67f0eb85f');
        //ExtractFragmentJob::dispatchSync();//$samp_Fragment
    }
}

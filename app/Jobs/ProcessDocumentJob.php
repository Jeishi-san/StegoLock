<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

use App\Providers\B2Service;
use App\Models\Document;
use App\Models\Fragment;
use App\Models\Cover;
use App\Models\FragmentMap;
use App\Models\StegoFile;
use App\Models\StegoMap;
use App\Models\User;

class ProcessDocumentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected string $documentId;
    protected string $encryptedPath;
    protected int $userId;

    public $timeout = 600; // Allow 10 minutes for heavy processing

    public function __construct(string $documentId, string $encryptedPath, int $userId)
    {
        $this->documentId = $documentId;
        $this->encryptedPath = $encryptedPath;
        $this->userId = $userId;
    }

    public function handle()
    {
        $document = Document::find($this->documentId);
        if (!$document) return;

        try {
            $segmented = $this->segment($this->documentId, $this->encryptedPath);

            //fetch cover files from cloud
            $b2 = new B2Service();
            $files = $b2->listFiles();
            $cloudFiles = collect($files['files'])
                ->map(function ($file) {
                    return [
                        'id' => $file['fileId'],
                        'fileName' => $file['fileName'],
                    ];
                })
                ->values()
                ->toArray();

            $mapId = "";
            $localCovers = [];

            if ($segmented) {
                $mapId = $this->mapFragmentsToCovers($this->documentId);

                $maxAttempts = 3;
                $attempt = 0;

                do {
                    $fetchedData = $this->fetchCoverFiles(strval($mapId), $cloudFiles);
                    $attempt++;

                    if ($fetchedData['matched']) {
                        break;
                    }

                } while ($attempt < $maxAttempts);

                if (!$fetchedData['matched']) {
                    throw new \Exception("Cover mismatch after {$attempt} attempts");
                }

                $localCovers[] = $fetchedData['localCovers'];

                $this->embedFragments($mapId, $cloudFiles, $localCovers);
            }
        } catch (\Throwable $e) {
             $document->update([
                'status' => 'failed',
                'error_message' => ['Process Document Job Failed: ', $e->getMessage()]
             ]);
        }
    }

    private function segment(string $documentId, string $filePath)
    {
        $document = Document::find($documentId);
        if (!$document) return;

        $isSegmented = false;
        try {

            $ciphertext = file_get_contents(Storage::path($filePath));

            if ($ciphertext === false) return;

            $ciphertextLength = strlen($ciphertext);

            if ($ciphertextLength > 2097152) {
                // > 2 MB → random fragment size between 320 KB and 512 KB
                $fragmentSize = random_int(327680, 524288);
                $fragments = str_split($ciphertext, $fragmentSize);
            } elseif ($ciphertextLength > 512000) {
                // > 500 KB < length ≤ 2 MB → random fragment size between 192KB and 256KB
                $fragmentSize = random_int(196608, 262144);
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
                    'document_id' => $documentId,
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

            $isSegmented = true;

            // Safe to delete encrypted file
            Storage::delete($filePath);

            return $isSegmented;
        } catch (\Throwable $e) {
            // Update document with failure info
            $document->update([
                'status' => 'failed',
                'error_message' => ['Segmentation failed', $e->getMessage()]
            ]);
            return $isSegmented;
        }
    }

    private function mapFragmentsToCovers(string $documentId)
    {
        try {
            // PHASE 1: Allocation of fragments to cover types

                $document = Document::with('fragments')->find($documentId);

                if (!$document) {
                    throw new \Exception('Document not found');
                }

                if ($document->status !== 'fragmented') {
                    throw new \Exception('Document not ready for mapping');
                }

                $fragments = $document->fragments->shuffle()->values();
                $expectedCount = $document->fragment_count;

                if ($fragments->count() !== $expectedCount) {
                    throw new \Exception('Fragment count mismatch. Possible corruption or incomplete segmentation.');
                }

                $total = $fragments->count();
                // safety guard
                if ($total < 1) {
                    throw new \Exception('No fragments available for mapping.');
                }

                if ($total <= 5) {
                    // deterministic allocation for small fragment sets
                    $textCount  = 1;
                    $audioCount = 1;
                    $imageCount = $total - 2; // remaining fragments are images
                } else {
                    // percentage-based allocation for larger fragment sets
                    $textCount  = max(1, ceil($total * 0.1));
                    $audioCount = max(1, ceil($total * 0.2));
                    $imageCount = $total - $textCount - $audioCount;
                }

            // PHASE 2: Fetch valid covers
                $fragmentSize = $fragments->max('size');

                $textCoverPool  = Cover::where('type', 'text')
                    ->get()->map(fn ($c) => [
                                    'id' => $c->cover_id,
                                    'capacity' => $c->metadata['capacity'] ?? null,
                                ])
                                ->filter(fn ($c) => $c['capacity'] >= $fragmentSize)
                                ->values()->toArray();
                if (empty($textCoverPool)) {

                    while (count($textCoverPool) < $textCount) {
                        $newTextCover = $this->generate_text_cover($fragmentSize);

                        // normalize + append
                        $textCoverPool[] = [
                            'id' => $newTextCover->cover_id,
                            'capacity' => $newTextCover->metadata['capacity'] ?? 0,
                        ];
                    }

                }

                $audioCoverPool = Cover::where('type', 'audio')
                    ->get()->map(fn ($c) => [
                                    'id' => $c->cover_id,
                                    'capacity' => $c->metadata['capacity'] ?? null,
                                ])
                                ->filter(fn ($c) => $c['capacity'] >= $fragmentSize)
                                ->values()->toArray();
                if (empty($audioCoverPool)) {
                    // throw new \Exception('No available audio covers');
                }

                $imageCoverPool = Cover::where('type', 'image')
                    ->get()->map(fn ($c) => [
                                    'id' => $c->cover_id,
                                    'capacity' => $c->metadata['capacity'] ?? null,
                                ])
                                ->filter(fn ($c) => $c['capacity'] >= $fragmentSize)
                                ->values()->toArray();
                if (empty($imageCoverPool)) {
                    throw new \Exception('No available image covers');
                }

            // PHASE 3: Mapping Proper
                $mappingArray = [];

                // Assign text fragments
                $textFragments = $fragments->take($textCount);
                foreach ($textFragments as $frag) {
                    $cover = collect($textCoverPool)->random();
                    $mappingArray[] = [
                        'fragment_id' => $frag->fragment_id,
                        'cover_id' => $cover['id'],
                        'offset' => 0,
                    ];
                }

                // Assign audio fragments
                $audioFragments = $fragments->slice($textCount, $audioCount);
                foreach ($audioFragments as $frag) {
                    $cover = collect($audioCoverPool)->random();
                    $mappingArray[] = [
                        'fragment_id' => $frag->fragment_id,
                        'cover_id' => $cover['id'],
                        'offset' => 0,
                    ];
                }

                // Assign image fragments
                $imageFragments = $fragments->slice($textCount + $audioCount, $imageCount);
                foreach ($imageFragments as $frag) {
                    $cover = collect($imageCoverPool)->random();
                    $mappingArray[] = [
                        'fragment_id' => $frag->fragment_id,
                        'cover_id' => $cover['id'],
                        'offset' => 0,
                    ];
                }

            // PHASE 4: Saving mapping to database
            $map = FragmentMap::create([
                'map_id' => (string) Str::uuid(),
                'document_id' => $document->document_id,
                'fragments_in_covers' => $mappingArray,
                'status' => 'pending',
            ]);

            $document->update([
                'status' => 'mapped',
            ]);

            return $map->map_id;

        } catch (\Throwable $e) {
            $document->update([
                'status' => 'failed',
                'error_message' => ['Mapping failed', $e->getMessage()]
            ]);
            throw $e;
        }

    }

        private function generate_text_cover(int $fragmentSize)
        {
            $maxId = DB::table('wiki_feeds')->max('id');

            if (!$maxId) {
                throw new \Exception('No data in wiki_feeds');
            }

            $targetSize = $fragmentSize / 0.02;
            $content = '';
            $capacity = 0;

            while (strlen($content) < $targetSize) {

                $randomId = rand(1, $maxId);
                $feed = DB::table('wiki_feeds')->where('id', $randomId)->first();

                if (!$feed) continue;

                $block = "pageid: {$feed->pageid}\n";
                $block .= "title: {$feed->title}\n";
                $block .= "content: {$feed->feed}\n\n";

                if ($capacity > $targetSize) {
                    break;
                }

                $content .= $block;
                $capacity = floor(strlen($content) * 0.02);
            }

            // File name
            $randomHex = bin2hex(random_bytes(16));
            $fileName = "{$randomHex}_cover_" . time() . ".txt";

            // Ensure folder exists
            if (!file_exists(storage_path('app/private/temp/covers'))) {
                mkdir(storage_path('app/private/temp/covers'), 0755, true);
            }

            // Save file locally for immediate use
            Storage::disk('local')->put("temp/covers/{$fileName}", $content);

            $filePath = storage_path('app/private/temp/covers/' . $fileName);

            //Save file to DB
            $cover = Cover::create([
                'cover_id' => (string) Str::uuid(),      // generate UUID for PK
                'type' => 'text',
                'filename' => basename($filePath),
                'path' => 'cover_texts/' . basename($filePath), // storage path
                'size_bytes' => strlen($content),
                'metadata' => [
                                'valid' => true,
                                'capacity' => floor(strlen($content) * 0.02),
                                'info' => 'System-generated'
                ],
                'hash' => hash('sha256', file_get_contents($filePath)),
            ]);

            return $cover;
        }

    /**
     * Fetch cover files from the cloud and create cover file copies in local storage for embedding
     */
    private function fetchCoverFiles(string $mapId, array $cloudFiles)
    {
        $b2 = new B2Service();

        //create local copies of cover files
        if (!file_exists(storage_path('app/private/temp/covers/'))) {
            mkdir(storage_path('app/private/temp/covers/'), 0755, true);
        }

        $map = FragmentMap::findOrFail($mapId);
        $mappedCovers = $map->fragments_in_covers;

        $document = Document::findOrFail($map->document_id);

        $cloudMap = collect($cloudFiles)
            ->keyBy('fileName');

        $localCovers = [];

        foreach ($mappedCovers as $mappedCover) {
            $cover = Cover::findOrFail($mappedCover['cover_id']);

            $coverTempPath = storage_path('app/private/temp/covers/' . $cover->filename);

            $isNewCover = false;

            $key = $this->getCoverFolder($cover->type).trim(strval($cover->filename));

            if (!$cloudMap->has($key)) {

                //check local storage
                if (file_exists($coverTempPath)) {
                    $isNewCover = true;
                    $localCovers[] = $coverTempPath;
                    continue;
                }

                if(!$isNewCover) throw new \Exception("Cover file missing: {$key}");
            }

            try { //files from cloud

                $file = $cloudMap[$key];
                $content = $b2->readfile($file['id']);
                file_put_contents($coverTempPath, $content);

                $localCovers[] = $coverTempPath;

            } catch (\Throwable $e) {
                throw new \Exception("Cloud fetch failed: " . $e->getMessage());
            }
        }

        return [
            'matched' => count($localCovers) === $document->fragment_count,
            'localCovers' => $localCovers
        ];
    }

    private function embedFragments(string $mapId, array $cloudFiles, array $localCovers)
    {
        $user = User::findOrFail($this->userId);
        $map = FragmentMap::findOrFail($mapId);
        $document = Document::findOrFail($map->document_id);
        $mapping = $map->fragments_in_covers;

        $b2 = new B2Service();
        $stegoMap = [];
        try {

            foreach ($mapping as $mapItem) {
                $stegoMap[] = $this->embed($mapItem['fragment_id'], $mapItem['cover_id'], $cloudFiles, $localCovers);
            }

            // Update document status
            $document->update([
                'status' => 'embedded',
            ]);

            // Save stegoMap to DB
            $newStegoMap = StegoMap::create([
                'stego_map_id' => (string) Str::uuid(),
                'document_id' => $document->document_id,
                'status' => 'completed',
            ]);


            // Save stego files in cloud
            $stegoFiles = collect($stegoMap)
                ->pluck('stegoFile');

            $stegoFileInfos = [];
            foreach ($stegoFiles as $filePath) {
                $stegoFileInfos[] = $b2->storeFile($filePath);
                unlink($filePath);
            }

            // Save stego file to DB
            foreach ($stegoFileInfos as $stegoFile) {
                foreach ($stegoMap as $stego) {
                    $filename = basename($stego['stegoFile']);
                    if ($stegoFile['fileName'] === 'locked/' . $filename) {
                        $sFile = StegoFile::create([
                            'stego_map_id' => $newStegoMap->stego_map_id,
                            'cloud_file_id' => $stegoFile['fileId'],
                            'fragment_id' => $stego['fragmentId'],
                            'offset' => $stego['offset'],
                            'filename' => $filename,
                            'stego_size' => $stegoFile['contentLength'],
                            'status' => 'embedded',
                        ]);
                        $user->increment('storage_used', $sFile->stego_size);
                        $document->increment('in_cloud_size', $sFile->stego_size);
                        break;
                    }
                }
            }

            // Update document status
            $document->update([
                'status' => 'stored',
            ]);

            return ['success' => 'Embedded and stored',];

        } catch (\Throwable $e) {
            // Update document with failure info
            $document->update([
                'status' => 'failed',
                'error_message' => ['Embedding failed (basecode error): ', $e->getMessage()]
            ]);
            throw $e;
        }
    }

        private function embed(string $fragmentId, string $coverId, array $cloudFiles, array $localCovers)
        {
            $cover = Cover::findOrFail($coverId);

            //creating temp folders for processing files
            if (!file_exists(storage_path('app/private/temp/bin'))) {
                mkdir(storage_path('app/private/temp/bin'), 0755, true);
            }

            if (!file_exists(storage_path('app/private/temp/cloud/'))) {
                mkdir(storage_path('app/private/temp/cloud/'), 0755, true);
            }

            //generating filename for the stego file
            $fileName = bin2hex(random_bytes(16)) . time() . $this->getExtension($cover->type);
            $lockedSet = collect($cloudFiles)->pluck('fileName');

            do { //loop if fileName exists in lockedSet
                $fileName = bin2hex(random_bytes(16)) . time() . $this->getExtension($cover->type);
                $fullName = 'locked/' . $fileName;
            } while ($lockedSet->has($fullName));

            //saving local path of the cover file
            $coverFile = '';
            $localCovers = collect($localCovers)->flatten(1);
            foreach ($localCovers as $localCover) {
                if (basename($localCover) === $cover->filename) {
                    $coverFile = $localCover;
                }
            }

            if (!$coverFile) {
                throw new \Exception("Cover file not found during fetching: " . $cover->filename);
            }

            $stegoFile = storage_path('app/private/temp/cloud/'. $fileName);
            $binaryFile = storage_path('app/private/temp/bin/'. $fileName . '.bin');

            //getting fragment data
            $fragment = Fragment::findOrFail($fragmentId);
            $fragmentBinaryData = base64_decode($fragment->blob);
            file_put_contents($binaryFile, $fragmentBinaryData);

            //embedding binary data with python script
            $command = "python " . base_path('python_backend/embedding/' . $this->getScript($cover->type)) . " "
                . escapeshellarg($coverFile) . " "
                . escapeshellarg($stegoFile) . " "
                . escapeshellarg($binaryFile) . " 2>&1"; // capture errors

            $output = [];
            $status = 0;

            exec($command, $output, $status);

            $output = array_map(function ($line) {
                return mb_convert_encoding($line, 'UTF-8', 'UTF-8');
            }, $output);

            if ($status !== 0) {
                $cleanOutput = implode("\n", $output);
                $cleanOutput = mb_convert_encoding($cleanOutput, 'UTF-8', 'UTF-8');

                throw new \Exception("Embedding failed (py script error on $cover->type):\n" . $cleanOutput);
            }

            $offset = (int) end($output);

            // Optional: log success

            // Safe to delete temp files
            if (isset($cover->metadata['info'])) {
                $cover->forceDelete(); //Permanently delete cover file in DB if its newly generated
            }
            unlink($coverFile);
            unlink($binaryFile);

            return ['fragmentId' => $fragmentId, 'stegoFile' => $stegoFile, 'offset' => $offset];
        }

        private function getExtension(string $coverType): string
        {
            return match ($coverType) {
                'text' => '.txt',
                'audio' => '.wav',
                'image' => '.png',
                default => throw new \InvalidArgumentException("Unsupported cover type: $coverType"),
            };
        }

        private function getScript(string $coverType): string
        {
            return match ($coverType) {
                'text' => 'text/embed.py',
                'audio' => 'audio/embed.py',
                'image' => 'image/embed.py',
                default => throw new \InvalidArgumentException("Unsupported cover type: $coverType"),
            };
        }

        private function getCoverFolder(string $coverType): string
        {
            return match ($coverType) {
                'text' => 'cover_texts/',
                'audio' => 'cover_audios/',
                'image' => 'cover_images/',
                default => throw new \InvalidArgumentException("Unsupported cover type: $coverType"),
            };
        }
}

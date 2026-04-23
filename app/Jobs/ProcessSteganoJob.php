<?php

namespace App\Jobs;

use App\Config\Constant;
use App\Models\Cover;
use App\Models\Document;
use App\Models\Fragment;
use App\Models\FragmentMap;
use App\Models\StegoFile;
use App\Models\StegoMap;
use App\Providers\B2Service;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProcessSteganoJob implements ShouldQueue
{
    use Queueable;

    protected $documentId;
    protected $encryptedPath;

    /**
     * Create a new job instance.
     */
    public function __construct(int $documentId, string $encryptedPath)
    {
        $this->documentId = $documentId;
        $this->encryptedPath = $encryptedPath;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $document = Document::findOrFail($this->documentId);

        try {
            // 1. Segmentation
            $segmented = $this->segment($this->documentId, $this->encryptedPath);
            if (!$segmented) {
                throw new \Exception("Segmentation failed");
            }

            // 2. Mapping
            $mapId = $this->mapFragmentsToCovers($this->documentId);
            if (!$mapId) {
                throw new \Exception("Mapping failed");
            }

            // 3. Fetch Covers
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

            $maxAttempts = 3;
            $attempt = 0;
            $fetchedData = ['matched' => false];

            do {
                $fetchedData = $this->fetchCoverFiles($mapId, $cloudFiles);
                $attempt++;
                if ($fetchedData['matched']) {
                    break;
                }
            } while ($attempt < $maxAttempts);

            if (!$fetchedData['matched']) {
                throw new \Exception("Cover mismatch after {$attempt} attempts");
            }

            // 4. Embedding
            $this->embedFragments($mapId, $cloudFiles, $fetchedData['localCovers']);

            // 5. Cleanup encrypted file
            if (Storage::exists($this->encryptedPath)) {
                Storage::delete($this->encryptedPath);
            }

        } catch (\Throwable $e) {
            $this->cleanupOnFailure($this->documentId);
            $document->update([
                'status' => 'failed',
                'error_message' => $e->getMessage()
            ]);
        }
    }

    /**
     * Cleans up local files and partial database records on failure
     */
    private function cleanupOnFailure(int $documentId)
    {
        // 1. Delete fragments from DB
        Fragment::where('document_id', $documentId)->delete();

        // 2. Delete fragment maps
        FragmentMap::where('document_id', $documentId)->delete();

        // 3. Delete initial encrypted file if it exists
        if (Storage::exists($this->encryptedPath)) {
            Storage::delete($this->encryptedPath);
        }

        // 4. Cleanup temp directories (safely)
        $this->safeDeleteDirectory(storage_path('app/private/temp/bin'));
        $this->safeDeleteDirectory(storage_path('app/private/temp/cloud'));
        $this->safeDeleteDirectory(storage_path('app/private/temp/covers'));
    }

    private function safeDeleteDirectory($path)
    {
        if (file_exists($path) && is_dir($path)) {
            $files = glob($path . '/*');
            foreach ($files as $file) {
                if (is_file($file)) unlink($file);
            }
        }
    }

    private function segment(int $documentId, string $filePath)
    {
        $document = Document::find($documentId);
        if (!$document) return false;

        try {
            $ciphertext = file_get_contents(Storage::path($filePath));
            if ($ciphertext === false) return false;

            $ciphertextLength = strlen($ciphertext);

            if ($ciphertextLength > 2097152) {
                $fragmentSize = random_int(327680, 524288);
                $fragments = str_split($ciphertext, $fragmentSize);
            } elseif ($ciphertextLength > 512000) {
                $fragmentSize = random_int(196608, 262144);
                $fragments = str_split($ciphertext, $fragmentSize);
            } elseif ($ciphertextLength > 102400) {
                $numFragments = 5;
                $fragments = [];
                $partSize = intdiv($ciphertextLength, $numFragments);
                $remainder = $ciphertextLength % $numFragments;

                $offset = 0;
                for ($i = 0; $i < $numFragments; $i++) {
                    $size = $partSize + ($i < $remainder ? 1 : 0);
                    $fragments[] = substr($ciphertext, $offset, $size);
                    $offset += $size;
                }
            } else {
                $numFragments = 3;
                $fragments = [];
                $partSize = intdiv($ciphertextLength, $numFragments);
                $remainder = $ciphertextLength % $numFragments;

                $offset = 0;
                for ($i = 0; $i < $numFragments; $i++) {
                    $size = $partSize + ($i < $remainder ? 1 : 0);
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

            if ($totalSize !== $ciphertextLength) {
                throw new \Exception('Fragmentation failed: size mismatch');
            }

            $document->update([
                'fragment_count' => count($fragments),
                'status' => 'fragmented'
            ]);

            return true;
        } catch (\Throwable $e) {
            $document->update([
                'status' => 'failed',
                'error_message' => 'Segmentation failed: ' . $e->getMessage()
            ]);
            return false;
        }
    }

    private function mapFragmentsToCovers(string $documentId)
    {
        $document = Document::with('fragments')->find($documentId);
        if (!$document) return null;

        try {
            $fragments = $document->fragments->shuffle()->values();
            $total = $fragments->count();

            if ($total < 1) throw new \Exception('No fragments available for mapping.');

            if ($total <= 5) {
                $textCount  = 1;
                $audioCount = 1;
                $imageCount = $total - 2;
            } else {
                $textCount  = max(1, ceil($total * 0.1));
                $audioCount = max(1, ceil($total * 0.2));
                $imageCount = $total - $textCount - $audioCount;
            }

            $fragmentSize = $fragments->max('size');

            // Text Covers
            $textCoverPool = Cover::where('type', 'text')
                ->get()->map(fn ($c) => ['id' => $c->cover_id, 'capacity' => $c->metadata['capacity'] ?? null])
                ->filter(fn ($c) => $c['capacity'] >= $fragmentSize)
                ->values()->toArray();

            if (empty($textCoverPool)) {
                while (count($textCoverPool) < $textCount) {
                    $newTextCover = $this->generate_text_cover($fragmentSize);
                    $textCoverPool[] = ['id' => $newTextCover->cover_id, 'capacity' => $newTextCover->metadata['capacity'] ?? 0];
                }
            }

            // Audio Covers
            $audioCoverPool = Cover::where('type', 'audio')
                ->get()->map(fn ($c) => ['id' => $c->cover_id, 'capacity' => $c->metadata['capacity'] ?? null])
                ->filter(fn ($c) => $c['capacity'] >= $fragmentSize)
                ->values()->toArray();

            if ($audioCount > 0 && empty($audioCoverPool)) {
                throw new \Exception('Unavailable cover files (audio) to continue locking, ask admin to update');
            }

            // Image Covers
            $imageCoverPool = Cover::where('type', 'image')
                ->get()->map(fn ($c) => ['id' => $c->cover_id, 'capacity' => $c->metadata['capacity'] ?? null])
                ->filter(fn ($c) => $c['capacity'] >= $fragmentSize)
                ->values()->toArray();

            if ($imageCount > 0 && empty($imageCoverPool)) {
                throw new \Exception('Unavailable cover files (image) to continue locking, ask admin to update');
            }

            $mappingArray = [];
            foreach ($fragments->take($textCount) as $frag) {
                $cover = collect($textCoverPool)->random();
                $mappingArray[] = ['fragment_id' => $frag->fragment_id, 'cover_id' => $cover['id'], 'offset' => 0];
            }
            foreach ($fragments->slice($textCount, $audioCount) as $frag) {
                $cover = collect($audioCoverPool)->random();
                $mappingArray[] = ['fragment_id' => $frag->fragment_id, 'cover_id' => $cover['id'], 'offset' => 0];
            }
            foreach ($fragments->slice($textCount + $audioCount) as $frag) {
                $cover = collect($imageCoverPool)->random();
                $mappingArray[] = ['fragment_id' => $frag->fragment_id, 'cover_id' => $cover['id'], 'offset' => 0];
            }

            $map = FragmentMap::create([
                'map_id' => (string) Str::uuid(),
                'document_id' => $document->document_id,
                'fragments_in_covers' => $mappingArray,
                'status' => 'pending',
            ]);

            $document->update(['status' => 'mapped']);
            return $map->map_id;

        } catch (\Throwable $e) {
            $document->update(['status' => 'failed', 'error_message' => 'Mapping failed500: ' . $e->getMessage()]);
            return null;
        }
    }

    private function generate_text_cover(int $fragmentSize)
    {
        $maxId = DB::table('wiki_feeds')->max('id');
        if (!$maxId) throw new \Exception('No data in wiki_feeds');

        $targetSize = $fragmentSize / 0.02;
        $content = '';
        $capacity = 0;

        while (strlen($content) < $targetSize) {
            $randomId = rand(1, $maxId);
            $feed = DB::table('wiki_feeds')->where('id', $randomId)->first();
            if (!$feed) continue;

            $block = "pageid: {$feed->pageid}\ntitle: {$feed->title}\ncontent: {$feed->feed}\n\n";
            $content .= $block;
            $capacity = floor(strlen($content) * 0.02);
        }

        $fileName = bin2hex(random_bytes(16)) . "_cover_" . time() . ".txt";
        if (!file_exists(storage_path('app/private/temp/covers'))) {
            mkdir(storage_path('app/private/temp/covers'), 0755, true);
        }

        Storage::disk('local')->put("temp/covers/{$fileName}", $content);
        $filePath = storage_path('app/private/temp/covers/' . $fileName);

        return Cover::create([
            'cover_id' => (string) Str::uuid(),
            'type' => 'text',
            'filename' => $fileName,
            'path' => 'cover_texts/' . $fileName,
            'size_bytes' => strlen($content),
            'metadata' => ['valid' => true, 'capacity' => $capacity, 'info' => 'System-generated'],
            'hash' => hash('sha256', $content),
        ]);
    }

    private function fetchCoverFiles(string $mapId, array $cloudFiles)
    {
        $b2 = new B2Service();
        if (!file_exists(storage_path('app/private/temp/covers/'))) {
            mkdir(storage_path('app/private/temp/covers/'), 0755, true);
        }

        $map = FragmentMap::findOrFail($mapId);
        $mappedCovers = $map->fragments_in_covers;
        $document = Document::findOrFail($map->document_id);
        $cloudMap = collect($cloudFiles)->keyBy('fileName');
        $localCovers = [];

        foreach ($mappedCovers as $mappedCover) {
            $cover = Cover::findOrFail($mappedCover['cover_id']);
            $coverTempPath = storage_path('app/private/temp/covers/' . $cover->filename);
            $key = $this->getCoverFolder($cover->type) . trim(strval($cover->filename));

            if (!$cloudMap->has($key)) {
                if (file_exists($coverTempPath)) {
                    $localCovers[] = $coverTempPath;
                    continue;
                }
                throw new \Exception("Cover file missing from cloud and local: {$key} (Expected local path: {$coverTempPath})");
            }

            $file = $cloudMap[$key];
            $content = $b2->readfile($file['id']);
            file_put_contents($coverTempPath, $content);
            $localCovers[] = $coverTempPath;
        }

        return [
            'matched' => count($localCovers) === $document->fragment_count,
            'localCovers' => $localCovers
        ];
    }

    private function embedFragments(string $mapId, array $cloudFiles, array $localCovers)
    {
        $map = FragmentMap::findOrFail($mapId);
        $document = Document::findOrFail($map->document_id);
        $user = $document->user; // Use document owner
        $mapping = $map->fragments_in_covers;
        $b2 = new B2Service();
        $stegoMap = [];

        try {
            foreach ($mapping as $m) {
                $stegoMap[] = $this->embed($m['fragment_id'], $m['cover_id'], $cloudFiles, $localCovers);
            }

            $document->update(['status' => 'embedded']);

            $newStegoMap = StegoMap::create([
                'stego_map_id' => (string) Str::uuid(),
                'document_id' => $document->document_id,
                'status' => 'completed',
            ]);

            $stegoFileInfos = [];
            foreach ($stegoMap as $stego) {
                $info = $b2->storeFile($stego['stegoFile']);
                unlink($stego['stegoFile']);

                $sFile = StegoFile::create([
                    'stego_map_id' => $newStegoMap->stego_map_id,
                    'cloud_file_id' => $info['fileId'],
                    'fragment_id' => $stego['fragmentId'],
                    'offset' => $stego['offset'],
                    'filename' => basename($stego['stegoFile']),
                    'stego_size' => $info['contentLength'],
                    'status' => 'embedded',
                ]);

                $user->increment('storage_used', $sFile->stego_size);
                $document->increment('in_cloud_size', $sFile->stego_size);
            }

            $document->update(['status' => 'stored']);

        } catch (\Throwable $e) {
            $document->update(['status' => 'failed', 'error_message' => 'Embedding failed: ' . $e->getMessage()]);
            throw $e;
        }
    }

    private function embed(string $fragmentId, string $coverId, array $cloudFiles, array $localCovers)
    {
        $cover = Cover::findOrFail($coverId);
        if (!file_exists(storage_path('app/private/temp/bin'))) mkdir(storage_path('app/private/temp/bin'), 0755, true);
        if (!file_exists(storage_path('app/private/temp/cloud/'))) mkdir(storage_path('app/private/temp/cloud/'), 0755, true);

        $fileName = bin2hex(random_bytes(16)) . time() . $this->getExtension($cover->type);
        
        $coverFile = '';
        $localCovers = collect($localCovers)->flatten(1);
        foreach ($localCovers as $localCover) {
            if (basename($localCover) === $cover->filename) {
                $coverFile = $localCover;
                break;
            }
        }

        if (!$coverFile) {
            $expectedFiles = collect($localCovers)->map(fn($c) => basename($c))->implode(', ');
            throw new \Exception("Cover file '{$cover->filename}' not found in local temp storage. Available files: [{$expectedFiles}]");
        }

        $stegoFile = storage_path('app/private/temp/cloud/'. $fileName);
        $binaryFile = storage_path('app/private/temp/bin/'. $fileName . '.bin');

        $fragment = Fragment::findOrFail($fragmentId);
        file_put_contents($binaryFile, base64_decode($fragment->blob));

        $command = "python " . base_path('python_backend/embedding/' . $this->getScript($cover->type)) . " "
            . escapeshellarg($coverFile) . " "
            . escapeshellarg($stegoFile) . " "
            . escapeshellarg($binaryFile) . " 2>&1";

        $output = [];
        $status = 0;
        exec($command, $output, $status);

        if ($status !== 0) throw new \Exception("Embedding failed (py script error):\n" . implode("\n", $output));

        $offset = (int) end($output);

        if (isset($cover->metadata['info'])) $cover->forceDelete();
        if (file_exists($coverFile)) unlink($coverFile);
        if (file_exists($binaryFile)) unlink($binaryFile);

        return ['fragmentId' => $fragmentId, 'stegoFile' => $stegoFile, 'offset' => $offset];
    }

    private function getExtension(string $coverType): string
    {
        return match ($coverType) {
            'text' => '.txt', 'audio' => '.wav', 'image' => '.png',
            default => throw new \InvalidArgumentException("Unsupported cover type: $coverType"),
        };
    }

    private function getScript(string $coverType): string
    {
        return match ($coverType) {
            'text' => 'text/embed.py', 'audio' => 'audio/embed.py', 'image' => 'image/embed.py',
            default => throw new \InvalidArgumentException("Unsupported cover type: $coverType"),
        };
    }

    private function getCoverFolder(string $coverType): string
    {
        return match ($coverType) {
            'text' => 'cover_texts/', 'audio' => 'cover_audios/', 'image' => 'cover_images/',
            default => throw new \InvalidArgumentException("Unsupported cover type: $coverType"),
        };
    }
}

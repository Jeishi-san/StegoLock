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
use App\Models\DocumentActivity;
use App\Models\User;
use App\Notifications\AdminPoolAlert;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Log;

class ProcessSteganoJob implements ShouldQueue
{
    use Queueable;
    
    public $tries = 5;
    public $timeout = 300; // 5 minutes

    protected $documentId;
    protected $encryptedPath;
    protected $jobId;
    protected $jobTempPath;
    protected array $uploadedCloudFiles = []; // Track cloud file IDs for cleanup
    protected array $createdTempFiles = [];    // Track local temp files for cleanup

    /**
     * Create a new job instance.
     */
    public function __construct(int $documentId, string $encryptedPath)
    {
        $this->documentId = $documentId;
        $this->encryptedPath = $encryptedPath;
        $this->jobId = (string) Str::uuid();
        $this->jobTempPath = storage_path("app/private/temp/jobs/{$this->jobId}");
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $document = Document::findOrFail($this->documentId);
        Log::info("[SteganoJob] Starting document locking process.", [
            'document_id' => $this->documentId,
            'job_id' => $this->jobId,
            'filename' => $document->filename
        ]);

        try {
            // 1. Select Covers (Right-Sized Diversity)
            Log::info("[SteganoJob] Selecting covers based on capacity...", ['size' => $document->encrypted_size]);
            $selectedCovers = $this->selectCovers($document);
            Log::info("[SteganoJob] Covers selected.", ['count' => $selectedCovers->count()]);

            // 2. Fetch & Lock (Short-Term copy mutex)
            Log::info("[SteganoJob] Fetching covers from cloud/local cache...");
            $this->fetchAndLockCovers($selectedCovers);

            // 3. Fluid Splitting
            Log::info("[SteganoJob] Splitting document into fragments...");
            $this->splitDocument($document, $selectedCovers);

            // Immediate Cleanup of Encrypted Source (No longer needed after fragmentation)
            if (Storage::disk('local')->exists($this->encryptedPath)) {
                Storage::disk('local')->delete($this->encryptedPath);
                Log::info("[SteganoJob] Encrypted source file purged from temp storage.");
            }

            // 4. Embedding
            Log::info("[SteganoJob] Embedding fragments into covers...");
            $this->embedDocument($document);

            DocumentActivity::create([
                'document_id' => $this->documentId,
                'user_id' => $document->user_id,
                'action' => 'locking_completed',
                'metadata' => ['filename' => $document->filename]
            ]);

            Log::info("[SteganoJob] Document locking completed successfully.", ['document_id' => $this->documentId]);

        } catch (\Throwable $e) {
            Log::error("[SteganoJob] Document locking failed.", [
                'document_id' => $this->documentId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            $document->update([
                'status' => 'failed',
                'error_message' => $e->getMessage()
            ]);

            DocumentActivity::create([
                'document_id' => $this->documentId,
                'user_id' => $document->user_id,
                'action' => 'locking_failed',
                'metadata' => ['error' => $e->getMessage()]
            ]);
        } finally {
            $this->cleanup();
        }
    }

    /**
     * Cleans up local files after job completion (success or failure)
     */
    private function cleanup()
    {
        // 1. Delete the entire job-specific temp directory
        if (file_exists($this->jobTempPath)) {
            $this->safeDeleteFolder($this->jobTempPath);
            @rmdir($this->jobTempPath);
        }

        // 2. Delete the initial encrypted file
        if (Storage::exists($this->encryptedPath)) {
            Storage::delete($this->encryptedPath);
        }

        // 3. Purge system-generated cover records from database
        // These were only needed for the duration of this job's selection/mapping logic
        Cover::whereRaw("JSON_EXTRACT(metadata, '$.info') = 'System-generated'")
             ->where('in_use', false) // Only delete if not being used by another concurrent job
             ->delete();
    }

    private function safeDeleteFolder($path)
    {
        if (file_exists($path) && is_dir($path)) {
            $files = array_diff(scandir($path), ['.', '..']);
            foreach ($files as $file) {
                $filePath = $path . DIRECTORY_SEPARATOR . $file;
                if (is_dir($filePath)) {
                    $this->safeDeleteFolder($filePath);
                    @rmdir($filePath);
                } else {
                    @unlink($filePath);
                }
            }
        }
    }

    private function selectCovers(Document $document)
    {
        $payloadSize = $document->encrypted_size;
        
        // 1. Categorize Tier (Strict Boxing)
        if ($payloadSize > 2097152) { // > 2MB
            $tier = 'large';
            $minCap = 262144; // 256KB
            $maxCap = 104857600; // 100MB+
        } elseif ($payloadSize > 512000) { // 500KB - 2MB
            $tier = 'medium';
            $minCap = 65536; // 64KB
            $maxCap = 262144; // 256KB
        } else {
            $tier = 'small';
            $minCap = 1024; // 1KB
            $maxCap = 65536; // 64KB
        }

        $selectedCovers = collect();
        $remainingCapacity = $payloadSize;

        // 2. Mandate Selection (1 Text, 1 Audio, 1 Image)
        $types = ['text', 'audio', 'image'];
        
        foreach ($types as $type) {
            $cover = $this->findBestCover($type, $minCap, $maxCap, [], 'ASC');
            
            if (!$cover && $type === 'text') {
                $cover = $this->generate_text_cover($minCap);
            }

            if (!$cover) {
                // Fallback: try picking any capacity from this type if tier is empty
                $cover = $this->findBestCover($type, 0, 104857600, [], 'ASC');
            }

            if (!$cover) {
                $this->notifyAdmins("Critical: No covers of type '{$type}' available in pool.");
                throw new \Exception("Unavailable cover files ({$type}) to continue locking. Admin notified.");
            }

            $selectedCovers->push($cover);
            $remainingCapacity -= ($cover->metadata['capacity'] ?? 0);
        }

        // 3. Greedy Expansion (if 3 fragments aren't enough)
        while ($remainingCapacity > 0) {
            // During expansion, we pick DESC (largest) to ensure we fit the file within 15 fragments
            $cover = $this->findBestCover('image', 0, 104857600, $selectedCovers->pluck('cover_id')->toArray(), 'DESC');
            
            if (!$cover) {
                // Try audio if no images
                $cover = $this->findBestCover('audio', 0, 104857600, $selectedCovers->pluck('cover_id')->toArray(), 'DESC');
            }

            if (!$cover) {
                // Try text as final resort
                $cover = $this->findBestCover('text', 0, 104857600, $selectedCovers->pluck('cover_id')->toArray(), 'DESC');
            }

            if (!$cover) break;

            $selectedCovers->push($cover);
            $remainingCapacity -= ($cover->metadata['capacity'] ?? 0);
        }

        if ($remainingCapacity > 0) {
            $this->notifyAdmins("Critical: Total pool capacity exhausted for document (Size: {$payloadSize} bytes). No more covers available.");
            throw new \Exception("Insufficient total cover capacity. The pool has been exhausted. Admin notified.");
        }

        return $selectedCovers;
    }

    private function findBestCover(string $type, int $minCap, int $maxCap, array $excludeIds = [], string $order = 'ASC')
    {
        return Cover::where('type', $type)
            ->where('in_use', false)
            ->whereNotIn('cover_id', $excludeIds)
            ->where(function($query) use ($minCap, $maxCap) {
                $query->whereRaw("CAST(JSON_EXTRACT(metadata, '$.capacity') AS UNSIGNED) >= ?", [$minCap])
                      ->whereRaw("CAST(JSON_EXTRACT(metadata, '$.capacity') AS UNSIGNED) <= ?", [$maxCap]);
            })
            ->orderByRaw("CAST(JSON_EXTRACT(metadata, '$.capacity') AS UNSIGNED) {$order}") 
            ->first();
    }

    private function fetchAndLockCovers($covers)
    {
        $b2 = new B2Service();
        if (!file_exists($this->jobTempPath)) {
            mkdir($this->jobTempPath, 0755, true);
        }

        foreach ($covers as $cover) {
            // 1. Mark in_use (Short-term copy mutex)
            $cover->update(['in_use' => true]);

            try {
                if (isset($cover->metadata['info']) && $cover->metadata['info'] === 'System-generated') {
                    // System-generated covers are already in the job temp folder, skip B2
                    $localPath = storage_path('app/private/temp/covers/' . $cover->filename);
                    $targetPath = "{$this->jobTempPath}/{$cover->filename}";
                    if (file_exists($localPath)) {
                        copy($localPath, $targetPath);
                    } else {
                        throw new \Exception("System-generated cover missing locally: {$cover->filename}");
                    }
                } else {
                    $localPath = "{$this->jobTempPath}/{$cover->filename}";
                    $cachePath = storage_path("app/private/cache/covers/{$cover->filename}");

                    if (file_exists($cachePath)) {
                        copy($cachePath, $localPath);
                    } else {
                        $key = $this->getCoverFolder($cover->type) . $cover->filename;
                        $file = $b2->findFileByName($key);
                        if (!$file) throw new \Exception("Cover file not found in cloud: {$key}");
                        
                        $content = $b2->readfile($file['fileId']);
                        file_put_contents($localPath, $content);
                        
                        // Cache it
                        if (!file_exists(dirname($cachePath))) mkdir(dirname($cachePath), 0755, true);
                        copy($localPath, $cachePath);
                    }
                }

                $this->createdTempFiles[] = $localPath;

            } finally {
                // 2. Release immediately after copy
                $cover->update(['in_use' => false]);
            }
        }
    }

    private function splitDocument(Document $document, $covers)
    {
        $ciphertext = file_get_contents(Storage::path($this->encryptedPath));
        $offset = 0;
        $totalLength = strlen($ciphertext);
        $numCovers = $covers->count();
        
        $mappingArray = [];
        
        foreach ($covers as $index => $cover) {
            $remainingData = $totalLength - $offset;
            $remainingCovers = $numCovers - $index - 1;

            if ($remainingData <= 0) break;

            if ($remainingCovers > 0) {
                // Determine how much this cover should take
                $capacity = (int) ($cover->metadata['capacity'] ?? 0);
                
                // Safety: Leave at least 1 byte for each remaining cover
                $maxPossible = $remainingData - $remainingCovers;
                
                // Right-Sized Logic: 
                // For large files, we want to fill the capacity.
                // For small files, we want to distribute fairly.
                $fairShare = ceil($remainingData / ($remainingCovers + 1));
                
                // Take the larger of fairShare or capacity-limited pour, 
                // but never more than maxPossible and never more than capacity.
                $chunkSize = min($capacity, $maxPossible, max($fairShare, min($capacity, $remainingData)));
                
                // If the file is small relative to capacity, we'll end up with balanced fragments.
                // If the file is large, the first few will fill their capacity.
            } else {
                // Last cover takes everything else
                $chunkSize = $remainingData;
            }

            $chunk = substr($ciphertext, $offset, $chunkSize);
            
            $fragment = Fragment::create([
                'fragment_id' => (string) Str::uuid(),
                'document_id' => $document->document_id,
                'index' => $index,
                'blob' => base64_encode($chunk),
                'size' => strlen($chunk),
                'hash' => hash('sha256', $chunk),
                'status' => 'floating',
            ]);

            $mappingArray[] = [
                'fragment_id' => $fragment->fragment_id,
                'cover_id' => $cover->cover_id,
                'offset' => 0 
            ];

            $offset += $chunkSize;
        }

        FragmentMap::create([
            'map_id' => (string) Str::uuid(),
            'document_id' => $document->document_id,
            'fragments_in_covers' => $mappingArray,
            'status' => 'pending',
        ]);

        $document->update([
            'fragment_count' => count($mappingArray),
            'status' => 'fragmented'
        ]);
    }

    private function embedDocument(Document $document)
    {
        $document->update(['status' => 'mapped']);
        $map = FragmentMap::where('document_id', $document->document_id)->firstOrFail();
        $user = $document->user;
        $b2 = new B2Service();
        $stegoMap = [];

        foreach ($map->fragments_in_covers as $m) {
            $stegoMap[] = $this->embed($m['fragment_id'], $m['cover_id']);
        }

        $newStegoMap = StegoMap::create([
            'stego_map_id' => (string) Str::uuid(),
            'document_id' => $document->document_id,
            'status' => 'pending',
        ]);

        $stegoFilePaths = collect($stegoMap)->pluck('stegoFile')->toArray();
        Log::info("[SteganoJob] Uploading fragments to B2 cloud...", ['batch_size' => count($stegoFilePaths)]);
        $document->update(['status' => 'embedded']);
        
        $b2->storeFilesBatch($stegoFilePaths, 5, function($path, $info) use ($newStegoMap, $stegoMap, $document) {
            $stegoPath = 'locked/' . basename($path);
            Log::debug("[SteganoJob] Fragment uploaded.", ['filename' => basename($path), 'size' => $info['contentLength']]);
            $match = collect($stegoMap)->first(fn($s) => $s['stegoFile'] === $path);
            
            if ($match) {
                $sFile = StegoFile::create([
                    'stego_map_id' => $newStegoMap->stego_map_id,
                    'cloud_file_id' => $info['fileId'],
                    'fragment_id' => $match['fragmentId'],
                    'offset' => $match['offset'],
                    'filename' => basename($path),
                    'stego_size' => $info['contentLength'],
                    'status' => 'embedded',
                ]);
                $document->increment('in_cloud_size', $sFile->stego_size);
            }
            $this->uploadedCloudFiles[] = ['id' => $info['fileId'], 'path' => $stegoPath];
            if (file_exists($path)) @unlink($path);
        });

        $user->refreshStorageUsed();
        $newStegoMap->update(['status' => 'completed']);
        $document->update(['status' => 'stored']);
        Log::info("[SteganoJob] All fragments stored and database updated.");
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
        $this->createdTempFiles[] = $filePath;

        // Note: No B2 upload here as per user request. 
        // These covers stay local and are purged after the job.

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


    private function embed(string $fragmentId, string $coverId)
    {
        $cover = Cover::findOrFail($coverId);
        $binDir = "{$this->jobTempPath}/bin";
        $cloudDir = "{$this->jobTempPath}/cloud";
        
        if (!file_exists($binDir)) mkdir($binDir, 0755, true);
        if (!file_exists($cloudDir)) mkdir($cloudDir, 0755, true);

        $fileName = bin2hex(random_bytes(16)) . time() . $this->getExtension($cover->type);
        $coverFile = "{$this->jobTempPath}/{$cover->filename}";

        if (!file_exists($coverFile)) {
            throw new \Exception("Cover file '{$cover->filename}' missing for embedding.");
        }

        $stegoFile = "{$cloudDir}/{$fileName}";
        $binaryFile = "{$binDir}/{$fileName}.bin";
        $this->createdTempFiles[] = $stegoFile;
        $this->createdTempFiles[] = $binaryFile;

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

        if (isset($cover->metadata['info']) && $cover->metadata['info'] === 'System-generated') {
             $cover->delete(); // Cleanup temp cover record
        }

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

    private function notifyAdmins(string $message): void
    {
        $admins = User::whereIn('role', ['superadmin', 'db_storage_admin'])->get();
        if ($admins->isEmpty()) return;

        Notification::send($admins, new AdminPoolAlert(
            title: "Critical Cover Pool Alert",
            message: $message,
            type: 'critical_error',
            actionUrl: '/admin/covers'
        ));
    }
}

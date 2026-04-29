<?php

namespace App\Jobs;

use App\Config\Constant;
use App\Models\Document;
use App\Models\Fragment;
use App\Models\StegoFile;
use App\Models\StegoMap;
use App\Providers\B2Service;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Storage;
use App\Models\DocumentActivity;
use App\Models\DocumentShare;
use App\Services\CryptoService;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class ProcessUnlockJob implements ShouldQueue
{
    use Queueable;

    public $tries = 5;
    public $timeout = 600; // 10 minutes for larger files

    protected $documentId;
    protected $base64MasterKey;
    protected $userId;
    protected $jobId;
    protected $jobTempPath;

    /**
     * Create a new job instance.
     */
    public function __construct(int $documentId, string $base64MasterKey, int $userId = null)
    {
        $this->documentId = $documentId;
        $this->base64MasterKey = $base64MasterKey;
        $this->userId = $userId;
        $this->jobId = (string) Str::uuid();
        $this->jobTempPath = storage_path("app/private/temp/jobs/{$this->jobId}");
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $document = Document::findOrFail($this->documentId);
        Log::info("[UnlockJob] Starting optimized document unlocking process.", [
            'document_id' => $this->documentId,
            'job_id' => $this->jobId,
            'filename' => $document->filename
        ]);

        try {
            $b2 = new B2Service();

            DocumentActivity::create([
                'document_id' => $this->documentId,
                'user_id' => $this->userId ?? $document->user_id,
                'action' => 'unlocking_started',
                'metadata' => ['job_id' => $this->jobId]
            ]);

            // 1. Parallel Fetching
            Log::info("[UnlockJob] Fetching stego shards in parallel...");
            $this->updateStatus('retrieved');
            $stegoData = $this->fetchStegoFilesBatch($b2, $document);
            
            // 2. Batch Extraction
            Log::info("[UnlockJob] Extracting fragments via Batch Driver...");
            $this->updateStatus('extracted');
            $this->extractFragmentsBatch($stegoData['files']);
            
            // 3. Streaming Assembly (Low Memory)
            Log::info("[UnlockJob] Reassembling fragments into .stegolock container...");
            $stegolock_file = $this->assembleStreaming($document, $stegoData['files']);

            // 4. Decrypt
            Log::info("[UnlockJob] Final decryption phase...");
            $this->updateStatus('reconstructed');
            $this->decrypt($document, $stegolock_file);
            $this->updateStatus('decrypted');

            DocumentActivity::create([
                'document_id' => $this->documentId,
                'user_id' => $this->userId ?? $document->user_id,
                'action' => 'unlocked',
                'metadata' => ['job_id' => $this->jobId]
            ]);

            Log::info("[UnlockJob] Document unlocked successfully.", ['document_id' => $this->documentId]);
            $this->cleanup();

        } catch (\Throwable $e) {
            Log::error("[UnlockJob] Document unlocking failed.", [
                'document_id' => $this->documentId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            $this->updateStatus('failed', 'Unlocking failed: ' . $e->getMessage());
            $this->cleanup();

            DocumentActivity::create([
                'document_id' => $this->documentId,
                'user_id' => $this->userId ?? $document->user_id,
                'action' => 'unlocking_failed',
                'metadata' => ['error' => $e->getMessage()]
            ]);
        }
    }

    private function fetchStegoFilesBatch($b2, $document)
    {
        $stegoMap = StegoMap::where('document_id', $document->document_id)->firstOrFail();
        $stegoFiles = StegoFile::where('stego_map_id', $stegoMap->stego_map_id)->get();

        if ($document->fragment_count !== $stegoFiles->count()) {
            throw new \Exception("Corrupted file error: Mismatched fragment count");
        }

        $tempCloudDir = "{$this->jobTempPath}/cloud";
        if (!file_exists($tempCloudDir)) mkdir($tempCloudDir, 0755, true);

        // Prepare batch download list
        $downloadList = [];
        foreach ($stegoFiles as $file) {
            $downloadList[] = [
                'fileId' => $file->cloud_file_id,
                'savePath' => "{$tempCloudDir}/{$file->filename}"
            ];
        }

        // Run Parallel Download
        $b2->fetchFilesBatch($downloadList, 8); // Concurrency of 8

        return ['stego_map_id' => $stegoMap->stego_map_id, 'files' => $stegoFiles];
    }

    private function extractFragmentsBatch($stegoFiles)
    {
        $tempBinDir = "{$this->jobTempPath}/bin";
        if (!file_exists($tempBinDir)) mkdir($tempBinDir, 0755, true);

        $manifest = [];
        foreach ($stegoFiles as $file) {
            $type = pathinfo($file->filename, PATHINFO_EXTENSION);
            $manifest[] = [
                'id' => $file->fragment_id,
                'type' => $type,
                'stego_path' => "{$this->jobTempPath}/cloud/{$file->filename}",
                'output_path' => "{$tempBinDir}/{$file->filename}.bin",
                'offset' => $file->offset
            ];
        }

        // Save manifest for Python
        $manifestPath = "{$this->jobTempPath}/extract_manifest.json";
        file_put_contents($manifestPath, json_encode($manifest));

        // Call Batch Driver
        $command = config('app.python_binary', 'python') . " " . base_path('python_backend/batch_processor.py') . " " . escapeshellarg($manifestPath) . " 2>&1";
        $output = [];
        $status = 0;
        exec($command, $output, $status);

        if ($status !== 0) {
            throw new \Exception("Python Process Fatal Error: " . implode("\n", $output));
        }

        // Parse JSON results from the last line of output
        $lastLine = end($output);
        $results = json_decode($lastLine, true);

        if (!$results || !is_array($results)) {
            throw new \Exception("Invalid JSON response from Python: " . implode("\n", $output));
        }

        foreach ($results as $result) {
            if ($result['status'] === 'error') {
                throw new \Exception("Shard Extraction Failed (ID: {$result['id']}): " . ($result['message'] ?? 'Unknown error'));
            }
        }

        return true;
    }

    private function assembleStreaming($document, $stegoFiles)
    {
        // 1. Bulk load fragments and map them to their BIN paths
        $fragmentIds = $stegoFiles->pluck('fragment_id')->toArray();
        $fragments = Fragment::whereIn('fragment_id', $fragmentIds)->get()->keyBy('fragment_id');
        
        $tempBinDir = "{$this->jobTempPath}/bin/";
        $assemblyList = [];
        
        foreach ($stegoFiles as $sFile) {
            $frag = $fragments->get($sFile->fragment_id);
            if (!$frag) throw new \Exception("Missing fragment record: {$sFile->fragment_id}");
            
            $assemblyList[] = [
                'index' => $frag->index,
                'path' => $tempBinDir . $sFile->filename . '.bin',
                'hash' => $frag->hash
            ];
        }

        // 2. Sort by index
        usort($assemblyList, fn($a, $b) => $a['index'] <=> $b['index']);

        // 3. Stream to Disk (Low RAM usage)
        $tempRecDir = 'temp/reconstructed';
        if (!Storage::exists($tempRecDir)) Storage::makeDirectory($tempRecDir);
        
        $relativeOutputPath = $tempRecDir . '/' . bin2hex(random_bytes(16)) . time() . '.stegolock';
        $fullOutputPath = Storage::path($relativeOutputPath);
        
        $outHandle = fopen($fullOutputPath, 'wb');
        if (!$outHandle) throw new \Exception("Failed to open output stream: {$fullOutputPath}");

        foreach ($assemblyList as $item) {
            $inHandle = fopen($item['path'], 'rb');
            if (!$inHandle) throw new \Exception("Failed to open fragment stream: {$item['path']}");
            
            // Integrity Check + Stream
            $content = stream_get_contents($inHandle);
            if (hash('sha256', $content) !== $item['hash']) {
                fclose($inHandle);
                fclose($outHandle);
                throw new \Exception("Integrity breach detected in fragment index: " . $item['index']);
            }
            
            fwrite($outHandle, $content);
            fclose($inHandle);
            
            // Clean up bin fragment immediately
            @unlink($item['path']);
        }

        fclose($outHandle);
        return $relativeOutputPath;
    }

    private function decrypt($document, $stegolock_file)
    {
        $data = Storage::get($stegolock_file);
        if ($data === false) throw new \Exception('Encrypted file not found.');

        $nonceLen = Constant::NONCE_LEN;
        $tagLen = 16;

        $nonce = substr($data, 0, $nonceLen);
        $tag = substr($data, $nonceLen, $tagLen);
        $ciphertext = substr($data, $nonceLen + $tagLen);

        $cryptoService = new CryptoService();

        // Determine if we use document's key or share's key
        $keySource = $document;
        if ($this->userId && $document->user_id !== $this->userId) {
            $keySource = DocumentShare::where('document_id', $document->document_id)
                ->where('recipient_id', $this->userId)
                ->where('status', 'accepted')
                ->firstOrFail();
        }

        $dek = $cryptoService->unwrapDek(
            base64_decode($keySource->encrypted_dek),
            base64_decode($this->base64MasterKey),
            base64_decode($keySource->dek_nonce),
            base64_decode($keySource->dek_tag),
            base64_decode($keySource->dk_salt)
        );

        if ($dek === null || hash('sha256', $dek) !== $document->dek_hash) {
            throw new \Exception('Document Key integrity check failed. Wrong master key?');
        }

        $plaintext = $cryptoService->decrypt($ciphertext, $dek, $nonce, $tag);
        if ($plaintext === null) throw new \Exception('Decryption failed. Tampering or wrong key.');

        $decompressed = @gzuncompress($plaintext);
        if ($decompressed === false) throw new \Exception('Decompression failed.');
        $plaintext = $decompressed;

        // VERIFY FINAL INTEGRITY
        $actualHash = hash_hmac('sha256', $plaintext, config('app.key'));
        if (!hash_equals($document->file_hash, $actualHash)) {
            throw new \Exception('Final integrity check failed. File corrupted during reconstruction.');
        }

        $tempDecDir = 'temp/decrypted/' . ($this->userId ?? $document->user_id) . '/' . $document->document_id;
        if (!Storage::exists($tempDecDir)) Storage::makeDirectory($tempDecDir);

        $outputPath = $tempDecDir . '/' . $document->filename;
        Storage::put($outputPath, $plaintext);
        Storage::delete($stegolock_file);

        return $outputPath;
    }

    private function cleanup()
    {
        if (file_exists($this->jobTempPath)) {
            $this->safeDeleteDirectory($this->jobTempPath);
            @rmdir($this->jobTempPath);
        }
    }

    private function safeDeleteDirectory($dir) {
        if (!file_exists($dir)) return true;
        if (!is_dir($dir)) return unlink($dir);
        foreach (scandir($dir) as $item) {
            if ($item == '.' || $item == '..') continue;
            if (!$this->safeDeleteDirectory($dir . DIRECTORY_SEPARATOR . $item)) return false;
        }
        return rmdir($dir);
    }

    private function updateStatus($status, $errorMessage = null)
    {
        $document = Document::find($this->documentId);
        if (!$document) return;

        if ($this->userId && $document->user_id !== $this->userId) {
            $share = DocumentShare::where('document_id', $this->documentId)
                ->where('recipient_id', $this->userId)
                ->first();
            if ($share) $share->update(['processing_status' => $status]);
        } else {
            $document->update(['status' => $status, 'error_message' => $errorMessage]);
        }
    }
}

<?php

namespace App\Jobs;

use App\Models\Cover;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ScanCoversJob implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info("Starting background cover scan...");

        $this->scan('audio', 'wav', 'cover_audios', 'python_backend/embedding/audio/get_wav_embedding_capacity.py');
        $this->scan('image', 'png', 'cover_images', 'python_backend/embedding/image/check_image.py');
        $this->scan('text', 'txt', 'cover_texts', 'python_backend/embedding/text/check_text.py');

        Log::info("Cover scan completed.");
    }

    /**
     * Scans a specific folder for candidate cover files.
     */
    private function scan(string $type, string $extension, string $folderName, string $scriptPath)
    {
        $folderPath = storage_path("app/public/{$folderName}");
        if (!file_exists($folderPath)) {
            Log::warning("Scan directory does not exist: {$folderPath}");
            return;
        }

        $files = glob($folderPath . "/*.{$extension}");
        if (!$files) {
            return;
        }

        foreach ($files as $filePath) {
            try {
                $this->processFile($type, $filePath, $folderName, $scriptPath);
            } catch (\Exception $e) {
                Log::error("Failed to process cover file {$filePath}: " . $e->getMessage());
            }
        }
    }

    /**
     * Processes an individual file: validates capacity, checks for duplicates, uploads to cloud, and records in DB.
     */
    private function processFile(string $type, string $filePath, string $folderName, string $scriptPath)
    {
        $contents = file_get_contents($filePath);
        if ($contents === false) {
            throw new \Exception("Could not read file contents.");
        }
        
        $hash = hash('sha256', $contents);

        // Deduplication: Skip if a cover with the same hash already exists
        if (\App\Models\Cover::where('hash', $hash)->exists()) {
            return;
        }

        // Build Python command to get embedding capacity
        $command = config('app.python_binary', 'python') . " " . base_path($scriptPath) . " " . escapeshellarg($filePath) . " 2>&1";
        $output = [];
        $status = 0;
        exec($command, $output, $status);

        if ($status !== 0 || empty($output)) {
            Log::error("Script failure for {$filePath} (Status {$status}): " . implode("\n", $output));
            return;
        }

        $outputStr = trim(implode("\n", $output));
        $parts = explode(',', $outputStr);
        if (count($parts) < 2) {
            Log::error("Invalid script output for {$filePath}: {$outputStr}");
            return;
        }

        $usableBytes = (int) $parts[0];
        $totalBytes = (int) $parts[1];

        // STRICT ELIGIBILITY: 
        // 1. Script must return valid capacity
        // 2. Usable capacity must be at least 128KB to be useful for fragments
        $minCapacity = 128 * 1024; 

        if ($usableBytes >= $minCapacity) {
            // Standardize filename
            $extension = pathinfo($filePath, PATHINFO_EXTENSION);
            $randomHex = bin2hex(random_bytes(16));
            $newFilename = "{$randomHex}_cover_" . time() . ".{$extension}";
            $newFilePath = dirname($filePath) . DIRECTORY_SEPARATOR . $newFilename;

            if (rename($filePath, $newFilePath)) {
                $filePath = $newFilePath;
            }

            Log::info("Uploading cover to cloud: " . basename($filePath));

            // Upload to Backblaze B2
            try {
                $b2Service = new \App\Providers\B2Service();
                // B2Service::storeFile expects a local path and uploads to 'locked/'. 
                // We might want a 'covers/' prefix instead.
                // Let's modify storeFile or use a custom call.
                
                $upload = $b2Service->getUploadUrl();
                
                $prefixMap = [
                    'audio' => 'cover_audios',
                    'image' => 'cover_images',
                    'text' => 'cover_texts'
                ];
                $b2FileName = $prefixMap[$type] . '/' . basename($filePath);
                
                $sha1 = sha1_file($filePath);

                $client = new \GuzzleHttp\Client(['timeout' => 0]);
                $response = $client->request('POST', $upload['uploadUrl'], [
                    'headers' => [
                        'Authorization' => $upload['authorizationToken'],
                        'X-Bz-File-Name' => $b2FileName,
                        'Content-Type' => 'b2/x-auto',
                        'X-Bz-Content-Sha1' => $sha1,
                    ],
                    'body' => fopen($filePath, 'r'),
                ]);

                $b2Data = json_decode($response->getBody(), true);

                if (isset($b2Data['fileId'])) {
                    // Record in DB
                    \App\Models\Cover::create([
                        'cover_id' => (string) Str::uuid(),
                        'type' => $type,
                        'filename' => basename($filePath),
                        'path' => $b2FileName, // Cloud path
                        'size_bytes' => $totalBytes,
                        'metadata' => [
                            'valid' => true,
                            'capacity' => $usableBytes,
                            'b2_file_id' => $b2Data['fileId'],
                            'cloud_synced' => true
                        ],
                        'hash' => $hash,
                    ]);

                    // Clean up local file
                    unlink($filePath);
                    Log::info("Successfully synced cover to cloud and database: " . basename($filePath));
                }
            } catch (\Exception $e) {
                Log::error("Cloud upload failed for cover {$filePath}: " . $e->getMessage());
            }
        } else {
            // Move invalid files to a failed folder
            $failedFolder = storage_path('app/public/failed/');
            if (!file_exists($failedFolder)) {
                mkdir($failedFolder, 0755, true);
            }
            rename($filePath, $failedFolder . basename($filePath));
            Log::info("Moved invalid cover file to failed folder: " . basename($filePath));
        }
    }
}

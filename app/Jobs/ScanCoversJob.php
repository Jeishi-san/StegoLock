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
     * Processes an individual file: validates capacity, checks for duplicates, and records in DB.
     */
    private function processFile(string $type, string $filePath, string $folderName, string $scriptPath)
    {
        $contents = file_get_contents($filePath);
        if ($contents === false) {
            throw new \Exception("Could not read file contents.");
        }
        
        $hash = hash('sha256', $contents);

        // Deduplication: Skip if a cover with the same hash already exists
        if (Cover::where('hash', $hash)->exists()) {
            return;
        }

        // Build Python command to get embedding capacity
        $command = "python " . base_path($scriptPath) . " " . escapeshellarg($filePath) . " 2>&1";
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

        if ($usableBytes !== -1) {
            // Generate standardized filename: [hex]_cover_[timestamp].[ext]
            $extension = pathinfo($filePath, PATHINFO_EXTENSION);
            $randomHex = bin2hex(random_bytes(16));
            $newFilename = "{$randomHex}_cover_" . time() . ".{$extension}";
            $newFilePath = dirname($filePath) . DIRECTORY_SEPARATOR . $newFilename;

            // Rename the physical file on disk
            if (rename($filePath, $newFilePath)) {
                $filePath = $newFilePath;
            }

            // Store data to table if file qualified for embedding
            Cover::create([
                'cover_id' => (string) Str::uuid(),
                'type' => $type,
                'filename' => basename($filePath),
                'path' => "{$folderName}/" . basename($filePath), // Relative path for Storage facade
                'size_bytes' => $totalBytes,
                'metadata' => [
                    'valid' => true,
                    'capacity' => $usableBytes
                ],
                'hash' => $hash,
            ]);
            Log::info("Successfully scanned and standardized cover: " . basename($filePath));
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

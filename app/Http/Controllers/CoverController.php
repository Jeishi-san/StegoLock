<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\Cover;
use App\Jobs\MapFragmentsToCoversJob;
use App\Jobs\EncryptDocumentJob;


class CoverController extends Controller
{
    public function scan_cover(Request $request)
    {
        //$this->scan_text();
        $this->scan_audio();
        $this->scan_image();

        //return back()->with('success', 'mapping');

        // try {
        //     MapFragmentsToCoversJob::dispatchSync(95);
        // } catch (\Exception $e) {
        //     return back()->with('error', 'Failed to dispatch job');
        // }
    }

    public function scan_audio()
    {
        //scan cover audios, validate for lsb embedding
        $folder = storage_path('app/public/cover_audios');

        // Scan folder for WAV files
        $files = glob($folder . '/*.wav');

        foreach ($files as $filePath) {
            // Build Python command
            $command = "python " . base_path('python_backend/embedding/audio/get_wav_embedding_capacity.py') . " "
            . escapeshellarg($filePath) . " 2>&1";

            $output = [];
            $status = 0;

            exec($command, $output, $status);

            if ($status !== 0) continue; // skip if failed

            $outputStr = implode("\n", $output);

            [$usable_bytes, $total_bytes] = explode(',', trim($outputStr));
            $usable_bytes = (int)$usable_bytes;
            $total_bytes = (int)$total_bytes;

            $contents = file_get_contents($filePath);

            $metadata = [
                'valid' => $usable_bytes !== -1,
                'capacity' => $usable_bytes !== -1 ? $usable_bytes : 0
            ];

            if ($usable_bytes !== -1) {
                //store data to table if file qualified for lsb embedding
                Cover::create([
                    'cover_id' => (string) Str::uuid(),      // generate UUID for PK
                    'type' => 'audio',
                    'filename' => basename($filePath),
                    'path' => 'cover_audios/' . basename($filePath), // storage path
                    'size_bytes' => $total_bytes,
                    'metadata' => $metadata,
                    'hash' => hash('sha256', $contents),
                ]);
            }else {
                $failedFolder = storage_path('app/public/failed/');
                if (!file_exists($failedFolder)) {
                    mkdir($failedFolder, 0755, true);
                }
                // move the file
                rename($filePath, $failedFolder . basename($filePath));
                //delete file in app/public/cover_audios
                Storage::delete($filePath);
            }
        }

        // TEST CODE
        /*
        //scan cover audios, validate for lsb embedding
        $folder = storage_path('app/public/cover_audios');

        $results = [];
        // Scan folder for WAV files
        $files = glob($folder . '/*.wav');

        foreach ($files as $filePath) {
            // Build Python command
            $command = "python " . base_path('python_backend/embedding/audio/get_wav_embedding_capacity.py') . " "
            . escapeshellarg($filePath) . " 2>&1";

            $output = [];
            $status = 0;

            exec($command, $output, $status);

            if ($status !== 0) continue; // skip if failed

            $outputStr = implode("\n", $output);

            [$usable_bytes, $total_bytes] = explode(',', trim($outputStr));
            $usable_bytes = (int)$usable_bytes;
            $total_bytes = (int)$total_bytes;

            $metadata = [
                'valid' => $usable_bytes !== -1,
                'capacity' => $usable_bytes !== -1 ? $usable_bytes : 0
            ];

            if ($usable_bytes !== -1) {
                $results[] = [
                    'file' => basename($filePath),
                    'metadata' => $metadata
                ];
            } else {
                $failedFolder = storage_path('app/public/failed/');
                if (!file_exists($failedFolder)) {
                    mkdir($failedFolder, 0755, true);
                }
                // move the file
                rename($filePath, $failedFolder . basename($filePath));
                //delete file in app/public/cover_audios
                Storage::delete($filePath);
            }
        }

        dd($results);
        */

        //single file test
        // $wavPath = storage_path('app/public/cover_audios/sample.wav');
        // $output = exec("python3 python_backend/embedding/audio/get_wav_capacity.py {$wavPath}");
        // $capacity = (int) $output;

        // if ($capacity === -1) {
        //     // Not valid
        // } else {
        //     // Valid, capacity in bytes
        // }

        //alternative command
        // $command = "python " . base_path('python_backend/embedding/audio/embed.py') . " "
        //     . escapeshellarg($inputWAV) . " "
        //     . escapeshellarg($outputWAV) . " "
        //     . escapeshellarg($dataFile) . " 2>&1";
    }

    public function scan_image()
    {
        // //scan cover images, validate for lsb embedding
        $folder = storage_path('app/public/cover_images');

        // Scan folder for PNG files
        $files = glob($folder . '/*.png');

        foreach ($files as $filePath) {
            // Build Python command
            $command = "python " . base_path('python_backend/embedding/image/check_image.py') . " "
            . escapeshellarg($filePath) . " 2>&1";

            $output = [];
            $status = 0;

            exec($command, $output, $status);

            if ($status !== 0) continue; // skip if failed

            $outputStr = implode("\n", $output);

            [$usable_bytes, $total_bytes] = explode(',', trim($outputStr));
            $usable_bytes = (int)$usable_bytes;
            $total_bytes = (int)$total_bytes;

            $contents = file_get_contents($filePath);

            $metadata = [
                'valid' => $usable_bytes !== -1,
                'capacity' => $usable_bytes !== -1 ? $usable_bytes : 0
            ];

            if ($usable_bytes !== -1) {
                //store data to table if file qualified for lsb embedding
                Cover::create([
                    'cover_id' => (string) Str::uuid(),      // generate UUID for PK
                    'type' => 'image',
                    'filename' => basename($filePath),
                    'path' => 'cover_images/' . basename($filePath), // storage path
                    'size_bytes' => $total_bytes,
                    'metadata' => $metadata,
                    'hash' => hash('sha256', $contents),
                ]);
            } else {
                $failedFolder = storage_path('app/public/failed/');
                if (!file_exists($failedFolder)) {
                    mkdir($failedFolder, 0755, true);
                }
                // move the file
                rename($filePath, $failedFolder . basename($filePath));
                //delete file in app/public/cover_images
                Storage::delete($filePath);
            }
        }

        //TEST CODE
        /*
        $folder = storage_path('app/public/cover_images');

        $results = [];
        // Scan folder for WAV files
        $files = glob($folder . '/*.png');

        foreach ($files as $filePath) {
            // Build Python command
            $command = "python " . base_path('python_backend/embedding/image/check_image.py') . " "
            . escapeshellarg($filePath) . " 2>&1";

            $output = [];
            $status = 0;

            exec($command, $output, $status);

            if ($status !== 0) continue; // skip if failed

            $outputStr = implode("\n", $output);

            [$usable_bytes, $total_bytes] = explode(',', trim($outputStr));
            $usable_bytes = (int)$usable_bytes;
            $total_bytes = (int)$total_bytes;

            $metadata = [
                'valid' => $usable_bytes !== -1,
                'capacity' => $usable_bytes !== -1 ? $usable_bytes : 0
            ];

            if ($usable_bytes !== -1) {
                $results[] = [
                    'file' => basename($filePath),
                    'metadata' => $metadata
                ];
            } else {
                $failedFolder = storage_path('app/public/failed/');
                if (!file_exists($failedFolder)) {
                    mkdir($failedFolder, 0755, true);
                }
                // move the file
                rename($filePath, $failedFolder . basename($filePath));
                //delete file in app/public/cover_images
                Storage::delete($filePath);
            }
        }

        dd($results);
        */
    }

    public function scan_text()
    {
        //scan cover text, validate for lsb embedding
        $folder = storage_path('app/public/cover_texts');

        // Scan folder for TXT files
        $files = glob($folder . '/*.txt');

        foreach ($files as $filePath) {
            // Build Python command
            $command = "python " . base_path('python_backend/embedding/text/check_text.py') . " "
            . escapeshellarg($filePath) . " 2>&1";

            $output = [];
            $status = 0;

            exec($command, $output, $status);

            if ($status !== 0) continue; // skip if failed

            $outputStr = implode("\n", $output);

            [$usable_bytes, $total_bytes] = explode(',', trim($outputStr));
            $usable_bytes = (int)$usable_bytes;
            $total_bytes = (int)$total_bytes;

            $contents = file_get_contents($filePath);

            $metadata = [
                'valid' => $usable_bytes !== -1,
                'capacity' => $usable_bytes !== -1 ? $usable_bytes : 0
            ];

            if ($usable_bytes !== -1) {
                //store data to table if file qualified for lsb embedding
                Cover::create([
                    'cover_id' => (string) Str::uuid(),      // generate UUID for PK
                    'type' => 'text',
                    'filename' => basename($filePath),
                    'path' => 'cover_texts/' . basename($filePath), // storage path
                    'size_bytes' => $total_bytes,
                    'metadata' => $metadata,
                    'hash' => hash('sha256', $contents),
                ]);
            } else {
                $failedFolder = storage_path('app/public/failed/');
                if (!file_exists($failedFolder)) {
                    mkdir($failedFolder, 0755, true);
                }
                // move the file
                rename($filePath, $failedFolder . basename($filePath));
                //delete file in app/public/cover_text
                Storage::delete($filePath);
            }
        }

        //TEST CODE
        /*
        $folder = storage_path('app/public/cover_texts');

        $results = [];
        // Scan folder for TXT files
        $files = glob($folder . '/*.txt');

        foreach ($files as $filePath) {
            // Build Python command
            $command = "python " . base_path('python_backend/embedding/text/check_text.py') . " "
            . escapeshellarg($filePath) . " 2>&1";

            $output = [];
            $status = 0;

            exec($command, $output, $status);

            if ($status !== 0) continue; // skip if failed

            $outputStr = implode("\n", $output);

            [$usable_bytes, $total_bytes] = explode(',', trim($outputStr));
            $usable_bytes = (int)$usable_bytes;
            $total_bytes = (int)$total_bytes;

            $metadata = [
                'valid' => $usable_bytes !== -1,
                'capacity' => $usable_bytes !== -1 ? $usable_bytes : 0
            ];

            if ($usable_bytes !== -1) {
                $results[] = [
                    'file' => basename($filePath),
                    'metadata' => $metadata
                ];
            } else {
                $failedFolder = storage_path('app/public/failed/');
                if (!file_exists($failedFolder)) {
                    mkdir($failedFolder, 0755, true);
                }
                // move the file
                rename($filePath, $failedFolder . basename($filePath));
                //delete file in app/public/cover_images
                Storage::delete($filePath);
            }
        }

        dd($results);
        */
    }

    public function generate_cover_text_file(Request $fragmentSize)
    {
        //$fragmentSize should be 2% of the text file size
    }

}

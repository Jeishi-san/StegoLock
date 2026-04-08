<?php

namespace App\Jobs;

use App\Models\Document;
use App\Models\Fragment;
use App\Models\Cover;
use App\Models\FragmentMap;
use App\Models\StegoFile;
use App\Models\StegoMap;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use App\Providers\B2Service;
use Illuminate\Support\Facades\Auth;

class EmbedFragmentsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected string $mapId;
    protected array $cloudFiles;
    protected array $localCovers;
    protected array $stegoFiles;

    public function __construct(string $mapId)
    {
        $this->mapId = $mapId;
    }

    public function handle()
    {
        try
        {
            $isFetched = $this->fetchCoverFiles();
            if(!$isFetched) {
                throw new \Exception("Cover mismatch");
            }
            $this->embedFragments();
        } catch (\Throwable $e) {
            throw new \Exception("Error: " . $e->getMessage());
        }

    }

    private function fetchCoverFiles() //fetch cover files from the cloud and create cover file copies in local storage for embedding
    {
        //fetch cover files from cloud
        $b2 = new B2Service();
        $files = $b2->listFiles();
        $this->cloudFiles = $files['files'];

        //create local copies of cover files
        if (!file_exists(storage_path('app/private/temp/covers/'))) {
            mkdir(storage_path('app/private/temp/covers/'), 0755, true);
        }

        $map = FragmentMap::findOrFail($this->mapId);
        $mappedCovers = $map->fragments_in_covers;

        $document = Document::findOrFail($map->document_id);

        foreach ($mappedCovers as $mappedCover) {
            $cover = Cover::findOrFail($mappedCover['cover_id']);

            if ($cover) {
                $coverTempPath = storage_path('app/private/temp/covers/' . basename($cover->path));
                try {
                    foreach ($this->cloudFiles as $file) {
                        if ($file['fileName'] === $cover->path) {
                            $content = $b2->readfile($file['fileId']); //binary
                            file_put_contents($coverTempPath, $content); //saving cover to temp storage
                            $this->localCovers[] = $coverTempPath;
                            break;
                        }
                    }
                } catch (\Throwable $e) {
                    throw new \Exception("Cloud fetch failed: " . $e->getMessage());
                }
            } else throw new \Exception("Cover not found");
        }


        return count($this->localCovers) === $document->fragment_count;
    }

    private function embedFragments()
    {
        $user = Auth::user();

        $map = FragmentMap::findOrFail($this->mapId);
        $document = Document::findOrFail($map->document_id);
        $mapping = $map->fragments_in_covers;

        $b2 = new B2Service();
        try {
            $stegoMap = [];

            foreach ($mapping as $map) {
                $stegoMap[] = $this->embed($map['fragment_id'], $map['cover_id']);
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
            $stegoFileInfos = [];
            foreach ($this->stegoFiles as $filePath) {
                $stegoFileInfos[] = $b2->storeFile($filePath);
                unlink($filePath);
            }

            foreach ($stegoFileInfos as $stegoFile) {
                foreach ($stegoMap as $stego) {
                    if ($stegoFile['fileName'] === 'locked/' . $stego['stegoFile']) {
                        $sFile = StegoFile::create([
                            'stego_map_id' => $newStegoMap->stego_map_id,
                            'cloud_file_id' => $stegoFile['fileId'],
                            'fragment_id' => $stego['fragmentId'],
                            'offset' => $stego['offset'],
                            'filename' => $stego['stegoFile'],
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

            //return back()->with('success', 'Embedded and stored.');

        } catch (\Throwable $e) {
            // Update document with failure info
            $document->update([
                'status' => 'failed',
                'error_message' => ['Embedding failed (basecode error): ', $e->getMessage()]
            ]);

            //return back()->withErrors('errors', [$e->getMessage(), $document->error_message]);
        }
    }

    private function embed(string $fragmentId, string $coverId)
    {
        $cover = Cover::findOrFail($coverId);

        //generate random name for stego file
        $fileName = bin2hex(random_bytes(16)) . time() . $this->getExtension($cover->type);

        $lockedSet = collect($this->cloudFiles)
            ->pluck('fileName')
            ->flip(); // makes keys = fileName

        do {
            $fileName = bin2hex(random_bytes(16)) . time() . $this->getExtension($cover->type);
            $fullName = 'locked/' . $fileName;
        } while ($lockedSet->has($fullName));

        $coverFile = '';
        foreach ($this->localCovers as $localCover) {
            if (basename($localCover) === $cover->filename) {
                $coverFile = $localCover;
                break;
            }
        }

        $stegoFile = storage_path('app/private/temp/cloud/'. $fileName);
        $binaryFile = storage_path('app/private/temp/bin/'. $fileName . '.bin');

        if (!file_exists(storage_path('app/private/temp/bin'))) {
            mkdir(storage_path('app/private/temp/bin'), 0755, true);
        }

        if (!file_exists(storage_path('app/private/temp/cloud/'))) {
            mkdir(storage_path('app/private/temp/cloud/'), 0755, true);
        }

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

        if ($status !== 0) {
            throw new \Exception("Embedding failed (py script error):\n" . implode("\n", $output));
        }

        $offset = (int) end($output);

        $this->stegoFiles[] = $stegoFile;

        // // Optional: log success

        // Safe to delete temp files
        unlink($coverFile);
        unlink($binaryFile);

        return ['fragmentId' => $fragmentId, 'stegoFile' => basename($stegoFile), 'offset' => $offset];

    }

    private function storeStegoFiles(string $filePath) //store to cloud
    {
        //saving stego file to cloud storage
        $b2 = new B2Service();
        try {
            $data = $b2->storeFile($filePath);

            if (!$data) {
                throw new \Exception('Cloud storage failed');
            }

        } catch (\Throwable $e) {
            throw new \Exception("Cloud storage failed: " . $e->getMessage());
        }
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

    private function lsb_on_txt(): void //single file embedding
    {
        //TEXT FILE EMBEDDING
        $inputText = storage_path('app/public/cover_texts/0b4de9fe5810de20801214a9d3bcb224_cover_1774372552.txt');
        $outputText = storage_path('app/public/cloud_storage/output.txt');
        $dataFile = storage_path('app/private/bin/fragment.bin');

        if (!file_exists(storage_path('app/private/bin'))) {
            mkdir(storage_path('app/private/bin'), 0755, true);
        }

        if (!file_exists(storage_path('app/public/cloud_storage/'))) {
            mkdir(storage_path('app/public/cloud_storage/'), 0755, true);
        }

        //        $fragment = Fragment::findOrFail($this->fragmentId);
        $fragmentBinaryData = base64_decode('2ulaCsu8D1Y0f/4srqOau4D+Bxo0vvbfRoD62XNj1K4jU+2j0BSKhT0r7HkfNtnZ/6UWxQRp7SX1EjMDiHYYD3qpjZZWUm9H5YFwioY1wDdMgOXVdf9uyM4EpMX3jP/8krxXmo6wllH9JSUaKFfB/UCr736YH5PN94rXLcZIpFZYFzcnr4U5SAmukD+C9/S6JEcv1DL0+xzTbcxWU9CqamZ4/vpabQCuBXieVSAR+euL7G6Oelfm1a9hXiMdDi98Pn0YTR2TQVstrPUGZv/YpJ/DUwCZndXrT60jmDqocGzLMx2HXQHnoUl2FroNoH1FyyvGrGd08ee+sAehfiyWCofrJT35q/U8h9Pdr/6zV2B1KQTKtTshND43BcLxLAvCBBIPlBgvikzvXsBYll34MXp1laP3HzY7chmTAmr0+ZvtRZRkvqUr7C2VdEsm9tFYuUrrbKKizLfhsW6tqvqtMp659RE3owdltTBCtpWld0hSbRE1ZAc7HZAf/OQeDDKl/MGcXIi8q9dbWauoYq9fDA4Fgn4/Ay1ExDMKc1ovq/z+GH4WIRQxnAhcmFI1NO/7FhB8IH10ajKNgMDzpB8CAE1Gl8szaxaj9XAXuGRu2hU9nEBMNVxDCMildjpmt6Rad/83EFvl0Sio9WvkeMcMi/j7I6yNa4LMf/mqAm4LUiMax0KSZfV9GaMPteXN5LThgdxcTJTsmUZbIl8ZTs+1iQ==');

        file_put_contents($dataFile, $fragmentBinaryData);

        //dd(storage_path('app/temp/fragment.bin'));

        // if (!file_exists($dataFile)) {
        //     throw new \Exception("fragment.bin was NOT created");
        // }

        // if (filesize($dataFile) === 0) {
        //     throw new \Exception("fragment.bin is EMPTY");
        // }

        $command = "python " . base_path('python_backend/embedding/text/embed.py') . " "
            . escapeshellarg($inputText) . " "
            . escapeshellarg($outputText) . " "
            . escapeshellarg($dataFile) . " 2>&1"; // capture errors

        $output = [];
        $status = 0;

        exec($command, $output, $status);

        if ($status !== 0) {
            throw new \Exception("Embedding failed:\n" . implode("\n", $output));
        }

        // The last line of output is the offset
        $offset = (int) end($output);

        dd($offset); //785543

        // Optional: log success
        // logger()->info("Embedding successful", [
        //     'offset' => $offset,
        //     'output_file' => $outputText,
        // ]);

        //delete fragment.bin
        //unlink($dataFile);
    }

    private function lsb_on_img(): void //single file embedding
    {
        $inputImage = storage_path('app/public/cover_images/Alarcos_(Ciudad_Real)_cerro_y_asentamiento_íbero_(RPS_25-08-2012).png');
        $outputImage = storage_path('app/public/cloud_storage/output.png');
        $dataFile   = storage_path('app/private/bin/fragment_img.bin');

        $fragmentBinaryData = base64_decode('2ulaCsu8D1Y0f/4srqOau4D+Bxo0vvbfRoD62XNj1K4jU+2j0BSKhT0r7HkfNtnZ/6UWxQRp7SX1EjMDiHYYD3qpjZZWUm9H5YFwioY1wDdMgOXVdf9uyM4EpMX3jP/8krxXmo6wllH9JSUaKFfB/UCr736YH5PN94rXLcZIpFZYFzcnr4U5SAmukD+C9/S6JEcv1DL0+xzTbcxWU9CqamZ4/vpabQCuBXieVSAR+euL7G6Oelfm1a9hXiMdDi98Pn0YTR2TQVstrPUGZv/YpJ/DUwCZndXrT60jmDqocGzLMx2HXQHnoUl2FroNoH1FyyvGrGd08ee+sAehfiyWCofrJT35q/U8h9Pdr/6zV2B1KQTKtTshND43BcLxLAvCBBIPlBgvikzvXsBYll34MXp1laP3HzY7chmTAmr0+ZvtRZRkvqUr7C2VdEsm9tFYuUrrbKKizLfhsW6tqvqtMp659RE3owdltTBCtpWld0hSbRE1ZAc7HZAf/OQeDDKl/MGcXIi8q9dbWauoYq9fDA4Fgn4/Ay1ExDMKc1ovq/z+GH4WIRQxnAhcmFI1NO/7FhB8IH10ajKNgMDzpB8CAE1Gl8szaxaj9XAXuGRu2hU9nEBMNVxDCMildjpmt6Rad/83EFvl0Sio9WvkeMcMi/j7I6yNa4LMf/mqAm4LUiMax0KSZfV9GaMPteXN5LThgdxcTJTsmUZbIl8ZTs+1iQ==');

        file_put_contents($dataFile, $fragmentBinaryData);

        $command = "python " . base_path('python_backend/embedding/image/embed.py') . " "
            . escapeshellarg($inputImage) . " "
            . escapeshellarg($outputImage) . " "
            . escapeshellarg($dataFile) . " 2>&1"; // capture errors

        exec($command, $output, $status);

        if ($status !== 0) {
            throw new \Exception("Embedding failed:\n" . implode("\n", $output));
        }
    }

    public function lsb_on_audio(): void //single file embedding
    {
        $inputWAV = storage_path('app/public/cover_audios/470716__adrian-_-115__09_ladridos.wav');
        $outputWAV = storage_path('app/public/cloud_storage/output2.wav');
        $dataFile   = storage_path('app/private/bin/fragment_wav2.bin');

        $fragmentBinaryData = base64_decode('2ulaCsu8D1Y0f/4srqOau4D+Bxo0vvbfRoD62XNj1K4jU+2j0BSKhT0r7HkfNtnZ/6UWxQRp7SX1EjMDiHYYD3qpjZZWUm9H5YFwioY1wDdMgOXVdf9uyM4EpMX3jP/8krxXmo6wllH9JSUaKFfB/UCr736YH5PN94rXLcZIpFZYFzcnr4U5SAmukD+C9/S6JEcv1DL0+xzTbcxWU9CqamZ4/vpabQCuBXieVSAR+euL7G6Oelfm1a9hXiMdDi98Pn0YTR2TQVstrPUGZv/YpJ/DUwCZndXrT60jmDqocGzLMx2HXQHnoUl2FroNoH1FyyvGrGd08ee+sAehfiyWCofrJT35q/U8h9Pdr/6zV2B1KQTKtTshND43BcLxLAvCBBIPlBgvikzvXsBYll34MXp1laP3HzY7chmTAmr0+ZvtRZRkvqUr7C2VdEsm9tFYuUrrbKKizLfhsW6tqvqtMp659RE3owdltTBCtpWld0hSbRE1ZAc7HZAf/OQeDDKl/MGcXIi8q9dbWauoYq9fDA4Fgn4/Ay1ExDMKc1ovq/z+GH4WIRQxnAhcmFI1NO/7FhB8IH10ajKNgMDzpB8CAE1Gl8szaxaj9XAXuGRu2hU9nEBMNVxDCMildjpmt6Rad/83EFvl0Sio9WvkeMcMi/j7I6yNa4LMf/mqAm4LUiMax0KSZfV9GaMPteXN5LThgdxcTJTsmUZbIl8ZTs+1iQ==');

        file_put_contents($dataFile, $fragmentBinaryData);

        $command = "python " . base_path('python_backend/embedding/audio/embed.py') . " "
            . escapeshellarg($inputWAV) . " "
            . escapeshellarg($outputWAV) . " "
            . escapeshellarg($dataFile) . " 2>&1"; // capture errors

        exec($command, $output, $status);

        if ($status !== 0) {
            throw new \Exception("Embedding failed:\n" . implode("\n", $output));
        }
    }
}

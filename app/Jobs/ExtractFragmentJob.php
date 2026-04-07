<?php

namespace App\Jobs;

use App\Models\Document;
use App\Models\StegoMap;
use App\Models\Fragment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use App\Providers\B2Service;

class ExtractFragmentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected string $stego_map_id;
    protected array $stegoFiles;
    protected array $fragmentBin;

    public function __construct(string $stego_map_id, array $stegoFiles)
    {
        $this->stego_map_id = $stego_map_id;
        $this->stegoFiles = $stegoFiles;
        $this->fragmentBin = [];
    }

    public function handle()
    {
        $stegoMap = StegoMap::findOrFail($this->stego_map_id);
        $document = Document::findOrFail($stegoMap->document_id);

        $stegoFiles = [];

        $textFiles = [];
        $imageFiles = [];
        $audioFiles = [];

        try
        {
            foreach ($this->stegoFiles as $file) {

                $stegoFiles[] = [
                    'filename' => pathinfo($file['filename'], PATHINFO_FILENAME),
                    'type' => pathinfo($file['filename'], PATHINFO_EXTENSION),
                    'fragment_id' => $file['fragment_id'],
                    'offset' => $file['offset']
                ];

            }

            //separate file type according to files
            foreach ($stegoFiles as $file) {
                if ($file['type'] === 'txt') {
                    $textFiles[] = $file;
                } elseif ($file['type'] === 'png' || $file['type'] === 'jpg' || $file['type'] === 'jpeg') {
                    $imageFiles[] = $file;
                } elseif ($file['type'] === 'mp3' || $file['type'] === 'wav') {
                    $audioFiles[] = $file;
                } else {
                    throw new \RuntimeException("Invalid stego file type: {$file['type']}");
                }
            }

            // extraction proper

            //text extraction
            foreach ($textFiles as $file) {
                $this->extract_from_txt($file);
            }
            foreach ($imageFiles as $file) {
                $this->extract_from_img($file);
            }
            foreach ($audioFiles as $file) {
                $this->extract_from_audio($file);
            }

            // Update document status
            $document->update([
                'status' => 'extracted',
            ]);

            //dispatch reconstruction
            AssembleFragmentsJob::dispatchSync($document->document_id, $this->fragmentBin);

        } catch (\Exception $e) {
            // Handle extraction errors
            $document->update([
                'status' => 'failed',
                'error_message' => ("Error extracting fragments: " . $e->getMessage())
            ]);
        }

    }

    public function extract_from_txt(array $file): void
    {
        $stegoText = storage_path('app/private/temp/cloud/' . $file['filename'] . '.txt');
        $fragmentBin = storage_path('app/private/temp/bin/'. $file['filename'] .'.bin');
        $offset = $file['offset'];

        $command = "python " . base_path('python_backend/embedding/text/extract.py') . " "
            . escapeshellarg($stegoText) . " "
            . escapeshellarg($fragmentBin) . " "
            . escapeshellarg($offset) . " 2>&1";

        $output = [];
        $status = 0;

        exec($command, $output, $status);

        if ($status !== 0) {
            throw new \Exception("Extraction failed:\n" . implode("\n", $output));
        }

        $this->fragmentBin[] = [$file['fragment_id'], $file['filename']];

        unlink($stegoText);
    }

    public function extract_from_img(array $file): void
    {
        $stegoImage = storage_path('app/private/temp/cloud/' . $file['filename'] . '.png');
        $fragmentBin = storage_path('app/private/temp/bin/'. $file['filename'] .'.bin');

        $command = "python " . base_path('python_backend/embedding/image/extract.py') . " "
            . escapeshellarg($stegoImage) . " "
            . escapeshellarg($fragmentBin);

        exec($command, $output, $status);

        if ($status !== 0) {
            throw new \Exception("Extraction failed:\n" . implode("\n", $output));
        }

        $this->fragmentBin[] = [$file['fragment_id'], $file['filename']];

        unlink($stegoImage);
    }

    public function extract_from_audio(array $file): void
    {
        $stegoWAV = storage_path('app/private/temp/cloud/' . $file['filename'] . '.wav');
        $fragmentBin = storage_path('app/private/temp/bin/'. $file['filename'] .'.bin');

        $command = "python " . base_path('python_backend/embedding/audio/extract.py') . " "
            . escapeshellarg($stegoWAV) . " "
            . escapeshellarg($fragmentBin);

        exec($command, $output, $status);

        if ($status !== 0) {
            throw new \Exception("Extraction failed:\n" . implode("\n", $output));
        }

        $this->fragmentBin[] = [$file['fragment_id'], $file['filename']];

        unlink($stegoWAV);
    }
}



/* checker

        $dataFile = storage_path('app/private/bin/recovered_fragment_wav.bin');
        $fragmentBytesData = file_get_contents($dataFile);

        $fragmentBinaryData = base64_decode('2ulaCsu8D1Y0f/4srqOau4D+Bxo0vvbfRoD62XNj1K4jU+2j0BSKhT0r7HkfNtnZ/6UWxQRp7SX1EjMDiHYYD3qpjZZWUm9H5YFwioY1wDdMgOXVdf9uyM4EpMX3jP/8krxXmo6wllH9JSUaKFfB/UCr736YH5PN94rXLcZIpFZYFzcnr4U5SAmukD+C9/S6JEcv1DL0+xzTbcxWU9CqamZ4/vpabQCuBXieVSAR+euL7G6Oelfm1a9hXiMdDi98Pn0YTR2TQVstrPUGZv/YpJ/DUwCZndXrT60jmDqocGzLMx2HXQHnoUl2FroNoH1FyyvGrGd08ee+sAehfiyWCofrJT35q/U8h9Pdr/6zV2B1KQTKtTshND43BcLxLAvCBBIPlBgvikzvXsBYll34MXp1laP3HzY7chmTAmr0+ZvtRZRkvqUr7C2VdEsm9tFYuUrrbKKizLfhsW6tqvqtMp659RE3owdltTBCtpWld0hSbRE1ZAc7HZAf/OQeDDKl/MGcXIi8q9dbWauoYq9fDA4Fgn4/Ay1ExDMKc1ovq/z+GH4WIRQxnAhcmFI1NO/7FhB8IH10ajKNgMDzpB8CAE1Gl8szaxaj9XAXuGRu2hU9nEBMNVxDCMildjpmt6Rad/83EFvl0Sio9WvkeMcMi/j7I6yNa4LMf/mqAm4LUiMax0KSZfV9GaMPteXN5LThgdxcTJTsmUZbIl8ZTs+1iQ==');

        // Compare
        if ($fragmentBytesData === $fragmentBinaryData) {
            dd('MATCH');
        } else {
            dd('MISMATCH
            Original bytes length: ' . strlen($fragmentBytesData) .
            "Decoded bytes length: " . strlen($fragmentBinaryData));
        }

*/

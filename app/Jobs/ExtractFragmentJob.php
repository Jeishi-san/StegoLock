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

class ExtractFragmentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    //protected string $fragmentId;

    public function __construct() //string $fragmentId
    {
        //$this->fragmentId = $fragmentId;
    }

    public function handle(): void
    {
        //$this->extract_from_txt();
        //$this->extract_from_img();
        //$this->extract_from_audio();


    }

    public function extract_from_txt(): void
    {
        //EXTRACT FROM TEXT
        $stegoCoverPath = storage_path('app/public/cloud_storage/output.txt');
        $outputFragmentPath = storage_path('app/private/bin/fragment.bin');

        $command = "python " . base_path('python_backend/embedding/text/extract.py') . " "
            . escapeshellarg($stegoCoverPath) . " "
            . escapeshellarg($outputFragmentPath) . " "
            . escapeshellarg(785543) . " 2>&1";

        $output = [];
        $status = 0;

        exec($command, $output, $status);

        if ($status !== 0) {
            throw new \Exception("Extraction failed:\n" . implode("\n", $output));
        }

        // Optional: log success
        //\Log::info("Extraction successful. Output: " . implode("\n", $output));

        //         $stego_cover = storage_path('app/public/cloud_storage/output.txt');
        //         $fragmentbin = storage_path('app/private/bin/fragment.bin'); //app/public/cloud_storage/output.txt
        //         //$dataFile = storage_path('app/private/bin/fragment.bin'); //app/public/cover_texts/0b4de9fe5810de20801214a9d3bcb224_cover_1774372552.txt


        // //        $fragment = Fragment::findOrFail($this->fragmentId);
        //         //$fragmentBinaryData = base64_decode('2ulaCsu8D1Y0f/4srqOau4D+Bxo0vvbfRoD62XNj1K4jU+2j0BSKhT0r7HkfNtnZ/6UWxQRp7SX1EjMDiHYYD3qpjZZWUm9H5YFwioY1wDdMgOXVdf9uyM4EpMX3jP/8krxXmo6wllH9JSUaKFfB/UCr736YH5PN94rXLcZIpFZYFzcnr4U5SAmukD+C9/S6JEcv1DL0+xzTbcxWU9CqamZ4/vpabQCuBXieVSAR+euL7G6Oelfm1a9hXiMdDi98Pn0YTR2TQVstrPUGZv/YpJ/DUwCZndXrT60jmDqocGzLMx2HXQHnoUl2FroNoH1FyyvGrGd08ee+sAehfiyWCofrJT35q/U8h9Pdr/6zV2B1KQTKtTshND43BcLxLAvCBBIPlBgvikzvXsBYll34MXp1laP3HzY7chmTAmr0+ZvtRZRkvqUr7C2VdEsm9tFYuUrrbKKizLfhsW6tqvqtMp659RE3owdltTBCtpWld0hSbRE1ZAc7HZAf/OQeDDKl/MGcXIi8q9dbWauoYq9fDA4Fgn4/Ay1ExDMKc1ovq/z+GH4WIRQxnAhcmFI1NO/7FhB8IH10ajKNgMDzpB8CAE1Gl8szaxaj9XAXuGRu2hU9nEBMNVxDCMildjpmt6Rad/83EFvl0Sio9WvkeMcMi/j7I6yNa4LMf/mqAm4LUiMax0KSZfV9GaMPteXN5LThgdxcTJTsmUZbIl8ZTs+1iQ==');

        //         //file_put_contents($dataFile, $fragmentBinaryData);

        //         //dd(storage_path('app/temp/fragment.bin'));

        //         // if (!file_exists($dataFile)) {
        //         //     throw new \Exception("fragment.bin was NOT created");
        //         // }

        //         // if (filesize($dataFile) === 0) {
        //         //     throw new \Exception("fragment.bin is EMPTY");
        //         // }

        //         $command = "python " . base_path('python_backend/embedding/text/extract.py') . " "
        //             . escapeshellarg($stego_cover) . " "
        //             . escapeshellarg($fragmentbin) . " "
        //             . escapeshellarg('786856') . " 2>&1"; //offset, capture errors

        //         $output = [];
        //         $status = 0;

        //         exec($command, $output, $status);

        //         if ($status !== 0) {
        //             throw new \Exception("Embedding failed:\n" . implode("\n", $output));
        //         }

        //         dd($output); //

        //         // Optional: log success
        //         // logger()->info("Embedding successful", [
        //         //     'offset' => $offset,
        //         //     'output_file' => $outputText,
        //         // ]);
    }

    public function extract_from_img(): void
    {
        $stegoImage = storage_path('app/public/cloud_storage/output.png');
        $outputFile = storage_path('app/private/bin/recovered_fragment.bin');

        $command = "python " . base_path('python_backend/embedding/image/extract.py') . " "
            . escapeshellarg($stegoImage) . " "
            . escapeshellarg($outputFile);

        exec($command, $output, $status);

        if ($status !== 0) {
            throw new \Exception("Extraction failed:\n" . implode("\n", $output));
        }
    }

    public function extract_from_audio(): void
    {
        $stegoWAV = storage_path('app/public/cloud_storage/output.wav');
        $outputFile = storage_path('app/private/bin/extracted_fragment.bin');

        $command = "python " . base_path('python_backend/embedding/audio/extract.py') . " "
            . escapeshellarg($stegoWAV) . " "
            . escapeshellarg($outputFile);

        exec($command, $output, $status);

        if ($status !== 0) {
            throw new \Exception("Extraction failed:\n" . implode("\n", $output));
        }
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

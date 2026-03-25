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

class EmbedFragmentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    //protected string $fragmentId;

    public function __construct() //string $fragmentId
    {
        //$this->fragmentId = $fragmentId;
    }

    public function handle(): void
    {
        //$this->lsb_on_txt();
        //$this->lsb_on_img();
        $this->lsb_on_audio();
    }

    private function lsb_on_txt(): void
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

    private function lsb_on_img(): void
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

    public function lsb_on_audio(): void
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

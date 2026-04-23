<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

use App\Providers\B2Service;
use App\Models\Document;
use App\Models\Fragment;
use App\Models\StegoFile;
use App\Models\StegoMap;
use App\Config\Constant;

class UnlockDocumentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected int $documentId;
    protected string $masterKey;

    public $timeout = 600;

    public function __construct(int $documentId, string $masterKey)
    {
        $this->documentId = $documentId;
        $this->masterKey = $masterKey;
    }

    public function handle()
    {
        $document = Document::find($this->documentId);
        if (!$document) return;

        try {
            $b2 = new B2Service();

            // 1. Fetch Stego Files
            $stegoData = $this->fetchStegoFiles($b2, $document);
            
            // 2. Extract Fragments
            $extracted = $this->extractFragment($stegoData['stego_map_id'], $stegoData['files']);
            
            // 3. Assemble
            $stegolockFile = $this->assemble($document, $extracted);
            
            // 4. Decrypt
            $this->decrypt($document, $stegolockFile);

        } catch (\Throwable $e) {
            $document->update([
                'status' => 'failed',
                'error_message' => 'Unlock Job Failed: ' . $e->getMessage()
            ]);
        }
    }

    private function fetchStegoFiles($b2, $document)
    {
        $stegoMap = StegoMap::where('document_id', $document->document_id)->firstOrFail();
        $stegoFiles = StegoFile::where('stego_map_id', $stegoMap->stego_map_id)->get()->toArray();

        if ($document->fragment_count !== count($stegoFiles)) {
            throw new \Exception("Corrupted file error: Mismatched fragment count");
        }

        $cloudFiles = $b2->listAllFiles();
        $lockedFiles = collect($cloudFiles)->filter(fn($file) => Str::startsWith($file['fileName'], 'locked/'));
        $lockedIds = $lockedFiles->pluck('fileId');

        $allExist = collect($stegoFiles)->every(fn($file) => $lockedIds->contains($file['cloud_file_id']));
        if (!$allExist) {
            throw new \Exception("Corrupted file error: Missing stego file");
        }

        if (!file_exists(storage_path('app/private/temp/cloud/'))) {
            mkdir(storage_path('app/private/temp/cloud/'), 0755, true);
        }

        foreach ($stegoFiles as $stegoFile) {
            $downloadedStegoPath = storage_path('app/private/temp/cloud/' . $stegoFile['filename']);
            foreach ($lockedFiles as $lockedFile) {
                if ($stegoFile['cloud_file_id'] === $lockedFile['fileId']) {
                    $content = $b2->readfile($lockedFile['fileId']);
                    file_put_contents($downloadedStegoPath, $content);
                    break;
                }
            }
        }

        return ['stego_map_id' => $stegoMap->stego_map_id, 'files' => $stegoFiles];
    }

    private function extractFragment($mapId, $stegoFiles)
    {
        if (!file_exists(storage_path('app/private/temp/bin/'))) {
            mkdir(storage_path('app/private/temp/bin/'), 0755, true);
        }

        $stegoMap = StegoMap::findOrFail($mapId);
        $document = Document::findOrFail($stegoMap->document_id);

        $fragmentBin = [];
        $stegoFiles_trunc = [];

        foreach ($stegoFiles as $file) {
            $stegoFiles_trunc[] = [
                'filename' => pathinfo($file['filename'], PATHINFO_FILENAME),
                'type' => pathinfo($file['filename'], PATHINFO_EXTENSION),
                'fragment_id' => $file['fragment_id'],
                'offset' => $file['offset']
            ];
        }

        $textFiles = []; $imageFiles = []; $audioFiles = [];
        foreach ($stegoFiles_trunc as $file) {
            if ($file['type'] === 'txt') $textFiles[] = $file;
            elseif (in_array($file['type'], ['png', 'jpg', 'jpeg'])) $imageFiles[] = $file;
            elseif (in_array($file['type'], ['mp3', 'wav'])) $audioFiles[] = $file;
            else throw new \RuntimeException("Invalid stego file type: {$file['type']}");
        }

        foreach ($textFiles as $file) $fragmentBin[] = $this->extract_from_txt($file);
        foreach ($imageFiles as $file) $fragmentBin[] = $this->extract_from_img($file);
        foreach ($audioFiles as $file) $fragmentBin[] = $this->extract_from_audio($file);

        $document->update(['status' => 'extracted']);
        return $fragmentBin;
    }

    private function extract_from_txt(array $file)
    {
        $stegoText = storage_path('app/private/temp/cloud/' . $file['filename'] . '.txt');
        $fragmentBin = storage_path('app/private/temp/bin/'. $file['filename'] .'.bin');
        $offset = $file['offset'];

        $command = "python " . base_path('python_backend/embedding/text/extract.py') . " "
            . escapeshellarg($stegoText) . " "
            . escapeshellarg($fragmentBin) . " "
            . escapeshellarg($offset) . " 2>&1";

        exec($command, $output, $status);
        if ($status !== 0) throw new \Exception("Extraction failed:\n" . implode("\n", $output));
        unlink($stegoText);
        return [$file['fragment_id'], $file['filename']];
    }

    private function extract_from_img(array $file)
    {
        $stegoImage = storage_path('app/private/temp/cloud/' . $file['filename'] . '.png');
        $fragmentBin = storage_path('app/private/temp/bin/'. $file['filename'] .'.bin');

        $command = "python " . base_path('python_backend/embedding/image/extract.py') . " "
            . escapeshellarg($stegoImage) . " "
            . escapeshellarg($fragmentBin);

        exec($command, $output, $status);
        if ($status !== 0) throw new \Exception("Extraction failed:\n" . implode("\n", $output));
        unlink($stegoImage);
        return [$file['fragment_id'], $file['filename']];
    }

    private function extract_from_audio(array $file)
    {
        $stegoWAV = storage_path('app/private/temp/cloud/' . $file['filename'] . '.wav');
        $fragmentBin = storage_path('app/private/temp/bin/'. $file['filename'] .'.bin');

        $command = "python " . base_path('python_backend/embedding/audio/extract.py') . " "
            . escapeshellarg($stegoWAV) . " "
            . escapeshellarg($fragmentBin);

        exec($command, $output, $status);
        if ($status !== 0) throw new \Exception("Extraction failed:\n" . implode("\n", $output));
        unlink($stegoWAV);
        return [$file['fragment_id'], $file['filename']];
    }

    private function assemble($document, $fragmentBin)
    {
        $document = Document::findOrFail($document->document_id);
        if ($document->status !== 'extracted') throw new \Exception('Process error: File not extracted');

        $frag = [];
        foreach ($fragmentBin as $fragment) {
            $fragment_in_DB = Fragment::findOrFail($fragment[0]);
            $fragmentBinaryData = file_get_contents(storage_path('app/private/temp/bin/' . $fragment[1] . '.bin'));

            if ($fragment_in_DB->hash !== hash('sha256', $fragmentBinaryData)) {
                throw new \Exception("Fragment integrity failed");
            }
            $frag[] = [$fragment_in_DB->fragment_id, $fragment_in_DB->index, $fragmentBinaryData, $fragment[1]];
        }

        usort($frag, fn($a, $b) => $a[1] <=> $b[1]);

        $reconstructed = '';
        foreach ($frag as $fragment) {
            $reconstructed .= $fragment[2];
        }

        $outputPath = 'temp/reconstructed/' . bin2hex(random_bytes(16)) . time() . '.stegolock';
        Storage::put($outputPath, $reconstructed);

        $document->update(['status' => 'reconstructed']);

        foreach ($frag as $fragment) {
            unlink(storage_path('app/private/temp/bin/' . $fragment[3] . '.bin'));
        }

        return basename($outputPath);
    }

    private function decrypt($document, $stegolock_file)
    {
        $encPath = 'temp/reconstructed/' . $stegolock_file;
        $data = file_get_contents(Storage::path($encPath));
        if ($data === false) throw new \Exception('Encrypted file not found.');

        $nonceLen = Constant::NONCE_LEN;
        $tagLen = 16;
        $nonce = substr($data, 0, $nonceLen);
        $tag = substr($data, $nonceLen, $tagLen);
        $ciphertext = substr($data, $nonceLen + $tagLen);

        // 1. Unwrap the DEK using the Master Key
        $encrypted_dek = base64_decode($document->encrypted_dek);
        $dek_nonce = base64_decode($document->dek_nonce);
        $dek_tag = base64_decode($document->dek_tag);

        $documentKey = openssl_decrypt(
            $encrypted_dek,
            'aes-256-gcm',
            $this->masterKey,
            OPENSSL_RAW_DATA,
            $dek_nonce,
            $dek_tag
        );

        if ($documentKey === false) {
            throw new \Exception('Failed to unwrap Document Key. Master Key might be incorrect.');
        }

        // 2. Decrypt the file using the unwrapped DEK
        $plaintext = openssl_decrypt($ciphertext, 'aes-256-gcm', $documentKey, OPENSSL_RAW_DATA, $nonce, $tag);
        if ($plaintext === false) throw new \Exception('Possible tampering or wrong key.');

        $outputPath = 'temp/decrypted/' . $document->filename;
        Storage::put($outputPath, $plaintext);

        $document->update(['status' => 'decrypted']);
        Storage::delete($encPath);

        return $outputPath;
    }
}

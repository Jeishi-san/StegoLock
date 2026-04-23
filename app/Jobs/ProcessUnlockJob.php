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
use Illuminate\Support\Str;

class ProcessUnlockJob implements ShouldQueue
{
    use Queueable;

    protected $documentId;
    protected $base64MasterKey;

    /**
     * Create a new job instance.
     */
    public function __construct(int $documentId, string $base64MasterKey)
    {
        $this->documentId = $documentId;
        $this->base64MasterKey = $base64MasterKey;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $document = Document::findOrFail($this->documentId);

        try {
            $b2 = new B2Service();

            // 1. Fetch & Extract Fragments
            // Document stays 'stored' during this phase
            $stegoData = $this->fetchStegoFiles($b2, $document);
            $extracted = $this->extractFragments($stegoData['stego_map_id'], $stegoData['files']);
            
            // 2. Assemble Fragments
            // Extraction is done. Update to 'extracted' so UI shows "Assembling file..."
            $document->update(['status' => 'extracted']);
            
            $stegolock_file = $this->assemble($document, $extracted);

            // 3. Decrypt
            // Assembly is done. Update to 'reconstructed' so UI shows "Decrypting file..."
            $document->update(['status' => 'reconstructed']);
            
            $this->decrypt($document, $stegolock_file);
            $document->update(['status' => 'decrypted']);

        } catch (\Throwable $e) {
            $document->update([
                'status' => 'failed',
                'error_message' => 'Unlocking failed: ' . $e->getMessage()
            ]);
            $this->cleanupOnFailure($document);
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
        $lockedFiles = collect($cloudFiles)
            ->filter(fn($file) => Str::startsWith($file['fileName'], 'locked/'));

        $lockedIds = $lockedFiles->pluck('fileId');

        $allExist = collect($stegoFiles)
            ->every(fn($file) => $lockedIds->contains($file['cloud_file_id']));

        if (!$allExist) {
            throw new \Exception("Corrupted file error: Missing stego file in cloud");
        }

        $tempCloudDir = storage_path('app/private/temp/cloud/');
        if (!file_exists($tempCloudDir)) {
            mkdir($tempCloudDir, 0755, true);
        }

        foreach ($stegoFiles as $stegoFile) {
            $downloadedStegoPath = $tempCloudDir . $stegoFile['filename'];
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

    private function extractFragments($mapId, $stegoFiles)
    {
        $tempBinDir = storage_path('app/private/temp/bin/');
        if (!file_exists($tempBinDir)) {
            mkdir($tempBinDir, 0755, true);
        }

        $fragmentBin = [];
        foreach ($stegoFiles as $file) {
            $type = pathinfo($file['filename'], PATHINFO_EXTENSION);
            $filename = pathinfo($file['filename'], PATHINFO_FILENAME);
            
            $data = [
                'filename' => $filename,
                'type' => $type,
                'fragment_id' => $file['fragment_id'],
                'offset' => $file['offset']
            ];

            if ($type === 'txt') {
                $fragmentBin[] = $this->extract_from_txt($data);
            } elseif (in_array($type, ['png', 'jpg', 'jpeg'])) {
                $fragmentBin[] = $this->extract_from_img($data);
            } elseif (in_array($type, ['mp3', 'wav'])) {
                $fragmentBin[] = $this->extract_from_audio($data);
            } else {
                throw new \RuntimeException("Invalid stego file type: {$type}");
            }
        }

        return $fragmentBin;
    }

    private function extract_from_txt(array $file)
    {
        $stegoText = storage_path('app/private/temp/cloud/' . $file['filename'] . '.txt');
        $fragmentBinPath = storage_path('app/private/temp/bin/' . $file['filename'] . '.bin');
        $offset = $file['offset'];

        $command = "python " . base_path('python_backend/embedding/text/extract.py') . " "
            . escapeshellarg($stegoText) . " "
            . escapeshellarg($fragmentBinPath) . " "
            . escapeshellarg($offset) . " 2>&1";

        $output = [];
        $status = 0;
        exec($command, $output, $status);

        if ($status !== 0) {
            throw new \Exception("Text extraction failed:\n" . implode("\n", $output));
        }

        if (file_exists($stegoText)) unlink($stegoText);

        return [$file['fragment_id'], $file['filename']];
    }

    private function extract_from_img(array $file)
    {
        $stegoImage = storage_path('app/private/temp/cloud/' . $file['filename'] . '.png');
        $fragmentBinPath = storage_path('app/private/temp/bin/' . $file['filename'] . '.bin');

        $command = "python " . base_path('python_backend/embedding/image/extract.py') . " "
            . escapeshellarg($stegoImage) . " "
            . escapeshellarg($fragmentBinPath) . " 2>&1";

        $output = [];
        $status = 0;
        exec($command, $output, $status);

        if ($status !== 0) {
            throw new \Exception("Image extraction failed:\n" . implode("\n", $output));
        }

        if (file_exists($stegoImage)) unlink($stegoImage);

        return [$file['fragment_id'], $file['filename']];
    }

    private function extract_from_audio(array $file)
    {
        $stegoWav = storage_path('app/private/temp/cloud/' . $file['filename'] . '.wav');
        $fragmentBinPath = storage_path('app/private/temp/bin/' . $file['filename'] . '.bin');

        $command = "python " . base_path('python_backend/embedding/audio/extract.py') . " "
            . escapeshellarg($stegoWav) . " "
            . escapeshellarg($fragmentBinPath) . " 2>&1";

        $output = [];
        $status = 0;
        exec($command, $output, $status);

        if ($status !== 0) {
            throw new \Exception("Audio extraction failed:\n" . implode("\n", $output));
        }

        if (file_exists($stegoWav)) unlink($stegoWav);

        return [$file['fragment_id'], $file['filename']];
    }

    private function assemble($document, $fragmentBin)
    {
        $tempBinDir = storage_path('app/private/temp/bin/');
        $frag = [];
        foreach ($fragmentBin as $fragment) {
            $fragment_in_DB = Fragment::findOrFail($fragment[0]);
            $binPath = $tempBinDir . $fragment[1] . '.bin';
            $fragmentBinaryData = file_get_contents($binPath);

            if (hash('sha256', $fragmentBinaryData) !== $fragment_in_DB->hash) {
                throw new \Exception("Fragment integrity failed for fragment " . $fragment[0]);
            }

            $frag[] = [
                'index' => $fragment_in_DB->index,
                'data' => $fragmentBinaryData,
                'path' => $binPath
            ];
        }

        // Sort by index
        usort($frag, fn($a, $b) => $a['index'] <=> $b['index']);

        $reconstructed = '';
        foreach ($frag as $f) {
            $reconstructed .= $f['data'];
        }

        $tempRecDir = 'temp/reconstructed';
        if (!Storage::exists($tempRecDir)) {
            Storage::makeDirectory($tempRecDir);
        }

        $outputPath = $tempRecDir . '/' . bin2hex(random_bytes(16)) . time() . '.stegolock';
        Storage::put($outputPath, $reconstructed);

        // Cleanup fragment bins
        foreach ($frag as $f) {
            if (file_exists($f['path'])) unlink($f['path']);
        }

        return $outputPath;
    }

    private function decrypt($document, $stegolock_file)
    {
        $data = Storage::get($stegolock_file);
        if ($data === false) {
            throw new \Exception('Encrypted file not found.');
        }

        $nonceLen = Constant::NONCE_LEN;
        $tagLen = 16;

        $nonce = substr($data, 0, $nonceLen);
        $tag = substr($data, $nonceLen, $tagLen);
        $ciphertext = substr($data, $nonceLen + $tagLen);

        $dk_salt = base64_decode($document->dk_salt);
        $masterKey = base64_decode($this->base64MasterKey);
        $wrapping_key = hash_hkdf('sha256', $masterKey, 32, 'dek-wrapping-key', $dk_salt);

        $dek_nonce = base64_decode($document->dek_nonce);
        $dek_tag = base64_decode($document->dek_tag);
        $encrypted_dek = base64_decode($document->encrypted_dek);

        $dek = openssl_decrypt(
            $encrypted_dek,
            'aes-256-gcm',
            $wrapping_key,
            OPENSSL_RAW_DATA,
            $dek_nonce,
            $dek_tag
        );

        if ($dek === false) {
            throw new \Exception('Failed to unwrap Document Key. Wrong master key?');
        }

        if (hash('sha256', $dek) !== $document->dek_hash) {
            throw new \Exception('Document Key integrity check failed.');
        }

        $plaintext = openssl_decrypt(
            $ciphertext,
            'aes-256-gcm',
            $dek,
            OPENSSL_RAW_DATA,
            $nonce,
            $tag
        );

        if ($plaintext === false) {
            throw new \Exception('Decryption failed. Possible tampering or wrong key.');
        }

        $tempDecDir = 'temp/decrypted';
        if (!Storage::exists($tempDecDir)) {
            Storage::makeDirectory($tempDecDir);
        }

        $outputPath = $tempDecDir . '/' . $document->filename;
        Storage::put($outputPath, $plaintext);

        // Cleanup reconstructed file
        Storage::delete($stegolock_file);

        return $outputPath;
    }

    private function cleanupOnFailure($document)
    {
        // Cleanup temp directories safely
        $this->safeDeleteDirectory(storage_path('app/private/temp/bin'));
        $this->safeDeleteDirectory(storage_path('app/private/temp/cloud'));
        
        // Also cleanup any reconstructed files for this document if possible
        // (Though we use random names, we could potentially track them or just let them be cleaned up by a periodic task)
    }

    private function safeDeleteDirectory($path)
    {
        if (file_exists($path) && is_dir($path)) {
            $files = glob($path . '/*');
            foreach ($files as $file) {
                if (is_file($file)) unlink($file);
            }
        }
    }
}

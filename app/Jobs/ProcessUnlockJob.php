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
use App\Models\DocumentShare;
use App\Services\CryptoService;
use Illuminate\Support\Str;

class ProcessUnlockJob implements ShouldQueue
{
    use Queueable;

    protected $documentId;
    protected $base64MasterKey;
    protected $userId;

    /**
     * Create a new job instance.
     */
    public function __construct(int $documentId, string $base64MasterKey, int $userId = null)
    {
        $this->documentId = $documentId;
        $this->base64MasterKey = $base64MasterKey;
        $this->userId = $userId;
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
            $this->updateStatus('extracted');
            
            $stegolock_file = $this->assemble($document, $extracted);

            // 3. Decrypt
            // assembly is done. Update to 'reconstructed' so UI shows "Decrypting file..."
            $this->updateStatus('reconstructed');
            
            $this->decrypt($document, $stegolock_file);
            $this->updateStatus('decrypted');

        } catch (\Throwable $e) {
            $this->updateStatus('failed', 'Unlocking failed: ' . $e->getMessage());
            $this->cleanupOnFailure($document);

            DocumentActivity::create([
                'document_id' => $this->documentId,
                'user_id' => $this->userId ?? $document->user_id,
                'action' => 'unlocking_failed',
                'metadata' => ['error' => $e->getMessage()]
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

        if ($dek === null) {
            throw new \Exception('Failed to unwrap Document Key. Wrong master key?');
        }

        if (hash('sha256', $dek) !== $document->dek_hash) {
            throw new \Exception('Document Key integrity check failed.');
        }

        $plaintext = $cryptoService->decrypt(
            $ciphertext,
            $dek,
            $nonce,
            $tag
        );

        if ($plaintext === null) {
            throw new \Exception('Decryption failed. Possible tampering or wrong key.');
        }

        // --- DECOMPRESS ---
        $decompressed = @gzuncompress($plaintext);
        if ($decompressed === false) {
            // Fallback for old files or failed decompression
            // If the user tries to unlock an old file, gzuncompress might fail.
            // But we already warned them. Still, we use $plaintext as a fallback if it looks like a valid doc?
            // Actually, best to throw an error to be explicit.
            throw new \Exception('Decompression failed. This file may have been locked with an older version of StegoLock or is corrupted.');
        }
        $plaintext = $decompressed;

        $tempDecDir = 'temp/decrypted/' . ($this->userId ?? $document->user_id) . '/' . $document->document_id;
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

    private function updateStatus($status, $errorMessage = null)
    {
        $document = Document::find($this->documentId);
        if (!$document) return;

        // If it's a share, update the share record
        if ($this->userId && $document->user_id !== $this->userId) {
            $share = DocumentShare::where('document_id', $this->documentId)
                ->where('recipient_id', $this->userId)
                ->first();
            if ($share) {
                $share->update([
                    'processing_status' => $status,
                    // If we had an error field in shares, we'd use it too
                ]);
            }
        } else {
            // Otherwise it's the owner
            $data = ['status' => $status];
            if ($errorMessage) $data['error_message'] = $errorMessage;
            $document->update($data);
        }
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

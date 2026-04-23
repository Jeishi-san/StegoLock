<?php

/*admin functions note

manage covers
    - db
    - cloud
    - scan new cover files, add them to cloud and db
*/

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

use Illuminate\Database\QueryException;
use Illuminate\Http\Request;

use Inertia\Inertia;

use App\Providers\B2Service;

use App\Config\Constant;
use App\Models\Document;
use App\Models\Fragment;
use App\Models\Cover;
use App\Models\FragmentMap;
use App\Models\StegoFile;
use App\Models\StegoMap;



class DocumentController extends Controller
{
    protected $primaryKey = 'document_id';

    /**
     * Returns json containing the current user's documents, totalStorage, and storageLimit
     */
    public function index()
    {
        $documents = Document::where('user_id', Auth::id())
            ->latest()
            ->get([
                'document_id',
                'filename',
                'file_type',
                'original_size',
                'in_cloud_size',
                'status',
                'fragment_count',
                'created_at'
            ]);

        $user = Auth::user();

        return Inertia::render('MyDocuments', [
            'documents' => $documents,
            'totalStorage' => $user->storage_used,
            'storageLimit' => $user->storage_limit,
        ]);
    }

    /**
     * Starts the locking and securing process of the document
     */
    /**
     * Starts the locking and securing process of the document
     */
    public function lock(Request $request) {
        $document = Document::findOrFail($request->document_id);

        try {
            // 1. Encrypt (Sychronous because it needs session master_key)
            $encryptedPath = $this->encrypt($document->document_id, $request->temp_path);

            if (!$encryptedPath) {
                throw new \Exception("Encryption failed");
            }

            // 2. Dispatch the rest to the background
            \App\Jobs\ProcessSteganoJob::dispatch($document->document_id, $encryptedPath);

            return [
                'isLocked' => true,
                'status' => 'processing',
                'success' => 'Document encryption started. The rest will be processed in the background.'
            ];

        } catch (\Throwable $e) {
            $document->update([
                'status' => 'failed',
                'error_message' => $e->getMessage()
            ]);

            return [
                'isLocked' => false,
                'error' => 'Document could not be locked: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Uploads the document
     */
    public function upload(Request $request)
    {
        // 1: Validate
        $request->validate([
            'file' => 'required|file|mimes:pdf,doc,docx,txt|min:1|max:5120'
        ]);

        $file = $request->file('file');

        $document = new Document();

        $path = "";

        // 2:
        try { // 2.1: catches file duplication errors per user

            // 2.2: Generate hash (REAL duplicate check)
            $fileHash = hash_hmac('sha256', file_get_contents($file->getRealPath()), config('app.key'));

            // 2.3: Store uploaded file in local temporarily
            $path = $file->store('temp/uploads');

            // 2.4: Save document record in DB
            $document = Document::create([
                'user_id' => Auth::id(),
                'filename' => $file->getClientOriginalName(),
                'file_type' => $file->getClientOriginalExtension(),
                'file_hash' => $fileHash,
                'original_size' => $file->getSize(),
                'status' => 'uploaded'
            ]);


            if (!$document) { // 2.5: check if storage in db successful
                throw new \Exception("Failed to store document");
            }

        } catch (QueryException $e) {

            return response()->json([
                'file' => 'You already uploaded this document'
            ]);

            // return back()->withErrors([
            //     'file' => ['You already uploaded this document', $e->getMessage()]
            // ]);
        }

        return [
            'document_id' => $document->document_id,
            'temp_path' => $path
        ];
    }

    private function encrypt(int $documentId, string $temp_filePath)
    {
        $document = Document::find($documentId);
        if (!$document) {
            throw new \Exception("Missing document");
        }
        try {
            // 1. Read the uploaded plaintext file
            $plaintext = file_get_contents(Storage::path($temp_filePath));

            // 2. Generate a random Document Key (DEK)
            $dek = random_bytes(32);
            $dek_hash = hash('sha256', $dek);

            // 3. Get master key from session for wrapping
            $masterKey = session('master_key');
            if (!$masterKey) {
                throw new \Exception('Master key not found in session.');
            }

            // 4. Generate wrapping metadata
            $dk_salt = random_bytes(Constant::DK_SALT_LEN);
            $wrapping_key = hash_hkdf('sha256', $masterKey, 32, 'dek-wrapping-key', $dk_salt);
            $dek_nonce = random_bytes(Constant::NONCE_LEN);
            $dek_tag = '';

            // 5. Wrap the DEK
            $encrypted_dek = openssl_encrypt(
                $dek,
                'aes-256-gcm',
                $wrapping_key,
                OPENSSL_RAW_DATA,
                $dek_nonce,
                $dek_tag
            );

            // 6. AES-256-GCM encryption of the file using the raw DEK
            $file_nonce = random_bytes(Constant::NONCE_LEN);
            $file_tag = '';
            $ciphertext = openssl_encrypt(
                $plaintext,
                'aes-256-gcm',
                $dek,
                OPENSSL_RAW_DATA,
                $file_nonce,
                $file_tag
            );

            // 7. Save encrypted file (store file_nonce + file_tag + ciphertext)
            $encPath = 'temp/encrypted/' . pathinfo(basename(''.$temp_filePath), PATHINFO_FILENAME) . '.stegolock';
            Storage::put($encPath, $file_nonce . $file_tag . $ciphertext);

            // 8. Update the database with encryption and wrapping info
            $document->update([
                'dk_salt' => base64_encode($dk_salt),
                'encrypted_dek' => base64_encode($encrypted_dek),
                'dek_nonce' => base64_encode($dek_nonce),
                'dek_tag' => base64_encode($dek_tag),
                'dek_hash' => $dek_hash,
                'encrypted_size' => strlen($ciphertext),
                'status' => 'encrypted'
            ]);

            // Safe to delete uploaded file
            Storage::delete($temp_filePath);

            //return data for Segmentation
            return $encPath;

        } catch (\Throwable $e) {
            // Update document with failure info
            $document->update([
                'status' => 'failed',
                'error_message' => ['Encryption failed', $e->getMessage()]
            ]);

            //return back()->with('error', $document->error_message);
        }
    }




    /**
     * Fetch cover files from the cloud and create cover file copies in local storage for embedding
     */





    /**
     * Starts the unlocking and retrieval process of the document
     */
    public function unlock(Request $request)
    {
        // document status = stored after decryption, only if user chooses to keep the file
        // delete file if user chooses to destroy it after unlocking

        $b2 = new B2Service();
        $document = Document::findOrFail($request->document_id);

        if ($document->status !== 'stored') {
            abort(400, 'File not stored');
        }

        //fetch stego files
        $stegoFiles = $this->fetchStegoFiles($b2, $document);
        $extracted = $this->extractFragment($stegoFiles['stego_map_id'], $stegoFiles['files']);
        $stegolock_file = $this->assemble($document, $extracted);
        $decrypted = $this->decrypt($document, $stegolock_file);

        return $decrypted;
    }

    private function fetchStegoFiles($b2, $document){
        try
        {
            //Fetch stego files from storage
            $stegoMap = StegoMap::where('document_id', $document->document_id)->firstOrFail();
            $stegoFiles = StegoFile::where('stego_map_id', $stegoMap->stego_map_id)->get()->toArray();

            if($document->fragment_count !== count($stegoFiles)) { //db check
                throw new \Exception("Corrupted file error: Mismatched fragment count");
            }

            $cloudFiles = $b2->listAllFiles();

            $lockedFiles = collect($cloudFiles)
                    ->filter(fn($file) => Str::startsWith($file['fileName'], 'locked/'));

            $lockedIds = $lockedFiles->pluck('fileId');

            $allExist = collect($stegoFiles) //storage check
                ->every(fn($file) => $lockedIds->contains($file['cloud_file_id']));

            if (!$allExist) {
                throw new \Exception("Corrupted file error: Missing stego file");
            }

            //download stego files for extraction later
            if (!file_exists(storage_path('app/private/temp/cloud/'))) {
                mkdir(storage_path('app/private/temp/cloud/'), 0755, true);
            }

            foreach ($stegoFiles as $stegoFile) {
                $downloadedStegoPath = storage_path('app/private/temp/cloud/' . $stegoFile['filename']);
                foreach ($lockedFiles as $lockedFile) {
                    if ($stegoFile['cloud_file_id'] === $lockedFile['fileId']) {
                        $content = $b2->readfile($lockedFile['fileId']); //binary
                        file_put_contents($downloadedStegoPath, $content); //saving stego file to temp storage
                        break;
                    }
                }
            }

            return ['stego_map_id' => $stegoMap->stego_map_id, 'files' => $stegoFiles];
        } catch (\Throwable $e) {
            $document->update([
                'status' => 'failed',
                'error_message' => ['File fetch error', $e->getMessage()]
            ]);
        }
    }
    /**
     * Extracts fragments from stego files
     * Returns document_id and fragmentBin
     */
    private function extractFragment($mapId, $stegoFiles) {
        // ensure temp folders exist
        if (!file_exists(storage_path('app/private/temp/bin/'))) {
            mkdir(storage_path('app/private/temp/bin/'), 0755, true);
        }

        $stegoMap = StegoMap::findOrFail($mapId);
        $document = Document::findOrFail($stegoMap->document_id);

        $fragmentBin = [];
        $stegoFiles_trunc = [];

        $textFiles = [];
        $imageFiles = [];
        $audioFiles = [];

        try
        {
            foreach ($stegoFiles as $file) {

                $stegoFiles_trunc[] = [
                    'filename' => pathinfo($file['filename'], PATHINFO_FILENAME),
                    'type' => pathinfo($file['filename'], PATHINFO_EXTENSION),
                    'fragment_id' => $file['fragment_id'],
                    'offset' => $file['offset']
                ];

            }

            //separate file type according to files
            foreach ($stegoFiles_trunc as $file) {
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
            foreach ($textFiles as $file) {//text extraction
                $fragmentBin[] = $this->extract_from_txt($file);
            }
            foreach ($imageFiles as $file) {//image extraction
                $fragmentBin[] = $this->extract_from_img($file);
            }
            foreach ($audioFiles as $file) {//audio extraction
                $fragmentBin[] = $this->extract_from_audio($file);
            }

            // Update document status
            $document->update([
                'status' => 'extracted',
            ]);

            // //dispatch reconstruction
            // // AssembleFragmentsJob::dispatchSync($document->document_id, $this->fragmentBin);

            return $fragmentBin; //fragment_id | filename

        } catch (\Exception $e) {
            // Handle extraction errors
            $document->update([
                'status' => 'failed',
                'error_message' => ("Error extracting fragments: " . $e->getMessage())
            ]);
        }
    }

    /**
     * Returns fragment data
     */
        private function extract_from_txt(array $file)
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

            unlink($stegoText);

            return [$file['fragment_id'], $file['filename']];
        }

    /**
     * Returns fragment data
     */
        private function extract_from_img(array $file)
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

            unlink($stegoImage);

            return [$file['fragment_id'], $file['filename']];
        }

    /**
     * Returns fragment data
     */
        private function extract_from_audio(array $file)
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

            unlink($stegoWAV);

            return [$file['fragment_id'], $file['filename']];
        }

    /**
     * Assembles extracted fragments
     * Returns document file/path
     */
    public function assemble($document, $fragmentBin)
    {
        $document = Document::findOrFail($document->document_id);

        if($document->status !== 'extracted') {
            abort(400, 'Process error: File not extracted');
        }

        try {
            // check fragment integrity
            $frag = [];
            foreach ($fragmentBin as $fragment) {
                $fragment_in_DB = Fragment::findOrFail($fragment[0]);
                $fragmentBinaryData = file_get_contents(storage_path('app/private/temp/bin/' . $fragment[1] . '.bin'));

                if ($fragment_in_DB->hash !== hash('sha256',$fragmentBinaryData)) {
                    throw new \Exception("Fragment integrity failed");
                }

                //temp store fragment_id, fragment index, binarydata, binary filename
                $frag[] = [$fragment_in_DB->fragment_id, $fragment_in_DB->index, $fragmentBinaryData, $fragment[1]];
            }

            //sort by index
            usort($frag, function ($a, $b) {
                return $a[1] <=> $b[1];
            });

            // Reconstruct binary ciphertext
            $reconstructed = '';

            foreach ($frag as $fragment) {
                $binary = $fragment[2];
                $reconstructed .= $binary;
            }

            // Save reconstructed encrypted file
            $outputPath = 'temp/reconstructed/' . bin2hex(random_bytes(16)) . time() . '.stegolock';
            Storage::put($outputPath, $reconstructed);

            // 6. Update document
            $document->update([
                'status' => 'reconstructed'
            ]);

            //delete fragment bin
            foreach ($frag as $fragment) {
                unlink(storage_path('app/private/temp/bin/' . $fragment[3] . '.bin'));
            }

            //Decrypt
            // DecryptDocumentJob::dispatchSync($document->document_id, basename($outputPath));

            return basename($outputPath);

        } catch (\Throwable $e) {
            $document->update([
                'status' => 'failed',
                'error_message' => 'File reconstruction failed' . $e->getMessage()
            ]);
        }
    }

    /**
     * Decrypts the assembled encrypted file
     * Returns the decrypted file path
     */
    public function decrypt($document, $stegolock_file)
    {
        $document = Document::find($document->document_id);

        if ($document->status !== 'reconstructed') return;

        $masterKey = session('master_key');
        if (!$masterKey) {
            throw new \Exception('Master key not found in session.');
        }

        try {
            // Read reconstructed encrypted file
            $encPath = 'temp/reconstructed/' . $stegolock_file;
            // $encPath = 'temp/reconstructed/' . 'D4d1HNugBbB0hmFwY3o3j3dAsyw4u7jyMWZClH4P.stegolock';
            $data = file_get_contents(Storage::path($encPath));

            if ($data === false) {
                throw new \Exception('Encrypted file not found.');
            }

            // Get components
            $nonceLen = Constant::NONCE_LEN; // e.g., 12 bytes
            $tagLen = 16; // GCM tag is 16 bytes

            $nonce = substr($data, 0, $nonceLen);
            $tag = substr($data, $nonceLen, $tagLen);
            $ciphertext = substr($data, $nonceLen + $tagLen);

            // 3. Unwrap the Document Key (DEK)
            $dk_salt = base64_decode($document->dk_salt);
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

            // 4. Verify DEK Integrity
            if (hash('sha256', $dek) !== $document->dek_hash) {
                throw new \Exception('Document Key integrity check failed.');
            }

            // 5. Decrypt File using the unwrapped DEK
            $plaintext = openssl_decrypt(
                $ciphertext,
                'aes-256-gcm',
                $dek,
                OPENSSL_RAW_DATA,
                $nonce,
                $tag
            );

            if ($plaintext === false) {
                throw new \Exception('Possible tampering or wrong key.');
            }

            // 5. Save decrypted file
            $outputPath = 'temp/decrypted/' . $document->filename;
            Storage::put($outputPath, $plaintext);

            // 6. Update document
            $document->update([
                'status' => 'decrypted'
            ]);

            // Safe to delete decrypted file
            Storage::delete($encPath);

            //return to user for download
            //delete after download / retain files, this leads to new securing process
            //return back()->with('success', 'File retrieved: ' . basename($outputPath));

            return $outputPath;
        } catch (\Throwable $e) {
            $document->update([
                'status' => 'failed',
                'error_message' => 'Decryption failed: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Downloads the requested document from local storage after decryption
     */
    public function download($id)
    {
        $document = Document::findOrFail($id);

        if ($document->status !== 'decrypted') {
            abort(400, 'File not ready');
        }

        $path = 'temp/decrypted/' . $document->filename;

        if (!Storage::exists($path)) {
            abort(404, 'File missing');
        }

        return Storage::download($path, $document->filename);
    }

    /**
     * Document files Deletion
     * Delete cloud files first then DB records
     * Only delete DB records if and only if cloud file deletion is successful
     */
    public function delete(Request $request)
    {
        $user = Auth::user();
        $document = Document::where('document_id', $request->document_id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $is_stored_OR_decrypted = false;
        if ($document->status === 'stored' || $document->status === 'decrypted') {
            $is_stored_OR_decrypted = true;
        }

        if ($is_stored_OR_decrypted === false) {
            abort(400, 'File not stored');
        }

        $stegoMap = StegoMap::where('document_id', $document->document_id)->firstOrFail();
        $stegoFiles = StegoFile::where('stego_map_id', $stegoMap->stego_map_id)
            ->select('cloud_file_id', 'filename', 'stego_file_id')
            ->get()
            ->toArray();

        if(empty($stegoFiles)) {
            return response()->json(['error' => 'No stego files found'], 404);
        }

        try {

        /**
         * Three-Layer Deletion Process
         * Layer 1: Retry - handling temporary failures -> $this->deleteWithRetry($b2, $file)
         * Layer 2: Deterministic result collection -> foreach ($stegoFiles as $file)
         * Layer 3: Decision logic -> if (!empty($failedFiles))
         */
            $b2 = new B2Service();

            $deletedFiles = [];
            $failedFiles = [];

            foreach ($stegoFiles as $file) {

                $contentLength = $b2->getFileInfo($file['cloud_file_id'])['contentLength'];

                $deleted = $this->deleteWithRetry($b2, $file);

                if ($deleted) {
                    $deletedFiles[] = $file['stego_file_id'];

                } else {
                    $failedFiles[] = $file['stego_file_id'];
                }
            }

            if (!empty($failedFiles)) {

                return response()->json([
                    'message' => 'Some files failed to delete',
                    'deleted' => $deletedFiles,
                    'failed' => $failedFiles
                ], 500);
            }

            $user->decrement('storage_used', $document->in_cloud_size);

            // delete DB records
            $document->forceDelete();

            return response()->json(['message' => 'File deleted successfully']);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }

        return $deletedFiles;
    }

    private function deleteWithRetry($b2, $file)
    {
        $maxRetries = 3;
        $attempt = 0;

        do {
            try {
                $result = $b2->deleteFile(
                    $file['cloud_file_id'],
                    'locked/' . $file['filename']
                );

                if ($result) {
                    return true;
                }

            } catch (\Exception $e) {
                return response()->json(['Delete retry error' => $e->getMessage()]);
            }

            $attempt++;
            sleep(1); // simple backoff (can improve later)

        } while ($attempt < $maxRetries);

        return false;
    }

    public function getStatus($id)
    {
        $document = Document::findOrFail($id);

        return response()->json([
            'status' => $document->status,
            'error_message' => $document->error_message,
        ]);
    }

    public function keep(Request $request)
    {
        $request->validate([
            'document_id' => ['required', 'exists:documents,document_id'],
        ]);

        $document = Document::findOrFail($request->document_id);

        abort_if($document->status !== 'decrypted', 400, 'Invalid state');

        $document->update([
            'status' => 'stored'
        ]);

        return [
            'message' => 'Document kept successfully'
        ];
    }















/** TEST FUNCTIONS */

    public function getFileInfo(Request $request)
    {
        $b2 = new B2Service();

        return response()->json($b2->getFileInfo('4_zac0be882136b3cf396dc0f15_f102b21419ace697b_d20260408_m151014_c005_v0501039_t0004_u01775661014587'));
    }

    public function upload_to_cloud(Request $request)
    {
        //basic upload to b2
            // try {
            //     $path = Storage::disk('b2')->putFileAs(
            //         'locked-documents',
            //         $request->file('file'),
            //         $request->file('file')->getClientOriginalName()
            //     );

            //     if (!$path) {
            //         throw new \Exception('Upload failed: returned false');
            //     }

            //     return back()->with('success', $path);

            // } catch (\Throwable $e) {
            //     return back()->with('error', $e->getMessage());
            // }
    }

    public function download2(Request $request)
    {
        //baasic retrieval, raw file content
            // $content = Storage::disk('b2')->get('locked-documents/As_The_Deer_Sheet_Music.pdf');
            // return back()->with('success', $content);

        //force browser download file
        try {

            $path = 'locked-documents/As_The_Deer_Sheet_Music.pdf';

            $disk = Storage::disk('b2');

            if (!$disk->exists($path)) {
                return back()->with('error', 'File not found');
            }

            $stream = $disk->readStream($path);

            if (!$stream) {
                throw new \Exception('Unable to open file stream');
            }

            $filename = basename($path);

            return response()->streamDownload(function () use ($stream) {
                fpassthru($stream);
            }, $filename);

        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function download_cloud(Request $request)
    {
        //final download code
        $b2 = new B2Service();
        $response = $b2->download('4_zac0be882136b3cf396dc0f15_f106b48e4795636f5_d20260331_m104116_c005_v0501043_t0052_u01774953676447');

        $headers = $response->headers();

        $fileName = $headers['x-bz-file-name'][0] ?? 'download.bin';
        $mimeType = $headers['content-type'][0] ?? 'application/octet-stream';

        return response()->stream(function () use ($response) {
            $body = $response->getBody();

            while (!$body->eof()) {
                echo $body->read(1024 * 8); // 8KB chunks
                flush();
            }
        }, 200, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'attachment; filename="'.$fileName.'"',
            'Cache-Control' => 'no-store, no-cache',
        ]);
    }

    public function upload_(Request $request)
    {
        $b2 = new B2Service();
        $data = $b2->listFiles();

        $textFiles = [];

        foreach ($data['files'] as $file) {
            if ($file['contentType'] === 'text/plain') {
                $textFiles[] = $file;
            }
        }

        foreach ($textFiles as $index => $file) {
            if ($index > 2) {
                $fileName = basename($file['fileName']);
                $localFile =  storage_path('app/public/cover_texts/'. $fileName);

                $folder = storage_path('app/public/failed/');
                if (!file_exists($folder)) {
                    mkdir($folder, 0755, true);
                }
                // move the file
                rename($localFile, $folder . $fileName);
            }
        }

        //return back()->with('success', );
    }

    public function upload__(Request $request)
    {
        $b2 = new B2Service();
        $data =  $b2->download('4_zac0be882136b3cf396dc0f15_f111e95524ba0ed7c_d20260331_m154239_c005_v0501039_t0059_u01774971759743');

        return back()->with('success', $data);
    }

    public function upload_cloud(Request $request)
    {
        // Validate
        $request->validate([
            'file' => 'required|file|mimes:pdf,doc,docx,txt|min:1|max:5120'
        ]);

        $file = $request->file('file');

        // 2:
        try { // 2.1: catches file duplication errors per user

            // 2.2: Generate hash (REAL duplicate check)
            $fileHash = hash_hmac('sha256', file_get_contents($file->getRealPath()), config('app.key'));

            // 2.3: Store uploaded file in cloud temporarily
            try {
                $b2 = new B2Service();
                $data = $b2->uploadFile($file);

                if (!$data) {
                    throw new \Exception('Upload failed');
                }

            } catch (\Throwable $e) {
                return back()->with('error', $e->getMessage());
            }

            // 2.4: Save document record in DB
            $document = Document::create([
                'user_id' => Auth::id(),
                'filename' => $file->getClientOriginalName(),
                'file_type' => $file->getClientOriginalExtension(),
                'file_hash' => $fileHash,
                'original_size' => $file->getSize(),
                'status' => 'uploaded'
            ]);


            if ($document) { // 2.5: check if storage in db successful
                // 2.6 dispatch encryption job async
                //EncryptDocumentJob::dispatchSync($document->document_id, $data);
            }

        } catch (QueryException $e) {

            return back()->withErrors([
                'file' => ['You already uploaded this document', $e->getMessage()]
            ]);
        }
    }

    public function unlock_local(Request $request) //local
    {
        $document = Document::findOrFail($request->id);
        if (!$document) {
            return back()->withErrors('errors', 'Document not found');
        }

        try
        {
            //Fetch stego files from storage
            $stegoMap = StegoMap::where('document_id', $document->document_id)->firstOrFail();
            $stegoFiles = StegoFile::where('stego_map_id', $stegoMap->stego_map_id)->get()->toArray();

            if($document->fragment_count !== count($stegoFiles)) { //db check
                throw new \Exception("Corrupted file error: Mismatched fragment count");
            }

            foreach ($stegoFiles as $file) { //storage check
                if (!file_exists(storage_path('app/public/' . $file['stego_path']))) {
                    throw new \Exception("Corrupted file error: Missing stego file");
                }
            }

            //dispatch extraction
            ExtractFragmentJob::dispatchSync($stegoMap->stego_map_id, $stegoFiles);

            //return back()->with('success', $stegoFiles);
        } catch (\Throwable $e) {
            $document->update([
                'status' => 'failed',
                'error_message' => ['File fetch error', $e->getMessage()]
            ]);
        }
    }
}

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
use App\Models\User;



class DocumentController extends Controller
{

    /**
     *
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
                'created_at',
                'encryption_mode'
            ])->map(function ($doc) {
                $doc->starred = $doc->isStarredBy(Auth::user());
                return $doc;
            });

        $user = Auth::user();

        return Inertia::render('MyDocuments', [
            'documents' => $documents,
            'totalStorage' => $user->storage_used,
            'storageLimit' => $user->storage_limit,
        ]);
    }

    /**
     *
     */
    public function starred()
    {
        $documents = Document::whereHas('sharedWith', function ($query) {
            $query->where('user_id', Auth::id())
                ->where('starred', true);
        })
        ->orWhere(function ($query) {
            $query->where('user_id', Auth::id())
                ->whereHas('sharedWith', function ($q) {
                    $q->where('user_id', Auth::id())
                        ->where('starred', true);
                });
        })
        ->latest()
        ->get([
            'document_id',
            'filename',
            'file_type',
            'original_size',
            'in_cloud_size',
            'status',
            'fragment_count',
            'created_at',
            'user_id'
        ])->map(function ($doc) {
            $doc->starred = true;
            $doc->owner_name = $doc->user->name;
            return $doc;
        });

        $user = Auth::user();

        return Inertia::render('Starred', [
            'documents' => $documents,
            'totalStorage' => $user->storage_used,
            'storageLimit' => $user->storage_limit,
        ]);
    }

    /**
     *
     */
    public function sharedWithMe()
    {
        $documents = Document::whereHas('sharedWith', function ($query) {
            $query->where('user_id', Auth::id())
                ->whereNotNull('shared_by');
        })
        ->latest()
        ->get([
            'document_id',
            'filename',
            'file_type',
            'original_size',
            'in_cloud_size',
            'status',
            'fragment_count',
            'created_at',
            'user_id'
        ])->map(function ($doc) {
            $doc->owner_name = $doc->user->name;
            $doc->starred = $doc->isStarredBy(Auth::user());
            return $doc;
        });

        $user = Auth::user();

        return Inertia::render('SharedWithMe', [
            'documents' => $documents,
            'totalStorage' => $user->storage_used,
            'storageLimit' => $user->storage_limit,
        ]);
    }

    /**
     * Toggle star for document
     */
    public function toggleStar(Request $request)
    {
        $request->validate([
            'document_id' => 'required|exists:documents,document_id'
        ]);

        $document = Document::findOrFail($request->document_id);

        $pivot = $document->sharedWith()->firstOrCreate(
            ['user_id' => Auth::id()],
            ['shared_by' => null]
        );

        $current = $pivot->pivot->starred;
        $document->sharedWith()->updateExistingPivot(Auth::id(), [
            'starred' => !$current
        ]);

        return response()->json([
            'starred' => !$current
        ]);
    }

    /**
     * Share document with user
     */
    public function share(Request $request)
    {
        $request->validate([
            'document_id' => 'required|exists:documents,document_id',
            'email' => 'required|email|exists:users,email'
        ]);

        $document = Document::where('id', $request->document_id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $sharedUser = \App\Models\User::where('email', $request->email)->firstOrFail();

        if ($sharedUser->id === Auth::id()) {
            return response()->json([
                'message' => 'Cannot share document with yourself'
            ], 400);
        }

        $document->sharedWith()->syncWithoutDetaching([
            $sharedUser->id => [
                'shared_by' => Auth::id(),
                'permission' => 'view'
            ]
        ]);

        return response()->json([
            'message' => 'Document shared successfully'
        ]);
    }

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

            // Cleanup the temp upload file if it exists and encryption failed
            if ($request->temp_path && Storage::exists($request->temp_path)) {
                Storage::delete($request->temp_path);
            }

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
                'error_message' => 'Encryption failed: ' . $e->getMessage()
            ]);

            // Ensure the temp upload file is deleted on failure
            if (Storage::exists($temp_filePath)) {
                Storage::delete($temp_filePath);
            }

            throw $e; // Rethrow to let the caller handle it
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
        $document = Document::findOrFail($request->document_id);

        if (!in_array($document->status, ['stored', 'decrypted', 'retrieved'])) {
            abort(400, 'Invalid document status for unlocking');
        }

        $masterKey = session('master_key');
        if (!$masterKey) {
            abort(403, 'Master key not found in session. Please log in again.');
        }

        // Dispatch the unlocking process to the background
        // Base64 encode the key to avoid JSON encoding errors with binary data
        \App\Jobs\ProcessUnlockJob::dispatch($document->document_id, base64_encode($masterKey));

        return response()->json([
            'success' => true,
            'message' => 'Unlocking file',
            'status' => 'stored' // It stays stored while fetching
        ]);
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

        // Update status to retrieved
        $document->update(['status' => 'retrieved']);

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

        $is_deletable = false;
        if (in_array($document->status, ['stored', 'decrypted', 'retrieved', 'failed'])) {
            $is_deletable = true;
        }

        if ($is_deletable === false) {
            abort(400, 'File not in a deletable state');
        }

        $stegoMap = StegoMap::where('document_id', $document->document_id)->first();
        $stegoFiles = [];
        
        if ($stegoMap) {
            $stegoFiles = StegoFile::where('stego_map_id', $stegoMap->stego_map_id)
                ->select('cloud_file_id', 'filename', 'stego_file_id')
                ->get()
                ->toArray();
        }

        if(empty($stegoFiles) && !in_array($document->status, ['failed', 'uploaded', 'encrypted', 'fragmented', 'mapped'])) {
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

            // Cleanup local decrypted file if it exists
            $localPath = 'temp/decrypted/' . $document->filename;
            if (Storage::exists($localPath)) {
                Storage::delete($localPath);
            }

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

        abort_if(!in_array($document->status, ['decrypted', 'retrieved']), 400, 'Invalid state');

        $document->update([
            'status' => 'stored'
        ]);

        // Cleanup local decrypted file
        $localPath = 'temp/decrypted/' . $document->filename;
        if (Storage::exists($localPath)) {
            Storage::delete($localPath);
        }

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

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
use App\Models\Folder;
use App\Models\DocumentShare;
use App\Models\DocumentActivity;
use App\Services\CryptoService;



class DocumentController extends Controller
{
    protected $primaryKey = 'document_id';
    protected $cryptoService;

    public function __construct(CryptoService $cryptoService)
    {
        $this->cryptoService = $cryptoService;
    }

    /**
     * Returns json containing the current user's documents, totalStorage, and storageLimit
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $user->refreshStorageUsed();
        $folderId = $request->folder_id;

        // Fetch owned documents
        $query = Document::withCount('shares')
            ->where('user_id', Auth::id())
            ->latest();

        if (!is_null($folderId)) {
            $query->where('folder_id', $folderId);
        }

        $documents = $query->get()
            ->map(function ($doc) {
                $doc->is_owner = true;
                return $doc;
            });

        // If folder_id is provided, also fetch shared documents in this folder
        if ($folderId) {
            $sharedDocs = DocumentShare::with('document')
                ->where('recipient_id', Auth::id())
                ->where('folder_id', $folderId)
                ->where('status', 'accepted')
                ->get()
                ->map(function ($share) {
                    $doc = $share->document;
                    $doc->is_owner = false;
                    $doc->is_shared = true;
                    $doc->folder_id = $share->folder_id;
                    $doc->share_id = $share->share_id;
                    return $doc;
                });
            
            $documents = $documents->concat($sharedDocs)->sortByDesc('created_at')->values();
        }

        $folders = \App\Models\Folder::where('user_id', Auth::id())
            ->where('parent_id', $folderId)
            ->orderBy('name')
            ->get();

        $currentFolder = $folderId ? \App\Models\Folder::find($folderId) : null;

        $breadcrumbs = [];
        $tempFolder = $currentFolder;
        while ($tempFolder) {
            array_unshift($breadcrumbs, [
                'folder_id' => $tempFolder->folder_id,
                'name' => $tempFolder->name
            ]);
            $tempFolder = $tempFolder->parent_id ? \App\Models\Folder::find($tempFolder->parent_id) : null;
        }

        return Inertia::render('MyDocuments', [
            'documents' => $documents,
            'folders' => $folders,
            'currentFolder' => $currentFolder,
            'breadcrumbs' => $breadcrumbs,
            'totalStorage' => $user->storage_used,
            'storageLimit' => $user->storage_limit,
            'title' => $currentFolder ? $currentFolder->name : 'My Documents'
        ]);
    }

    public function allDocumentsIndex()
    {
        $user = Auth::user();
        $user->refreshStorageUsed();

        $documents = Document::withCount('shares')
            ->where('user_id', Auth::id())
            ->latest()
            ->get()
            ->map(function ($doc) {
                $doc->is_owner = true;
                return $doc;
            });

        // Fetch documents shared with the user
        $sharedDocs = Document::whereIn('document_id', function ($query) {
                $query->select('document_id')
                    ->from('document_shares')
                    ->where('recipient_id', Auth::id())
                    ->where('status', 'accepted');
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
                'error_message',
                'is_starred'
            ])
            ->map(function ($doc) {
                $doc->is_owner = false;
                $doc->is_shared = true;
                return $doc;
            });

        $allDocuments = $documents->concat($sharedDocs)->sortByDesc('created_at')->values();

        $folders = \App\Models\Folder::where('user_id', Auth::id())
            ->orderBy('name')
            ->get();

        return Inertia::render('MyDocuments', [
            'documents' => $allDocuments,
            'folders' => $folders,
            'totalStorage' => $user->storage_used,
            'storageLimit' => $user->storage_limit,
            'title' => 'All Documents'
        ]);
    }

    public function manageStorage()
    {
        $user = Auth::user();
        $user->refreshStorageUsed();

        $documents = Document::where('user_id', Auth::id())
            ->latest()
            ->get();

        return Inertia::render('ManageStorage', [
            'documents' => $documents,
            'totalStorage' => $user->storage_used,
            'storageLimit' => $user->storage_limit,
        ]);
    }

    public function sharedIndex()
    {
        $user = Auth::user();
        $user->refreshStorageUsed();

        // Fetch accepted shared documents
        $acceptedShares = Document::whereIn('document_id', function ($query) {
                $query->select('document_id')
                    ->from('document_shares')
                    ->where('recipient_id', Auth::id())
                    ->where('status', 'accepted');
            })
            ->latest()
            ->get()
            ->map(function ($doc) {
                $doc->is_owner = false;
                $doc->is_shared = true;
                return $doc;
            });

        // Fetch pending shares
        $pendingShares = DocumentShare::with(['document', 'sender'])
            ->where('recipient_id', Auth::id())
            ->where('status', 'pending')
            ->get()
            ->map(function ($share) {
                $share->is_expired = $share->expires_at && $share->expires_at->isPast();
                return $share;
            });

        // Fetch shares sent by the user, grouped by document
        $sentShares = DocumentShare::with(['document', 'recipient'])
            ->where('sender_id', Auth::id())
            ->latest()
            ->get()
            ->groupBy('document_id')
            ->map(function ($shares) {
                $doc = $shares->first()->document;
                return [
                    'document_id' => $doc->document_id,
                    'filename' => $doc->filename,
                    'file_type' => $doc->file_type,
                    'created_at' => $doc->created_at,
                    'recipients' => $shares->map(function ($share) {
                        return [
                            'share_id' => $share->share_id,
                            'name' => $share->recipient->name,
                            'email' => $share->recipient->email,
                            'status' => $share->status,
                            'shared_at' => $share->created_at,
                        ];
                    })
                ];
            })
            ->values();

        $folders = \App\Models\Folder::where('user_id', Auth::id())
            ->orderBy('name')
            ->get();

        return Inertia::render('SharedDocuments', [
            'documents' => $acceptedShares,
            'pendingShares' => $pendingShares,
            'sentShares' => $sentShares,
            'folders' => $folders,
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

            DocumentActivity::create([
                'document_id' => $document->document_id,
                'user_id' => Auth::id(),
                'action' => 'locking_started',
                'metadata' => ['filename' => $document->filename]
            ]);

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

        $isOwner = $document->user_id === Auth::id();
        if (!$isOwner) {
            // Check if it's an accepted share
            $share = DocumentShare::where('document_id', $document->document_id)
                ->where('recipient_id', Auth::id())
                ->where('status', 'accepted')
                ->firstOrFail();

            if ($share->expires_at && $share->expires_at->isPast()) {
                abort(403, 'This share has expired.');
            }

            // Log activity for the recipient unlocking the file
            DocumentActivity::create([
                'document_id' => $document->document_id,
                'user_id' => Auth::id(),
                'action' => 'unlocked'
            ]);
        }

        if (!in_array($document->status, ['stored', 'decrypted', 'retrieved'])) {
            abort(400, 'Invalid document status for unlocking');
        }

        $masterKey = session('master_key');
        if (!$masterKey) {
            abort(403, 'Master key not found in session. Please log in again.');
        }

        // Dispatch the unlocking process to the background
        \App\Jobs\ProcessUnlockJob::dispatch($document->document_id, base64_encode($masterKey), Auth::id());

        return response()->json([
            'success' => true,
            'message' => 'Unlocking file',
            'status' => $isOwner ? $document->status : ($share->processing_status ?? 'stored')
        ]);
    }

    /**
     * Downloads the requested document from local storage after decryption
     */
    public function download($id)
    {
        $document = Document::findOrFail($id);
        $userId = Auth::id();
        $status = $document->status;

        if ($document->user_id !== $userId) {
            $share = DocumentShare::where('document_id', $id)
                ->where('recipient_id', $userId)
                ->firstOrFail();
            $status = $share->processing_status;
        }

        if ($status !== 'decrypted' && $status !== 'retrieved') {
            abort(400, 'File not ready');
        }

        $path = 'temp/decrypted/' . $userId . '/' . $document->document_id . '/' . $document->filename;

        if (!Storage::exists($path)) {
            abort(404, 'File missing');
        }

        // Update status to retrieved
        if ($document->user_id !== $userId) {
            $share->update(['processing_status' => 'retrieved']);
        } else {
            $document->update(['status' => 'retrieved']);
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

        // 1. Check if deletable status
        $deletableStatuses = ['stored', 'decrypted', 'retrieved', 'failed', 'uploaded', 'encrypted', 'fragmented', 'mapped', 'embedded'];
        if (!in_array($document->status, $deletableStatuses)) {
            abort(400, 'File not in a deletable state');
        }

        try {
            $stegoMap = StegoMap::where('document_id', $document->document_id)->first();
            $stegoFiles = [];
            
            if ($stegoMap) {
                $stegoFiles = StegoFile::where('stego_map_id', $stegoMap->stego_map_id)
                    ->select('cloud_file_id', 'filename', 'stego_file_id')
                    ->get()
                    ->toArray();
            }

            // 2. Delete cloud files if they exist
            if (!empty($stegoFiles)) {
                $b2 = new B2Service();
                $failedFiles = [];

                foreach ($stegoFiles as $file) {
                    $deleted = $this->deleteWithRetry($b2, $file);
                    if (!$deleted) {
                        $failedFiles[] = $file['stego_file_id'];
                    }
                }

                if (!empty($failedFiles)) {
                    return response()->json([
                        'message' => 'Some files failed to delete from cloud storage. Deletion aborted to prevent storage leakage.',
                        'failed' => $failedFiles
                    ], 500);
                }
            }

            // 3. Storage Cleanup (only if cloud files were present or recorded)
            $user->refreshStorageUsed();

            // 4. Cleanup local decrypted file if it exists
            $localPath = 'temp/decrypted/' . $document->filename;
            if (Storage::exists($localPath)) {
                Storage::delete($localPath);
            }

            // 5. Delete DB record (Cascade delete handles fragments, stego_maps, stego_files)
            DocumentActivity::create([
                'document_id' => $document->document_id,
                'user_id' => Auth::id(),
                'action' => 'deleted',
                'metadata' => ['filename' => $document->filename]
            ]);
            $document->forceDelete();

            return response()->json(['message' => 'Document and associated cloud files deleted successfully']);

        } catch (\Throwable $e) {
            return response()->json(['error' => 'Deletion failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Deletes a file from B2 with retry logic
     * @return bool
     */
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
                // Log the error but continue to retry
                \Illuminate\Support\Facades\Log::error("B2 Delete Attempt {$attempt} failed: " . $e->getMessage());
            }

            $attempt++;
            if ($attempt < $maxRetries) {
                sleep(1); 
            }

        } while ($attempt < $maxRetries);

        return false;
    }

    public function getStatus($id)
    {
        $document = Document::findOrFail($id);
        
        // If recipient, get status from shares table
        if ($document->user_id !== Auth::id()) {
            $share = DocumentShare::where('document_id', $id)
                ->where('recipient_id', Auth::id())
                ->first();
            
            if ($share && $share->processing_status) {
                return response()->json([
                    'status' => $share->processing_status,
                    'error_message' => null, // We could add this to shares table too if needed
                ]);
            }
        }

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
        $userId = Auth::id();

        // Check if recipient
        if ($document->user_id !== $userId) {
            $share = DocumentShare::where('document_id', $document->document_id)
                ->where('recipient_id', $userId)
                ->firstOrFail();
            
            abort_if(!in_array($share->processing_status, ['decrypted', 'retrieved']), 400, 'Invalid state');

            $share->update(['processing_status' => null]);
        } else {
            abort_if(!in_array($document->status, ['decrypted', 'retrieved']), 400, 'Invalid state');
            $document->update(['status' => 'stored']);
        }

        // Cleanup local decrypted file for THIS user
        $localPath = 'temp/decrypted/' . $userId . '/' . $document->document_id . '/' . $document->filename;
        if (Storage::exists($localPath)) {
            Storage::deleteDirectory('temp/decrypted/' . $userId . '/' . $document->document_id);
        }

        return [
            'message' => 'Document kept successfully'
        ];
    }

    private function parseKey($key)
    {
        if (str_starts_with($key, 'base64:')) {
            return base64_decode(substr($key, 7));
        }
        return $key;
    }

    public function share(Request $request)
    {
        $request->validate([
            'document_id' => 'required|exists:documents,document_id',
            'email' => 'required|email',
        ]);

        $document = Document::where('document_id', $request->document_id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $recipient = \App\Models\User::where('email', $request->email)->first();

        if (!$recipient) {
            return response()->json([
                'error' => "The user with email '{$request->email}' was not found. Please ensure they have an account on Stegolock before sharing."
            ], 404);
        }

        if ($recipient->id === Auth::id()) {
            return response()->json(['error' => 'You cannot share a document with yourself.'], 422);
        }

        $masterKey = session('master_key');
        if (!$masterKey) {
            return response()->json(['error' => 'Master key not found in session.'], 403);
        }

        // 1. Unwrap the DEK using Owner's Master Key
        $dek = $this->cryptoService->unwrapDek(
            base64_decode($document->encrypted_dek),
            $masterKey,
            base64_decode($document->dek_nonce),
            base64_decode($document->dek_tag),
            base64_decode($document->dk_salt)
        );

        if (!$dek) {
             return response()->json(['error' => 'Failed to unwrap document key.'], 500);
        }

        // 2. Wrap the DEK using the System Share Key
        $systemKey = $this->parseKey(config('app.share_key') ?? config('app.key'));
        $wrapped = $this->cryptoService->wrapDek($dek, $systemKey);

        // 3. Create or update the share and log activity in transaction
        \Illuminate\Support\Facades\DB::transaction(function() use ($document, $recipient, $wrapped) {
            DocumentShare::updateOrCreate(
                [
                    'document_id' => $document->document_id,
                    'recipient_id' => $recipient->id,
                ],
                [
                    'sender_id' => Auth::id(),
                    'encrypted_dek' => base64_encode($wrapped['encrypted_dek']),
                    'dek_nonce' => base64_encode($wrapped['nonce']),
                    'dek_tag' => base64_encode($wrapped['tag']),
                    'dk_salt' => base64_encode($wrapped['salt']),
                    'status' => 'pending',
                    'expires_at' => now()->addHours(24),
                ]
            );

            DocumentActivity::create([
                'document_id' => $document->document_id,
                'user_id' => Auth::id(),
                'action' => 'shared',
                'metadata' => ['recipient_email' => $recipient->email, 'recipient_name' => $recipient->name]
            ]);
        });

        return response()->json(['message' => 'Document shared successfully with ' . $recipient->name]);
    }

    public function acceptShare(Request $request)
    {
        $request->validate([
            'document_id' => 'required|exists:documents,document_id',
        ]);

        $share = DocumentShare::where('document_id', $request->document_id)
            ->where('recipient_id', Auth::id())
            ->where('status', 'pending')
            ->firstOrFail();

        if ($share->expires_at && $share->expires_at->isPast()) {
            return response()->json(['error' => 'This share invitation has expired.'], 403);
        }

        $masterKey = session('master_key');
        if (!$masterKey) {
            return response()->json(['error' => 'Master key not found in session.'], 403);
        }

        // 1. Unwrap with System Key
        $systemKey = $this->parseKey(config('app.share_key') ?? config('app.key'));
        $dek = $this->cryptoService->unwrapDek(
            base64_decode($share->encrypted_dek),
            $systemKey,
            base64_decode($share->dek_nonce),
            base64_decode($share->dek_tag),
            base64_decode($share->dk_salt)
        );

        if (!$dek) {
             return response()->json(['error' => 'Failed to unwrap document key.'], 500);
        }

        // 2. Re-wrap with User B's Master Key
        $wrapped = $this->cryptoService->wrapDek($dek, $masterKey);

        // 3. Update share status and wrapped DEK
        $share->update([
            'encrypted_dek' => base64_encode($wrapped['encrypted_dek']),
            'dek_nonce' => base64_encode($wrapped['nonce']),
            'dek_tag' => base64_encode($wrapped['tag']),
            'dk_salt' => base64_encode($wrapped['salt']),
            'status' => 'accepted',
        ]);

        // 4. Log Activity
        DocumentActivity::create([
            'document_id' => $share->document_id,
            'user_id' => Auth::id(),
            'action' => 'accepted'
        ]);

        return response()->json(['message' => 'Share accepted successfully.']);
    }

    public function removeAccess(Request $request)
    {
        $request->validate([
            'document_id' => 'nullable|exists:documents,document_id',
            'share_id' => 'nullable|exists:document_shares,share_id',
        ]);

        if ($request->share_id) {
            $share = DocumentShare::where('share_id', $request->share_id)
                ->where(function ($q) {
                    $q->where('sender_id', Auth::id())
                      ->orWhere('recipient_id', Auth::id());
                })
                ->firstOrFail();
            
            \Illuminate\Support\Facades\DB::transaction(function() use ($share) {
                DocumentActivity::create([
                    'document_id' => $share->document_id,
                    'user_id' => Auth::id(),
                    'action' => 'removed',
                    'metadata' => [
                        'target_user_id' => $share->recipient_id, 
                        'target_user_email' => $share->recipient ? $share->recipient->email : 'Unknown'
                    ]
                ]);

                $share->delete();
            });
            return response()->json(['message' => 'Access removed.']);
        }

        if ($request->document_id) {
            // If I'm the owner/sender, remove all shares
            DocumentShare::where('document_id', $request->document_id)
                ->where('sender_id', Auth::id())
                ->each(function($share) {
                    DocumentActivity::create([
                        'document_id' => $share->document_id,
                        'user_id' => Auth::id(),
                        'action' => 'removed',
                        'metadata' => ['target_user_id' => $share->recipient_id]
                    ]);
                    $share->delete();
                });
                
            // If I'm the recipient, remove just my share
            DocumentShare::where('document_id', $request->document_id)
                ->where('recipient_id', Auth::id())
                ->each(function($share) {
                     DocumentActivity::create([
                        'document_id' => $share->document_id,
                        'user_id' => Auth::id(),
                        'action' => 'removed',
                        'metadata' => ['self' => true]
                    ]);
                    $share->delete();
                });

            return response()->json(['message' => 'Access removed.']);
        }

        return response()->json(['error' => 'Invalid request.'], 422);
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

    public function moveDocument(Request $request, $id)
    {
        $request->validate([
            'folder_id' => 'nullable|exists:folders,folder_id'
        ]);

        $userId = Auth::id();

        // 1. Check if user owns the document
        $document = Document::where('document_id', $id)
            ->where('user_id', $userId)
            ->first();

        if ($document) {
            $document->folder_id = $request->folder_id;
            $document->save();
            return response()->json([
                'message' => 'Document moved successfully',
                'document' => $document
            ]);
        }

        // 2. Check if user is a recipient of a share for this document
        $share = DocumentShare::where('document_id', $id)
            ->where('recipient_id', $userId)
            ->where('status', 'accepted')
            ->first();

        if ($share) {
            $share->folder_id = $request->folder_id;
            $share->save();
            return response()->json([
                'message' => 'Shared document moved successfully',
                'share' => $share
            ]);
        }

        abort(404, 'Document not found or access denied');
    }

    public function rename(Request $request, $id)
    {
        $request->validate([
            'filename' => 'required|string|max:255'
        ]);

        $document = Document::where('document_id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $oldName = $document->filename;
        $document->filename = $request->filename;
        $document->save();

        DocumentActivity::create([
            'document_id' => $document->document_id,
            'user_id' => Auth::id(),
            'action' => 'renamed',
            'metadata' => [
                'old_name' => $oldName,
                'new_name' => $request->filename
            ]
        ]);

        return response()->json([
            'message' => 'Document renamed successfully',
            'document' => $document
        ]);
    }
    public function getActivity($id)
    {
        $document = Document::where('document_id', $id)
            ->where(function ($q) {
                $q->where('user_id', Auth::id())
                  ->orWhereIn('document_id', function ($sq) {
                      $sq->select('document_id')
                        ->from('document_shares')
                        ->where('recipient_id', Auth::id())
                        ->where('status', 'accepted');
                  });
            })
            ->firstOrFail();

        $activities = DocumentActivity::with('user:id,name,email')
            ->where('document_id', $id)
            ->latest()
            ->get();

        return response()->json($activities);
    }

    public function getRecipients($id)
    {
        $document = Document::where('document_id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $shares = DocumentShare::with('recipient:id,name,email')
            ->where('document_id', $id)
            ->get()
            ->map(function ($share) {
                return [
                    'share_id' => $share->share_id,
                    'user' => $share->recipient,
                    'status' => $share->status,
                    'is_expired' => $share->expires_at && $share->expires_at->isPast(),
                    'expires_at' => $share->expires_at,
                    'created_at' => $share->created_at,
                ];
            });

        return response()->json($shares);
    }
}

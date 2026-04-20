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

use App\Jobs\ExtractFragmentJob;

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
    public function lock(Request $request) {
        $document = Document::findOrFail($request->document_id);
        $isLocked = false;

        $encrypted_path = $this->encrypt($document->document_id, $request->temp_path);
        $segmented = $this->segment($document->document_id, $encrypted_path);

        //fetch cover files from cloud
        $b2 = new B2Service();
        $files = $b2->listFiles();
        $cloudFiles = collect($files['files'])
            ->map(function ($file) {
                return [
                    'id' => $file['fileId'],
                    'fileName' => $file['fileName'],
                ];
            })
            ->values()
            ->toArray();

        $mapId = "";

        $localCovers = [];
        //after successful segmentation
        if ($segmented) {
            $mapId = $this->mapFragmentsToCovers($document->document_id);

            $maxAttempts = 3;
            $attempt = 0;

            do {
                $fetchedData = $this->fetchCoverFiles(strval($mapId), $cloudFiles);
                $attempt++;

                if ($fetchedData['matched']) {
                    break;
                }

            } while ($attempt < $maxAttempts);

            if (!$fetchedData['matched']) {
                throw new \Exception("Cover mismatch after {$attempt} attempts");
            }

            $localCovers[] = $fetchedData['localCovers'];

            $embedded = $this->embedFragments($mapId, $cloudFiles, $localCovers);
            $isLocked = true;
            return $embedded;
        } else return ['isLocked' => $isLocked, 'error' => 'Document could not be locked'];

        return ['isLocked' => $isLocked, 'success' => 'Document locked successfully'];
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

            // 2. Generate a random document key salt (32 bytes)
            $dk_salt = random_bytes(Constant::DK_SALT_LEN);

            // 3. Get master key from session
            $masterKey = session('master_key');
            if (!$masterKey) {
                throw new \Exception('Master key not found in session.');
            }

            // 4. Derive the document key using HKDF | Output length: 32 bytes (256-bit key)
            $documentKey = hash_hkdf('sha256', $masterKey, 32, 'document-enc-key', $dk_salt);

            // 5. AES-256-GCM encryption
            $nonce = random_bytes(Constant::NONCE_LEN); // 96-bit recommended IV/nonce
            $tag = '';
            $ciphertext = openssl_encrypt(
                $plaintext,
                'aes-256-gcm',
                $documentKey,
                OPENSSL_RAW_DATA,
                $nonce,
                $tag
            );

            // 5. Save encrypted file (store nonce/IV + tag + ciphertext)
            $encPath = 'temp/encrypted/' . pathinfo(basename(''.$temp_filePath), PATHINFO_FILENAME) . '.stegolock';

            Storage::put($encPath, $nonce . $tag . $ciphertext);

            //6. Update the database with encryption info
            $document->update([
                'dk_salt' => base64_encode($dk_salt),
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

    private function segment(string $documentId, string $filePath)
    {
        $document = Document::find($documentId);
        if (!$document) return;

        $isSegmented = false;
        try {

            $ciphertext = file_get_contents(Storage::path($filePath));

            if ($ciphertext === false) return;

            $ciphertextLength = strlen($ciphertext);

            if ($ciphertextLength > 2097152) {
                // > 2 MB → random fragment size between 320 KB and 512 KB
                $fragmentSize = random_int(327680, 524288);
                $fragments = str_split($ciphertext, $fragmentSize);
            } elseif ($ciphertextLength > 512000) {
                // > 500 KB < length ≤ 2 MB → random fragment size between 192KB and 256KB
                $fragmentSize = random_int(196608, 262144);
                $fragments = str_split($ciphertext, $fragmentSize);
            } elseif ($ciphertextLength > 102400) {
                // 100 KB < length ≤ 500 KB → split into 5 equal-ish fragments
                $numFragments = 5;
                $fragments = [];
                $partSize = intdiv($ciphertextLength, $numFragments);
                $remainder = $ciphertextLength % $numFragments;

                $offset = 0;
                for ($i = 0; $i < $numFragments; $i++) {
                    $size = $partSize + ($i < $remainder ? 1 : 0); // distribute remainder
                    $fragments[] = substr($ciphertext, $offset, $size);
                    $offset += $size;
                }
            } else {
                // ≤ 100 KB → split into 3 equal-ish fragments
                $numFragments = 3;
                $fragments = [];
                $partSize = intdiv($ciphertextLength, $numFragments);
                $remainder = $ciphertextLength % $numFragments;

                $offset = 0;
                for ($i = 0; $i < $numFragments; $i++) {
                    $size = $partSize + ($i < $remainder ? 1 : 0); // distribute remainder
                    $fragments[] = substr($ciphertext, $offset, $size);
                    $offset += $size;
                }
            }

            $totalSize = 0;

            foreach ($fragments as $index => $frag) {
                Fragment::create([
                    'fragment_id' => (string) Str::uuid(),
                    'document_id' => $documentId,
                    'index' => $index,
                    'blob' => base64_encode($frag),
                    'size' => strlen($frag),
                    'hash' => hash('sha256', $frag),
                    'status' => 'floating',
                ]);

                $totalSize += strlen($frag);
            }

            // Verification BEFORE deletion
            if ($totalSize !== $ciphertextLength) {
                throw new \Exception('Fragmentation failed: size mismatch');
            }

            // Update the database with fragments info
            $document->update([
                'fragment_count' => count($fragments),
                'status' => 'fragmented'
            ]);

            $isSegmented = true;

            // Safe to delete encrypted file
            Storage::delete($filePath);

            return $isSegmented;
        } catch (\Throwable $e) {
            // Update document with failure info
            $document->update([
                'status' => 'failed',
                'error_message' => ['Segmentation failed', $e->getMessage()]
            ]);
            return $isSegmented;
        }
    }

    private function mapFragmentsToCovers(string $documentId)
    {
        try {
            // PHASE 1: Allocation of fragments to cover types

                $document = Document::with('fragments')->find($documentId);

                if (!$document) {
                    throw new \Exception('Document not found');
                }

                if ($document->status !== 'fragmented') {
                    throw new \Exception('Document not ready for mapping');
                }

                $fragments = $document->fragments->shuffle()->values();
                $expectedCount = $document->fragment_count;

                if ($fragments->count() !== $expectedCount) {
                    throw new \Exception('Fragment count mismatch. Possible corruption or incomplete segmentation.');
                }

                $total = $fragments->count();
                // safety guard
                if ($total < 1) {
                    throw new \Exception('No fragments available for mapping.');
                }

                if ($total <= 5) {
                    // deterministic allocation for small fragment sets
                    $textCount  = 1;
                    $audioCount = 1;
                    $imageCount = $total - 2; // remaining fragments are images
                } else {
                    // percentage-based allocation for larger fragment sets
                    $textCount  = max(1, ceil($total * 0.1));
                    $audioCount = max(1, ceil($total * 0.2));
                    $imageCount = $total - $textCount - $audioCount;
                }

            // PHASE 2: Fetch valid covers
                $fragmentSize = $fragments->max('size');

                $textCoverPool  = Cover::where('type', 'text')
                    ->get()->map(fn ($c) => [
                                    'id' => $c->cover_id,
                                    'capacity' => $c->metadata['capacity'] ?? null,
                                ])
                                ->filter(fn ($c) => $c['capacity'] >= $fragmentSize)
                                ->values()->toArray();
                if (empty($textCoverPool)) {

                    while (count($textCoverPool) < $textCount) {
                        $newTextCover = $this->generate_text_cover($fragmentSize);

                        // normalize + append
                        $textCoverPool[] = [
                            'id' => $newTextCover->cover_id,
                            'capacity' => $newTextCover->metadata['capacity'] ?? 0,
                        ];
                    }

                }

                $audioCoverPool = Cover::where('type', 'audio')
                    ->get()->map(fn ($c) => [
                                    'id' => $c->cover_id,
                                    'capacity' => $c->metadata['capacity'] ?? null,
                                ])
                                ->filter(fn ($c) => $c['capacity'] >= $fragmentSize)
                                ->values()->toArray();
                if (empty($audioCoverPool)) {
                    // throw new \Exception('No available audio covers');
                    // while (count($audioCoverPool) < $audioCount) {
                        //$newAudioCover = $this->generate_audio_cover($fragmentSize);

                        // normalize + append
                        // $audioCoverPool[] = [
                        //     'id' => $newAudioCover->cover_id,
                        //     'capacity' => $newAudioCover->metadata['capacity'] ?? 0,
                        // ];
                    // }
                }

                $imageCoverPool = Cover::where('type', 'image')
                    ->get()->map(fn ($c) => [
                                    'id' => $c->cover_id,
                                    'capacity' => $c->metadata['capacity'] ?? null,
                                ])
                                ->filter(fn ($c) => $c['capacity'] >= $fragmentSize)
                                ->values()->toArray();
                if (empty($imageCoverPool)) {
                    throw new \Exception('No available image covers');
                }

            // PHASE 3: Mapping Proper
                $mappingArray = [];

                // Assign text fragments
                $textFragments = $fragments->take($textCount);
                foreach ($textFragments as $frag) {
                    $cover = collect($textCoverPool)->random();
                    $mappingArray[] = [
                        'fragment_id' => $frag->fragment_id,
                        'cover_id' => $cover['id'],
                        'offset' => 0,
                    ];
                }

                // Assign audio fragments
                $audioFragments = $fragments->slice($textCount, $audioCount);
                foreach ($audioFragments as $frag) {
                    $cover = collect($audioCoverPool)->random();
                    $mappingArray[] = [
                        'fragment_id' => $frag->fragment_id,
                        'cover_id' => $cover['id'],
                        'offset' => 0,
                    ];
                }

                // Assign image fragments
                $imageFragments = $fragments->slice($textCount + $audioCount, $imageCount);
                foreach ($imageFragments as $frag) {
                    $cover = collect($imageCoverPool)->random();
                    $mappingArray[] = [
                        'fragment_id' => $frag->fragment_id,
                        'cover_id' => $cover['id'],
                        'offset' => 0,
                    ];
                }

            // PHASE 4: Saving mapping to database
            $map = FragmentMap::create([
                'map_id' => (string) Str::uuid(),
                'document_id' => $document->document_id,
                'fragments_in_covers' => $mappingArray,
                'status' => 'pending',
            ]);

            $document->update([
                'status' => 'mapped',
                //success message, Mapping created successfully.
            ]);

            //update fragment status from floating to mapped

            return $map->map_id;

        } catch (\Throwable $e) {
            // Update document with failure info
            $document->update([
                'status' => 'failed',
                'error_message' => ['Mapping failed', $e->getMessage()]
            ]);
        }

    }

        private function generate_text_cover(int $fragmentSize)
        {
            $maxId = DB::table('wiki_feeds')->max('id');

            if (!$maxId) {
                return response()->json(['error' => 'No data in wiki_feeds'], 500);
            }

            $targetSize = $fragmentSize / 0.02;
            $content = '';
            $capacity = 0;

            while (strlen($content) < $targetSize) {

                $randomId = rand(1, $maxId);
                $feed = DB::table('wiki_feeds')->where('id', $randomId)->first();

                if (!$feed) continue;

                $block = "pageid: {$feed->pageid}\n";
                $block .= "title: {$feed->title}\n";
                $block .= "content: {$feed->feed}\n\n";

                if ($capacity > $targetSize) {
                    break;
                }

                $content .= $block;
                $capacity = floor(strlen($content) * 0.02);
            }

            // File name
            $randomHex = bin2hex(random_bytes(16));
            $fileName = "{$randomHex}_cover_" . time() . ".txt";

            // Ensure folder exists
            if (!file_exists(storage_path('app/private/temp/covers'))) {
                mkdir(storage_path('app/private/temp/covers'), 0755, true);
            }

            // Save file locally for immediate use
            Storage::disk('local')->put("temp/covers/{$fileName}", $content);

            $filePath = storage_path('app/private/temp/covers/' . $fileName);

            //Save file to DB
            $cover = Cover::create([
                'cover_id' => (string) Str::uuid(),      // generate UUID for PK
                'type' => 'text',
                'filename' => basename($filePath),
                'path' => 'cover_texts/' . basename($filePath), // storage path
                'size_bytes' => strlen($content),
                'metadata' => [
                                'valid' => true,
                                'capacity' => floor(strlen($content) * 0.02),
                                'info' => 'System-generated'
                ],
                'hash' => hash('sha256', file_get_contents($filePath)),
            ]);

            //Save file in cloud for future use
            // $b2 = new B2Service();
            // $b2->storeFile($filePath);

            return $cover;
        }

    /**
     * Fetch cover files from the cloud and create cover file copies in local storage for embedding
     */
    private function fetchCoverFiles(string $mapId, array $cloudFiles)
    {
        $b2 = new B2Service();

        //create local copies of cover files
        if (!file_exists(storage_path('app/private/temp/covers/'))) {
            mkdir(storage_path('app/private/temp/covers/'), 0755, true);
        }

        $map = FragmentMap::findOrFail($mapId);
        $mappedCovers = $map->fragments_in_covers;

        $document = Document::findOrFail($map->document_id);

        $cloudMap = collect($cloudFiles)
            ->keyBy('fileName');

        $localCovers = [];

        foreach ($mappedCovers as $mappedCover) {
            $cover = Cover::findOrFail($mappedCover['cover_id']);

            $coverTempPath = storage_path('app/private/temp/covers/' . $cover->filename);

            $isNewCover = false;

            $key = $this->getCoverFolder($cover->type).trim(strval($cover->filename));

            if (!$cloudMap->has($key)) {

                //check local storage
                if (file_exists($coverTempPath)) {
                    $isNewCover = true;
                    $localCovers[] = $coverTempPath;
                    continue;
                }

                if(!$isNewCover) throw new \Exception("Cover file missing: {$key}");
            }

            try { //files from cloud

                $file = $cloudMap[$key];
                $content = $b2->readfile($file['id']);
                file_put_contents($coverTempPath, $content);

                $localCovers[] = $coverTempPath;

            } catch (\Throwable $e) {
                throw new \Exception("Cloud fetch failed: " . $e->getMessage());
            }
        }

        return [
            'matched' => count($localCovers) === $document->fragment_count,
            'localCovers' => $localCovers
        ];
    }

    private function embedFragments(string $mapId, array $cloudFiles, array $localCovers)
    {
        $user = Auth::user();
        $map = FragmentMap::findOrFail($mapId);
        $document = Document::findOrFail($map->document_id);
        $mapping = $map->fragments_in_covers;


        $b2 = new B2Service();
        $stegoMap = [];
        try {

            foreach ($mapping as $map) {
                $stegoMap[] = $this->embed($map['fragment_id'], $map['cover_id'], $cloudFiles, $localCovers);
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
            $stegoFiles = collect($stegoMap)
                ->pluck('stegoFile');

            $stegoFileInfos = [];
            foreach ($stegoFiles as $filePath) {
                $stegoFileInfos[] = $b2->storeFile($filePath);
                unlink($filePath);
            }

            // Save stego file to DB
            foreach ($stegoFileInfos as $stegoFile) {
                foreach ($stegoMap as $stego) {
                    $filename = basename($stego['stegoFile']);
                    if ($stegoFile['fileName'] === 'locked/' . $filename) {
                        $sFile = StegoFile::create([
                            'stego_map_id' => $newStegoMap->stego_map_id,
                            'cloud_file_id' => $stegoFile['fileId'],
                            'fragment_id' => $stego['fragmentId'],
                            'offset' => $stego['offset'],
                            'filename' => $filename,
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
            return ['success' => 'Embedded and stored',];

        } catch (\Throwable $e) {
            // Update document with failure info
            $document->update([
                'status' => 'failed',
                'error_message' => ['Embedding failed (basecode error): ', $e->getMessage()]
            ]);

            //return back()->withErrors('errors', [$e->getMessage(), $document->error_message]);
            return ['errors' => $document->error_message,];
        }
    }

        private function embed(string $fragmentId, string $coverId, array $cloudFiles, array $localCovers)
        {
            $cover = Cover::findOrFail($coverId);

            //creating temp folders for processing files
            if (!file_exists(storage_path('app/private/temp/bin'))) {
                mkdir(storage_path('app/private/temp/bin'), 0755, true);
            }

            if (!file_exists(storage_path('app/private/temp/cloud/'))) {
                mkdir(storage_path('app/private/temp/cloud/'), 0755, true);
            }

            //generating filename for the stego file
            $fileName = bin2hex(random_bytes(16)) . time() . $this->getExtension($cover->type);
            $lockedSet = collect($cloudFiles)->pluck('fileName');

            do { //loop if fileName exists in lockedSet
                $fileName = bin2hex(random_bytes(16)) . time() . $this->getExtension($cover->type);
                $fullName = 'locked/' . $fileName;
            } while ($lockedSet->has($fullName));

            //saving local path of the cover file
            $coverFile = '';
            $localCovers = collect($localCovers)->flatten(1);
            foreach ($localCovers as $localCover) {
                if (basename($localCover) === $cover->filename) {
                    $coverFile = $localCover;
                }
            }

            if (!$coverFile) {
                throw new \Exception("Cover file not found during fetching: " . $cover->filename);
            }

            $stegoFile = storage_path('app/private/temp/cloud/'. $fileName);
            $binaryFile = storage_path('app/private/temp/bin/'. $fileName . '.bin');

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

            // Optional: log success

            // Safe to delete temp files
            if (isset($cover->metadata['info'])) {
                $cover->forceDelete(); //Permanently delete cover file in DB if its newly generated
            }
            unlink($coverFile);
            unlink($binaryFile);

            return ['fragmentId' => $fragmentId, 'stegoFile' => $stegoFile, 'offset' => $offset];
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

        private function getCoverFolder(string $coverType): string
        {
            return match ($coverType) {
                'text' => 'cover_texts/',
                'audio' => 'cover_audios/',
                'image' => 'cover_images/',
                default => throw new \InvalidArgumentException("Unsupported cover type: $coverType"),
            };
        }


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

            // 3. Re-derive document key
            $dk_salt = base64_decode($document->dk_salt);

            $documentKey = hash_hkdf(
                'sha256',
                $masterKey,
                32,
                'document-enc-key',
                $dk_salt
            );

            // 4. Decrypt
            $plaintext = openssl_decrypt(
                $ciphertext,
                'aes-256-gcm',
                $documentKey,
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
            'status' => $document->status
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

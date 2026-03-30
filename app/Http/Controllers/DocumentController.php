<?php

namespace App\Http\Controllers;

use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\Document;
use App\Models\StegoFile;
use App\Models\StegoMap;
use App\Models\Cover;
use App\Jobs\EncryptDocumentJob;
use App\Jobs\ExtractFragmentJob;
use App\Jobs\MapFragmentsToCoversJob;
use PhpParser\Node\Stmt\TryCatch;

class DocumentController extends Controller
{
    public function upload(Request $request)
    {
        // 1: Validate
        $request->validate([
            'file' => 'required|file|mimes:pdf,doc,docx,txt|min:1|max:5120'
        ]);

        $file = $request->file('file');

        // 2:
        try { // 2.1: catches file duplication errors per user

            // 2.2: Generate hash (REAL duplicate check)
            $fileHash = hash_hmac('sha256', file_get_contents($file->getRealPath()), config('app.key'));

            // 2.3: Store uploaded file temporarily
            $path = $file->store('uploads/temp');

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
                EncryptDocumentJob::dispatchSync($document->document_id, $path);
            }
        } catch (QueryException $e) {

            return back()->withErrors([
                'file' => ['You already uploaded this document', $e->getMessage()]
            ]);
        }
    }

    /**
     * Starts the retrieval process of the document
     */
    public function unlock(Request $request)
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

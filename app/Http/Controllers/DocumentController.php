<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\Document;
use App\Models\Cover;
use App\Jobs\EncryptDocumentJob;
use App\Jobs\ExtractFragmentJob;

class DocumentController extends Controller
{
    public function upload(Request $request)
    {
        dd($request->all());
        // // 1: Validate
        // $request->validate([
        //     'file' => 'required|file|mimes:pdf,doc,docx,txt|min:1|max:5120'
        // ]);

        // $file = $request->file('file');

        // // 2: Generate hash (REAL duplicate check)
        // $fileHash = hash_file('sha256', $file->getRealPath());

        // // 3: Check duplicate
        // if (Document::where('file_hash', $fileHash)->exists()) {
        //     return back()->withErrors(['file' => 'Document already exists']);
        // }

        // // 4: Store uploaded file temporarily
        // $path = $file->store('uploads/temp');

        // // 5: Save document record in DB
        // $document = Document::create([
        //     'user_id' => Auth::id(),
        //     'filename' => $file->getClientOriginalName(),
        //     'file_type' => $file->getClientOriginalExtension(),
        //     'file_hash' => $fileHash,
        //     'original_size' => $file->getSize(),
        //     'status' => 'uploaded'
        // ]);

        // try {
        //     // 6. Dispatch encryption job immediately (synchronous)
        //     EncryptDocumentJob::dispatchSync($document->document_id, $path);

        //     // return response()->json([
        //     //     'message' => 'File uploaded and encrypted successfully.',
        //     //     'document_id' => $document->document_id
        //     // ]);

        // } catch (\Throwable $e) {
        //     // 7. Handle encryption failure
        //     $document->update([
        //         'status' => 'failed',
        //         'error_message' => $e->getMessage()
        //     ]);

        //     return response()->json([
        //         'message' => 'File uploaded but encryption failed.',
        //         'error' => $e->getMessage()
        //     ], 500);
        // }

        // return response()->json([
        //     'message' => 'File uploaded successfully',
        //     'document_id' => $document->document_id
        // ]);
    }

    /**
     * Starts the retrieval process of the document
     */
    public function unlock(Request $request)
    {
        //Fetch stego files from storage
        //ExtractFragmentJob::dispatchSync();
    }


}

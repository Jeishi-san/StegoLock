<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StarredController extends Controller
{
    /**
     * Display a listing of the starred documents.
     */
    public function index()
    {
        $user = Auth::user();

        // Get starred documents
        $starredDocuments = Document::where('user_id', $user->id)
            ->where('is_starred', true)
            ->orderBy('updated_at', 'desc')
            ->get();

        return Inertia::render('StarredDocuments', [
            'documents' => $starredDocuments,
            'totalStorage' => $user->storage_used,
            'storageLimit' => $user->storage_limit,
        ]);
    }

    /**
     * Toggle the star status of a document.
     */
    public function toggleStar(Request $request)
    {
        $validated = $request->validate([
            'document_id' => ['required', 'integer', 'exists:documents,document_id'],
        ]);

        $document = Document::findOrFail($validated['document_id']);
        
        // Ensure user owns the document
        if ($document->user_id !== Auth::id()) {
            abort(403);
        }

        $document->update([
            'is_starred' => !$document->is_starred,
        ]);

        return response()->json([
            'message' => $document->is_starred ? 'Document starred' : 'Document unstarred',
            'is_starred' => $document->is_starred,
        ]);
    }
}

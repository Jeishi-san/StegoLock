<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

use Inertia\Inertia;

use App\Models\Folder;
use App\Models\Document;

class FolderController extends Controller
{
    public function index(Request $request)
    {
        $parentId = $request->parent_id ?? null;

        $folders = Folder::where('user_id', Auth::id())
            ->where('parent_id', $parentId)
            ->get();

        $user = Auth::user();

        return Inertia::render('MyFolders', [
            'folders' => $folders,
            'totalStorage' => $user->storage_used,
            'storageLimit' => $user->storage_limit,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:folders,id',
        ]);

        // safety check: ensure parent belongs to same user
        if ($request->parent_id) {
            $parent = Folder::where('id', $request->parent_id)
                ->where('user_id', Auth::id())
                ->firstOrFail();
        }

        $folder = Folder::create([
            'id' => (string) Str::uuid(),
            'user_id' => Auth::id(),
            'name' => $request->name,
            'parent_id' => $request->parent_id,
        ]);

        return response()->json($folder);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $folder = Folder::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $folder->update([
            'name' => $request->name,
        ]);

        return response()->json($folder);
    }

    public function destroy($id)
    {
        $folder = Folder::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $hasChildren = Folder::where('parent_id', $id)->exists();

        if ($hasChildren) {
            return response()->json([
                'message' => 'Folder is not empty'
            ], 400);
        }

        $folder->delete();

        return response()->json([
            'message' => 'Deleted successfully'
        ]);
    }




    public function moveDocument(Request $request, $id)
    {
        $request->validate([
            'folder_id' => 'nullable|exists:folders,id'
        ]);

        $document = Document::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        if ($request->folder_id) {
            Folder::where('id', $request->folder_id)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            $document->folder_id = $request->folder_id;
        } else {
            $document->folder_id = null;
        }

        $document->save();

        return response()->json([
            'message' => 'Document moved successfully',
            'document' => $document
        ]);
    }
}

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
            'name' => [
                'required',
                'string',
                'max:255',
                function ($attribute, $value, $fail) use ($request) {
                    $exists = Folder::where('user_id', Auth::id())
                        ->where('parent_id', $request->parent_id)
                        ->where('name', $value)
                        ->exists();
                    if ($exists) {
                        $fail('A folder with this name already exists in this location.');
                    }
                },
            ],
            'parent_id' => 'nullable|exists:folders,folder_id',
        ]);

        // safety check: ensure parent belongs to same user
        if ($request->parent_id) {
            Folder::where('folder_id', $request->parent_id)
                ->where('user_id', Auth::id())
                ->firstOrFail();
        }

        $folder = Folder::create([
            'user_id' => Auth::id(),
            'name' => $request->name,
            'parent_id' => $request->parent_id,
        ]);

        return response()->json($folder);
    }

    public function update(Request $request, $id)
    {
        $folder = Folder::where('folder_id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                function ($attribute, $value, $fail) use ($request, $folder) {
                    $exists = Folder::where('user_id', Auth::id())
                        ->where('parent_id', $folder->parent_id)
                        ->where('name', $value)
                        ->where('folder_id', '!=', $folder->folder_id)
                        ->exists();
                    if ($exists) {
                        $fail('A folder with this name already exists in this location.');
                    }
                },
            ],
        ]);

        $folder->update([
            'name' => $request->name,
        ]);

        return response()->json($folder);
    }

    public function destroy($id)
    {
        $folder = Folder::where('folder_id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        // Move subfolders to root
        Folder::where('parent_id', $id)->update(['parent_id' => null]);

        // Move documents to root
        Document::where('folder_id', $id)->update(['folder_id' => null]);

        $folder->delete();

        return response()->json([
            'message' => 'Folder deleted successfully'
        ]);
    }
}

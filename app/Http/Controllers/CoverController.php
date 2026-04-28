<?php

namespace App\Http\Controllers;

use App\Jobs\ScanCoversJob;
use App\Providers\B2Service;
use App\Models\Cover;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CoverController extends Controller
{
    public function index()
    {
        $covers = Cover::orderBy('created_at', 'desc')->get();
        
        // Count candidates in inbox
        $candidateCount = 0;
        $inboxFolders = ['cover_audios', 'cover_images', 'cover_texts'];
        foreach ($inboxFolders as $folder) {
            $path = storage_path("app/public/{$folder}");
            if (file_exists($path)) {
                $candidateCount += count(glob($path . "/*.*"));
            }
        }

        // Quick check for orphans (cached or session based)
        $auditData = session('cover_audit_results');

        return Inertia::render('Admin/Covers', [
            'covers' => $covers,
            'candidateCount' => $candidateCount,
            'auditResults' => $auditData
        ]);
    }

    /**
     * Deep audit comparing DB records with actual B2 cloud storage files.
     */
    public function auditIntegrity(Request $request)
    {
        $b2Service = new B2Service();
        $cloudFiles = $b2Service->listAllFiles(); // Returns array of file info
        
        $cloudFileNames = array_map(function($file) {
            return $file['fileName'];
        }, $cloudFiles);

        $dbCovers = Cover::all();
        $dbPaths = $dbCovers->pluck('path')->toArray();
        
        $orphans = [];
        $untracked = [];
        $syncedCount = 0;
        $totalCloudSize = 0;

        // 1. Find DB records missing in Cloud
        foreach ($dbCovers as $cover) {
            if (in_array($cover->path, $cloudFileNames)) {
                $syncedCount++;
            } else {
                $orphans[] = [
                    'id' => $cover->cover_id,
                    'filename' => $cover->filename,
                    'path' => $cover->path
                ];
            }
        }

        // 2. Find Cloud files missing in DB (Untracked)
        foreach ($cloudFiles as $file) {
            $name = $file['fileName'];
            if (!str_starts_with($name, 'cover_')) continue;
            
            $totalCloudSize += $file['contentLength'];

            if (!in_array($name, $dbPaths)) {
                $untracked[] = [
                    'filename' => basename($name),
                    'path' => $name,
                    'size' => $file['contentLength']
                ];
            }
        }

        $results = [
            'last_audit' => now()->toDateTimeString(),
            'db_count' => $dbCovers->count(),
            'cloud_count' => count(array_filter($cloudFileNames, fn($f) => str_starts_with($f, 'covers/'))),
            'actual_cloud_size' => $totalCloudSize,
            'orphans' => $orphans,
            'untracked' => $untracked,
            'synced_count' => $syncedCount,
            'is_healthy' => count($orphans) === 0 && count($untracked) === 0
        ];

        return back()->with('cover_audit_results', $results)
                     ->with('success', 'Audit completed. ' . count($orphans) . ' discrepancies found.');
    }

    /**
     * Removes database records that have no corresponding file in B2.
     */
    public function cleanupOrphans(Request $request)
    {
        $orphanIds = $request->input('ids', []);
        
        if (empty($orphanIds)) {
            return back()->with('error', 'No orphans selected for cleanup.');
        }

        $deletedCount = Cover::whereIn('cover_id', $orphanIds)->delete();

        // Clear audit results from session after cleanup
        session()->forget('cover_audit_results');

        return back()->with('success', "Successfully cleaned up {$deletedCount} orphaned record(s). Library is now in sync.");
    }

    /**
     * Handles the upload of candidate cover files to local storage.
     */
    public function uploadCandidate(Request $request)
    {
        $request->validate([
            'files.*' => 'required|file|max:51200', // Max 50MB per file
            'type' => 'required|in:audio,image,text'
        ]);

        $typeMap = [
            'audio' => 'cover_audios',
            'image' => 'cover_images',
            'text' => 'cover_texts'
        ];

        $folder = $typeMap[$request->type];
        $uploadCount = 0;

        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $filename = Str::random(10) . '_' . $file->getClientOriginalName();
                $file->storeAs("public/{$folder}", $filename);
                $uploadCount++;
            }
        }

        return back()->with('success', "Successfully uploaded {$uploadCount} candidate(s) for scanning.");
    }

    /**
     * Dispatches a background job to scan candidate cover files in public folders.
     */
    public function scan_cover(Request $request)
    {
        try {
            ScanCoversJob::dispatch();
            return back()->with('success', 'Background scan started. Valid covers will be uploaded to the cloud.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to start background scan: ' . $e->getMessage());
        }
    }

    /**
     * Generates a text cover file from wiki feeds for on-demand use.
     */
    public function generate_cover_text_file()
    {
        $fragmentSize = 407725; 
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

            $block = "pageid: {$feed->pageid}\ntitle: {$feed->title}\ncontent: {$feed->feed}\n\n";
            $content .= $block;
            $capacity = floor(strlen($content) * 0.02);
            
            if ($capacity > $targetSize) break;
        }

        $randomHex = bin2hex(random_bytes(16));
        $fileName = "{$randomHex}_cover_" . time() . ".txt";

        if (!file_exists(storage_path('app/public/cover_texts'))) {
            mkdir(storage_path('app/public/cover_texts'), 0755, true);
        }

        Storage::disk('public')->put("cover_texts/{$fileName}", $content);
        
        return back()->with('success', 'Wiki cover generated. Run scan to sync to cloud.');
    }
}

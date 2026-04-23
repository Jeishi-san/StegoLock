<?php

namespace App\Http\Controllers;

use App\Jobs\ScanCoversJob;
use App\Models\Cover;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CoverController extends Controller
{
    /**
     * Dispatches a background job to scan candidate cover files in public folders.
     */
    public function scan_cover(Request $request)
    {
        try {
            ScanCoversJob::dispatch();
            return back()->with('success', 'Background scan started. Please check logs for progress.');
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to start background scan: ' . $e->getMessage());
        }
    }

    /**
     * Generates a text cover file from wiki feeds for on-demand use.
     */
    public function generate_cover_text_file()
    {
        $fragmentSize = 407725; // Default fragment size target
        $maxId = DB::table('wiki_feeds')->max('id');

        if (!$maxId) {
            return response()->json(['error' => 'No data in wiki_feeds'], 500);
        }

        $targetSize = $fragmentSize / 0.02; // 2% capacity rule
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

        // Ensure temp folder exists
        if (!file_exists(storage_path('app/private/temp/covers'))) {
            mkdir(storage_path('app/private/temp/covers'), 0755, true);
        }

        // Save file locally (private disk)
        Storage::disk('local')->put("temp/covers/{$fileName}", $content);
        $filePath = storage_path('app/private/temp/covers/' . $fileName);

        // Record in covers table
        $cover = Cover::create([
            'cover_id' => (string) Str::uuid(),
            'type' => 'text',
            'filename' => $fileName,
            'path' => 'cover_texts/' . $fileName,
            'size_bytes' => strlen($content),
            'metadata' => [
                'valid' => true,
                'capacity' => $capacity,
                'info' => 'System-generated'
            ],
            'hash' => hash('sha256', $content),
        ]);

        return $cover;
    }
}

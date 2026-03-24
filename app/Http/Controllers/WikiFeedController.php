<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use App\Models\WikiFeed;

class WikiFeedController extends Controller
{
    /**
     * Fetch a random Wikipedia page and store it in the DB.
     */
    public function fetchRandomWiki($p = 1)
    {
        // Validate p (force range 1–20)
        $p = (int) $p;
        if ($p < 1) $p = 1;
        if ($p > 20) $p = 20;

        $results = [];
        $attempts = 0;

        while (count($results) < $p && $attempts < $p * 3) {
            $attempts++;

            /** @var \Illuminate\Http\Client\Response $response */
            $response = Http::withHeaders([
                'User-Agent' => 'MyWikiApp/1.0 (myemail@example.com)'
            ])->get('https://en.wikipedia.org/w/api.php', [
                'action' => 'query',
                'generator' => 'random',
                'grnnamespace' => 0,
                'grnlimit' => 1,
                'prop' => 'extracts',
                'explaintext' => 1,
                'format' => 'json'
            ]);

            $data = $response->json();

            if (!isset($data['query']['pages'])) {
                continue;
            }

            $page = reset($data['query']['pages']);

            // Skip empty extracts
            if (empty($page['extract'])) {
                continue;
            }

            // Reject feeds longer than 60,000 characters
            if (strlen($page['extract']) > 60000) {
                continue;
            }

            $feed = WikiFeed::updateOrCreate(
                ['pageid' => $page['pageid']],
                [
                    'title' => $page['title'],
                    'feed' => $page['extract'] ?? ''
                ]
            );

            $results[] = $feed;
        }

        return response()->json([
            'requested' => $p,
            'stored' => count($results),
            'data' => $results
        ]);
    }

    public function exportToTxt(Request $request)
    {
        $numFiles = (int) $request->input('count', 1); // number of text files to generate
        $numFiles = max(1, min(30, $numFiles)); // cap between 1 and 20

        $minSize = 1 * 1024 * 1024; // 1MB
        $maxSize = 3 * 1024 * 1024; // 3MB

        $maxId = DB::table('wiki_feeds')->max('id');

        if (!$maxId) {
            return response()->json(['error' => 'No data in wiki_feeds'], 500);
        }

        $generatedFiles = [];

        for ($i = 0; $i < $numFiles; $i++) {

            // Random target size between min and max
            $targetSize = rand($minSize, $maxSize);

            $content = '';
            $attempts = 0;

            while (strlen($content) < $targetSize && $attempts < $targetSize / 100) {
                $attempts++;

                $randomId = rand(1, $maxId);
                $feed = DB::table('wiki_feeds')->where('id', $randomId)->first();

                if (!$feed) {
                    continue;
                }

                $block = "pageid: {$feed->pageid}\n";
                $block .= "title: {$feed->title}\n";
                $block .= "content: {$feed->feed}\n\n";

                $content .= $block;

                // Safety: break if content is way too large
                if (strlen($content) > $maxSize * 2) {
                    break;
                }
            }

            // Trim to exact target size
            $content = substr($content, 0, $targetSize);

            // File name
            $randomHex = bin2hex(random_bytes(16));
            $fileName = "{$randomHex}_cover_" . time() . ".txt";

            // Ensure folder exists
            if (!Storage::disk('public')->exists('cover_texts')) {
                Storage::disk('public')->makeDirectory('cover_texts');
            }

            // Save file
            Storage::disk('public')->put("cover_texts/{$fileName}", $content);

            $generatedFiles[] = [
                'file_name' => $fileName,
                'size_bytes' => strlen($content),
                'path' => "storage/cover_texts/{$fileName}"
            ];
        }

        return response()->json([
            'message' => 'Text covers generated successfully',
            'count' => $numFiles,
            'files' => $generatedFiles
        ]);
    }
}

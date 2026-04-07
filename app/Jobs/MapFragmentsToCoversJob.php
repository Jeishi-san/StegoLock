<?php

namespace App\Jobs;

use App\Models\Document;
use App\Models\Cover;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Models\FragmentMap;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Str;

class MapFragmentsToCoversJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    protected $documentId;

    public function __construct(string $documentId)
    {
        $this->documentId = $documentId;
    }

    public function handle()
    {
        $this->mapFragmentsToCovers();
    }

    public function mapFragmentsToCovers()
    {
        //print or display "mapping ongoing..."

        try {
            // PHASE 1: Allocation of fragments to cover types

                //print or display "allocating covers"

                $document = Document::with('fragments')->find($this->documentId);

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
                    throw new \Exception('No available audio covers');
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

        } catch (\Throwable $e) {
            // Update document with failure info
            $document->update([
                'status' => 'failed',
                'error_message' => ['Mapping failed', $e->getMessage()]
            ]);
        }

        //Dispatch fragment embedding into cover files
        EmbedFragmentsJob::dispatchSync($map->map_id);
    }

    public function generate_text_cover(int $fragmentSize)
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
        if (!file_exists(storage_path('app/public/cover_texts'))) {
            mkdir(storage_path('app/public/cover_texts'), 0755, true);
        }

        // Save file
        Storage::disk('public')->put("cover_texts/{$fileName}", $content);

        $filePath = storage_path('app/public/cover_texts/' . $fileName);

        $cover = Cover::create([
            'cover_id' => (string) Str::uuid(),      // generate UUID for PK
            'type' => 'text',
            'filename' => basename($filePath),
            'path' => 'cover_text/' . basename($filePath), // storage path
            'size_bytes' => strlen($content),
            'metadata' => [
                            'valid' => true,
                            'capacity' => floor(strlen($content) * 0.02)
            ],
            'hash' => hash('sha256', file_get_contents($filePath)),
        ]);

        return $cover;
    }

    public function retryUntil(): ?\DateTimeInterface
    {
        return now()->addMinutes(1);
    }

    public function failed(\Throwable $exception): void
    {
        // Handle the failure
    }

    public function test_or_alternative_codes()
    {
        // PHASE 1: Allocation of fragments to cover types
        $document = Document::with('fragments')->find($this->documentId);

        if (!$document) {
            throw new \Exception('Document not found');
        }

        if ($document->status !== 'fragmented') {
            throw new \Exception('Document not ready for mapping');
        }

        $fragments = $document->fragments;
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

            /* ALT
                // base safe distribution
                $textCount  = min(1, $total);
                $audioCount = $total > 1 ? 1 : 0;

                $imageCount = max(0, $total - ($textCount + $audioCount));

                // fix leftover allocation (important)
                $remaining = $total - ($textCount + $audioCount + $imageCount);

                if ($remaining > 0) {
                    $imageCount += $remaining;
                }
            */
        } else {
            // percentage-based allocation for larger fragment sets
            $textCount  = max(1, ceil($total * 0.1));
            $audioCount = max(1, ceil($total * 0.2));
            $imageCount = $total - $textCount - $audioCount;

            /* ALT
                // percentage targets
                $textTarget  = $total * 0.10;
                $audioTarget = $total * 0.20;

                $textCount  = max(1, (int) floor($textTarget));
                $audioCount = max(1, (int) floor($audioTarget));

                $imageCount = $total - ($textCount + $audioCount);

                // normalization fix (critical)
                if ($imageCount < 1) {
                    // steal from audio first, then text if needed
                    $deficit = 1 - $imageCount;
                    $imageCount = 1;

                    $audioReduce = min($deficit, max(0, $audioCount - 1));
                    $audioCount -= $audioReduce;
                    $deficit -= $audioReduce;

                    if ($deficit > 0) {
                        $textCount -= min($deficit, max(0, $textCount - 1));
                    }
                }

            */
        }
    }
}

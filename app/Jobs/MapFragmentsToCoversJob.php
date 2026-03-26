<?php

namespace App\Jobs;

use App\Models\Document;
use App\Models\Cover;
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
        } else {
            // percentage-based allocation for larger fragment sets
            $textCount  = max(1, ceil($total * 0.1));
            $audioCount = max(1, ceil($total * 0.2));
            $imageCount = $total - $textCount - $audioCount;
        }

        dd($textCount, $audioCount, $imageCount);

/*
PHASE 1: Precompute Cover Pools
$textCovers  = Cover::where('type', 'text')
    ->get()
    ->sortBy(fn ($c) => $c->metadata['capacity']);

$audioCovers = Cover::where('type', 'audio')
    ->get()
    ->sortBy(fn ($c) => $c->metadata['capacity']);

$imageCovers = Cover::where('type', 'image')
    ->get()
    ->sortBy(fn ($c) => $c->metadata['capacity']);

PHASE 2: Precompute Fragment Groups
$fragments = $fragments->sortBy('size_bytes');
$textFragments  = $fragments->take($textCount);
$audioFragments = $fragments->slice($textCount, $audioCount);
$imageFragments = $fragments->slice($textCount + $audioCount);

Build a reusable selection function
function pickCover($fragmentSize, $pool)
{
    // filter valid covers
    $candidates = $pool->filter(function ($cover) use ($fragmentSize) {
        return ($cover->metadata['capacity'] ?? 0) > $fragmentSize;
    });
    if ($candidates->isEmpty()) {
        return null;
    }
    // optional improvement: weighted random instead of full random
    return $candidates->random();
}

PHASE 3: MATCHING STRATEGY
Use a "first-fit randomized bounded search"
For each fragment:
foreach ($fragments as $frag) {

    $cover = pickCover($frag->size_bytes, $textPool);

    if (!$cover) {
        // fallback generation
        $cover = $this->generateTextCover($frag);
        $textPool->push($cover); // add to pool for reuse
    }

    $mappingArray[] = [
        'fragment_id' => $frag->fragment_id,
        'cover_id'    => $cover->cover_id,
        'offset'      => 0,
    ];
}
*/

/* TO BE CHECKED
        // fetch valid covers per type
        $textCovers = Cover::where('type', 'text')->get();
        $audioCovers = Cover::where('type', 'audio')->get();
        $imageCovers = Cover::where('type', 'image')->get();

        //$fragment->size <= cover_capacity

        // simple validation: size enough? metadata present? skip for now or add checks
        $mappingArray = [];

        // Assign text fragments
        $textFragments = $fragments->take($textCount);
        foreach ($textFragments as $frag) {
            $cover = $textCovers->random();
            $mappingArray[] = [
                'fragment_id' => $frag->fragment_id,
                'cover_id' => $cover->cover_id,
                'offset' => 0,
            ];
        }

        // Assign audio fragments
        $audioFragments = $fragments->slice($textCount, $audioCount);
        foreach ($audioFragments as $frag) {
            $cover = $audioCovers->random();
            $mappingArray[] = [
                'fragment_id' => $frag->fragment_id,
                'cover_id' => $cover->cover_id,
                'offset' => 0,
            ];
        }

        // Assign image fragments
        $imageFragments = $fragments->slice($textCount + $audioCount, $imageCount);
        foreach ($imageFragments as $frag) {
            $cover = $imageCovers->random();
            $mappingArray[] = [
                'fragment_id' => $frag->fragment_id,
                'cover_id' => $cover->cover_id,
                'offset' => 0,
            ];
        }

        // Save mapping
        // FragmentMap::create([
        //     'map_id' => Str::uuid(),
        //     'document_id' => $this->document->document_id,
        //     'fragments_in_covers' => $mappingArray,
        //     'status' => 'pending',
        // ]);

        //this->document.status => mapped

        //dispatch embedding
*/
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

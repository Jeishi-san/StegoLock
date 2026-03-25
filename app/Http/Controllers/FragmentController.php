<?php

namespace App\Http\Controllers;

use App\Models\Fragment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FragmentController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     *
     */
    public function createFragments(Request $request)
    {
        $request->validate([
            'document_id' => 'required|uuid',
            'file' => 'required|file',
            'fragment_size' => 'required|integer|min:65536|max:262144', // in bytes
        ]);

        $filePath = $request->file('file')->getRealPath();
        $ciphertext = file_get_contents($filePath);

        $fragmentSize = $request->input('fragment_size');
        $fragments = str_split($ciphertext, $fragmentSize);

        foreach ($fragments as $index => $frag) {
            Fragment::create([
                'fragment_id' => (string) Str::uuid(),
                'document_id' => $request->input('document_id'),
                'index' => $index,
                'blob' => $frag,
                'size' => strlen($frag),
                'hash' => hash('sha256', $frag),
                'status' => 'floating',
            ]);
        }

        return response()->json(['message' => 'Fragments created', 'count' => count($fragments)]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(Fragment $fragment)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Fragment $fragment)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Fragment $fragment)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Fragment $fragment)
    {
        //
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use App\Models\Cover;
use Illuminate\Support\Str;

class CoverTextSeeder extends Seeder
{
    public function run(): void
    {
        // Path relative to storage/app
        $files = Storage::disk('public')->files('cover_texts');

        foreach ($files as $filePath) {
            $fullPath = storage_path('app/public/' . $filePath);
            $size = filesize($fullPath);
            $contents = file_get_contents($fullPath);

            $metadata = [
                'lines' => substr_count($contents, "\n") + 1,
                'encoding' => mb_detect_encoding($contents),
                'characters' => mb_strlen($contents)
            ];

            Cover::create([
                'cover_id' => (string) Str::uuid(),      // generate UUID for PK
                'type' => 'text',
                'filename' => basename($filePath),
                'path' => 'cover_texts/' . basename($filePath), // storage path
                'size_bytes' => $size,
                'metadata' => $metadata,
                'hash' => hash('sha256', $contents),
            ]);
        }

        $this->command->info(count($files) . " text covers added.");
    }
}

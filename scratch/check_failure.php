<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Document;

$docs = Document::latest()->take(5)->get();

foreach ($docs as $doc) {
    echo "ID: {$doc->document_id} | Status: {$doc->status} | File: {$doc->filename} | Error: {$doc->error_message}\n";
}

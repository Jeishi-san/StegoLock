<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Document;
use App\Jobs\EncryptDocumentJob;
use Illuminate\Support\Facades\Auth;

class TestEncryptDocument extends Command
{
    protected $signature = 'test:encrypt {document_id}';
    protected $description = 'Test EncryptDocumentJob for a given document';

    public function handle()
    {
        $documentId = $this->argument('document_id');

        $document = Document::find($documentId);
        if (!$document) {
            $this->error("Document ID {$documentId} not found.");
            return 1;
        }

        // For testing, you need the user's master key
        // WARNING: in production, masterKey comes from session, not here
        $userMasterKey = 'test-master-key-32bytes!'; // must be 32 bytes for AES-256

        // Dispatch the job immediately (sync) for testing
        EncryptDocumentJob::dispatchSync($document->document_id, 'uploads/temp/' . basename($document->filename), $userMasterKey);

        $document->refresh();

        $this->info("Encryption job completed.");
        $this->info("Status: " . $document->status);
        $this->info("Encrypted Size: " . $document->encrypted_size);
        $this->info("DK Salt (base64): " . $document->dk_salt);

        return 0;
    }
}

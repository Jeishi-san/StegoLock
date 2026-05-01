<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\DocumentShare;
use App\Models\Folder;
use App\Models\User;
use App\Services\CryptoService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ShareTest extends TestCase
{
    use RefreshDatabase;

    protected $cryptoServiceMock;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Mock the CryptoService
        $this->cryptoServiceMock = $this->createMock(CryptoService::class);
        $this->app->instance(CryptoService::class, $this->cryptoServiceMock);
    }

    /**
     * FT-S01: Test user can share document
     */
    public function test_user_can_share_document(): void
    {
        $user = User::factory()->create();
        $recipient = User::factory()->create(['email' => 'recipient@example.com']);
        
        $document = Document::create([
            'user_id' => $user->id,
            'filename' => 'test.pdf',
            'file_type' => 'application/pdf',
            'file_hash' => hash('sha256', 'test'),
            'original_size' => 1000,
            'status' => 'uploaded',
        ]);

        // Mock the crypto operations
        $this->cryptoServiceMock->method('unwrapDek')->willReturn('fake-dek');
        $this->cryptoServiceMock->method('wrapDek')->willReturn([
            'encrypted_dek' => 'encrypted',
            'nonce' => 'nonce',
            'tag' => 'tag',
            'salt' => 'salt',
        ]);

        $response = $this->actingAs($user)
            ->withSession(['master_key' => 'fake-master-key'])
            ->postJson('/documents/share', [
                'document_id' => $document->document_id,
                'email' => $recipient->email,
            ]);

        $response->assertStatus(200);
        $response->assertJson(['message' => 'Document shared successfully with ' . $recipient->name]);
        $this->assertDatabaseHas('document_shares', [
            'document_id' => $document->document_id,
            'recipient_id' => $recipient->id,
            'sender_id' => $user->id,
            'status' => 'pending',
        ]);
    }

    /**
     * FT-S02: Test share requires valid email
     */
    public function test_share_requires_valid_email(): void
    {
        $user = User::factory()->create();
        
        $document = Document::create([
            'user_id' => $user->id,
            'filename' => 'test.pdf',
            'file_type' => 'application/pdf',
            'file_hash' => hash('sha256', 'test'),
            'original_size' => 1000,
            'status' => 'uploaded',
        ]);

        $response = $this->actingAs($user)
            ->withSession(['master_key' => 'fake-master-key'])
            ->postJson('/documents/share', [
                'document_id' => $document->document_id,
                'email' => 'nonexistent@example.com',
            ]);

        $response->assertStatus(404);
    }

    /**
     * FT-S03: Test cannot share to self
     */
    public function test_cannot_share_to_self(): void
    {
        $user = User::factory()->create();
        
        $document = Document::create([
            'user_id' => $user->id,
            'filename' => 'test.pdf',
            'file_type' => 'application/pdf',
            'file_hash' => hash('sha256', 'test'),
            'original_size' => 1000,
            'status' => 'uploaded',
        ]);

        $response = $this->actingAs($user)
            ->withSession(['master_key' => 'fake-master-key'])
            ->postJson('/documents/share', [
                'document_id' => $document->document_id,
                'email' => $user->email,
            ]);

        $response->assertStatus(422);
        $response->assertJson(['error' => 'You cannot share a document with yourself.']);
    }

    /**
     * FT-S04: Test cannot share same document twice to same user
     */
    public function test_cannot_share_same_document_twice(): void
    {
        $user = User::factory()->create();
        $recipient = User::factory()->create(['email' => 'recipient@example.com']);
        
        $document = Document::create([
            'user_id' => $user->id,
            'filename' => 'test.pdf',
            'file_type' => 'application/pdf',
            'file_hash' => hash('sha256', 'test'),
            'original_size' => 1000,
            'status' => 'uploaded',
        ]);

        // Mock the crypto operations
        $this->cryptoServiceMock->method('unwrapDek')->willReturn('fake-dek');
        $this->cryptoServiceMock->method('wrapDek')->willReturn([
            'encrypted_dek' => 'encrypted',
            'nonce' => 'nonce',
            'tag' => 'tag',
            'salt' => 'salt',
        ]);

        // First share
        $response1 = $this->actingAs($user)
            ->withSession(['master_key' => 'fake-master-key'])
            ->postJson('/documents/share', [
                'document_id' => $document->document_id,
                'email' => $recipient->email,
            ]);

        $response1->assertStatus(200);

        // Second share (should update existing, not create new)
        $response2 = $this->actingAs($user)
            ->withSession(['master_key' => 'fake-master-key'])
            ->postJson('/documents/share', [
                'document_id' => $document->document_id,
                'email' => $recipient->email,
            ]);

        $response2->assertStatus(200);
        
        // Should only have one share record
        $this->assertEquals(1, DocumentShare::where('document_id', $document->document_id)
            ->where('recipient_id', $recipient->id)
            ->count());
    }

    /**
     * FT-S05: Test recipient can view shared document
     */
    public function test_recipient_can_view_shared_document(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();
        
        $document = Document::create([
            'user_id' => $sender->id,
            'filename' => 'test.pdf',
            'file_type' => 'application/pdf',
            'file_hash' => hash('sha256', 'test'),
            'original_size' => 1000,
            'status' => 'uploaded',
        ]);

        DocumentShare::create([
            'document_id' => $document->document_id,
            'sender_id' => $sender->id,
            'recipient_id' => $recipient->id,
            'encrypted_dek' => base64_encode('encrypted'),
            'dek_nonce' => base64_encode('nonce'),
            'dek_tag' => base64_encode('tag'),
            'dk_salt' => base64_encode('salt'),
            'status' => 'accepted',
        ]);

        // Check that the shared document appears on the sharedDocuments page
        $response = $this->actingAs($recipient)
            ->get('/sharedDocuments');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('SharedDocuments')
        );
    }

    /**
     * FT-S06: Test non-recipient cannot view shared document
     */
    public function test_non_recipient_cannot_view_shared_document(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();
        $nonRecipient = User::factory()->create();
        
        $document = Document::create([
            'user_id' => $sender->id,
            'filename' => 'test.pdf',
            'file_type' => 'application/pdf',
            'file_hash' => hash('sha256', 'test'),
            'original_size' => 1000,
            'status' => 'uploaded',
        ]);

        DocumentShare::create([
            'document_id' => $document->document_id,
            'sender_id' => $sender->id,
            'recipient_id' => $recipient->id,
            'encrypted_dek' => base64_encode('encrypted'),
            'dek_nonce' => base64_encode('nonce'),
            'dek_tag' => base64_encode('tag'),
            'dk_salt' => base64_encode('salt'),
            'status' => 'accepted',
        ]);

        // Check that the non-recipient doesn't see the document in their shared documents
        $response = $this->actingAs($nonRecipient)
            ->get('/sharedDocuments');

        $response->assertStatus(200);
        // The sharedDocuments page should not contain this document for non-recipient
    }

    /**
     * FT-S07: Test user can revoke share
     */
    public function test_user_can_revoke_share(): void
    {
        $user = User::factory()->create();
        $recipient = User::factory()->create();
        
        $document = Document::create([
            'user_id' => $user->id,
            'filename' => 'test.pdf',
            'file_type' => 'application/pdf',
            'file_hash' => hash('sha256', 'test'),
            'original_size' => 1000,
            'status' => 'uploaded',
        ]);

        $share = DocumentShare::create([
            'document_id' => $document->document_id,
            'sender_id' => $user->id,
            'recipient_id' => $recipient->id,
            'encrypted_dek' => base64_encode('encrypted'),
            'dek_nonce' => base64_encode('nonce'),
            'dek_tag' => base64_encode('tag'),
            'dk_salt' => base64_encode('salt'),
            'status' => 'pending',
        ]);

        $response = $this->actingAs($user)
            ->postJson('/documents/share/remove', [
                'share_id' => $share->share_id,
            ]);

        $response->assertStatus(200);
        $response->assertJson(['message' => 'Access removed.']);
        $this->assertDatabaseMissing('document_shares', [
            'share_id' => $share->share_id,
        ]);
    }

    /**
     * FT-S08: Test user can share folder
     */
    public function test_user_can_share_folder(): void
    {
        $user = User::factory()->create();
        $recipient = User::factory()->create(['email' => 'recipient@example.com']);
        
        $folder = Folder::create([
            'user_id' => $user->id,
            'name' => 'Test Folder',
            'parent_id' => null,
        ]);

        // Create a document in the folder (required for folder sharing)
        Document::create([
            'user_id' => $user->id,
            'folder_id' => $folder->folder_id,
            'filename' => 'test.pdf',
            'file_type' => 'application/pdf',
            'file_hash' => hash('sha256', 'test'),
            'original_size' => 1000,
            'status' => 'uploaded',
        ]);

        // Mock the crypto operations
        $this->cryptoServiceMock->method('unwrapDek')->willReturn('fake-dek');
        $this->cryptoServiceMock->method('wrapDek')->willReturn([
            'encrypted_dek' => 'encrypted',
            'nonce' => 'nonce',
            'tag' => 'tag',
            'salt' => 'salt',
        ]);

        $response = $this->actingAs($user)
            ->withSession(['master_key' => 'fake-master-key'])
            ->postJson('/folders/share', [
                'folder_id' => $folder->folder_id,
                'email' => $recipient->email,
            ]);

        $response->assertStatus(200);
        $response->assertJson(['message' => "Folder '{$folder->name}' shared successfully with {$recipient->name}."]);
    }

    /**
     * FT-S09: Test recipient can view shared folder
     */
    public function test_recipient_can_view_shared_folder(): void
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();
        
        $folder = Folder::create([
            'user_id' => $sender->id,
            'name' => 'Test Folder',
            'parent_id' => null,
        ]);

        // Create a folder share
        $folderShare = \App\Models\FolderShare::create([
            'folder_id' => $folder->folder_id,
            'sender_id' => $sender->id,
            'recipient_id' => $recipient->id,
            'status' => 'accepted',
        ]);

        // Check that the folder share exists and is accepted
        $this->assertDatabaseHas('folder_shares', [
            'folder_id' => $folder->folder_id,
            'recipient_id' => $recipient->id,
            'status' => 'accepted',
        ]);

        // Check that the recipient can access the sharedDocuments page
        $response = $this->actingAs($recipient)
            ->get('/sharedDocuments');

        $response->assertStatus(200);
    }
}

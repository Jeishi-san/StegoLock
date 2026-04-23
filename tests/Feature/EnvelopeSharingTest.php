<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Document;
use App\Providers\EncryptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class EnvelopeSharingTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;
    protected User $viewer;
    protected EncryptionService $encryptionService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create();
        $this->viewer = User::factory()->create();
        $this->encryptionService = new EncryptionService();

        session(['master_key' => random_bytes(32)]);
    }

    /** @test */
    public function owner_can_create_envelope_encrypted_document()
    {
        $this->actingAs($this->owner);

        $document = Document::factory()->create([
            'user_id' => $this->owner->id,
            'encryption_mode' => 'envelope_wrapped',
        ]);

        $this->assertTrue($document->isEnvelopeMode());
        $this->assertEquals('envelope_wrapped', $document->encryption_mode);
    }

    /** @test */
    public function document_can_be_shared_with_another_user()
    {
        $this->actingAs($this->owner);

        $document = Document::factory()->create([
            'user_id' => $this->owner->id,
            'encryption_mode' => 'envelope_wrapped',
            'document_dek' => base64_encode(random_bytes(48)),
            'document_dek_iv' => base64_encode(random_bytes(12)),
            'document_dek_tag' => base64_encode(random_bytes(16)),
        ]);

        $response = $this->post("/documents/{$document->document_id}/share", [
            'user_id' => $this->viewer->id,
        ]);

        $response->assertStatus(200);
        $this->assertTrue($document->isSharedWith($this->viewer));
    }

    /** @test */
    public function legacy_documents_cannot_be_shared()
    {
        $this->actingAs($this->owner);

        $document = Document::factory()->create([
            'user_id' => $this->owner->id,
            'encryption_mode' => 'legacy_derived',
        ]);

        $response = $this->post("/documents/{$document->document_id}/share", [
            'user_id' => $this->viewer->id,
        ]);

        $response->assertStatus(400);
        $this->assertFalse($document->isSharedWith($this->viewer));
    }

    /** @test */
    public function access_can_be_revoked()
    {
        $this->actingAs($this->owner);

        $document = Document::factory()->create([
            'user_id' => $this->owner->id,
            'encryption_mode' => 'envelope_wrapped',
        ]);

        $document->sharedWith()->attach($this->viewer->id, [
            'shared_by' => $this->owner->id,
            'wrapped_dek' => random_bytes(48),
        ]);

        $this->assertTrue($document->isSharedWith($this->viewer));

        $response = $this->delete("/documents/{$document->document_id}/revoke/{$this->viewer->id}");

        $response->assertStatus(200);
        $this->assertFalse($document->fresh()->isSharedWith($this->viewer));
    }
}

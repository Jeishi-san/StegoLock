<?php

namespace Tests\Feature;

use App\Models\Document;
use App\Models\Folder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FolderTest extends TestCase
{
    use RefreshDatabase;

    /**
     * FT-F01: Test user can view folders
     */
    public function test_user_can_view_folders(): void
    {
        $user = User::factory()->create();
        $folder = Folder::create([
            'user_id' => $user->id,
            'name' => 'Test Folder',
            'parent_id' => null,
        ]);

        $response = $this->actingAs($user)->get('/folders');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('MyFolders')
            ->has('folders')
        );
    }

    /**
     * FT-F02: Test user can create folder
     */
    public function test_user_can_create_folder(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/folders', [
            'name' => 'New Folder',
        ]);

        $response->assertStatus(200);
        $response->assertJson(['name' => 'New Folder']);
        $this->assertDatabaseHas('folders', [
            'user_id' => $user->id,
            'name' => 'New Folder',
            'parent_id' => null,
        ]);
    }

    /**
     * FT-F03: Test folder creation requires name
     */
    public function test_folder_creation_requires_name(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/folders', [
            'name' => '',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['name']);
    }

    /**
     * FT-F04: Test user can rename folder
     */
    public function test_user_can_rename_folder(): void
    {
        $user = User::factory()->create();
        $folder = Folder::create([
            'user_id' => $user->id,
            'name' => 'Old Name',
            'parent_id' => null,
        ]);

        $response = $this->actingAs($user)->putJson("/folders/{$folder->folder_id}", [
            'name' => 'New Name',
        ]);

        $response->assertStatus(200);
        $response->assertJson(['name' => 'New Name']);
        $this->assertDatabaseHas('folders', [
            'folder_id' => $folder->folder_id,
            'name' => 'New Name',
        ]);
    }

    /**
     * FT-F05: Test user cannot rename others folder
     */
    public function test_user_cannot_rename_others_folder(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $folder = Folder::create([
            'user_id' => $user2->id,
            'name' => 'Other User Folder',
            'parent_id' => null,
        ]);

        $response = $this->actingAs($user1)->putJson("/folders/{$folder->folder_id}", [
            'name' => 'Hacked Name',
        ]);

        $response->assertStatus(404);
        $this->assertDatabaseHas('folders', [
            'folder_id' => $folder->folder_id,
            'name' => 'Other User Folder',
        ]);
    }

    /**
     * FT-F06: Test user can delete empty folder
     */
    public function test_user_can_delete_empty_folder(): void
    {
        $user = User::factory()->create();
        $folder = Folder::create([
            'user_id' => $user->id,
            'name' => 'To Delete',
            'parent_id' => null,
        ]);

        $response = $this->actingAs($user)->deleteJson("/folders/{$folder->folder_id}");

        $response->assertStatus(200);
        $response->assertJson(['message' => 'Folder deleted successfully']);
        $this->assertDatabaseMissing('folders', [
            'folder_id' => $folder->folder_id,
        ]);
    }

    /**
     * FT-F07: Test delete folder moves documents to root
     */
    public function test_delete_folder_moves_documents_to_root(): void
    {
        $user = User::factory()->create();
        $folder = Folder::create([
            'user_id' => $user->id,
            'name' => 'Folder With Docs',
            'parent_id' => null,
        ]);
        $document = Document::create([
            'user_id' => $user->id,
            'folder_id' => $folder->folder_id,
            'filename' => 'test.pdf',
            'file_type' => 'application/pdf',
            'file_hash' => hash('sha256', 'test'),
            'original_size' => 1000,
            'status' => 'uploaded',
        ]);

        $response = $this->actingAs($user)->deleteJson("/folders/{$folder->folder_id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('folders', [
            'folder_id' => $folder->folder_id,
        ]);
        $this->assertDatabaseHas('documents', [
            'document_id' => $document->document_id,
            'folder_id' => null,
        ]);
    }

    /**
     * FT-F08: Test user can create subfolder
     */
    public function test_user_can_create_subfolder(): void
    {
        $user = User::factory()->create();
        $parentFolder = Folder::create([
            'user_id' => $user->id,
            'name' => 'Parent Folder',
            'parent_id' => null,
        ]);

        $response = $this->actingAs($user)->postJson('/folders', [
            'name' => 'Child Folder',
            'parent_id' => $parentFolder->folder_id,
        ]);

        $response->assertStatus(200);
        $response->assertJson(['name' => 'Child Folder']);
        $this->assertDatabaseHas('folders', [
            'user_id' => $user->id,
            'name' => 'Child Folder',
            'parent_id' => $parentFolder->folder_id,
        ]);
    }

    /**
     * FT-F09: Test user cannot delete others folder
     */
    public function test_user_cannot_delete_others_folder(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $folder = Folder::create([
            'user_id' => $user2->id,
            'name' => 'Other User Folder',
            'parent_id' => null,
        ]);

        $response = $this->actingAs($user1)->deleteJson("/folders/{$folder->folder_id}");

        $response->assertStatus(404);
        $this->assertDatabaseHas('folders', [
            'folder_id' => $folder->folder_id,
        ]);
    }
}

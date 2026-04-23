<?php

namespace App\Services;

use App\Models\Document;
use App\Models\User;
use App\Providers\EncryptionService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DocumentSharingService
{
    public function __construct(
        protected EncryptionService $encryptionService,
        protected DocumentDecryptionService $decryptionService
    ) {}

    /**
     * Share an existing document with another user
     * Only works for envelope mode documents
     */
    public function shareDocument(Document $document, User $recipientUser, string $permission = 'view'): bool
    {
        if (!$document->isEnvelopeMode()) {
            throw new \Exception("Only envelope encrypted documents can be shared securely");
        }

        if ($document->user_id !== Auth::id()) {
            throw new \Exception("Only document owner can share this document");
        }

        // Get plain DEK using owner's master key
        $masterKey = session('master_key');
        if (!$masterKey) {
            throw new \Exception("Master key not found in session");
        }

        $plainDek = $this->encryptionService->unwrapDEK(
            $document->document_dek,
            $document->document_dek_iv,
            $document->document_dek_tag,
            $masterKey
        );

        // Wrap DEK for recipient user
        $wrapped = $this->encryptionService->wrapDEK($plainDek, $masterKey);

        // Create grant record
        $document->sharedWith()->attach($recipientUser->id, [
            'shared_by' => Auth::id(),
            'permission' => $permission,
            'wrapped_dek' => $wrapped['wrapped_dek'],
            'wrapped_dek_iv' => $wrapped['iv'],
            'wrapped_dek_auth_tag' => $wrapped['auth_tag'],
        ]);

        return true;
    }

    /**
     * Revoke access for a user
     */
    public function revokeAccess(Document $document, int $userId): bool
    {
        if ($document->user_id !== Auth::id()) {
            throw new \Exception("Only document owner can revoke access");
        }

        // Remove grant record - this immediately revokes access
        $document->sharedWith()->detach($userId);

        return true;
    }

    /**
     * Get list of users with access to this document
     */
    public function getGrantedUsers(Document $document)
    {
        return $document->sharedWith()
            ->select(['users.id', 'users.name', 'users.email', 'document_user.permission', 'document_user.created_at'])
            ->whereNotNull('document_user.wrapped_dek')
            ->get();
    }

    /**
     * Check if current user has valid access grant
     */
    public function hasValidGrant(Document $document, int $userId): bool
    {
        if ($document->user_id === $userId) {
            return true;
        }

        return $document->sharedWith()
            ->where('user_id', $userId)
            ->whereNotNull('wrapped_dek')
            ->exists();
    }
}

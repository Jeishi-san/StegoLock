<?php

// @formatter:off
// phpcs:ignoreFile
/**
 * A helper file for your Eloquent Models
 * Copy the phpDocs from this file to the correct Model,
 * And remove them from this file, to prevent double declarations.
 *
 * @author Barry vd. Heuvel <barryvdh@gmail.com>
 */


namespace App\Models{
/**
 * @property string $cover_id
 * @property string $filename
 * @property string $path
 * @property string $type
 * @property int $size_bytes
 * @property array<array-key, mixed>|null $metadata
 * @property string $hash
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Cover newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Cover newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Cover query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Cover whereCoverId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Cover whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Cover whereFilename($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Cover whereHash($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Cover whereMetadata($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Cover wherePath($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Cover whereSizeBytes($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Cover whereType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Cover whereUpdatedAt($value)
 */
	class Cover extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $document_id
 * @property int $user_id
 * @property string $filename
 * @property string $file_type
 * @property string $file_hash
 * @property int $original_size
 * @property int|null $encrypted_size
 * @property string|null $dk_salt
 * @property string $status
 * @property int|null $fragment_count
 * @property int $in_cloud_size
 * @property string|null $error_message
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property string|null $folder_id
 * @property-read \App\Models\Folder|null $folder
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Fragment> $fragments
 * @property-read int|null $fragments_count
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereDkSalt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereDocumentId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereEncryptedSize($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereErrorMessage($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereFileHash($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereFileType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereFilename($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereFolderId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereFragmentCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereInCloudSize($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereOriginalSize($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Document whereUserId($value)
 */
	class Document extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $folder_id
 * @property int $user_id
 * @property string $name
 * @property string|null $parent_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Folder> $children
 * @property-read int|null $children_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Document> $documents
 * @property-read int|null $documents_count
 * @property-read Folder|null $parent
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Folder newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Folder newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Folder query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Folder whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Folder whereFolderId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Folder whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Folder whereParentId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Folder whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Folder whereUserId($value)
 */
	class Folder extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $fragment_id
 * @property int $document_id
 * @property int $index
 * @property string $blob
 * @property int $size
 * @property string $hash
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Document $document
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fragment newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fragment newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fragment query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fragment whereBlob($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fragment whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fragment whereDocumentId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fragment whereFragmentId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fragment whereHash($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fragment whereIndex($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fragment whereSize($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fragment whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Fragment whereUpdatedAt($value)
 */
	class Fragment extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $map_id
 * @property int $document_id
 * @property array<array-key, mixed> $fragments_in_covers
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Document|null $document
 * @method static \Illuminate\Database\Eloquent\Builder<static>|FragmentMap newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|FragmentMap newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|FragmentMap query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|FragmentMap whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|FragmentMap whereDocumentId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|FragmentMap whereFragmentsInCovers($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|FragmentMap whereMapId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|FragmentMap whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|FragmentMap whereUpdatedAt($value)
 */
	class FragmentMap extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $stego_file_id
 * @property string $cloud_file_id
 * @property string $stego_map_id
 * @property string $fragment_id
 * @property int $offset
 * @property string $filename
 * @property int $stego_size
 * @property string $status
 * @property string|null $error_message
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Fragment $fragment
 * @property-read \App\Models\StegoMap $map
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StegoFile newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StegoFile newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StegoFile query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StegoFile whereCloudFileId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StegoFile whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StegoFile whereErrorMessage($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StegoFile whereFilename($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StegoFile whereFragmentId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StegoFile whereOffset($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StegoFile whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StegoFile whereStegoFileId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StegoFile whereStegoMapId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StegoFile whereStegoSize($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StegoFile whereUpdatedAt($value)
 */
	class StegoFile extends \Eloquent {}
}

namespace App\Models{
/**
 * @property string $stego_map_id
 * @property int $document_id
 * @property string $status
 * @property string|null $error_message
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Document $document
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\StegoFile> $stegoFiles
 * @property-read int|null $stego_files_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StegoMap newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StegoMap newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StegoMap query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StegoMap whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StegoMap whereDocumentId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StegoMap whereErrorMessage($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StegoMap whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StegoMap whereStegoMapId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StegoMap whereUpdatedAt($value)
 */
	class StegoMap extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property \Illuminate\Support\Carbon|null $email_verified_at
 * @property string $password_hash
 * @property string $auth_salt
 * @property string $ek_salt
 * @property string $master_key_enc
 * @property string $nonce
 * @property string $tag
 * @property int $storage_used
 * @property int $storage_limit
 * @property string|null $remember_token
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Notifications\DatabaseNotificationCollection<int, \Illuminate\Notifications\DatabaseNotification> $notifications
 * @property-read int|null $notifications_count
 * @method static \Database\Factories\UserFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereAuthSalt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereEkSalt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereEmailVerifiedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereMasterKeyEnc($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereNonce($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User wherePasswordHash($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereRememberToken($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereStorageLimit($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereStorageUsed($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereTag($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereUpdatedAt($value)
 */
	class User extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $pageid
 * @property string $title
 * @property string $feed
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WikiFeed newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WikiFeed newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WikiFeed query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WikiFeed whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WikiFeed whereFeed($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WikiFeed whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WikiFeed wherePageid($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WikiFeed whereTitle($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|WikiFeed whereUpdatedAt($value)
 */
	class WikiFeed extends \Eloquent {}
}


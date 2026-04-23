<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Document extends Model
{
    use HasFactory;

    protected $primaryKey = 'document_id';

    protected $fillable = [
        'user_id',
        'folder_id',
        'filename',
        'file_type',
        'file_hash',
        'original_size',
        'encrypted_size',
        'dk_salt',
        'encrypted_dek',
        'dek_nonce',
        'dek_tag',
        'dek_hash',
        'status',
        'fragment_count',
        'in_cloud_size',
        'error_message'
    ];

    protected $casts = [
        'original_size' => 'integer',
        'encrypted_size' => 'integer',
        'fragment_count' => 'integer',
        'in_cloud_size' => 'integer',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function folder()
    {
        return $this->belongsTo(Folder::class, 'folder_id', 'folder_id');
    }

    public function fragments()
    {
        return $this->hasMany(Fragment::class, 'document_id', 'document_id');
    }

    public function sharedWith()
    {
        return $this->belongsToMany(User::class)
            ->withPivot(['starred', 'shared_by', 'permission', 'created_at', 'updated_at'])
            ->withTimestamps();
    }

    public function isStarredBy(User $user): bool
    {
        return $this->sharedWith()->where('user_id', $user->id)->value('starred') ?? false;
    }

    public function isSharedWith(User $user): bool
    {
        return $this->sharedWith()->where('user_id', $user->id)->whereNotNull('shared_by')->exists();
    }
}

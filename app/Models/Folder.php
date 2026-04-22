<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Folder extends Model
{
    use HasUuids;

    protected $table = 'folders';
    protected $primaryKey = 'folder_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'user_id',
        'name',
        'parent_id',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    // Owner
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'user_id');
    }

    // Parent folder
    public function parent()
    {
        return $this->belongsTo(Folder::class, 'parent_id', 'folder_id');
    }

    // Child folders
    public function children()
    {
        return $this->hasMany(Folder::class, 'parent_id', 'folder_id');
    }

    // Documents inside folder
    public function documents()
    {
        return $this->hasMany(Document::class, 'folder_id', 'folder_id');
    }
}

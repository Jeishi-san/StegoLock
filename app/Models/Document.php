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

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function fragments()
    {
        return $this->hasMany(Fragment::class, 'document_id', 'document_id');
    }
}

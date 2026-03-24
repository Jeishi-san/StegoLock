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
        'file_hash',
        'original_size',
        'encrypted_size',
        'dk_salt',
        'status',
        'fragments',
        'error_message'
    ];

    protected $casts = [
        'original_size' => 'integer',
        'encrypted_size' => 'integer',
        'fragments' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

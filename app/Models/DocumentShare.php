<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentShare extends Model
{
    protected $primaryKey = 'share_id';

    protected $fillable = [
        'document_id',
        'sender_id',
        'recipient_id',
        'folder_id',
        'encrypted_dek',
        'dek_nonce',
        'dek_tag',
        'dk_salt',
        'status',
        'expires_at',
    ];

    public function document()
    {
        return $this->belongsTo(Document::class, 'document_id');
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }
}

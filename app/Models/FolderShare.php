<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FolderShare extends Model
{
    protected $primaryKey = 'share_id';

    protected $fillable = [
        'folder_id',
        'sender_id',
        'recipient_id',
        'status',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    public function folder()
    {
        return $this->belongsTo(Folder::class, 'folder_id', 'folder_id');
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function recipient()
    {
        return $this->belongsTo(User::class, 'recipient_id');
    }

    public function documentShares()
    {
        return $this->hasMany(DocumentShare::class, 'folder_share_id', 'share_id');
    }
}

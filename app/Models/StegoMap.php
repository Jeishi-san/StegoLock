<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StegoMap extends Model
{
    use HasUuids;

    protected $primaryKey = 'stego_map_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'stego_map_id',
        'document_id',
        'status',
        'error_message',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function document()
    {
        return $this->belongsTo(Document::class, 'document_id', 'document_id');
    }

    public function stegoFiles()
    {
        return $this->hasMany(StegoFile::class, 'stego_map_id', 'stego_map_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Status (define this early, avoid chaos later)
    |--------------------------------------------------------------------------
    */

    const STATUS_PENDING = 'pending';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';
}

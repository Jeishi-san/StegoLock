<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StegoFile extends Model
{
    use HasUuids;

    protected $primaryKey = 'stego_file_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'stego_file_id',
        'cloud_file_id',
        'stego_map_id',
        'fragment_id',
        'offset',
        'filename',
        'stego_size',
        'status',
        'error_message',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function map() //1 file belongs to 1 stego map; there can be many files in a stego map
    {
        return $this->belongsTo(StegoMap::class, 'stego_map_id', 'stego_map_id');
    }

    public function fragment() // 1:1
    {
        return $this->belongsTo(Fragment::class, 'fragment_id', 'fragment_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

    const STATUS_PENDING = 'pending';
    const STATUS_EMBEDDED = 'embedded';
    const STATUS_FAILED = 'failed';
}

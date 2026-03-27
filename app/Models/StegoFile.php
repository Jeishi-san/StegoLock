<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StegoFile extends Model
{
    use HasUuids;

    protected $primaryKey = 'stego_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'stego_id',
        'fcm_id',
        'stego_path',
        'stego_size',
        'status',
        'error_message',
    ];

    // Relationship
    public function map()
    {
        return $this->belongsTo(FragmentMap::class, 'map_id', 'map_id');
    }
}

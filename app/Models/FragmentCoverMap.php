<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class FragmentCoverMap extends Model
{
    use HasUuids;

    protected $primaryKey = 'fcm_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'fcm_id',
        'map_id',
        'fragment_id',
        'cover_id',
        'offset',
    ];

    public function map()
    {
        return $this->belongsTo(FragmentMap::class, 'map_id', 'map_id');
    }

    public function fragment()
    {
        return $this->belongsTo(Fragment::class, 'fragment_id', 'fragment_id');
    }

    public function cover()
    {
        return $this->belongsTo(Cover::class, 'cover_id', 'cover_id');
    }
}

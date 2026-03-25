<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FragmentMap extends Model
{
    use HasFactory;

    protected $primaryKey = 'map_id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'map_id',
        'document_id',
        'fragments_in_covers',
        'status',
    ];

    protected $casts = [
        'fragments_in_covers' => 'array', // automatically casts JSON <-> array
    ];

    public function document() {
        return $this->belongsTo(Document::class);
    }
}

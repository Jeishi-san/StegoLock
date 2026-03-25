<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cover extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'filename',
        'path',
        'size_bytes',
        'metadata',
        'hash',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];
}

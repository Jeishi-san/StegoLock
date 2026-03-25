<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Fragment extends Model
{
    use HasFactory;

    protected $table = 'fragments';

    // Primary key
    protected $primaryKey = 'fragment_id';
    public $incrementing = false; // If you're using UUIDs
    protected $keyType = 'string';

    // Fillable fields
    protected $fillable = [
        'fragment_id',
        'document_id',
        'index',
        'blob',
        'size',
        'hash',
        'status',
    ];

    // Optional: cast the status as enum
    protected $casts = [
        'status' => 'string', // could also be custom Enum class if needed
        'blob' => 'integer',
    ];

    // Relationship: Fragment belongs to a Document
    public function document()
    {
        return $this->belongsTo(Document::class, 'document_id', 'document_id');
    }
}

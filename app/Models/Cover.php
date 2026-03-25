<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cover extends Model
{
    use HasFactory;

    protected $table = 'covers';

    // Primary key
    protected $primaryKey = 'cover_id';
    public $incrementing = false; // If you're using UUIDs
    protected $keyType = 'string';

    // Fillable fields
    protected $fillable = [
        'cover_id',
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

/* image metadata
   - width: int
   - height: int
   - format: string
   - color_profile: string

   - width: Needed for safe capacity calculation
   - height: Needed for safe capacity calculation
   - safe_bytes: Max bytes that can be embedded safely
   - format: PNG, JPG, etc., if needed
*/

/* text metadata
    - safe_bytes: Max payload size that can be embedded safely
    - offset: Random start position where payload is embedded
    - encoding: Optional, if you embed text and want to store encoding info (e.g., UTF-8)
 */

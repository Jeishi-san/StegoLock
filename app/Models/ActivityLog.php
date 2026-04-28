<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'action',
        'description',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Helper to log an activity
     */
    public static function log($userId, $action, $description, $metadata = null)
    {
        return self::create([
            'user_id' => $userId,
            'action' => $action,
            'description' => $description,
            'metadata' => $metadata,
        ]);
    }
}

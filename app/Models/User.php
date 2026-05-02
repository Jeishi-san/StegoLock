<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    const ROLE_USER = 'user';
    const ROLE_USER_ADMIN = 'user_admin';
    const ROLE_DB_STORAGE_ADMIN = 'db_storage_admin';
    const ROLE_SUPERADMIN = 'superadmin';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'role',
        'is_active',
        'storage_used',
        'storage_limit',
    ];

    /**
     * The attributes that are not mass assignable.
     *
     * @var list<string>
     */
    protected $guarded = [
        'password_hash',
        'auth_salt',
        'ek_salt',
        'master_key_enc',
        'nonce',
        'tag',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password_hash',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'storage_used' => 'integer',
            'storage_limit' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the password for the user (required by Authenticatable).
     */
    public function getAuthPassword(): string
    {
        return $this->password_hash;
    }

    /**
     * Get the documents for the user.
     */
    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    /**
     * Shares sent by the user.
     */
    public function sentShares()
    {
        return $this->hasMany(DocumentShare::class, 'sender_id');
    }

    /**
     * Shares received by the user.
     */
    public function receivedShares()
    {
        return $this->hasMany(DocumentShare::class, 'recipient_id');
    }

    /**
     * Recalculate and update the storage_used column based on the sum of in_cloud_size of all user's documents.
     */
    public function refreshStorageUsed(): void
    {
        $totalUsed = $this->documents()->sum('in_cloud_size');
        $this->update(['storage_used' => $totalUsed]);
    }

    /**
     * Role checks
     */
    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    public function isUserAdmin(): bool
    {
        return in_array($this->role, [self::ROLE_USER_ADMIN, self::ROLE_SUPERADMIN]);
    }

    public function isDbStorageAdmin(): bool
    {
        return in_array($this->role, [self::ROLE_DB_STORAGE_ADMIN, self::ROLE_SUPERADMIN]);
    }

    public function isSuperadmin(): bool
    {
        return $this->role === self::ROLE_SUPERADMIN;
    }

    public function activities()
    {
        return $this->hasMany(ActivityLog::class);
    }
}

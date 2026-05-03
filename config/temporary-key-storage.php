<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Temporary Key Storage Driver
    |--------------------------------------------------------------------------
    |
    | The backing store used for temporary master key tokens.
    | Uses Laravel's Cache facade, so any supported driver can be used.
    |
    | Supported drivers:
    |   - 'database'   : Database cache (default, uses cache table)
    |   - 'redis'      : Redis key-value store (production high-performance)
    |   - 'array'      : In-memory array (best for testing, no persistence)
    |   - 'file'       : File-based cache (no extra software needed)
    |   - 'memcached'  : Memcached store (if Memcached is installed)
    |
    | The store must be configured in config/cache.php under 'stores'.
    |
    */

    'store' => env('TEMPORARY_KEY_STORAGE_STORE', 'database'),

    /*
    |--------------------------------------------------------------------------
    | Temporary Key Storage TTL
    |--------------------------------------------------------------------------
    |
    | The time-to-live in seconds for temporary master key tokens.
    | Default is 3600 seconds (1 hour).
    |
    | For testing, you can set this to a shorter time or use:
    |   TEMPORARY_KEY_STORAGE_TTL=60
    |
    */

    'ttl' => env('TEMPORARY_KEY_STORAGE_TTL', 3600),
];

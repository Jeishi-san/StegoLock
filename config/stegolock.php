<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Encryption Configuration
    |--------------------------------------------------------------------------
    |
    | Configure encryption modes and security parameters for StegoLock
    |
    */

    'encryption' => [

        /**
         * Default encryption mode for new documents
         *
         * Supported values:
         * 'legacy_derived' - Single user only, DEK derived from master key (original behavior)
         * 'envelope_wrapped' - Multi user support, random DEK wrapped per user
         */
        'default_mode' => env('STEGOLOCK_DEFAULT_ENCRYPTION_MODE', 'legacy_derived'),

        /**
         * List of supported encryption modes
         * Remove modes to disable them in the UI
         */
        'supported_modes' => [
            'legacy_derived',
            'envelope_wrapped',
        ],

        /**
         * DEK length in bytes
         * Default: 32 bytes = 256 bit key
         */
        'dek_length' => 32,

        /**
         * Algorithm used for key wrapping
         */
        'wrap_algorithm' => 'aes-256-gcm',

        /**
         * Nonce/IV length for GCM mode
         */
        'nonce_length' => 12,

        /**
         * Authentication tag length
         */
        'tag_length' => 16,
    ],

    /*
    |--------------------------------------------------------------------------
    | Sharing Configuration
    |--------------------------------------------------------------------------
    */

    'sharing' => [

        /**
         * Allow sharing of legacy documents
         * Legacy documents cannot be securely shared, enable at own risk
         */
        'allow_legacy_sharing' => false,

        /**
         * Default permission for new shares
         */
        'default_permission' => 'view',

        /**
         * Available permissions
         */
        'available_permissions' => ['view', 'edit', 'owner'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Security Settings
    |--------------------------------------------------------------------------
    */

    'security' => [

        /**
         * Automatically re-wrap DEK when user changes master key
         */
        'auto_rewrap_on_master_key_change' => true,

        /**
         * Delete all wrapped DEKs when document is deleted
         */
        'delete_grants_on_document_delete' => true,

        /**
         * Maximum number of users a document can be shared with
         */
        'max_shared_users' => 100,
    ],

];

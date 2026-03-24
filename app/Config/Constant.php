<?php

namespace App\Config;

class Constant
{
    public const AUTH_SALT_LEN = 16;
    public const EK_SALT_LEN = 16;

    public const MK_LEN = 32;

    public const DK_SALT_LEN = 32;
    public const NONCE_LEN = 12;
    public const TAG_LEN = 16;

    public const HKDF_INFO = 'document-enc-key';
}

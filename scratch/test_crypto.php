<?php

// Mocking constants
class Constant {
    public const DK_SALT_LEN = 32;
    public const NONCE_LEN = 12;
    public const TAG_LEN = 16;
}

function test_encrypt_decrypt() {
    $plaintext = "Hello, this is a secret message!";
    $masterKey = bin2hex(random_bytes(16)); // Mock master key
    $dk_salt = random_bytes(Constant::DK_SALT_LEN);
    
    // Derivation
    $documentKey = hash_hkdf('sha256', $masterKey, 32, 'document-enc-key', $dk_salt);
    
    // Encryption
    $nonce = random_bytes(Constant::NONCE_LEN);
    $tag = '';
    $ciphertext = openssl_encrypt(
        $plaintext,
        'aes-256-gcm',
        $documentKey,
        OPENSSL_RAW_DATA,
        $nonce,
        $tag
    );
    
    $stored_data = $nonce . $tag . $ciphertext;
    
    // --- Decryption ---
    
    $nonceLen = Constant::NONCE_LEN;
    $tagLen = Constant::TAG_LEN;
    
    $nonce_extracted = substr($stored_data, 0, $nonceLen);
    $tag_extracted = substr($stored_data, $nonceLen, $tagLen);
    $ciphertext_extracted = substr($stored_data, $nonceLen + $tagLen);
    
    // Re-derive key
    $documentKey_derived = hash_hkdf('sha256', $masterKey, 32, 'document-enc-key', $dk_salt);
    
    $decrypted = openssl_decrypt(
        $ciphertext_extracted,
        'aes-256-gcm',
        $documentKey_derived,
        OPENSSL_RAW_DATA,
        $nonce_extracted,
        $tag_extracted
    );
    
    if ($decrypted === $plaintext) {
        echo "Success: Decrypted text matches plaintext.\n";
    } else {
        echo "Failure: Decrypted text does NOT match plaintext.\n";
    }
}

test_encrypt_decrypt();

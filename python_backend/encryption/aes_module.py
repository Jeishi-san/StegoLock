from Crypto.Cipher import AES
from Crypto.Protocol.KDF import PBKDF2
from Crypto.Random import get_random_bytes

def derive_key(password: str, salt: bytes):
    """Derive a 256-bit AES key from a password using PBKDF2"""
    return PBKDF2(password, salt, dkLen=32)

def encrypt_file(content: bytes, password: str):
    """
    Encrypts file content using AES-GCM
    Returns: bytes of [salt + nonce + tag + ciphertext]
    """
    salt = get_random_bytes(16)
    key = derive_key(password, salt)

    cipher = AES.new(key, AES.MODE_GCM)
    ciphertext, tag = cipher.encrypt_and_digest(content)

    return salt + cipher.nonce + tag + ciphertext

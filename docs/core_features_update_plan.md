# Implementation Plan - Compression and Marker Update

This plan outlines the steps to implement data compression before encryption for improved efficiency and to update the steganography marker to a branded "###STEGOLOCK###" string.

## User Review Required

> [!IMPORTANT]
> The compression will use PHP's `gzcompress()` (zlib) which is standard. This will make all existing "locked" documents incompatible with the new system. Only new documents locked after this change will be unlockable.

## Proposed Changes

### Backend (PHP)

#### [MODIFY] [DocumentController.php](file:///d:/laragon/www/stegolock/app/Http/Controllers/DocumentController.php)
- Update the `encrypt` method to compress the plaintext using `gzcompress()` before AES-256-GCM encryption.

#### [MODIFY] [ProcessUnlockJob.php](file:///d:/laragon/www/stegolock/app/Jobs/ProcessUnlockJob.php)
- Update the `decrypt` method to decompress the resulting plaintext using `gzuncompress()` after decryption.

---

### Python Steganography Scripts

#### [MODIFY] [text/embed.py](file:///d:/laragon/www/stegolock/python_backend/embedding/text/embed.py)
#### [MODIFY] [text/extract.py](file:///d:/laragon/www/stegolock/python_backend/embedding/text/extract.py)
#### [MODIFY] [audio/embed.py](file:///d:/laragon/www/stegolock/python_backend/embedding/audio/embed.py)
#### [MODIFY] [audio/extract.py](file:///d:/laragon/www/stegolock/python_backend/embedding/audio/extract.py)
#### [MODIFY] [image/embed.py](file:///d:/laragon/www/stegolock/python_backend/embedding/image/embed.py)
#### [MODIFY] [image/extract.py](file:///d:/laragon/www/stegolock/python_backend/embedding/image/extract.py)
#### [MODIFY] [image/check_image.py](file:///d:/laragon/www/stegolock/python_backend/embedding/image/check_image.py)
- Change `###END###` to `###STEGOLOCK###` in all embedding and extraction logic.
- Update `check_image.py` to subtract the correct byte length (15 bytes) for the new marker.

---

## Verification Plan

### Automated Tests
- I will perform a test run by:
    1. Uploading a document.
    2. Locking the document (verifying compression happens and stego files are created with the new marker).
    3. Unlocking the document (verifying extraction works with the new marker and decompression recovers the original file).

### Manual Verification
- Check the size of the encrypted fragments to ensure they are smaller than the original plaintext for compressible files (like .txt or .doc).

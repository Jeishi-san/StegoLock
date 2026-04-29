# Walkthrough - Core Features Update

This document tracks the changes made to implement document compression and rebranded steganography markers.

## Changes Made

### 1. Backend Compression
- [x] Added `gzcompress()` to the encryption pipeline in `DocumentController`.
- [x] Added `gzuncompress()` to the decryption pipeline in `ProcessUnlockJob`.

### 2. Steganography Marker Rebranding
- [x] Replaced `###END###` with `###STEGOLOCK###` in all Python embedding and extraction scripts.
- [x] Adjusted capacity calculations in `check_image.py`.

## Verification Results
*Pending execution.*

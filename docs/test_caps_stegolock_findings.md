# StegoLock Technical Analysis

This document provides a detailed breakdown of the StegoLock application's core processes, including steganography techniques, the end-to-end system workflow, and administrative capabilities.

---

## 1. Steganography Technical Processes

The application uses two primary methods for hiding data, depending on the carrier file type.

### A. Image Steganography (2-bit LSB)
**Implementation:** `python/stego_lsb.py`

| Step | Action | Description |
| :--- | :--- | :--- |
| **1** | **Prepare** | Payload is Base64 encoded by PHP and passed to the Python driver. |
| **2** | **Header** | A 4-byte magic string (`STG2`) and a 4-byte payload length integer are prepended. |
| **3** | **Convert** | The image is flattened into an RGB numpy array. Bits are extracted from the payload and grouped into pairs. |
| **4** | **Embed** | The last 2 bits of each color channel are cleared and replaced with 2 bits from the payload. |
| **5** | **Save** | The array is reshaped and saved as an uncompressed image (typically PNG). |

**Extraction:** Reads the 2 LSBs of the first 32 channels to recover the header, validates the magic string, then reads the specified length from subsequent channels.

### B. Audio Steganography (1-bit LSB)
**Implementation:** `python/wav_embed.py`

| Step | Action | Description |
| :--- | :--- | :--- |
| **1** | **Validate** | Ensures the WAV file is uncompressed PCM (8-bit or 16-bit). |
| **2** | **Header** | Prepends a 4-byte big-endian length header to the raw binary payload. |
| **3** | **Embed** | Replaces the absolute Least Significant Bit (1 bit) of each audio sample with one bit from the payload. |
| **4** | **Safety** | Applies a 0.95 capacity safety factor to prevent over-filling the carrier. |

**Extraction:** Extracts the first 32 bits from audio samples to get the length, then reconstructs the remaining bits into the original file.

---

## 2. End-to-End System Workflow

The system coordinates several services to handle document lifecycle management.

### Encoding Workflow (Upload & Hide)
1.  **Ingestion:** User uploads a document; controller captures it and the user's session-stored **Master Key**.
2.  **Encryption:** `CryptoService` generates a unique Data Encryption Key (DEK). The file is encrypted via AES-256-GCM. The DEK is "wrapped" (encrypted) using the user's Master Key for secure storage.
3.  **Fragmentation:** `SegmentationService` calculates carrier capacities and splits the ciphertext into chunks.
4.  **Embedding:** `StegoService` invokes Python drivers to embed chunks into carriers.
5.  **Cloud Storage:** Modified carriers are uploaded to S3-compatible cloud storage.
6.  **Persistence:** The mapping of segments to carriers is saved in the database.

### Decoding Workflow (Retrieve & Recover)
1.  **Authentication:** System verifies the user is the owner or has an active "Share Grant".
2.  **Key Recovery:** The DEK is unwrapped using the caller's Master Key.
3.  **Fetching:** Chunks are retrieved (either from the database cache or re-extracted from cloud storage).
4.  **Reconstruction:** `SegmentationService` joins chunks in the correct order and verifies integrity hashes.
5.  **Decryption:** `CryptoService` decrypts the ciphertext back to the original file bytes.

---

## 3. Administrative Capabilities

Admins have broad oversight of the system via the `/admin` portal.

### Admin View (UI Pages)
- **Dashboard:** High-level metrics (users, storage usage, stego docs).
- **Users (`/admin/users`):** Full CRUD control over all user accounts and roles.
- **Activity (`/admin/activity`):** Centralized view of system audit logs and access history.
- **Fragments (`/admin/fragments`):** Oversight of stego storage, fragmentation stats, and the carrier pool.
- **Encryption Policy:** Global configuration for encryption algorithms and imperceptibility (PSNR) thresholds.
- **Key Management:** Tools for managing system keys and cryptographic rotations.

### Global Permissions
Based on `RoleSeeder`, the **Admin** role possesses global permissions across the entire platform:
- **Moderation:** Can read, update, or delete any Document, Folder, Tag, or Category regardless of ownership.
- **Stego Oversight:** Can view and manage all `StegoDocuments` across the system.
- **System Configuration:** Exclusive access to `manage_system` and `configure_settings` permissions.

> [!NOTE]
> High-level management of other administrators (`/admin/admin-management`) is further restricted to **Superadmins/Owners** only.

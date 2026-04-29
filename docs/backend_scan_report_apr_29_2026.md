# StegoLock Backend Scan Report
Generated: April 29, 2026

This document provides a comprehensive mapping of the backend architecture, focusing on the core engines that drive the steganographic and cryptographic pipelines of StegoLock.

---

## 1. Core Engines (The "Heart" of StegoLock)

### A. Cryptography Engine
- **Location**: `app/Services/CryptoService.php`
- **Responsibility**: Handles high-level AES-256-GCM encryption and decryption.
- **Key Features**: 
    - Integration with Key Derivation Functions (KDF).
    - Ensures data integrity and confidentiality before fragmentation.

### B. Steganography Engine (Python)
- **Location**: `python_backend/embedding/`
- **Responsibility**: The actual "hiding" and "extracting" of data shards.
- **Sub-Modules**:
    - `image/`: LSB (Least Significant Bit) or equivalent embedding in PNG/JPG.
    - `text/`: Zero-width character or metadata-based embedding in TXT files.
    - `audio/`: WAV/MP3 embedding logic.
    - `batch_processor.py`: Orchestrates multi-shard extraction during the "Unlock" phase.

### C. Fragmentation & Orchestration Engine
- **Location**: `app/Jobs/ProcessSteganoJob.php`
- **Responsibility**: Manages the end-to-end "Locking" pipeline.
- **Logic Flow**:
    1. **Cover Selection**: Greedy algorithm to select diverse covers (Text, Image, Audio) based on payload size.
    2. **Fluid Splitting**: Dynamic fragmentation of encrypted files into variable-sized shards.
    3. **Mapping**: Generating the `FragmentMap` and `StegoMap` which act as the "Blueprints" for reconstruction.
    4. **Execution**: Calling the Python Stegano Engine via shell execution.

---

## 2. Background Processing (Jobs)

Background workers ensure the UI remains responsive while heavy processing occurs.

| Job Name | File | Primary Responsibility |
| :--- | :--- | :--- |
| **ProcessSteganoJob** | `app/Jobs/ProcessSteganoJob.php` | Handles Encryption -> Fragmentation -> Embedding -> Cloud Upload. |
| **ProcessUnlockJob** | `app/Jobs/ProcessUnlockJob.php` | Handles Retrieval -> Extraction -> Reconstruction -> Decryption. |
| **ScanCoversJob** | `app/Jobs/ScanCoversJob.php` | Automated pool auditing and metadata re-indexing for cover files. |

---

## 3. Data Infrastructure (Persistence & Storage)

### A. Core Database Models
- **`Document`**: Master record for user files, tracking lifecycle status (locked, embedded, stored).
- **`Fragment`**: Tracks individual data shards and their cryptographic hashes.
- **`Cover`**: Inventory of available "carrier" files with capacity metadata.
- **`StegoFile`**: Records the association between a Fragment and its Cloud Storage location.
- **`StegoMap` / `FragmentMap`**: The critical relational maps required for file reconstruction.

### B. Storage Integration
- **Service**: `app/Providers/B2Service.php` (Backblaze B2 integration).
- **Config**: `config/filesystems.php`.
- **Functionality**: Handles batch uploads, single-file retrieval, and bucket management.

---

## 4. Business Logic (Controllers)

Entry points for frontend requests and administrative commands.

| Controller | Location | Primary Focus |
| :--- | :--- | :--- |
| **DocumentController** | `app/Http/Controllers/DocumentController.php` | Main entry point for uploads, downloads, sharing, and status polling. |
| **AdminDashboardController**| `app/Http/Controllers/Admin/AdminDashboardController.php` | Aggregates system-wide metrics for Superadmins. |
| **SystemManagementController**| `app/Http/Controllers/Admin/SystemManagementController.php` | Direct control over Cloud sync, DB integrity, and infrastructure health. |
| **CoverController** | `app/Http/Controllers/CoverController.php` | Manages the stego-pool (upload, scan, audit). |

---

## 5. Routing Architecture

- **Web Routes**: `routes/web.php` (Dashboard, File management, Admin views).
- **Auth Routes**: `routes/auth.php` (Breeze-based authentication logic).
- **API/Wiki Routes**: `routes/web.php` (External data feeds for text cover generation).

---

## 6. Technical Summary of Lifecycle
1. **Request**: User uploads file via `DocumentController`.
2. **Phase 1**: `CryptoService` encrypts file; `ProcessSteganoJob` is dispatched.
3. **Phase 2**: Job splits file, picks `Covers`, and executes `python_backend`.
4. **Phase 3**: Embedded shards are pushed to B2 via `B2Service`.
5. **Phase 4**: Database maps are finalized; UI status updates to "Stored".

---
*Backend Scan Report - Technical Verification - April 29, 2026*

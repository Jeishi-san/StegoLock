# StegoLock Core Features & Implementation Lifecycle
Generated: April 29, 2026

This document provides a module-by-module breakdown of the StegoLock application, detailing how backend operations are reflected in the frontend user experience.

---

## 1. Onboarding & Authentication Module
The entry point for all users, establishing the secure session and role-based permissions.

*   **Frontend**: `Welcome.jsx`, `Login.jsx`, `Register.jsx`.
*   **Backend**: Laravel Authentication (`auth.php` routes, `User.php` model).
*   **Lifecycle**:
    *   **Registration**: User provides credentials. Backend applies **Key Derivation Functions (KDF)** to passwords before hashing.
    *   **Authorization**: Roles (Standard User, Superadmin, System Admin) are attached to the session via Middleware.
    *   **Frontend Reflection**: The UI dynamically toggles between "Public" (Hero Section) and "Authenticated" (Dashboard) views based on auth state.

---

## 2. Workspace Management Module
The central hub for organizing files and folders.

*   **Frontend**: `Sidebar.jsx`, `MyDocuments.jsx`, `FolderGrid.jsx`.
*   **Backend**: `FolderController.php`, `DocumentController.php`.
*   **Lifecycle**:
    *   **Organization**: Users create hierarchical folders. Backend validates ownership and parent-child relationships.
    *   **Storage Tracking**: The `refreshStorageUsed()` method in the `User` model calculates usage in real-time.
    *   **Frontend Reflection**:
        - Sidebar displays a **Dynamic Storage Progress Bar** with color-coded alerts (Cyan for safe, Red for >90% usage).
        - File lists are rendered via `DocumentCard.jsx`, showing metadata like file type, size, and timestamp.

---

## 3. The "Locking" Pipeline (Security Engine)
The core steganographic workflow that protects documents.

*   **Frontend Trigger**: `UploadModal.jsx` $\rightarrow$ `trigger-upload-modal` event.
*   **Backend Core**: `ProcessSteganoJob.php`.
*   **Lifecycle**:
    1.  **Encryption**: `CryptoService` encrypts the file using AES-256-GCM.
    2.  **Cover Selection**: System picks diverse carriers (Text, Audio, Image) from the pool.
    3.  **Segmentation**: The file is split into UUID-tagged fragments. **Structural Mapping** (`FragmentMap`) is recorded.
    4.  **Embedding**: Backend executes Python scripts to hide shards.
    5.  **Cloud Storage**: `B2Service` pushes stego-files to Backblaze. **Storage Mapping** (`StegoMap`) is recorded.
*   **Frontend Reflection**: 
    - `DocumentCard` enters a "Processing" state with a **Cyan Shimmer Effect**.
    - Status labels cycle through: `Encrypting` $\rightarrow$ `Splitting` $\rightarrow$ `Protecting` $\rightarrow$ `Locked`.

---

## 4. The "Unlocking" Pipeline (Retrieval Engine)
The reverse process for secure document recovery.

*   **Frontend Trigger**: `DocumentCard` Menu $\rightarrow$ "Unlock File".
*   **Backend Core**: `ProcessUnlockJob.php`.
*   **Lifecycle**:
    1.  **Retrieval**: System fetches specific stego-files from B2 based on the `StegoMap`.
    2.  **Extraction**: `batch_processor.py` extracts shards from the carriers.
    3.  **Reassembly**: Fragments are validated via SHA-256 and stitched into the original encrypted blob.
    4.  **Decryption**: `CryptoService` restores the file to its original state.
*   **Frontend Reflection**:
    - Card displays an **"Imploding Puzzle" Animation** to visualize reconstruction.
    - Upon completion, a `DownloadReadyModal` automatically appears, prompting the user to retrieve their file.

---

## 5. Administrative Oversight Module
System-wide control for high-level maintenance.

*   **Frontend**: `Admin/Dashboard.jsx`, `Admin/Users.jsx`, `Admin/Cloud.jsx`.
*   **Backend**: `AdminDashboardController.php`, `SystemManagementController.php`.
*   **Lifecycle**:
    *   **User Admin**: Promote/Demote users to administrative roles; manage storage quotas.
    *   **Infra Monitoring**: "Zombie Detection" logic identifies cloud files without DB records.
    *   **Cover Auditing**: `ScanCoversJob` ensures the stego-pool is healthy and has sufficient capacity.
*   **Frontend Reflection**: 
    - Admins see a specialized **"System Control"** section in the Sidebar.
    - Dashboard features a **Non-Scrolling 3-Column Grid** for Cloud, Database, and User metrics.

---

## 6. Collaboration & Sharing Module
Secure sharing without exposing the underlying fragments.

*   **Frontend**: `ShareFileModal.jsx`, `SharedDocuments.jsx`.
*   **Backend**: `DocumentShare.php`, `FolderShare.php`.
*   **Lifecycle**:
    *   **Access Control**: Sharing creates a relational link rather than duplicating files.
    *   **Acceptance**: Recipients must "Accept" a share before it appears in their workspace.
*   **Frontend Reflection**: 
    - Shared files display a **"Users" Icon Badge** on the `DocumentCard`.
    - Sidebar shows a **Red Notification Badge** for pending share invitations.

---
*Technical Specification - StegoLock Core Architecture V2*

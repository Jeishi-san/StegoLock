# Implementation Plan - System Admin (Infrastructure & Integrity) Suite

This plan outlines the finalized expansion of the System Admin (`db_storage_admin`) role, focused on infrastructure oversight, cloud-to-database referential integrity, and steganographic library management.

## Completed Changes

### 1. Unified Control Center
#### [MODIFY] [AdminDashboardController.php](file:///d:/laragon/www/stegolock/app/Http/Controllers/Admin/AdminDashboardController.php)
- Implemented a role-aware index that provides an **Infrastructure Insights Grid** for System Admins.
- **Pillar 1: Cloud Composition**: Real-time split between Covers and Fragments.
- **Pillar 2: Database Management**: Data weight by table and integrity health.
- **Pillar 3: Library Utility**: Total embedding capacity and type distribution.

### 2. Cloud Infrastructure Analytics
#### [NEW] [Cloud.jsx](file:///d:/laragon/www/stegolock/resources/js/Pages/Admin/Cloud.jsx)
- **B2 Truth**: Fetches physical `contentLength` directly from Backblaze B2 API via `B2Service`.
- **Infrastructure Split**: Categorizes cloud storage into `cover_audios/`, `cover_images/`, `cover_texts/`, and `locked/`.
- **Connectivity Status**: Real-time monitoring of B2 service availability.

### 3. Data Integrity & "Zombie" Detection
#### [NEW] [Database.jsx](file:///d:/laragon/www/stegolock/resources/js/Pages/Admin/Database.jsx)
- **Referential Audit**: Compares the `stego_files` database records against the physical B2 `locked/` folder.
- **Zombie Detection**: Identifies documents that are unrecoverable due to missing fragments.
- **Relational Diagnostics**: High-level table size and engine version reporting.

### 4. Stego Library Management
#### [MODIFY] [CoverController.php](file:///d:/laragon/www/stegolock/app/Http/Controllers/CoverController.php)
- **Integrity Suite**: One-click tool to sync DB records with cloud storage and repair orphaned references.
- **Strict Ingestion**: Updated `ScanCoversJob` to enforce a 128KB minimum capacity threshold for all new covers.

### 5. Navigation & UI Refinement
#### [MODIFY] [Sidebar components](file:///d:/laragon/www/stegolock/resources/js/Components/Sidebar.jsx)
- Renamed "Database Health" to **Database Management** to reflect administrative scope.
- Established consistent iconography: `Cloud`, `Server` (DB), and `ImagePlus` (Covers).

## Verification Plan

### Automated Checks
- Run `php artisan covers:scan` (or trigger via UI) to verify Python-based capacity validation.
- Trigger **Integrity Audit** on the Covers page to verify DB-to-Cloud sync.

### Manual Verification
- Login as `system.admin@stegolock.com`.
- Verify the **3-Pillar Dashboard** shows actual cloud usage (790MB+).
- Verify the **Database Management** page identifies unrecoverable documents if fragments are missing.
- Confirm a `user_admin` is restricted from accessing these infrastructure-level views.

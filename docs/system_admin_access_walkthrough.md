# Walkthrough - System Admin Views (Cloud & Database)

I have successfully expanded the administrative interface to provide specialized views for System Admins (`db_storage_admin`). The previous "System Monitoring" catch-all has been replaced with dedicated, high-fidelity pages for Cloud Storage and Database Health.

## Changes Made

### 1. Routes & Security
- **Split Routes**: Created `admin/cloud` and `admin/database` routes in `web.php`.
- **Role Enforcement**: Both routes are strictly protected, accessible only to `db_storage_admin` and `superadmin` roles.

### 2. Backend Logic (`SystemManagementController`)
- **Cloud Metrics**: Implemented `cloudIndex` which aggregates total storage usage and individual user consumption data.
- **Database Analysis**: Implemented `databaseIndex` which performs a live analysis of the MySQL `information_schema` to return table sizes, row counts, and engine statistics.

### 3. Frontend Pages (React/Inertia)
Established a unified control center for infrastructure and library oversight:

- **Admin Dashboard (`Dashboard.jsx`)**: 
    - **Infrastructure Insights Grid**: A 3-column technical layout for System Admins:
        1. **Cloud Composition**: Visual breakdown of Covers vs. Fragments storage.
        2. **Database Architecture**: Real-time table weight analysis and integrity status.
        3. **Library Utility**: Monitoring of total embedding capacity and cover type distribution.
    - **Global Metrics**: Unified tracking of total users and system-wide storage load.

- **Cloud Infrastructure (`Cloud.jsx`)**:
    - **Storage Composition**: Visual breakdown showing usage split between Steganographic Covers vs. User Document Fragments (fetched via B2 API).
    - **B2 Service Monitoring**: Displays real-time API status and bucket metadata (Bucket Name, Global Limit).
    - **Quota Management**: Overview of user-specific storage consumption and limit settings.

- **Database Management (`Database.jsx`)**:
    - **Zombie Detection**: Identifies unrecoverable documents missing one or more required fragments in Backblaze B2.
    - **Referential Audit**: Scans the `stego_files` table against the `locked/` cloud prefix to find dead links.
    - **Relational Architecture**: Displays table-level engine diagnostics, row counts, and storage weight.

- **Cover Management (`Covers.jsx`)**:
    - **Ingest System**: Drag-and-drop candidates (Audio/Image/Text) for processing.
    - **Auto-Sync**: Background job validates capacity via Python and automatically uploads valid covers to Backblaze B2.
    - **Integrity Audit**: A specialized dashboard that compares the MySQL database against Backblaze B2 files to detect orphaned records.
    - **One-Click Repair**: Allows the admin to purge database records that point to non-existent cloud files, preventing file-locking errors.
    - **Gallery**: A categorized library of cloud-synced covers with live capacity stats.

### 4. Navigation Refinement
- **Sidebar Update**: Replaced "System Monitoring" with "Cloud Management" (Cloud icon), "Database Health" (Server icon), and "Cover Management" (ImagePlus icon).
- **Icon Set**: Integrated `Cloud`, `Server`, and `ImagePlus` icons from Lucide-React.
- **Bug Fixes**: 
    - Resolved a `Ziggy error` by updating the legacy `admin.system.stats` route reference in the general `Sidebar.jsx`.
    - Fixed a `Class "Inertia" not found` error in `SystemManagementController` by adding the missing namespace import.
    - Fixed an `ImagePlus is not defined` error in `Cloud.jsx` by adding the missing icon import.
    - Fixed a syntax error in `SystemManagementController` where the `cloudIndex` function signature was accidentally removed.
    - Resolved a MySQL syntax error in the integrity audit by quoting the reserved keyword `rows` with backticks.
    - Fixed a `Column not found` error on the dashboard by correctly accessing the `capacity` value stored within the `metadata` JSON column of the `covers` table.

## How to Verify

1. **Login** as a System Admin (e.g., `system.admin@stegolock.com`).
2. **Explore Sidebar**: Confirm you see "Dashboard", "Cloud Management", and "Database Health".
3. **Check Cloud**: Navigate to `/admin/cloud` to see user storage distribution.
4. **Check Database**: Navigate to `/admin/database` to see live table statistics.

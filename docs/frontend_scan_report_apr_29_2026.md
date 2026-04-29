# StegoLock Frontend Scan Report
Generated: April 29, 2026

This document provides a comprehensive mapping of the interactive elements, routes, and triggers across the StegoLock application, updated with administrative oversight modules.

---

## 1. Standard User Interface

### Global / Sidebar (Authenticated)
These elements are persistent across all dashboard pages via the `Sidebar.jsx` component.

| Feature | Type | Trigger / Route | Notes |
| :--- | :--- | :--- | :--- |
| **StegoLock Logo** | Link | `/myDocuments` | Returns to root document view. |
| **Dark Mode Toggle** | Button | Client-side state | Persists in `localStorage` (Sun/Moon icons). |
| **New Button** | Dropdown | Toggle | Opens New Action menu. |
| **Lock a File** | Action | `trigger-upload-modal` | Dispatches event to open `UploadModal`. |
| **New Folder** | Action | `onNewFolderClick` | Triggers `CreateFolderModal` or redirects to myDocuments. |
| **My Documents** | NavLink | `route('myDocuments')` | Main user workspace (active state: indigo). |
| **All Documents** | NavLink | `route('allDocuments')` | Flat list of all accessible files. |
| **Shared With Me** | NavLink | `route('sharedDocuments')` | Displays incoming shares + pending badge. |
| **Starred** | NavLink | `route('starredDocuments')` | Filtered view for favorite files. |
| **Manage Personal Space**| Button | `route('manageStorage')` | Navigates to storage quotas and cleanup. |
| **Storage Progress Bar** | Visual | View State | Shows `effectiveTotalStorage` / `effectiveStorageLimit`. |

### Landing Page (Public)
Located in `Welcome.jsx`.

| Feature | Type | Route | Notes |
| :--- | :--- | :--- | :--- |
| **Log In** | Link | `/login` | Public authentication entry. |
| **Get Started** | Link | `/register` | User registration. |
| **Secure Your Documents**| CTA Link | `/register` | Hero section primary button. |
| **Learn More** | Anchor | `#how-it-works` | Smooth scrolls to features section. |
| **Dashboard** | Link | `/myDocuments` | Replaces Login/Register if already authenticated. |
| **Social Links** | Icons | External | Github, Share, Info links in footer. |

### My Documents Page
Primary interface for file/folder management (`MyDocuments.jsx`).

| Feature | Type | Trigger / Route | Notes |
| :--- | :--- | :--- | :--- |
| **Search Bar** | Input | Filter (JS) | Real-time filtering of local data via `SearchBar.jsx`. |
| **Filters Dropdown** | Menu | Filter (JS) | Sort by Name, Date, Size, or Format. |
| **Grid/List Toggle** | Button | Local State | Switches between card grid and table list views. |
| **Breadcrumbs** | Links | `/myDocuments?folder_id={id}`| Hierarchical navigation. |
| **Document Star** | Button | `POST /documents/star/toggle` | Toggles favorite status on `DocumentCard`. |
| **Card Menu Button** | Button | Floating-UI | Opens actions for specific file (`DocumentCard.jsx`). |
| **Unlock File** | Action | `POST /documents/unlock` | Triggers background reconstruction pipeline. |
| **Rename** | Action | `RenameFileModal` | Updates document metadata. |
| **Move File** | Action | `MoveFileModal` | Changes parent folder association. |
| **Share File** | Action | `ShareFileModal` | Generates sharing invitations (Owners only). |
| **File Info** | Action | `FileInfoModal` | Shows activity logs and technical metadata. |
| **Delete** | Action | `ConfirmModal` | Permanent removal from system. |

### Shared Documents Page
Handles collaboration (`SharedDocuments.jsx`).

| Feature | Type | Route | Notes |
| :--- | :--- | :--- | :--- |
| **Accept Invitation** | Button | `POST /documents/share/accept`| Adds shared item to workspace. |
| **Revoke Access** | Button | `POST /documents/share/remove`| Removes recipient from file (Owner only). |

---

## 2. Administrative Interface (Admin Pages)

Access to these pages is restricted by role middleware (Superadmin, User Admin, System Admin).

### Superadmin Dashboard
The master command center (`Admin/Dashboard.jsx`).

| Feature | Type | Route | Notes |
| :--- | :--- | :--- | :--- |
| **Dashboard View** | Page | `/admin/dashboard` | Paginated overview of users and infra. |
| **User Stats** | Data | View State | Total users, active sessions, storage leaders. |
| **Infrastructure Health**| Data | View State | Cloud storage composition (B2) and DB integrity. |
| **Page Toggle** | Buttons | Local State | Floating controls to switch between Admin/Infra pages. |

### User Administration
Managed via `Admin/Users.jsx`.

| Feature | Type | Route | Notes |
| :--- | :--- | :--- | :--- |
| **User Management** | Link | `/admin/users` | Main list of all system accounts. |
| **Promote/Demote** | Button | `/admin/users/{id}/promote` | Superadmin only: Grants/Revokes admin roles. |
| **Toggle Status** | Button | `/admin/users/{id}/toggle` | Activates/Suspends user accounts. |
| **Update Quota** | Input | `/admin/users/{id}/quota` | Overrides individual storage limits. |
| **View Activities** | Modal | `/admin/users/{id}/activities`| Detailed audit trail for a specific user. |

### System Administration
Technical oversight for infrastructure (`Admin/Cloud.jsx`, `Admin/Database.jsx`, `Admin/Covers.jsx`).

| Feature | Type | Route | Notes |
| :--- | :--- | :--- | :--- |
| **Cloud Management** | NavLink | `/admin/cloud` | Backblaze B2 bucket monitoring and sync checks. |
| **Database Management**| NavLink | `/admin/database` | Schema integrity and "Zombie" document detection. |
| **Cover Management** | NavLink | `/admin/covers` | Steganographic library oversight. |
| **Scan Covers** | Action | `/admin/covers/scan` | Re-indexes cover file metadata. |
| **Audit Integrity** | Action | `/admin/covers/audit` | Checks for corruption in stego library. |
| **Cleanup Orphans** | Action | `/admin/covers/cleanup` | Removes unreferenced covers from storage. |

---

## 3. Account / Profile
Located in `Profile/Edit.jsx`.

| Feature | Type | Route | Notes |
| :--- | :--- | :--- | :--- |
| **Profile Settings** | Link | `/profile` | Manage account name, email, and password. |
| **Delete Account** | Action | `DELETE /profile` | Permanent user deletion (with confirmation). |
| **Log Out** | Button | `POST /logout` | Terminate session. |

---
*Report generated for technical verification of StegoLock Frontend V2.*

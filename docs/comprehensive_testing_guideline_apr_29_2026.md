# StegoLock Comprehensive Testing Guideline
Generated: April 29, 2026
Last Updated: May 03, 2026 (Verified UI-01, UI-02 as ✅ PASSED per `docs/test-results.md`)

## RBAC Implementation Analysis (May 03, 2026)
Based on code review of `app/Http/Middleware/RoleMiddleware.php`, `app/Models/User.php`, and `routes/web.php`:
1. **Role Definitions**: Properly defined (user, user_admin, db_storage_admin, superadmin) with helper methods in User model.
2. **RoleMiddleware**: Correctly validates user roles, redirects unauthenticated users, aborts 403 for unauthorized roles.
3. **Route Protection Gaps**:
   - `/admin/dashboard` (ADM-01) only requires `auth` + `verified`, not role checks. Standard users can access this route (violates ERR-05).
   - `/admin/users` (ADM-02 related) lacks role middleware; controller partially mitigates by filtering users for non-superadmins.
   - Sub-routes for cloud/database management and superadmin actions correctly use role middleware.
4. **Controller Checks**: Inconsistent role checks across admin controllers; some rely on controller logic instead of middleware.

This document provides an exhaustive suite of test scenarios to verify the functionality, security, and integrity of the StegoLock system across all user roles.

---

## 1. UI, Navigation & Global Elements
Focuses on the visual consistency and responsiveness of the application.

| ID | Feature | Role | Test Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| UI-01 | **Dark Mode Toggle** | All | Click the Sun/Moon icon in the sidebar. | Theme switches instantly; state persists after page refresh. | ✅ PASSED |
| UI-02 | **Sidebar Navigation** | All | Click through all links (My Docs, Starred, etc.). | Correct page loads; active link is highlighted in Cyan/Indigo. | ✅ PASSED |
| UI-03 | **Grid/List Toggle** | User | Toggle the view icon in the top-right of the file list. | Display switches between card-based grid and row-based list. | ✅ PASSED |
| UI-04 | **Search Bar** | User | Type a fragment of a filename into the search input. | File list filters in real-time to show only matching items. | ✅ PASSED |
| UI-05 | **Filters Menu** | User | Sort by "Size (Largest)" or "Date (Oldest)". | List re-orders correctly based on selected metadata. | ✅ PASSED |
| UI-06 | **Responsive Nav** | All | Resize browser to mobile width; open hamburger menu. | Navigation items appear correctly; UI remains usable. | Pending |

---

## 2. Standard User: Document Management
Focuses on the lifecycle of files and folders within the personal workspace.

| ID | Feature | Role | Test Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| DM-01 | **New Folder** | User | Click "New" -> "New Folder"; enter a name. | Folder appears in the grid; breadcrumbs update on entry. | Pending |
| DM-02 | **Rename Action** | User | File Menu -> Rename; provide new name. | Database updates; UI reflects new filename immediately. | Pending |
| DM-03 | **Move Action** | User | File Menu -> Move; select target folder. | File disappears from current folder and appears in target. | Pending |
| DM-04 | **Star/Favorite** | User | Click the Star icon on a card. | Star turns yellow; file appears in the "Starred" navigation view. | Pending |
| DM-05 | **File Info Modal** | User | Click "File Info" in the menu. | Shows file type, cloud size, and full activity audit trail. | Pending |
| DM-06 | **Delete File** | User | Click Delete -> Confirm in modal. | File is removed from DB, Cloud storage, and UI. | Pending |
| DM-07 | **Quota Tracking** | User | Upload a large file. | "Personal Space" bar in sidebar updates its percentage. | Pending |

---

## 3. Core Security: The Stegano Pipeline
Focuses on the high-security "Locking" and "Unlocking" engines.

| ID | Feature | Role | Test Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| SEC-01| **Locking (Upload)** | User | Click "New" -> "Lock a File"; select a document. | Card shows "Locking" shimmer; status cycles to "Stored". | Pending |
| SEC-02| **Unlocking (Recon)** | User | File Menu -> "Unlock File". | Card shows "Puzzle" animation; background reassembly starts. | Pending |
| SEC-03| **Download Ready** | User | Wait for unlock completion. | `DownloadReadyModal` pops up automatically. | Pending |
| SEC-04| **Integrity Check** | User | Unlock and download a sensitive PDF. | File opens correctly; hash matches the original (no corruption). | Pending |
| SEC-05| **Multiple Shards** | User | Upload a 5MB+ file. | System correctly splits file across >3 covers (verify via Info). | Pending |
| SEC-06| **Process Mutex** | User | Attempt to unlock a file while another is locking. | System handles concurrent background jobs without collision. | Pending |

---

## 4. Collaboration & Sharing
Focuses on secure access control between users.

| ID | Feature | Role | Test Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| COL-01| **Generate Share** | User | File Menu -> "Share"; enter recipient email. | Share record created; recipient receives notification. | Pending |
| COL-02| **Accept Share** | User | Navigate to "Shared With Me"; click Accept. | File appears in recipient's workspace with a "Shared" badge. | Pending |
| COL-03| **Revoke Access** | Owner| Shared Page -> "Manage Access" -> Remove User. | Recipient immediately loses access; file disappears from their UI. | Pending |
| COL-04| **Unlock Shared** | Recipient| Unlock a file shared by another user. | Retrieval and extraction work using the owner's stego-maps. | Pending |

---

## 5. Administrative & Infrastructure
Focuses on the Superadmin and System Admin oversight capabilities.

| ID | Feature | Role | Test Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ADM-01| **Admin Dashboard**| Admin | Navigate to `/admin/dashboard`. | Shows 3-column infrastructure grid with live system metrics. | Pending |
| ADM-02| **User Promotion** | Super | User List -> Promote to "User Admin". | Target user gains access to administrative navigation links. | Pending |
| ADM-03| **Quota Override** | Admin | Edit user quota to 500MB. | User's storage progress bar reflects the new limit instantly. | Pending |
| ADM-04| **Zombie Detection**| Admin | Navigate to "Database Management". | System scans Cloud vs DB and flags unmapped storage files. | Pending |
| ADM-05| **Cover Audit** | Admin | Click "Audit Integrity" in Cover Management. | System verifies all stego-carriers are still present in B2. | Pending |
| ADM-06| **Pool Expansion** | Admin | Use "Scan Covers" to add new images. | Total available stego-capacity increases in the metrics view. | Pending |

---

## 6. Edge Cases & Error Handling
Focuses on system robustness under failure conditions.

| ID | Feature | Role | Test Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| ERR-01| **Upload Interrupt**| User | Close browser tab during the "Locking" process. | Background Job continues on server; status is "Stored" on return. | Pending |
| ERR-02| **Invalid File** | User | Attempt to upload a 0-byte or corrupted file. | System rejects upload with a clear validation error message. | Pending |
| ERR-03| **Pool Exhaustion**| User | Attempt to lock a file when cover pool is empty. | System sends Admin notification; user sees "Insufficient Capacity". | Pending |
| ERR-04| **B2 Timeout** | User | Simulate network failure during B2 retrieval. | Unlock job fails gracefully; status updates to "Failed" with error. | Pending |
| ERR-05| **Unauthorized** | User | Manually type `/admin/dashboard` as a standard user. | System redirects to Home or shows 403 Unauthorized. | ❌ FAILED (Route accessible to standard users) |

---
*Testing Guideline - StegoLock Comprehensive Verification Suite - V2.0*

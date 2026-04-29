# StegoLock Comprehensive Testing Guideline
Generated: April 29, 2026

This document provides an exhaustive suite of test scenarios to verify the functionality, security, and integrity of the StegoLock system across all user roles.

---

## 1. UI, Navigation & Global Elements
Focuses on the visual consistency and responsiveness of the application.

| ID | Feature | Role | Test Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| UI-01 | **Dark Mode Toggle** | All | Click the Sun/Moon icon in the sidebar. | Theme switches instantly; state persists after page refresh. |
| UI-02 | **Sidebar Navigation** | All | Click through all links (My Docs, Starred, etc.). | Correct page loads; active link is highlighted in Cyan/Indigo. |
| UI-03 | **Grid/List Toggle** | User | Toggle the view icon in the top-right of the file list. | Display switches between card-based grid and row-based list. |
| UI-04 | **Search Bar** | User | Type a fragment of a filename into the search input. | File list filters in real-time to show only matching items. |
| UI-05 | **Filters Menu** | User | Sort by "Size (Largest)" or "Date (Oldest)". | List re-orders correctly based on selected metadata. |
| UI-06 | **Responsive Nav** | All | Resize browser to mobile width; open hamburger menu. | Navigation items appear correctly; UI remains usable. |

---

## 2. Standard User: Document Management
Focuses on the lifecycle of files and folders within the personal workspace.

| ID | Feature | Role | Test Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| DM-01 | **New Folder** | User | Click "New" -> "New Folder"; enter a name. | Folder appears in the grid; breadcrumbs update on entry. |
| DM-02 | **Rename Action** | User | File Menu -> Rename; provide new name. | Database updates; UI reflects new filename immediately. |
| DM-03 | **Move Action** | User | File Menu -> Move; select target folder. | File disappears from current folder and appears in target. |
| DM-04 | **Star/Favorite** | User | Click the Star icon on a card. | Star turns yellow; file appears in the "Starred" navigation view. |
| DM-05 | **File Info Modal** | User | Click "File Info" in the menu. | Shows file type, cloud size, and full activity audit trail. |
| DM-06 | **Delete File** | User | Click Delete -> Confirm in modal. | File is removed from DB, Cloud storage, and UI. |
| DM-07 | **Quota Tracking** | User | Upload a large file. | "Personal Space" bar in sidebar updates its percentage. |

---

## 3. Core Security: The Stegano Pipeline
Focuses on the high-security "Locking" and "Unlocking" engines.

| ID | Feature | Role | Test Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| SEC-01| **Locking (Upload)** | User | Click "New" -> "Lock a File"; select a document. | Card shows "Locking" shimmer; status cycles to "Stored". |
| SEC-02| **Unlocking (Recon)** | User | File Menu -> "Unlock File". | Card shows "Puzzle" animation; background reassembly starts. |
| SEC-03| **Download Ready** | User | Wait for unlock completion. | `DownloadReadyModal` pops up automatically. |
| SEC-04| **Integrity Check** | User | Unlock and download a sensitive PDF. | File opens correctly; hash matches the original (no corruption). |
| SEC-05| **Multiple Shards** | User | Upload a 5MB+ file. | System correctly splits file across >3 covers (verify via Info). |
| SEC-06| **Process Mutex** | User | Attempt to unlock a file while another is locking. | System handles concurrent background jobs without collision. |

---

## 4. Collaboration & Sharing
Focuses on secure access control between users.

| ID | Feature | Role | Test Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| COL-01| **Generate Share** | User | File Menu -> "Share"; enter recipient email. | Share record created; recipient receives notification. |
| COL-02| **Accept Share** | User | Navigate to "Shared With Me"; click Accept. | File appears in recipient's workspace with a "Shared" badge. |
| COL-03| **Revoke Access** | Owner| Shared Page -> "Manage Access" -> Remove User. | Recipient immediately loses access; file disappears from their UI. |
| COL-04| **Unlock Shared** | Recipient| Unlock a file shared by another user. | Retrieval and extraction work using the owner's stego-maps. |

---

## 5. Administrative & Infrastructure
Focuses on the Superadmin and System Admin oversight capabilities.

| ID | Feature | Role | Test Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| ADM-01| **Admin Dashboard**| Admin | Navigate to `/admin/dashboard`. | Shows 3-column infrastructure grid with live system metrics. |
| ADM-02| **User Promotion** | Super | User List -> Promote to "User Admin". | Target user gains access to administrative navigation links. |
| ADM-03| **Quota Override** | Admin | Edit user quota to 500MB. | User's storage progress bar reflects the new limit instantly. |
| ADM-04| **Zombie Detection**| Admin | Navigate to "Database Management". | System scans Cloud vs DB and flags unmapped storage files. |
| ADM-05| **Cover Audit** | Admin | Click "Audit Integrity" in Cover Management. | System verifies all stego-carriers are still present in B2. |
| ADM-06| **Pool Expansion** | Admin | Use "Scan Covers" to add new images. | Total available stego-capacity increases in the metrics view. |

---

## 6. Edge Cases & Error Handling
Focuses on system robustness under failure conditions.

| ID | Feature | Role | Test Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| ERR-01| **Upload Interrupt**| User | Close browser tab during the "Locking" process. | Background Job continues on server; status is "Stored" on return. |
| ERR-02| **Invalid File** | User | Attempt to upload a 0-byte or corrupted file. | System rejects upload with a clear validation error message. |
| ERR-03| **Pool Exhaustion**| User | Attempt to lock a file when cover pool is empty. | System sends Admin notification; user sees "Insufficient Capacity". |
| ERR-04| **B2 Timeout** | User | Simulate network failure during B2 retrieval. | Unlock job fails gracefully; status updates to "Failed" with error. |
| ERR-05| **Unauthorized** | User | Manually type `/admin/dashboard` as a standard user. | System redirects to Home or shows 403 Unauthorized. |

---
*Testing Guideline - StegoLock Comprehensive Verification Suite - V2.0*

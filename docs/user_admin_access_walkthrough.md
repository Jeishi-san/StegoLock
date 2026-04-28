# StegoLock: Comprehensive User Admin Access & Management Guide

This document is the definitive guide for the **User Admin** role within the StegoLock platform, covering system capabilities, interface features, and security protocols.

---

## 1. Role Overview & Philosophy
The User Admin is responsible for the lifecycle and resource management of **Standard Users**. 

*   **Need-to-Know Privacy**: Administrators can support users without accessing their private encrypted data.
*   **Zero-Knowledge**: Administrative powers are limited to the **account container**. The **encrypted data** inside remains private and inaccessible to the admin.
*   **Administrative Blindness**: User Admins cannot view, edit, or manage other administrators (Superadmins or System Admins).

---

## 2. Dashboard: The Command Center
The Dashboard provides a real-time, single-screen overview of the platform's health and user activity.

### **Real-Time Metrics (Stat Cards)**
*   **Total Users**: Global count of standard user accounts.
*   **Suspended Accounts**: Quick tally of restricted users.
*   **Quota Alerts**: Count of users exceeding 90% of their storage limit.
*   **Total Data Managed**: A smart tile showing total bytes secured, including a visual **Capacity Progress Bar**.

### **Recent User Activities (Live Audit Feed)**
*   A full-width, real-time feed of system events (Logins, Uploads, Status changes).
*   **Internal Scrolling**: The list utilizes an independent scroll area, keeping the dashboard view perfectly locked and clean.

### **Top Storage Consumers**
*   Lists the top 5 users by storage consumption.
*   **Critical Alerts**: Progress bars turn **RED** automatically for users exceeding 90% usage.

---

## 3. User Management Console
The Management Console provides deep-dive tools for account auditing and resource allocation.

### **Audit Trail (Timeline History)**
*   **Row-Click Interaction**: Clicking anywhere on a user's row triggers the Audit Trail.
*   **Activity Modal**: Displays a vertical timeline of every logged action for that specific user.

### **Key Administrative Actions**
*   **Advanced Search & Filtering**: Find users by name/email or filter by status and storage health.
*   **Account Lifecycle**: Create new users, Suspend/Activate access, or Delete accounts.
*   **Resource Management**: Dynamically update storage quotas in GB; changes take effect immediately.
*   **Self-Modification Lock**: Admins cannot suspend or delete their own accounts.

---

## 4. Interface Navigation
*   **System Control Section**: Found at the top of the sidebar, accented with Indigo/Violet themes.
*   **Personal vs. Admin Space**: Use "My Documents" for personal files and the "Manage Personal Space" link at the bottom of the sidebar to monitor your own quota.
*   **Optimized Layout**: The admin interface is designed to fill the viewport symmetrically without page-level scrollbars.

---

## 5. Summary of Actions & Capabilities

| Action | Capability |
| :--- | :--- |
| **Search/Sort Users** | Full Access |
| **Create Standard User** | Yes |
| **Audit User History** | Yes (Timeline Modal) |
| **Manage Storage Quota** | Yes |
| **Suspend/Activate User** | Yes |
| **Delete Standard User** | Yes |
| **View User Files** | **NO** (Zero-Knowledge) |
| **Manage Other Admins** | **NO** (Blindness Protocol) |

---
*Last Updated: April 28, 2026*

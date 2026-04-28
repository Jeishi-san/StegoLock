# Implementation Plan - Superadmin (Master Oversight) Suite

This document outlines the finalization of the **Superadmin** role, serving as the master authority in Stegolock with oversight over both User and System (Infrastructure) domains.

## 1. Unified User Management
Instead of a separate page, we will enhance the existing **User Management** page to support advanced administrative oversight.

- **Naming Convention**: The "Users" navigation link will be renamed to **"User Management"** for uniformity.
- **Unified Interface**: A single page for all account management.
- **Advanced Filtering**: 
    - Quick toggles for **Standard Users** vs. **Administrative Fleet**.
    - Role-based filtering (Superadmin, User Admin, Storage Admin).
- **Administrative Actions**: Superadmins can promote/demote users to administrative roles directly from the user list.

## 2. Paginated "Master" Dashboard
To maintain a non-scrolling, high-fidelity experience while displaying comprehensive data, the Superadmin dashboard will implement pagination.

- **Non-Scrolling Constraint**: The dashboard will remain perfectly sized to the viewport.
- **Pagination Logic**:
    - **Page 1: User Administration**: Displays User counts, Activity feeds, Top consumers, and Quota alerts.
    - **Page 2: Infrastructure Integrity**: Displays Cloud Composition (B2), Database Management (Zombie detection), and Stego Library Utility.
- **Navigation**: Elegant floating toggle controls in the bottom-right corner to switch between pages with smooth transitions.

## 3. Sidebar & Navigation
- **Combined Access**: The Superadmin sidebar includes all links for User Management, Cloud Management, Database Management, and Cover Management.
- **Sticky Architecture**: The Sidebar header and "New" button are now sticky (fixed at the top), while the navigation list is independently scrollable.
- **Fixed Utility**: The storage quota and management tools are pinned to the bottom of the sidebar.

## 4. Documentation
- Create `superadmin_access_walkthrough.md` to document the final capabilities.
- Ensure all admin roles are correctly seeded for testing.

---
*Created: April 28, 2026*

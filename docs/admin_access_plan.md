# Implementation Plan - Admin Access Roles

This plan outlines the steps to implement role-based access control (RBAC) in the Stegolock project, with three distinct admin levels as requested.

## Proposed Changes

### 1. Database Schema
#### [NEW] [2026_04_28_072720_add_role_to_users_table.php](file:///d:/laragon\www\stegolock\database\migrations\2026_04_28_072720_add_role_to_users_table.php)
- Add a `role` column to the `users` table.
- Default value will be `user`.
- Roles: `user`, `user_admin`, `db_storage_admin`, `superadmin`.

### 2. User Model
#### [MODIFY] [User.php](file:///d:/laragon\www\stegolock\app\Models\User.php)
- Define constants for the roles.
- Implement helper methods for role authorization.

### 3. Middleware
#### [NEW] [RoleMiddleware.php](file:///d:/laragon\www\stegolock\app\Http\Middleware\RoleMiddleware.php)
- A generic middleware to restrict access based on user roles.

### 4. Admin Controllers & Seeders
#### [NEW] [AdminUserSeeder.php](file:///d:/laragon\www\stegolock\database\seeders\AdminUserSeeder.php)
- Initialize standard administrative accounts with correct encryption logic.

#### [NEW] Admin Controllers
- `UserManagementController`, `SystemManagementController`, `AdminManagementController`, and `DashboardController` in `app/Http/Controllers/Admin`.

### 5. Frontend Implementation (JSX)
#### [NEW] Layouts & Components
- `AdminLayout`, `AdminSidebar`, `AdminTopbar`.
- `AdminDashboard` and `CreateUserModal` components.

#### [NEW] Pages
- `Dashboard`, `Users`, and `SystemMonitoring` pages.

### 6. Routes
#### [MODIFY] [web.php](file:///d:/laragon\www\stegolock\routes\web.php)
- Add an `admin` route group with sub-groups for each role type.

## Verification Plan

### Automated Tests & Seeders
- Run `php artisan db:seed --class=AdminUserSeeder` to verify account creation.
- Test that each seeded admin account is redirected to the correct dashboard.

### Manual Verification
- Login with `superadmin@stegolock.com` and verify full access.
- Login with `user.admin@stegolock.com` and verify User Management access.
- Login with `system.admin@stegolock.com` and verify System Monitoring access.

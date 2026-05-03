<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    public function index(Request $request)
    {
        $query = User::select('id', 'name', 'email', 'role', 'is_active', 'storage_used', 'storage_limit', 'created_at');

        // Security: If not superadmin, only show standard users
        if (!$request->user()->isSuperadmin()) {
            $query->where('role', User::ROLE_USER);
        }

        $users = $query->orderBy('created_at', 'desc')->get();

        return Inertia::render('Admin/Users', [
            'users' => $users
        ]);
    }

    /**
     * Store a newly created user
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|in:user,user_admin,db_storage_admin,superadmin',
            'status' => 'required|in:active,inactive',
        ]);

        // Only superadmins can create admin roles
        if (!$request->user()->isSuperadmin()) {
            if ($request->role !== User::ROLE_USER) {
                abort(403, 'User Admins can only create standard users.');
            }
        }

        // Prevent non-superadmins from creating superadmin accounts
        if ($request->role === User::ROLE_SUPERADMIN && !$request->user()->isSuperadmin()) {
            abort(403, 'Only Superadmins can create Superadmin accounts.');
        }

        // Generate encryption fields (same process as RegisteredUserController)
        $auth_salt = random_bytes(16);
        $password_derivedKey = hash_pbkdf2(
            'sha256',
            $request->password,
            $auth_salt,
            100000,
            32,
            true
        );

        $master_key = random_bytes(32);
        
        $ek_salt = random_bytes(16);
        $encryption_key = hash_pbkdf2(
            'sha256',
            $password_derivedKey,
            $ek_salt,
            100000,
            32,
            true
        );

        $nonce = random_bytes(12);
        $tag = '';
        $master_key_enc = openssl_encrypt(
            $master_key,
            'aes-256-gcm',
            $encryption_key,
            OPENSSL_RAW_DATA,
            $nonce,
            $tag
        );

        // Create user manually to bypass $guarded constraints
        $user = new User();
        $user->name = $request->name;
        $user->email = $request->email;
        $user->password_hash = base64_encode($password_derivedKey);
        $user->auth_salt = base64_encode($auth_salt);
        $user->ek_salt = base64_encode($ek_salt);
        $user->master_key_enc = base64_encode($master_key_enc);
        $user->nonce = base64_encode($nonce);
        $user->tag = base64_encode($tag);
        $user->role = $request->role;
        $user->storage_limit = 1073741824; // 1GB default
        $user->is_active = $request->status === 'active';
        $user->save();

        return back()->with('success', 'User created successfully.');
    }

    public function toggleStatus(User $user)
    {
        // Prevent disabling yourself or higher admins
        if (!auth()->user()->isSuperadmin() && $user->role !== User::ROLE_USER) {
            abort(403, 'You cannot modify this account.');
        }

        if ($user->id === auth()->id()) {
            abort(403, 'You cannot disable your own account.');
        }

        $user->update(['is_active' => !$user->is_active]);

        return back()->with('success', 'User status updated successfully.');
    }

    public function updateQuota(Request $request, User $user)
    {
        $request->validate([
            'storage_limit' => 'required|integer|min:1048576' // Min 1MB
        ]);

        if (!auth()->user()->isSuperadmin() && $user->role !== User::ROLE_USER) {
            abort(403, 'You do not have permission to manage this account quota.');
        }

        $user->update(['storage_limit' => $request->storage_limit]);

        return back()->with('success', 'User storage quota updated successfully.');
    }

    public function updateRole(Request $request, User $user)
    {
        $request->validate([
            'role' => 'required|in:user,user_admin,db_storage_admin,superadmin'
        ]);

        // Only superadmin can set or modify admin roles
        if (!auth()->user()->isSuperadmin()) {
            if ($user->role !== User::ROLE_USER || $request->role !== User::ROLE_USER) {
                abort(403, 'User Admins can only manage standard users.');
            }
        }

        if ($request->role === User::ROLE_SUPERADMIN && !auth()->user()->isSuperadmin()) {
            abort(403, 'Only Superadmins can promote others to Superadmin.');
        }

        $user->update(['role' => $request->role]);

        return back()->with('success', "User role updated to {$request->role} successfully.");
    }

    public function deleteUser(User $user)
    {
        if (!auth()->user()->isSuperadmin() && $user->role !== User::ROLE_USER) {
            abort(403, 'You do not have permission to delete this account.');
        }

        if ($user->isSuperadmin()) {
            abort(403, 'Superadmins cannot be deleted.');
        }

        $user->delete();

        return back()->with('success', 'User deleted successfully.');
    }

    public function getUserActivities(User $user)
    {
        // Security check
        if (!auth()->user()->isSuperadmin() && $user->role !== User::ROLE_USER) {
            abort(403, 'Access denied.');
        }

        $activities = $user->activities()->orderBy('created_at', 'desc')->get();

        return response()->json([
            'user' => $user->only('id', 'name', 'email'),
            'activities' => $activities
        ]);
    }
}

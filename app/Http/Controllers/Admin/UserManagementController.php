<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UserManagementController extends Controller
{
    public function index()
    {
        $users = User::select('id', 'name', 'email', 'role', 'storage_used', 'storage_limit', 'created_at')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json($users);
    }

    public function updateRole(Request $request, User $user)
    {
        $request->validate([
            'role' => 'required|in:user,user_admin,db_storage_admin,superadmin'
        ]);

        // Only superadmin can set superadmin role
        if ($request->role === User::ROLE_SUPERADMIN && !$request->user()->isSuperadmin()) {
            abort(403, 'Only Superadmins can promote others to Superadmin.');
        }

        $user->update(['role' => $request->role]);

        return response()->json(['message' => "User role updated to {$request->role} successfully."]);
    }

    public function deleteUser(User $user)
    {
        if ($user->isSuperadmin()) {
            abort(403, 'Superadmins cannot be deleted.');
        }

        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }
}

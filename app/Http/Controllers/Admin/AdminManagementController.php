<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class AdminManagementController extends Controller
{
    public function index()
    {
        $admins = User::whereIn('role', [
            User::ROLE_USER_ADMIN,
            User::ROLE_DB_STORAGE_ADMIN,
            User::ROLE_SUPERADMIN
        ])->get(['id', 'name', 'email', 'role']);

        return response()->json($admins);
    }

    public function promote(Request $request, User $user)
    {
        $request->validate([
            'role' => 'required|in:user_admin,db_storage_admin,superadmin'
        ]);

        $user->update(['role' => $request->role]);

        return response()->json(['message' => "User {$user->name} promoted to {$request->role} successfully."]);
    }

    public function demote(User $user)
    {
        if ($user->id === auth()->id()) {
            abort(403, 'You cannot demote yourself.');
        }

        $user->update(['role' => User::ROLE_USER]);

        return response()->json(['message' => "User {$user->name} demoted to standard user successfully."]);
    }
}

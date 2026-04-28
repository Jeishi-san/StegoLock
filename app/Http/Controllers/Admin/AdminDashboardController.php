<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $stats = [];

        // For demonstration: If no logs exist, create some dummy ones
        if (\App\Models\ActivityLog::count() === 0) {
            $this->seedInitialLogs();
        }

        $activityQuery = \App\Models\ActivityLog::with('user:id,name,email,role')
            ->orderBy('created_at', 'desc')
            ->take(10);

        if ($user->isSuperadmin()) {
            // Superadmin sees everything
            $stats = [
                'total_users' => User::count(),
                'active_users' => User::where('is_active', true)->count(),
                'suspended_users' => User::where('is_active', false)->count(),
                'near_limit_users' => User::all()->filter(function($u) {
                    return $u->storage_limit > 0 && ($u->storage_used / $u->storage_limit) >= 0.9;
                })->count(),
                'admin_count' => User::where('role', '!=', User::ROLE_USER)->count(),
                'total_storage_used' => User::sum('storage_used'),
                'total_storage_limit' => User::sum('storage_limit'),
                'recent_activities' => $activityQuery->get(),
                'top_consumers' => User::where('role', User::ROLE_USER)
                    ->orderBy('storage_used', 'desc')
                    ->take(5)
                    ->get(['id', 'name', 'email', 'storage_used', 'storage_limit']),
            ];
        } else {
            // User Admin only sees activities of standard users
            $stats = [
                'total_users' => User::where('role', User::ROLE_USER)->count(),
                'active_users' => User::where('role', User::ROLE_USER)->where('is_active', true)->count(),
                'suspended_users' => User::where('role', User::ROLE_USER)->where('is_active', false)->count(),
                'near_limit_users' => User::where('role', User::ROLE_USER)->get()->filter(function($u) {
                    return $u->storage_limit > 0 && ($u->storage_used / $u->storage_limit) >= 0.9;
                })->count(),
                'total_storage_used' => User::where('role', User::ROLE_USER)->sum('storage_used'),
                'total_storage_limit' => User::where('role', User::ROLE_USER)->sum('storage_limit'),
                'recent_activities' => $activityQuery->whereHas('user', function($q) {
                    $q->where('role', User::ROLE_USER);
                })->get(),
                'top_consumers' => User::where('role', User::ROLE_USER)
                    ->orderBy('storage_used', 'desc')
                    ->take(5)
                    ->get(['id', 'name', 'email', 'storage_used', 'storage_limit']),
            ];
        }

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats
        ]);
    }

    private function seedInitialLogs()
    {
        $users = User::where('role', User::ROLE_USER)->take(3)->get();
        if ($users->count() > 0) {
            foreach ($users as $u) {
                \App\Models\ActivityLog::log($u->id, 'login', "User {$u->name} logged into the platform.");
                \App\Models\ActivityLog::log($u->id, 'upload', "User {$u->name} uploaded a new encrypted document.");
            }
        }
    }
}

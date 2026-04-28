<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $data = [];

        if ($user->isUserAdmin()) {
            $data['users'] = [
                'total_count' => User::count(),
                'recent_registrations' => User::orderBy('created_at', 'desc')->limit(5)->get(['id', 'name', 'email', 'created_at']),
            ];
        }

        if ($user->isDbStorageAdmin()) {
            $dbName = config('database.connections.mysql.database');
            $dbSize = DB::select("SELECT SUM(data_length + index_length) / 1024 / 1024 AS size FROM information_schema.TABLES WHERE table_schema = ?", [$dbName]);

            $data['system'] = [
                'db_size_mb' => round($dbSize[0]->size, 2),
                'total_storage_used' => User::sum('storage_used'),
                'total_storage_limit' => User::sum('storage_limit'),
            ];
        }

        if ($user->isSuperadmin()) {
            $data['admins'] = [
                'total_admins' => User::whereNot('role', User::ROLE_USER)->count(),
            ];
        }

        return response()->json([
            'message' => 'Welcome to the Admin Dashboard',
            'role' => $user->role,
            'dashboard_data' => $data
        ]);
    }
}

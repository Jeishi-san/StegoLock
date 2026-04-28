<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SystemManagementController extends Controller
{
    public function getStats()
    {
        $dbName = config('database.connections.mysql.database');
        
        $dbSize = DB::select("SELECT SUM(data_length + index_length) / 1024 / 1024 AS size FROM information_schema.TABLES WHERE table_schema = ?", [$dbName]);
        
        $totalStorageUsed = User::sum('storage_used');
        $totalStorageLimit = User::sum('storage_limit');
        
        return response()->json([
            'database' => [
                'name' => $dbName,
                'size_mb' => round($dbSize[0]->size, 2),
                'table_count' => count(DB::select('SHOW TABLES')),
            ],
            'cloud_storage' => [
                'total_used_bytes' => $totalStorageUsed,
                'total_limit_bytes' => $totalStorageLimit,
                'usage_percentage' => $totalStorageLimit > 0 ? round(($totalStorageUsed / $totalStorageLimit) * 100, 2) : 0,
            ]
        ]);
    }

    public function updateStorageLimit(Request $request, User $user)
    {
        $request->validate([
            'storage_limit' => 'required|integer|min:0'
        ]);

        $user->update(['storage_limit' => $request->storage_limit]);

        return response()->json(['message' => "Storage limit for {$user->name} updated to " . ($request->storage_limit / 1024 / 1024) . "MB successfully."]);
    }
}

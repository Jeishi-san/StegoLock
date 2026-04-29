<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Cover;
use App\Models\StegoFile;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $isSystemAdmin = $user->role === User::ROLE_DB_STORAGE_ADMIN || $user->role === User::ROLE_SUPERADMIN;
        $isUserAdmin = $user->role === User::ROLE_USER_ADMIN || $user->role === User::ROLE_SUPERADMIN;

        $stats = [
            'total_users' => User::count(),
            'total_storage_used' => (int) User::sum('storage_used'),
            'total_storage_limit' => (int) User::sum('storage_limit'),
        ];

        if ($isUserAdmin) {
            $stats['active_users'] = User::where('is_active', true)->count();
            $stats['suspended_users'] = User::where('is_active', false)->count();
            $stats['near_limit_users'] = User::get()->filter(function($u) {
                return $u->storage_limit > 0 && ($u->storage_used / $u->storage_limit) >= 0.9;
            })->count();
            
            $stats['top_consumers'] = User::where('role', User::ROLE_USER)
                ->orderBy('storage_used', 'desc')
                ->take(5)
                ->get(['id', 'name', 'email', 'storage_used', 'storage_limit']);
                
            $stats['recent_activities'] = ActivityLog::with('user:id,name,role')
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get();
        }

        if ($isSystemAdmin) {
            // Enhanced Infrastructure Data for 3-Column View
            $dbName = config('database.connections.mysql.database');
            
            // Pillar 1: Cloud Composition
            $coverSize = (int) Cover::sum('size_bytes');
            $stegoSize = (int) StegoFile::where('status', 'embedded')->sum('stego_size');
            
            // Pillar 2: Database & Integrity
            $zombieCount = DB::table('stego_files')
                ->join('stego_maps', 'stego_files.stego_map_id', '=', 'stego_maps.stego_map_id')
                ->where('stego_files.status', 'failed')
                ->distinct('stego_maps.document_id')
                ->count();
                
            $topTables = DB::select("
                SELECT table_name, (data_length + index_length) as size 
                FROM information_schema.TABLES 
                WHERE table_schema = ? 
                ORDER BY (data_length + index_length) DESC 
                LIMIT 3
            ", [$dbName]);

            // Pillar 3: Library Utility
            $totalCapacity = Cover::all()->sum(function($cover) {
                return $cover->metadata['capacity'] ?? 0;
            });
            $typeCounts = Cover::select('type', DB::raw('count(*) as count'))
                ->groupBy('type')
                ->get()
                ->pluck('count', 'type');

            $stats['infrastructure'] = [
                'composition' => [
                    'covers' => $coverSize,
                    'fragments' => $stegoSize,
                    'overhead' => max(0, $stats['total_storage_used'] - ($coverSize + $stegoSize))
                ],
                'integrity' => [
                    'zombies' => $zombieCount,
                    'top_tables' => $topTables,
                    'db_version' => DB::select("SELECT VERSION() as version")[0]->version,
                ],
                'library' => [
                    'total_covers' => Cover::count(),
                    'total_capacity' => $totalCapacity,
                    'types' => $typeCounts,
                    'b2_status' => 'connected'
                ]
            ];

            // Fetch unread critical alerts for infrastructure
            $stats['pool_alerts'] = $user->unreadNotifications()
                ->where('type', 'App\Notifications\AdminPoolAlert')
                ->take(5)
                ->get()
                ->map(fn($n) => [
                    'id' => $n->id,
                    'title' => $n->data['title'] ?? 'System Alert',
                    'message' => $n->data['message'] ?? '',
                    'type' => $n->data['type'] ?? 'info',
                    'action_url' => $n->data['action_url'] ?? null,
                    'created_at' => $n->created_at
                ]);
        }

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats
        ]);
    }
}

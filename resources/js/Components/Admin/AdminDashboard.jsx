import { Activity, AlertCircle, Database, Shield, UserCheck, Users, Lock } from 'lucide-react';
import { useState } from 'react';

export default function AdminDashboard() {
    // Hardcoded static data as requested
    const [data] = useState({
        stats: [
            { label: 'Total Users', value: '1,284', change: '+12%', trend: 'up', color: 'blue' },
            { label: 'Active Sessions', value: '42', change: '+5%', trend: 'up', color: 'green' },
            { label: 'Files Protected', value: '8,492', change: '+18%', trend: 'up', color: 'purple' },
            { label: 'System Alerts', value: '3', change: '-20%', trend: 'down', color: 'red' },
        ],
        systemHealth: [
            { label: 'Database Cluster', status: 'operational', value: '99.9%' },
            { label: 'Cloud Storage API', status: 'operational', value: '100%' },
            { label: 'Python Backend Service', status: 'operational', value: '99.7%' },
            { label: 'Encryption Engine', status: 'operational', value: '100%' },
        ],
        recentActivity: [
            { user: 'admin@stegolock.com', action: 'Updated encryption policy', time: '2 mins ago', status: 'success' },
            { user: 'user_123', action: 'Uploaded 50MB document', time: '15 mins ago', status: 'success' },
            { user: 'system', action: 'Daily database backup completed', time: '1 hour ago', status: 'success' },
            { user: 'unknown_ip', action: 'Failed login attempt', time: '2 hours ago', status: 'warning' },
        ]
    });

    const getIcon = (color) => {
        switch (color) {
            case 'blue': return Users;
            case 'green': return UserCheck;
            case 'purple': return Lock;
            case 'red': return AlertCircle;
            default: return Users;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white">Dashboard</h1>
                <p className="mt-2 text-slate-400">System overview and key metrics (Static View)</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {data.stats.map((stat) => {
                    const Icon = getIcon(stat.color);

                    return (
                        <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-slate-700">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm text-slate-400">{stat.label}</p>
                                    <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
                                    <div className="mt-2 flex items-center gap-2 text-sm">
                                        <span className={stat.trend === 'up' ? 'font-medium text-emerald-400' : 'font-medium text-rose-400'}>
                                            {stat.change}
                                        </span>
                                        <span className="text-slate-500">vs last month</span>
                                    </div>
                                </div>
                                <div className={`rounded-lg p-3 ${stat.color === 'blue' ? 'bg-blue-600/20 text-blue-400' : stat.color === 'green' ? 'bg-green-600/20 text-green-400' : stat.color === 'purple' ? 'bg-purple-600/20 text-purple-400' : 'bg-red-600/20 text-red-400'}`}>
                                    <Icon className="size-6" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                    <div className="mb-6 flex items-center gap-2">
                        <Activity className="size-5 text-slate-400" />
                        <h2 className="text-xl font-semibold text-white">System Health</h2>
                    </div>
                    <div className="space-y-4">
                        {data.systemHealth.map((item) => (
                            <div key={item.label} className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <span className={`size-2 rounded-full ${item.status === 'operational' ? 'bg-green-500' : item.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                    <span className="text-sm text-slate-300">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-white">{item.value}</span>
                                    <span className={`rounded-md px-2 py-1 text-xs font-medium ${item.status === 'operational' ? 'bg-green-600/20 text-green-400' : item.status === 'degraded' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-red-600/20 text-red-400'}`}>
                                        {item.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                    <div className="mb-6 flex items-center gap-2">
                        <Database className="size-5 text-slate-400" />
                        <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                    </div>
                    <div className="space-y-4">
                        {data.recentActivity.map((activity) => (
                            <div key={`${activity.user}-${activity.time}`} className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
                                <div className={`mt-1 size-3 rounded-full ${activity.status === 'success' ? 'bg-green-500' : activity.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-slate-300">{activity.action}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {activity.user} · {activity.time}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

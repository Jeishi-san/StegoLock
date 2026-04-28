import AdminLayout from '@/Layouts/Admin/AdminLayout';
import { Head, usePage } from '@inertiajs/react';
import { 
    Users, UserCheck, UserMinus, AlertCircle, 
    Database, Shield, HardDrive, TrendingUp,
    LayoutDashboard, Activity, UserPlus, Upload, Trash2
} from 'lucide-react';

export default function Dashboard({ stats }) {
    const { auth } = usePage().props;
    const isSuperadmin = auth.user.role === 'superadmin';

    const getActivityIcon = (action) => {
        switch (action) {
            case 'login': return UserCheck;
            case 'upload': return Upload;
            case 'create_user': return UserPlus;
            case 'quota_update': return HardDrive;
            case 'account_status': return Shield;
            case 'delete': return Trash2;
            default: return Activity;
        }
    };

    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const storagePercentage = stats.total_storage_limit > 0 
        ? (stats.total_storage_used / stats.total_storage_limit) * 100 
        : 0;

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <LayoutDashboard className="size-6 text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white transition-colors">
                            {isSuperadmin ? 'System Control Center' : 'Administrative Dashboard'}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase mt-0.5">
                            Real-time metrics & oversight
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Admin Dashboard" />

            <div className="space-y-6 h-[calc(100vh-180px)] flex flex-col overflow-hidden pb-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
                    {/* Total Users */}
                    <StatCard 
                        title="Total Users"
                        value={stats.total_users}
                        icon={Users}
                        subtitle={`${stats.active_users} Active accounts`}
                        color="indigo"
                    />

                    {/* Suspended Users */}
                    <StatCard 
                        title="Suspended"
                        value={stats.suspended_users}
                        icon={UserMinus}
                        subtitle="Restricted access"
                        color="red"
                        alert={stats.suspended_users > 0}
                    />

                    {/* Storage Alerts */}
                    <StatCard 
                        title="Quota Alerts"
                        value={stats.near_limit_users}
                        icon={AlertCircle}
                        subtitle="Users near storage limit"
                        color="amber"
                        alert={stats.near_limit_users > 0}
                    />

                    {/* Global Storage Data + Progress Bar */}
                    <div className="p-6 rounded-2xl bg-white dark:bg-cyber-surface/30 border border-slate-200 dark:border-cyber-border/50 backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-none transition-all hover:-translate-y-1">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Data Managed</p>
                                <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{formatBytes(stats.total_storage_used)}</h4>
                            </div>
                            <div className="p-3 rounded-xl text-violet-500 bg-violet-500/10 border border-violet-500/20">
                                <Database className="size-6" />
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                <span>{Math.round(storagePercentage)}% Capacity</span>
                                <span>Limit: {formatBytes(stats.total_storage_limit)}</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 dark:bg-cyber-void rounded-full overflow-hidden border border-slate-200 dark:border-cyber-border/30">
                                <div 
                                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 shadow-glow-indigo transition-all duration-1000"
                                    style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Split Row: Activities + Top Consumers */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
                    {/* LEFT Column: Recent User Activities (Larger) */}
                    <div className="lg:col-span-2 flex flex-col bg-white dark:bg-cyber-surface/30 rounded-2xl border border-slate-200 dark:border-cyber-border/50 backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-cyber-border/30 shrink-0 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="size-5 text-indigo-500" />
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent User Activities</h3>
                            </div>
                            <button 
                                onClick={() => window.location.href = route('admin.users.index')}
                                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95"
                            >
                                <Users className="size-4" /> Manage Accounts
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                            {stats.recent_activities && stats.recent_activities.length > 0 ? (
                                stats.recent_activities.map((activity) => {
                                    const Icon = getActivityIcon(activity.action);
                                    return (
                                        <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50/50 dark:bg-cyber-void/30 border border-slate-100 dark:border-cyber-border/30 hover:border-indigo-500/20 hover:bg-white dark:hover:bg-cyber-surface/50 transition-all group">
                                            <div className="mt-0.5 size-9 rounded-xl bg-white dark:bg-cyber-surface border border-slate-200 dark:border-cyber-border/50 flex items-center justify-center text-indigo-500 shadow-sm transition-transform group-hover:scale-110">
                                                <Icon className="size-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-4 mb-1">
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                                        {activity.description}
                                                    </p>
                                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 whitespace-nowrap">
                                                        <Activity className="size-3" />
                                                        {new Date(activity.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-black text-indigo-500/60 uppercase tracking-widest">
                                                    {activity.action.replace('_', ' ')}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-20">
                                    <Activity className="size-12 text-slate-200 dark:text-cyber-border/30 mx-auto mb-4" />
                                    <p className="text-sm text-slate-500 font-medium italic tracking-wide">No system activities recorded</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT Column: Top Consumers */}
                    <div className="flex flex-col bg-white dark:bg-cyber-surface/30 rounded-2xl border border-slate-200 dark:border-cyber-border/50 backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-cyber-border/30 shrink-0">
                            <div className="flex items-center gap-2">
                                <HardDrive className="size-5 text-indigo-500" />
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Top Consumers</h3>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-5">
                            {stats.top_consumers && stats.top_consumers.length > 0 ? (
                                stats.top_consumers.map((u, i) => {
                                    const usagePct = u.storage_limit > 0 ? (u.storage_used / u.storage_limit) * 100 : 0;
                                    return (
                                        <div key={u.id} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-[10px] font-black text-slate-400">0{i+1}</span>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{u.name}</p>
                                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{formatBytes(u.storage_used)} used</p>
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-black ${usagePct > 90 ? 'text-red-500' : 'text-indigo-500'}`}>
                                                    {Math.round(usagePct)}%
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 dark:bg-cyber-void rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full transition-all duration-1000 ${usagePct > 90 ? 'bg-red-500 shadow-glow-red' : 'bg-indigo-500 shadow-glow-indigo'}`}
                                                    style={{ width: `${Math.min(usagePct, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="text-center py-10 text-xs text-slate-500 italic">No user data available</p>
                            )}
                        </div>

                        <div className="p-6 border-t border-slate-100 dark:border-cyber-border/30 shrink-0 bg-slate-50/30 dark:bg-cyber-void/10">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                * Users exceeding 90% of their quota are highlighted in red.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function StatCard({ title, value, icon: Icon, subtitle, color, alert }) {
    const colors = {
        indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20 shadow-indigo-500/5',
        violet: 'text-violet-500 bg-violet-500/10 border-violet-500/20 shadow-violet-500/5',
        amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5',
        red: 'text-red-500 bg-red-500/10 border-red-500/20 shadow-red-500/5',
    };

    return (
        <div className={`p-6 rounded-2xl bg-white dark:bg-cyber-surface/30 border border-slate-200 dark:border-cyber-border/50 backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-none group transition-all hover:-translate-y-1 ${alert ? 'ring-1 ring-red-500/30' : ''}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                    <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h4>
                </div>
                <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 ${colors[color]}`}>
                    <Icon className="size-6" />
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-cyber-border/30">
                <p className={`text-xs font-bold ${alert ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                    {subtitle}
                </p>
            </div>
        </div>
    );
}

function StatusItem({ label, status }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-cyber-void/30 border border-slate-100 dark:border-cyber-border/30">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{label}</span>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Active</span>
                <div className="size-1.5 rounded-full bg-green-500 shadow-glow-green" />
            </div>
        </div>
    );
}


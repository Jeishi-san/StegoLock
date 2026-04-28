import AdminLayout from '@/Layouts/Admin/AdminLayout';
import { Head, usePage, Link } from '@inertiajs/react';
import { useState } from 'react';
import { 
    Users, UserCheck, UserMinus, AlertCircle, 
    Database, Shield, HardDrive, TrendingUp,
    LayoutDashboard, Activity, UserPlus, Upload, Trash2,
    ImagePlus, ShieldAlert, ShieldCheck, Cloud, Server,
    ArrowRight, PieChart, Layers, Zap, Info, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function Dashboard({ stats }) {
    const { auth } = usePage().props;
    const isSystemAdmin = auth.user.role === 'db_storage_admin' || auth.user.role === 'superadmin';
    const isUserAdmin = auth.user.role === 'user_admin' || auth.user.role === 'superadmin';
    const isSuperadmin = auth.user.role === 'superadmin';

    const [currentPage, setCurrentPage] = useState(1); // 1: User Oversight, 2: Infrastructure

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
            noScroll={true}
            header={
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <LayoutDashboard className="size-6 text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white transition-colors">
                            {isSuperadmin 
                                ? (currentPage === 1 ? 'Master Control: User Administration' : 'Master Control: System Oversight') 
                                : 'Administrative Dashboard'}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase mt-0.5">
                            {isSuperadmin ? `Dashboard Page ${currentPage} of 2` : 'Real-time metrics & oversight'}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Admin Dashboard" />

            <div 
                key={currentPage} 
                className="h-full flex flex-col space-y-6 relative overflow-hidden animate-in fade-in slide-in-from-right-12 duration-500"
            >
                {/* PAGINATION CONTROLS (Superadmin Only) */}
                {isSuperadmin && (
                    <div className="fixed bottom-10 right-10 flex items-center gap-4 z-50 animate-in fade-in slide-in-from-right-10 duration-700">
                        <div className="flex bg-white dark:bg-cyber-surface rounded-2xl border border-slate-200 dark:border-cyber-border shadow-2xl p-1.5 gap-1.5">
                            <button 
                                onClick={() => setCurrentPage(1)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                                    currentPage === 1 
                                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                            >
                                <UserPlus className="size-4" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Users</span>
                            </button>
                            <button 
                                onClick={() => setCurrentPage(2)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                                    currentPage === 2 
                                    ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' 
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                            >
                                <Cloud className="size-4" />
                                <span className="text-[10px] font-black uppercase tracking-wider">System</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* 3-COLUMN INFRASTRUCTURE INSIGHTS (System Admin Only or Page 2 for Superadmin) */}
                {isSystemAdmin && stats.infrastructure && (!isSuperadmin || currentPage === 2) && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                        {/* Pillar 1: Cloud Storage Intelligence */}
                        <div className="flex flex-col bg-slate-900 rounded-[2.5rem] text-white p-8 shadow-2xl relative overflow-hidden group border border-white/5">
                            <div className="absolute -top-12 -right-12 p-24 opacity-5 group-hover:rotate-12 transition-transform duration-1000">
                                <Cloud className="size-48" />
                            </div>
                            
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">Cloud Composition</h3>
                                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-glow-emerald" />
                                </div>
                                
                                <div className="space-y-6 flex-1">
                                    <div className="space-y-2">
                                        <div className="flex items-end justify-between">
                                            <p className="text-[10px] font-black text-slate-500 uppercase">Covers vs Fragments</p>
                                            <span className="text-xs font-bold text-cyan-400">{formatBytes(stats.infrastructure.composition.covers + stats.infrastructure.composition.fragments)}</span>
                                        </div>
                                        <div className="h-3 w-full flex rounded-full overflow-hidden bg-white/5 border border-white/10">
                                            <div 
                                                className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all duration-1000"
                                                style={{ width: `${(stats.infrastructure.composition.covers / (stats.infrastructure.composition.covers + stats.infrastructure.composition.fragments || 1)) * 100}%` }}
                                            />
                                            <div 
                                                className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000"
                                                style={{ width: `${(stats.infrastructure.composition.fragments / (stats.infrastructure.composition.covers + stats.infrastructure.composition.fragments || 1)) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Stego Covers</p>
                                            <p className="text-sm font-black">{formatBytes(stats.infrastructure.composition.covers)}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                            <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Fragments</p>
                                            <p className="text-sm font-black">{formatBytes(stats.infrastructure.composition.fragments)}</p>
                                        </div>
                                    </div>
                                </div>

                                <Link href={route('admin.cloud.index')} className="mt-8 flex items-center justify-between p-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-900 transition-all group/btn">
                                    <span className="text-xs font-black uppercase tracking-widest">Cloud Terminal</span>
                                    <ArrowRight className="size-4 group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>

                        {/* Pillar 2: Database Architecture & Integrity */}
                        <div className="flex flex-col bg-white dark:bg-cyber-surface/30 rounded-[2.5rem] p-8 border border-slate-200 dark:border-cyber-border/50 shadow-xl relative overflow-hidden group">
                            <div className="absolute -top-12 -right-12 p-24 opacity-5 dark:opacity-[0.03] group-hover:-rotate-12 transition-transform duration-1000">
                                <Server className="size-48" />
                            </div>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400">Database Management</h3>
                                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                                        stats.infrastructure.integrity.zombies === 0 
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                                        : 'bg-rose-500/10 border-rose-500/20 text-rose-500 animate-pulse'
                                    }`}>
                                        {stats.infrastructure.integrity.zombies === 0 ? <ShieldCheck className="size-3" /> : <ShieldAlert className="size-3" />}
                                        {stats.infrastructure.integrity.zombies === 0 ? 'Optimal' : `${stats.infrastructure.integrity.zombies} Zombies`}
                                    </div>
                                </div>

                                <div className="space-y-6 flex-1">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Top Data Weight Tables</p>
                                        <div className="space-y-2">
                                            {stats.infrastructure.integrity.top_tables.map(table => (
                                                <div key={table.table_name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-cyber-void/30 border border-slate-100 dark:border-cyber-border/30">
                                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[120px]">{table.table_name}</span>
                                                    <span className="text-[11px] font-black text-slate-900 dark:text-white">{formatBytes(table.size)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                                        <div className="p-2 rounded-lg bg-indigo-500 text-white">
                                            <Zap className="size-4" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase">Engine Version</p>
                                            <p className="text-xs font-black text-slate-900 dark:text-white">{stats.infrastructure.integrity.db_version}</p>
                                        </div>
                                    </div>
                                </div>

                                <Link href={route('admin.database.index')} className="mt-8 flex items-center justify-between p-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-all group/btn">
                                    <span className="text-xs font-black uppercase tracking-widest">Integrity Audit</span>
                                    <ArrowRight className="size-4 group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>

                        {/* Pillar 3: Stego Library Utility */}
                        <div className="flex flex-col bg-white dark:bg-cyber-surface/30 rounded-[2.5rem] p-8 border border-slate-200 dark:border-cyber-border/50 shadow-xl relative overflow-hidden group">
                            <div className="absolute -top-12 -right-12 p-24 opacity-5 dark:opacity-[0.03] group-hover:scale-110 transition-transform duration-1000">
                                <ImagePlus className="size-48" />
                            </div>

                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-purple-500 dark:text-purple-400">Library Utility</h3>
                                    <Zap className="size-4 text-amber-500 fill-amber-500" />
                                </div>

                                <div className="space-y-6 flex-1">
                                    <div className="p-6 rounded-3xl bg-purple-500/5 border border-purple-500/10 flex flex-col items-center text-center">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Embedding Capacity</p>
                                        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{formatBytes(stats.infrastructure.library.total_capacity)}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Library Distribution</p>
                                        <div className="flex items-center gap-2">
                                            {Object.entries(stats.infrastructure.library.types).map(([type, count]) => (
                                                <div key={type} className="flex-1 p-2 rounded-xl bg-slate-50 dark:bg-cyber-void/30 border border-slate-100 dark:border-cyber-border/30 text-center">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5">{type}</p>
                                                    <p className="text-xs font-black text-purple-500">{count}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <Link href={route('admin.covers.index')} className="mt-8 flex items-center justify-between p-4 rounded-2xl border-2 border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white transition-all group/btn">
                                    <span className="text-xs font-black uppercase tracking-widest">Cover Management</span>
                                    <ArrowRight className="size-4 group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Grid (Global Totals) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
                    <StatCard 
                        title="Total Users"
                        value={stats.total_users}
                        icon={Users}
                        subtitle={isUserAdmin ? `${stats.active_users} Active accounts` : 'Managed registered users'}
                        color="indigo"
                    />

                    {isUserAdmin && (!isSuperadmin || currentPage === 1) && (
                        <>
                            <StatCard 
                                title="Suspended"
                                value={stats.suspended_users}
                                icon={UserMinus}
                                subtitle="Restricted access"
                                color="red"
                                alert={stats.suspended_users > 0}
                            />
                            <StatCard 
                                title="Quota Alerts"
                                value={stats.near_limit_users}
                                icon={AlertCircle}
                                subtitle="Users near storage limit"
                                color="amber"
                                alert={stats.near_limit_users > 0}
                            />
                        </>
                    )}

                    <div className={`p-6 rounded-2xl bg-white dark:bg-cyber-surface/30 border border-slate-200 dark:border-cyber-border/50 backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-none transition-all hover:-translate-y-1 ${isSystemAdmin ? 'lg:col-span-1' : 'lg:col-span-1'}`}>
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

                {/* Split Row: Activities + Top Consumers (For User Admins or Page 1 for Superadmin) */}
                {isUserAdmin && stats.recent_activities && (!isSuperadmin || currentPage === 1) && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                        <div className="lg:col-span-2 flex flex-col bg-white dark:bg-cyber-surface/30 rounded-2xl border border-slate-200 dark:border-cyber-border/50 backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-cyber-border/30 shrink-0 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="size-5 text-indigo-500" />
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent User Activities</h3>
                                </div>
                                <Link 
                                    href={route('admin.users.index')}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95"
                                >
                                    <Users className="size-4" /> Manage Accounts
                                </Link>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                                {stats.recent_activities.length > 0 ? (
                                    stats.recent_activities.map((activity) => (
                                        <div key={activity.id} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50/50 dark:bg-cyber-void/30 border border-slate-100 dark:border-cyber-border/30 hover:border-indigo-500/20 hover:bg-white dark:hover:bg-cyber-surface/50 transition-all group">
                                            <div className="mt-0.5 size-9 rounded-xl bg-white dark:bg-cyber-surface border border-slate-200 dark:border-cyber-border/50 flex items-center justify-center text-indigo-500 shadow-sm transition-transform group-hover:scale-110">
                                                <Activity className="size-5" />
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
                                    ))
                                ) : (
                                    <div className="text-center py-20">
                                        <Activity className="size-12 text-slate-200 dark:text-cyber-border/30 mx-auto mb-4" />
                                        <p className="text-sm text-slate-500 font-medium italic tracking-wide">No system activities recorded</p>
                                    </div>
                                )}
                            </div>
                        </div>

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
                        </div>
                    </div>
                )}
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

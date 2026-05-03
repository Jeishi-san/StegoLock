import AdminLayout from '@/Layouts/Admin/AdminLayout';
import { Head } from '@inertiajs/react';
import { 
    Cloud, 
    HardDrive, 
    Users, 
    AlertCircle, 
    Search, 
    Settings,
    ChevronRight,
    ArrowUpRight,
    User,
    PieChart,
    Activity,
    Server,
    Shield,
    ImagePlus
} from 'lucide-react';
import { useState } from 'react';

export default function CloudPage({ stats, users }) {
    const [searchQuery, setSearchQuery] = useState('');
    const { router } = usePage().props;

    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const handleUpdateQuota = (user) => {
        const currentGb = user.storage_limit / (1024 * 1024 * 1024);
        const newLimitGb = prompt(`Update storage quota for ${user.name} (in GB):`, currentGb.toFixed(2));
        
        if (newLimitGb && !isNaN(newLimitGb) && parseFloat(newLimitGb) > 0) {
            const bytes = parseFloat(newLimitGb) * 1024 * 1024 * 1024;
            router.patch(route('admin.users.update-quota', user.id), {
                storage_limit: Math.floor(bytes)
            }, {
                onSuccess: () => {
                    // Optional: show success notification
                }
            });
        }
    };

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalCalculated = stats.breakdown.covers_bytes + stats.breakdown.fragments_bytes + stats.breakdown.other_bytes;
    const getPct = (val) => totalCalculated > 0 ? (val / totalCalculated) * 100 : 0;

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                            <Cloud className="size-6 text-cyan-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                Cloud Infrastructure
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase mt-0.5">
                                Storage composition & B2 service health
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">B2 API: Operational</span>
                    </div>
                </div>
            }
        >
            <Head title="Cloud Management" />

            <div className="space-y-6">
                {/* Main Stats Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Storage Breakdown Card */}
                    <div className="lg:col-span-2 p-6 bg-white dark:bg-cyber-surface/30 rounded-2xl border border-slate-200 dark:border-cyber-border/50 backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-none">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <PieChart className="size-4 text-cyan-500" />
                                Storage Composition
                            </h3>
                            <span className="text-xs font-bold text-slate-500">Total: {formatBytes(totalCalculated)}</span>
                        </div>

                        <div className="space-y-6">
                            <div className="h-10 w-full flex rounded-xl overflow-hidden border border-slate-100 dark:border-cyber-border/20 shadow-inner">
                                <div 
                                    className="h-full bg-cyan-500 shadow-[inset_0_0_10px_rgba(255,255,255,0.3)] transition-all hover:opacity-90" 
                                    style={{ width: `${getPct(stats.breakdown.covers_bytes)}%` }}
                                    title="Covers"
                                />
                                <div 
                                    className="h-full bg-indigo-500 shadow-[inset_0_0_10px_rgba(255,255,255,0.3)] transition-all hover:opacity-90" 
                                    style={{ width: `${getPct(stats.breakdown.fragments_bytes)}%` }}
                                    title="Fragments"
                                />
                                <div 
                                    className="h-full bg-slate-300 dark:bg-cyber-void transition-all hover:opacity-90" 
                                    style={{ width: `${getPct(stats.breakdown.other_bytes)}%` }}
                                    title="Overhead"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <BreakdownItem 
                                    label="Stego Covers" 
                                    value={formatBytes(stats.breakdown.covers_bytes)} 
                                    pct={getPct(stats.breakdown.covers_bytes)}
                                    color="bg-cyan-500"
                                    icon={ImagePlus}
                                />
                                <BreakdownItem 
                                    label="User Fragments" 
                                    value={formatBytes(stats.breakdown.fragments_bytes)} 
                                    pct={getPct(stats.breakdown.fragments_bytes)}
                                    color="bg-indigo-500"
                                    icon={Shield}
                                />
                                <BreakdownItem 
                                    label="System Overhead" 
                                    value={formatBytes(stats.breakdown.other_bytes)} 
                                    pct={getPct(stats.breakdown.other_bytes)}
                                    color="bg-slate-400"
                                    icon={Activity}
                                />
                            </div>
                        </div>
                    </div>

                    {/* B2 Details Card */}
                    <div className="p-6 bg-slate-900 rounded-2xl text-white shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-150 transition-transform duration-700">
                            <Cloud className="size-32" />
                        </div>
                        
                        <div className="relative z-10 space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400">Backblaze B2 Service</h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Bucket Name</p>
                                    <p className="text-lg font-black tracking-tight font-mono">{stats.b2_bucket || 'stegolock-production'}</p>
                                </div>
                                <div className="h-px bg-white/10" />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Global Limit</p>
                                        <p className="text-sm font-bold">{formatBytes(stats.total_limit_bytes)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                                        <p className="text-sm font-bold text-emerald-400">Connected</p>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={() => window.open('https://secure.backblaze.com/b2_bucket_mgmt.htm?bucketId=' + stats.b2_bucket, '_blank')}
                                className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                                Open B2 Console <ArrowUpRight className="size-3" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* User Storage Table */}
                <div className="bg-white dark:bg-cyber-surface/30 rounded-2xl border border-slate-200 dark:border-cyber-border/50 backdrop-blur-sm overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none">
                    <div className="p-6 border-b border-slate-100 dark:border-cyber-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Users className="size-5 text-cyan-500" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">User Quota Management</h3>
                        </div>
                        
                        <div className="relative group max-w-sm w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-cyber-void/30 border border-slate-200 dark:border-cyber-border/50 rounded-xl text-sm focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-cyber-void/10 border-b border-slate-100 dark:border-cyber-border/30">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Identity</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Storage Consumption</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Limit</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Settings</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-cyber-border/10">
                                {filteredUsers.map(user => {
                                    const usagePct = user.storage_limit > 0 ? (user.storage_used / user.storage_limit) * 100 : 0;
                                    return (
                                        <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-cyber-surface/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-xl bg-slate-100 dark:bg-cyber-void border border-slate-200 dark:border-cyber-border/50 flex items-center justify-center text-slate-500 dark:text-slate-400">
                                                        <User className="size-5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{user.name}</p>
                                                        <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1.5 min-w-[150px]">
                                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                                        <span className="text-slate-500">{formatBytes(user.storage_used)}</span>
                                                        <span className={usagePct > 90 ? 'text-red-500' : 'text-cyan-500'}>
                                                            {Math.round(usagePct)}%
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-cyber-void rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full transition-all duration-1000 ${usagePct > 90 ? 'bg-red-500' : 'bg-cyan-500'}`}
                                                            style={{ width: `${Math.min(usagePct, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    {formatBytes(user.storage_limit)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => handleUpdateQuota(user)}
                                                    className="p-2 rounded-lg bg-slate-100 dark:bg-cyber-void border border-slate-200 dark:border-cyber-border/50 text-slate-500 hover:text-cyan-500 hover:border-cyan-500/50 transition-all"
                                                    title="Update storage quota"
                                                >
                                                    <Settings className="size-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function BreakdownItem({ label, value, pct, color, icon: Icon }) {
    return (
        <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-opacity-100 text-slate-900 dark:text-white`}>
                <Icon className="size-4" />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{value}</p>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5">{Math.round(pct)}% of Total</p>
            </div>
        </div>
    );
}

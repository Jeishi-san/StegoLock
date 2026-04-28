import AdminLayout from '@/Layouts/Admin/AdminLayout';
import { Head } from '@inertiajs/react';
import { 
    Server, 
    Database as DbIcon, 
    Table, 
    Activity, 
    Cpu, 
    HardDrive,
    Info,
    RefreshCw,
    ShieldAlert,
    ShieldCheck,
    Skull,
    FileWarning,
    User,
    Calendar
} from 'lucide-react';

export default function DatabasePage({ database, tables, integrity }) {
    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                            <Server className="size-6 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                Database Management
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase mt-0.5">
                                Referential integrity audit & schema diagnostics
                            </p>
                        </div>
                    </div>
                    
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                        integrity.is_healthy 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-600'
                    }`}>
                        {integrity.is_healthy ? <ShieldCheck className="size-4" /> : <ShieldAlert className="size-4 animate-pulse" />}
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            Status: {integrity.is_healthy ? 'Optimized' : 'Integrity Warning'}
                        </span>
                    </div>
                </div>
            }
        >
            <Head title="Database Integrity" />

            <div className="space-y-6">
                {/* Integrity Overview Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`p-6 rounded-2xl border backdrop-blur-sm shadow-xl transition-all ${
                        integrity.is_healthy 
                        ? 'bg-white dark:bg-cyber-surface/30 border-slate-200 dark:border-cyber-border/50' 
                        : 'bg-rose-500/5 border-rose-500/20 shadow-rose-500/5'
                    }`}>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fragment Health</p>
                            <Activity className={`size-5 ${integrity.is_healthy ? 'text-emerald-500' : 'text-rose-500'}`} />
                        </div>
                        <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                            {integrity.total_stego_files - integrity.orphaned_count}
                            <span className="text-sm font-bold text-slate-400 ml-2">/ {integrity.total_stego_files} Healthy Files</span>
                        </h4>
                        <div className="mt-4 h-2 w-full bg-slate-100 dark:bg-cyber-void rounded-full overflow-hidden">
                            <div 
                                className={`h-full transition-all duration-1000 ${integrity.is_healthy ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                style={{ width: `${((integrity.total_stego_files - integrity.orphaned_count) / integrity.total_stego_files) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className={`p-6 rounded-2xl border backdrop-blur-sm shadow-xl transition-all ${
                        integrity.orphaned_count === 0 
                        ? 'bg-white dark:bg-cyber-surface/30 border-slate-200 dark:border-cyber-border/50' 
                        : 'bg-amber-500/5 border-amber-500/20 shadow-amber-500/5'
                    }`}>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orphaned Records</p>
                            <FileWarning className={`size-5 ${integrity.orphaned_count === 0 ? 'text-slate-300' : 'text-amber-500'}`} />
                        </div>
                        <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                            {integrity.orphaned_count}
                            <span className="text-sm font-bold text-slate-400 ml-2">Dead references</span>
                        </h4>
                        <p className="mt-2 text-[10px] font-bold text-slate-500 italic">
                            * Records pointing to non-existent B2 files
                        </p>
                    </div>

                    <div className={`p-6 rounded-2xl border backdrop-blur-sm shadow-xl transition-all ${
                        integrity.zombie_documents.length === 0 
                        ? 'bg-white dark:bg-cyber-surface/30 border-slate-200 dark:border-cyber-border/50' 
                        : 'bg-rose-900/10 border-rose-500/40 shadow-rose-500/10'
                    }`}>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Zombie Documents</p>
                            <Skull className={`size-5 ${integrity.zombie_documents.length === 0 ? 'text-slate-300' : 'text-rose-500 animate-bounce'}`} />
                        </div>
                        <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                            {integrity.zombie_documents.length}
                            <span className="text-sm font-bold text-slate-400 ml-2">Unrecoverable</span>
                        </h4>
                        <p className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Missing critical fragments
                        </p>
                    </div>
                </div>

                {/* Zombie Document List (Conditional) */}
                {integrity.zombie_documents.length > 0 && (
                    <div className="p-6 bg-rose-500/5 border border-rose-500/20 rounded-2xl animate-in fade-in slide-in-from-bottom duration-700">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <Skull className="size-5 text-rose-500" />
                            Critical Integrity Issues: Unrecoverable Documents
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {integrity.zombie_documents.map(doc => (
                                <div key={doc.id} className="p-4 bg-white dark:bg-cyber-surface/50 border border-rose-200 dark:border-rose-500/20 rounded-xl shadow-sm">
                                    <p className="text-sm font-black text-slate-900 dark:text-white truncate mb-2">{doc.name}</p>
                                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                                        <span className="flex items-center gap-1"><User className="size-3" /> {doc.user.name}</span>
                                        <span className="flex items-center gap-1"><Calendar className="size-3" /> {new Date(doc.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Table Breakdown */}
                    <div className="lg:col-span-2 bg-white dark:bg-cyber-surface/30 rounded-2xl border border-slate-200 dark:border-cyber-border/50 backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-cyber-border/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Table className="size-5 text-orange-500" />
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Relational Architecture</h3>
                            </div>
                            <button 
                                onClick={() => window.location.reload()}
                                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-cyber-void transition-colors text-slate-500"
                            >
                                <RefreshCw className="size-4" />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-cyber-void/10 border-b border-slate-100 dark:border-cyber-border/30">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Table</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Engine</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Rows</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Size</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-cyber-border/10">
                                    {tables.map(table => (
                                        <tr key={table.name} className="hover:bg-slate-50/50 dark:hover:bg-cyber-surface/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-lg bg-slate-100 dark:bg-cyber-void border border-slate-200 dark:border-cyber-border/50 flex items-center justify-center text-slate-500">
                                                        <DbIcon className="size-4" />
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{table.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-cyber-void text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                                    {table.engine}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                    {table.rows.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-xs font-black text-orange-500">
                                                    {formatBytes(table.size_bytes)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* DB Info Card */}
                    <div className="space-y-6">
                        <div className="p-6 bg-slate-900 rounded-2xl text-white shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-150 transition-transform duration-700">
                                <Cpu className="size-32" />
                            </div>
                            
                            <div className="relative z-10 space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">Database Engine</h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">MySQL Instance</p>
                                        <p className="text-lg font-black tracking-tight font-mono">{database.version}</p>
                                    </div>
                                    <div className="h-px bg-white/10" />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Database Name</p>
                                            <p className="text-sm font-bold truncate max-w-[120px]">{database.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Weight</p>
                                            <p className="text-sm font-bold text-orange-400">{formatBytes(database.size_bytes)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white dark:bg-cyber-surface/30 rounded-2xl border border-slate-200 dark:border-cyber-border/50 backdrop-blur-sm">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white mb-4">Integrity Guidance</h4>
                            <div className="space-y-4">
                                <GuidelineItem text="Fragment redundancy: Each fragment must exist in B2 locked/ prefix." />
                                <GuidelineItem text="Decryption Safety: Zombie documents cannot be decrypted." />
                                <GuidelineItem text="Referential Audit: Automated check for dead cloud links." />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function GuidelineItem({ text }) {
    return (
        <div className="flex gap-2 text-xs text-slate-500">
            <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
            <span>{text}</span>
        </div>
    );
}

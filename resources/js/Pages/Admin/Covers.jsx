import AdminLayout from '@/Layouts/Admin/AdminLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { 
    ImagePlus, 
    Upload, 
    RefreshCw, 
    Shield, 
    FileAudio, 
    FileImage, 
    FileText,
    Cloud,
    CheckCircle2,
    XCircle,
    Loader2,
    Search,
    AlertCircle,
    Activity,
    Trash2,
    Database,
    Archive
} from 'lucide-react';
import { useState } from 'react';

export default function CoversPage({ covers, candidateCount, auditResults }) {
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [uploadType, setUploadType] = useState('image');
    const [isAuditing, setIsAuditing] = useState(false);

    const { data, setData, post, processing, reset } = useForm({
        files: [],
        type: 'image'
    });

    const handleUpload = (e) => {
        e.preventDefault();
        post(route('admin.covers.upload-candidate'), {
            onSuccess: () => reset(),
        });
    };

    const triggerScan = () => {
        router.post(route('admin.covers.scan'));
    };

    const runAudit = () => {
        setIsAuditing(true);
        router.post(route('admin.covers.audit'), {}, {
            onFinish: () => setIsAuditing(false)
        });
    };

    const cleanupOrphans = () => {
        if (!auditResults?.orphans?.length) return;
        const ids = auditResults.orphans.map(o => o.id);
        router.post(route('admin.covers.cleanup'), { ids });
    };

    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const filteredCovers = covers.filter(c => {
        const matchesType = filter === 'all' || c.type === filter;
        const matchesSearch = c.filename.toLowerCase().includes(search.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <AdminLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                            <ImagePlus className="size-6 text-purple-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                                Steganographic Cover Library
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase mt-0.5">
                                Automated scan, validation & integrity monitoring
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={runAudit}
                            disabled={isAuditing}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-cyber-surface/50 border border-slate-200 dark:border-cyber-border/50 text-slate-600 dark:text-slate-300 hover:border-purple-500 transition-all shadow-sm"
                        >
                            {isAuditing ? <Loader2 className="size-4 animate-spin" /> : <Activity className="size-4 text-purple-500" />}
                            Run Integrity Audit
                        </button>

                        <button 
                            onClick={triggerScan}
                            disabled={candidateCount === 0}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all ${
                                candidateCount > 0 
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/25 animate-pulse-subtle' 
                                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            }`}
                        >
                            <RefreshCw className={`size-4 ${candidateCount > 0 ? 'animate-spin-slow' : ''}`} />
                            Scan {candidateCount} Candidate(s)
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Cover Management" />

            <div className="space-y-6">
                {/* Integrity & Health Section */}
                {auditResults && (
                    <div className={`p-6 rounded-2xl border backdrop-blur-sm transition-all animate-in slide-in-from-top duration-500 ${
                        auditResults.is_healthy 
                        ? 'bg-emerald-500/5 border-emerald-500/20 shadow-lg shadow-emerald-500/5' 
                        : 'bg-amber-500/5 border-amber-500/20 shadow-lg shadow-amber-500/5'
                    }`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${auditResults.is_healthy ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                    {auditResults.is_healthy ? <CheckCircle2 className="size-6" /> : <AlertCircle className="size-6" />}
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                        Audit Report: {auditResults.is_healthy ? 'Sync Optimal' : 'Discrepancies Detected'}
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-cyber-void text-slate-500 uppercase tracking-tighter">
                                            Last Audit: {auditResults.last_audit}
                                        </span>
                                    </h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                        {auditResults.actual_cloud_size > 0 && (
                                            <span className="mr-2">Actual Cloud Usage: <b className="text-slate-900 dark:text-white">{formatBytes(auditResults.actual_cloud_size)}</b>.</span>
                                        )}
                                        {auditResults.untracked.length > 0 && (
                                            <span>Found {auditResults.untracked.length} files in B2 that are <b>not registered</b> in the database.</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {auditResults.orphans.length > 0 && (
                                <button 
                                    onClick={cleanupOrphans}
                                    className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-black shadow-lg shadow-rose-500/25 transition-all"
                                >
                                    <Trash2 className="size-4" />
                                    Cleanup {auditResults.orphans.length} Orphans
                                </button>
                            )}
                        </div>

                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <AuditStat label="Records in DB" value={auditResults.db_count} />
                            <AuditStat label="Files in Cloud" value={auditResults.cloud_count} color={auditResults.cloud_count !== auditResults.db_count ? 'amber' : 'slate'} />
                            <AuditStat label="Untracked Space" value={formatBytes(auditResults.actual_cloud_size - (covers.reduce((acc, c) => acc + c.size_bytes, 0)))} color={auditResults.untracked.length > 0 ? 'amber' : 'slate'} />
                            <AuditStat label="Missing in Cloud" value={auditResults.orphans.length} color={auditResults.orphans.length > 0 ? 'rose' : 'emerald'} />
                        </div>

                        {auditResults.untracked.length > 0 && (
                            <div className="mt-4 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                                <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <Archive className="size-3" />
                                    Untracked Discovery
                                </p>
                                <p className="text-xs text-slate-600 dark:text-amber-200/70 italic">
                                    These {auditResults.untracked.length} files were likely uploaded manually. They are consuming space but cannot be used for steganography until they are scanned and added to the database.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Upload Card */}
                    <div className="lg:col-span-2 p-6 bg-white dark:bg-cyber-surface/30 rounded-2xl border border-slate-200 dark:border-cyber-border/50 backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-none">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <Upload className="size-5 text-purple-500" />
                            Upload Cover Candidates
                        </h3>

                        <form onSubmit={handleUpload} className="space-y-6">
                            <div className="grid grid-cols-3 gap-4">
                                {['image', 'audio', 'text'].map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => { setUploadType(t); setData('type', t); }}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                            uploadType === t 
                                            ? 'border-purple-500 bg-purple-500/5 text-purple-600' 
                                            : 'border-slate-100 dark:border-cyber-border/30 text-slate-400 hover:border-slate-200'
                                        }`}
                                    >
                                        {t === 'image' && <FileImage className="size-6" />}
                                        {t === 'audio' && <FileAudio className="size-6" />}
                                        {t === 'text' && <FileText className="size-6" />}
                                        <span className="text-[10px] font-black uppercase tracking-widest">{t}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="relative group">
                                <input 
                                    type="file" 
                                    multiple 
                                    onChange={e => setData('files', e.target.files)}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                />
                                <div className="p-8 border-2 border-dashed border-slate-200 dark:border-cyber-border/50 rounded-2xl flex flex-col items-center justify-center gap-4 bg-slate-50/50 dark:bg-cyber-void/30 group-hover:border-purple-500 group-hover:bg-purple-500/5 transition-all">
                                    <div className="p-4 rounded-full bg-white dark:bg-cyber-surface border border-slate-200 dark:border-cyber-border/50 text-slate-400 group-hover:text-purple-500 group-hover:scale-110 transition-all">
                                        <Upload className="size-8" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {data.files.length > 0 ? `${data.files.length} files selected` : `Click or drag ${uploadType} files here`}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">Supported: PNG, WAV, TXT (Max 50MB)</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing || data.files.length === 0}
                                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                {processing ? <Loader2 className="size-5 animate-spin mx-auto" /> : 'Start Ingest Process'}
                            </button>
                        </form>
                    </div>

                    {/* Stats/Inbox Info */}
                    <div className="space-y-6">
                        <div className="p-6 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl text-white shadow-xl shadow-purple-500/30">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-4">Pending Ingest</h4>
                            <div className="flex items-center justify-between">
                                <span className="text-4xl font-black">{candidateCount}</span>
                                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
                                    <RefreshCw className="size-6" />
                                </div>
                            </div>
                            <p className="mt-4 text-xs font-medium opacity-80 leading-relaxed italic">
                                * These files are sitting in the local inbox. Run the scan to validate capacity and sync to Backblaze B2.
                            </p>
                        </div>

                        <div className="p-6 bg-white dark:bg-cyber-surface/30 rounded-2xl border border-slate-200 dark:border-cyber-border/50 backdrop-blur-sm">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white mb-4">System Guidance</h4>
                            <div className="space-y-3">
                                <GuidelineItem text="Fragment size should be max 15% of Image/Audio capacity." />
                                <GuidelineItem text="Text capacity uses a strict 2% safety rule." />
                                <GuidelineItem text="Standardized filenames are generated automatically." />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Library Gallery */}
                <div className="bg-white dark:bg-cyber-surface/30 rounded-2xl border border-slate-200 dark:border-cyber-border/50 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-cyber-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-6">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white whitespace-nowrap">Cloud Library</h3>
                            <div className="flex p-1 bg-slate-100 dark:bg-cyber-void rounded-xl border border-slate-200 dark:border-cyber-border/50">
                                {['all', 'image', 'audio', 'text'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setFilter(t)}
                                        className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                                            filter === t 
                                            ? 'bg-white dark:bg-cyber-surface text-purple-500 shadow-sm' 
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="relative group max-w-sm w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-purple-500" />
                            <input 
                                type="text" 
                                placeholder="Search filenames..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-cyber-void/30 border border-slate-200 dark:border-cyber-border/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20"
                            />
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredCovers.map(cover => (
                                <CoverCard key={cover.cover_id} cover={cover} formatBytes={formatBytes} />
                            ))}
                            {filteredCovers.length === 0 && (
                                <div className="col-span-full py-20 text-center text-slate-400 italic">
                                    No covers found matching your criteria
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

function AuditStat({ label, value, color = "slate" }) {
    const colorClasses = {
        slate: "bg-slate-100 dark:bg-cyber-void text-slate-600 dark:text-slate-300",
        emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
        rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
        amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    };

    return (
        <div className={`p-4 rounded-xl flex items-center justify-between ${colorClasses[color]}`}>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{label}</span>
            <span className="text-xl font-black">{value}</span>
        </div>
    );
}

function GuidelineItem({ text }) {
    return (
        <div className="flex gap-2 text-xs text-slate-500">
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
            <span>{text}</span>
        </div>
    );
}

function CoverCard({ cover, formatBytes }) {
    const Icon = cover.type === 'image' ? FileImage : cover.type === 'audio' ? FileAudio : FileText;
    const capacity = cover.metadata?.capacity || 0;

    return (
        <div className="group relative bg-slate-50/50 dark:bg-cyber-void/30 rounded-2xl border border-slate-200 dark:border-cyber-border/50 hover:border-purple-500/50 transition-all overflow-hidden flex flex-col">
            <div className="p-4 flex-1">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${
                        cover.type === 'image' ? 'bg-cyan-500/10 text-cyan-500' :
                        cover.type === 'audio' ? 'bg-orange-500/10 text-orange-500' :
                        'bg-blue-500/10 text-blue-500'
                    }`}>
                        <Icon className="size-5" />
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{cover.type}</span>
                        <div className="flex items-center gap-1 text-emerald-500 mt-1">
                            <Cloud className="size-3" />
                            <span className="text-[8px] font-black uppercase tracking-tighter">Synced</span>
                        </div>
                    </div>
                </div>

                <p className="text-xs font-bold text-slate-900 dark:text-white truncate mb-4" title={cover.filename}>
                    {cover.filename}
                </p>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-bold">EMBEDDING CAPACITY</span>
                        <span className="text-purple-500 font-black tracking-tight">{formatBytes(capacity)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 dark:bg-cyber-surface rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-purple-500 shadow-glow-purple"
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>
            </div>

            <div className="px-4 py-3 bg-slate-100/50 dark:bg-cyber-surface/50 border-t border-slate-200 dark:border-cyber-border/30 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500">File Size: {formatBytes(cover.size_bytes)}</span>
                <button className="text-slate-400 hover:text-purple-500 transition-colors">
                    <Shield className="size-4" />
                </button>
            </div>
        </div>
    );
}

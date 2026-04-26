import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { HardDrive, Trash2, FileText, Image, Film, Music, Archive, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { formatBytes, categorizeDocuments, formatDate } from '@/Utils/fileUtils';
import { useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';

export default function ManageStorage({ 
  documents, 
  totalStorage, 
  storageLimit 
}) {
  const [isDeleting, setIsDeleting] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const storagePercentage = (totalStorage / storageLimit) * 100;
  const categories = categorizeDocuments(documents);

  // Sort documents by size (largest first)
  const largestFiles = [...documents].sort((a, b) => 
    (b.in_cloud_size || b.original_size) - (a.in_cloud_size || a.original_size)
  ).slice(0, 15);

  const handleDelete = async (docId, filename) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${filename}"?`)) return;
    
    setIsDeleting(docId);
    try {
        await axios.delete(`/documents/${docId}`);
        toast.success(`${filename} deleted successfully`);
        router.reload();
    } catch (err) {
        toast.error('Failed to delete document');
    } finally {
        setIsDeleting(null);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.reload({
        onFinish: () => setIsRefreshing(false)
    });
  };


  const CategoryCard = ({ icon: Icon, data, label, color }) => {
    const colorVariants = {
        blue: 'from-cyber-accent/20 to-cyber-accent/5 text-cyber-accent border-cyber-accent/20 shadow-glow-cyan/10',
        purple: 'from-fuchsia-500/20 to-fuchsia-500/5 text-fuchsia-400 border-fuchsia-500/20 shadow-glow-fuchsia/10',
        pink: 'from-rose-500/20 to-rose-500/5 text-rose-400 border-rose-500/20',
        indigo: 'from-cyan-500/20 to-cyan-500/5 text-cyan-400 border-cyan-500/20',
        yellow: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20',
        gray: 'from-slate-500/20 to-slate-500/5 text-slate-400 border-slate-500/20'
    };

    return (
        <div className={`relative overflow-hidden glass-panel bg-gradient-to-br ${colorVariants[color]} p-6 rounded-3xl transition-all duration-300 hover:scale-[1.02] hover:border-cyber-accent/50 group bg-white dark:bg-transparent`}>
            <div className="flex items-start justify-between relative z-10">
                <div className="p-3 bg-slate-100/50 dark:bg-cyber-void/50 rounded-2xl border border-slate-200 dark:border-cyber-border/50 group-hover:border-cyber-accent/50 transition-colors">
                    <Icon className="size-6" />
                </div>
                <div className="text-right">
                    <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{formatBytes(data.size)}</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{data.count} units</p>
                </div>
            </div>
            <p className="mt-6 font-bold text-slate-600 dark:text-slate-300 relative z-10 tracking-tight">{label}</p>
            <div className="absolute -right-6 -bottom-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon className="size-32" />
            </div>
        </div>
    );
  };

  return (
    <AuthenticatedLayout
      totalStorage={totalStorage}
      storageLimit={storageLimit}
      header={
        <div className="flex items-center gap-4">
            <button 
                onClick={() => window.history.back()}
                className="p-2 bg-slate-100 dark:bg-cyber-surface hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-cyber-border transition-all text-slate-500 dark:text-slate-400 hover:text-cyber-accent"
            >
                <ArrowLeft className="size-5" />
            </button>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Vault Analytics</h2>
        </div>
      }
      headerActions={
        <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-cyber-surface border border-slate-200 dark:border-cyber-border rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-cyber-accent hover:border-cyber-accent transition-all shadow-lg dark:shadow-glow-cyan/10"
        >
            <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Sync Vault
        </button>
      }
    >
      <Head title="Storage Management" />

      <div className="h-full overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-6xl mx-auto space-y-12">
            {/* Overview Section */}
            <div className="glass-panel bg-gradient-to-br from-slate-100 to-white dark:from-cyber-void dark:to-slate-900 rounded-[2.5rem] p-10 text-slate-900 dark:text-white shadow-2xl relative overflow-hidden border-slate-200 dark:border-cyber-accent/30">
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="flex items-center gap-5 mb-8">
                            <div className="p-4 bg-cyber-accent/20 rounded-2xl border border-cyber-accent/30 shadow-glow-cyan">
                                <HardDrive className="size-10 text-cyber-accent" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">CORE-VAULT.X</h3>
                                <p className="text-cyber-accent-dark dark:text-cyber-accent font-black text-[10px] tracking-[0.3em] uppercase">Primary Storage Subsystem</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between font-bold text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
                                <span>Overall Capacity</span>
                                <span className="text-slate-900 dark:text-white">{formatBytes(totalStorage)} / {formatBytes(storageLimit)}</span>
                            </div>
                            <div className="w-full bg-cyber-surface/50 rounded-full h-5 border border-cyber-border overflow-hidden p-1 shadow-inner">
                                <div
                                    className="bg-cyber-accent h-full rounded-full transition-all duration-1000 shadow-glow-cyan"
                                    style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                <span>0%</span>
                                <span className="text-cyber-accent">{storagePercentage.toFixed(1)}% Saturation</span>
                                <span>100%</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center md:justify-end gap-6">
                        <div className="glass-panel bg-white/50 dark:bg-cyber-surface/30 rounded-[2rem] p-8 border border-slate-200 dark:border-cyber-border/50 text-center min-w-[170px] transform hover:scale-105 transition-all">
                            <p className="text-5xl font-black mb-1 text-slate-900 dark:text-white tabular-nums tracking-tighter">{storagePercentage.toFixed(1)}%</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Utilization</p>
                        </div>
                        <div className="glass-panel bg-white/50 dark:bg-cyber-surface/30 rounded-[2rem] p-8 border border-slate-200 dark:border-cyber-border/50 text-center min-w-[170px] transform hover:scale-105 transition-all">
                            <p className="text-5xl font-black mb-1 text-cyber-accent-dark dark:text-cyber-accent tabular-nums tracking-tighter">{formatBytes(storageLimit - totalStorage).split(' ')[0]}</p>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Free {formatBytes(storageLimit - totalStorage).split(' ')[1]}</p>
                        </div>
                    </div>
                </div>
                
                {/* Abstract Background Element */}
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-cyber-accent/10 to-transparent skew-x-12 transform translate-x-1/4" />
            </div>

            {/* Category Grid */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-cyber-accent rounded-full shadow-lg dark:shadow-glow-cyan" />
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Data Distribution</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
                    <CategoryCard icon={FileText} data={categories.documents} label="Documents" color="blue" />
                    <CategoryCard icon={Image} data={categories.images} label="Images" color="purple" />
                    <CategoryCard icon={Film} data={categories.videos} label="Videos" color="pink" />
                    <CategoryCard icon={Music} data={categories.audio} label="Audio" color="indigo" />
                    <CategoryCard icon={Archive} data={categories.archives} label="Archives" color="yellow" />
                    <CategoryCard icon={FileText} data={categories.other} label="Others" color="gray" />
                </div>
            </section>

            {/* Cleanup Section */}
            <section>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-1.5 h-8 bg-red-500 rounded-full shadow-glow-red" />
                        <h3 className="text-2xl font-bold text-white tracking-tight">Storage Recovery</h3>
                    </div>
                    <span className="text-[10px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-full uppercase tracking-widest">Priority: High Volume</span>
                </div>

                <div className="glass-panel rounded-[2.5rem] border-cyber-border/50 overflow-hidden bg-cyber-surface/10">
                    <div className="divide-y divide-cyber-border/30">
                        {largestFiles.length > 0 ? (
                            largestFiles.map((doc, idx) => (
                                <div key={doc.document_id} className="flex items-center gap-6 p-8 hover:bg-cyber-surface/30 transition-all group">
                                    <div className="text-sm font-black text-slate-700 w-8 tabular-nums tracking-widest">
                                        {(idx + 1).toString().padStart(2, '0')}
                                    </div>
                                    <div className="p-4 bg-slate-100 dark:bg-cyber-surface rounded-2xl group-hover:border-cyber-accent/50 border border-transparent transition-all">
                                        <FileText className="size-8 text-slate-500 group-hover:text-cyber-accent" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-900 dark:text-white text-lg truncate mb-1 tracking-tight">{doc.filename}</p>
                                        <div className="flex items-center gap-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            <span className="text-cyber-accent-dark dark:text-cyber-accent/70">{doc.file_type || 'DATA'}</span>
                                            <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                                            <span>Initialized {formatDate(doc.created_at)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-slate-900 dark:text-white mb-1 tabular-nums tracking-tighter">{formatBytes(doc.in_cloud_size || doc.original_size)}</p>
                                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Critical Mass</p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(doc.document_id, doc.filename)}
                                        disabled={isDeleting === doc.document_id}
                                        className="p-5 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all border border-transparent hover:border-red-500/30"
                                    >
                                        {isDeleting === doc.document_id ? (
                                            <RefreshCw className="size-6 animate-spin text-cyber-accent" />
                                        ) : (
                                            <Trash2 className="size-6" />
                                        )}
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="py-24 text-center">
                                <div className="p-6 bg-cyber-surface/30 rounded-full inline-block mb-6 border border-cyber-border">
                                    <AlertCircle className="size-16 text-slate-700" />
                                </div>
                                <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">No storage nodes detected</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    </AuthenticatedLayout>
  );
}

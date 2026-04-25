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
        blue: 'from-blue-500/20 to-blue-600/5 text-blue-600 border-blue-100',
        purple: 'from-purple-500/20 to-purple-600/5 text-purple-600 border-purple-100',
        pink: 'from-pink-500/20 to-pink-600/5 text-pink-600 border-pink-100',
        indigo: 'from-indigo-500/20 to-indigo-600/5 text-indigo-600 border-indigo-100',
        yellow: 'from-yellow-500/20 to-yellow-600/5 text-yellow-600 border-yellow-100',
        gray: 'from-gray-500/20 to-gray-600/5 text-gray-600 border-gray-100'
    };

    return (
        <div className={`relative overflow-hidden bg-gradient-to-br ${colorVariants[color]} p-6 rounded-3xl border transition-all hover:shadow-lg group`}>
            <div className="flex items-start justify-between relative z-10">
                <div className="p-3 bg-white rounded-2xl shadow-sm">
                    <Icon className="size-6" />
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold">{formatBytes(data.size)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{data.count} files</p>
                </div>
            </div>
            <p className="mt-6 font-bold text-gray-900 relative z-10">{label}</p>
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
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
                <ArrowLeft className="size-5 text-gray-600" />
            </button>
            <h2 className="text-2xl font-black tracking-tight text-gray-900">Storage Analytics</h2>
        </div>
      }
      headerActions={
        <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
        >
            <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
        </button>
      }
    >
      <Head title="Storage Management" />

      <div className="h-full overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-6xl mx-auto space-y-10">
            {/* Overview Section */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md">
                                <HardDrive className="size-10" />
                            </div>
                            <div>
                                <h3 className="text-3xl font-black italic tracking-tighter uppercase">STG-DB.V1</h3>
                                <p className="text-indigo-100 font-bold text-sm tracking-widest opacity-80 uppercase">Storage Subsystem</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between font-bold text-sm">
                                <span className="opacity-80">Overall Capacity</span>
                                <span>{formatBytes(totalStorage)} / {formatBytes(storageLimit)}</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-4 backdrop-blur-sm overflow-hidden p-1">
                                <div
                                    className="bg-white h-full rounded-full transition-all shadow-[0_0_20px_rgba(255,255,255,0.6)]"
                                    style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                                <span>0%</span>
                                <span>{storagePercentage.toFixed(1)}% Used</span>
                                <span>100%</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-center md:justify-end gap-6">
                        <div className="bg-white/10 rounded-[2rem] p-8 backdrop-blur-md border border-white/10 text-center min-w-[160px] transform hover:scale-105 transition-transform">
                            <p className="text-5xl font-black mb-1">{storagePercentage.toFixed(1)}%</p>
                            <p className="text-xs font-black uppercase tracking-widest opacity-60">Utilization</p>
                        </div>
                        <div className="bg-white/10 rounded-[2rem] p-8 backdrop-blur-md border border-white/10 text-center min-w-[160px] transform hover:scale-105 transition-transform">
                            <p className="text-5xl font-black mb-1">{formatBytes(storageLimit - totalStorage).split(' ')[0]}</p>
                            <p className="text-xs font-black uppercase tracking-widest opacity-60">Free {formatBytes(storageLimit - totalStorage).split(' ')[1]}</p>
                        </div>
                    </div>
                </div>
                
                {/* Abstract Background Element */}
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent skew-x-12 transform translate-x-1/4" />
            </div>

            {/* Category Grid */}
            <section>
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-2 h-8 bg-indigo-600 rounded-full" />
                    <h3 className="text-2xl font-bold text-gray-900">Distribution</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-red-500 rounded-full" />
                        <h3 className="text-2xl font-bold text-gray-900">Cleanup Suggestions</h3>
                    </div>
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-4 py-2 rounded-full uppercase tracking-widest">Priority: Size Descending</span>
                </div>

                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="divide-y divide-gray-50">
                        {largestFiles.length > 0 ? (
                            largestFiles.map((doc, idx) => (
                                <div key={doc.document_id} className="flex items-center gap-6 p-6 hover:bg-gray-50/80 transition-all group">
                                    <div className="text-lg font-black text-gray-200 w-8 tabular-nums">
                                        {(idx + 1).toString().padStart(2, '0')}
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-2xl group-hover:bg-white group-hover:shadow-md transition-all">
                                        <FileText className="size-8 text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 text-lg truncate mb-1">{doc.filename}</p>
                                        <div className="flex items-center gap-3 text-xs font-bold text-gray-400 uppercase tracking-tighter">
                                            <span>{doc.file_type || 'Unknown'}</span>
                                            <span>•</span>
                                            <span>Added {formatDate(doc.created_at)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-gray-900 mb-1">{formatBytes(doc.in_cloud_size || doc.original_size)}</p>
                                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Critical Impact</p>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(doc.document_id, doc.filename)}
                                        disabled={isDeleting === doc.document_id}
                                        className="p-4 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
                                    >
                                        {isDeleting === doc.document_id ? (
                                            <RefreshCw className="size-6 animate-spin" />
                                        ) : (
                                            <Trash2 className="size-6" />
                                        )}
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center">
                                <AlertCircle className="size-16 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-400 font-bold uppercase tracking-widest">No storage data available</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}

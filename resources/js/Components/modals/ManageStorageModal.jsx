import { HardDrive, Trash2, X, FileText, Image, Film, Music, Archive, AlertCircle, Trash } from 'lucide-react';
import { formatBytes, categorizeDocuments } from '@/Utils/fileUtils';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import axios from 'axios';

export function ManageStorageModal({ 
  totalStorage, 
  storageLimit, 
  documents,
  onClose
}) {
  const [isDeleting, setIsDeleting] = useState(null);
  
  const storagePercentage = (totalStorage / storageLimit) * 100;
  const categories = categorizeDocuments(documents);

  // Sort documents by size (largest first)
  const largestFiles = [...documents].sort((a, b) => 
    (b.in_cloud_size || b.original_size) - (a.in_cloud_size || a.original_size)
  ).slice(0, 5);

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

  const CategoryCard = ({ icon: Icon, data, label, color }) => {
    if (data.count === 0) return null;

    const colorVariants = {
        blue: 'from-blue-500/20 to-blue-600/5 text-blue-600 border-blue-100',
        purple: 'from-purple-500/20 to-purple-600/5 text-purple-600 border-purple-100',
        pink: 'from-pink-500/20 to-pink-600/5 text-pink-600 border-pink-100',
        indigo: 'from-indigo-500/20 to-indigo-600/5 text-indigo-600 border-indigo-100',
        yellow: 'from-yellow-500/20 to-yellow-600/5 text-yellow-600 border-yellow-100',
        gray: 'from-gray-500/20 to-gray-600/5 text-gray-600 border-gray-100'
    };

    return (
        <div className={`relative overflow-hidden bg-gradient-to-br ${colorVariants[color]} p-4 rounded-2xl border transition-all hover:shadow-md group`}>
            <div className="flex items-start justify-between relative z-10">
                <div className="p-2.5 bg-white/80 rounded-xl shadow-sm">
                    <Icon className="size-5" />
                </div>
                <div className="text-right">
                    <p className="text-lg font-bold">{formatBytes(data.size)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">{data.count} files</p>
                </div>
            </div>
            <p className="mt-4 font-semibold text-sm relative z-10">{label}</p>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon className="size-24" />
            </div>
        </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in duration-300" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="size-6" />
          </button>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
              <HardDrive className="size-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Storage Analytics</h2>
              <p className="text-indigo-100 text-sm">Visualize and optimize your cloud footprint</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
            <div>
                <div className="flex items-center justify-between mb-3 text-sm">
                    <span className="font-medium opacity-80">Total Usage</span>
                    <span className="font-bold">{formatBytes(totalStorage)} of {formatBytes(storageLimit)}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-3 backdrop-blur-sm overflow-hidden p-0.5">
                    <div
                        className="bg-white h-full rounded-full transition-all shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                        style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                    />
                </div>
                <p className="mt-3 text-xs opacity-70">
                    {storagePercentage > 90 ? '⚠️ Storage almost full. Consider cleaning up large files.' : 'Your storage usage is within healthy limits.'}
                </p>
            </div>
            <div className="flex justify-end gap-4">
                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10 text-center min-w-[120px]">
                    <p className="text-2xl font-bold">{storagePercentage.toFixed(1)}%</p>
                    <p className="text-[10px] font-bold uppercase tracking-tighter opacity-60">Used Capacity</p>
                </div>
                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10 text-center min-w-[120px]">
                    <p className="text-2xl font-bold">{formatBytes(storageLimit - totalStorage)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-tighter opacity-60">Remaining Space</p>
                </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {/* Storage by Category */}
          <div className="mb-10">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Usage by Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <CategoryCard icon={FileText} data={categories.documents} label="Documents" color="blue" />
                <CategoryCard icon={Image} data={categories.images} label="Images" color="purple" />
                <CategoryCard icon={Film} data={categories.videos} label="Videos" color="pink" />
                <CategoryCard icon={Music} data={categories.audio} label="Audio" color="indigo" />
                <CategoryCard icon={Archive} data={categories.archives} label="Archives" color="yellow" />
                <CategoryCard icon={FileText} data={categories.other} label="Others" color="gray" />
            </div>
          </div>

          {/* Largest Files Cleanup */}
          <div>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Cleanup Recommendations</h3>
                <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-3 py-1 rounded-full">Largest files first</span>
            </div>
            
            <div className="space-y-3">
              {largestFiles.length > 0 ? (
                largestFiles.map(doc => (
                  <div key={doc.document_id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition-all group">
                    <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                        <FileText className="size-6 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 truncate">{doc.filename}</p>
                        <p className="text-xs text-gray-500 capitalize">{doc.file_type || 'Unknown Type'}</p>
                    </div>
                    <div className="text-right mr-4">
                        <p className="font-bold text-gray-900">{formatBytes(doc.in_cloud_size || doc.original_size)}</p>
                        <p className="text-[10px] font-bold text-red-500 uppercase">Impact: High</p>
                    </div>
                    <button
                        onClick={() => handleDelete(doc.document_id, doc.filename)}
                        disabled={isDeleting === doc.document_id}
                        className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                        {isDeleting === doc.document_id ? (
                            <div className="size-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Trash2 className="size-5" />
                        )}
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <AlertCircle className="size-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">No files found to analyze</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end bg-gray-50/50">
            <button
                onClick={onClose}
                className="px-8 py-3 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
}

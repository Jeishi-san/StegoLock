import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { HardDrive, Trash2, FileText, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { formatBytes, formatDate } from '@/Utils/fileUtils';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { FileInfoModal } from '@/Components/modals/FileInfoModal';

export default function ManageStorage({ 
  documents, 
  totalStorage, 
  storageLimit 
}) {
  const [isDeleting, setIsDeleting] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedDocForInfo, setSelectedDocForInfo] = useState(null);
  
  const storagePercentage = (totalStorage / storageLimit) * 100;

  const distStats = useMemo(() => {
      const pdf = { size: 0, count: 0, label: 'PDF Documents', color: 'red' };
      const doc = { size: 0, count: 0, label: 'Word Documents', color: 'blue' };
      const txt = { size: 0, count: 0, label: 'Text Files', color: 'gray' };

      documents.forEach(d => {
        const type = d.file_type?.toLowerCase() || '';
        const size = parseInt(d.in_cloud_size || d.original_size || 0);

        if (type.includes('pdf')) {
            pdf.size += size;
            pdf.count++;
        } else if (type.includes('word') || type.includes('document') || type.includes('doc')) {
            doc.size += size;
            doc.count++;
        } else if (type.includes('text') || type.includes('txt')) {
            txt.size += size;
            txt.count++;
        }
      });

      return { pdf, doc, txt };
  }, [documents]);

  const handleSort = (key) => {
      let direction = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      } else if (sortConfig.key !== key) {
          direction = key === 'date' || key === 'size' ? 'desc' : 'asc';
      }
      setSortConfig({ key, direction });
  };

  const filteredAndSortedFiles = useMemo(() => {
      let result = [...documents].filter(doc => {
          if (selectedType === 'all') return true;
          const type = doc.file_type?.toLowerCase() || '';
          if (selectedType === 'pdf') return type.includes('pdf');
          if (selectedType === 'doc') return type.includes('word') || type.includes('document') || type.includes('doc');
          if (selectedType === 'txt') return type.includes('text') || type.includes('txt');
          return true;
      });

      result.sort((a, b) => {
          if (sortConfig.key === 'name') {
              return sortConfig.direction === 'asc' 
                  ? a.filename.localeCompare(b.filename)
                  : b.filename.localeCompare(a.filename);
          } else if (sortConfig.key === 'size') {
              const aSize = a.in_cloud_size || a.original_size || 0;
              const bSize = b.in_cloud_size || b.original_size || 0;
              return sortConfig.direction === 'asc' ? aSize - bSize : bSize - aSize;
          } else { // default date
              const aDate = new Date(a.created_at).getTime();
              const bDate = new Date(b.created_at).getTime();
              return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
          }
      });

      return result;
  }, [documents, selectedType, sortConfig]);

  const handleClearFilters = () => {
      setSelectedType('all');
      setSortConfig({ key: 'date', direction: 'desc' });
  };

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

  const CategoryCard = ({ icon: Icon, data, label, color, type, isSelected, onClick }) => {
    const colorVariants = {
        red: 'from-red-500/20 to-red-600/5 text-red-600 border-red-100 dark:from-red-500/10 dark:to-red-600/5 dark:text-red-400 dark:border-red-500/20',
        blue: 'from-blue-500/20 to-blue-600/5 text-blue-600 border-blue-100 dark:from-blue-500/10 dark:to-blue-600/5 dark:text-blue-400 dark:border-blue-500/20',
        gray: 'from-slate-500/20 to-slate-600/5 text-slate-600 border-slate-100 dark:from-slate-500/10 dark:to-slate-600/5 dark:text-slate-400 dark:border-slate-500/20'
    };

    const isFaded = selectedType !== 'all' && !isSelected;

    return (
        <button 
            onClick={onClick}
            className={`w-full text-left relative overflow-hidden bg-gradient-to-br ${colorVariants[color]} p-6 rounded-3xl border transition-all duration-300 group bg-white dark:bg-cyber-surface/50 backdrop-blur-sm 
                ${isSelected ? 'ring-2 ring-cyber-accent shadow-glow-cyan transform scale-[1.02]' : 'hover:shadow-lg dark:hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]'} 
                ${isFaded ? 'opacity-50 grayscale-[50%]' : 'opacity-100'}
            `}
        >
            <div className="flex items-start justify-between relative z-10">
                <div className={`p-3 rounded-2xl shadow-sm transition-colors ${isSelected ? 'bg-cyber-accent text-white dark:bg-cyber-accent' : 'bg-white dark:bg-cyber-void'}`}>
                    <Icon className="size-6" />
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold dark:text-white">{formatBytes(data.size)}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 dark:text-slate-400">{data.count} files</p>
                </div>
            </div>
            <p className="mt-6 font-bold text-slate-900 dark:text-slate-200 relative z-10">{label}</p>
            <div className="absolute -right-6 -bottom-6 opacity-5 dark:opacity-10 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity">
                <Icon className="size-32" />
            </div>
        </button>
    );
  };

  const SortButton = ({ label, sortKey, sortConfig, onClick }) => {
      const isActive = sortConfig.key === sortKey;
      return (
          <button 
              onClick={onClick}
              className={`flex items-center gap-1 px-4 py-2 text-xs font-bold rounded-full border transition-all ${
                  isActive 
                  ? 'bg-cyber-accent text-white border-cyber-accent dark:text-cyber-void shadow-glow-cyan/50' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-cyber-surface/50 dark:text-slate-400 dark:border-cyber-border dark:hover:bg-cyber-border/30'
              }`}
          >
              {label}
              {isActive && (
                  <span className="ml-1 text-[10px]">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
              )}
          </button>
      );
  };

  const getIconColorClass = (type = '') => {
      const t = type.toLowerCase();
      if (t.includes('pdf')) return 'text-red-500 dark:text-red-400 group-hover:text-cyber-accent transition-colors';
      if (t.includes('word') || t.includes('document') || t.includes('doc')) return 'text-blue-500 dark:text-blue-400 group-hover:text-cyber-accent transition-colors';
      return 'text-slate-500 dark:text-slate-400 group-hover:text-cyber-accent transition-colors';
  };

  return (
    <AuthenticatedLayout
      totalStorage={totalStorage}
      storageLimit={storageLimit}
      header={
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white transition-colors">Manage Storage</h2>
      }
      headerActions={
        <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-cyber-surface border border-slate-200 dark:border-cyber-border rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-cyber-border/30 transition-all shadow-sm"
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
            <section>
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-2 h-8 bg-cyber-accent rounded-full shadow-glow-cyan" />
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Storage Capacity</h3>
                </div>
                <div className="bg-gradient-to-br from-cyber-accent via-indigo-500 to-purple-600 rounded-[2.5rem] p-8 lg:p-10 text-white shadow-2xl shadow-cyan-500/40 dark:shadow-[0_0_40px_rgba(34,211,238,0.3)] relative overflow-hidden">
                    <div className="relative z-10 flex flex-wrap justify-center gap-6 md:gap-8 items-stretch">
                        <div className="bg-white/10 rounded-[2.5rem] p-8 backdrop-blur-md border border-white/10 text-center flex-1 min-w-[220px] transform hover:scale-105 transition-transform flex flex-col justify-center shadow-lg">
                            <p className="text-4xl lg:text-5xl font-black mb-4 text-white drop-shadow-md">{formatBytes(totalStorage)}</p>
                            <div className="flex items-center justify-center gap-2 opacity-90">
                                <HardDrive className="size-5" />
                                <p className="text-sm font-black uppercase tracking-widest text-white">Usage</p>
                            </div>
                        </div>
                        <div className="bg-white/10 rounded-[2.5rem] p-8 backdrop-blur-md border border-white/10 text-center flex-1 min-w-[220px] transform hover:scale-105 transition-transform flex flex-col justify-center shadow-lg">
                            <p className="text-4xl lg:text-5xl font-black mb-4 text-white drop-shadow-md">{formatBytes(storageLimit - totalStorage)}</p>
                            <div className="flex items-center justify-center gap-2 opacity-90">
                                <HardDrive className="size-5" />
                                <p className="text-sm font-black uppercase tracking-widest text-white">Free Space</p>
                            </div>
                        </div>
                        <div className="bg-white/10 rounded-[2.5rem] p-8 backdrop-blur-md border border-white/10 text-center flex-1 min-w-[220px] transform hover:scale-105 transition-transform flex flex-col justify-center shadow-lg">
                            <p className="text-4xl lg:text-5xl font-black mb-4 text-white drop-shadow-md">{formatBytes(storageLimit)}</p>
                            <div className="flex items-center justify-center gap-2 opacity-90">
                                <HardDrive className="size-5" />
                                <p className="text-sm font-black uppercase tracking-widest text-white">Total Limit</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Abstract Background Element */}
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/10 to-transparent skew-x-12 transform translate-x-1/4" />
                </div>
            </section>

            {/* Category Grid */}
            <section>
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-cyber-accent rounded-full shadow-glow-cyan" />
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Storage Distribution</h3>
                    </div>
                    {selectedType !== 'all' && (
                        <button 
                            onClick={handleClearFilters}
                            className="text-xs font-bold text-cyber-accent hover:text-cyan-400 transition-colors uppercase tracking-widest"
                        >
                            Clear Filter
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <CategoryCard 
                        icon={FileText} data={distStats.pdf} label={distStats.pdf.label} color={distStats.pdf.color} 
                        isSelected={selectedType === 'pdf'} onClick={() => selectedType === 'pdf' ? handleClearFilters() : setSelectedType('pdf')} 
                    />
                    <CategoryCard 
                        icon={FileText} data={distStats.doc} label={distStats.doc.label} color={distStats.doc.color} 
                        isSelected={selectedType === 'doc'} onClick={() => selectedType === 'doc' ? handleClearFilters() : setSelectedType('doc')} 
                    />
                    <CategoryCard 
                        icon={FileText} data={distStats.txt} label={distStats.txt.label} color={distStats.txt.color} 
                        isSelected={selectedType === 'txt'} onClick={() => selectedType === 'txt' ? handleClearFilters() : setSelectedType('txt')} 
                    />
                </div>
            </section>

            {/* Cleanup Section */}
            <section>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-cyber-accent rounded-full shadow-glow-cyan" />
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            Storage Footprint {selectedType !== 'all' && `(${selectedType.toUpperCase()})`}
                            <div 
                                className="px-3 py-1 bg-slate-100 dark:bg-cyber-void rounded-full text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-cyber-border font-bold tabular-nums cursor-help"
                                title={`${filteredAndSortedFiles.length} file${filteredAndSortedFiles.length !== 1 ? 's' : ''}`}
                            >
                                {filteredAndSortedFiles.length}
                            </div>
                        </h3>
                    </div>
                    <div className="flex gap-2 bg-slate-100 dark:bg-cyber-surface/50 p-1 rounded-full border border-slate-200 dark:border-cyber-border/50">
                        <SortButton label="Date" sortKey="date" sortConfig={sortConfig} onClick={() => handleSort('date')} />
                        <SortButton label="Name" sortKey="name" sortConfig={sortConfig} onClick={() => handleSort('name')} />
                        <SortButton label="Size" sortKey="size" sortConfig={sortConfig} onClick={() => handleSort('size')} />
                    </div>
                </div>

                <div className="bg-white dark:bg-cyber-surface/50 backdrop-blur-xl rounded-[2rem] shadow-sm border border-slate-100 dark:border-cyber-border/50 overflow-hidden">
                    <div className="divide-y divide-slate-50 dark:divide-cyber-border/30">
                        {filteredAndSortedFiles.length > 0 ? (
                            filteredAndSortedFiles.map((doc, idx) => (
                                <div 
                                    key={doc.document_id} 
                                    onClick={() => {
                                        setSelectedDocForInfo(doc);
                                        setShowInfoModal(true);
                                    }}
                                    className="flex items-center gap-4 p-4 hover:bg-slate-50/80 dark:hover:bg-cyber-border/20 transition-all group cursor-pointer"
                                >
                                    <div className="p-3 bg-slate-50 dark:bg-cyber-void rounded-xl group-hover:bg-white dark:group-hover:bg-cyber-surface group-hover:shadow-md dark:group-hover:shadow-glow-cyan/20 transition-all border border-transparent dark:group-hover:border-cyber-border">
                                        <FileText className={`size-6 ${getIconColorClass(doc.file_type)}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate mb-0.5">{doc.filename}</p>
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                                            <span>{doc.file_type || 'Unknown'}</span>
                                            <span>•</span>
                                            <span>Added {formatDate(doc.created_at)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-slate-900 dark:text-white mb-0">{formatBytes(doc.in_cloud_size || doc.original_size)}</p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(doc.document_id, doc.filename);
                                        }}
                                        disabled={isDeleting === doc.document_id}
                                        className="p-3 text-slate-300 dark:text-slate-600 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                    >
                                        {isDeleting === doc.document_id ? (
                                            <RefreshCw className="size-5 animate-spin" />
                                        ) : (
                                            <Trash2 className="size-5" />
                                        )}
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center">
                                <AlertCircle className="size-16 text-slate-200 dark:text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">No storage data available</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
      </div>

      {showInfoModal && selectedDocForInfo && (
          <FileInfoModal document={selectedDocForInfo} onClose={() => setShowInfoModal(false)} />
      )}
    </AuthenticatedLayout>
  );
}

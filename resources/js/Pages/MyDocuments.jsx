import { Shield, ArrowLeft, FolderOpen, FolderTree, Download, CheckCircle, X, Trash2, Pencil, AlertTriangle, FileText, LayoutGrid, List } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { ShareFileModal } from '@/Components/modals/ShareFileModal';
import { FileInfoModal } from '@/Components/modals/FileInfoModal';
import DocumentCard from '@/Components/DocumentCard';
import { DocumentList } from '@/Components/DocumentList';
import { SearchBar } from '@/Components/SearchBar';
import { ViewToggle } from '@/Components/ViewToggle';
import { useDocumentStatusPolling } from '@/hooks/useDocumentStatusPolling';
import { useDocumentActions } from '@/hooks/useDocumentActions';
import { sortDocuments } from '@/Utils/fileUtils';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react';

export default function MyDocuments({ documents, folders, currentFolder, totalStorage, storageLimit, title = "My Documents" }) {
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('stegolock_view_mode') || 'grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        fileFormat: 'all',
        status: 'all',
        owner: 'all',
        sort: 'date-newest'
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showKeepFileModal, setShowKeepFileModal] = useState(null);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [showDownloadReadyModal, setShowDownloadReadyModal] = useState(false);
    
    const [selectedDocId, setSelectedDocId] = useState(null);
    const [selectedDocForRename, setSelectedDocForRename] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [selectedDocForShare, setSelectedDocForShare] = useState(null);
    const [selectedDocForInfo, setSelectedDocForInfo] = useState(null);

    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);

    const { x, y, strategy, refs } = useFloating({
        placement: 'bottom-end',
        middleware: [offset(8), flip(), shift()],
        whileElementsMounted: autoUpdate,
        strategy: 'fixed'
    });

    useEffect(() => {
        localStorage.setItem('stegolock_view_mode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Initial check for stuck files
    useEffect(() => {
        const stuckDoc = documents.find(doc => doc.status === 'retrieved' || doc.status === 'decrypted');
        if (stuckDoc && !showKeepFileModal && !showDownloadReadyModal) {
            if (stuckDoc.status === 'decrypted') {
                setShowDownloadReadyModal(true);
            } else {
                setShowKeepFileModal(stuckDoc.document_id);
            }
            setSelectedDocId(stuckDoc.document_id);
        }
    }, [documents]);

    const { 
        localDocs, 
        setLocalDocs, 
        unlockingProgress, 
        updateUnlockingProgress 
    } = useDocumentStatusPolling(documents, (doc) => {
        setSelectedDocId(doc.document_id);
        setShowDownloadReadyModal(true);
    });

    const filteredDocs = useMemo(() => {
        let result = [...localDocs];

        // Search Filter
        if (searchQuery) {
            result = result.filter(doc => 
                doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Format Filter
        if (filters.fileFormat !== 'all') {
            result = result.filter(doc => doc.file_type?.toLowerCase().includes(filters.fileFormat));
        }

        // Status Filter
        if (filters.status !== 'all') {
            if (filters.status === 'secured') {
                result = result.filter(doc => ['stored', 'retrieved', 'failed'].includes(doc.status));
            } else {
                result = result.filter(doc => doc.status === 'decrypted');
            }
        }

        // Sort
        result = sortDocuments(result, filters.sort);

        return result;
    }, [localDocs, searchQuery, filters]);

    const handleDownloadAndProceed = (docId) => {
        window.location.href = `/documents/download/${docId}`;
        setShowDownloadReadyModal(false);
        setShowKeepFileModal(docId);
    };

    const {
        handleUnlock,
        handleMove,
        confirmDelete,
        keepFile,
        handleToggleStar,
        handleFileInfo,
        handleRename
    } = useDocumentActions({
        setLocalDocs,
        updateUnlockingProgress,
        setSelectedDocId,
        setSelectedDocForShare,
        setSelectedDocForInfo,
        setShowDeleteModal,
        setShowMoveModal,
        setShowShareModal,
        setShowInfoModal,
        setShowKeepFileModal
    });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    {currentFolder && (
                        <button 
                            onClick={() => router.visit(route('myFolders'))}
                            className="p-2 bg-cyber-surface hover:bg-slate-800 rounded-xl border border-cyber-border transition-all text-slate-400 hover:text-cyber-accent"
                            title="Back to folders"
                        >
                            <ArrowLeft className="size-5" />
                        </button>
                    )}
                    <h2 className="text-3xl font-bold tracking-tight text-white">
                        {currentFolder ? currentFolder.name : title}
                    </h2>
                </div>
            }
            headerActions={
                <ViewToggle view={viewMode} onViewChange={setViewMode} />
            }
            subHeader={
                <SearchBar 
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    filters={filters}
                    onFiltersChange={setFilters}
                />
            }
            totalStorage={totalStorage}
            storageLimit={storageLimit}
            hasProcessingDocs={localDocs.some(doc => unlockingProgress[doc.document_id] || !['stored', 'decrypted', 'retrieved', 'failed'].includes(doc.status))}
        >
            <Head title="My Documents"/>

            <div className="h-full overflow-y-auto custom-scrollbar">
                {filteredDocs.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-8">
                            {filteredDocs.map(doc => (
                                <DocumentCard 
                                    key={doc.document_id}
                                    doc={doc}
                                    unlockingProgress={unlockingProgress}
                                    onUnlock={handleUnlock}
                                    onToggleStar={handleToggleStar}
                                    onShare={(d) => { setSelectedDocForShare(d); setShowShareModal(true); }}
                                    onFileInfo={handleFileInfo}
                                    onDelete={(id) => { setSelectedDocId(id); setShowDeleteModal(true); }}
                                    onMove={(id) => { setSelectedDocId(id); setShowMoveModal(true); }}
                                    onRename={(doc) => { 
                                        setSelectedDocForRename(doc); 
                                        setRenameValue(doc.filename);
                                        setShowRenameModal(true); 
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="p-8">
                            <DocumentList 
                                documents={filteredDocs}
                                unlockingProgress={unlockingProgress}
                                onUnlock={handleUnlock}
                                onToggleStar={handleToggleStar}
                                onShare={(d) => { setSelectedDocForShare(d); setShowShareModal(true); }}
                                onFileInfo={handleFileInfo}
                                onDelete={(id) => { setSelectedDocId(id); setShowDeleteModal(true); }}
                                onMove={(id) => { setSelectedDocId(id); setShowMoveModal(true); }}
                                onRename={(doc) => { 
                                    setSelectedDocForRename(doc); 
                                    setRenameValue(doc.filename);
                                    setShowRenameModal(true); 
                                }}
                                openMenuId={openMenuId}
                                setOpenMenuId={setOpenMenuId}
                                refs={refs}
                                strategy={strategy}
                                x={x}
                                y={y}
                                menuRef={menuRef}
                            />
                        </div>
                    )
                ) : (
                    <div className="flex-1 flex items-center justify-center p-8 min-h-[500px]">
                        <div className="text-center max-w-sm">
                            <div className="w-24 h-24 bg-cyber-surface/30 rounded-3xl flex items-center justify-center mx-auto mb-8 border-2 border-dashed border-cyber-border/50 shadow-inner group-hover:border-cyber-accent transition-colors">
                                <Shield className="size-10 text-slate-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                                {searchQuery || filters.fileFormat !== 'all' || filters.status !== 'all' ? "No matches found" : "No documents yet"}
                            </h3>
                            <p className="text-slate-500 leading-relaxed">
                                {searchQuery || filters.fileFormat !== 'all' || filters.status !== 'all' 
                                    ? "Try refining your search parameters or resetting filters." 
                                    : "Start securing your digital footprint by locking your first document."}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-300">
                    <div className="absolute inset-0 bg-slate-900/40 dark:bg-cyber-void/80 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
                    <div className="glass-panel w-full max-w-md overflow-hidden transform transition-all shadow-2xl rounded-3xl border-red-500/20 relative z-10 bg-white dark:bg-cyber-void">
                        <div className="bg-red-500/5 dark:bg-red-500/10 p-8 text-center relative border-b border-red-500/10 dark:border-red-500/20">
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/10 dark:bg-red-500/20 rounded-3xl mb-6 shadow-xl dark:shadow-glow-red border border-red-500/20 dark:border-red-500/30">
                                <Trash2 className="size-10 text-red-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Delete Document</h2>
                            <p className="text-red-500 dark:text-red-400/80 text-sm mt-2 font-medium">This action is permanent and irreversible.</p>
                        </div>
                        
                        <div className="p-8">
                            <div className="bg-slate-50 dark:bg-cyber-surface/50 rounded-2xl p-5 mb-8 flex items-center gap-4 border border-slate-200 dark:border-cyber-border/50">
                                <div className="bg-red-50 dark:bg-red-500/10 p-3 rounded-xl border border-red-100 dark:border-red-500/20">
                                    <FileText className="size-6 text-red-500" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                        {localDocs.find(d => d.document_id === selectedDocId)?.filename}
                                    </p>
                                    <p className="text-xs font-bold text-red-500/70 uppercase tracking-widest mt-1">Pending Removal</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-6 py-3.5 text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-cyber-surface hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-cyber-border"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => confirmDelete(selectedDocId)}
                                    className="px-6 py-3.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-lg shadow-red-600/20"
                                >
                                    Confirm Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showMoveModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 dark:bg-cyber-void/80 backdrop-blur-sm" onClick={() => setShowMoveModal(false)} />
                    <div className="glass-panel w-full max-w-md overflow-hidden transform transition-all shadow-2xl rounded-3xl border-cyber-accent/20 relative z-10 bg-white dark:bg-cyber-void">
                        <div className="bg-cyber-accent/5 dark:bg-cyber-accent/10 p-8 text-center relative border-b border-slate-100 dark:border-cyber-border">
                            <button 
                                onClick={() => setShowMoveModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-cyber-accent/10 dark:bg-cyber-accent/20 rounded-3xl mb-6 shadow-xl dark:shadow-glow-cyan border border-cyber-accent/20 dark:border-cyber-accent/30">
                                <FolderOpen className="size-10 text-cyber-accent" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Relocate Document</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Select a destination folder</p>
                        </div>
                        
                        <div className="p-8">
                            <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar mb-8">
                                <button 
                                    onClick={() => handleMove(selectedDocId, null)} 
                                    className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-cyber-surface/30 hover:bg-cyber-accent hover:text-white dark:hover:text-cyber-void transition-all border border-slate-200 dark:border-cyber-border group text-left"
                                >
                                    <div className="p-2.5 bg-slate-100 dark:bg-cyber-surface rounded-xl group-hover:bg-white/10 dark:group-hover:bg-cyber-void/10">
                                        <FolderOpen className="size-5 text-slate-500 group-hover:text-white dark:group-hover:text-cyber-void" />
                                    </div>
                                    <span className="text-sm font-bold tracking-tight">Root Directory</span>
                                </button>
                                {folders.map(folder => (
                                    <button 
                                        key={folder.folder_id} 
                                        onClick={() => handleMove(selectedDocId, folder.folder_id)} 
                                        className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-cyber-surface/30 hover:bg-cyber-accent hover:text-white dark:hover:text-cyber-void transition-all border border-slate-200 dark:border-cyber-border group text-left"
                                    >
                                        <div className="p-2.5 bg-slate-100 dark:bg-cyber-surface rounded-xl group-hover:bg-white/10 dark:group-hover:bg-cyber-void/10">
                                            <FolderTree className="size-5 text-cyber-accent group-hover:text-white dark:group-hover:text-cyber-void" />
                                        </div>
                                        <span className="text-sm font-bold tracking-tight truncate">{folder.name}</span>
                                    </button>
                                ))}
                            </div>
                            
                            <div className="flex justify-end">
                                <button onClick={() => setShowMoveModal(false)} className="px-8 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-cyber-surface hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-cyber-border">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showRenameModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 dark:bg-cyber-void/80 backdrop-blur-sm" onClick={() => setShowRenameModal(false)} />
                    <div className="glass-panel w-full max-w-md overflow-hidden transform transition-all shadow-2xl rounded-3xl border-cyber-accent/20 relative z-10 bg-white dark:bg-cyber-void">
                        <div className="bg-cyber-accent/5 dark:bg-cyber-accent/10 p-8 text-center relative border-b border-slate-100 dark:border-cyber-border">
                            <button 
                                onClick={() => setShowRenameModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-cyber-accent/10 dark:bg-cyber-accent/20 rounded-3xl mb-6 shadow-xl dark:shadow-glow-cyan border border-cyber-accent/20 dark:border-cyber-accent/30">
                                <Pencil className="size-10 text-cyber-accent" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Rename Document</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Update the identifier for this file</p>
                        </div>
                        
                        <div className="p-8">
                            <div className="space-y-6 mb-8 text-left">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">New Filename</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <FileText className="size-5 text-slate-500 group-focus-within:text-cyber-accent transition-colors" />
                                        </div>
                                        <input 
                                            autoFocus
                                            type="text" 
                                            value={renameValue}
                                            onChange={(e) => setRenameValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleRename(selectedDocForRename.document_id, renameValue);
                                                    setShowRenameModal(false);
                                                }
                                            }}
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-cyber-surface/50 border border-slate-200 dark:border-cyber-border rounded-2xl focus:ring-2 focus:ring-cyber-accent focus:border-transparent outline-none transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner"
                                            placeholder="Enter new filename"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setShowRenameModal(false)} className="px-6 py-3.5 text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-cyber-surface hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-cyber-border">
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => {
                                        handleRename(selectedDocForRename.document_id, renameValue);
                                        setShowRenameModal(false);
                                    }}
                                    className="px-6 py-3.5 text-sm font-bold text-white dark:text-cyber-void bg-cyber-accent hover:bg-slate-900 dark:hover:bg-white rounded-xl transition-all shadow-lg dark:shadow-glow-cyan"
                                >
                                    Update Name
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showKeepFileModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 dark:bg-cyber-void/80 backdrop-blur-sm" onClick={() => setShowKeepFileModal(null)} />
                    <div className="glass-panel w-full max-w-md overflow-hidden transform transition-all shadow-2xl rounded-3xl border-cyber-accent/20 relative z-10 bg-white dark:bg-cyber-void">
                        <div className="bg-cyber-accent/5 dark:bg-cyber-accent/10 p-8 text-center relative border-b border-slate-100 dark:border-cyber-border">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-cyber-accent/10 dark:bg-cyber-accent/20 rounded-3xl mb-6 shadow-xl dark:shadow-glow-cyan border border-cyber-accent/20 dark:border-cyber-accent/30">
                                <CheckCircle className="size-10 text-cyber-accent" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Data Restored</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">The document is now decrypted</p>
                        </div>
                        
                        <div className="p-8">
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8 leading-relaxed">
                                The file is now accessible. Choose whether to maintain this decrypted state on the vault or purge it immediately for zero-knowledge security.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => keepFile(selectedDocId, localDocs.find(d => d.document_id === selectedDocId)?.filename)}
                                    className="px-6 py-3.5 text-sm font-bold text-cyber-accent bg-slate-100 dark:bg-cyber-surface hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-cyber-border"
                                >
                                    Keep Online
                                </button>
                                <button 
                                    onClick={() => { setShowDeleteModal(true); setShowKeepFileModal(null); }}
                                    className="px-6 py-3.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-lg shadow-red-600/20"
                                >
                                    Purge Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDownloadReadyModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-cyber-void/80 backdrop-blur-sm" onClick={() => setShowDownloadReadyModal(false)} />
                    <div className="glass-panel w-full max-w-md overflow-hidden transform transition-all shadow-2xl rounded-3xl border-cyber-accent/20 relative z-10">
                        <div className="bg-cyber-accent/10 p-8 text-center relative border-b border-cyber-border">
                            <button 
                                onClick={() => setShowDownloadReadyModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-cyber-accent/20 rounded-3xl mb-6 shadow-glow-cyan border border-cyber-accent/30">
                                <CheckCircle className="size-10 text-cyber-accent" />
                            </div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Vault Unlocked</h2>
                            <p className="text-slate-400 text-sm mt-2">Your document is ready for extraction</p>
                        </div>
                        
                        <div className="p-8">
                            <div className="bg-cyber-surface/50 rounded-2xl p-5 mb-8 flex items-center gap-4 border border-cyber-border/50">
                                <div className="bg-cyber-accent/10 p-3 rounded-xl border border-cyber-accent/20">
                                    <Shield className="size-6 text-cyber-accent" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-sm font-bold text-white truncate">
                                        {localDocs.find(d => d.document_id === selectedDocId)?.filename}
                                    </p>
                                    <p className="text-xs font-bold text-cyber-accent/70 uppercase tracking-widest mt-1">Status: Decrypted</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => {
                                        const doc = localDocs.find(d => d.document_id === selectedDocId);
                                        keepFile(selectedDocId, doc?.filename);
                                        setShowDownloadReadyModal(false);
                                    }}
                                    className="px-6 py-3.5 text-sm font-bold text-slate-400 bg-cyber-surface hover:bg-slate-800 rounded-xl transition-all border border-cyber-border"
                                >
                                    Later
                                </button>
                                <button 
                                    onClick={() => handleDownloadAndProceed(selectedDocId)}
                                    className="px-6 py-3.5 text-sm font-bold text-cyber-void bg-cyber-accent hover:bg-white rounded-xl transition-all shadow-glow-cyan flex items-center justify-center gap-2"
                                >
                                    <Download className="size-4" />
                                    Extract Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showShareModal && (
                <ShareFileModal document={selectedDocForShare} onClose={() => setShowShareModal(false)} />
            )}

            {showInfoModal && (
                <FileInfoModal document={selectedDocForInfo} onClose={() => setShowInfoModal(false)} />
            )}

        </AuthenticatedLayout>
    );
}

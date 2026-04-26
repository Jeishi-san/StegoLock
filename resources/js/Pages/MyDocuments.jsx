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
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            title="Back to folders"
                        >
                            <ArrowLeft className="size-5 text-gray-600" />
                        </button>
                    )}
                    <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white transition-colors">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
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
                        <div className="p-6">
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
                    <div className="flex-1 flex items-center justify-center p-8 min-h-[400px]">
                        <div className="text-center">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-gray-200">
                                <Shield className="size-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {searchQuery || filters.fileFormat !== 'all' || filters.status !== 'all' ? "No matching documents" : "No Documents Found"}
                            </h3>
                            <p className="text-gray-500 max-w-xs mx-auto">
                                {searchQuery || filters.fileFormat !== 'all' || filters.status !== 'all' ? "Try adjusting your filters or search query" : "Upload files to get started with Stegolock"}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDeleteModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-96 overflow-hidden transform transition-all" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-red-600 p-6 text-white text-center relative">
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                                <Trash2 className="size-10 text-white" />
                            </div>
                            <h2 className="text-xl font-bold">Delete File</h2>
                            <p className="text-red-100 text-sm mt-1">This action cannot be undone</p>
                        </div>
                        
                        <div className="p-6">
                            <div className="bg-red-50 rounded-xl p-4 mb-6 flex items-center gap-4 border border-red-100">
                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                    <FileText className="size-6 text-red-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {localDocs.find(d => d.document_id === selectedDocId)?.filename}
                                    </p>
                                    <p className="text-xs text-red-500">Permanent removal</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => confirmDelete(selectedDocId)}
                                    className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showMoveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowMoveModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-96 overflow-hidden transform transition-all" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-indigo-600 p-6 text-white text-center relative">
                            <button 
                                onClick={() => setShowMoveModal(false)}
                                className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                                <FolderOpen className="size-10 text-white" />
                            </div>
                            <h2 className="text-xl font-bold">Move to Folder</h2>
                            <p className="text-indigo-100 text-sm mt-1">Organize your document</p>
                        </div>
                        
                        <div className="p-6">
                            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar mb-6">
                                <button 
                                    onClick={() => handleMove(selectedDocId, null)} 
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100 group text-left"
                                >
                                    <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-white">
                                        <FolderOpen className="size-5 text-gray-400 group-hover:text-indigo-600" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">Root Directory</span>
                                </button>
                                {folders.map(folder => (
                                    <button 
                                        key={folder.folder_id} 
                                        onClick={() => handleMove(selectedDocId, folder.folder_id)} 
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100 group text-left"
                                    >
                                        <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-white">
                                            <FolderTree className="size-5 text-indigo-500" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 truncate">{folder.name}</span>
                                    </button>
                                ))}
                            </div>
                            
                            <div className="flex justify-end">
                                <button onClick={() => setShowMoveModal(false)} className="px-6 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showKeepFileModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowKeepFileModal(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-96 overflow-hidden transform transition-all" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-indigo-600 p-6 text-white text-center relative">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                                <CheckCircle className="size-10 text-white" />
                            </div>
                            <h2 className="text-xl font-bold">File Retrieved</h2>
                            <p className="text-indigo-100 text-sm mt-1">What would you like to do with the unlocked file?</p>
                        </div>
                        
                        <div className="p-6">
                            <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
                                The file is currently decrypted on our server. You can keep it for later or delete it immediately for maximum security.
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => keepFile(selectedDocId, localDocs.find(d => d.document_id === selectedDocId)?.filename)}
                                    className="px-4 py-2.5 text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all"
                                >
                                    Keep File
                                </button>
                                <button 
                                    onClick={() => { setShowDeleteModal(true); setShowKeepFileModal(null); }}
                                    className="px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-lg shadow-red-100"
                                >
                                    Delete File
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
            
            {showRenameModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowRenameModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-96 overflow-hidden transform transition-all" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-indigo-600 p-6 text-white text-center relative">
                            <button 
                                onClick={() => setShowRenameModal(false)}
                                className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                                <Pencil className="size-10 text-white" />
                            </div>
                            <h2 className="text-xl font-bold">Rename Document</h2>
                            <p className="text-indigo-100 text-sm mt-1">Enter a new name for your file</p>
                        </div>
                        
                        <div className="p-6">
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">New Filename</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FileText className="size-5 text-gray-400" />
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
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-gray-700"
                                            placeholder="Enter new filename"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setShowRenameModal(false)} className="px-4 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all">
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => {
                                        handleRename(selectedDocForRename.document_id, renameValue);
                                        setShowRenameModal(false);
                                    }}
                                    className="px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-100"
                                >
                                    Rename
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDownloadReadyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDownloadReadyModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-96 overflow-hidden transform transition-all" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-indigo-600 p-6 text-white text-center relative">
                            <button 
                                onClick={() => setShowDownloadReadyModal(false)}
                                className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                                <CheckCircle className="size-10 text-white" />
                            </div>
                            <h2 className="text-xl font-bold">File Unlocked</h2>
                            <p className="text-indigo-100 text-sm mt-1">Your document is ready for retrieval</p>
                        </div>
                        
                        <div className="p-6">
                            <div className="bg-gray-50 rounded-xl p-4 mb-6 flex items-center gap-4">
                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                    <Shield className="size-6 text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {localDocs.find(d => d.document_id === selectedDocId)?.filename}
                                    </p>
                                    <p className="text-xs text-gray-500">Decryption complete</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => {
                                        const doc = localDocs.find(d => d.document_id === selectedDocId);
                                        keepFile(selectedDocId, doc?.filename);
                                        setShowDownloadReadyModal(false);
                                    }}
                                    className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => handleDownloadAndProceed(selectedDocId)}
                                    className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download className="size-4" />
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </AuthenticatedLayout>
    );
}

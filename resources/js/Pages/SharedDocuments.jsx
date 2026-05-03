import { Shield, FileText, Star, MoreVertical,
    Unlock, Pencil, FolderInput, Share2, Info, Trash2, Lock, Loader2, AlertCircle, FolderOpen, FolderTree, UserCheck, UserPlus, Clock, ChevronDown, ChevronUp, X, Download, CheckCircle } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatBytes, formatDate } from '@/Utils/fileUtils';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import Tooltip from '@/Components/Tooltip';
import axios from 'axios';
import {
    useFloating,
    offset,
    flip,
    shift,
    autoUpdate
} from '@floating-ui/react';
import { FileInfoModal } from '@/Components/modals/FileInfoModal';
import { ConfirmModal } from '@/Components/modals/ConfirmModal';
import { DownloadReadyModal } from '@/Components/modals/DownloadReadyModal';
import MoveFileModal from '@/Components/modals/MoveFileModal';
import FileRetrievedModal from '@/Components/modals/FileRetrievedModal';
import { SearchBar } from '@/Components/SearchBar';
import { ViewToggle } from '@/Components/ViewToggle';
import { DocumentList } from '@/Components/DocumentList';
import { sortDocuments } from '@/Utils/fileUtils';
import DocumentCard from '@/Components/DocumentCard';

export default function SharedDocuments({ documents, pendingShares, pendingFolderShares, acceptedFolderShares, sentShares, folders, totalStorage, storageLimit, pendingSharesCount }) {
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('stegolock_view_mode_shared') || 'grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        fileFormat: 'all',
        status: 'all',
        owner: 'all',
        sort: 'date-newest'
    });

    const menuRef = useRef(null);
    const normalizeDocuments = (docs) => {
        if (Array.isArray(docs)) return docs;
        if (Array.isArray(docs?.data)) return docs.data;
        return [];
    };

    const documentList = normalizeDocuments(documents);
    const [localDocs, setLocalDocs] = useState(documentList);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [openRecipientsId, setOpenRecipientsId] = useState(null);
    const [openRowMenuId, setOpenRowMenuId] = useState(null);
    const [selectedDocId, setSelectedDocId] = useState(null);
    const [selectedDocForInfo, setSelectedDocForInfo] = useState(null);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showKeepFileModal, setShowKeepFileModal] = useState(null);
    const [showDownloadReadyModal, setShowDownloadReadyModal] = useState(false);
    const [unlockingProgress, setUnlockingProgress] = useState(() => {
        const saved = localStorage.getItem('stegolock_unlocking_progress_shared');
        return saved ? JSON.parse(saved) : {};
    });

    // Removal Confirmation State
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
    const [removeData, setRemoveData] = useState({ docId: null, shareId: null });
    const [isRemoving, setIsRemoving] = useState(false);

    const recipientMenuRef = useRef(null);
    const rowMenuRef = useRef(null);
    const [showMoveModal, setShowMoveModal] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
            if (recipientMenuRef.current && !recipientMenuRef.current.contains(event.target)) {
                setOpenRecipientsId(null);
            }
            if (rowMenuRef.current && !rowMenuRef.current.contains(event.target)) {
                setOpenRowMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const updateUnlockingProgress = (id, startTime = Date.now()) => {
        setUnlockingProgress(prev => {
            const next = startTime ? { ...prev, [id]: startTime } : { ...prev };
            if (!startTime) delete next[id];
            localStorage.setItem('stegolock_unlocking_progress_shared', JSON.stringify(next));
            return next;
        });
    };

    useEffect(() => {
        setLocalDocs(normalizeDocuments(documents));
    }, [documents]);

    // Polling logic
    useEffect(() => {
        const processingDocs = localDocs.filter(doc => 
            unlockingProgress[doc.document_id] || !['stored', 'decrypted', 'retrieved', 'failed'].includes(doc.status)
        );

        if (processingDocs.length === 0) return;

        const interval = setInterval(async () => {
            const updatedDocs = await Promise.all(
                localDocs.map(async (doc) => {
                    if (unlockingProgress[doc.document_id] || !['stored', 'decrypted', 'failed'].includes(doc.status)) {
                        try {
                            const { data } = await axios.get(`/documents/status/${doc.document_id}`);
                            if (['decrypted', 'failed'].includes(data.status)) {
                                updateUnlockingProgress(doc.document_id, null);
                            }
                            return { ...doc, ...data };
                        } catch (e) {
                            return doc;
                        }
                    }
                    return doc;
                })
            );

            if (JSON.stringify(updatedDocs) !== JSON.stringify(localDocs)) {
                updatedDocs.forEach((doc, index) => {
                    const prevStatus = localDocs[index]?.status;
                    const isMyProcess = !!unlockingProgress[doc.document_id];
                    
                    if (doc.status === 'decrypted' && prevStatus && prevStatus !== 'decrypted' && isMyProcess) {
                        setSelectedDocId(doc.document_id);
                        setShowDownloadReadyModal(true);
                    }
                });
                setLocalDocs(updatedDocs);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [localDocs]);

    useEffect(() => {
        localStorage.setItem('stegolock_view_mode_shared', viewMode);
    }, [viewMode]);

    const filteredDocs = useMemo(() => {
        let result = Array.isArray(localDocs) ? [...localDocs] : [];

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

    const handleAcceptShare = async (id) => {
        const toastId = toast.loading('Accepting share...');
        try {
            await axios.post(route('documents.share.accept'), {
                document_id: id
            });
            toast.success('Share accepted successfully', { id: toastId });
            router.reload();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to accept share', { id: toastId });
        }
    };

    const handleAcceptFolderShare = async (id) => {
        const toastId = toast.loading('Accepting folder share...');
        try {
            await axios.post(route('folders.share.accept'), {
                share_id: id
            });
            toast.success('Folder share accepted successfully', { id: toastId });
            router.reload();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to accept folder share', { id: toastId });
        }
    };

    const handleUnlock = async (id) => {
        setOpenMenuId(null);
        const toastId = toast.loading('Unlocking file...');
        try {
            const resp = await axios.post('/documents/unlock', { document_id: id });
            if (resp.data.success) {
                toast.dismiss(toastId);
                updateUnlockingProgress(id);
                setLocalDocs(prev => prev.map(doc => 
                    doc.document_id === id ? { ...doc, status: resp.data.status } : doc
                ));
            }
        } catch (err) {
            toast.error('Unlock failed', { id: toastId });
        }
    };

    const getStatusDisplay = (status, docId) => {
        if (unlockingProgress[docId]) {
            const elapsed = Date.now() - unlockingProgress[docId];
            if (elapsed < 2000) return 'Fetching stego files...';
            if (elapsed < 4000) return 'Extracting fragments...';
            if (elapsed < 6000) return 'Reconstructing file...';
            return 'Decrypting file...';
        }
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const openMoveModal = (id) => {
        setOpenMenuId(null);
        setSelectedDocId(id);
        setShowMoveModal(true);
    };

    const handleMove = async (folderId) => {
        const toastId = toast.loading('Moving document...');
        try {
            await axios.put(`/documents/${selectedDocId}/move`, {
                folder_id: folderId
            });
            toast.success('Document moved successfully', { id: toastId });
            setShowMoveModal(false);
            router.reload();
        } catch (err) {
            toast.error('Failed to move document', { id: toastId });
        }
    };

    const confirmRemoveAccess = ({ docId = null, shareId = null }) => {
        setRemoveData({ docId, shareId });
        setShowRemoveConfirm(true);
    };

    const handleRemoveAccessAction = async () => {
        setIsRemoving(true);
        try {
            await axios.post(route('documents.share.remove'), {
                document_id: removeData.docId,
                share_id: removeData.shareId
            });
            toast.success('Access removed successfully');
            setShowRemoveConfirm(false);
            router.reload();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to remove access');
        } finally {
            setIsRemoving(false);
        }
    };

    const getFileColor = (type) => {
        switch (type) {
            case 'pdf': return 'text-red-500 bg-red-50 dark:bg-red-500/10 dark:text-red-400';
            case 'doc':
            case 'docx': return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400';
            case 'txt': return 'text-slate-600 bg-slate-50 dark:bg-slate-400/10 dark:text-slate-400';
            default: return 'text-cyan-500 bg-cyan-50 dark:bg-cyber-accent/10 dark:text-cyber-accent';
        }
    };

    const { x, y, strategy, refs } = useFloating({
        placement: 'bottom-end',
        middleware: [offset(8), flip(), shift()],
        whileElementsMounted: autoUpdate,
        strategy: 'fixed'
    });

    const { x: rx, y: ry, strategy: rStrategy, refs: rRefs } = useFloating({
        placement: 'bottom-start',
        middleware: [offset(8), flip(), shift()],
        whileElementsMounted: autoUpdate,
        strategy: 'fixed'
    });

    const { x: tx, y: ty, strategy: tStrategy, refs: tRefs } = useFloating({
        placement: 'bottom-end',
        middleware: [offset(8), flip(), shift()],
        whileElementsMounted: autoUpdate,
        strategy: 'fixed'
    });

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white transition-colors">Shared With Me</h2>
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
        >
            <Head title="Shared With Me" />

            <div className="p-6 space-y-8 h-[calc(100vh-140px)] overflow-y-auto scrollbar-hide custom-scrollbar">
                {/* Pending Folder Shares Section */}
                {pendingFolderShares && pendingFolderShares.length > 0 && !searchQuery && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <FolderTree className="size-5 text-indigo-600 dark:text-indigo-400" />
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Pending Folder Shares</h3>
                            <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold px-2 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/30">
                                {pendingFolderShares.length}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingFolderShares.map(share => (
                                <div key={share.share_id} className="bg-white dark:bg-cyber-void p-5 rounded-2xl shadow-lg border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-between group hover:shadow-indigo-500/10 transition-all border-l-4 border-l-indigo-500">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
                                            <FolderOpen className="size-6 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-slate-900 dark:text-white truncate max-w-[150px] uppercase tracking-tight">
                                                {share.folder.name}
                                            </p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                                                from <span className="text-indigo-600 dark:text-indigo-400">{share.sender.name}</span> • {share.document_count} files
                                            </p>
                                        </div>
                                    </div>
                                    {share.is_expired ? (
                                        <span className="text-[10px] font-black text-red-500 uppercase px-2 py-1 bg-red-50 dark:bg-red-500/10 rounded-lg">Expired</span>
                                    ) : (
                                        <button
                                            onClick={() => handleAcceptFolderShare(share.share_id)}
                                            className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2"
                                        >
                                            <UserCheck className="size-4" />
                                            Accept
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Pending Standalone Shares Section */}
                {pendingShares.length > 0 && !searchQuery && filters.fileFormat === 'all' && filters.status === 'all' && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="size-5 text-cyan-600 dark:text-cyber-accent" />
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Pending Shares</h3>
                            <span className="bg-cyan-100 dark:bg-cyber-accent/20 text-cyan-700 dark:text-cyber-accent text-xs font-bold px-2 py-1 rounded-full border border-cyan-200 dark:border-cyber-accent/30">
                                {pendingShares.length}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingShares.map(share => (
                                <div key={share.share_id} className="bg-white dark:bg-cyber-void p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 flex items-center justify-between group hover:shadow-lg hover:shadow-cyan-500/20 dark:hover:shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:ring-1 hover:ring-cyan-500 dark:hover:ring-cyber-accent transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-cyan-50 dark:bg-cyber-accent/10 rounded-lg">
                                            <UserPlus className="size-6 text-cyan-600 dark:text-cyber-accent" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[150px]">
                                                {share.document.filename}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                from <span className="font-semibold text-slate-700 dark:text-slate-300">{share.sender.name}</span>
                                            </p>
                                        </div>
                                    </div>
                                    {share.is_expired ? (
                                        <Tooltip content="Invitation expired. Please ask the owner to share again.">
                                            <div className="px-4 py-2 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 text-xs font-bold rounded-lg flex items-center gap-2 cursor-help">
                                                <AlertCircle className="size-4" />
                                                EXPIRED
                                            </div>
                                        </Tooltip>
                                    ) : (
                                        <button
                                            onClick={() => handleAcceptShare(share.document_id)}
                                            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 dark:from-cyber-accent dark:to-indigo-500 text-white text-sm font-bold rounded-lg hover:opacity-90 transition-all shadow-md shadow-cyan-500/30 flex items-center gap-2"
                                        >
                                            <UserCheck className="size-4" />
                                            Accept
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Accepted Folder Shares Section */}
                {acceptedFolderShares && acceptedFolderShares.length > 0 && !searchQuery && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <FolderOpen className="size-5 text-indigo-600 dark:text-indigo-400" />
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Shared Folders</h3>
                            <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold px-2 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/30">
                                {acceptedFolderShares.length}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                            {acceptedFolderShares.map(share => (
                                <div
                                    key={share.share_id}
                                    onClick={() => toast.info("Deep navigation into shared folders coming soon. For now, see the files in the list below.")}
                                    className="group relative w-full p-3 bg-white dark:bg-cyber-void rounded-xl shadow-sm border border-indigo-100 dark:border-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/20 transition-all cursor-pointer border-l-4 border-l-indigo-500"
                                >
                                    <div className="flex flex-col items-center justify-center py-2">
                                        <FolderOpen className="size-10 text-indigo-500 dark:text-indigo-400 mb-1" />
                                        <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 truncate w-full text-center px-1 uppercase tracking-tighter">
                                            {share.folder.name}
                                        </h3>
                                        <p className="text-[8px] text-slate-400 font-bold">from {share.sender.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Accepted Documents Grid */}
                <section>
                    {(pendingShares.length > 0 || (pendingFolderShares && pendingFolderShares.length > 0)) && !searchQuery && (
                        <div className="flex items-center gap-2 mb-4">
                            <FolderOpen className="size-5 text-gray-600" />
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Shared Files</h3>
                        </div>
                    )}

                    {filteredDocs.length > 0 ? (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredDocs.map(doc => (
                                    <DocumentCard 
                                        key={doc.document_id}
                                        doc={doc}
                                        unlockingProgress={unlockingProgress}
                                        onUnlock={handleUnlock}
                                        onToggleStar={(id) => { toast.info("Starring shared files coming soon"); }}
                                        onShare={() => {}} // No share for shared files
                                        onFileInfo={(d) => { setSelectedDocForInfo(d); setShowInfoModal(true); }}
                                        onDelete={() => confirmRemoveAccess({ docId: doc.document_id })}
                                        onMove={openMoveModal}
                                        onRename={() => toast.info("Renaming shared files coming soon")}
                                    />
                                ))}
                            </div>
                        ) : (
                            <DocumentList 
                                documents={filteredDocs}
                                unlockingProgress={unlockingProgress}
                                onUnlock={handleUnlock}
                                onToggleStar={(id) => { toast.info("Starring shared files coming soon"); }}
                                onShare={() => {}}
                                onFileInfo={(d) => { setSelectedDocForInfo(d); setShowInfoModal(true); }}
                                onDelete={(id) => confirmRemoveAccess({ docId: id })}
                                onMove={openMoveModal}
                                onRename={() => toast.info("Renaming shared files coming soon")}
                                openMenuId={openMenuId}
                                setOpenMenuId={setOpenMenuId}
                                refs={refs}
                                strategy={strategy}
                                x={x}
                                y={y}
                                menuRef={menuRef}
                            />
                        )
                    ) : (
                        <div className="bg-slate-50 dark:bg-cyber-surface/30 rounded-3xl p-12 text-center border-2 border-dashed border-slate-300 dark:border-cyber-border">
                            <div className="w-16 h-16 bg-cyan-50 dark:bg-cyber-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-cyan-100 dark:border-cyber-accent/30">
                                <Share2 className="size-8 text-cyan-500 dark:text-cyber-accent" />
                            </div>
                            <h4 className="text-slate-900 dark:text-white font-bold mb-1 text-xl">
                                {searchQuery || filters.fileFormat !== 'all' ? "No matching files" : "No shared files yet"}
                            </h4>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                {searchQuery || filters.fileFormat !== 'all' ? "Try adjusting your filters or search query" : "When someone shares a file with you, it will appear here."}
                            </p>
                        </div>
                    )}
                </section>

                {/* Sent Shares Section */}
                {sentShares && sentShares.length > 0 && (
                    <section className="pt-8 border-t border-slate-200 dark:border-cyber-border/50">
                        <div className="flex items-center gap-2 mb-4">
                            <Share2 className="size-5 text-cyan-600 dark:text-cyber-accent" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Shared by Me</h3>
                            <span className="bg-slate-100 dark:bg-cyber-surface text-slate-600 dark:text-slate-400 text-xs font-bold px-2 py-1 rounded-full border border-slate-200 dark:border-cyber-border/50">
                                {sentShares.length}
                            </span>
                        </div>
                        <div className="bg-white dark:bg-cyber-void rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-cyber-surface/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-cyber-border/50">
                                        <tr>
                                            <th className="px-6 py-3">Document</th>
                                            <th className="px-6 py-3">Recipients</th>
                                            <th className="px-6 py-3">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-cyber-border/30">
                                        {sentShares.map(group => (
                                            <tr key={group.document_id} className="hover:bg-slate-50 dark:hover:bg-cyber-surface/50 transition-colors">
                                                <td className="px-6 py-4 align-top">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className={`size-5 ${getFileColor(group.file_type)}`} />
                                                        <span className="font-bold text-slate-900 dark:text-slate-100">{group.filename}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {group.recipients.length === 1 ? (
                                                        <div className="flex items-center justify-between group/single">
                                                            <div className="flex flex-col">
                                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{group.recipients[0].name}</p>
                                                                <p className="text-xs text-slate-400 dark:text-slate-500">{group.recipients[0].email}</p>
                                                                <span className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${
                                                                    group.recipients[0].status === 'accepted' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-500'
                                                                }`}>
                                                                    {group.recipients[0].status}
                                                                </span>
                                                            </div>
                                                            <button 
                                                                onClick={() => confirmRemoveAccess({ shareId: group.recipients[0].share_id })}
                                                                className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover/single:opacity-100 transition-all"
                                                                title="Remove Access"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <button
                                                                ref={(node) => openRecipientsId === group.document_id && rRefs.setReference(node)}
                                                                onClick={() => setOpenRecipientsId(openRecipientsId === group.document_id ? null : group.document_id)}
                                                                className="flex items-center gap-2 text-cyan-600 dark:text-cyber-accent hover:text-cyan-700 dark:hover:text-cyan-400 font-bold text-sm transition-colors"
                                                            >
                                                                Shared to {group.recipients.length} people
                                                                {openRecipientsId === group.document_id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                                            </button>

                                                            {openRecipientsId === group.document_id && (
                                                                <div
                                                                    ref={(node) => { recipientMenuRef.current = node; rRefs.setFloating(node); }}
                                                                    style={{ position: rStrategy, top: ry ?? 0, left: rx ?? 0 }}
                                                                    className="w-72 p-4 bg-white dark:bg-cyber-surface rounded-xl shadow-xl border border-slate-100 dark:border-cyber-border space-y-3 z-[60]"
                                                                >
                                                                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Manage Access</h4>
                                                                    <div className="max-h-60 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-cyber-border">
                                                                        {group.recipients.map(recipient => (
                                                                            <div key={recipient.share_id} className="flex items-center justify-between gap-4 border-b border-slate-50 dark:border-cyber-border/50 last:border-0 pb-2 last:pb-0 group/item">
                                                                                <div className="flex flex-col">
                                                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{recipient.name}</p>
                                                                                    <p className="text-xs text-slate-400 dark:text-slate-500">{recipient.email}</p>
                                                                                    <span className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${
                                                                                        recipient.status === 'accepted' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-500'
                                                                                    }`}>
                                                                                        {recipient.status}
                                                                                    </span>
                                                                                </div>
                                                                                <button 
                                                                                    onClick={() => confirmRemoveAccess({ shareId: recipient.share_id })}
                                                                                    className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                                                    title="Remove Access"
                                                                                >
                                                                                    <Trash2 className="size-4" />
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500 dark:text-slate-400 align-top relative group/row">
                                                    <div className="flex items-center justify-between">
                                                        {formatDate(new Date(group.created_at))}
                                                        <button
                                                            ref={(node) => openRowMenuId === group.document_id && tRefs.setReference(node)}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenRowMenuId(openRowMenuId === group.document_id ? null : group.document_id);
                                                            }}
                                                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-cyber-surface/80 rounded-lg opacity-0 group-hover/row:opacity-100 transition-opacity"
                                                        >
                                                            <MoreVertical className="size-4 text-slate-400 dark:text-slate-500" />
                                                        </button>
                                                    </div>

                                                    {openRowMenuId === group.document_id && (
                                                        <div
                                                            ref={(node) => { rowMenuRef.current = node; tRefs.setFloating(node); }}
                                                            style={{ position: tStrategy, top: ty ?? 0, left: tx ?? 0 }}
                                                            className="w-48 bg-white dark:bg-cyber-surface border border-slate-200 dark:border-cyber-border rounded-xl shadow-lg z-[70] overflow-hidden py-1"
                                                        >
                                                            <button onClick={() => { setOpenRowMenuId(null); confirmRemoveAccess({ docId: group.document_id }); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                                                                <Trash2 className="size-4" /> Remove All Access
                                                            </button>
                                                            <div className="h-px bg-slate-100 dark:bg-cyber-border/50 my-1" />
                                                            <button onClick={() => { setOpenRowMenuId(null); handleUnlock(group.document_id); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-cyber-border/30">
                                                                <Unlock className="size-4" /> Unlock File
                                                            </button>
                                                            <button onClick={() => { setOpenRowMenuId(null); toast.info("Rename coming soon"); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-cyber-border/30">
                                                                <Pencil className="size-4" /> Rename
                                                            </button>
                                                            <button onClick={() => { setOpenRowMenuId(null); toast.info("Move coming soon"); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-cyber-border/30">
                                                                <FolderInput className="size-4" /> Move File
                                                            </button>
                                                            <button onClick={() => { setOpenRowMenuId(null); toast.info("Sharing coming soon"); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-cyber-border/30">
                                                                <Share2 className="size-4" /> Share File
                                                            </button>
                                                            <button onClick={() => { 
                                                                setOpenRowMenuId(null); 
                                                                setSelectedDocForInfo({ ...group, document_id: group.document_id }); // Simulating doc object for group
                                                                setShowInfoModal(true);
                                                            }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-cyber-border/30">
                                                                <Info className="size-4" /> File Info
                                                            </button>
                                                            <button onClick={() => { setOpenRowMenuId(null); toast.info("Delete coming soon"); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold">
                                                                <Trash2 className="size-4" /> Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                )}
            </div>

            <DownloadReadyModal 
                show={showDownloadReadyModal}
                onClose={() => setShowDownloadReadyModal(false)}
                document={localDocs.find(d => d.document_id === selectedDocId)}
                onDownload={handleDownloadAndProceed}
            />

            <FileRetrievedModal 
                show={showKeepFileModal}
                onClose={() => setShowKeepFileModal(null)}
                onKeep={() => setShowKeepFileModal(null)}
                onDelete={() => { setShowKeepFileModal(null); toast.info("Contact owner to request deletion"); }}
            />

            <MoveFileModal 
                show={showMoveModal}
                onClose={() => setShowMoveModal(false)}
                onMove={(docId, folderId) => handleMove(folderId)}
                folders={folders}
                selectedDocId={selectedDocId}
            />

            {showInfoModal && (
                <FileInfoModal 
                    document={selectedDocForInfo}
                    onClose={() => setShowInfoModal(false)}
                />
            )}

            <ConfirmModal 
                show={showRemoveConfirm}
                title="Remove Access"
                message={removeData.shareId ? "Are you sure you want to remove access for this recipient?" : "Are you sure you want to remove ALL access to this document?"}
                confirmText="Remove Access"
                isDanger={true}
                isLoading={isRemoving}
                onConfirm={handleRemoveAccessAction}
                onCancel={() => { setShowRemoveConfirm(false); setRemoveData({ docId: null, shareId: null }); }}
            />
        </AuthenticatedLayout>
    );
}

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
import { SearchBar } from '@/Components/SearchBar';
import { ViewToggle } from '@/Components/ViewToggle';
import { DocumentList } from '@/Components/DocumentList';
import { sortDocuments } from '@/Utils/fileUtils';
import DocumentCard from '@/Components/DocumentCard';

export default function SharedDocuments({ documents, pendingShares, sentShares, folders, totalStorage, storageLimit, pendingSharesCount }) {
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('stegolock_view_mode_shared') || 'grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        fileFormat: 'all',
        status: 'all',
        owner: 'all',
        sort: 'date-newest'
    });

    const menuRef = useRef(null);
    const [localDocs, setLocalDocs] = useState(documents);
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
        setLocalDocs(documents);
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
            case 'pdf': return 'text-red-500 bg-red-50';
            case 'doc':
            case 'docx': return 'text-blue-500 bg-blue-50';
            case 'txt': return 'text-gray-600 bg-gray-50';
            default: return 'text-indigo-500 bg-indigo-50';
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
                <h2 className="text-3xl font-bold tracking-tight text-white">Shared Vault</h2>
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

            <div className="p-8 space-y-12 h-[calc(100vh-140px)] overflow-y-auto scrollbar-hide custom-scrollbar">
                {/* Pending Shares Section */}
                {pendingShares.length > 0 && !searchQuery && filters.fileFormat === 'all' && filters.status === 'all' && (
                    <section className="animate-fade-in">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                <Clock className="size-5 text-amber-500 shadow-glow-amber" />
                            </div>
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Pending Ingress Protocol</h3>
                            <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-500/20">
                                {pendingShares.length}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingShares.map(share => (
                                <div key={share.share_id} className="glass-panel p-6 rounded-3xl border-amber-500/20 flex items-center justify-between group hover:border-amber-500/40 transition-all duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 group-hover:bg-amber-500/20 transition-all">
                                            <UserPlus className="size-6 text-amber-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-white truncate max-w-[150px] tracking-tight">
                                                {share.document.filename}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                                From {share.sender.name}
                                            </p>
                                        </div>
                                    </div>
                                    {share.is_expired ? (
                                        <Tooltip content="Invitation expired. Please ask the owner to share again.">
                                            <div className="px-4 py-2.5 bg-red-500/10 text-red-500 text-[10px] font-black rounded-xl flex items-center gap-2 border border-red-500/20 cursor-help uppercase tracking-widest">
                                                <AlertCircle className="size-3" />
                                                Expired
                                            </div>
                                        </Tooltip>
                                    ) : (
                                        <button
                                            onClick={() => handleAcceptShare(share.document_id)}
                                            className="px-5 py-2.5 bg-amber-500 text-black text-[10px] font-black rounded-xl hover:bg-white transition-all flex items-center gap-2 uppercase tracking-widest"
                                        >
                                            <UserCheck className="size-3.5" />
                                            Accept
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Accepted Documents Grid */}
                <section className="animate-fade-in">
                    {pendingShares.length > 0 && !searchQuery && (
                        <div className="flex items-center gap-3 mb-6 pt-4">
                            <div className="p-2 bg-cyber-accent/10 border border-cyber-accent/20 rounded-lg">
                                <FolderOpen className="size-5 text-cyber-accent shadow-glow-cyan" />
                            </div>
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Authorized Modules</h3>
                        </div>
                    )}

                    {filteredDocs.length > 0 ? (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
                        <div className="glass-panel rounded-[3rem] p-20 text-center border-2 border-dashed border-cyber-border/50 bg-cyber-surface/10">
                            <div className="w-20 h-20 bg-cyber-surface rounded-3xl flex items-center justify-center mx-auto mb-6 border border-cyber-border group shadow-inner">
                                <Share2 className="size-10 text-slate-700 group-hover:text-cyber-accent transition-colors" />
                            </div>
                            <h4 className="text-white text-xl font-bold mb-2 tracking-tight">
                                {searchQuery || filters.fileFormat !== 'all' ? "No matching modules" : "Shared vault is empty"}
                            </h4>
                            <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">
                                {searchQuery || filters.fileFormat !== 'all' ? "Try adjusting your search parameters to find the module." : "When someone shares a secure document with you, it will manifest here."}
                            </p>
                        </div>
                    )}
                </section>

                {/* Sent Shares Section */}
                {sentShares && sentShares.length > 0 && (
                    <section className="pt-12 border-t border-cyber-border/30 animate-fade-in">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-lg">
                                <Share2 className="size-5 text-fuchsia-400 shadow-glow-fuchsia" />
                            </div>
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Outbound Transmissions</h3>
                            <span className="bg-fuchsia-500/10 text-fuchsia-400 text-[10px] font-black px-2.5 py-1 rounded-full border border-fuchsia-500/20">
                                {sentShares.length}
                            </span>
                        </div>
                        <div className="glass-panel rounded-[2.5rem] border-cyber-border/50 overflow-hidden bg-cyber-surface/10">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-cyber-surface/50 text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] border-b border-cyber-border/30">
                                        <tr>
                                            <th className="px-8 py-5">Secure Module</th>
                                            <th className="px-8 py-5">Recipients</th>
                                            <th className="px-8 py-5">Initialization</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-cyber-border/20">
                                        {sentShares.map(group => (
                                            <tr key={group.document_id} className="hover:bg-cyber-surface/30 transition-all group/row">
                                                <td className="px-8 py-6 align-top">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`p-3 rounded-2xl bg-cyber-surface border border-cyber-border group-hover/row:border-fuchsia-500/50 transition-all`}>
                                                            <FileText className={`size-5 ${getFileColor(group.file_type).split(' ')[0]}`} />
                                                        </div>
                                                        <span className="font-bold text-white tracking-tight group-hover/row:text-fuchsia-400 transition-colors">{group.filename}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {group.recipients.length === 1 ? (
                                                        <div className="flex items-center justify-between group/single bg-cyber-surface/40 p-4 rounded-2xl border border-cyber-border/50 hover:border-fuchsia-500/30 transition-all">
                                                            <div className="flex flex-col">
                                                                <p className="text-sm font-bold text-slate-200">{group.recipients[0].name}</p>
                                                                <p className="text-[10px] font-medium text-slate-500 mt-0.5">{group.recipients[0].email}</p>
                                                                <span className={`text-[9px] font-black uppercase tracking-[0.2em] mt-2 inline-flex items-center gap-1.5 ${
                                                                    group.recipients[0].status === 'accepted' ? 'text-cyber-accent' : 'text-amber-500'
                                                                }`}>
                                                                    <div className={`size-1.5 rounded-full ${group.recipients[0].status === 'accepted' ? 'bg-cyber-accent shadow-glow-cyan' : 'bg-amber-500 shadow-glow-amber'}`} />
                                                                    {group.recipients[0].status}
                                                                </span>
                                                            </div>
                                                            <button 
                                                                onClick={() => confirmRemoveAccess({ shareId: group.recipients[0].share_id })}
                                                                className="p-2.5 text-slate-600 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl transition-all"
                                                                title="Revoke Access"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <button
                                                                ref={(node) => openRecipientsId === group.document_id && rRefs.setReference(node)}
                                                                onClick={() => setOpenRecipientsId(openRecipientsId === group.document_id ? null : group.document_id)}
                                                                className="flex items-center gap-3 text-fuchsia-400 hover:text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all bg-fuchsia-500/10 px-5 py-3 rounded-xl border border-fuchsia-500/20 hover:border-fuchsia-500/50"
                                                            >
                                                                Manifest {group.recipients.length} Recipient Node{group.recipients.length > 1 ? 's' : ''}
                                                                {openRecipientsId === group.document_id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                                            </button>

                                                            {openRecipientsId === group.document_id && (
                                                                <div
                                                                    ref={(node) => { recipientMenuRef.current = node; rRefs.setFloating(node); }}
                                                                    style={{ position: rStrategy, top: ry ?? 0, left: rx ?? 0 }}
                                                                    className="w-80 p-5 glass-panel rounded-3xl border border-cyber-border/50 shadow-2xl z-[60] animate-fade-in"
                                                                >
                                                                    <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-5 ml-1 flex items-center gap-2">
                                                                        <div className="size-1.5 bg-fuchsia-500 rounded-full" />
                                                                        Access Control List
                                                                    </h4>
                                                                    <div className="max-h-64 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                                                                        {group.recipients.map(recipient => (
                                                                            <div key={recipient.share_id} className="flex items-center justify-between gap-4 border-b border-cyber-border/30 last:border-0 pb-4 last:pb-0 group/item">
                                                                                <div className="flex flex-col min-w-0">
                                                                                    <p className="text-sm font-bold text-white truncate">{recipient.name}</p>
                                                                                    <p className="text-[10px] font-medium text-slate-500 truncate mt-0.5">{recipient.email}</p>
                                                                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] mt-2 inline-flex items-center gap-1.5 ${
                                                                                        recipient.status === 'accepted' ? 'text-cyber-accent' : 'text-amber-500'
                                                                                    }`}>
                                                                                        <div className={`size-1.5 rounded-full ${recipient.status === 'accepted' ? 'bg-cyber-accent shadow-glow-cyan' : 'bg-amber-500 shadow-glow-amber'}`} />
                                                                                        {recipient.status}
                                                                                    </span>
                                                                                </div>
                                                                                <button 
                                                                                    onClick={() => confirmRemoveAccess({ shareId: recipient.share_id })}
                                                                                    className="p-2.5 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/20 transition-all"
                                                                                    title="Revoke Access"
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
                                                <td className="px-8 py-6 text-slate-500 align-top relative">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold uppercase tracking-widest tabular-nums">{formatDate(new Date(group.created_at))}</span>
                                                        <button
                                                            ref={(node) => openRowMenuId === group.document_id && tRefs.setReference(node)}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenRowMenuId(openRowMenuId === group.document_id ? null : group.document_id);
                                                            }}
                                                            className="p-2.5 bg-cyber-surface hover:bg-slate-800 border border-cyber-border rounded-xl opacity-0 group-hover/row:opacity-100 transition-all hover:text-white"
                                                        >
                                                            <MoreVertical className="size-4" />
                                                        </button>
                                                    </div>

                                                    {openRowMenuId === group.document_id && (
                                                        <div
                                                            ref={(node) => { rowMenuRef.current = node; tRefs.setFloating(node); }}
                                                            style={{ position: tStrategy, top: ty ?? 0, left: tx ?? 0 }}
                                                            className="w-56 glass-panel border border-cyber-border/50 rounded-2xl shadow-2xl z-[70] overflow-hidden py-2 animate-fade-in"
                                                        >
                                                            <button onClick={() => { setOpenRowMenuId(null); handleUnlock(group.document_id); }} className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-300 hover:bg-cyber-accent hover:text-cyber-void transition-all">
                                                                <Unlock className="size-4" /> Unlock Module
                                                            </button>
                                                            <button onClick={() => { setOpenRowMenuId(null); setSelectedDocForInfo({ ...group, document_id: group.document_id }); setShowInfoModal(true); }} className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-300 hover:bg-cyber-accent hover:text-cyber-void transition-all">
                                                                <Info className="size-4" /> Data Integrity
                                                            </button>
                                                            <div className="h-px bg-cyber-border/30 my-2 mx-2" />
                                                            <button onClick={() => { setOpenRowMenuId(null); confirmRemoveAccess({ docId: group.document_id }); }} className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500 hover:text-white transition-all">
                                                                <Trash2 className="size-4" /> Revoke All Access
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

            {/* Inlined Modals */}
            {showDownloadReadyModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-cyber-void/80 backdrop-blur-sm" onClick={() => setShowDownloadReadyModal(false)} />
                    <div className="glass-panel w-full max-w-md overflow-hidden transform transition-all shadow-2xl rounded-[2.5rem] border-cyber-accent/20 relative z-10 animate-fade-in">
                        <div className="bg-cyber-accent/10 p-10 text-center relative border-b border-cyber-border">
                            <button 
                                onClick={() => setShowDownloadReadyModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                            <div className="inline-flex items-center justify-center w-24 h-24 bg-cyber-accent/20 rounded-[2rem] mb-6 shadow-glow-cyan border border-cyber-accent/30">
                                <CheckCircle className="size-12 text-cyber-accent" />
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">Protocol Alpha</h2>
                            <p className="text-cyber-accent font-black text-[10px] tracking-[0.4em] uppercase mt-1">Extraction Matrix Stable</p>
                        </div>
                        
                        <div className="p-10">
                            <div className="bg-cyber-surface/50 rounded-3xl p-6 mb-8 border border-cyber-border flex items-center gap-5 shadow-inner">
                                <div className="p-4 bg-cyber-accent/10 rounded-2xl border border-cyber-accent/20">
                                    <Shield className="size-8 text-cyber-accent" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-lg font-bold text-white truncate tracking-tight">
                                        {localDocs.find(d => d.document_id === selectedDocId)?.filename}
                                    </p>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Ready for local manifest</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => setShowDownloadReadyModal(false)}
                                    className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 bg-cyber-surface hover:bg-slate-800 rounded-2xl transition-all border border-cyber-border"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => handleDownloadAndProceed(selectedDocId)}
                                    className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-cyber-void bg-cyber-accent hover:bg-white rounded-2xl transition-all shadow-glow-cyan flex items-center justify-center gap-3"
                                >
                                    <Download className="size-4" />
                                    Download
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showKeepFileModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-cyber-void/80 backdrop-blur-sm" onClick={() => setShowKeepFileModal(null)} />
                    <div className="glass-panel w-full max-w-md overflow-hidden transform transition-all shadow-2xl rounded-[2.5rem] border-cyber-accent/20 relative z-10 animate-fade-in">
                        <div className="bg-cyber-accent/10 p-10 text-center relative border-b border-cyber-border">
                            <div className="inline-flex items-center justify-center w-24 h-24 bg-cyber-accent/20 rounded-[2rem] mb-6 shadow-glow-cyan border border-cyber-accent/30">
                                <Shield className="size-12 text-cyber-accent" />
                            </div>
                            <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">Secure Retraction</h2>
                            <p className="text-cyber-accent font-black text-[10px] tracking-[0.4em] uppercase mt-1">Data Stream Terminated</p>
                        </div>
                        
                        <div className="p-10">
                            <p className="text-sm text-slate-400 text-center mb-10 leading-relaxed font-medium">
                                The module has been successfully manifested. We recommend purging the temporary server decryption for maximum security density.
                            </p>

                            <button 
                                onClick={() => setShowKeepFileModal(null)}
                                className="w-full px-8 py-4 text-[11px] font-black uppercase tracking-widest text-cyber-void bg-cyber-accent hover:bg-white rounded-2xl transition-all shadow-glow-cyan"
                            >
                                Acknowledge & Purge
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showMoveModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-cyber-void/80 backdrop-blur-sm" onClick={() => setShowMoveModal(false)} />
                    <div className="glass-panel w-full max-w-md overflow-hidden transform transition-all shadow-2xl rounded-[2.5rem] border-cyber-accent/20 relative z-10 animate-fade-in">
                        <div className="bg-cyber-accent/10 p-10 text-center relative border-b border-cyber-border">
                            <button 
                                onClick={() => setShowMoveModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-cyber-accent/20 rounded-3xl mb-6 shadow-glow-cyan border border-cyber-accent/30">
                                <FolderTree className="size-10 text-cyber-accent" />
                            </div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Relocate Module</h2>
                            <p className="text-slate-400 text-sm mt-2">Adjust vault coordinates</p>
                        </div>
                        
                        <div className="p-10">
                            <div className="max-h-64 overflow-y-auto space-y-3 pr-3 custom-scrollbar mb-8">
                                <button 
                                    onClick={() => handleMove(null)} 
                                    className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-cyber-surface/50 hover:bg-cyber-accent/10 transition-all border border-cyber-border hover:border-cyber-accent/40 group text-left shadow-inner"
                                >
                                    <div className="p-2.5 bg-cyber-surface rounded-xl border border-cyber-border group-hover:border-cyber-accent/30">
                                        <FolderOpen className="size-6 text-slate-500 group-hover:text-cyber-accent transition-colors" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-300 group-hover:text-white">Root Infrastructure</span>
                                </button>
                                {folders.map(folder => (
                                    <button 
                                        key={folder.folder_id} 
                                        onClick={() => handleMove(folder.folder_id)} 
                                        className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-cyber-surface/50 hover:bg-cyber-accent/10 transition-all border border-cyber-border hover:border-cyber-accent/40 group text-left shadow-inner"
                                    >
                                        <div className="p-2.5 bg-cyber-surface rounded-xl border border-cyber-border group-hover:border-cyber-accent/30">
                                            <FolderTree className="size-6 text-cyber-accent" />
                                        </div>
                                        <span className="text-sm font-bold text-slate-300 group-hover:text-white truncate">{folder.name}</span>
                                    </button>
                                ))}
                            </div>
                            
                            <div className="flex justify-end">
                                <button onClick={() => setShowMoveModal(false)} className="px-8 py-3.5 text-[11px] font-black uppercase tracking-widest text-slate-400 bg-cyber-surface hover:bg-slate-800 rounded-xl transition-all border border-cyber-border">
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showInfoModal && (
                <FileInfoModal 
                    document={selectedDocForInfo}
                    onClose={() => setShowInfoModal(false)}
                />
            )}

            <ConfirmModal 
                show={showRemoveConfirm}
                title="Revoke Protocol"
                message={removeData.shareId ? "Are you sure you want to revoke access for this recipient node?" : "Are you sure you want to revoke ALL external access to this secure module?"}
                confirmText="Revoke Access"
                isDanger={true}
                isLoading={isRemoving}
                onConfirm={handleRemoveAccessAction}
                onCancel={() => { setShowRemoveConfirm(false); setRemoveData({ docId: null, shareId: null }); }}
            />
        </AuthenticatedLayout>
    );
}

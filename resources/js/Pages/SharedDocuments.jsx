import { Shield, FileText, Star, MoreVertical,
    Unlock, Pencil, FolderInput, Share2, Info, Trash2, Lock, Loader2, AlertCircle, FolderOpen, FolderTree, UserCheck, UserPlus, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatBytes, formatDate } from '@/Utils/fileUtils';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
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

export default function SharedDocuments({ documents, pendingShares, sentShares, folders, totalStorage, storageLimit, pendingSharesCount }) {
    const menuRef = useRef(null);
    const [localDocs, setLocalDocs] = useState(documents);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [openRecipientsId, setOpenRecipientsId] = useState(null);
    const [openRowMenuId, setOpenRowMenuId] = useState(null);
    const [selectedDocId, setSelectedDocId] = useState(null);
    const [showKeepFileModal, setShowKeepFileModal] = useState(null);
    const [unlockingProgress, setUnlockingProgress] = useState(() => {
        const saved = localStorage.getItem('stegolock_unlocking_progress_shared');
        return saved ? JSON.parse(saved) : {};
    });

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
                    if (doc.status === 'decrypted' && prevStatus && prevStatus !== 'decrypted') {
                        toast.success(`${doc.filename} is unlocked successfully`);
                        window.location.href = `/documents/download/${doc.document_id}`;
                        setShowKeepFileModal(doc.document_id);
                        setSelectedDocId(doc.document_id);
                    }
                });
                setLocalDocs(updatedDocs);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [localDocs]);

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
        if (unlockingProgress[docId]) return 'Unlocking...';
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

    const handleRemoveAccess = async ({ docId = null, shareId = null }) => {
        const msg = shareId 
            ? 'Are you sure you want to remove access for this recipient?' 
            : 'Are you sure you want to remove ALL access to this document?';
            
        if (!confirm(msg)) return;
        
        const toastId = toast.loading('Removing access...');
        try {
            await axios.post(route('documents.share.remove'), {
                document_id: docId,
                share_id: shareId
            });
            toast.success('Access removed successfully', { id: toastId });
            router.reload();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to remove access', { id: toastId });
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
            header={<h2 className="text-xl font-semibold text-gray-800">Shared With Me</h2>}
            totalStorage={totalStorage}
            storageLimit={storageLimit}
        >
            <Head title="Shared With Me" />

            <div className="p-6 space-y-8">
                {/* Pending Shares Section */}
                {pendingShares.length > 0 && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="size-5 text-indigo-600" />
                            <h3 className="text-lg font-bold text-gray-900">Pending Shares</h3>
                            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">
                                {pendingShares.length}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingShares.map(share => (
                                <div key={share.share_id} className="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 flex items-center justify-between group hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-50 rounded-lg">
                                            <UserPlus className="size-6 text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 truncate max-w-[150px]">
                                                {share.document.filename}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                from {share.sender.name}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAcceptShare(share.document_id)}
                                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                                    >
                                        <UserCheck className="size-4" />
                                        Accept
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Accepted Documents Grid */}
                <section>
                    {pendingShares.length > 0 && (
                        <div className="flex items-center gap-2 mb-4">
                            <FolderOpen className="size-5 text-gray-600" />
                            <h3 className="text-lg font-bold text-gray-900">Shared Files</h3>
                        </div>
                    )}

                    {localDocs.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {localDocs.map(doc => (
                                <div key={doc.document_id} className="group relative p-4 bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer border border-transparent hover:border-indigo-200">
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition z-10">
                                        <button
                                            ref={(node) => openMenuId === doc.document_id && refs.setReference(node)}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === doc.document_id ? null : doc.document_id);
                                            }}
                                        >
                                            <MoreVertical className="size-8 text-gray-400 hover:bg-gray-100 rounded-md p-1.5" />
                                        </button>
                                    </div>

                                    <div className="relative mb-3">
                                        <FileText className={"size-14 rounded-xl p-2 " + getFileColor(doc.file_type)} />
                                        {['stored', 'decrypted', 'retrieved', 'failed'].indexOf(doc.status) === -1 && (
                                            <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                                                <Loader2 className="size-5 text-indigo-600 animate-spin" />
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-md font-semibold text-gray-800 mb-1 truncate" title={doc.filename}>
                                        {doc.filename}
                                    </h3>
                                    
                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                        <span>{formatBytes(doc.in_cloud_size || doc.original_size)}</span>
                                        <span>{formatDate(new Date(doc.created_at))}</span>
                                    </div>

                                    {openMenuId === doc.document_id && (
                                            <div
                                                ref={(node) => { menuRef.current = node; refs.setFloating(node); }}
                                                style={{ position: strategy, top: y ?? 0, left: x ?? 0 }}
                                                className="w-48 bg-white border rounded-xl shadow-lg z-50 overflow-hidden py-1"
                                            >
                                            <button
                                                onClick={() => handleUnlock(doc.document_id)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50"
                                            >
                                                <Unlock className="w-4 h-4 text-gray-600" />
                                                Unlock File
                                            </button>
                                            <button
                                                onClick={() => openMoveModal(doc.document_id)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50"
                                            >
                                                <FolderInput className="w-4 h-4 text-gray-600" />
                                                Move File
                                            </button>
                                            <button
                                                onClick={() => { setOpenMenuId(null); toast.info("Shared file info coming soon"); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50"
                                            >
                                                <Info className="w-4 h-4 text-gray-600" />
                                                File Info
                                            </button>
                                            <div className="border-t" />
                                            <button
                                                onClick={() => { setOpenMenuId(null); handleRemoveAccess({ docId: doc.document_id }); }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-red-50 text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                                Remove Access
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <Share2 className="size-8 text-gray-300" />
                            </div>
                            <h4 className="text-gray-900 font-semibold mb-1">No shared files yet</h4>
                            <p className="text-gray-500 text-sm">When someone shares a file with you, it will appear here.</p>
                        </div>
                    )}
                </section>

                {/* Sent Shares Section */}
                {sentShares && sentShares.length > 0 && (
                    <section className="pt-8 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-4">
                            <Share2 className="size-5 text-indigo-600" />
                            <h3 className="text-lg font-bold text-gray-900">Shared by Me</h3>
                            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded-full">
                                {sentShares.length}
                            </span>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-3">Document</th>
                                        <th className="px-6 py-3">Recipients</th>
                                        <th className="px-6 py-3">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {sentShares.map(group => (
                                        <tr key={group.document_id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 align-top">
                                                <div className="flex items-center gap-3">
                                                    <FileText className={`size-5 ${getFileColor(group.file_type)}`} />
                                                    <span className="font-medium text-gray-900">{group.filename}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {group.recipients.length === 1 ? (
                                                    <div className="flex items-center justify-between group/single">
                                                        <div className="flex flex-col">
                                                            <p className="text-sm font-medium text-gray-700">{group.recipients[0].name}</p>
                                                            <p className="text-xs text-gray-400">{group.recipients[0].email}</p>
                                                            <span className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${
                                                                group.recipients[0].status === 'accepted' ? 'text-green-600' : 'text-yellow-600'
                                                            }`}>
                                                                {group.recipients[0].status}
                                                            </span>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleRemoveAccess({ shareId: group.recipients[0].share_id })}
                                                            className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover/single:opacity-100 transition-all"
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
                                                            className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors"
                                                        >
                                                            Shared to {group.recipients.length} people
                                                            {openRecipientsId === group.document_id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                                        </button>

                                                        {openRecipientsId === group.document_id && (
                                                            <div
                                                                ref={(node) => { recipientMenuRef.current = node; rRefs.setFloating(node); }}
                                                                style={{ position: rStrategy, top: ry ?? 0, left: rx ?? 0 }}
                                                                className="w-72 p-4 bg-white rounded-xl shadow-xl border border-gray-100 space-y-3 z-[60]"
                                                            >
                                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Manage Access</h4>
                                                                <div className="max-h-60 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-gray-200">
                                                                    {group.recipients.map(recipient => (
                                                                        <div key={recipient.share_id} className="flex items-center justify-between gap-4 border-b border-gray-50 last:border-0 pb-2 last:pb-0 group/item">
                                                                            <div className="flex flex-col">
                                                                                <p className="text-sm font-medium text-gray-700">{recipient.name}</p>
                                                                                <p className="text-xs text-gray-400">{recipient.email}</p>
                                                                                <span className={`text-[9px] font-bold uppercase tracking-wider mt-1 ${
                                                                                    recipient.status === 'accepted' ? 'text-green-600' : 'text-yellow-600'
                                                                                }`}>
                                                                                    {recipient.status}
                                                                                </span>
                                                                            </div>
                                                                            <button 
                                                                                onClick={() => handleRemoveAccess({ shareId: recipient.share_id })}
                                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                                            <td className="px-6 py-4 text-gray-500 align-top relative group/row">
                                                <div className="flex items-center justify-between">
                                                    {formatDate(new Date(group.created_at))}
                                                    <button
                                                        ref={(node) => openRowMenuId === group.document_id && tRefs.setReference(node)}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenRowMenuId(openRowMenuId === group.document_id ? null : group.document_id);
                                                        }}
                                                        className="p-1.5 hover:bg-gray-100 rounded-lg opacity-0 group-hover/row:opacity-100 transition-opacity"
                                                    >
                                                        <MoreVertical className="size-4 text-gray-400" />
                                                    </button>
                                                </div>

                                                {openRowMenuId === group.document_id && (
                                                    <div
                                                        ref={(node) => { rowMenuRef.current = node; tRefs.setFloating(node); }}
                                                        style={{ position: tStrategy, top: ty ?? 0, left: tx ?? 0 }}
                                                        className="w-48 bg-white border rounded-xl shadow-lg z-[70] overflow-hidden py-1"
                                                    >
                                                        <button onClick={() => { setOpenRowMenuId(null); handleRemoveAccess({ docId: group.document_id }); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                                            <Trash2 className="size-4" /> Remove All Access
                                                        </button>
                                                        <div className="h-px bg-gray-100 my-1" />
                                                        <button onClick={() => { setOpenRowMenuId(null); handleUnlock(group.document_id); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                            <Unlock className="size-4" /> Unlock File
                                                        </button>
                                                        <button onClick={() => { setOpenRowMenuId(null); toast.info("Rename coming soon"); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                            <Pencil className="size-4" /> Rename
                                                        </button>
                                                        <button onClick={() => { setOpenRowMenuId(null); toast.info("Move coming soon"); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                            <FolderInput className="size-4" /> Move File
                                                        </button>
                                                        <button onClick={() => { setOpenRowMenuId(null); toast.info("Sharing coming soon"); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                            <Share2 className="size-4" /> Share File
                                                        </button>
                                                        <button onClick={() => { setOpenRowMenuId(null); toast.info("File info coming soon"); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                            <Info className="size-4" /> File Info
                                                        </button>
                                                        <button onClick={() => { setOpenRowMenuId(null); toast.info("Delete coming soon"); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium">
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
                    </section>
                )}
            </div>

            {showKeepFileModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl w-80 p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">File Unlocked</h2>
                        <p className="text-sm text-gray-500 mb-6">Your shared file has been successfully decrypted and downloaded.</p>
                        <button
                            onClick={() => setShowKeepFileModal(null)}
                            className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {showMoveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowMoveModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl w-80 p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Move to Folder</h2>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            <button
                                onClick={() => handleMove(null)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition text-left"
                            >
                                <FolderOpen className="size-5 text-gray-400" />
                                <span className="text-sm text-gray-700">Root Directory</span>
                            </button>
                            {folders.map(folder => (
                                <button
                                    key={folder.folder_id}
                                    onClick={() => handleMove(folder.folder_id)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition text-left"
                                >
                                    <FolderTree className="size-5 text-indigo-500" />
                                    <span className="text-sm text-gray-700 truncate">{folder.name}</span>
                                </button>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowMoveModal(false)}
                                className="px-4 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

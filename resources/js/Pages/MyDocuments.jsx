import { Shield, FileText, Star, MoreVertical,
    Unlock, Pencil, FolderInput, Share2, Info, Trash2, Lock, Loader2, AlertCircle, FolderOpen, FolderTree, ArrowLeft } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatBytes, formatDate } from '@/Utils/fileUtils';
import { Inertia } from '@inertiajs/inertia';
import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import Tooltip from '@/Components/Tooltip';
import { ShareFileModal } from '@/Components/modals/ShareFileModal';

// ADD THIS
import {
    useFloating,
    offset,
    flip,
    shift,
    autoUpdate,
    size
} from '@floating-ui/react';


export default function MyDocuments({ documents, folders, currentFolder, totalStorage, storageLimit, title = "My Documents" }) {

    const menuRef = useRef(null);

    const [localDocs, setLocalDocs] = useState(documents);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [selectedDocId, setSelectedDocId] = useState(null);
    const [selectedDocForShare, setSelectedDocForShare] = useState(null);
    const [showKeepFileModal, setShowKeepFileModal] = useState(null);
    const [unlockingProgress, setUnlockingProgress] = useState(() => {
        const saved = localStorage.getItem('stegolock_unlocking_progress');
        return saved ? JSON.parse(saved) : {};
    });

    const updateUnlockingProgress = (id, startTime = Date.now()) => {
        setUnlockingProgress(prev => {
            const next = startTime ? { ...prev, [id]: startTime } : { ...prev };
            if (!startTime) delete next[id];
            localStorage.setItem('stegolock_unlocking_progress', JSON.stringify(next));
            return next;
        });
    };

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Update localDocs when props change (initial load or manual reload)
    useEffect(() => {
        setLocalDocs(documents);
        
        // Detect if any document is stuck in 'retrieved' or 'decrypted' status on mount
        const stuckDoc = documents.find(doc => doc.status === 'retrieved' || doc.status === 'decrypted');
        if (stuckDoc && !showKeepFileModal) {
            setShowKeepFileModal(stuckDoc.document_id);
            setSelectedDocId(stuckDoc.document_id);
        }
    }, [documents]);

    // Polling logic for all processing documents
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
                            
                            // If it's finished or failed, remove from unlockingProgress
                            if (['decrypted', 'failed'].includes(data.status)) {
                                updateUnlockingProgress(doc.document_id, null);
                            }

                            return { ...doc, ...data };
                        } catch (e) {
                            console.error("Failed to fetch status for", doc.document_id);
                            return doc;
                        }
                    }
                    return doc;
                })
            );

            // Check if anything actually changed to avoid unnecessary re-renders
            if (JSON.stringify(updatedDocs) !== JSON.stringify(localDocs)) {
                
                // Detect newly finished documents
                updatedDocs.forEach((doc, index) => {
                    const prevStatus = localDocs[index]?.status;
                    if (doc.status === 'stored' && prevStatus && prevStatus !== 'stored' && !['decrypted', 'retrieved'].includes(prevStatus)) {
                        toast.success(`${doc.filename} is locked successfully`);
                    }
                    if (doc.status === 'decrypted' && prevStatus && prevStatus !== 'decrypted') {
                        toast.success(`${doc.filename} is unlocked successfully`);
                    }
                });

                setLocalDocs(updatedDocs);
                
                // If any document just finished, reload to update storage info etc.
                const justFinished = updatedDocs.find((doc, index) => 
                    (doc.status === 'stored' || doc.status === 'decrypted') && 
                    localDocs[index].status !== doc.status
                );

                if (justFinished) {
                    router.reload({ only: ['totalStorage', 'storageLimit'] });
                    
                    // If it just decrypted, trigger download
                    if (justFinished.status === 'decrypted') {
                        window.location.href = `/documents/download/${justFinished.document_id}`;
                        setShowKeepFileModal(justFinished.document_id);
                        setSelectedDocId(justFinished.document_id);
                    }
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [localDocs]);

    const getStatusDisplay = (status, docId) => {
        // Handle Simulated Progress for Unlocking
        if (unlockingProgress[docId]) {
            const elapsed = Date.now() - unlockingProgress[docId];
            if (elapsed < 2000) return 'Fetching stego files';
            if (elapsed < 4000) return 'Extracting fragments';
            if (elapsed < 6000) return 'Reconstructing file';
            return 'Decrypting file';
        }

        switch (status) {
            case 'uploaded': return 'Initializing...';
            case 'encrypted': return 'Encrypting file...';
            case 'fragmented': return 'Embedding file...';
            case 'mapped': return 'Embedding file...';
            case 'embedded': return 'Storing file...';
            case 'stored': return 'Stored';
            case 'extracted': return 'Reconstructing file...';
            case 'reconstructed': return 'Decrypting file...';
            case 'decrypted': return 'Decrypted';
            case 'retrieved': return 'Retrieved';
            case 'failed': return 'Error';
            default: return status.charAt(0).toUpperCase() + status.slice(1);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'stored':
            case 'decrypted':
            case 'retrieved':
                return 'bg-green-100 text-green-700';
            case 'failed':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-indigo-100 text-indigo-700';
        }
    };

    const toggleMenu = (id) => {
        setOpenMenuId(prev => (prev === id ? null : id));
    };

    const getFileColor = (type) => {
        switch (type) {
            case 'pdf':
                return 'text-red-500 bg-red-50';
            case 'doc':
            case 'docx':
                return 'text-blue-500 bg-blue-50';
            case 'txt':
                return 'text-gray-600 bg-gray-50';
            default:
                return 'Unknown File Type';
        }
    };

    // (Floating UI setup)
    const { x, y, strategy, refs } = useFloating({
        placement: 'bottom-end',
        middleware: [
            offset(8),

            flip({
                boundary: 'viewport',
            }),

            shift({
                boundary: 'viewport',
                padding: 8
            })
        ],

        whileElementsMounted: autoUpdate
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openMenuId && menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuId]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') cancelDelete();
        };

        if (showDeleteModal) {
            document.addEventListener('keydown', handleEsc);
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
        };
    }, [showDeleteModal]);

    const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = ''; // required for Chrome to show prompt
    };

    // handleUnlockFile
    const handleUnlock = async (id) => {

        setOpenMenuId(null);

        const toastId = toast.loading('Unlocking file...', { duration: 3000 });
        try {
            // enable warning
            window.addEventListener('beforeunload', handleBeforeUnload);

            // Unlock
            try {
                const resp = await axios.post('/documents/unlock', {
                    document_id: id
                });

                if (resp.data.success) {
                    toast.dismiss(toastId);
                    
                    // Start simulated progress tracking
                    updateUnlockingProgress(id);

                    // Update local status immediately
                    setLocalDocs(prev => prev.map(doc => 
                        doc.document_id === id ? { ...doc, status: resp.data.status } : doc
                    ));
                }

            } finally {
                // disable warning after request finishes
                window.removeEventListener('beforeunload', handleBeforeUnload);
            }

        } catch (err) {
            console.log('Error: ',err);
            console.log('Unlock response:', err.response?.data);
            toast.error('Unlock failed', { id: toastId });
        }
        
        // The global polling effect will handle the download redirection 
        // when status changes to 'decrypted'
    };

    // The auto-download is now handled directly in the polling effect for better reliability

    //handleFileInfo
    const handleFileInfo = async (id) => {
        router.get('/documents/getFileInfo', { id });
    };

    // handleMove
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

    // openDeleteModal
    const openDeleteModal = (id) => {
            setOpenMenuId(null);
            setSelectedDocId(id);
            setShowDeleteModal(true);
        };

    // confirmDelete
    const confirmDelete = async () => {
        if (!selectedDocId) return;

        setShowDeleteModal(false);
        setSelectedDocId(null);

        const toastId = toast.loading('Deleting document...');
        try {
            const resp = await axios.post('/documents/delete', {
                document_id: selectedDocId,
            });

            console.log(resp.data);

            toast.success('Document deleted successfully', { id: toastId });

            sleep(1000);
            // optional: refresh list
            router.reload();

        } catch (err) {
            console.error(err);
            toast.error('Failed to delete document', { id: toastId });
        }
    };

    // cancelDelete
    const cancelDelete = () => {
        setShowDeleteModal(false);
        setSelectedDocId(null);
    };

    // after download
    const handleDeleteFromKeepModal = () => {
        openDeleteModal(showKeepFileModal);
        setShowKeepFileModal(null);
    };

    // after download
    const keepFile = async () => {
        const doc = localDocs.find(d => d.document_id === selectedDocId);
        const filename = doc ? doc.filename : 'File';

        //toast steps
        const toastId = toast.loading(`Keeping ${filename}...`);

        try {
            const resp = await axios.post('/documents/keep', {
                document_id: selectedDocId
            });

            await sleep(2000);
            toast.success(`${filename} is kept.`, { id: toastId });

            setShowKeepFileModal(null);
            setSelectedDocId(null);
        } catch (err) {
            toast.error(`Failed to keep ${filename}.`, { id: toastId });
        }
    };


    // scan cover files
    const scanCovers =  async() => {
        const resp = await axios.post('/covers/scan');
    };

    // handleToggleStar
    const handleToggleStar = async (id) => {
        try {
            const resp = await axios.post(route('documents.star.toggle'), {
                document_id: id
            });
            
            if (resp.data.is_starred !== undefined) {
                setLocalDocs(prev => prev.map(doc => 
                    doc.document_id === id ? { ...doc, is_starred: resp.data.is_starred } : doc
                ));
                toast.success(resp.data.message);
            }
        } catch (err) {
            toast.error('Failed to update star status');
        }
    };


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
                            <ArrowLeft className="size-6 text-gray-600" />
                        </button>
                    )}
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        {currentFolder ? currentFolder.name : title}
                    </h2>
                </div>
            }
            totalStorage={totalStorage}
            storageLimit={storageLimit}
            hasProcessingDocs={localDocs.some(doc => unlockingProgress[doc.document_id] || !['stored', 'decrypted', 'retrieved', 'failed'].includes(doc.status))}
        >
            <Head title="My Documents"/>

            {/* GRID VIEW (DEFAULT) */}
            {localDocs.length > 0 ? (
                <div className="h-full overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                        {localDocs.map(doc => {
                            const isUnlocking = !!unlockingProgress[doc.document_id];
                            const isProcessing = isUnlocking || !['stored', 'decrypted', 'retrieved', 'failed'].includes(doc.status);
                            const processType = isUnlocking ? "Unlocking" : "Locking";
                            
                            return (
                                <div
                                    key={doc.document_id}
                                    title={isProcessing ? `${processType} file is ongoing...` : undefined}
                                    className={"group relative w-full p-4 bg-white rounded-lg shadow transition " + 
                                        (isProcessing ? "border-2 border-indigo-100 bg-indigo-50/10 cursor-wait" : "hover:shadow-lg hover:ring-1 hover:ring-purple-600 cursor-pointer")}
                                >
                                    {!isProcessing && (
                                        <div className={"absolute top-0 right-0 p-4 transition space-x-1 z-10 " + 
                                            (openMenuId === doc.document_id ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                                            {/* Star */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleStar(doc.document_id);
                                                }}
                                            >
                                                <Star 
                                                    className={"size-8 hover:bg-gray-100 rounded-md p-1.5 transition " + 
                                                        (doc.is_starred ? "text-yellow-400 fill-yellow-400" : "text-gray-400")} 
                                                />
                                            </button>

                                            {/* Vertical 3-Dot Menu */}
                                            <button
                                                ref={(node) => {
                                                    if (openMenuId === doc.document_id) {
                                                        refs.setReference(node);
                                                    }
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleMenu(doc.document_id);
                                                }}
                                            >
                                                <MoreVertical className="size-8 text-gray-400 hover:bg-gray-100 rounded-md p-1.5" />
                                            </button>
                                        </div>
                                    )}

                                    <div className="relative">
                                        <FileText className={"size-14 rounded-xl p-2 " + getFileColor(doc.file_type)} />
                                        {isProcessing && (
                                            <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                                                <Loader2 className="size-5 text-indigo-600 animate-spin" />
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-md font-semibold text-gray-800 my-3 truncate" title={doc.filename}>
                                        {doc.filename}
                                    </h3>

                                    <div className="flex justify-between items-center min-h-[20px]">
                                        {isProcessing ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-medium text-indigo-600 animate-pulse">
                                                    {getStatusDisplay(doc.status, doc.document_id)}
                                                </span>
                                            </div>
                                        ) : doc.status === 'failed' ? (
                                            <Tooltip content={doc.error_message ? (typeof doc.error_message === 'object' ? JSON.stringify(doc.error_message) : doc.error_message) : "Error occurred during processing"}>
                                                <div className="flex items-center gap-1 group/error">
                                                    <AlertCircle className="size-3 text-red-500" />
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                                                        {getStatusDisplay(doc.status, doc.document_id)}
                                                    </span>
                                                </div>
                                            </Tooltip>
                                        ) : (
                                            <p className="text-sm text-gray-500">
                                                {formatBytes(doc.in_cloud_size || doc.original_size)}
                                            </p>
                                        )}

                                        <p className="text-sm text-gray-500">
                                            {formatDate(new Date(doc.created_at))}
                                        </p>
                                    </div>

                                    {openMenuId === doc.document_id && (
                                        <div
                                            ref={(node) => {
                                                menuRef.current = node;
                                                refs.setFloating(node);
                                            }}
                                            style={{
                                                position: strategy,
                                                top: y ?? 0,
                                                left: x ?? 0
                                            }}
                                            className="w-48 bg-white border rounded-xl shadow-lg z-50 overflow-hidden py-1"
                                        >

                                            {/* Retrieve / Download */}
                                            <button
                                                onClick={() => handleUnlock(doc.document_id)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                                                <Unlock className="w-4 h-4 text-gray-600" />
                                                Unlock File
                                            </button>

                                            <div className="border-t" />

                                            {/* Rename */}
                                            <button
                                                onClick={() => scanCovers()}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                                                <Pencil className="w-4 h-4 text-gray-600" />
                                                {/* Rename */}
                                                SCAN COVER FILES
                                            </button>

                                            {/* Move */}
                                            <button
                                                onClick={() => openMoveModal(doc.document_id)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                                                <FolderInput className="w-4 h-4 text-gray-600" />
                                                Move File
                                            </button>

                                            <div className="border-t" />

                                            {/* Share */}
                                            {doc.is_owner && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedDocForShare(doc);
                                                        setShowShareModal(true);
                                                        setOpenMenuId(null);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                                                    <Share2 className="w-4 h-4 text-gray-600" />
                                                    Share File
                                                </button>
                                            )}

                                            {/* Info */}
                                            <button
                                                onClick={() => handleFileInfo(doc.document_id)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                                                <Info className="w-4 h-4 text-gray-600" />
                                                File Info
                                            </button>

                                            <div className="border-t" />

                                            {/* Delete */}
                                            <button
                                                onClick={() => openDeleteModal(doc.document_id)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-red-50 text-red-600">
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="size-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Found</h3>
                        <p className="text-gray-500">Upload files to get started</p>
                    </div>
                </div>
            )}
            {showDeleteModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                    onClick={cancelDelete}
                >
                    {/* Modal */}
                    <div className="bg-white rounded-xl shadow-xl w-80 p-6" onClick={(e) => e.stopPropagation()}>

                        <h2 className="text-lg font-semibold text-gray-800 mb-2">
                            Delete File
                        </h2>

                        <p className="text-sm text-gray-500 mb-6">
                            Are you sure you want to delete this file? This action cannot be undone.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={cancelDelete}
                                className="px-4 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>

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

            {showKeepFileModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 cursor-default"
                    title="Please select whether to keep or delete the file to continue"
                >
                    {/* Modal */}
                    <div
                        className="bg-white rounded-xl shadow-xl w-80 p-6"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <h2 className="text-lg font-semibold text-gray-800 mb-2">
                            File Unlocked
                        </h2>

                        <p className="text-sm text-gray-500 mb-6">
                            Do you want to keep the unlocked file on the system or remove it?
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={keepFile}
                                className="px-4 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200"
                            >
                                Keep File
                            </button>

                            <button
                                onClick={handleDeleteFromKeepModal}
                                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
                            >
                                Delete File
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {showShareModal && (
                <ShareFileModal 
                    document={selectedDocForShare}
                    onClose={() => setShowShareModal(false)}
                />
            )}

        </AuthenticatedLayout>
    );
}

/**
 * Unlock Icon
 * File Successfully Unlocked
 *
 */

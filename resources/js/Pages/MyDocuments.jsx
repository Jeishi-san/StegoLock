import { Shield, FileText, Star, MoreVertical,
    Unlock, Pencil, FolderInput, Share2, Info, Trash2, Lock, Loader2, AlertCircle } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatBytes, formatDate } from '@/Utils/fileUtils';
import { Inertia } from '@inertiajs/inertia';
import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

// ADD THIS
import {
    useFloating,
    offset,
    flip,
    shift,
    autoUpdate,
    size
} from '@floating-ui/react';

export default function MyDocuments({ documents, totalStorage, storageLimit }) {

    const menuRef = useRef(null);

    const [localDocs, setLocalDocs] = useState(documents);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDocId, setSelectedDocId] = useState(null);
    const [showKeepFileModal, setShowKeepFileModal] = useState(null);

    const [isUploading, setIsUploading] = useState(false);

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Update localDocs when props change (initial load or manual reload)
    useEffect(() => {
        setLocalDocs(documents);
    }, [documents]);

    // Polling logic for all processing documents
    useEffect(() => {
        const processingDocs = localDocs.filter(doc => 
            !['stored', 'decrypted', 'failed'].includes(doc.status)
        );

        if (processingDocs.length === 0) return;

        const interval = setInterval(async () => {
            const updatedDocs = await Promise.all(
                localDocs.map(async (doc) => {
                    if (!['stored', 'decrypted', 'failed'].includes(doc.status)) {
                        try {
                            const { data } = await axios.get(`/documents/status/${doc.document_id}`);
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
                    if (doc.status === 'stored' && localDocs[index].status !== 'stored') {
                        toast.success(`${doc.filename} is locked successfully`);
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
                }
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [localDocs]);

    const getStatusDisplay = (status) => {
        switch (status) {
            case 'uploaded': return 'Initializing...';
            case 'encrypted': return 'Encrypting file...';
            case 'fragmented': return 'Embedding file...';
            case 'mapped': return 'Embedding file...';
            case 'embedded': return 'Storing files...';
            case 'extracted': return 'Extracting fragments...';
            case 'reconstructed': return 'Assembling file...';
            case 'failed': return 'Processing failed';
            default: return status.charAt(0).toUpperCase() + status.slice(1);
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
    
    const isProcessing = (status) => {
        return ['uploaded', 'encrypted', 'fragmented', 'mapped', 'embedded'].includes(status);
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

        const toastId = toast.loading('Unlocking file...');
        try {
            // enable warning
            window.addEventListener('beforeunload', handleBeforeUnload);

            // Unlock
            try {
                //toast steps
                const resp = await axios.post('/documents/unlock', {
                    document_id: id
                });

                sleep(2000);
                toast.success('Unlocking process started.', { id: toastId });

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

    // Auto-download when a document becomes 'decrypted'
    useEffect(() => {
        localDocs.forEach(doc => {
            if (doc.status === 'decrypted' && !showKeepFileModal && selectedDocId !== doc.document_id) {
                // Trigger modal and download
                window.location.href = `/documents/download/${doc.document_id}`;
                setShowKeepFileModal(doc.document_id);
                setSelectedDocId(doc.document_id);
            }
        });
    }, [localDocs]);

    //handleFileInfo
    const handleFileInfo = async (id) => {
        router.get('/documents/getFileInfo', { id });
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
        //toast steps
        const toastId = toast.loading('Keeping file...');

        try {
            const resp = await axios.post('/documents/keep', {
                document_id: selectedDocId
            });

            sleep(2000);
            toast.success('File kept.', { id: toastId });

            setShowKeepFileModal(null);
            setSelectedDocId(null);
        } catch (err) {
            toast.error('Failed to keep file.', { id: toastId });
        }
    };


    // scan cover files
    const scanCovers =  async() => {
        const resp = await axios.post('/covers/scan');
    };


    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    My Documents
                </h2>
            }
            totalStorage={totalStorage}
            storageLimit={storageLimit}
            hasProcessingDocs={localDocs.some(doc => !['stored', 'decrypted', 'failed'].includes(doc.status))}
        >
            <Head title="My Documents"/>

            {/* GRID VIEW (DEFAULT) */}
            {localDocs.length > 0 ? (
                <div className="h-full overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                        {localDocs.map(doc => {
                            const isProcessing = !['stored', 'decrypted', 'failed'].includes(doc.status);
                            
                            return (
                                <div
                                    key={doc.document_id}
                                    title={isProcessing ? "Locking file is ongoing..." : ""}
                                    className={"group relative w-full p-4 bg-white rounded-lg shadow transition " + 
                                        (isProcessing ? "border-2 border-indigo-100 bg-indigo-50/10 cursor-wait" : "hover:shadow-lg hover:ring-1 hover:ring-purple-600 cursor-pointer")}
                                >
                                    {!isProcessing && (
                                        <div className={"absolute top-0 right-0 p-4 transition space-x-1 z-10 " + 
                                            (openMenuId === doc.document_id ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                                            {/* Star */}
                                            <button>
                                                <Star className="size-8 text-gray-400 hover:bg-gray-100 rounded-md p-1.5" />
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
                                                    {getStatusDisplay(doc.status)}
                                                </span>
                                            </div>
                                        ) : doc.status === 'failed' ? (
                                            <div className="flex items-center gap-1 group/error" 
                                                 title={typeof doc.error_message === 'object' ? JSON.stringify(doc.error_message) : doc.error_message}>
                                                <AlertCircle className="size-3 text-red-500" />
                                                <span className="text-xs font-medium text-red-600">
                                                    {getStatusDisplay(doc.status)}
                                                </span>
                                            </div>
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
                                            className="w-36 bg-white border rounded-xl shadow-lg z-50 overflow-hidden"
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
                                            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                                                <FolderInput className="w-4 h-4 text-gray-600" />
                                                Move File
                                            </button>

                                            <div className="border-t" />

                                            {/* Share */}
                                            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                                                <Share2 className="w-4 h-4 text-gray-600" />
                                                Share File
                                            </button>

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
                        {/* UPLOAD FILE BUTTON */}
                        <div className="mx-auto max-w-7xl sm:px-6 lg:px-6">
                            <div className="flex my-4 relative">
                                {/* New Button with Dropdown */}
                                <button
                                    onClick={() => {
                                            if (isUploading) return;
                                            setShowNewMenu(false);
                                            setShowUploadModal(true);
                                        }}
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r
                                                from-indigo-600 to-purple-600 text-white px-4 py-3.5
                                                rounded-xl hover:from-indigo-700 hover:to-purple-700
                                                transition-all font-medium shadow-lg shadow-indigo-500/30"
                                >
                                    <Upload className="size-5" />
                                    Upload Document
                                </button>

                            </div>
                        </div>
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

            {showKeepFileModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"

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
                            Do you want to keep the locked file on the system or remove it?
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

        </AuthenticatedLayout>
    );
}

/**
 * Unlock Icon
 * File Successfully Unlocked
 *
 */

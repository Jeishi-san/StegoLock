import { Shield, FileText, Star, MoreVertical,
    Unlock, Pencil, FolderInput, Share2, Info, Trash2, Lock, Loader2, AlertCircle, FolderOpen, FolderTree, X } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatBytes, formatDate } from '@/Utils/fileUtils';
import { Inertia } from '@inertiajs/inertia';
import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import Tooltip from '@/Components/Tooltip';
import { ConfirmModal } from '@/Components/modals/ConfirmModal';
import {
    useFloating,
    offset,
    flip,
    shift,
    autoUpdate,
} from '@floating-ui/react';
import axios from 'axios';

export default function StarredDocuments({ documents, totalStorage, storageLimit }) {

    const menuRef = useRef(null);

    const [localDocs, setLocalDocs] = useState(documents);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDocId, setSelectedDocId] = useState(null);
    
    // Polling logic for all processing documents
    useEffect(() => {
        const processingDocs = localDocs.filter(doc => 
            !['stored', 'decrypted', 'retrieved', 'failed'].includes(doc.status)
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
                            return doc;
                        }
                    }
                    return doc;
                })
            );

            if (JSON.stringify(updatedDocs) !== JSON.stringify(localDocs)) {
                setLocalDocs(updatedDocs);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [localDocs]);

    const getStatusDisplay = (status) => {
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
            default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : '';
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
        whileElementsMounted: autoUpdate
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openMenuId && menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuId]);

    const handleToggleStar = async (id) => {
        try {
            const resp = await axios.post(route('documents.star.toggle'), {
                document_id: id
            });
            
            if (resp.data.is_starred !== undefined) {
                // If unstarred, remove from this view
                if (!resp.data.is_starred) {
                    setLocalDocs(prev => prev.filter(doc => doc.document_id !== id));
                    toast.success('Document removed from starred');
                } else {
                    setLocalDocs(prev => prev.map(doc => 
                        doc.document_id === id ? { ...doc, is_starred: resp.data.is_starred } : doc
                    ));
                    toast.success(resp.data.message);
                }
            }
        } catch (err) {
            toast.error('Failed to update star status');
        }
    };

    const handleUnlock = (id) => {
        router.post('/documents/unlock', { document_id: id });
    };

    const openDeleteModal = (id) => {
        setOpenMenuId(null);
        setSelectedDocId(id);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!selectedDocId) return;
        try {
            await axios.post('/documents/delete', { document_id: selectedDocId });
            toast.success('Document deleted successfully');
            setLocalDocs(prev => prev.filter(doc => doc.document_id !== selectedDocId));
            setShowDeleteModal(false);
        } catch (err) {
            toast.error('Failed to delete document');
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Starred Documents
                </h2>
            }
            totalStorage={totalStorage}
            storageLimit={storageLimit}
            hasProcessingDocs={localDocs.some(doc => !['stored', 'decrypted', 'retrieved', 'failed'].includes(doc.status))}
        >
            <Head title="Starred Documents"/>

            {localDocs.length > 0 ? (
                <div className="h-full overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                        {localDocs.map(doc => (
                            <div
                                key={doc.document_id}
                                className="group relative w-full p-4 bg-white rounded-lg shadow transition hover:shadow-lg hover:ring-1 hover:ring-yellow-400 cursor-pointer"
                            >
                                <div className="absolute top-0 right-0 p-4 transition space-x-1 z-10">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleToggleStar(doc.document_id);
                                        }}
                                    >
                                        <Star className="size-8 text-yellow-400 fill-yellow-400 hover:bg-gray-100 rounded-md p-1.5 transition" />
                                    </button>

                                    <button
                                        ref={(node) => {
                                            if (openMenuId === doc.document_id) refs.setReference(node);
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleMenu(doc.document_id);
                                        }}
                                    >
                                        <MoreVertical className="size-8 text-gray-400 hover:bg-gray-100 rounded-md p-1.5" />
                                    </button>
                                </div>

                                <div className="relative">
                                    <FileText className={"size-14 rounded-xl p-2 " + getFileColor(doc.file_type)} />
                                    {!['stored', 'decrypted', 'retrieved', 'failed'].includes(doc.status) && (
                                        <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                                            <Loader2 className="size-5 text-indigo-600 animate-spin" />
                                        </div>
                                    )}
                                </div>

                                <h3 className="text-md font-semibold text-gray-800 my-3 truncate" title={doc.filename}>
                                    {doc.filename}
                                </h3>

                                <div className="flex justify-between items-center min-h-[20px]">
                                    {!['stored', 'decrypted', 'retrieved', 'failed'].includes(doc.status) ? (
                                        <span className="text-xs font-medium text-indigo-600 animate-pulse">
                                            {getStatusDisplay(doc.status)}
                                        </span>
                                    ) : doc.status === 'failed' ? (
                                        <Tooltip content={doc.error_message ? (typeof doc.error_message === 'object' ? JSON.stringify(doc.error_message) : doc.error_message) : "Error occurred during processing"}>
                                            <div className="flex items-center gap-1 group/error">
                                                <AlertCircle className="size-3 text-red-500" />
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                                                    Error
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
                                        className="w-36 bg-white border rounded-xl shadow-lg z-50 overflow-hidden"
                                    >
                                        <button
                                            onClick={() => handleUnlock(doc.document_id)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                                            <Unlock className="w-4 h-4 text-gray-600" />
                                            Unlock File
                                        </button>
                                        <div className="border-t" />
                                        <button
                                            onClick={() => openDeleteModal(doc.document_id)}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-red-50 text-red-600">
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Star className="size-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Starred Documents</h3>
                        <p className="text-gray-500">Star your important documents to find them easily</p>
                    </div>
                </div>
            )}

            <ConfirmModal 
                show={showDeleteModal}
                title="Delete File"
                message="Are you sure you want to delete this file? This action cannot be undone."
                confirmText="Delete"
                isDanger={true}
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteModal(false)}
            />
        </AuthenticatedLayout>
    );
}

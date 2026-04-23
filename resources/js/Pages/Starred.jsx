import { Shield, FileText, Star, MoreVertical, Upload,
    Unlock, Pencil, FolderInput, Share2, Info, Trash2, Lock, Loader2 } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatBytes, formatDate } from '@/Utils/fileUtils';
import { Inertia } from '@inertiajs/inertia';
import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

export default function Starred({ documents, totalStorage, storageLimit }) {

    const menuRef = useRef(null);

    const [openMenuId, setOpenMenuId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDocId, setSelectedDocId] = useState(null);
    const [showKeepFileModal, setShowKeepFileModal] = useState(null);

    const [isUploading, setIsUploading] = useState(false);

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
        e.returnValue = '';
    };

    // handleUnlockFile
    const handleUnlock = async (id) => {

        setOpenMenuId(null);

        const toastId = toast.loading('Unlocking file...');
        try {
            window.addEventListener('beforeunload', handleBeforeUnload);

            try {
                const resp = await axios.post('/documents/unlock', {
                    document_id: id
                });

                sleep(2000);
                toast.success('File ready for download.', { id: toastId });

            } finally {
                window.removeEventListener('beforeunload', handleBeforeUnload);
            }

        } catch (err) {
            console.log('Error: ',err);
            console.log('Unlock response:', err.response?.data);
        }

        const interval = setInterval(async () => {
            const { data } = await axios.get(`/documents/status/${id}`);

            if (data.status === 'decrypted') {
                clearInterval(interval);
                window.location.href = `/documents/download/${id}`;
                setShowKeepFileModal(id);
                setSelectedDocId(id);
            }

            if (data.status === 'failed') {
                clearInterval(interval);
                alert('Decryption failed');
            }

        }, 2000);
    };

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

    const handleToggleStar = async (docId) => {
        try {
            const resp = await axios.post('/documents/toggle-star', {
                document_id: docId
            });
            
            if (resp.data.starred) {
                toast.success('Added to starred');
            } else {
                toast.success('Removed from starred');
            }
            router.reload();
        } catch (err) {
            toast.error('Failed to update star status');
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Starred
                </h2>
            }
            totalStorage={totalStorage}
            storageLimit={storageLimit}
        >
            <Head title="Starred"/>

            {/* GRID VIEW (DEFAULT) */}
            {documents.length > 0 ? (
                <div className="h-full overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                        {documents.map(doc => {
                            return (
                                <div
                                    key={doc.document_id}
                                    className="group relative w-full p-4 bg-white rounded-lg shadow hover:shadow-lg hover:ring-1 hover:ring-purple-600 transition"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition space-x-1">
                                        {/* Star */}
                                        <button onClick={() => handleToggleStar(doc.document_id)}>
                                            <Star className="size-8 text-yellow-500 fill-yellow-500 hover:bg-gray-100 rounded-md p-1.5" />
                                        </button>

                                        {/* Vertical 3-Dot Menu */}
                                        <button
                                            onClick={() => !isProcessing(doc.status) && toggleMenu(doc.document_id)}
                                            className={isProcessing(doc.status) ? 'opacity-50 cursor-not-allowed' : ''}
                                            disabled={isProcessing(doc.status)}
                                        >
                                            <MoreVertical className="size-8 text-gray-400 hover:bg-gray-100 rounded-md p-1.5" />
                                        </button>
                                    </div>

                                    <div className="relative inline-block">
                                        <FileText className={"size-14 rounded-xl p-2 " + getFileColor(doc.file_type)} />
                                        {isProcessing(doc.status) && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl">
                                                <Loader2 className="size-6 text-purple-600 animate-spin" />
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="text-md font-semibold text-gray-800 my-3 truncate" title={doc.filename}>
                                        {doc.filename}
                                    </h3>

                                    <p className="text-xs text-gray-500 mb-2">
                                        Owned by {doc.owner_name}
                                    </p>

                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-gray-500">
                                            {isProcessing(doc.status) ? (
                                                <span className="flex items-center gap-1.5 text-purple-600 font-medium italic">
                                                     {doc.status}...
                                                </span>
                                            ) : (
                                                formatBytes(doc.in_cloud_size)
                                            )}
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            {formatDate(new Date(doc.created_at))}
                                        </p>
                                    </div>

                                    {openMenuId === doc.document_id && (
                                        <div
                                            ref={menuRef}
                                            className="absolute w-36 bg-white border rounded-xl shadow-lg z-50 overflow-hidden"
                                        >

                                            {/* Retrieve / Download */}
                                            <button
                                                onClick={() => handleUnlock(doc.document_id)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                                                <Unlock className="w-4 h-4 text-gray-600" />
                                                Unlock File
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
                            <Star className="size-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Starred Documents</h3>
                        <p className="text-gray-500">Star documents to view them here</p>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

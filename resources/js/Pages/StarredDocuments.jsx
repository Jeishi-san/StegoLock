import { Shield, FileText, Star, MoreVertical,
    Unlock, Pencil, FolderInput, Share2, Info, Trash2, Lock, Loader2, AlertCircle, FolderOpen, FolderTree, X } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatBytes, formatDate } from '@/Utils/fileUtils';
import { Inertia } from '@inertiajs/inertia';
import { Head, router } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import Tooltip from '@/Components/Tooltip';
import { ConfirmModal } from '@/Components/modals/ConfirmModal';
import { SearchBar } from '@/Components/SearchBar';
import { ViewToggle } from '@/Components/ViewToggle';
import { DocumentList } from '@/Components/DocumentList';
import DocumentCard from '@/Components/DocumentCard';
import { ShareFileModal } from '@/Components/modals/ShareFileModal';
import { FileInfoModal } from '@/Components/modals/FileInfoModal';
import { DownloadReadyModal } from '@/Components/modals/DownloadReadyModal';
import { useDocumentStatusPolling } from '@/hooks/useDocumentStatusPolling';
import { useDocumentActions } from '@/hooks/useDocumentActions';
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

    const [openMenuId, setOpenMenuId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDocId, setSelectedDocId] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [showDownloadReadyModal, setShowDownloadReadyModal] = useState(false);
    const { 
        localDocs, 
        setLocalDocs, 
        unlockingProgress, 
        updateUnlockingProgress 
    } = useDocumentStatusPolling(documents, (doc) => {
        setSelectedDoc(doc);
        setShowDownloadReadyModal(true);
    });

    const {
        handleUnlock,
        handleMove,
        confirmDelete,
        keepFile,
        handleToggleStar: baseToggleStar,
        handleFileInfo,
        handleRename
    } = useDocumentActions({
        setLocalDocs,
        updateUnlockingProgress,
        setSelectedDocId,
        setSelectedDocForShare: () => {}, // Not used in Starred currently
        setSelectedDocForInfo: setSelectedDoc,
        setShowDeleteModal,
        setShowMoveModal: () => {}, 
        setShowShareModal,
        setShowInfoModal,
        setShowKeepFileModal: () => {} 
    });

    // Custom toggle star for Starred view (removes if unstarred)
    const handleToggleStar = async (id) => {
        try {
            const resp = await axios.post(route('documents.star.toggle'), {
                document_id: id
            });
            
            if (resp.data.is_starred !== undefined) {
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

    const handleDownloadAndProceed = (docId) => {
        window.location.href = `/documents/download/${docId}`;
        setShowDownloadReadyModal(false);
    };

    const [viewMode, setViewMode] = useState(() => {
        return localStorage.getItem('stegolock_view_mode_starred') || 'grid';
    });

    useEffect(() => {
        localStorage.setItem('stegolock_view_mode_starred', viewMode);
    }, [viewMode]);

    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        fileFormat: 'all',
        status: 'all',
        owner: 'all',
        sort: 'date-newest'
    });

    const filteredDocs = useMemo(() => {
        let result = [...localDocs];

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(doc => 
                doc.filename.toLowerCase().includes(query)
            );
        }

        // Format filter
        if (filters.fileFormat !== 'all') {
            result = result.filter(doc => doc.file_type === filters.fileFormat);
        }

        // Status filter
        if (filters.status !== 'all') {
            result = result.filter(doc => {
                if (filters.status === 'secured') return doc.status === 'stored' || doc.status === 'retrieved';
                if (filters.status === 'original') return doc.status === 'decrypted';
                return true;
            });
        }

        // Sort filter
        result.sort((a, b) => {
            switch (filters.sort) {
                case 'name-asc': return a.filename.localeCompare(b.filename);
                case 'name-desc': return b.filename.localeCompare(a.filename);
                case 'date-newest': return new Date(b.created_at) - new Date(a.created_at);
                case 'date-oldest': return new Date(a.created_at) - new Date(b.created_at);
                case 'size-largest': return (b.in_cloud_size || b.original_size) - (a.in_cloud_size || a.original_size);
                case 'size-smallest': return (a.in_cloud_size || a.original_size) - (b.in_cloud_size || b.original_size);
                default: return 0;
            }
        });

        return result;
    }, [localDocs, searchQuery, filters]);
    
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
        updateUnlockingProgress(id);
        router.post('/documents/unlock', { document_id: id });
    };

    const openDeleteModal = (id) => {
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
                <h2 className="text-2xl font-black tracking-tight text-gray-900">Starred Documents</h2>
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
            hasProcessingDocs={localDocs.some(doc => !['stored', 'decrypted', 'retrieved', 'failed'].includes(doc.status))}
        >
            <Head title="Starred Documents"/>

            {filteredDocs.length > 0 || localDocs.length > 0 ? (
                <div className="h-full overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
                                {filteredDocs.map(doc => (
                                    <DocumentCard
                                        key={doc.document_id}
                                        doc={doc}
                                        unlockingProgress={unlockingProgress}
                                        onToggleStar={() => handleToggleStar(doc.document_id)}
                                        onDelete={() => openDeleteModal(doc.document_id)}
                                        onShare={(d) => { setSelectedDoc(d); setShowShareModal(true); }}
                                        onInfo={(d) => { setSelectedDoc(d); setShowInfoModal(true); }}
                                        onUnlock={handleUnlock}
                                    />
                                ))}
                            </div>
                        ) : (
                            <DocumentList
                                documents={filteredDocs}
                                unlockingProgress={unlockingProgress}
                                onToggleStar={handleToggleStar}
                                onDelete={openDeleteModal}
                                onShare={(d) => { setSelectedDoc(d); setShowShareModal(true); }}
                                onInfo={(d) => { setSelectedDoc(d); setShowInfoModal(true); }}
                                onUnlock={handleUnlock}
                            />
                        )}
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

            {showShareModal && (
                <ShareFileModal
                    show={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    document={selectedDoc}
                />
            )}

            {showInfoModal && (
                <FileInfoModal
                    show={showInfoModal}
                    onClose={() => setShowInfoModal(false)}
                    document={selectedDoc}
                />
            )}

            {showDownloadReadyModal && (
                <DownloadReadyModal
                    show={showDownloadReadyModal}
                    onClose={() => setShowDownloadReadyModal(false)}
                    document={selectedDoc}
                    onDownload={handleDownloadAndProceed}
                    onCancel={() => {
                        keepFile(selectedDoc.document_id, selectedDoc.filename);
                        setShowDownloadReadyModal(false);
                    }}
                />
            )}
        </AuthenticatedLayout>
    );
}

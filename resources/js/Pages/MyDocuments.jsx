import { Shield, ArrowLeft, FolderOpen, FolderTree } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { ShareFileModal } from '@/Components/modals/ShareFileModal';
import { FileInfoModal } from '@/Components/modals/FileInfoModal';
import DocumentCard from '@/Components/DocumentCard';
import { useDocumentStatusPolling } from '@/hooks/useDocumentStatusPolling';
import { useDocumentActions } from '@/hooks/useDocumentActions';

export default function MyDocuments({ documents, folders, currentFolder, totalStorage, storageLimit, title = "My Documents" }) {

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showKeepFileModal, setShowKeepFileModal] = useState(null);
    
    const [selectedDocId, setSelectedDocId] = useState(null);
    const [selectedDocForShare, setSelectedDocForShare] = useState(null);
    const [selectedDocForInfo, setSelectedDocForInfo] = useState(null);

    // Initial check for stuck files
    useEffect(() => {
        const stuckDoc = documents.find(doc => doc.status === 'retrieved' || doc.status === 'decrypted');
        if (stuckDoc && !showKeepFileModal) {
            setShowKeepFileModal(stuckDoc.document_id);
            setSelectedDocId(stuckDoc.document_id);
        }
    }, [documents]);

    const { 
        localDocs, 
        setLocalDocs, 
        unlockingProgress, 
        updateUnlockingProgress 
    } = useDocumentStatusPolling(documents, (doc) => {
        // Auto-download trigger
        window.location.href = `/documents/download/${doc.document_id}`;
        setShowKeepFileModal(doc.document_id);
        setSelectedDocId(doc.document_id);
    });

    const {
        handleUnlock,
        handleMove,
        confirmDelete,
        keepFile,
        handleToggleStar,
        handleFileInfo,
        scanCovers
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

            {localDocs.length > 0 ? (
                <div className="h-full overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                        {localDocs.map(doc => (
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
                                onScanCovers={scanCovers}
                            />
                        ))}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDeleteModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl w-80 p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">Delete File</h2>
                        <p className="text-sm text-gray-500 mb-6">Are you sure you want to delete this file? This action cannot be undone.</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200">Cancel</button>
                            <button onClick={() => confirmDelete(selectedDocId)} className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {showMoveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowMoveModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl w-80 p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Move to Folder</h2>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            <button onClick={() => handleMove(selectedDocId, null)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition text-left">
                                <FolderOpen className="size-5 text-gray-400" />
                                <span className="text-sm text-gray-700">Root Directory</span>
                            </button>
                            {folders.map(folder => (
                                <button key={folder.folder_id} onClick={() => handleMove(selectedDocId, folder.folder_id)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition text-left">
                                    <FolderTree className="size-5 text-indigo-500" />
                                    <span className="text-sm text-gray-700 truncate">{folder.name}</span>
                                </button>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={() => setShowMoveModal(false)} className="px-4 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {showKeepFileModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 cursor-default">
                    <div className="bg-white rounded-xl shadow-xl w-80 p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">File Unlocked</h2>
                        <p className="text-sm text-gray-500 mb-6">Do you want to keep the unlocked file on the system or remove it?</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => keepFile(selectedDocId, localDocs.find(d => d.document_id === selectedDocId)?.filename)} className="px-4 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200">Keep File</button>
                            <button onClick={() => { setShowDeleteModal(true); setShowKeepFileModal(null); }} className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700">Delete File</button>
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

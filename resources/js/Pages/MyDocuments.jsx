import { Shield, Upload } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { ShareFileModal } from '@/Components/modals/ShareFileModal';
import { DeleteConfirmModal } from '@/Components/modals/DeleteConfirmModal';
import DocumentCard from '@/Components/DocumentCard';
import { useDocumentActions } from '@/hooks/useDocumentActions';
import { useDocumentStatusPolling } from '@/hooks/useDocumentStatusPolling';

export default function MyDocuments({ documents, totalStorage, storageLimit }) {
    const [selectedShareDoc, setSelectedShareDoc] = useState(null);
    
    const { localDocs } = useDocumentStatusPolling(documents);
    const {
        handleUnlock,
        handleFileInfo,
        confirmDelete,
        cancelDelete,
        keepFile,
        handleToggleStar,
        showDeleteModal,
        selectedDocId,
        setSelectedDocId,
        showKeepFileModal,
        setShowKeepFileModal
    } = useDocumentActions();

    const handleShare = (doc) => {
        setSelectedShareDoc(doc);
    };

    const openDeleteModal = (id) => {
        setSelectedDocId(id);
        setShowDeleteModal(true);
    };

    // Auto-download when a document becomes 'decrypted'
    useEffect(() => {
        localDocs.forEach(doc => {
            if (doc.status === 'decrypted' && !showKeepFileModal && selectedDocId !== doc.document_id) {
                window.location.href = `/documents/download/${doc.document_id}`;
                setShowKeepFileModal(doc.document_id);
                setSelectedDocId(doc.document_id);
            }
        });
    }, [localDocs]);

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
                <div className="h-full overflow-y-auto" id="document-area">
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                        {localDocs.map(doc => (
                            <DocumentCard
                                key={doc.document_id}
                                doc={doc}
                                onUnlock={handleUnlock}
                                onToggleStar={handleToggleStar}
                                onShare={handleShare}
                                onFileInfo={handleFileInfo}
                                onDelete={openDeleteModal}
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

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                show={showDeleteModal}
                onClose={cancelDelete}
                onConfirm={confirmDelete}
            />

            {/* Share Modal */}
            {selectedShareDoc && (
                <ShareFileModal
                    document={selectedShareDoc}
                    show={!!selectedShareDoc}
                    onClose={() => setSelectedShareDoc(null)}
                />
            )}

            {/* Keep File Modal */}
            {showKeepFileModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
                >
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
                                onClick={() => {
                                    openDeleteModal(showKeepFileModal);
                                    setShowKeepFileModal(null);
                                }}
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

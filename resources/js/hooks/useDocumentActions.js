import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export function useDocumentActions() {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedDocId, setSelectedDocId] = useState(null);
    const [showKeepFileModal, setShowKeepFileModal] = useState(null);

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = ''; // required for Chrome to show prompt
    };

    // handleUnlockFile
    const handleUnlock = async (id) => {
        const toastId = toast.loading('Unlocking file...');
        try {
            window.addEventListener('beforeunload', handleBeforeUnload);

            try {
                await axios.post('/documents/unlock', {
                    document_id: id
                });

                sleep(2000);
                toast.success('Unlocking process started.', { id: toastId });

            } finally {
                window.removeEventListener('beforeunload', handleBeforeUnload);
            }

        } catch (err) {
            console.log('Error: ', err);
            console.log('Unlock response:', err.response?.data);
            toast.error('Unlock failed', { id: toastId });
        }
    };

    //handleFileInfo
    const handleFileInfo = async (id) => {
        router.get('/documents/getFileInfo', { id });
    };

    // openDeleteModal
    const openDeleteModal = (id) => {
        setSelectedDocId(id);
        setShowDeleteModal(true);
    };

    // confirmDelete
    const confirmDelete = async () => {
        if (!selectedDocId) return;

        setShowDeleteModal(false);

        const toastId = toast.loading('Deleting document...');
        try {
            await axios.post('/documents/delete', {
                document_id: selectedDocId,
            });

            toast.success('Document deleted successfully', { id: toastId });

            sleep(1000);
            router.reload();

        } catch (err) {
            console.error(err);
            toast.error('Failed to delete document', { id: toastId });
        } finally {
            setSelectedDocId(null);
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
            await axios.post('/documents/keep', {
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

    const handleShare = (doc, setSelectedShareDoc) => {
        if (setSelectedShareDoc) {
            setSelectedShareDoc(doc);
        }
    };

    // Escape key handler for modals
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

    return {
        handleUnlock,
        handleFileInfo,
        openDeleteModal,
        confirmDelete,
        cancelDelete,
        handleDeleteFromKeepModal,
        keepFile,
        handleToggleStar,
        handleShare,
        showDeleteModal,
        selectedDocId,
        setSelectedDocId,
        showKeepFileModal,
        setShowKeepFileModal
    };
}

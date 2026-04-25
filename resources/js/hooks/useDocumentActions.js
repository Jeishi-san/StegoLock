import { toast } from 'sonner';
import { router } from '@inertiajs/react';
import axios from 'axios';

export function useDocumentActions({ 
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
}) {

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = ''; 
    };

    const handleUnlock = async (id) => {
        const toastId = toast.loading('Unlocking file...', { duration: 3000 });
        try {
            window.addEventListener('beforeunload', handleBeforeUnload);

            const resp = await axios.post('/documents/unlock', {
                document_id: id
            });

            if (resp.data.success) {
                toast.dismiss(toastId);
                updateUnlockingProgress(id);
                
                setLocalDocs(prev => prev.map(doc => 
                    doc.document_id === id ? { ...doc, status: resp.data.status } : doc
                ));
            }
        } catch (err) {
            console.error('Unlock failed:', err);
            toast.error('Unlock failed', { id: toastId });
        } finally {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        }
    };

    const handleMove = async (docId, folderId) => {
        const toastId = toast.loading('Moving document...');
        try {
            await axios.put(`/documents/${docId}/move`, {
                folder_id: folderId
            });
            toast.success('Document moved successfully', { id: toastId });
            setShowMoveModal(false);
            router.reload();
        } catch (err) {
            toast.error('Failed to move document', { id: toastId });
        }
    };

    const confirmDelete = async (docId) => {
        const toastId = toast.loading('Deleting document...');
        try {
            await axios.post('/documents/delete', {
                document_id: docId,
            });
            toast.success('Document deleted successfully', { id: toastId });
            await sleep(1000);
            router.reload();
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete document', { id: toastId });
        }
    };

    const keepFile = async (docId, filename) => {
        const toastId = toast.loading(`Keeping ${filename}...`);
        try {
            await axios.post('/documents/keep', {
                document_id: docId
            });
            await sleep(2000);
            toast.success(`${filename} is kept.`, { id: toastId });
            setShowKeepFileModal(null);
            setSelectedDocId(null);
        } catch (err) {
            toast.error(`Failed to keep ${filename}.`, { id: toastId });
        }
    };

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

    const handleFileInfo = (doc) => {
        setSelectedDocForInfo(doc);
        setShowInfoModal(true);
    };

    const handleRename = async (docId, newName) => {
        const toastId = toast.loading('Renaming document...');
        try {
            await axios.put(`/documents/${docId}/rename`, {
                filename: newName
            });
            toast.success('Document renamed successfully', { id: toastId });
            router.reload();
        } catch (err) {
            toast.error('Failed to rename document', { id: toastId });
        }
    };

    return {
        handleUnlock,
        handleMove,
        confirmDelete,
        keepFile,
        handleToggleStar,
        handleFileInfo,
        handleRename
    };
}

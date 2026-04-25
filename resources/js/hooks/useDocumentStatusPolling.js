import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import axios from 'axios';

export function useDocumentStatusPolling(initialDocuments, onDownloadTriggered) {
    const [localDocs, setLocalDocs] = useState(initialDocuments);
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

    // Update localDocs when initialDocuments change
    useEffect(() => {
        setLocalDocs(initialDocuments);
    }, [initialDocuments]);

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

            // Check if anything actually changed
            if (JSON.stringify(updatedDocs) !== JSON.stringify(localDocs)) {
                
                updatedDocs.forEach((doc, index) => {
                    const prevStatus = localDocs[index]?.status;
                    const isMyProcess = !!unlockingProgress[doc.document_id];

                    if (doc.status === 'stored' && prevStatus && prevStatus !== 'stored' && !['decrypted', 'retrieved'].includes(prevStatus)) {
                        toast.success(`${doc.filename} is locked successfully`);
                    }
                    
                    if (doc.status === 'decrypted' && prevStatus && prevStatus !== 'decrypted' && isMyProcess) {
                        toast.success(`${doc.filename} is unlocked successfully`);
                    }
                });

                setLocalDocs(updatedDocs);
                
                const justFinished = updatedDocs.find((doc, index) => {
                    const prevStatus = localDocs[index].status;
                    const isMyProcess = !!unlockingProgress[doc.document_id];
                    return (doc.status === 'stored' || (doc.status === 'decrypted' && isMyProcess)) && 
                           prevStatus !== doc.status;
                });

                if (justFinished) {
                    router.reload({ only: ['totalStorage', 'storageLimit'] });
                    
                    if (justFinished.status === 'decrypted' && onDownloadTriggered) {
                        onDownloadTriggered(justFinished);
                    }
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [localDocs, unlockingProgress]);

    return {
        localDocs,
        setLocalDocs,
        unlockingProgress,
        updateUnlockingProgress
    };
}

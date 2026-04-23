import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

export function useDocumentStatusPolling(documents) {
    const [localDocs, setLocalDocs] = useState(documents);

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

    return {
        localDocs,
        setLocalDocs
    };
}

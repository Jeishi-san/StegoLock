import { useState, useEffect, useRef } from 'react';
import { useForm, router } from '@inertiajs/react';
import { toast } from 'sonner';


export default function UploadModal({ isOpen, onClose, allowUpload, uploaded }) {

    const [filePreview, setFilePreview] = useState(null);
    const [confirmStep, setConfirmStep] = useState(false);
    const [fileError, setFileError] = useState(null);
    const [documentId, setDocumentId] = useState(null);
    const [toastId, setToastId] = useState(null);
    const [status, setStatus] = useState(null);

    const [locked, setLocked] = useState(null);

    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
    ];

    const steps = [
        "Ongoing encryption process...",
        "Segmenting file...",
        "Embedding files..."
    ];

    const form = useForm({
        file: null,
    });

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));



    if (!isOpen) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // reset previous error
        setFileError(null);

        // validate type
        if (!allowedTypes.includes(file.type)) {
            setFileError('Invalid file type. Only PDF, DOC, DOCX, and TXT are allowed.');
            form.setData('file', null);
            setConfirmStep(false);
            setFilePreview(null);
            return;
        }

        form.setData('file', file);

        setFilePreview({
            name: file.name,
            size: (file.size / 1024).toFixed(2) + ' KB',
            type: file.type,
        });

        setConfirmStep(true);
    };

    const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = ''; // required for Chrome to show prompt
    };

    const resetAll = () => {
        form.reset();
        setFilePreview(null);
        setConfirmStep(false);
        setFileError(null);
    };

    const handleUpload = async () => {
        if (!form.data.file) return;

        const file = form.data.file;
        resetAll();
        onClose();
        uploaded();

        const toastId = toast.loading('Uploading file...');
        setToastId(toastId);

        try {
            const formData = new FormData();
            formData.append('file', file);

            // 1. Initial Upload
            const res = await axios.post('/documents/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const docId = res.data['document_id'];
            setDocumentId(docId);
            window.addEventListener('beforeunload', handleBeforeUnload);

            // 2. Start Locking (Asynchronous)
            toast.loading('Starting encryption...', { id: toastId });
            await axios.post('/documents/lock', {
                document_id: docId,
                temp_path: res.data['temp_path']
            });

            // 3. Start Polling for status
            pollStatus(docId, toastId);

        } catch (err) {
            console.error('Upload error:', err);
            toast.error(err.response?.data?.error || 'Upload failed', { id: toastId });
            window.removeEventListener('beforeunload', handleBeforeUnload);
        }
    };

    const pollStatus = async (docId, toastId) => {
        const interval = setInterval(async () => {
            try {
                const response = await axios.get(`/documents/status/${docId}`);
                const currentStatus = response.data.status;

                // Update toast based on status
                switch (currentStatus) {
                    case 'encrypted':
                        toast.loading('File encrypted. Segmenting...', { id: toastId });
                        break;
                    case 'fragmented':
                        toast.loading('File segmented. Mapping covers...', { id: toastId });
                        break;
                    case 'mapped':
                        toast.loading('Covers mapped. Embedding data...', { id: toastId });
                        break;
                    case 'embedded':
                        toast.loading('Data embedded. Finalizing storage...', { id: toastId });
                        break;
                    case 'stored':
                        clearInterval(interval);
                        toast.success('Document secured successfully!', { id: toastId });
                        window.removeEventListener('beforeunload', handleBeforeUnload);
                        router.reload();
                        break;
                    case 'failed':
                        clearInterval(interval);
                        toast.error('Processing failed. Check logs.', { id: toastId });
                        window.removeEventListener('beforeunload', handleBeforeUnload);
                        break;
                }
            } catch (error) {
                console.error('Polling error:', error);
                clearInterval(interval);
            }
        }, 2000); // Poll every 2 seconds
    };









    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40"
                onClick={() => {
                    resetAll();
                    onClose();
                }}
            />

            {/* Modal */}
            <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-xl p-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                        Upload Document to Lock
                    </h2>

                    <button
                        onClick={() => {
                            resetAll();
                            onClose();
                        }}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                </div>

                {/* ===================== */}
                {/* STEP 1: FILE INPUT */}
                {/* ===================== */}
                {!confirmStep && (
                    <label className="block cursor-pointer">
                        <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileChange}
                        />

                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center hover:border-gray-400 transition">

                            <div className="flex justify-center mb-4">
                                <div className="bg-gray-100 p-4 rounded-full">
                                    <svg
                                        className="w-8 h-8 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                                    </svg>
                                </div>
                            </div>

                            <p className="text-gray-700 font-medium">
                                Drop file here or click to browse
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                Supports .pdf, .doc/.docx, and .txt only
                            </p>

                            <div className="mt-4">
                                <span className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm">
                                    Browse File
                                </span>
                            </div>
                        </div>

                        {fileError && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                                {fileError}
                            </div>
                        )}
                    </label>
                )}

                {/* ===================== */}
                {/* STEP 2: CONFIRMATION */}
                {/* ===================== */}
                {confirmStep && filePreview && (
                    <div className="space-y-4">

                        <div className="border rounded-xl p-4 bg-gray-50">
                            <p><b>File:</b> {filePreview.name}</p>
                            <p><b>Size:</b> {filePreview.size}</p>
                            <p><b>Type:</b> {filePreview.type}</p>
                        </div>

                        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                            Uploaded files are immediately locked in the process.
                            You cannot see any preview once processing starts.
                        </div>
                        {fileError && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                                {fileError}
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={resetAll}
                                className="px-4 py-2 bg-gray-200 rounded-lg"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleUpload}
                                disabled={form.processing}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg"
                            >
                                {form.processing ? 'Uploading...' : 'Continue Upload'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Footer fallback */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => {
                            resetAll();
                            onClose();
                        }}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

import { useState } from 'react';
import { useForm } from '@inertiajs/react';

export default function UploadModal({ isOpen, onClose }) {
    const [filePreview, setFilePreview] = useState(null);
    const [confirmStep, setConfirmStep] = useState(false);
    const [fileError, setFileError] = useState(null);

    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
    ];

    const form = useForm({
        file: null,
    });

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

    const handleUpload = () => {
        form.post('/documents/upload', {
            forceFormData: true,

            onSuccess: () => {
                resetAll();
                onClose();
            },

            onError: (errors) => {
                console.log(errors);

                if (errors.file) {
                    setFileError(errors.file);
                }
            },
        });
    };

    const resetAll = () => {
        form.reset();
        setFilePreview(null);
        setConfirmStep(false);
        setFileError(null);
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
                        Upload Document
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

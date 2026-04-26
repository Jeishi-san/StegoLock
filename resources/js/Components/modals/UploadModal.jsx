import { useState, useEffect, useRef } from 'react';
import { useForm, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Upload, FileText, AlertCircle, Loader2, Shield, X } from 'lucide-react';
import axios from 'axios';


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

        resetAll();
        onClose();
        uploaded();

        const file = form.data.file;

        const toastId = toast.loading('Locking file...', { duration: 3000 });
        setToastId(toastId);
        try {
            const formData = new FormData();
            formData.append('file', file);

            // Upload
            const res = await axios.post('/documents/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // enable warning
            window.addEventListener('beforeunload', handleBeforeUnload);

            // Lock
            setDocumentId(res.data['document_id']);
            try {
                // Dispatch Lock request
                const resp = await axios.post('/documents/lock', {
                    document_id: res.data['document_id'],
                    temp_path: res.data['temp_path']
                });

                if (resp.data.status === 'processing') {
                    toast.dismiss(toastId);
                }
                
                allowUpload();
                router.reload();

            } finally {
                // disable warning after request finishes
                window.removeEventListener('beforeunload', handleBeforeUnload);
            }

        } catch (err) {
            console.log('Error: ',err);
            console.log('Lock response:', err.response?.data);
        }
    };








    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 dark:bg-cyber-void/80 backdrop-blur-sm"
                onClick={() => {
                    resetAll();
                    onClose();
                }}
            />

            {/* Modal */}
            <div className="relative glass-panel w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-fade-in border-slate-200 dark:border-cyber-accent/20 bg-white dark:bg-cyber-void transition-colors duration-300">
                {/* Header */}
                <div className="bg-cyber-accent/5 dark:bg-cyber-accent/10 p-8 border-b border-slate-100 dark:border-cyber-border relative">
                    <button
                        onClick={() => {
                            resetAll();
                            onClose();
                        }}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <X className="size-5" />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-cyber-accent/10 dark:bg-cyber-accent/20 rounded-2xl border border-cyber-accent/20 dark:border-cyber-accent/30 shadow-lg dark:shadow-glow-cyan">
                            <Upload className="size-6 text-cyber-accent" />
                        </div>
                        <div>
                             <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                                Upload Document to Lock
                            </h2>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    {/* STEP 1: FILE INPUT */}
                    {!confirmStep && (
                        <label className="block cursor-pointer group">
                            <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.txt"
                                onChange={handleFileChange}
                            />

                            <div className="border-2 border-dashed border-slate-200 dark:border-cyber-border rounded-3xl p-12 text-center hover:border-cyber-accent transition-all duration-300 bg-slate-50 dark:bg-cyber-surface/30 group-hover:bg-cyber-accent/5">
                                <div className="flex justify-center mb-6">
                                    <div className="bg-white dark:bg-cyber-surface p-5 rounded-2xl border border-slate-200 dark:border-cyber-border group-hover:border-cyber-accent group-hover:shadow-lg dark:group-hover:shadow-glow-cyan transition-all">
                                        <FileText className="size-8 text-slate-400 dark:text-slate-500 group-hover:text-cyber-accent" />
                                    </div>
                                </div>

                                 <p className="text-slate-900 dark:text-white font-bold text-lg mb-2">
                                    Drop file here or click to browse
                                </p>
                                 <p className="text-sm text-slate-500 mb-8">
                                    Supports .pdf, .doc/.docx, and .txt only
                                </p>

                                 <span className="inline-flex items-center px-6 py-3 bg-cyber-accent text-white dark:text-cyber-void font-bold rounded-xl text-sm shadow-lg dark:shadow-glow-cyan group-hover:bg-slate-900 dark:group-hover:bg-white transition-all">
                                    Browse File
                                </span>
                            </div>

                            {fileError && (
                                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-bold text-center uppercase tracking-wider">
                                    {fileError}
                                </div>
                            )}
                        </label>
                    )}

                    {/* STEP 2: CONFIRMATION */}
                    {confirmStep && filePreview && (
                        <div className="space-y-6">
                            <div className="bg-slate-50 dark:bg-cyber-surface/50 rounded-2xl p-6 border border-slate-200 dark:border-cyber-border flex items-center gap-5">
                                <div className="p-4 bg-cyber-accent/5 dark:bg-cyber-accent/10 rounded-2xl border border-cyber-accent/10 dark:border-cyber-accent/20">
                                    <FileText className="size-8 text-cyber-accent" />
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <p className="text-slate-900 dark:text-white font-bold truncate text-lg">{filePreview.name}</p>
                                    <div className="flex gap-4 mt-1">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{filePreview.size}</span>
                                        <span className="text-[10px] font-black text-cyber-accent uppercase tracking-widest">{filePreview.type.split('/')[1] || 'FILE'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                                <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-red-400 font-medium leading-relaxed text-left">
                                     Uploaded files are immediately locked in the process. You cannot see any preview once processing starts.
                                </p>
                            </div>

                            {fileError && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-xs font-bold text-center">
                                    {fileError}
                                </div>
                            )}

                            <div className="flex justify-end gap-4 pt-4">
                                <button
                                    onClick={resetAll}
                                    className="px-8 py-3.5 text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-cyber-surface hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200 dark:border-cyber-border"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={handleUpload}
                                    disabled={form.processing}
                                    className="px-8 py-3.5 text-sm font-bold text-white dark:text-cyber-void bg-cyber-accent hover:bg-slate-900 dark:hover:bg-white rounded-xl transition-all shadow-lg dark:shadow-glow-cyan disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {form.processing ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="size-4" />
                                             Continue Upload
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer fallback */}
                <div className="p-6 bg-slate-50 dark:bg-cyber-surface/30 border-t border-slate-100 dark:border-cyber-border/50">
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em]">
                        Stego<span className="text-cyber-accent">Lock</span> Security Infrastructure
                    </p>
                </div>
            </div>
        </div>
    );
}

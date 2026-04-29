import { useState, useEffect, useRef } from 'react';
import { useForm, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { X, Upload, FileText, CheckCircle2, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
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

        const file = form.data.file;

        resetAll();
        onClose();
        uploaded();

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
                
            } finally {
                // disable warning after request finishes
                window.removeEventListener('beforeunload', handleBeforeUnload);
                allowUpload();
                
                // Small delay to ensure state propagates before reload
                setTimeout(() => {
                    router.reload();
                }, 100);
            }

        } catch (err) {
            console.log('Error: ', err);
            const errorMessage = err.response?.data?.errors?.file?.[0] || 'Failed to process document. Please try again.';
            toast.error(errorMessage, { id: toastId });
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
                onClick={() => {
                    resetAll();
                    onClose();
                }}
            />

            {/* Modal Container */}
            <div 
                className="relative bg-white dark:bg-cyber-void w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden transform transition-all border border-slate-200 dark:border-cyber-border"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-cyan-600 to-indigo-600 dark:from-cyber-accent dark:to-indigo-500 p-8 text-white text-center relative overflow-hidden">
                    <button
                        onClick={() => {
                            resetAll();
                            onClose();
                        }}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors z-10"
                    >
                        <X className="size-5" />
                    </button>
                    
                    <div className="relative z-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-2xl backdrop-blur-md mb-4 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                            <Upload className="size-10 text-white" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">
                            Lock New Document
                        </h2>
                        <p className="text-cyan-100/80 text-xs font-bold uppercase tracking-widest mt-1">
                            Secure your files with Stegolock
                        </p>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-400/20 blur-2xl rounded-full translate-y-1/2 -translate-x-1/2"></div>
                </div>

                <div className="p-8">
                    {/* ===================== */}
                    {/* STEP 1: FILE INPUT */}
                    {/* ===================== */}
                    {!confirmStep && (
                        <label className="block cursor-pointer group">
                            <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.txt"
                                onChange={handleFileChange}
                            />

                            <div className="border-2 border-dashed border-slate-200 dark:border-cyber-border rounded-[2rem] p-12 text-center hover:border-cyan-500 dark:hover:border-cyber-accent hover:bg-cyan-50/50 dark:hover:bg-cyber-accent/5 transition-all group duration-300">
                                <div className="flex justify-center mb-6">
                                    <div className="bg-slate-50 dark:bg-cyber-surface p-6 rounded-3xl shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 border border-slate-100 dark:border-cyber-border">
                                        <FileText className="size-12 text-slate-400 dark:text-slate-500 group-hover:text-cyan-500 dark:group-hover:text-cyber-accent transition-colors" />
                                    </div>
                                </div>

                                <p className="text-slate-900 dark:text-white font-black text-xl mb-2">
                                    Drop file here
                                </p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-8">
                                    or <span className="text-cyan-600 dark:text-cyber-accent underline underline-offset-4">browse your device</span>
                                </p>

                                <div className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-cyber-surface border border-slate-200 dark:border-cyber-border rounded-2xl text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 shadow-sm group-hover:shadow-lg transition-all">
                                    Supported: PDF, DOC, TXT
                                </div>
                            </div>

                            {fileError && (
                                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-2xl text-sm font-bold flex items-start gap-3">
                                    <ShieldAlert className="size-5 shrink-0" />
                                    {fileError}
                                </div>
                            )}
                        </label>
                    )}

                    {/* ===================== */}
                    {/* STEP 2: CONFIRMATION */}
                    {/* ===================== */}
                    {confirmStep && filePreview && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-slate-50 dark:bg-cyber-surface/50 rounded-[2rem] p-6 border border-slate-100 dark:border-cyber-border flex items-center gap-4">
                                <div className="p-4 bg-white dark:bg-cyber-void rounded-2xl shadow-sm">
                                    <FileText className="size-8 text-cyan-600 dark:text-cyber-accent" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black text-slate-900 dark:text-white truncate text-lg">{filePreview.name}</p>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                                        <span>{filePreview.size}</span>
                                        <span>•</span>
                                        <span>{filePreview.type.split('/')[1] || 'Document'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-[2rem] flex items-start gap-4">
                                <ShieldAlert className="size-6 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-black text-amber-900 dark:text-amber-400 mb-1 uppercase tracking-tight">Security Protocol</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-500/80 font-bold leading-relaxed">
                                        Encryption and steganographic processes will begin immediately upon confirmation. You will not be able to cancel once the process starts.
                                    </p>
                                </div>
                            </div>

                            {fileError && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-2xl text-sm font-bold flex items-center gap-3">
                                    <ShieldAlert className="size-5 shrink-0" />
                                    {fileError}
                                </div>
                            )}

                            <div className="flex items-center gap-4 pt-4">
                                <button
                                    onClick={resetAll}
                                    className="flex-1 px-8 py-4 bg-slate-100 dark:bg-cyber-surface text-slate-700 dark:text-slate-300 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-200 dark:hover:bg-cyber-border/30 transition-all"
                                >
                                    Choose Different
                                </button>

                                <button
                                    onClick={handleUpload}
                                    disabled={form.processing}
                                    className="flex-1 px-8 py-4 bg-gradient-to-r from-cyan-600 to-indigo-600 dark:from-cyber-accent dark:to-indigo-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:shadow-lg hover:shadow-cyan-500/30 transition-all flex items-center justify-center gap-3 group"
                                >
                                    {form.processing ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            Initializing...
                                        </>
                                    ) : (
                                        <>
                                            Begin Locking
                                            <ArrowRight className="size-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                <div className="px-8 pb-8 text-center">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">
                        Advanced Steganographic Security Layer
                    </p>
                </div>
            </div>
        </div>
    );
}

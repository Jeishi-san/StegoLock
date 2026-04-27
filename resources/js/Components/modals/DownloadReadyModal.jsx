import React from 'react';
import { X, CheckCircle, Shield, Download } from 'lucide-react';

export function DownloadReadyModal({ show, onClose, document, onDownload, onCancel }) {
    if (!show || !document) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-cyber-void rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-slate-200 dark:border-cyber-border" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-indigo-600 dark:bg-cyber-accent/10 p-6 text-white dark:text-cyber-accent text-center relative border-b dark:border-cyber-border">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 hover:bg-white/20 dark:hover:bg-cyber-accent/20 rounded-full transition-colors"
                    >
                        <X className="size-5" />
                    </button>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 dark:bg-cyber-accent/20 rounded-full mb-4 shadow-inner">
                        <CheckCircle className="size-10 text-white dark:text-cyber-accent" />
                    </div>
                    <h2 className="text-xl font-bold dark:text-white">File Unlocked</h2>
                    <p className="text-indigo-100 dark:text-slate-400 text-sm mt-1">Your document is ready for retrieval</p>
                </div>
                
                <div className="p-6">
                    <div className="bg-slate-50 dark:bg-cyber-surface/50 rounded-2xl p-4 mb-6 flex items-center gap-4 border border-slate-100 dark:border-cyber-border">
                        <div className="bg-white dark:bg-cyber-void p-2.5 rounded-xl shadow-sm border dark:border-cyber-border">
                            <Shield className="size-6 text-indigo-600 dark:text-cyber-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {document.filename || document.name}
                            </p>
                            <p className="text-[10px] font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest">Decryption complete</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={onCancel || onClose}
                            className="px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-cyber-surface hover:bg-gray-200 dark:hover:bg-cyber-border rounded-xl transition-all"
                        >
                            Keep File
                        </button>
                        <button 
                            onClick={() => onDownload(document.document_id || document.id)}
                            className="px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 dark:bg-cyber-accent hover:bg-indigo-700 dark:hover:bg-cyan-400 rounded-xl transition-all shadow-lg shadow-indigo-100 dark:shadow-cyber-accent/20 flex items-center justify-center gap-2"
                        >
                            <Download className="size-4" />
                            Download
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

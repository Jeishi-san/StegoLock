import React from 'react';
import { X, CheckCircle, Shield, Download } from 'lucide-react';

export function DownloadReadyModal({ show, onClose, document, onDownload, onCancel }) {
    if (!show || !document) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-96 overflow-hidden transform transition-all" onClick={(e) => e.stopPropagation()}>
                <div className="bg-indigo-600 p-6 text-white text-center relative">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="size-5" />
                    </button>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                        <CheckCircle className="size-10 text-white" />
                    </div>
                    <h2 className="text-xl font-bold">File Unlocked</h2>
                    <p className="text-indigo-100 text-sm mt-1">Your document is ready for retrieval</p>
                </div>
                
                <div className="p-6">
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 flex items-center gap-4">
                        <div className="bg-white p-2 rounded-lg shadow-sm">
                            <Shield className="size-6 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {document.filename}
                            </p>
                            <p className="text-xs text-gray-500">Decryption complete</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={onCancel || onClose}
                            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                        >
                            Keep File
                        </button>
                        <button 
                            onClick={() => onDownload(document.document_id)}
                            className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center justify-center gap-2"
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

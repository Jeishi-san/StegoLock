import { Trash2, X } from 'lucide-react';

export default function DeleteFolderModal({ 
    show, 
    onClose, 
    onConfirm, 
    folderName, 
    processing 
}) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-cyber-void rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-slate-200 dark:border-cyber-border" 
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-red-600 dark:bg-red-900/20 p-6 text-white dark:text-red-400 text-center relative border-b dark:border-red-900/30">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 hover:bg-white/20 dark:hover:bg-red-900/30 rounded-full transition-colors"
                    >
                        <X className="size-5" />
                    </button>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 dark:bg-red-900/30 rounded-full mb-4 shadow-inner">
                        <Trash2 className="size-10 text-white dark:text-red-400" />
                    </div>
                    <h2 className="text-xl font-bold dark:text-white">Delete Folder</h2>
                    <p className="text-red-100 dark:text-red-400/60 text-sm mt-1">This action cannot be undone</p>
                </div>
                
                <div className="p-6">
                    <p className="text-sm text-gray-500 dark:text-slate-400 text-center mb-6 leading-relaxed">
                        Are you sure you want to delete <span className="font-bold text-gray-900 dark:text-white">{folderName}</span>? 
                        All contained items will be moved to the root directory.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-cyber-surface hover:bg-gray-200 dark:hover:bg-cyber-border rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={processing}
                            className="px-4 py-2.5 text-sm font-bold text-white bg-red-600 dark:bg-red-600 hover:bg-red-700 dark:hover:bg-red-500 rounded-xl transition-all shadow-lg shadow-red-100 dark:shadow-red-900/20 disabled:opacity-50"
                        >
                            {processing ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

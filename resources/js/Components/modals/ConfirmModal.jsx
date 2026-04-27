import { X, AlertCircle, Loader2 } from 'lucide-react';

export function ConfirmModal({ 
    show, 
    title, 
    message, 
    onConfirm, 
    onCancel, 
    confirmText = "Confirm", 
    cancelText = "Cancel", 
    isDanger = false,
    isLoading = false 
}) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-cyber-void rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-cyber-border">
                <div className={`p-6 text-white text-center relative ${isDanger ? 'bg-red-600 dark:bg-red-900/20' : 'bg-indigo-600 dark:bg-cyber-accent/10'}`}>
                    <button 
                        onClick={onCancel}
                        disabled={isLoading}
                        className="absolute top-4 right-4 p-1 hover:bg-white/20 dark:hover:bg-cyber-accent/20 rounded-full transition-colors"
                    >
                        <X className="size-5 dark:text-white" />
                    </button>
                    <div className={`inline-flex items-center justify-center w-16 h-16 bg-white/20 dark:bg-cyber-accent/20 rounded-full mb-4 shadow-inner ${isDanger ? 'dark:bg-red-900/40' : ''}`}>
                        <AlertCircle className={`size-10 text-white ${isDanger ? 'dark:text-red-400' : 'dark:text-cyber-accent'}`} />
                    </div>
                    <h2 className={`text-xl font-bold dark:text-white`}>{title}</h2>
                </div>

                <div className="p-6">
                    <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed text-center mb-6 font-medium">
                        {message}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={onCancel}
                            disabled={isLoading}
                            className="px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-cyber-surface hover:bg-gray-200 dark:hover:bg-cyber-border rounded-xl transition-all disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${
                                isDanger 
                                    ? 'bg-red-600 hover:bg-red-700 shadow-red-100 dark:shadow-red-900/20' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100 dark:bg-cyber-accent dark:hover:bg-cyan-400 dark:shadow-cyber-accent/20'
                            }`}
                        >
                            {isLoading && <Loader2 className="size-4 animate-spin" />}
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

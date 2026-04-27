import { CheckCircle, X } from 'lucide-react';

export default function FileRetrievedModal({ 
    show, 
    onClose, 
    onKeep, 
    onDelete 
}) {
    if (!show) return null;

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
                    <h2 className="text-xl font-bold dark:text-white">File Retrieved</h2>
                    <p className="text-indigo-100 dark:text-slate-400 text-sm mt-1">What would you like to do with the unlocked file?</p>
                </div>
                
                <div className="p-6">
                    <p className="text-sm text-gray-500 dark:text-slate-400 text-center mb-6 leading-relaxed font-medium">
                        The file is currently decrypted on our server. You can keep it for later or delete it immediately for maximum security.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={onKeep}
                            className="px-4 py-2.5 text-sm font-bold text-indigo-600 dark:text-cyber-accent bg-indigo-50 dark:bg-cyber-accent/10 hover:bg-indigo-100 dark:hover:bg-cyber-accent/20 rounded-xl transition-all"
                        >
                            Keep File
                        </button>
                        <button 
                            onClick={onDelete}
                            className="px-4 py-2.5 text-sm font-bold text-white bg-red-600 dark:bg-red-600 hover:bg-red-700 dark:hover:bg-red-500 rounded-xl transition-all shadow-lg shadow-red-100 dark:shadow-red-900/20"
                        >
                            Delete File
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

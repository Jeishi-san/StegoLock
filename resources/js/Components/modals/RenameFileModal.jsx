import { Pencil, FileText, X } from 'lucide-react';

export default function RenameFileModal({ 
    show, 
    onClose, 
    onRename, 
    renameValue, 
    setRenameValue, 
    selectedDocId 
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
                        <Pencil className="size-10 text-white dark:text-cyber-accent" />
                    </div>
                    <h2 className="text-xl font-bold dark:text-white">Rename Document</h2>
                    <p className="text-indigo-100 dark:text-slate-400 text-sm mt-1">Enter a new name for your file</p>
                </div>
                
                <div className="p-6">
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">New Filename</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FileText className="size-5 text-gray-400 dark:text-slate-500" />
                                </div>
                                <input 
                                    autoFocus
                                    type="text" 
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            onRename(selectedDocId, renameValue);
                                            onClose();
                                        }
                                    }}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-cyber-border dark:bg-cyber-void rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-cyber-accent focus:border-transparent outline-none transition-all font-medium text-gray-700 dark:text-white"
                                    placeholder="Enter new filename"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={onClose} 
                            className="px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-cyber-surface hover:bg-gray-200 dark:hover:bg-cyber-border rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => {
                                onRename(selectedDocId, renameValue);
                                onClose();
                            }}
                            className="px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 dark:bg-cyber-accent hover:bg-indigo-700 dark:hover:bg-cyan-400 rounded-xl transition-all shadow-lg shadow-indigo-100 dark:shadow-cyber-accent/20"
                        >
                            Rename
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

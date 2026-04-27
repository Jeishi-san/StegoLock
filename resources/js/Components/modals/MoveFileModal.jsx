import { X, FolderOpen, FolderTree } from 'lucide-react';

export default function MoveFileModal({ 
    show, 
    onClose, 
    onMove, 
    folders, 
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
                        <FolderOpen className="size-10 text-white dark:text-cyber-accent" />
                    </div>
                    <h2 className="text-xl font-bold dark:text-white">Move to Folder</h2>
                    <p className="text-indigo-100 dark:text-slate-400 text-sm mt-1">Organize your document</p>
                </div>
                
                <div className="p-6">
                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar mb-6">
                        <button 
                            onClick={() => onMove(selectedDocId, null)} 
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-cyber-accent/10 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-cyber-accent/30 group text-left"
                        >
                            <div className="p-2 bg-gray-100 dark:bg-cyber-surface rounded-lg group-hover:bg-white dark:group-hover:bg-cyber-void">
                                <FolderOpen className="size-5 text-gray-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-cyber-accent" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-slate-300 group-hover:text-indigo-900 dark:group-hover:text-white">Root Directory</span>
                        </button>
                        {folders.map(folder => (
                            <button 
                                key={folder.folder_id} 
                                onClick={() => onMove(selectedDocId, folder.folder_id)} 
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-cyber-accent/10 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-cyber-accent/30 group text-left"
                            >
                                <div className="p-2 bg-indigo-50 dark:bg-cyber-accent/10 rounded-lg group-hover:bg-white dark:group-hover:bg-cyber-void">
                                    <FolderTree className="size-5 text-indigo-500 dark:text-cyber-accent" />
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-slate-300 group-hover:text-indigo-900 dark:group-hover:text-white truncate">{folder.name}</span>
                            </button>
                        ))}
                    </div>
                    
                    <div className="flex justify-end">
                        <button 
                            onClick={onClose} 
                            className="px-6 py-2.5 text-sm font-bold text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-cyber-surface hover:bg-gray-200 dark:hover:bg-cyber-border rounded-xl transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

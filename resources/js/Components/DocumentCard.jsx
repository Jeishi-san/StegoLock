import { FileText, Star, MoreVertical, Loader2, AlertCircle, Unlock, Pencil, FolderInput, Share2, Info, Trash2, Users } from 'lucide-react';
import { formatBytes, formatDate } from '@/Utils/fileUtils';
import { useState, useRef, useEffect } from 'react';
import Tooltip from '@/Components/Tooltip';
import {
    useFloating,
    offset,
    flip,
    shift,
    autoUpdate
} from '@floating-ui/react';

export default function DocumentCard({
    doc,
    unlockingProgress = {},
    onUnlock,
    onToggleStar,
    onShare,
    onFileInfo,
    onDelete,
    onMove,
    onRename,
    showOwner = false,
    ownerLabel = 'Owned by'
}) {
    const [openMenu, setOpenMenu] = useState(false);
    const menuRef = useRef(null);

    const isUnlocking = !!unlockingProgress[doc.document_id];
    const isProcessing = isUnlocking || !['stored', 'decrypted', 'retrieved', 'failed'].includes(doc.status);
    const processType = isUnlocking ? "Unlocking" : "Locking";

    const { x, y, strategy, refs } = useFloating({
        open: openMenu,
        onOpenChange: setOpenMenu,
        placement: 'bottom-end',
        middleware: [offset(8), flip(), shift()],
        whileElementsMounted: autoUpdate
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openMenu && menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenu]);

    const getFileColor = (type) => {
        switch (type) {
            case 'pdf': return 'text-red-500 bg-red-50';
            case 'doc':
            case 'docx': return 'text-blue-500 bg-blue-50';
            case 'txt': return 'text-gray-600 bg-gray-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusDisplay = (status, docId) => {
        if (unlockingProgress[docId]) {
            const elapsed = Date.now() - unlockingProgress[docId];
            if (elapsed < 2000) return 'Fetching stego files...';
            if (elapsed < 4000) return 'Extracting fragments...';
            if (elapsed < 6000) return 'Reconstructing file...';
            return 'Decrypting file...';
        }

        switch (status) {
            case 'uploaded': return 'Initializing...';
            case 'encrypted': return 'Encrypting file...';
            case 'fragmented': return 'Embedding file...';
            case 'mapped': return 'Embedding file...';
            case 'embedded': return 'Storing file...';
            case 'stored': return 'Stored';
            case 'extracted': return 'Reconstructing file...';
            case 'reconstructed': return 'Decrypting file...';
            case 'decrypted': return 'Decrypted';
            case 'retrieved': return 'Retrieved';
            case 'failed': return 'Error';
            default: return status.charAt(0).toUpperCase() + status.slice(1);
        }
    };
    return (
        <div
            key={doc.document_id}
            title={isProcessing ? `${processType} file is ongoing...` : undefined}
            className={"group relative w-full p-4 glass-panel rounded-2xl transition-all duration-300 " + 
                (isProcessing ? "border-cyber-accent/30 bg-cyber-accent/5 cursor-wait" : "hover:border-cyber-accent/50 dark:hover:shadow-glow-cyan cursor-pointer")}
            onClick={() => !isProcessing && setOpenMenu(false)}
        >
            {!isProcessing && (
                <div className={"absolute top-3 right-3 transition-opacity flex items-center gap-1 z-10 " + 
                    (openMenu ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleStar(doc.document_id);
                        }}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <Star 
                            className={"size-5 transition-all " + 
                                (doc.is_starred ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]" : "text-slate-400 dark:text-slate-500")} 
                        />
                    </button>

                    <button
                        ref={refs.setReference}
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(!openMenu);
                        }}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <MoreVertical className="size-5 text-slate-400" />
                    </button>
                </div>
            )}

            <div className="relative mb-4">
                <div className={`size-14 rounded-2xl p-3 flex items-center justify-center ${getFileColor(doc.file_type).replace('bg-', 'bg-opacity-10 bg-')}`}>
                    <FileText className={`size-full ${getFileColor(doc.file_type).split(' ')[0]}`} />
                </div>
                {isProcessing && (
                    <div className="absolute -top-1 -right-1 bg-cyber-void rounded-full p-1 border border-cyber-accent shadow-glow-cyan">
                        <Loader2 className="size-4 text-cyber-accent animate-spin" />
                    </div>
                )}
                {doc.shares_count > 0 && !isProcessing && (
                    <div className="absolute -bottom-1 -right-1 bg-cyber-accent rounded-full p-1 shadow-glow-cyan border-2 border-cyber-void" title={`Shared with ${doc.shares_count} people`}>
                        <Users className="size-3 text-cyber-void" />
                    </div>
                )}
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1 truncate group-hover:text-cyber-accent transition-colors" title={doc.filename}>
                {doc.filename}
            </h3>

            {showOwner && doc.owner_name && (
                <p className="text-[10px] text-slate-500 mb-2 font-medium uppercase tracking-wider">
                    {ownerLabel} <span className="text-slate-300">{doc.owner_name}</span>
                </p>
            )}

            <div className="flex justify-between items-center min-h-[20px] mt-auto pt-2 border-t border-cyber-border/30">
                {isProcessing ? (
                    <div className="flex flex-col w-full gap-1.5 py-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-cyber-accent tracking-widest animate-pulse uppercase">
                                {getStatusDisplay(doc.status, doc.document_id)}
                            </span>
                        </div>
                        <div className="w-full bg-cyber-surface rounded-full h-1 overflow-hidden">
                            <div className="bg-cyber-accent h-full animate-progress shadow-glow-cyan" style={{width: '30%'}}></div>
                        </div>
                    </div>
                ) : doc.status === 'failed' ? (
                    <Tooltip content={doc.error_message ? (typeof doc.error_message === 'object' ? JSON.stringify(doc.error_message) : doc.error_message) : "Error occurred during processing"}>
                        <div className="flex items-center gap-1 group/error cursor-help">
                            <AlertCircle className="size-3 text-red-500" />
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                                Error
                            </span>
                        </div>
                    </Tooltip>
                ) : (
                    <p className="text-[10px] text-slate-500 font-medium">
                        {formatBytes(doc.in_cloud_size || doc.original_size)}
                    </p>
                )}

                {!isProcessing && (
                    <p className="text-[10px] text-slate-500 font-medium">
                        {formatDate(new Date(doc.created_at))}
                    </p>
                )}
            </div>

            {openMenu && (
                <div
                    ref={(node) => {
                        menuRef.current = node;
                        refs.setFloating(node);
                    }}
                    style={{
                        position: strategy,
                        top: y ?? 0,
                        left: x ?? 0
                    }}
                    className="w-48 glass-panel rounded-xl shadow-2xl z-50 overflow-hidden py-1.5 animate-fade-in bg-white dark:bg-cyber-surface/95"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => { onUnlock(doc.document_id); setOpenMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-cyber-accent hover:text-white dark:hover:text-cyber-void transition-colors text-left">
                        <Unlock className="size-4" />
                        Unlock File
                    </button>

                    <div className="border-t border-slate-100 dark:border-cyber-border/50 my-1" />

                    <button
                        onClick={() => { onRename(doc); setOpenMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-cyber-accent hover:text-white dark:hover:text-cyber-void transition-colors text-left">
                        <Pencil className="size-4" />
                        Rename
                    </button>

                    <button
                        onClick={() => { onMove(doc.document_id); setOpenMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-cyber-accent hover:text-white dark:hover:text-cyber-void transition-colors text-left">
                        <FolderInput className="size-4" />
                        Move File
                    </button>

                    <div className="border-t border-slate-100 dark:border-cyber-border/50 my-1" />

                    {doc.is_owner && (
                        <button 
                            onClick={() => { onShare(doc); setOpenMenu(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-cyber-accent hover:text-white dark:hover:text-cyber-void transition-colors text-left">
                            <Share2 className="size-4" />
                            Share File
                        </button>
                    )}

                    <button
                        onClick={() => { onFileInfo(doc); setOpenMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-cyber-accent hover:text-white dark:hover:text-cyber-void transition-colors text-left">
                        <Info className="size-4" />
                        File Info
                    </button>

                    <div className="border-t border-slate-100 dark:border-cyber-border/50 my-1" />

                    <button
                        onClick={() => { onDelete(doc.document_id); setOpenMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-colors text-left">
                        <Trash2 className="size-4" />
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}

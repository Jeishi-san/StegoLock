import { MoreVertical, Shield, Loader2, Star, Unlock, FolderInput, Info, Trash2, Pencil, FileText } from 'lucide-react';
import { formatBytes, formatDate, getFileColor, getFileIcon } from '@/Utils/fileUtils';

export function DocumentList({ 
    documents, 
    unlockingProgress = {}, 
    onUnlock, 
    onToggleStar, 
    onShare, 
    onFileInfo, 
    onDelete, 
    onMove, 
    onRename,
    openMenuId,
    setOpenMenuId,
    refs,
    strategy,
    x,
    y,
    menuRef
}) {
    return (
        <div className="glass-panel rounded-3xl border-cyber-border/50 overflow-hidden bg-cyber-surface/10">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-cyber-surface/50 text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] border-b border-cyber-border/30">
                        <tr>
                            <th className="px-8 py-5">Identifier</th>
                            <th className="px-8 py-5">Mass</th>
                            <th className="px-8 py-5">Protocol Status</th>
                            <th className="px-8 py-5">Initialized</th>
                            <th className="px-8 py-5 text-right">Directives</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-cyber-border/20">
                        {documents.map(doc => {
                            const Icon = getFileIcon(doc.file_type || '');
                            const colorClass = getFileColor(doc.file_type || '');
                            const isProcessing = unlockingProgress[doc.document_id] || !['stored', 'decrypted', 'retrieved', 'failed'].includes(doc.status);

                            return (
                                <tr 
                                    key={doc.document_id} 
                                    className={"transition-all duration-300 group " + (isProcessing ? "bg-cyber-accent/5 cursor-wait" : "hover:bg-cyber-accent/5 cursor-pointer")}
                                    onClick={() => !isProcessing && onFileInfo(doc)}
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-2xl bg-cyber-surface border border-cyber-border group-hover:border-cyber-accent/50 transition-all group-hover:shadow-glow-cyan/20`}>
                                                <Icon className={`size-5 ${colorClass.split(' ')[0]}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-white truncate max-w-[250px] tracking-tight group-hover:text-cyber-accent transition-colors" title={doc.filename}>
                                                    {doc.filename}
                                                </p>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                                                    {doc.file_type || 'DATA'} MODULE
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-slate-300 font-bold tabular-nums">
                                        {formatBytes(doc.in_cloud_size || doc.original_size)}
                                    </td>
                                    <td className="px-8 py-5">
                                        {isProcessing ? (
                                            <div className="flex items-center gap-3 text-cyber-accent">
                                                <Loader2 className="size-4 animate-spin" />
                                                <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Processing...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="size-2 rounded-full bg-cyber-accent shadow-glow-cyan animate-pulse" />
                                                <span className="text-[10px] font-black text-cyber-accent uppercase tracking-widest">Secured</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 text-slate-500 font-bold text-xs uppercase tracking-tighter">
                                        {formatDate(doc.created_at)}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onToggleStar(doc.document_id);
                                                }}
                                                className={`p-2.5 rounded-xl transition-all border ${doc.is_starred ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' : 'text-slate-600 bg-cyber-surface border-cyber-border hover:text-white hover:border-slate-500'}`}
                                            >
                                                <Star className={`size-4 ${doc.is_starred ? 'fill-current' : ''}`} />
                                            </button>
                                            <div className="relative">
                                                <button
                                                    ref={(node) => openMenuId === doc.document_id && refs.setReference(node)}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(openMenuId === doc.document_id ? null : doc.document_id);
                                                    }}
                                                    className={`p-2.5 rounded-xl transition-all border ${openMenuId === doc.document_id ? 'bg-cyber-accent border-cyber-accent text-cyber-void' : 'bg-cyber-surface border-cyber-border text-slate-500 hover:text-white hover:border-slate-500'}`}
                                                >
                                                    <MoreVertical className="size-4" />
                                                </button>
                                                {openMenuId === doc.document_id && (
                                                    <div
                                                        ref={(node) => { menuRef.current = node; refs.setFloating(node); }}
                                                        style={{ position: strategy, top: y ?? 0, left: x ?? 0 }}
                                                        className="w-52 glass-panel border border-cyber-border/50 rounded-2xl shadow-2xl z-[60] overflow-hidden py-2 text-left animate-fade-in"
                                                    >
                                                        <button onClick={() => onUnlock(doc.document_id)} className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-300 hover:bg-cyber-accent hover:text-cyber-void transition-all">
                                                            <Unlock className="size-4" /> Unlock Protocol
                                                        </button>
                                                        <button onClick={() => onRename(doc)} className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-300 hover:bg-cyber-accent hover:text-cyber-void transition-all">
                                                            <Pencil className="size-4" /> Update Identifier
                                                        </button>
                                                        <button onClick={() => onMove(doc.document_id)} className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-300 hover:bg-cyber-accent hover:text-cyber-void transition-all">
                                                            <FolderInput className="size-4" /> Relocate Module
                                                        </button>
                                                        <button onClick={() => onShare(doc)} className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-300 hover:bg-cyber-accent hover:text-cyber-void transition-all">
                                                            <Info className="size-4" /> Access Control
                                                        </button>
                                                        <div className="h-px bg-cyber-border/30 my-2 mx-2" />
                                                        <button onClick={() => onDelete(doc.document_id)} className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500 hover:text-white transition-all">
                                                            <Trash2 className="size-4" /> Terminate Module
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-widest text-[10px] border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4">Name</th>
                            <th className="px-6 py-4">Size</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Created</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {documents.map(doc => {
                            const Icon = getFileIcon(doc.file_type || '');
                            const colorClass = getFileColor(doc.file_type || '');
                            const isProcessing = unlockingProgress[doc.document_id] || !['stored', 'decrypted', 'retrieved', 'failed'].includes(doc.status);

                            return (
                                <tr 
                                    key={doc.document_id} 
                                    className={"transition-colors group " + (isProcessing ? "bg-indigo-50/50 cursor-wait" : "hover:bg-gray-50/50 cursor-pointer")}
                                    onClick={() => !isProcessing && onFileInfo(doc)}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${colorClass} transition-transform group-hover:scale-110`}>
                                                <Icon className="size-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-900 truncate max-w-[200px]" title={doc.filename}>
                                                    {doc.filename}
                                                </p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                                    {doc.file_type || 'File'}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 font-medium">
                                        {formatBytes(doc.in_cloud_size || doc.original_size)}
                                    </td>
                                    <td className="px-6 py-4">
                                        {isProcessing ? (
                                            <div className="flex items-center gap-2 text-indigo-600">
                                                <Loader2 className="size-4 animate-spin" />
                                                <span className="text-xs font-bold animate-pulse">Processing...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5">
                                                <Shield className="size-4 text-green-500" />
                                                <span className="text-xs font-bold text-green-600 uppercase">Secured</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 font-medium">
                                        {formatDate(doc.created_at)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onToggleStar(doc.document_id);
                                                }}
                                                className={`p-2 rounded-lg transition-colors ${doc.is_starred ? 'text-yellow-400 bg-yellow-50' : 'text-gray-400 hover:bg-gray-100'}`}
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
                                                    className={`p-2 rounded-lg transition-colors ${openMenuId === doc.document_id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-100'}`}
                                                >
                                                    <MoreVertical className="size-4" />
                                                </button>
                                                {openMenuId === doc.document_id && (
                                                    <div
                                                        ref={(node) => { menuRef.current = node; refs.setFloating(node); }}
                                                        style={{ position: strategy, top: y ?? 0, left: x ?? 0 }}
                                                        className="w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-[60] overflow-hidden py-1 text-left"
                                                    >
                                                        <button onClick={() => onUnlock(doc.document_id)} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition-colors">
                                                            <Unlock className="size-4 text-gray-400" /> Unlock
                                                        </button>
                                                        <button onClick={() => onRename(doc)} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition-colors">
                                                            <Pencil className="size-4 text-gray-400" /> Rename
                                                        </button>
                                                        <button onClick={() => onMove(doc.document_id)} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition-colors">
                                                            <FolderInput className="size-4 text-gray-400" /> Move
                                                        </button>
                                                        <button onClick={() => onShare(doc)} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition-colors">
                                                            <Info className="size-4 text-gray-400" /> Share
                                                        </button>
                                                        <div className="h-px bg-gray-100 my-1" />
                                                        <button onClick={() => onDelete(doc.document_id)} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                                            <Trash2 className="size-4" /> Delete
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

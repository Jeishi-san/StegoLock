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
    unlockingProgress,
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

    const getStatusColor = (status) => {
        switch (status) {
            case 'stored':
            case 'decrypted':
            case 'retrieved': return 'bg-green-100 text-green-700';
            case 'failed': return 'bg-red-100 text-red-700';
            default: return 'bg-indigo-100 text-indigo-700';
        }
    };

    return (
        <div
            key={doc.document_id}
            title={isProcessing ? `${processType} file is ongoing...` : undefined}
            className={"group relative w-full p-4 bg-white rounded-lg shadow transition " + 
                (isProcessing ? "border-2 border-indigo-100 bg-indigo-50/10 cursor-wait" : "hover:shadow-lg hover:ring-1 hover:ring-purple-600 cursor-pointer")}
            onClick={() => !isProcessing && setOpenMenu(false)}
        >
            {!isProcessing && (
                <div className={"absolute top-0 right-0 p-4 transition space-x-1 z-10 " + 
                    (openMenu ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleStar(doc.document_id);
                        }}
                    >
                        <Star 
                            className={"size-8 hover:bg-gray-100 rounded-md p-1.5 transition " + 
                                (doc.is_starred ? "text-yellow-400 fill-yellow-400" : "text-gray-400")} 
                        />
                    </button>

                    <button
                        ref={refs.setReference}
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(!openMenu);
                        }}
                    >
                        <MoreVertical className="size-8 text-gray-400 hover:bg-gray-100 rounded-md p-1.5" />
                    </button>
                </div>
            )}

            <div className="relative">
                <FileText className={"size-14 rounded-xl p-2 " + getFileColor(doc.file_type)} />
                {isProcessing && (
                    <div className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                        <Loader2 className="size-5 text-indigo-600 animate-spin" />
                    </div>
                )}
                {doc.shares_count > 0 && !isProcessing && (
                    <div className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full p-1 shadow-sm border-2 border-white" title={`Shared with ${doc.shares_count} people`}>
                        <Users className="size-3 text-white" />
                    </div>
                )}
            </div>

            <h3 className="text-md font-semibold text-gray-800 my-3 truncate" title={doc.filename}>
                {doc.filename}
            </h3>

            {showOwner && doc.owner_name && (
                <p className="text-xs text-gray-500 mb-2">
                    {ownerLabel} {doc.owner_name}
                </p>
            )}

            <div className="flex justify-between items-center min-h-[20px]">
                {isProcessing ? (
                    <div className="flex flex-col w-full mt-2 gap-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-600 tracking-wider animate-pulse">
                                {getStatusDisplay(doc.status, doc.document_id)}
                            </span>
                        </div>
                        <div className="w-full bg-indigo-100 rounded-full h-1 overflow-hidden">
                            <div className="bg-indigo-600 h-full animate-progress" style={{width: '30%'}}></div>
                        </div>
                    </div>
                ) : doc.status === 'failed' ? (
                    <Tooltip content={doc.error_message ? (typeof doc.error_message === 'object' ? JSON.stringify(doc.error_message) : doc.error_message) : "Error occurred during processing"}>
                        <div className="flex items-center gap-1 group/error">
                            <AlertCircle className="size-3 text-red-500" />
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                                Error
                            </span>
                        </div>
                    </Tooltip>
                ) : (
                    <p className="text-sm text-gray-500">
                        {formatBytes(doc.in_cloud_size || doc.original_size)}
                    </p>
                )}

                <p className="text-sm text-gray-500">
                    {formatDate(new Date(doc.created_at))}
                </p>
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
                    className="w-48 bg-white border rounded-xl shadow-lg z-50 overflow-hidden py-1"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => { onUnlock(doc.document_id); setOpenMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-left">
                        <Unlock className="w-4 h-4 text-gray-600" />
                        Unlock File
                    </button>

                    <div className="border-t" />

                    <button
                        onClick={() => { onRename(doc); setOpenMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-left">
                        <Pencil className="w-4 h-4 text-gray-600" />
                        Rename
                    </button>

                    <button
                        onClick={() => { onMove(doc.document_id); setOpenMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-left">
                        <FolderInput className="w-4 h-4 text-gray-600" />
                        Move File
                    </button>

                    <div className="border-t" />

                    {doc.is_owner && (
                        <button 
                            onClick={() => { onShare(doc); setOpenMenu(false); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-left">
                            <Share2 className="w-4 h-4 text-gray-600" />
                            Share File
                        </button>
                    )}

                    <button
                        onClick={() => { onFileInfo(doc); setOpenMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-left">
                        <Info className="w-4 h-4 text-gray-600" />
                        File Info
                    </button>

                    <div className="border-t" />

                    <button
                        onClick={() => { onDelete(doc.document_id); setOpenMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 text-left">
                        <Trash2 className="w-4 h-4 text-red-500" />
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}

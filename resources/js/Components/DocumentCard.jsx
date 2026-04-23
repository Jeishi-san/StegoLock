import { FileText, Star, MoreVertical, Loader2, AlertCircle } from 'lucide-react';
import { formatBytes, formatDate } from '@/Utils/fileUtils';
import { FileActionsMenu } from '@/Components/FileActionsMenu';
import { useState } from 'react';

export default function DocumentCard({
    doc,
    onUnlock,
    onToggleStar,
    onShare,
    onFileInfo,
    onDelete,
    onRename,
    onMove,
    showOwner = false,
    ownerLabel = 'Owned by',
    allowedActions = ['unlock', 'rename', 'move', 'share', 'info', 'delete']
}) {
    const [openMenuId, setOpenMenuId] = useState(null);

    const isProcessing = !['stored', 'decrypted', 'failed'].includes(doc.status);

    const getFileColor = (type) => {
        switch (type) {
            case 'pdf':
                return 'text-red-500 bg-red-50';
            case 'doc':
            case 'docx':
                return 'text-blue-500 bg-blue-50';
            case 'txt':
                return 'text-gray-600 bg-gray-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    const getStatusDisplay = (status) => {
        switch (status) {
            case 'uploaded': return 'Initializing...';
            case 'encrypted': return 'Encrypting file...';
            case 'fragmented': return 'Embedding file...';
            case 'mapped': return 'Embedding file...';
            case 'embedded': return 'Storing files...';
            case 'extracted': return 'Extracting fragments...';
            case 'reconstructed': return 'Assembling file...';
            case 'failed': return 'Processing failed';
            default: return status.charAt(0).toUpperCase() + status.slice(1);
        }
    };

    const toggleMenu = (id) => {
        setOpenMenuId(prev => (prev === id ? null : id));
    };

    return (
        <div
            key={doc.document_id}
            title={isProcessing ? "Locking file is ongoing..." : ""}
            className={"group relative w-full p-4 bg-white rounded-lg shadow transition " +
                (isProcessing ? "border-2 border-indigo-100 bg-indigo-50/10 cursor-wait" : "hover:shadow-lg hover:ring-1 hover:ring-purple-600 cursor-pointer")}
        >
            {!isProcessing && (
                <div className={"absolute top-0 right-0 p-4 transition space-x-1 z-10 " +
                    (openMenuId === doc.document_id ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                    {/* Star */}
                    <button onClick={() => onToggleStar(doc.document_id)}>
                        <Star className={`size-8 hover:bg-gray-100 rounded-md p-1.5 ${doc.starred ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                    </button>

                    {/* Vertical 3-Dot Menu */}
                    <button
                        id={`menu-btn-${doc.document_id}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleMenu(doc.document_id);
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
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-indigo-600 animate-pulse">
                            {getStatusDisplay(doc.status)}
                        </span>
                    </div>
                ) : doc.status === 'failed' ? (
                    <div className="flex items-center gap-1 group/error"
                         title={typeof doc.error_message === 'object' ? JSON.stringify(doc.error_message) : doc.error_message}>
                        <AlertCircle className="size-3 text-red-500" />
                        <span className="text-xs font-medium text-red-600">
                            {getStatusDisplay(doc.status)}
                        </span>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">
                        {formatBytes(doc.in_cloud_size || doc.original_size)}
                    </p>
                )}

                <p className="text-sm text-gray-500">
                    {formatDate(new Date(doc.created_at))}
                </p>
            </div>

            {openMenuId === doc.document_id && (
                <FileActionsMenu
                    doc={doc}
                    buttonId={`menu-btn-${doc.document_id}`}
                    onClose={() => setOpenMenuId(null)}
                    onToggleEncryption={() => onUnlock(doc.document_id)}
                    onShare={() => onShare(doc)}
                    onInfo={() => onFileInfo(doc.document_id)}
                    onDelete={() => onDelete(doc.document_id)}
                    onRename={() => onRename && onRename(doc.document_id)}
                    onMoveFile={() => onMove && onMove(doc.document_id)}
                    isProcessing={isProcessing}
                />
            )}
        </div>
    );
}

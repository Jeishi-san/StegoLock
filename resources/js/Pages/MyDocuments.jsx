import { Shield, FileText, Star, MoreVertical,
    Unlock, Pencil, FolderInput, Share2, Info, Trash2, Lock } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatBytes, formatDate } from '@/Utils/fileUtils';
import { Inertia } from '@inertiajs/inertia';
import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';

// ADD THIS
import {
    useFloating,
    offset,
    flip,
    shift,
    autoUpdate,
    size
} from '@floating-ui/react';

export default function MyDocuments({ documents, totalStorage, storageLimit }) {

    const menuRef = useRef(null);

    const [openMenuId, setOpenMenuId] = useState(null);

    const toggleMenu = (id) => {
        setOpenMenuId(prev => (prev === id ? null : id));
    };

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
                return 'Unknown File Type';
        }
    };

    // (Floating UI setup)
    const { x, y, strategy, refs } = useFloating({
        placement: 'bottom-end',
        middleware: [
            offset(8),

            flip({
                boundary: 'viewport',
            }),

            shift({
                boundary: 'viewport',
                padding: 8
            })
        ],

        whileElementsMounted: autoUpdate
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openMenuId && menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuId]);

    // handleUnlockFile
    const handleUnlock = async (id) => {
        router.post('/documents/unlock', { id });

        const interval = setInterval(async () => {
            const res = await fetch(`/documents/status/${id}`);
            const data = await res.json();

            if (data.status === 'decrypted') {
                clearInterval(interval);
                window.location.href = `/documents/download/${id}`;
            }

            if (data.status === 'failed') {
                clearInterval(interval);
                alert('Decryption failed');
            }

        }, 2000); // check every 2 seconds
    };

    //handleFileInfo
    const handleFileInfo = async (id) => {
        router.get('/documents/getFileInfo', { id });
    };

    // handleDelete
    const handleDelete = async (id) => {
        const resp = await axios.post('/documents/delete', {
            document_id: id,
        });

        console.log(resp.data);
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    My Documents
                </h2>
            }
            totalStorage={totalStorage}
            storageLimit={storageLimit}
        >
            <Head title="My Documents"/>

            {/* GRID VIEW (DEFAULT) */}
            {documents.length > 0 ? (
                <div className="h-full overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                        {documents.map(doc => {
                            return (
                                <div
                                    key={doc.document_id}
                                    className="group relative p-4 bg-white rounded-lg shadow hover:shadow-lg hover:ring-1 hover:ring-purple-600 transition"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition space-x-1">
                                        {/* Star */}
                                        <button>
                                            <Star className="size-8 text-gray-400 hover:bg-gray-100 rounded-md p-1.5" />
                                        </button>

                                        {/* Vertical 3-Dot Menu */}
                                        <button
                                            ref={(node) => {
                                                if (openMenuId === doc.document_id) {
                                                    refs.setReference(node);
                                                }
                                            }}
                                            onClick={() => toggleMenu(doc.document_id)}
                                        >
                                            <MoreVertical className="size-8 text-gray-400 hover:bg-gray-100 rounded-md p-1.5" />
                                        </button>
                                    </div>

                                    <FileText className={"size-14 rounded-xl p-2 " + getFileColor(doc.file_type)} />

                                    <h3 className="text-md font-semibold text-gray-800 my-3">
                                        {doc.filename}
                                    </h3>

                                    <div className="flex justify-between">
                                        <p className="text-sm text-gray-500">
                                            {formatBytes(doc.in_cloud_size)}
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            {formatDate(new Date(doc.created_at))}
                                        </p>
                                    </div>

                                    {openMenuId === doc.document_id && (
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
                                            className="w-36 bg-white border rounded-xl shadow-lg z-50 overflow-hidden"
                                        >

                                            {/* Retrieve / Download */}
                                            <button
                                                onClick={() => handleUnlock(doc.document_id)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                                                <Unlock className="w-4 h-4 text-gray-600" />
                                                Unlock File
                                            </button>

                                            <div className="border-t" />

                                            {/* Rename */}
                                            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                                                <Pencil className="w-4 h-4 text-gray-600" />
                                                Rename
                                            </button>

                                            {/* Move */}
                                            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                                                <FolderInput className="w-4 h-4 text-gray-600" />
                                                Move File
                                            </button>

                                            <div className="border-t" />

                                            {/* Share */}
                                            <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                                                <Share2 className="w-4 h-4 text-gray-600" />
                                                Share File
                                            </button>

                                            {/* Info */}
                                            <button
                                                onClick={() => handleFileInfo(doc.document_id)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50">
                                                <Info className="w-4 h-4 text-gray-600" />
                                                File Info
                                            </button>

                                            <div className="border-t" />

                                            {/* Delete */}
                                            <button
                                                onClick={() => handleDelete(doc.document_id)}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-red-50 text-red-600">
                                                <Trash2 className="w-4 h-4 text-red-500" />
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Shield className="size-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Found</h3>
                        <p className="text-gray-500">Upload files to get started</p>
                    </div>
                </div>
            )}

        </AuthenticatedLayout>
    );
}

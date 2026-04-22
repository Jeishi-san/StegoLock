import { Shield, FileText, Star, MoreVertical, Plus,
    Unlock, Pencil, FolderInput, FolderOpen, Folder, Share2, Info, Trash2, Lock } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatBytes, formatDate } from '@/Utils/fileUtils';
import { Head } from '@inertiajs/react';


export default function MyFolders({ folders, totalStorage, storageLimit  }) {

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    My Folders
                </h2>
            }
            totalStorage={totalStorage}
            storageLimit={storageLimit}
        >

            <Head title="My Folders"/>

            {/* GRID VIEW (DEFAULT) */}
            {folders.length > 0 ? (
                <div className="h-full overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                        {folders.map(folder => {
                            return (
                                <div
                                    key={folder.folder_id}
                                    className="group relative w-full p-4 bg-white rounded-lg shadow hover:shadow-lg hover:ring-1 hover:ring-purple-600 transition"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition space-x-1">
                                        {/* Vertical 3-Dot Menu */}
                                        {/* rename folder
                                            delete folder
                                            move folder */}
                                        <button>
                                            <MoreVertical className="size-8 text-gray-400 hover:bg-gray-100 rounded-md p-1.5" />
                                        </button>
                                    </div>

                                    <FileText className={"size-14 rounded-xl p-2 "} />

                                    <h3 className="text-md font-semibold text-gray-800 my-3 truncate">

                                    </h3>

                                    <div className="flex justify-between">
                                        <p className="text-sm text-gray-500">

                                        </p>

                                        <p className="text-sm text-gray-500">

                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Folder className="size-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Folders Yet</h3>
                        <p className="text-gray-500">Create folders to organize your documents better</p>

                        {/* NEW FOLDER BUTTON */}
                        <div className="mx-auto max-w-7xl sm:px-6 lg:px-6">
                            <div className="flex my-4 relative">
                                {/* New Button with Dropdown */}
                                <button
                                    onClick={() => { setShowNewMenu(!showNewMenu); }}
                                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r
                                                from-indigo-600 to-purple-600 text-white px-4 py-3.5
                                                rounded-xl hover:from-indigo-700 hover:to-purple-700
                                                transition-all font-medium shadow-lg shadow-indigo-500/30"
                                >
                                    <Plus className="size-5" />
                                    Create Your First Folder
                                </button>

                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

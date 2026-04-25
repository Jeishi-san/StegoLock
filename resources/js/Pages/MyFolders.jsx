import { Shield, FileText, Star, MoreVertical, Plus,
    Unlock, Pencil, FolderInput, FolderOpen, Folder, Share2, Info, Trash2, Lock, FolderTree, X } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatBytes, formatDate } from '@/Utils/fileUtils';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import Dropdown from '@/Components/Dropdown';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import { SearchBar } from '@/Components/SearchBar';

export default function MyFolders({ folders, totalStorage, storageLimit  }) {
    const [showNewMenu, setShowNewMenu] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [name, setName] = useState('');
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        sort: 'date-newest'
    });

    const filteredFolders = useMemo(() => {
        let result = [...folders];

        // Search filter
        if (searchQuery) {
            result = result.filter(folder => 
                folder.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Sort filter
        result.sort((a, b) => {
            switch (filters.sort) {
                case 'name-asc': return a.name.localeCompare(b.name);
                case 'name-desc': return b.name.localeCompare(a.name);
                case 'date-newest': return new Date(b.created_at) - new Date(a.created_at);
                case 'date-oldest': return new Date(a.created_at) - new Date(b.created_at);
                default: return 0;
            }
        });

        return result;
    }, [folders, searchQuery, filters]);

    const openCreateModal = () => {
        setName('');
        setErrors({});
        setShowCreateModal(true);
    };

    const openRenameModal = (folder) => {
        setSelectedFolder(folder);
        setName(folder.name);
        setErrors({});
        setShowRenameModal(true);
    };

    const openDeleteModal = (folder) => {
        setSelectedFolder(folder);
        setShowDeleteModal(true);
    };

    const submitCreate = async (e) => {
        e.preventDefault();
        setProcessing(true);
        const toastId = toast.loading('Creating folder...');
        try {
            await axios.post('/folders', { name });
            toast.success('Folder created successfully', { id: toastId });
            setShowCreateModal(false);
            router.reload();
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            }
            toast.error('Failed to create folder', { id: toastId });
        } finally {
            setProcessing(false);
        }
    };

    const submitRename = async (e) => {
        e.preventDefault();
        setProcessing(true);
        const toastId = toast.loading('Renaming folder...');
        try {
            await axios.put(`/folders/${selectedFolder.folder_id}`, { name });
            toast.success('Folder renamed successfully', { id: toastId });
            setShowRenameModal(false);
            router.reload();
        } catch (err) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            }
            toast.error('Failed to rename folder', { id: toastId });
        } finally {
            setProcessing(false);
        }
    };

    const submitDelete = async (e) => {
        e.preventDefault();
        setProcessing(true);
        const toastId = toast.loading('Deleting folder...');
        try {
            await axios.delete(`/folders/${selectedFolder.folder_id}`);
            toast.success('Folder deleted successfully', { id: toastId });
            setShowDeleteModal(false);
            router.reload();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete folder', { id: toastId });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-2xl font-black tracking-tight text-gray-900">My Folders</h2>
            }
            subHeader={
                <SearchBar 
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    filters={filters}
                    onFiltersChange={setFilters}
                    showFormatFilter={false}
                    showStatusFilter={false}
                    showOwnerFilter={false}
                />
            }
            totalStorage={totalStorage}
            storageLimit={storageLimit}
        >
            <Head title="My Folders"/>

            {/* GRID VIEW (DEFAULT) */}
            {filteredFolders.length > 0 || folders.length > 0 ? (
                <div className="h-full overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                        {filteredFolders.map(folder => {
                            return (
                                <div
                                    key={folder.folder_id}
                                    className="group relative w-full p-4 bg-white rounded-lg shadow hover:shadow-lg hover:ring-1 hover:ring-purple-600 transition"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition space-x-1">
                                        <Dropdown>
                                            <Dropdown.Trigger>
                                                <button>
                                                    <MoreVertical className="size-8 text-gray-400 hover:bg-gray-100 rounded-md p-1.5" />
                                                </button>
                                            </Dropdown.Trigger>
                                            <Dropdown.Content>
                                                <button
                                                    onClick={() => openRenameModal(folder)}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                                >
                                                    <Pencil className="size-4 mr-2" /> Rename
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(folder)}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                                                >
                                                    <Trash2 className="size-4 mr-2" /> Delete
                                                </button>
                                            </Dropdown.Content>
                                        </Dropdown>
                                    </div>

                                    <div 
                                        className="flex flex-col items-center justify-center py-4 cursor-pointer"
                                        onClick={() => router.visit(`/myDocuments?folder_id=${folder.folder_id}`)}
                                    >
                                        <FolderOpen className="size-16 text-indigo-500 mb-2" />
                                        <h3 className="text-md font-semibold text-gray-800 truncate w-full text-center">
                                            {folder.name}
                                        </h3>
                                    </div>

                                    <div className="flex justify-between mt-2">
                                        <p className="text-xs text-gray-500">
                                            {formatDate(new Date(folder.created_at))}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* Add Folder Card */}
                        <button
                            onClick={openCreateModal}
                            className="w-full p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-purple-500 hover:bg-purple-50 transition"
                        >
                            <Plus className="size-10 text-gray-400 mb-2" />
                            <span className="text-sm font-medium text-gray-600">New Folder</span>
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Folder className="size-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Folders Yet</h3>
                        <p className="text-gray-500 mb-6">Create folders to organize your documents better</p>

                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-indigo-500/30"
                        >
                            <Plus className="size-5" />
                            Create Your First Folder
                        </button>
                    </div>
                </div>
            )}

            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-96 overflow-hidden transform transition-all" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-indigo-600 p-6 text-white text-center relative">
                            <button 
                                onClick={() => setShowCreateModal(false)}
                                className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                                <Plus className="size-10 text-white" />
                            </div>
                            <h2 className="text-xl font-bold">New Folder</h2>
                            <p className="text-indigo-100 text-sm mt-1">Organize your workspace</p>
                        </div>
                        
                        <div className="p-6">
                            <form onSubmit={submitCreate}>
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Folder Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Folder className="size-5 text-gray-400" />
                                        </div>
                                        <TextInput
                                            id="name"
                                            type="text"
                                            name="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-gray-700"
                                            placeholder="Enter folder name"
                                            isFocused
                                        />
                                    </div>
                                    <InputError message={errors.name} className="mt-2" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-4 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                                    >
                                        Create Folder
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Rename Folder Modal */}
            {showRenameModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowRenameModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-96 overflow-hidden transform transition-all" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-indigo-600 p-6 text-white text-center relative">
                            <button 
                                onClick={() => setShowRenameModal(false)}
                                className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                                <Pencil className="size-10 text-white" />
                            </div>
                            <h2 className="text-xl font-bold">Rename Folder</h2>
                            <p className="text-indigo-100 text-sm mt-1">Enter a new name</p>
                        </div>
                        
                        <div className="p-6">
                            <form onSubmit={submitRename}>
                                <div className="mb-6">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Folder Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Folder className="size-5 text-gray-400" />
                                        </div>
                                        <TextInput
                                            id="rename-name"
                                            type="text"
                                            name="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium text-gray-700"
                                            placeholder="Enter folder name"
                                            isFocused
                                        />
                                    </div>
                                    <InputError message={errors.name} className="mt-2" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowRenameModal(false)}
                                        className="px-4 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Folder Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDeleteModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-96 overflow-hidden transform transition-all" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-red-600 p-6 text-white text-center relative">
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                                <Trash2 className="size-10 text-white" />
                            </div>
                            <h2 className="text-xl font-bold">Delete Folder</h2>
                            <p className="text-red-100 text-sm mt-1">This action cannot be undone</p>
                        </div>
                        
                        <div className="p-6">
                            <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">
                                Are you sure you want to delete <span className="font-bold text-gray-900">{selectedFolder?.name}</span>? 
                                All contained items will be moved to the root directory.
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={submitDelete}
                                    disabled={processing}
                                    className="px-4 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-lg shadow-red-100 disabled:opacity-50"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

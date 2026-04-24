import { Shield, FileText, Star, MoreVertical, Plus,
    Unlock, Pencil, FolderInput, FolderOpen, Folder, Share2, Info, Trash2, Lock, FolderTree } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatBytes, formatDate } from '@/Utils/fileUtils';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import Dropdown from '@/Components/Dropdown';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

export default function MyFolders({ folders, totalStorage, storageLimit  }) {
    const [showNewMenu, setShowNewMenu] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState(null);
    const [name, setName] = useState('');
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

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

            {/* Create Folder Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl w-80 p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Create New Folder</h2>
                        <form onSubmit={submitCreate}>
                            <div className="mb-6">
                                <TextInput
                                    id="name"
                                    type="text"
                                    name="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="Enter folder name"
                                    isFocused
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm font-medium"
                                >
                                    Create Folder
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Rename Folder Modal */}
            {showRenameModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowRenameModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl w-80 p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Rename Folder</h2>
                        <form onSubmit={submitRename}>
                            <div className="mb-6">
                                <TextInput
                                    id="rename-name"
                                    type="text"
                                    name="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="Enter folder name"
                                    isFocused
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowRenameModal(false)}
                                    className="px-4 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm font-medium"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Folder Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDeleteModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl w-80 p-6" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">Delete Folder</h2>
                        <p className="text-sm text-gray-500 mb-6">
                            Are you sure you want to delete this folder? All contained items will be moved to the root directory.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-sm rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={submitDelete}
                                disabled={processing}
                                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

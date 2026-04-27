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
import CreateFolderModal from '@/Components/modals/CreateFolderModal';
import RenameFolderModal from '@/Components/modals/RenameFolderModal';
import DeleteFolderModal from '@/Components/modals/DeleteFolderModal';

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
                <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white transition-colors">My Folders</h2>
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
            <div className="h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar p-6">
                {filteredFolders.length > 0 || folders.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-6">
                        {filteredFolders.map(folder => {
                            return (
                                <div
                                    key={folder.folder_id}
                                    className="group relative w-full p-4 bg-white dark:bg-cyber-void rounded-xl shadow-md border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:shadow-cyan-500/20 dark:hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:ring-1 hover:ring-cyan-500 dark:hover:ring-cyber-accent transition-all cursor-pointer"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition space-x-1">
                                        <Dropdown>
                                            <Dropdown.Trigger>
                                                <button>
                                                    <MoreVertical className="size-8 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-cyber-surface rounded-md p-1.5 transition-colors" />
                                                </button>
                                            </Dropdown.Trigger>
                                            <Dropdown.Content>
                                                <button
                                                    onClick={() => openRenameModal(folder)}
                                                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-cyber-surface flex items-center"
                                                >
                                                    <Pencil className="size-4 mr-2" /> Rename
                                                </button>
                                                <button
                                                    onClick={() => openDeleteModal(folder)}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
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
                                        <FolderOpen className="size-16 text-cyan-500 dark:text-cyber-accent mb-2" />
                                        <h3 className="text-md font-bold text-slate-800 dark:text-slate-100 truncate w-full text-center">
                                            {folder.name}
                                        </h3>
                                    </div>

                                    <div className="flex justify-between mt-2">
                                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                                            {formatDate(new Date(folder.created_at))}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* Add Folder Card */}
                        <button
                            onClick={openCreateModal}
                            className="w-full p-4 bg-slate-50 dark:bg-cyber-surface/30 border-2 border-dashed border-slate-300 dark:border-cyber-border rounded-xl flex flex-col items-center justify-center hover:border-cyan-500 dark:hover:border-cyber-accent hover:bg-cyan-50 dark:hover:bg-cyber-accent/10 transition-all group"
                        >
                            <Plus className="size-10 text-slate-400 dark:text-slate-500 group-hover:text-cyan-500 dark:group-hover:text-cyber-accent transition-colors mb-2" />
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyber-accent transition-colors">New Folder</span>
                        </button>
                    </div>
                ) : (
                    <div className="bg-slate-50 dark:bg-cyber-surface/30 rounded-3xl p-12 text-center border-2 border-dashed border-slate-300 dark:border-cyber-border">
                        <div className="w-16 h-16 bg-cyan-50 dark:bg-cyber-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-cyan-100 dark:border-cyber-accent/30">
                            <Folder className="size-8 text-cyan-500 dark:text-cyber-accent" />
                        </div>
                        <h4 className="text-slate-900 dark:text-white font-bold mb-1 text-xl">No folders yet</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-6">Create folders to organize your documents better</p>

                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-indigo-600 dark:from-cyber-accent dark:to-indigo-500 text-white px-6 py-3 rounded-xl hover:from-cyan-700 hover:to-indigo-700 dark:hover:from-cyan-400 dark:hover:to-indigo-400 transition-all font-bold shadow-lg shadow-cyan-500/30 dark:shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                        >
                            <Plus className="size-5" />
                            Create Your First Folder
                        </button>
                    </div>
                )}
            </div>

            <CreateFolderModal 
                show={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={submitCreate}
                name={name}
                setName={setName}
                errors={errors}
                processing={processing}
            />

            <RenameFolderModal 
                show={showRenameModal}
                onClose={() => setShowRenameModal(false)}
                onSubmit={submitRename}
                name={name}
                setName={setName}
                errors={errors}
                processing={processing}
            />

            <DeleteFolderModal 
                show={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={submitDelete}
                folderName={selectedFolder?.name}
                processing={processing}
            />
        </AuthenticatedLayout>
    );
}

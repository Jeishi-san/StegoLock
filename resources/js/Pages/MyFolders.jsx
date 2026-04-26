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
import axios from 'axios';

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
                <h2 className="text-3xl font-bold tracking-tight text-white">My Folders</h2>
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
            <div className="h-full overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 p-8">
                    {/* Add Folder Card (Always first) */}
                    <button
                        onClick={openCreateModal}
                        className="group w-full p-8 glass-panel border-dashed border-2 border-cyber-border rounded-3xl flex flex-col items-center justify-center hover:border-cyber-accent hover:bg-cyber-accent/5 transition-all duration-300 min-h-[220px]"
                    >
                        <div className="p-4 bg-cyber-surface rounded-2xl border border-cyber-border group-hover:border-cyber-accent group-hover:shadow-glow-cyan transition-all mb-4">
                            <Plus className="size-8 text-slate-500 group-hover:text-cyber-accent" />
                        </div>
                        <span className="text-sm font-bold text-slate-400 group-hover:text-white transition-colors uppercase tracking-widest">New Folder</span>
                    </button>

                    {filteredFolders.map(folder => {
                        return (
                            <div
                                key={folder.folder_id}
                                className="group relative w-full p-6 glass-panel rounded-3xl transition-all duration-300 hover:shadow-glow-cyan hover:border-cyber-accent/50 min-h-[220px] flex flex-col items-center justify-between"
                            >
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <button className="p-2 bg-cyber-surface hover:bg-slate-800 rounded-xl border border-cyber-border transition-all">
                                                <MoreVertical className="size-5 text-slate-400" />
                                            </button>
                                        </Dropdown.Trigger>
                                        <Dropdown.Content align="right" width="48" contentClasses="glass-panel border-cyber-border/50 py-2">
                                            <button
                                                onClick={() => openRenameModal(folder)}
                                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-300 hover:bg-cyber-accent hover:text-cyber-void transition-all flex items-center gap-3"
                                            >
                                                <Pencil className="size-4" /> Rename
                                            </button>
                                            <div className="h-px bg-cyber-border/30 my-1 mx-2" />
                                            <button
                                                onClick={() => openDeleteModal(folder)}
                                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center gap-3"
                                            >
                                                <Trash2 className="size-4" /> Delete
                                            </button>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>

                                <div 
                                    className="flex flex-col items-center justify-center py-4 cursor-pointer w-full group/icon"
                                    onClick={() => router.visit(`/myDocuments?folder_id=${folder.folder_id}`)}
                                >
                                    <div className="relative mb-4">
                                        <FolderOpen className="size-20 text-cyber-accent transition-transform duration-300 group-hover/icon:scale-110" />
                                        <div className="absolute inset-0 bg-cyber-accent/20 blur-2xl opacity-0 group-hover/icon:opacity-100 transition-opacity" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white truncate w-full text-center tracking-tight px-2">
                                        {folder.name}
                                    </h3>
                                </div>

                                <div className="w-full flex items-center justify-center">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-t border-cyber-border/30 pt-4 w-full text-center">
                                        {formatDate(new Date(folder.created_at))}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredFolders.length === 0 && folders.length > 0 && (
                    <div className="flex flex-col items-center justify-center p-12 min-h-[400px]">
                        <div className="w-20 h-20 bg-cyber-surface/30 rounded-3xl flex items-center justify-center mb-6 border-2 border-dashed border-cyber-border/50">
                            <FolderTree className="size-10 text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No matching folders</h3>
                        <p className="text-slate-500">Try adjusting your search query</p>
                    </div>
                )}
            </div>

            {/* Modals */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-cyber-void/80 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
                    <div className="glass-panel w-full max-w-md overflow-hidden transform transition-all shadow-2xl rounded-3xl border-cyber-accent/20 relative z-10 animate-fade-in">
                        <div className="bg-cyber-accent/10 p-8 text-center relative border-b border-cyber-border">
                            <button 
                                onClick={() => setShowCreateModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-cyber-accent/20 rounded-3xl mb-6 shadow-glow-cyan border border-cyber-accent/30">
                                <Plus className="size-10 text-cyber-accent" />
                            </div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">New Folder</h2>
                            <p className="text-slate-400 text-sm mt-2">Organize your workspace</p>
                        </div>
                        
                        <div className="p-8">
                            <form onSubmit={submitCreate}>
                                <div className="mb-8">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Folder Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Folder className="size-5 text-slate-500 group-focus-within:text-cyber-accent transition-colors" />
                                        </div>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-cyber-surface/50 border border-cyber-border rounded-2xl focus:ring-2 focus:ring-cyber-accent focus:border-transparent outline-none transition-all font-bold text-white placeholder:text-slate-600 shadow-inner"
                                            placeholder="Secure collection name"
                                        />
                                    </div>
                                    <InputError message={errors.name} className="mt-2" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="px-6 py-3.5 text-sm font-bold text-slate-400 bg-cyber-surface hover:bg-slate-800 rounded-xl transition-all border border-cyber-border"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-6 py-3.5 text-sm font-bold text-cyber-void bg-cyber-accent hover:bg-white rounded-xl transition-all shadow-glow-cyan disabled:opacity-50"
                                    >
                                        Create Folder
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showRenameModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-cyber-void/80 backdrop-blur-sm" onClick={() => setShowRenameModal(false)} />
                    <div className="glass-panel w-full max-w-md overflow-hidden transform transition-all shadow-2xl rounded-3xl border-cyber-accent/20 relative z-10 animate-fade-in">
                        <div className="bg-cyber-accent/10 p-8 text-center relative border-b border-cyber-border">
                            <button 
                                onClick={() => setShowRenameModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-cyber-accent/20 rounded-3xl mb-6 shadow-glow-cyan border border-cyber-accent/30">
                                <Pencil className="size-10 text-cyber-accent" />
                            </div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Rename Folder</h2>
                            <p className="text-slate-400 text-sm mt-2">Enter a new name</p>
                        </div>
                        
                        <div className="p-8">
                            <form onSubmit={submitRename}>
                                <div className="mb-8">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">New Folder Name</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Folder className="size-5 text-slate-500 group-focus-within:text-cyber-accent transition-colors" />
                                        </div>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-cyber-surface/50 border border-cyber-border rounded-2xl focus:ring-2 focus:ring-cyber-accent focus:border-transparent outline-none transition-all font-bold text-white placeholder:text-slate-600 shadow-inner"
                                            placeholder="Update folder name"
                                        />
                                    </div>
                                    <InputError message={errors.name} className="mt-2" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowRenameModal(false)}
                                        className="px-6 py-3.5 text-sm font-bold text-slate-400 bg-cyber-surface hover:bg-slate-800 rounded-xl transition-all border border-cyber-border"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="px-6 py-3.5 text-sm font-bold text-cyber-void bg-cyber-accent hover:bg-white rounded-xl transition-all shadow-glow-cyan disabled:opacity-50"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-cyber-void/80 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
                    <div className="glass-panel w-full max-w-md overflow-hidden transform transition-all shadow-2xl rounded-3xl border-red-500/20 relative z-10 animate-fade-in">
                        <div className="bg-red-500/10 p-8 text-center relative border-b border-red-500/20">
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 rounded-3xl mb-6 shadow-glow-red border border-red-500/30">
                                <Trash2 className="size-10 text-red-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Delete Folder</h2>
                            <p className="text-red-400/80 text-sm mt-2 font-medium">This action cannot be undone</p>
                        </div>
                        
                        <div className="p-8 text-center">
                            <p className="text-sm text-slate-400 leading-relaxed mb-8">
                                Are you sure you want to purge <span className="font-bold text-white px-2 py-1 bg-cyber-surface rounded-md border border-cyber-border">{selectedFolder?.name}</span>? 
                                Documents inside will be relocated to the root vault.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-6 py-3.5 text-sm font-bold text-slate-400 bg-cyber-surface hover:bg-slate-800 rounded-xl transition-all border border-cyber-border"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={submitDelete}
                                    disabled={processing}
                                    className="px-6 py-3.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
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

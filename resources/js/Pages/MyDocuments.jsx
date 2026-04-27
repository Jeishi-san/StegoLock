import { Shield, ArrowLeft, FolderOpen, FolderTree, Download, CheckCircle, X, Trash2, Pencil, AlertTriangle, FileText, LayoutGrid, List, MoreVertical, Plus, Folder, Lock, Share2 } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, Link } from '@inertiajs/react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { ShareFileModal } from '@/Components/modals/ShareFileModal';
import { FileInfoModal } from '@/Components/modals/FileInfoModal';
import { ConfirmModal } from '@/Components/modals/ConfirmModal';
import { DownloadReadyModal } from '@/Components/modals/DownloadReadyModal';
import MoveFileModal from '@/Components/modals/MoveFileModal';
import RenameFileModal from '@/Components/modals/RenameFileModal';
import FileRetrievedModal from '@/Components/modals/FileRetrievedModal';
import CreateFolderModal from '@/Components/modals/CreateFolderModal';
import RenameFolderModal from '@/Components/modals/RenameFolderModal';
import DeleteFolderModal from '@/Components/modals/DeleteFolderModal';
import { ShareFolderModal } from '@/Components/modals/ShareFolderModal';
import DocumentCard from '@/Components/DocumentCard';
import { DocumentList } from '@/Components/DocumentList';
import { SearchBar } from '@/Components/SearchBar';
import { ViewToggle } from '@/Components/ViewToggle';
import { useDocumentStatusPolling } from '@/hooks/useDocumentStatusPolling';
import { useDocumentActions } from '@/hooks/useDocumentActions';
import { sortDocuments } from '@/Utils/fileUtils';
import { useFloating, offset, flip, shift, autoUpdate } from '@floating-ui/react';
import Dropdown from '@/Components/Dropdown';
import { toast } from 'sonner';
import axios from 'axios';
import { formatDate } from '@/Utils/fileUtils';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

export default function MyDocuments({ documents, folders, currentFolder, breadcrumbs = [], totalStorage, storageLimit, title = "My Documents" }) {
    const [viewMode, setViewMode] = useState(() => localStorage.getItem('stegolock_view_mode') || 'grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        fileFormat: 'all',
        status: 'all',
        owner: 'all',
        sort: 'date-newest'
    });

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [showKeepFileModal, setShowKeepFileModal] = useState(null);
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [showDownloadReadyModal, setShowDownloadReadyModal] = useState(false);
    
    const [selectedDocId, setSelectedDocId] = useState(null);
    const [selectedDocForRename, setSelectedDocForRename] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [selectedDocForShare, setSelectedDocForShare] = useState(null);
    const [selectedDocForInfo, setSelectedDocForInfo] = useState(null);

    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);

    const { x, y, strategy, refs } = useFloating({
        placement: 'bottom-end',
        middleware: [offset(8), flip(), shift()],
        whileElementsMounted: autoUpdate,
        strategy: 'fixed'
    });

    useEffect(() => {
        localStorage.setItem('stegolock_view_mode', viewMode);
    }, [viewMode]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Initial check for stuck files
    useEffect(() => {
        const stuckDoc = documents.find(doc => doc.status === 'retrieved' || doc.status === 'decrypted');
        if (stuckDoc && !showKeepFileModal && !showDownloadReadyModal) {
            if (stuckDoc.status === 'decrypted') {
                setShowDownloadReadyModal(true);
            } else {
                setShowKeepFileModal(stuckDoc.document_id);
            }
            setSelectedDocId(stuckDoc.document_id);
        }
    }, [documents]);

    const { 
        localDocs, 
        setLocalDocs, 
        unlockingProgress, 
        updateUnlockingProgress 
    } = useDocumentStatusPolling(documents, (doc) => {
        setSelectedDocId(doc.document_id);
        setShowDownloadReadyModal(true);
    });

    const [showFolderCreateModal, setShowFolderCreateModal] = useState(false);
    const [showFolderRenameModal, setShowFolderRenameModal] = useState(false);
    const [showFolderDeleteModal, setShowFolderDeleteModal] = useState(false);
    const [showFolderShareModal, setShowFolderShareModal] = useState(false);
    const [selectedFolderForAction, setSelectedFolderForAction] = useState(null);
    const [folderName, setFolderName] = useState('');
    const [folderErrors, setFolderErrors] = useState({});
    const [folderProcessing, setFolderProcessing] = useState(false);

    const openFolderCreateModal = () => {
        setFolderName('');
        setFolderErrors({});
        setShowFolderCreateModal(true);
    };

    const openFolderRenameModal = (folder) => {
        setSelectedFolderForAction(folder);
        setFolderName(folder.name);
        setFolderErrors({});
        setShowFolderRenameModal(true);
    };

    const openFolderDeleteModal = (folder) => {
        setSelectedFolderForAction(folder);
        setShowFolderDeleteModal(true);
    };

    const openFolderShareModal = (folder) => {
        setSelectedFolderForAction(folder);
        setShowFolderShareModal(true);
    };

    const submitFolderCreate = async (e) => {
        e.preventDefault();
        setFolderProcessing(true);
        const toastId = toast.loading('Creating folder...');
        try {
            await axios.post('/folders', { 
                name: folderName,
                parent_id: currentFolder?.folder_id 
            });
            toast.success('Folder created successfully', { id: toastId });
            setShowFolderCreateModal(false);
            router.reload();
        } catch (err) {
            if (err.response?.data?.errors) {
                setFolderErrors(err.response.data.errors);
            }
            toast.error('Failed to create folder', { id: toastId });
        } finally {
            setFolderProcessing(false);
        }
    };

    const submitFolderRename = async (e) => {
        e.preventDefault();
        setFolderProcessing(true);
        const toastId = toast.loading('Renaming folder...');
        try {
            await axios.put(`/folders/${selectedFolderForAction.folder_id}`, { name: folderName });
            toast.success('Folder renamed successfully', { id: toastId });
            setShowFolderRenameModal(false);
            router.reload();
        } catch (err) {
            if (err.response?.data?.errors) {
                setFolderErrors(err.response.data.errors);
            }
            toast.error('Failed to rename folder', { id: toastId });
        } finally {
            setFolderProcessing(false);
        }
    };

    const submitFolderDelete = async (e) => {
        e.preventDefault();
        setFolderProcessing(true);
        const toastId = toast.loading('Deleting folder...');
        try {
            await axios.delete(`/folders/${selectedFolderForAction.folder_id}`);
            toast.success('Folder deleted successfully', { id: toastId });
            setShowFolderDeleteModal(false);
            router.reload();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete folder', { id: toastId });
        } finally {
            setFolderProcessing(false);
        }
    };

    const filteredDocs = useMemo(() => {
        let result = [...localDocs];

        // Search Filter
        if (searchQuery) {
            result = result.filter(doc => 
                doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Format Filter
        if (filters.fileFormat !== 'all') {
            result = result.filter(doc => doc.file_type?.toLowerCase().includes(filters.fileFormat));
        }

        // Status Filter
        if (filters.status !== 'all') {
            if (filters.status === 'secured') {
                result = result.filter(doc => ['stored', 'retrieved', 'failed'].includes(doc.status));
            } else {
                result = result.filter(doc => doc.status === 'decrypted');
            }
        }

        // Sort
        result = sortDocuments(result, filters.sort);

        return result;
    }, [localDocs, searchQuery, filters]);

    const handleDownloadAndProceed = (docId) => {
        window.location.href = `/documents/download/${docId}`;
        setShowDownloadReadyModal(false);
        setShowKeepFileModal(docId);
    };

    const {
        handleUnlock,
        handleMove,
        confirmDelete,
        keepFile,
        handleToggleStar,
        handleFileInfo,
        handleRename
    } = useDocumentActions({
        setLocalDocs,
        updateUnlockingProgress,
        setSelectedDocId,
        setSelectedDocForShare,
        setSelectedDocForInfo,
        setShowDeleteModal,
        setShowMoveModal,
        setShowShareModal,
        setShowInfoModal,
        setShowKeepFileModal
    });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                         <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white transition-colors">
                            {currentFolder ? 'My Documents' : title}
                        </h2>
                    </div>
                    {currentFolder && (
                        <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-400 dark:text-cyber-accent/70 bg-slate-100 dark:bg-cyber-surface/30 px-3 py-1 rounded-lg border border-slate-200 dark:border-cyber-border/30 w-fit shadow-inner">
                            <Link 
                                href={route('myDocuments')} 
                                className="hover:text-cyan-600 dark:hover:text-cyber-accent transition-colors flex items-center gap-1"
                            >
                                <FolderTree className="size-3" />
                                root
                            </Link>
                            {breadcrumbs.map((crumb, index) => (
                                <span key={crumb.folder_id} className="flex items-center gap-2">
                                    <span className="text-slate-300 dark:text-slate-600">{'>'}</span>
                                    <Link
                                        href={route('myDocuments', { folder_id: crumb.folder_id })}
                                        className={index === breadcrumbs.length - 1 
                                            ? "text-slate-900 dark:text-white dark:text-cyber-accent bg-cyan-50 dark:bg-cyber-accent/10 px-1.5 py-0.5 rounded" 
                                            : "hover:text-cyan-600 dark:hover:text-cyber-accent transition-colors"
                                        }
                                    >
                                        {crumb.name}
                                    </Link>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            }
            headerActions={
                <ViewToggle view={viewMode} onViewChange={setViewMode} />
            }
            subHeader={
                <SearchBar 
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    filters={filters}
                    onFiltersChange={setFilters}
                />
            }
            totalStorage={totalStorage}
            storageLimit={storageLimit}
            hasProcessingDocs={localDocs.some(doc => unlockingProgress[doc.document_id] || !['stored', 'decrypted', 'retrieved', 'failed'].includes(doc.status))}
        >
            <Head title="My Documents"/>

            <div className="h-[calc(100vh-140px)] overflow-y-auto custom-scrollbar p-6 space-y-8">
                {/* Documents Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="size-5 text-cyan-600 dark:text-cyber-accent" />
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                            {currentFolder ? 'Documents' : 'My Documents'}
                        </h3>
                        <span className="bg-cyan-100 dark:bg-cyber-accent/20 text-cyan-700 dark:text-cyber-accent text-xs font-bold px-2 py-1 rounded-full border border-cyan-200 dark:border-cyber-accent/30">
                            {filteredDocs.length}
                        </span>
                    </div>
                    
                    {filteredDocs.length > 0 ? (
                        viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredDocs.map(doc => (
                                    <DocumentCard 
                                        key={doc.document_id}
                                        doc={doc}
                                        unlockingProgress={unlockingProgress}
                                        onUnlock={handleUnlock}
                                        onToggleStar={handleToggleStar}
                                        onShare={(d) => { setSelectedDocForShare(d); setShowShareModal(true); }}
                                        onFileInfo={handleFileInfo}
                                        onDelete={(id) => { setSelectedDocId(id); setShowDeleteModal(true); }}
                                        onMove={(id) => { setSelectedDocId(id); setShowMoveModal(true); }}
                                        onRename={(doc) => { 
                                            setSelectedDocForRename(doc); 
                                            setRenameValue(doc.filename);
                                            setShowRenameModal(true); 
                                        }}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-cyber-void rounded-xl shadow-md border border-slate-200 dark:border-slate-700">
                                <DocumentList 
                                    documents={filteredDocs}
                                    unlockingProgress={unlockingProgress}
                                    onUnlock={handleUnlock}
                                    onToggleStar={handleToggleStar}
                                    onShare={(d) => { setSelectedDocForShare(d); setShowShareModal(true); }}
                                    onFileInfo={handleFileInfo}
                                    onDelete={(id) => { setSelectedDocId(id); setShowDeleteModal(true); }}
                                    onMove={(id) => { setSelectedDocId(id); setShowMoveModal(true); }}
                                    onRename={(doc) => { 
                                        setSelectedDocForRename(doc); 
                                        setRenameValue(doc.filename);
                                        setShowRenameModal(true); 
                                    }}
                                    openMenuId={openMenuId}
                                    setOpenMenuId={setOpenMenuId}
                                    refs={refs}
                                    strategy={strategy}
                                    x={x}
                                    y={y}
                                    menuRef={menuRef}
                                />
                            </div>
                        )
                    ) : (
                        <div className="bg-slate-50 dark:bg-cyber-surface/30 rounded-2xl p-8 text-center border-2 border-dashed border-slate-300 dark:border-cyber-border">
                            <div className="w-14 h-14 bg-cyan-50 dark:bg-cyber-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-cyan-100 dark:border-cyber-accent/30">
                                <FileText className="size-6 text-cyan-500 dark:text-cyber-accent" />
                            </div>
                            <h4 className="text-slate-900 dark:text-white font-bold mb-1 text-xl">
                                {searchQuery || filters.fileFormat !== 'all' || filters.status !== 'all' ? "No matching documents" : "No Documents Found"}
                            </h4>
                            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto text-xs font-medium mb-4">
                                {searchQuery || filters.fileFormat !== 'all' || filters.status !== 'all' ? "Try adjusting your filters or search query" : "Upload files to get started with Stegolock"}
                            </p>
                            <button
                                onClick={() => window.dispatchEvent(new CustomEvent('trigger-upload-modal'))}
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-indigo-600 dark:from-cyber-accent dark:to-indigo-500 text-white px-5 py-2 rounded-xl hover:from-cyan-700 hover:to-indigo-700 dark:hover:from-cyan-400 dark:hover:to-indigo-400 transition-all text-sm font-bold shadow-lg shadow-cyan-500/30 dark:shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                            >
                                <Lock className="size-4" />
                                Lock a File
                            </button>
                        </div>
                    )}
                </section>

                {/* Folders Section */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <FolderTree className="size-5 text-cyan-600 dark:text-cyber-accent" />
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                            {currentFolder ? 'Subfolders' : 'My Folders'}
                        </h3>
                        <span className="bg-cyan-100 dark:bg-cyber-accent/20 text-cyan-700 dark:text-cyber-accent text-xs font-bold px-2 py-1 rounded-full border border-cyan-200 dark:border-cyber-accent/30">
                            {folders.length}
                        </span>
                    </div>

                        {folders.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                                {folders.map(folder => (
                                    <div
                                        key={folder.folder_id}
                                        className="group relative w-full p-3 bg-white dark:bg-cyber-void rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:shadow-cyan-500/20 dark:hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:ring-1 hover:ring-cyan-500 dark:hover:ring-cyber-accent transition-all cursor-pointer"
                                    >
                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition z-10">
                                            <Dropdown>
                                                <Dropdown.Trigger>
                                                    <button>
                                                        <MoreVertical className="size-6 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-cyber-surface rounded-md p-1 transition-colors" />
                                                    </button>
                                                </Dropdown.Trigger>
                                                <Dropdown.Content>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); openFolderShareModal(folder); }}
                                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-cyber-surface flex items-center"
                                                    >
                                                        <Share2 className="size-4 mr-2" /> Share Folder
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); openFolderRenameModal(folder); }}
                                                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-cyber-surface flex items-center"
                                                    >
                                                        <Pencil className="size-4 mr-2" /> Rename
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); openFolderDeleteModal(folder); }}
                                                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
                                                    >
                                                        <Trash2 className="size-4 mr-2" /> Delete
                                                    </button>
                                                </Dropdown.Content>
                                            </Dropdown>
                                        </div>

                                        <div 
                                            className="flex flex-col items-center justify-center py-2 cursor-pointer"
                                            onClick={() => router.visit(`/myDocuments?folder_id=${folder.folder_id}`)}
                                        >
                                            <FolderOpen className="size-10 text-cyan-500 dark:text-cyber-accent mb-1" />
                                            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate w-full text-center px-1">
                                                {folder.name}
                                            </h3>
                                        </div>
                                    </div>
                                ))}
                                <button
                                    onClick={openFolderCreateModal}
                                    className="w-full p-3 bg-slate-50 dark:bg-cyber-surface/30 border-2 border-dashed border-slate-300 dark:border-cyber-border rounded-xl flex flex-col items-center justify-center hover:border-cyan-500 dark:hover:border-cyber-accent hover:bg-cyan-50 dark:hover:bg-cyber-accent/10 transition-all group min-h-[100px]"
                                >
                                    <Plus className="size-6 text-slate-400 dark:text-slate-500 group-hover:text-cyan-500 dark:group-hover:text-cyber-accent transition-colors mb-1" />
                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyber-accent transition-colors">New Folder</span>
                                </button>
                            </div>
                        ) : (
                            <div className="bg-slate-50 dark:bg-cyber-surface/30 rounded-2xl p-8 text-center border-2 border-dashed border-slate-300 dark:border-cyber-border">
                                <div className="w-14 h-14 bg-cyan-50 dark:bg-cyber-accent/10 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-cyan-100 dark:border-cyber-accent/30">
                                    <Folder className="size-6 text-cyan-500 dark:text-cyber-accent" />
                                </div>
                                <h4 className="text-slate-900 dark:text-white font-bold mb-1 text-xl">No Folders Yet</h4>
                                <p className="text-slate-500 dark:text-slate-400 text-xs mb-4 font-medium">Create folders to organize your documents better</p>

                                <button
                                    onClick={openFolderCreateModal}
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-indigo-600 dark:from-cyber-accent dark:to-indigo-500 text-white px-5 py-2 rounded-xl hover:from-cyan-700 hover:to-indigo-700 dark:hover:from-cyan-400 dark:hover:to-indigo-400 transition-all font-bold shadow-lg shadow-cyan-500/30 dark:shadow-[0_0_15px_rgba(34,211,238,0.4)] text-sm"
                                >
                                    <Plus className="size-4" />
                                    New Folder
                                </button>
                            </div>
                        )}
                    </section>
            </div>

            <ConfirmModal 
                show={showDeleteModal}
                title="Delete Document"
                message="Are you sure you want to delete this document? This action cannot be undone and the file will be permanently removed from our servers."
                onConfirm={() => {
                    confirmDelete(selectedDocId);
                    setShowDeleteModal(false);
                }}
                onCancel={() => setShowDeleteModal(false)}
                confirmText="Delete permanently"
                isDanger={true}
            />

            <MoveFileModal 
                show={showMoveModal}
                onClose={() => setShowMoveModal(false)}
                onMove={handleMove}
                folders={folders}
                selectedDocId={selectedDocId}
            />

            <FileRetrievedModal 
                show={showKeepFileModal}
                onClose={() => setShowKeepFileModal(null)}
                onKeep={() => keepFile(selectedDocId, localDocs.find(d => d.document_id === selectedDocId)?.filename)}
                onDelete={() => { setShowDeleteModal(true); setShowKeepFileModal(null); }}
            />

            <DownloadReadyModal 
                show={showDownloadReadyModal}
                onClose={() => setShowDownloadReadyModal(false)}
                document={localDocs.find(d => d.document_id === selectedDocId)}
                onDownload={handleDownloadAndProceed}
            />

            <RenameFileModal 
                show={showRenameModal}
                onClose={() => setShowRenameModal(false)}
                onRename={handleRename}
                renameValue={renameValue}
                setRenameValue={setRenameValue}
                selectedDocId={selectedDocForRename?.document_id}
            />

            {showShareModal && (
                <ShareFileModal document={selectedDocForShare} onClose={() => setShowShareModal(false)} />
            )}

            {showInfoModal && (
                <FileInfoModal document={selectedDocForInfo} onClose={() => setShowInfoModal(false)} />
            )}
            


            <CreateFolderModal 
                show={showFolderCreateModal}
                onClose={() => setShowFolderCreateModal(false)}
                onSubmit={submitFolderCreate}
                name={folderName}
                setName={setFolderName}
                errors={folderErrors}
                processing={folderProcessing}
            />

            <RenameFolderModal 
                show={showFolderRenameModal}
                onClose={() => setShowFolderRenameModal(false)}
                onSubmit={submitFolderRename}
                name={folderName}
                setName={setFolderName}
                errors={folderErrors}
                processing={folderProcessing}
            />

            <DeleteFolderModal 
                show={showFolderDeleteModal}
                onClose={() => setShowFolderDeleteModal(false)}
                onConfirm={submitFolderDelete}
                folderName={selectedFolderForAction?.name}
                processing={folderProcessing}
            />

            {showFolderShareModal && (
                <ShareFolderModal 
                    folder={selectedFolderForAction}
                    onClose={() => setShowFolderShareModal(false)}
                />
            )}
        </AuthenticatedLayout>
    );
}

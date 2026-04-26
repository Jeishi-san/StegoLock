import { FolderOpen, Star, HardDrive, Shield, Lock, Unlock, Plus, ChevronDown, Upload, Users, FolderTree, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatBytes } from '@/Utils/fileUtils';
import { Link, usePage, router } from '@inertiajs/react';

import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';

import UploadModal from '@/Components/modals/UploadModal';

const folderIcons = {
  'Starred': Star,
  'My Secured Files': Lock,
  'My Original Files': Unlock,
  'Shared With Me': Users,
  'My Folders': FolderTree,
};

export function Sidebar({
  folders,
  selectedFolder,
  onSelectFolder,
  totalStorage,
  storageLimit,
  onUploadClick,
  onManageStorageClick,
  onNewFolderClick,
  hasProcessingDocs = false,
  darkMode,
  setDarkMode,
}) {

    const user = usePage().props.auth.user;
    const pendingSharesCount = usePage().props.pendingSharesCount;

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [openNewMenu, setOpenNewMenu] = useState(false);

    const isProcessOngoing = hasProcessingDocs;
    const storagePercentage = (totalStorage / storageLimit) * 100;

    return (
        <nav className="w-64 h-screen flex flex-col border-r border-slate-200 dark:border-cyber-border/50 bg-white dark:bg-cyber-void shadow-xl dark:shadow-2xl relative z-30 overflow-hidden transition-colors duration-300">
            <div className='flex-1 overflow-y-auto custom-scrollbar'>
                <div className="mx-auto max-w-7xl px-6 py-8 flex items-center justify-between">
                    <Link href="/myDocuments">
                        <div className="flex items-center space-x-3">
                            <div className="inline-flex items-center justify-center p-2 bg-cyber-accent rounded-xl shadow-lg dark:shadow-glow-cyan">
                                <Shield className="size-6 text-white dark:text-cyber-void" />
                            </div>
                            <h1 className="text-xl font-[900] text-slate-900 dark:text-white tracking-tighter leading-[0.85] scale-y-90 transform origin-left">
                                Stego<span className="text-cyber-accent">lock</span>
                            </h1>
                        </div>
                    </Link>

                    <button 
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2.5 bg-slate-100 dark:bg-cyber-surface/50 border border-slate-200 dark:border-cyber-border rounded-xl text-slate-500 dark:text-slate-400 hover:text-cyber-accent hover:border-cyber-accent transition-all shadow-inner group"
                    >
                        {darkMode ? (
                            <Moon className="size-4 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
                        ) : (
                            <Sun className="size-4 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
                        )}
                    </button>
                </div>

                <div className="px-4 mb-8">
                    <div className="relative">
                        <button 
                            onClick={() => setOpenNewMenu(!openNewMenu)}
                            className="w-full flex items-center justify-between gap-3 px-5 py-4 bg-cyber-accent text-white dark:text-cyber-void rounded-[1.25rem] hover:bg-slate-900 dark:hover:bg-white transition-all shadow-lg dark:shadow-glow-cyan group"
                        >
                            <div className="flex items-center gap-3">
                                <Plus className="size-5" />
                                <span className="text-sm font-black uppercase tracking-widest italic">New</span>
                            </div>
                            <ChevronDown className={`size-4 transition-transform duration-300 ${openNewMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {openNewMenu && (
                            <div className="absolute top-full left-0 right-0 mt-2 p-2 glass-panel rounded-2xl shadow-2xl z-50 animate-fade-in bg-white dark:bg-cyber-surface/90">
                                <button 
                                    onClick={() => {
                                        if (isProcessOngoing) return;
                                        setShowUploadModal(true);
                                        setOpenNewMenu(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold transition-all rounded-xl text-left ${isProcessOngoing ? 'text-slate-400 cursor-not-allowed' : 'text-slate-600 dark:text-slate-300 hover:bg-cyber-accent hover:text-white dark:hover:text-cyber-void'}`}
                                >
                                    <Upload className="size-4" />
                                    {isProcessOngoing ? "Currently locking a file..." : "Lock a File"}
                                </button>
                                <button 
                                    onClick={() => {
                                        if (onNewFolderClick) onNewFolderClick();
                                        else router.visit(route('myFolders'));
                                        setOpenNewMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-cyber-accent hover:text-white dark:hover:text-cyber-void transition-all rounded-xl text-left"
                                >
                                    <FolderTree className="size-4" />
                                    New Folder
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-4 space-y-2">
                    <NavLink href={route('myDocuments')} active={route().current('myDocuments')} icon={FolderOpen}>
                        <span className="font-bold uppercase tracking-widest text-[10px]">My Documents</span>
                    </NavLink>

                    <NavLink href={route('myFolders')} active={route().current('myFolders')} icon={FolderTree}>
                        <span className="font-bold uppercase tracking-widest text-[10px]">My Folders</span>
                    </NavLink>

                    <NavLink href={route('allDocuments')} active={route().current('allDocuments')} icon={FolderOpen}>
                        <span className="font-bold uppercase tracking-widest text-[10px]">All Documents</span>
                    </NavLink>

                    <NavLink href={route('sharedDocuments')} active={route().current('sharedDocuments')} icon={Users}>
                        <div className="flex items-center justify-between w-full">
                            <span className="font-bold uppercase tracking-widest text-[10px]">Shared With Me</span>
                            {pendingSharesCount > 0 && (
                                <span className="flex items-center justify-center size-4 text-[9px] font-black text-white bg-red-500 rounded-full shadow-lg shadow-red-500/20 animate-pulse">
                                    {pendingSharesCount}
                                </span>
                            )}
                        </div>
                    </NavLink>

                    <NavLink href={route('starredDocuments')} active={route().current('starredDocuments')} icon={Star}>
                        <span className="font-bold uppercase tracking-widest text-[10px]">Starred</span>
                    </NavLink>
                </div>

                <div className="px-4 mt-8">
                    <button
                        onClick={() => router.visit(route('manageStorage'))}
                        className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all ${
                            route().current('manageStorage') 
                            ? 'bg-cyber-accent text-white dark:text-cyber-void shadow-lg dark:shadow-glow-cyan' 
                            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-cyber-surface/50 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <HardDrive className="size-5" />
                        <span>Manage Storage</span>
                    </button>
                </div>

                <UploadModal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                />
            </div>

            <div className="p-4 bg-slate-50 dark:bg-cyber-surface/30 border-t border-slate-200 dark:border-cyber-border/50 transition-colors duration-300">
                <div className="space-y-3">
                    <div className="p-4 bg-slate-100 dark:bg-cyber-void/50 rounded-xl border border-slate-200 dark:border-cyber-border/50">
                        <div className="flex items-center justify-between text-[9px] mb-2 uppercase tracking-[0.2em] font-black">
                            <div className="flex items-center gap-1.5 text-slate-500">
                                <div className="size-1 bg-cyber-accent rounded-full shadow-glow-cyan animate-pulse" />
                                Storage
                            </div>
                            <span className="text-cyber-accent">
                                {formatBytes(totalStorage)} <span className="text-slate-400 dark:text-slate-700 mx-0.5">/</span> {formatBytes(storageLimit)}
                            </span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-cyber-border/50 rounded-full h-1.5 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                    storagePercentage > 90 ? 'bg-red-500' : 'bg-cyber-accent shadow-glow-cyan'
                                }`}
                                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
  );
}

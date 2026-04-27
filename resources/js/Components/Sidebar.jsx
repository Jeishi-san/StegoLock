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
}) {

    const user = usePage().props.auth.user;

    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('stegolock_theme');
            return saved ? saved === 'dark' : true;
        }
        return true;
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('stegolock_theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('stegolock_theme', 'light');
        }
    }, [darkMode]);

    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showNewMenu, setShowNewMenu] = useState(false);

    const [isUploading, setIsUploading] = useState(false);
    const globalHasProcessingDocs = usePage().props.hasProcessingDocs || false;

    // Any ongoing process (either local or background)
    const isProcessOngoing = isUploading || hasProcessingDocs || globalHasProcessingDocs;

    useEffect(() => {
        const handleTriggerUpload = () => {
            if (!isProcessOngoing) {
                setShowUploadModal(true);
            }
        };
        window.addEventListener('trigger-upload-modal', handleTriggerUpload);
        return () => window.removeEventListener('trigger-upload-modal', handleTriggerUpload);
    }, [isProcessOngoing]);


    const storagePercentage = (totalStorage / storageLimit) * 100;

    const MenuButton = ({ icon: Icon, label, onClick, className = ""}) => (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 transition-all rounded-xl text-left group ${!className.includes('cursor-not-allowed') ? 'hover:bg-cyber-accent hover:text-white dark:hover:text-cyber-void hover:shadow-md' : ''} ${className}`}
        >
            <Icon className={`size-4 text-slate-500 dark:text-slate-400 transition-colors ${!className.includes('cursor-not-allowed') ? 'group-hover:text-white dark:group-hover:text-cyber-void' : ''} ${className}`} />
            {label}
        </button>
    );

  return (
    <nav className="w-72 h-screen flex flex-col border-r border-slate-200 dark:border-cyber-border/50 bg-white dark:bg-cyber-void transition-colors duration-300 shadow-lg z-30 relative">
        <div className='flex-1'>
            {/* HEADER */}
            <div className="mx-auto max-w-7xl sm:px-6 lg:px-6">
                <div className="flex items-center justify-between my-4">
                    {/* Icon */}
                    <Link href="/myDocuments" className="group">
                        <div className="flex items-center space-x-3 my-3">
                            <div className="relative inline-flex items-center justify-center p-2.5 bg-gradient-to-br from-cyber-accent via-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-cyan-500/40 dark:shadow-[0_0_20px_rgba(34,211,238,0.6)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                <Shield className="size-6 text-white drop-shadow-md relative z-10" />
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </div>
                            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight transform origin-left group-hover:scale-105 inline-block group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyber-accent group-hover:to-indigo-500 transition-all duration-300">Stego<span className="text-cyber-accent group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyber-accent group-hover:to-indigo-500 transition-all duration-300">Lock</span></h1>
                        </div>
                    </Link>

                    <button 
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2.5 bg-slate-100 dark:bg-cyber-surface/50 border border-slate-200 dark:border-cyber-border rounded-xl text-slate-500 dark:text-slate-400 hover:text-cyber-accent hover:border-cyber-accent transition-all shadow-inner group hidden sm:block"
                    >
                        {darkMode ? (
                            <Moon className="size-4 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
                        ) : (
                            <Sun className="size-4 group-hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" />
                        )}
                    </button>

                    {/* Mobile Navigation */}
                    <div className="-me-2 flex items-center sm:hidden">
                        <button
                            onClick={() =>
                                setShowingNavigationDropdown(
                                    (previousState) => !previousState,
                                )
                            }
                            className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 transition duration-150 ease-in-out hover:bg-slate-100 hover:text-slate-500 focus:bg-slate-100 focus:text-slate-500 focus:outline-none dark:hover:bg-cyber-surface dark:focus:bg-cyber-surface dark:text-slate-400 dark:hover:text-slate-300 dark:focus:text-slate-300"
                        >
                            <svg
                                className="h-6 w-6"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    className={
                                        !showingNavigationDropdown
                                            ? 'inline-flex'
                                            : 'hidden'
                                    }
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                                <path
                                    className={
                                        showingNavigationDropdown
                                            ? 'inline-flex'
                                            : 'hidden'
                                    }
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>



            {/* NEW BUTTON */}
            <div className="mx-auto max-w-7xl sm:px-6 lg:px-6">
                <div className="flex my-4 relative">
                    {/* New Button with Dropdown */}
                    <button
                        onClick={() => { setShowNewMenu(!showNewMenu); }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-cyber-accent to-indigo-500 text-white rounded-xl hover:opacity-90 transition-all font-bold shadow-lg shadow-cyan-500/30 dark:shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                    >
                        <Plus className="size-5" />
                        New
                        <ChevronDown className="size-4 ml-auto" />
                    </button>

                    {/* Dropdown Menu */}
                    {showNewMenu && (
                        <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowNewMenu(false)}
                        />
                        <div className="absolute w-full mt-16 p-2 glass-panel shadow-2xl z-50 rounded-2xl border border-slate-200 dark:border-cyber-border/50 dark:bg-cyber-surface/90 backdrop-blur-xl">
                            <MenuButton icon={Upload}
                                        label={isProcessOngoing ? "Currently locking a file..." : "Lock a File"}
                                        onClick={() => {
                                            if (isProcessOngoing) return;
                                            setShowNewMenu(false);
                                            setShowUploadModal(true);
                                        }}
                                        className={isProcessOngoing ? 'text-slate-400 cursor-not-allowed bg-slate-50 dark:bg-cyber-surface/30' : ''}
                            />
                            <MenuButton icon={Plus}
                                        label="New Folder"
                                        onClick={() => {
                                            setShowNewMenu(false);
                                            if (onNewFolderClick) {
                                                onNewFolderClick();
                                            } else {
                                                router.visit(route('myDocuments'));
                                            }
                                        }}
                            />
                        </div>
                        </>
                    )}

                </div>
            </div>

            {/* Upload Modal */}
            <UploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                allowUpload={() => setIsUploading(false)}
                uploaded={() => setIsUploading(true)}
            />

            {/* NAVIGATION LINKS */}
            <div className="mx-auto max-w-7xl sm:px-6 lg:px-6">
                <div className="flex mt-4">

                    {/* Navigation Links */}
                    <div className="w-full space-y-2">
                        <NavLink
                            href={route('myDocuments')}
                            active={route().current('myDocuments')}
                            icon={FolderOpen}
                        >
                            My Documents
                        </NavLink>

                        <NavLink
                            href={route('allDocuments')}
                            active={route().current('allDocuments')}
                            icon={FolderOpen}
                        >All Documents</NavLink>

                        <NavLink
                            href={route('sharedDocuments')}
                            active={route().current('sharedDocuments')}
                            icon={Users}
                        >
                            <div className="flex items-center justify-between w-full">
                                <span>Shared With Me</span>
                                {usePage().props.pendingSharesCount > 0 && (
                                    <span className="flex items-center justify-center size-5 text-[10px] font-bold text-white bg-red-500 rounded-full shadow-sm animate-pulse">
                                        {usePage().props.pendingSharesCount}
                                    </span>
                                )}
                            </div>
                        </NavLink>

                        <NavLink
                            href={route('starredDocuments')}
                            active={route().current('starredDocuments')}
                            icon={Star}
                        >Starred</NavLink>
                    </div>

                </div>
            </div>
        </div>




        {/* Storage Info */}
        <div className="">
            <div className="mx-auto max-w-7xl my-4 space-y-1 sm:px-6 lg:px-6">
                <div className="p-4 bg-slate-100 dark:bg-cyber-surface/50 rounded-xl border border-slate-200 dark:border-cyber-border/30">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Storage</span>
                        <span className="text-slate-900 dark:text-white font-semibold">
                            {formatBytes(totalStorage)} / {formatBytes(storageLimit)}
                        </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-cyber-border rounded-full h-2 overflow-hidden">
                        <div
                            className={" rounded-full transition-all shadow-sm"+
                                (storagePercentage > 90 ? " bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] h-2" :
                                     " bg-cyber-accent dark:shadow-glow-cyan h-2")
                            }
                            style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                        />
                    </div>
                </div>

                <button
                    onClick={() => router.visit(route('manageStorage'))}
                    className={
                        'w-full flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all group ' +
                        (route().current('manageStorage') ?
                            'bg-gradient-to-r from-cyber-accent/10 to-cyan-500/10 dark:from-cyber-accent/20 dark:to-cyan-500/20 text-cyan-700 dark:text-white shadow-md shadow-cyan-500/20 dark:shadow-[0_0_10px_rgba(34,211,238,0.2)] font-bold ' :
                            'text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-cyber-accent/10 hover:to-cyan-500/10 dark:hover:from-cyber-accent/20 dark:hover:to-cyan-500/20 hover:text-cyan-700 dark:hover:text-white hover:shadow-md hover:shadow-cyan-500/20 dark:hover:shadow-[0_0_10px_rgba(34,211,238,0.2)] font-medium ')
                    }
                >
                    <HardDrive className={
                        'size-5 transition-colors ' +
                        (route().current('manageStorage') ? 'text-cyan-700 dark:text-cyber-accent' : 'text-slate-500 dark:text-slate-400 group-hover:text-cyber-accent')
                    } />
                    <span>Manage Storage</span>
                </button>
            </div>

        </div>


        {/* RESPONSIVE LAYOUT */}
        <div
            className={
                (showingNavigationDropdown ? 'block' : 'hidden') +
                ' sm:hidden'
            }
        >
            <div className="space-y-1 pb-3 pt-2">
                <ResponsiveNavLink
                    href={route('myDocuments')}
                    active={route().current('myDocuments')}
                >
                    My Documents
                </ResponsiveNavLink>
            </div>

            <div className="border-t border-slate-200 dark:border-cyber-border/50 pb-1 pt-4">
                <div className="px-4">
                    <div className="text-base font-medium text-slate-800 dark:text-slate-200">
                        {user.name}
                    </div>
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {user.email}
                    </div>
                </div>

                <div className="mt-3 space-y-1">
                    <ResponsiveNavLink href={route('profile.edit')}>
                        Profile
                    </ResponsiveNavLink>
                    <ResponsiveNavLink
                        method="post"
                        href={route('logout')}
                        as="button"
                    >
                        Log Out
                    </ResponsiveNavLink>
                </div>
            </div>
        </div>
    </nav>
  );
}

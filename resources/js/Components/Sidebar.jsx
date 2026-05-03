import { 
    FolderOpen, 
    Star, 
    HardDrive, 
    Shield, 
    Lock, 
    Unlock, 
    Plus, 
    ChevronDown, 
    Upload, 
    Users, 
    FolderTree, 
    Moon, 
    Sun,
    LayoutDashboard,
    Database,
    UserCog,
    Cloud,
    Server,
    ImagePlus
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatBytes } from '@/Utils/fileUtils';
import { Link, usePage, router } from '@inertiajs/react';

import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';


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
    const role = user.role;

    // Fallback logic for storage if props are missing (e.g. in Admin views)
    const effectiveTotalStorage = totalStorage ?? user.storage_used ?? 0;
    const effectiveStorageLimit = storageLimit ?? user.storage_limit ?? 1073741824;

    // Role-based access logic
    const isUserAdmin = role === 'user_admin' || role === 'superadmin';
    const isSystemAdmin = role === 'db_storage_admin' || role === 'superadmin';
    const isSuperadmin = role === 'superadmin';
    const isAdmin = isUserAdmin || isSystemAdmin || isSuperadmin;

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
    const [showNewMenu, setShowNewMenu] = useState(false);

    const [isUploading, setIsUploading] = useState(false);

    // Any ongoing process (either local or background)
    // Only block if a LOCAL upload request is active
    const isProcessOngoing = isUploading;

    const storagePercentage = effectiveStorageLimit > 0 
        ? (effectiveTotalStorage / effectiveStorageLimit) * 100 
        : 0;

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
    <nav className="w-72 h-screen flex flex-col border-r border-slate-200 dark:border-cyber-border/50 bg-white dark:bg-cyber-void transition-colors duration-300 shadow-lg z-30 relative overflow-hidden shrink-0">
        <div className="flex flex-col shrink-0 w-full">
            {/* HEADER */}
            <div className="w-full px-6">
                <div className="flex items-center justify-between my-4">
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
                </div>
            </div>

            {/* NEW BUTTON */}
            <div className="w-full px-6">
                <div className="flex my-4 relative">
                    <button
                        onClick={() => { setShowNewMenu(!showNewMenu); }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-cyber-accent to-indigo-500 text-white rounded-xl hover:opacity-90 transition-all font-bold shadow-lg shadow-cyan-500/30 dark:shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                    >
                        <Plus className="size-5" />
                        New
                        <ChevronDown className="size-4 ml-auto" />
                    </button>

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
                                            window.dispatchEvent(new CustomEvent('trigger-upload-modal'));
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
            </div>

        {/* SCROLLABLE NAVIGATION SECTION */}
        <div className='flex-1 overflow-y-auto custom-scrollbar py-2'>
            {/* PERSONAL SECTION */}
            <div className="w-full px-6">
                <div className="w-full space-y-1">
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

            {/* MANAGEMENT SECTION */}
            {isAdmin && (
                <div className="w-full px-6 mt-6">
                    <div className="my-4 border-t border-slate-200 dark:border-cyber-border/30" />
                    <p className="px-4 pb-2 text-[12px] font-black uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400/80">System Control</p>
                    <div className="w-full space-y-1">
                         <NavLink
                            href={route('admin.dashboard')}
                            active={route().current('admin.dashboard')}
                            icon={LayoutDashboard}
                            variant="indigo"
                        >
                            Dashboard
                        </NavLink>

                        {isUserAdmin && (
                            <NavLink
                                href={route('admin.users.index')}
                                active={route().current('admin.users.index')}
                                icon={Users}
                                variant="indigo"
                            >
                                User Management
                            </NavLink>
                        )}

                        {isSystemAdmin && (
                            <>
                                <NavLink
                                    href={route('admin.cloud.index')}
                                    active={route().current('admin.cloud.index')}
                                    icon={Cloud}
                                    variant="indigo"
                                >
                                    Cloud Management
                                </NavLink>
                                <NavLink
                                    href={route('admin.database.index')}
                                    active={route().current('admin.database.index')}
                                    icon={Server}
                                    variant="indigo"
                                >
                                    Database Management
                                </NavLink>
                                <NavLink
                                    href={route('admin.covers.index')}
                                    active={route().current('admin.covers.index')}
                                    icon={ImagePlus}
                                    variant="indigo"
                                >
                                    Cover Management
                                </NavLink>
                            </>
                        )}


                    </div>
                </div>
            )}
        </div>

        {/* FIXED BOTTOM SECTION */}
        <div className="shrink-0 border-t border-slate-100 dark:border-cyber-border/20 mt-auto w-full">
            <div className="w-full my-4 space-y-1 px-6">
                <div className="p-4 bg-slate-100 dark:bg-cyber-surface/50 rounded-xl border border-slate-200 dark:border-cyber-border/30">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">Personal Space</span>
                        <span className="text-slate-900 dark:text-white font-semibold">
                            {formatBytes(effectiveTotalStorage)} / {formatBytes(effectiveStorageLimit)}
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
                    <span>Manage Personal Space</span>
                </button>
            </div>
        </div>

        {/* RESPONSIVE LAYOUT MOBILE */}
        <div className={ (showingNavigationDropdown ? 'block' : 'hidden') + ' sm:hidden' }>
            <div className="space-y-1 pb-3 pt-2">
                <ResponsiveNavLink href={route('myDocuments')} active={route().current('myDocuments')}>My Documents</ResponsiveNavLink>
            </div>
            <div className="border-t border-slate-200 dark:border-cyber-border/50 pb-1 pt-4">
                <div className="px-4">
                    <div className="text-base font-medium text-slate-800 dark:text-slate-200">{user.name}</div>
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{user.email}</div>
                </div>
                <div className="mt-3 space-y-1">
                    <ResponsiveNavLink href={route('profile.edit')}>Profile</ResponsiveNavLink>
                    <ResponsiveNavLink method="post" href={route('logout')} as="button">Log Out</ResponsiveNavLink>
                </div>
            </div>
        </div>
    </nav>
  );
}


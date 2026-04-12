import { FolderOpen, Star, HardDrive, Shield, Lock, Unlock, Plus, ChevronDown, Upload, Users, FolderTree } from 'lucide-react';
import { useState } from 'react';
import { formatBytes } from '@/Utils/fileUtils';
import { Link, usePage } from '@inertiajs/react';

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
}) {

    const user = usePage().props.auth.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showNewMenu, setShowNewMenu] = useState(false);

    const [isUploading, setIsUploading] = useState(false);


    const storagePercentage = (totalStorage / storageLimit) * 100;

    const MenuButton = ({ icon: Icon, label, onClick, className = ""}) => (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left ${className}`}
        >
            <Icon className={`size-4 text-gray-500 ${className}`} />
            {label}
        </button>
    );

  return (
    <nav className="w-64 h-screen flex flex-col border-b border-gray-100 bg-gray-100 shadow-lg">
        <div className='flex-1'>
            {/* HEADER */}
            <div className="mx-auto max-w-7xl sm:px-6 lg:px-6">
                <div className="flex my-4">
                    {/* Icon */}
                    <Link href="/myDocuments">
                        <div className="flex items-center space-x-3 my-3">
                            <div className="inline-flex items-center justify-center p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/50">
                                <Shield className="size-6 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">Stegolock</h1>
                        </div>
                    </Link>

                    {/* Mobile Navigation */}
                    <div className="-me-2 flex items-center sm:hidden">
                        <button
                            onClick={() =>
                                setShowingNavigationDropdown(
                                    (previousState) => !previousState,
                                )
                            }
                            className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-none"
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

            {/* Divider */}
            <div className="relative">
                <div className="w-full border-t border-gray-300"></div>
            </div>

            {/* NEW BUTTON */}
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
                        <div className="absolute w-full mt-14 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                            <MenuButton icon={Upload}
                                        label="Lock a File"
                                        onClick={() => {
                                            if (isUploading) return;
                                            setShowNewMenu(false);
                                            setShowUploadModal(true);
                                        }}
                                        className={isUploading ? 'text-slate-300' : ''}
                            />
                            <MenuButton icon={Plus}
                                        label="New Folder"
                                        onClick={onNewFolderClick}
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

            {/* Divider */}
            <div className="relative">
                <div className="w-full border-t border-gray-300"></div>
            </div>

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
                            href={route('folder')}
                            active={route().current('folders')}
                            icon={FolderTree}
                        >
                            My Folders
                        </NavLink>

                        {/* Divider */}
                        <div className="relative">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>

                        <NavLink
                            href={route('folder')}
                            active={route().current('/folders')}
                            icon={FolderOpen}
                        >All Documents</NavLink>

                        <NavLink
                            href={route('folder')}
                            active={route().current('/folders')}
                            icon={Users}
                        >Shared With Me</NavLink>

                        <NavLink
                            href={route('folder')}
                            active={route().current('/folders')}
                            icon={Star}
                        >Starred</NavLink>
                    </div>

                </div>
            </div>
        </div>

        {/* Divider */}
        <div className="relative">
            <div className="w-full border-t border-gray-300"></div>
        </div>


        {/* Storage Info */}
        <div className="">
            <div className="mx-auto max-w-7xl my-4 space-y-1 sm:px-6 lg:px-6">
                <div className="p-4 bg-gradient-to-br from-gray-200 to-gray-100 rounded-xl">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600 font-medium">Storage</span>
                        <span className="text-gray-900 font-semibold">
                            {formatBytes(totalStorage)} / {formatBytes(storageLimit)}
                        </span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-2 overflow-hidden">
                        <div
                            className={" rounded-full transition-all shadow-sm"+
                                (storagePercentage > 90 ? " bg-gradient-to-r from-purple-600 to-red-600 h-2" :
                                     " bg-gradient-to-r from-indigo-600 to-purple-600 h-2")
                            }
                            style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                        />
                    </div>
                </div>

                <button
                    // onClick={onManageStorageClick}
                    className="w-full flex items-center gap-2 text-gray-700 hover:bg-gray-200 px-4 py-2.5 rounded-xl transition-all font-medium"
                >
                    <HardDrive className="size-5 text-gray-500" />
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

            <div className="border-t border-gray-200 pb-1 pt-4">
                <div className="px-4">
                    <div className="text-base font-medium text-gray-800">
                        {user.name}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
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

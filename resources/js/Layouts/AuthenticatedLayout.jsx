import { Shield, Plus, ChevronDown, Upload, FolderOpen, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, HardDrive, X, Folder} from "lucide-react";
import { Toaster } from 'sonner';

import Dropdown from '@/Components/Dropdown';

import { Sidebar } from "@/Components/Sidebar";

import { Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import CreateFolderModal from '@/Components/modals/CreateFolderModal';

export default function AuthenticatedLayout({
    header,
    subHeader,
    headerActions,
    totalStorage,
    storageLimit,
    hasProcessingDocs = false,
    children
 }) {

    const user = usePage().props.auth.user;
    const [showFolderCreateModal, setShowFolderCreateModal] = useState(false);
    const [folderName, setFolderName] = useState('');
    const [folderErrors, setFolderErrors] = useState({});
    const [folderProcessing, setFolderProcessing] = useState(false);

    const submitFolderCreate = async (e) => {
        e.preventDefault();
        setFolderProcessing(true);
        const toastId = toast.loading('Creating folder...');
        try {
            await axios.post('/folders', { 
                name: folderName,
                parent_id: null 
            });
            toast.success('Folder created successfully', { id: toastId });
            setShowFolderCreateModal(false);
            setFolderName('');
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

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-cyber-surface transition-colors overflow-hidden">

            {/* LEFT SIDE (Navigation) */}
            <Sidebar
                totalStorage={totalStorage}
                storageLimit={storageLimit}
                hasProcessingDocs={hasProcessingDocs}
                onNewFolderClick={() => {
                    setFolderName('');
                    setFolderErrors({});
                    setShowFolderCreateModal(true);
                }}
            />

            {/* RIGHT SIDE */}
            <div className="flex flex-col flex-1 h-screen overflow-hidden">
                <header className="bg-white/80 dark:bg-cyber-void/90 backdrop-blur-xl border-b border-slate-200 dark:border-cyber-border/50 relative z-20 transition-colors">
                    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-4">
                        {/* Row 1: Title & Actions */}
                        <div className="flex items-center justify-between min-h-[40px]">
                            <div className="flex-1 min-w-0 text-slate-900 dark:text-white transition-colors">
                                {header}
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                {/* Page-specific actions (e.g., Grid/List Toggle) */}
                                {headerActions}

                                {/* Global Profile Menu */}
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className="flex items-center justify-center size-10 bg-slate-50 dark:bg-cyber-surface hover:bg-slate-100 dark:hover:bg-cyber-surface/80 rounded-full transition-all border border-slate-200 dark:border-cyber-border/50 group cursor-pointer shadow-sm hover:shadow-cyan-500/20 overflow-hidden">
                                            <div className="size-full bg-gradient-to-br from-cyber-accent to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-inner group-hover:scale-110 transition-transform">
                                                {user.name.charAt(0)}
                                            </div>
                                        </button>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content width="72" contentClasses="py-2 bg-white dark:bg-cyber-surface/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-300 dark:border-cyber-accent/30">
                                        <div className="px-5 py-4 border-b border-slate-200 dark:border-cyber-border/50 mb-1">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{user.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{user.email}</p>
                                        </div>
                                        
                                        <div className="space-y-0.5 px-2">
                                            <Dropdown.Link href={route('profile.edit')} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-cyber-border/30 transition-colors rounded-xl group">
                                                <User className="size-4 text-slate-400 group-hover:text-cyber-accent transition-colors" />
                                                Manage Account
                                            </Dropdown.Link>

                                            <Dropdown.Link href={route('manageStorage')} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-cyber-border/30 transition-colors rounded-xl group">
                                                <HardDrive className="size-4 text-slate-400 group-hover:text-cyber-accent transition-colors" />
                                                Manage Personal Space
                                            </Dropdown.Link>
                                        </div>

                                        <div className="my-2 border-t border-slate-50 dark:border-cyber-border/30 mx-2" />

                                        <div className="px-2">
                                            <Dropdown.Link href={route('logout')} method="post" as="button" className="flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-xl w-full group">
                                                <EyeOff className="size-4 text-red-400 group-hover:text-red-500 transition-colors" />
                                                Log Out
                                            </Dropdown.Link>
                                        </div>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        {/* Row 2: Search & Filters */}
                        {subHeader && (
                            <div className="mt-4 pt-4 border-t border-slate-50 dark:border-cyber-border/30">
                                {subHeader}
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-hidden">
                    {children}

                    <CreateFolderModal 
                        show={showFolderCreateModal}
                        onClose={() => setShowFolderCreateModal(false)}
                        onSubmit={submitFolderCreate}
                        name={folderName}
                        setName={setFolderName}
                        errors={folderErrors}
                        processing={folderProcessing}
                        title="New Root Folder"
                        subtitle="Organize your top-level workspace"
                    />

                    <Toaster position="top-center" richColors />
                </main>
            </div>
        </div>
    );
}

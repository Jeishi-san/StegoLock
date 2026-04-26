import { Shield, Plus, ChevronDown, Upload, FolderOpen, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, HardDrive} from "lucide-react";
import { Toaster } from 'sonner';

import Dropdown from '@/Components/Dropdown';

import { Sidebar } from "@/Components/Sidebar";

import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function AuthenticatedLayout({
    header,
    subHeader,
    headerActions,
    totalStorage,
    storageLimit,
    hasProcessingDocs = false,
    children
 }) {
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

    const user = usePage().props.auth.user;

    return (
        <div className="flex min-h-screen bg-white dark:bg-cyber-void text-slate-900 dark:text-slate-200 overflow-hidden selection:bg-cyber-accent selection:text-white dark:selection:text-cyber-void transition-colors duration-300">

            {/* LEFT SIDE (Navigation) */}
            <Sidebar
                totalStorage={totalStorage}
                storageLimit={storageLimit}
                hasProcessingDocs={hasProcessingDocs}
                darkMode={darkMode}
                setDarkMode={setDarkMode}
            />

            {/* RIGHT SIDE */}
            <div className="flex flex-col flex-1 h-screen overflow-hidden">
                <header className="glass-header relative z-20">
                    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-4">
                        {/* Row 1: Title & Actions */}
                        <div className="flex items-center justify-between min-h-[40px]">
                            <div className="flex-1 min-w-0">
                                {header}
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                                {/* Page-specific actions (e.g., Grid/List Toggle) */}
                                {headerActions}

                                {/* Global Profile Menu */}
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <button className="flex items-center justify-center size-10 bg-slate-100 dark:bg-cyber-surface hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all border border-slate-200 dark:border-cyber-border group cursor-pointer shadow-sm overflow-hidden">
                                            <div className="size-full bg-cyber-accent flex items-center justify-center text-white dark:text-cyber-void font-bold text-sm">
                                                 {user.name.charAt(0)}
                                             </div>
                                         </button>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content width="64" contentClasses="py-2 glass-panel rounded-2xl shadow-2xl overflow-hidden">
                                        <div className="px-5 py-4 border-b border-slate-200 dark:border-cyber-border/50 mb-1 bg-slate-50 dark:bg-cyber-surface/30">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{user.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
                                        </div>
                                        
                                        <div className="space-y-0.5 px-2">
                                            <Dropdown.Link href={route('profile.edit')} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-cyber-accent hover:text-white dark:hover:text-cyber-void transition-all rounded-xl">
                                                <User className="size-4 opacity-70" />
                                                Manage Account
                                            </Dropdown.Link>

                                            <Dropdown.Link href={route('manageStorage')} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-cyber-accent hover:text-white dark:hover:text-cyber-void transition-all rounded-xl">
                                                <HardDrive className="size-4 opacity-70" />
                                                Manage Storage
                                            </Dropdown.Link>
                                        </div>

                                        <div className="my-2 border-t border-slate-200 dark:border-cyber-border/50 mx-2" />

                                        <div className="px-2">
                                            <Dropdown.Link href={route('logout')} method="post" as="button" className="flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors rounded-xl w-full">
                                                <EyeOff className="size-4 text-red-400" />
                                                Log Out
                                            </Dropdown.Link>
                                        </div>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        {/* Row 2: Search & Filters */}
                        {subHeader && (
                            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-cyber-border/50">
                                {subHeader}
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-hidden bg-slate-50 dark:bg-cyber-void transition-colors duration-300">
                    {children}
                    <Toaster position="top-center" richColors theme={darkMode ? 'dark' : 'light'} />
                </main>
            </div>
        </div>
    );
}

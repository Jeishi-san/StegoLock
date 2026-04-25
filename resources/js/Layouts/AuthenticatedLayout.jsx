import { Shield, Plus, ChevronDown, Upload, FolderOpen, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, HardDrive} from "lucide-react";
import { Toaster } from 'sonner';

import Dropdown from '@/Components/Dropdown';

import { Sidebar } from "@/Components/Sidebar";

import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

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

    return (
        <div className="flex min-h-screen bg-gray-100 overflow-hidden">

            {/* LEFT SIDE (Navigation) */}
            <Sidebar
                totalStorage={totalStorage}
                storageLimit={storageLimit}
                hasProcessingDocs={hasProcessingDocs}
            />

            {/* RIGHT SIDE */}
            <div className="flex flex-col flex-1 h-screen overflow-hidden">
                <header className="bg-white border-b border-gray-100 relative z-20">
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
                                        <button className="flex items-center justify-center size-10 bg-gray-50 hover:bg-gray-100 rounded-full transition-all border border-gray-200 group cursor-pointer shadow-sm overflow-hidden">
                                            <div className="size-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                                {user.name.charAt(0)}
                                            </div>
                                        </button>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content width="64" contentClasses="py-2 bg-white rounded-2xl shadow-2xl border border-gray-100">
                                        <div className="px-5 py-4 border-b border-gray-50 mb-1">
                                            <p className="text-sm font-bold text-gray-900 leading-tight">{user.name}</p>
                                            <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                                        </div>
                                        
                                        <div className="space-y-0.5 px-2">
                                            <Dropdown.Link href={route('profile.edit')} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition-colors rounded-xl">
                                                <User className="size-4 text-gray-400" />
                                                Manage Account
                                            </Dropdown.Link>

                                            <Dropdown.Link href={route('manageStorage')} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 transition-colors rounded-xl">
                                                <HardDrive className="size-4 text-gray-400" />
                                                Manage Storage
                                            </Dropdown.Link>
                                        </div>

                                        <div className="my-2 border-t border-gray-50 mx-2" />

                                        <div className="px-2">
                                            <Dropdown.Link href={route('logout')} method="post" as="button" className="flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-xl w-full">
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
                            <div className="mt-4 pt-4 border-t border-gray-50">
                                {subHeader}
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-hidden">
                    {children}
                    <Toaster position="top-center" richColors />
                </main>
            </div>
        </div>
    );
}

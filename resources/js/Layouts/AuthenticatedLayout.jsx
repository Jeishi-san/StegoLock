import { Shield, Plus, ChevronDown, Upload, FolderOpen, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2,} from "lucide-react";
import { Toaster } from 'sonner';

import Dropdown from '@/Components/Dropdown';

import { Sidebar } from "@/Components/Sidebar";

import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({
    header,
    children,
    totalStorage,
    storageLimit
 }) {

    const user = usePage().props.auth.user;

    return (
        <div className="flex min-h-screen bg-gray-100 overflow-hidden">

            {/* LEFT SIDE (Navigation) */}
            <Sidebar
                totalStorage={totalStorage}
                storageLimit={storageLimit}

            />

            {/* RIGHT SIDE */}
            <div className="flex flex-col flex-1 h-screen overflow-hidden">
                {header && (
                    <header className="bg-white shadow border border-red-700">
                        <div className="flex h-[100px]">
                            <div className="w-full mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 border border-red-700">
                                {header}
                            </div>


                            <div className="hidden sm:ms-6 sm:flex sm:items-center border border-blue-800">
                                <div className="relative">
                                    <Dropdown>
                                        <Dropdown.Trigger>
                                            <span className="inline-flex rounded-md">
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none"
                                                >
                                                    {user.name}

                                                    <svg
                                                        className="-me-0.5 ms-2 h-4 w-4"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </button>
                                            </span>
                                        </Dropdown.Trigger>

                                        <Dropdown.Content>
                                            <Dropdown.Link
                                                href={route('profile.edit')}
                                            >
                                                Profile
                                            </Dropdown.Link>

                                            <Dropdown.Link
                                                href={route('logout')}
                                                method="post"
                                                as="button"
                                            >
                                                Log Out
                                            </Dropdown.Link>
                                        </Dropdown.Content>
                                    </Dropdown>
                                </div>
                            </div>

                        </div>
                    </header>
                )}

                <main className="flex-1 overflow-hidden">
                    {children}
                    <Toaster position="top-right" richColors />
                </main>
            </div>
        </div>
    );
}

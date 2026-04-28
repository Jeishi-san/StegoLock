import { usePage } from '@inertiajs/react';
import { User, HardDrive, EyeOff } from 'lucide-react';
import Dropdown from '@/Components/Dropdown';

export default function AdminTopbar({ header, headerActions }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const role = user.role;

    const isSuperadmin = role === 'superadmin';
    const roleLabel = isSuperadmin ? 'SUPERADMIN' : (role ?? 'ADMIN').toString().toUpperCase();

    return (
        <header className="bg-white/80 dark:bg-cyber-void/90 backdrop-blur-xl border-b border-slate-200 dark:border-cyber-border/50 relative z-20 transition-colors">
            <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-4">
                <div className="flex items-center justify-between min-h-[40px]">
                    {/* Page Title / Header Content */}
                    <div className="flex-1 min-w-0 text-slate-900 dark:text-white transition-colors">
                        {header}
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        {/* Page-specific actions */}
                        {headerActions}

                        {/* Role Badge */}
                        <div className="hidden md:block">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wider ${
                                isSuperadmin 
                                    ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                                    : 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            }`}>
                                {roleLabel}
                            </span>
                        </div>

                        {/* Global Profile Menu */}
                        <Dropdown>
                            <Dropdown.Trigger>
                                <button className="flex items-center justify-center size-10 bg-slate-50 dark:bg-cyber-surface hover:bg-slate-100 dark:hover:bg-cyber-surface/80 rounded-full transition-all border border-slate-200 dark:border-cyber-border/50 group cursor-pointer shadow-sm hover:shadow-indigo-500/20 overflow-hidden">
                                    <div className="size-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-inner group-hover:scale-110 transition-transform">
                                        {user.name.charAt(0)}
                                    </div>
                                </button>
                            </Dropdown.Trigger>

                            <Dropdown.Content width="72" contentClasses="py-2 bg-white dark:bg-cyber-surface/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-300 dark:border-indigo-500/30">
                                <div className="px-5 py-4 border-b border-slate-200 dark:border-cyber-border/50 mb-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{user.name}</p>
                                        <span className="text-[9px] font-black text-indigo-500 px-1.5 py-0.5 bg-indigo-500/10 rounded-md border border-indigo-500/20">{roleLabel}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{user.email}</p>
                                </div>
                                
                                <div className="space-y-0.5 px-2">
                                    <Dropdown.Link href={route('profile.edit')} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-cyber-border/30 transition-colors rounded-xl group">
                                        <User className="size-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                                        Manage Account
                                    </Dropdown.Link>

                                    <Dropdown.Link href={route('manageStorage')} className="flex items-center gap-3 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-cyber-border/30 transition-colors rounded-xl group">
                                        <HardDrive className="size-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
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
            </div>
        </header>
    );
}


import { useState, useEffect } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { 
    Shield, 
    LayoutDashboard, 
    Users, 
    Database, 
    UserCog, 
    Moon, 
    Sun, 
    Plus, 
    ChevronDown, 
    LogOut,
    HardDrive,
    UserPlus,
    Cloud,
    Server,
    ImagePlus
} from 'lucide-react';
import NavLink from '@/Components/NavLink';

export default function AdminSidebar({ role, onLogout }) {
    const { auth } = usePage().props;
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

    const [showNewMenu, setShowNewMenu] = useState(false);

    // Role-based access logic
    const isUserAdmin = role === 'user_admin' || role === 'superadmin';
    const isSystemAdmin = role === 'db_storage_admin' || role === 'superadmin';
    const isSuperadmin = role === 'superadmin';

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
                <div className="mx-auto max-w-7xl px-6">
                    <div className="flex items-center justify-between my-4">
                        <Link href="/admin/dashboard" className="group">
                            <div className="flex items-center space-x-3 my-3">
                                <div className="relative inline-flex items-center justify-center p-2.5 bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 rounded-xl shadow-lg shadow-orange-500/40 dark:shadow-[0_0_20px_rgba(249,115,22,0.6)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                    <Shield className="size-6 text-white drop-shadow-md relative z-10" />
                                    <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight transform origin-left group-hover:scale-105 inline-block transition-all duration-300">
                                    Admin<span className="text-orange-500">Panel</span>
                                </h1>
                            </div>
                        </Link>

                        <button 
                            onClick={() => setDarkMode(!darkMode)}
                            className="p-2.5 bg-slate-100 dark:bg-cyber-surface/50 border border-slate-200 dark:border-cyber-border rounded-xl text-slate-500 dark:text-slate-400 hover:text-orange-500 hover:border-orange-500 transition-all shadow-inner group hidden sm:block"
                        >
                            {darkMode ? (
                                <Moon className="size-4 group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
                            ) : (
                                <Sun className="size-4 group-hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
                            )}
                        </button>
                    </div>
                </div>

                {/* NEW ACTION BUTTON (e.g., Create User) */}
                {isUserAdmin && (
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="flex my-4 relative">
                            <button
                                onClick={() => setShowNewMenu(!showNewMenu)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:opacity-90 transition-all font-bold shadow-lg shadow-orange-500/30 dark:shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                            >
                                <Plus className="size-5" />
                                Admin Actions
                                <ChevronDown className="size-4 ml-auto" />
                            </button>

                            {showNewMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowNewMenu(false)} />
                                    <div className="absolute w-full mt-16 p-2 glass-panel shadow-2xl z-50 rounded-2xl border border-slate-200 dark:border-cyber-border/50 dark:bg-cyber-surface/90 backdrop-blur-xl">
                                        <MenuButton 
                                            icon={UserPlus} 
                                            label="Create New User" 
                                            onClick={() => {
                                                setShowNewMenu(false);
                                                // Trigger create user modal/page
                                            }} 
                                        />
                                        {isSuperadmin && (
                                            <MenuButton 
                                                icon={Shield} 
                                                label="Add Administrator" 
                                                onClick={() => setShowNewMenu(false)} 
                                            />
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* NAVIGATION LINKS */}
                <div className="mx-auto max-w-7xl px-6">
                    <div className="flex mt-4">
                        <div className="w-full space-y-2">
                            <NavLink
                                href={route('admin.dashboard')}
                                active={route().current('admin.dashboard')}
                                icon={LayoutDashboard}
                            >
                                Dashboard
                            </NavLink>

                            {isUserAdmin && (
                                <NavLink
                                    href={route('admin.users.index')}
                                    active={route().current('admin.users.index')}
                                    icon={Users}
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
                                    >
                                        Cloud Management
                                    </NavLink>
                                    <NavLink
                                        href={route('admin.database.index')}
                                        active={route().current('admin.database.index')}
                                        icon={Server}
                                    >
                                        Database Management
                                    </NavLink>
                                    <NavLink
                                        href={route('admin.covers.index')}
                                        active={route().current('admin.covers.index')}
                                        icon={ImagePlus}
                                    >
                                        Cover Management
                                    </NavLink>
                                </>
                            )}

                            {isSuperadmin && (
                                <NavLink
                                    href={route('admin.admins.index')}
                                    active={route().current('admin.admins.index')}
                                    icon={UserCog}
                                >
                                    Admin Management
                                </NavLink>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* LOGOUT BUTTON */}
            <div className="mx-auto max-w-7xl my-4 px-6">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all group text-slate-700 dark:text-slate-300 hover:bg-gradient-to-r hover:from-red-500/10 hover:to-orange-500/10 dark:hover:from-red-500/20 dark:hover:to-orange-500/20 hover:text-red-600 dark:hover:text-white hover:shadow-md hover:shadow-red-500/20 font-medium"
                >
                    <LogOut className="size-5 text-slate-500 dark:text-slate-400 group-hover:text-red-500 transition-colors" />
                    <span>Logout</span>
                </button>
            </div>
        </nav>
    );
}


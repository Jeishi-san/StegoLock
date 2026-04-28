import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    Database,
    Key,
    LayoutDashboard,
    Lock,
    LogOut,
    UserCog,
    Users,
} from 'lucide-react';

export default function AdminSidebar({ role, onLogout }) {
    const { url } = usePage();
    const isSuperadmin = role === 'superadmin' || role === 'owner';

    const adminNavItems = [
        { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', match: ['/admin/dashboard'] },
        { href: '/admin/users', icon: Users, label: 'Users', match: ['/admin/users'] },
        { href: '/admin/system/stats', icon: Database, label: 'System Monitoring', match: ['/admin/system/stats'] },
        // { href: '/admin/activity', icon: Activity, label: 'Activity Logs', match: ['/admin/activity'] },
    ];

    const ownerNavItems = [
        { href: '/admin/admins', icon: UserCog, label: 'Admin Management', match: ['/admin/admins'] },
        // { href: '/admin/encryption-policy', icon: Lock, label: 'Encryption Policy', match: ['/admin/encryption-policy'] },
        // { href: '/admin/key-management', icon: Key, label: 'Key Management Policy', match: ['/admin/key-management'] },
    ];

    const isActive = (paths) => paths.some((path) => url === path || url.startsWith(`${path}/`));

    return (
        <aside className="flex h-full w-64 flex-col border-r border-slate-800 bg-slate-900 text-slate-200">
            <div className="border-b border-slate-800 px-6 py-6">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">StegoLock</p>
                <h1 className="mt-2 text-xl font-bold text-white">Administration Panel</h1>
                <p className="mt-1 text-sm text-slate-400">Secure system administration</p>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                {adminNavItems.map((item) => {
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${isActive(item.match) ? 'bg-orange-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                            <Icon className="size-5" />
                            <span className="text-sm font-medium">{item.label}</span>
                        </Link>
                    );
                })}

                {isSuperadmin && (
                    <>
                        <div className="my-4 border-t border-slate-800" />
                        <p className="px-4 pb-2 text-xs uppercase tracking-[0.3em] text-slate-500">Superadmin only</p>
                        {ownerNavItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-xl px-4 py-3 transition ${isActive(item.match) ? 'bg-red-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                                >
                                    <Icon className="size-5" />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </>
                )}
            </nav>

            <div className="border-t border-slate-800 p-4">
                <button
                    type="button"
                    onClick={onLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                >
                    <LogOut className="size-5" />
                    <span className="text-sm font-medium">Logout</span>
                </button>
            </div>
        </aside>
    );
}

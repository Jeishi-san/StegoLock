import AdminSidebar from './AdminSidebar';
import AdminTopbar from './AdminTopbar';
import { usePage, router } from '@inertiajs/react';

export default function AdminLayout({ children, onLogout }) {
    const { auth } = usePage().props;

    const handleLogout = () => {
        if (onLogout) {
            onLogout();
        } else {
            router.post(route('logout'));
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-950 text-slate-100">
            <AdminSidebar role={auth.user.role} onLogout={handleLogout} />
            <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
                <AdminTopbar email={auth.user.email} role={auth.user.role} />
                <main className="flex-1 overflow-y-auto bg-slate-950 p-6 sm:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}

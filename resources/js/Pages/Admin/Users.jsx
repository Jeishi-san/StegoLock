import AdminLayout from '@/Layouts/Admin/AdminLayout';
import { Head } from '@inertiajs/react';
import { UserPlus, Search, ChevronDown, Pencil, Trash2, Shield, UserCog, Database } from 'lucide-react';
import { useState } from 'react';
import CreateUserModal from '@/Components/Admin/CreateUserModal';

const statusFilters = ['All', 'Active', 'Inactive'];

export default function Users() {
    // Hardcoded static data
    const [users] = useState([
        { id: 1, name: 'Alice Admin', email: 'alice@stegolock.com', role: 'superadmin', active: true, created_at: '2026-01-15' },
        { id: 2, name: 'Bob Builder', email: 'bob@example.com', role: 'user', active: true, created_at: '2026-02-10' },
        { id: 3, name: 'Charlie Checker', email: 'charlie@stegolock.com', role: 'user_admin', active: false, created_at: '2026-03-05' },
        { id: 4, name: 'Diana Data', email: 'diana@stegolock.com', role: 'db_storage_admin', active: true, created_at: '2026-04-12' },
        { id: 5, name: 'Eve Everyman', email: 'eve@example.com', role: 'user', active: true, created_at: '2026-04-20' },
    ]);

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    const getRoleBadge = (role) => {
        switch (role) {
            case 'superadmin':
            case 'owner':
                return <span className="inline-flex items-center gap-1 rounded-md border border-red-600/30 bg-red-600/20 px-2 py-1 text-xs font-medium text-red-400"><Shield className="size-3" /> SUPERADMIN</span>;
            case 'user_admin':
                return <span className="inline-flex items-center gap-1 rounded-md border border-blue-600/30 bg-blue-600/20 px-2 py-1 text-xs font-medium text-blue-400"><UserCog className="size-3" /> USER ADMIN</span>;
            case 'db_storage_admin':
                return <span className="inline-flex items-center gap-1 rounded-md border border-purple-600/30 bg-purple-600/20 px-2 py-1 text-xs font-medium text-purple-400"><Database className="size-3" /> STORAGE ADMIN</span>;
            default:
                return <span className="inline-flex rounded-md border border-slate-600/30 bg-slate-600/20 px-2 py-1 text-xs font-medium text-slate-400">USER</span>;
        }
    };

    const getStatusBadge = (active) => {
        if (active) {
            return <span className="inline-flex items-center gap-2 rounded-md border border-green-600/30 bg-green-600/20 px-2 py-1 text-xs font-medium text-green-400"><span className="size-1.5 rounded-full bg-green-500" /> Active</span>;
        } else {
            return <span className="inline-flex items-center gap-2 rounded-md border border-slate-600/30 bg-slate-600/20 px-2 py-1 text-xs font-medium text-slate-400"><span className="size-1.5 rounded-full bg-slate-500" /> Inactive</span>;
        }
    };

    return (
        <AdminLayout>
            <Head title="Users" />
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Users</h1>
                        <p className="mt-1 text-sm text-slate-400">Manage user accounts and permissions (Static View)</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:from-orange-700 hover:to-red-700"
                    >
                        <UserPlus className="size-4" />
                        Create User
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-xl border border-slate-800 bg-slate-800/50 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/50 focus:outline-none"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
                    <div className="grid grid-cols-12 gap-4 bg-slate-800/50 px-6 py-4">
                        <div className="col-span-4 text-xs font-semibold text-slate-400 uppercase">User</div>
                        <div className="col-span-3 text-xs font-semibold text-slate-400 uppercase">Role</div>
                        <div className="col-span-2 text-xs font-semibold text-slate-400 uppercase">Status</div>
                        <div className="col-span-2 text-xs font-semibold text-slate-400 uppercase">Created At</div>
                        <div className="col-span-1 text-xs font-semibold text-slate-400 uppercase">Actions</div>
                    </div>

                    <div className="divide-y divide-slate-800">
                        {users.map((user) => (
                            <div key={user.id} className="grid grid-cols-12 items-center gap-4 px-6 py-4 transition hover:bg-slate-800/30">
                                <div className="col-span-4 flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-slate-800 text-sm font-medium text-slate-300">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{user.name}</p>
                                        <p className="text-xs text-slate-500">{user.email}</p>
                                    </div>
                                </div>
                                <div className="col-span-3">{getRoleBadge(user.role)}</div>
                                <div className="col-span-2">{getStatusBadge(user.active)}</div>
                                <div className="col-span-2 text-sm text-slate-500">
                                    {user.created_at}
                                </div>
                                <div className="col-span-1 flex items-center gap-2">
                                    <button className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white">
                                        <Pencil className="size-4" />
                                    </button>
                                    <button className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/20 hover:text-red-400">
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <CreateUserModal
                    isOpen={showCreateModal}
                    onClose={() => {
                        setShowCreateModal(false);
                        setEditingUser(null);
                    }}
                    onSubmit={(data) => console.log('Create/Edit User:', data)}
                    editUser={editingUser}
                />
            </div>
        </AdminLayout>
    );
}

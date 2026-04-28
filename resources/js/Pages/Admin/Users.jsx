import AdminLayout from '@/Layouts/Admin/AdminLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { 
    UserPlus, Search, Shield, UserCog, Database, 
    MoreVertical, Pencil, Trash2, Mail, Calendar, 
    HardDrive, CheckCircle2, XCircle, Filter
} from 'lucide-react';
import { useState, useMemo } from 'react';
import CreateUserModal from '@/Components/Admin/CreateUserModal';
import UserActivityModal from '@/Components/Admin/UserActivityModal';
import Dropdown from '@/Components/Dropdown';

export default function Users({ users = [] }) {
    const { auth } = usePage().props;
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [storageFilter, setStorageFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // History Modal State
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedUserLogs, setSelectedUserLogs] = useState({ user: null, activities: [] });
    const [historyLoading, setHistoryLoading] = useState(false);

    const handleViewHistory = async (user) => {
        setHistoryLoading(true);
        setShowHistoryModal(true);
        setSelectedUserLogs({ user, activities: [] });

        try {
            const response = await fetch(route('admin.users.activities', user.id));
            const data = await response.json();
            setSelectedUserLogs(data);
        } catch (error) {
            console.error('Failed to fetch activities:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const isSuperadmin = auth.user.role === 'superadmin';

    // Filtering & Sorting logic
    const processedUsers = useMemo(() => {
        let result = [...users];

        // 1. Search
        if (search) {
            result = result.filter(user => 
                user.name.toLowerCase().includes(search.toLowerCase()) || 
                user.email.toLowerCase().includes(search.toLowerCase())
            );
        }

        // 2. Role Filter
        if (roleFilter !== 'all') {
            result = result.filter(user => user.role === roleFilter);
        }

        // 3. Storage Filter
        if (storageFilter === 'near-limit') {
            result = result.filter(user => (user.storage_used / user.storage_limit) >= 0.9);
        } else if (storageFilter === 'high-usage') {
            result = result.filter(user => (user.storage_used / user.storage_limit) >= 0.5);
        }

        // 4. Sorting
        result.sort((a, b) => {
            switch (sortBy) {
                case 'name-az': return a.name.localeCompare(b.name);
                case 'name-za': return b.name.localeCompare(a.name);
                case 'storage-high': return b.storage_used - a.storage_used;
                case 'storage-low': return a.storage_used - b.storage_used;
                case 'oldest': return new Date(a.created_at) - new Date(b.created_at);
                case 'newest':
                default: return new Date(b.created_at) - new Date(a.created_at);
            }
        });

        return result;
    }, [users, search, roleFilter, storageFilter, sortBy]);

    const formatBytes = (bytes, decimals = 2) => {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'superadmin':
            case 'owner':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        <Shield className="size-3" /> SUPERADMIN
                    </span>
                );
            case 'user_admin':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        <UserCog className="size-3" /> USER ADMIN
                    </span>
                );
            case 'db_storage_admin':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                        <Database className="size-3" /> STORAGE ADMIN
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-cyber-border/50 bg-slate-50 dark:bg-cyber-border/20 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                        USER
                    </span>
                );
        }
    };

    const handleDeleteUser = (user) => {
        if (confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
            router.delete(route('admin.users.destroy', user.id));
        }
    };

    const handleToggleStatus = (user) => {
        const action = user.is_active ? 'suspend' : 'activate';
        if (confirm(`Are you sure you want to ${action} ${user.name}'s account?`)) {
            router.patch(route('admin.users.toggle-status', user.id));
        }
    };

    const handleUpdateQuota = (user) => {
        const currentGb = user.storage_limit / (1024 * 1024 * 1024);
        const newLimitGb = prompt(`Update Storage Quota for ${user.name} (in GB):`, currentGb);
        
        if (newLimitGb && !isNaN(newLimitGb)) {
            const bytes = parseFloat(newLimitGb) * 1024 * 1024 * 1024;
            router.patch(route('admin.users.update-quota', user.id), {
                storage_limit: bytes
            });
        }
    };

    return (
        <AdminLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                        <UserCog className="size-6 text-indigo-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white transition-colors">
                            {isSuperadmin ? 'System-wide User Management' : 'User Account Management'}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase mt-0.5">
                            {isSuperadmin ? 'Manage all administrators and standard users' : 'Control standard user accounts and storage'}
                        </p>
                    </div>
                </div>
            }
            headerActions={
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95"
                >
                    <UserPlus className="size-4" />
                    {isSuperadmin ? 'Add Administrator' : 'Create New User'}
                </button>
            }
        >
            <Head title="User Management" />

            <div className="space-y-6">
                {/* Search & Advanced Filters */}
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-white/50 dark:bg-cyber-surface/30 p-4 rounded-2xl border border-slate-200 dark:border-cyber-border/50 backdrop-blur-sm">
                    <div className="relative w-full lg:flex-1 group">
                        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-cyber-void/50 border-slate-200 dark:border-cyber-border/50 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        {/* Role Filter (Superadmin only) */}
                        {isSuperadmin && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-cyber-void/50 rounded-xl border border-slate-200 dark:border-cyber-border/50 min-w-[140px]">
                                <Shield className="size-4 text-slate-400" />
                                <select 
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer w-full p-0"
                                >
                                    <option value="all">All Roles</option>
                                    <option value="user">Users</option>
                                    <option value="user_admin">User Admins</option>
                                    <option value="db_storage_admin">Storage Admins</option>
                                    <option value="superadmin">Superadmins</option>
                                </select>
                            </div>
                        )}

                        {/* Storage Filter */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-cyber-void/50 rounded-xl border border-slate-200 dark:border-cyber-border/50 min-w-[140px]">
                            <HardDrive className="size-4 text-slate-400" />
                            <select 
                                value={storageFilter}
                                onChange={(e) => setStorageFilter(e.target.value)}
                                className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer w-full p-0"
                            >
                                <option value="all">Any Storage</option>
                                <option value="near-limit">Near Limit (>90%)</option>
                                <option value="high-usage">High Usage (>50%)</option>
                            </select>
                        </div>

                        {/* Sort Dropdown */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-cyber-void/50 rounded-xl border border-slate-200 dark:border-cyber-border/50 min-w-[140px]">
                            <Filter className="size-4 text-slate-400" />
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-0 cursor-pointer w-full p-0"
                            >
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                                <option value="name-az">Name (A-Z)</option>
                                <option value="name-za">Name (Z-A)</option>
                                <option value="storage-high">Most Storage</option>
                                <option value="storage-low">Least Storage</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white dark:bg-cyber-surface/30 rounded-2xl border border-slate-200 dark:border-cyber-border/50 overflow-hidden backdrop-blur-sm shadow-xl shadow-slate-200/50 dark:shadow-none">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-cyber-void/30 border-b border-slate-200 dark:border-cyber-border/50">
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">User Details</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Status</th>
                                {isSuperadmin && <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Access Level</th>}
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Personal Storage</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Joined</th>
                                <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-cyber-border/30">
                            {processedUsers.length > 0 ? (
                                processedUsers.map((user) => {
                                    const storagePercentage = (user.storage_used / user.storage_limit) * 100;
                                    return (
                                        <tr 
                                            key={user.id} 
                                            onClick={() => handleViewHistory(user)}
                                            className={`group/row cursor-pointer hover:bg-slate-50 dark:hover:bg-indigo-500/5 transition-all ${!user.is_active ? 'opacity-75' : ''}`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`size-10 rounded-full bg-gradient-to-br ${user.is_active ? 'from-indigo-500 to-violet-600' : 'from-slate-400 to-slate-600'} flex items-center justify-center text-white font-black text-sm shadow-md group-hover/row:scale-110 transition-transform`}>
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm font-bold leading-tight group-hover/row:text-indigo-500 transition-colors ${user.is_active ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{user.name}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                                                            <Mail className="size-3" /> {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.is_active ? (
                                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                                                        <CheckCircle2 className="size-3.5" /> Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                                                        <XCircle className="size-3.5" /> Suspended
                                                    </span>
                                                )}
                                            </td>
                                            {isSuperadmin && (
                                                <td className="px-6 py-4">
                                                    {getRoleBadge(user.role)}
                                                </td>
                                            )}
                                            <td className="px-6 py-4">
                                                <div className="w-48 space-y-1.5">
                                                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                        <span>{formatBytes(user.storage_used)} / {formatBytes(user.storage_limit)}</span>
                                                        <span>{Math.round(storagePercentage)}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-cyber-void rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-1000 ${
                                                                storagePercentage > 90 ? 'bg-red-500 shadow-glow-red' : 'bg-indigo-500 shadow-glow-indigo'
                                                            }`}
                                                            style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                                    <Calendar className="size-3.5 text-slate-400" />
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <Dropdown>
                                                        <Dropdown.Trigger>
                                                            <button className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 rounded-lg transition-all">
                                                                <MoreVertical className="size-4" />
                                                            </button>
                                                        </Dropdown.Trigger>
                                                        <Dropdown.Content width="48" contentClasses="py-1 bg-white dark:bg-cyber-surface border border-slate-200 dark:border-cyber-border">
                                                            <button 
                                                                onClick={() => {
                                                                    setEditingUser(user);
                                                                    setShowCreateModal(true);
                                                                }}
                                                                className="flex items-center gap-2 w-full px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-cyber-border/30 transition-colors"
                                                            >
                                                                <Pencil className="size-3.5" /> Edit Profile
                                                            </button>
                                                            <button 
                                                                onClick={() => handleUpdateQuota(user)}
                                                                className="flex items-center gap-2 w-full px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-cyber-border/30 transition-colors"
                                                            >
                                                                <HardDrive className="size-3.5" /> Manage Quota
                                                            </button>
                                                            <button 
                                                                onClick={() => handleToggleStatus(user)}
                                                                className={`flex items-center gap-2 w-full px-4 py-2 text-xs font-bold transition-colors ${user.is_active ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                                                            >
                                                                {user.is_active ? <XCircle className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
                                                                {user.is_active ? 'Suspend Account' : 'Activate Account'}
                                                            </button>
                                                            <div className="border-t border-slate-100 dark:border-cyber-border/30 my-1" />
                                                            {auth.user.id !== user.id && (
                                                                <button 
                                                                    onClick={() => handleDeleteUser(user)}
                                                                    className="flex items-center gap-2 w-full px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                >
                                                                    <Trash2 className="size-3.5" /> Delete User
                                                                </button>
                                                            )}
                                                        </Dropdown.Content>
                                                    </Dropdown>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="size-16 rounded-2xl bg-slate-50 dark:bg-cyber-void/50 flex items-center justify-center border border-slate-200 dark:border-cyber-border/50">
                                                <Search className="size-8 text-slate-300" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-bold text-slate-900 dark:text-white">No users found</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Try adjusting your search or filters</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <CreateUserModal
                    isOpen={showCreateModal}
                    onClose={() => {
                        setShowCreateModal(false);
                        setEditingUser(null);
                    }}
                    onSubmit={(data) => {
                        // We'll implement the actual Inertia request here next
                        console.log('Action:', data);
                    }}
                    editUser={editingUser}
                />

                <UserActivityModal 
                    show={showHistoryModal}
                    onClose={() => setShowHistoryModal(false)}
                    user={selectedUserLogs.user}
                    activities={selectedUserLogs.activities}
                    loading={historyLoading}
                />
            </div>
        </AdminLayout>
    );
}


import { Link, usePage } from '@inertiajs/react';
import {
  LayoutDashboard,
  Users,
  Database,
  Activity,
  AlertTriangle,
  UserCog,
  Lock,
  Key,
  HardDrive,
  Settings,
  Archive,
  LogOut,
} from "lucide-react";

export default function AdminSidebar({ role, onLogout }) {
  const { url } = usePage(); // current URL

  const adminNavItems = [
    { path: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
    { path: "/admin/users", icon: Users, label: "Users" },
    { path: "/admin/fragments", icon: Database, label: "Fragment Monitoring" },
    { path: "/admin/activity", icon: Activity, label: "Activity Logs" },
    { path: "/admin/incidents", icon: AlertTriangle, label: "Incidents" },
  ];

  const superadminNavItems = [
    { path: "/admin/admin-management", icon: UserCog, label: "Admin Management" },
    { path: "/admin/encryption-policy", icon: Lock, label: "Encryption Policy" },
    { path: "/admin/key-management", icon: Key, label: "Key Management Policy" },
    { path: "/admin/storage", icon: HardDrive, label: "Storage Configuration" },
    { path: "/admin/system", icon: Settings, label: "System Configuration" },
    { path: "/admin/disaster-recovery", icon: Archive, label: "Disaster Recovery" },
  ];

  const isActive = (path) => url === path;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white">StegoLock</h1>
        <p className="text-xs text-slate-400 mt-1">Administration Panel</p>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {adminNavItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              isActive(item.path)
                ? "bg-orange-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <item.icon className="size-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}

        {role === "superadmin" && (
          <>
            <div className="my-4 border-t border-slate-800" />
            <div className="px-4 py-2">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Superadmin Only</p>
            </div>
            {superadminNavItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive(item.path)
                    ? "bg-red-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <item.icon className="size-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-all"
        >
          <LogOut className="size-5" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}

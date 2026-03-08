import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminLayout({ adminUser, onLogout, children }) {
  return (
    <div className="flex h-screen bg-slate-950">

      {/* Sidebar */}
      <AdminSidebar
        role={adminUser?.role}
        onLogout={onLogout}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        <AdminTopbar
          email={adminUser?.email}
          role={adminUser?.role}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

      </div>
    </div>
  );
}

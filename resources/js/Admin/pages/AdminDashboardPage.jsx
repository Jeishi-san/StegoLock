import AdminLayout from '@/Admin/AdminLayout';
import { AdminDashboard } from '@/Admin/components/AdminDashboard';

export default function AdminDashboardPage({ adminUser, onLogout }) {
  return (
    <AdminLayout adminUser={adminUser} onLogout={onLogout}>
      <AdminDashboard />
    </AdminLayout>
  );
}

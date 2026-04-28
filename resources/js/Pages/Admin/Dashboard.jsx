import AdminLayout from '@/Layouts/Admin/AdminLayout';
import AdminDashboard from '@/Components/Admin/AdminDashboard';
import { Head } from '@inertiajs/react';

export default function Dashboard() {
    return (
        <AdminLayout>
            <Head title="Admin Dashboard" />
            <AdminDashboard />
        </AdminLayout>
    );
}

import AdminLayout from '@/Layouts/Admin/AdminLayout';
import { Head } from '@inertiajs/react';
import { Database, CheckCircle, AlertTriangle, AlertOctagon, RefreshCw, Eye } from 'lucide-react';
import { useState } from 'react';

export default function SystemMonitoring() {
    const [carriers] = useState([
        { id: 'FRG-001A', document: 'Project_Alpha.pdf', status: 'verified', integrity: 98, size: '2.4 MB', lastVerified: '10 mins ago' },
        { id: 'FRG-002B', document: 'Financial_Report.xlsx', status: 'verified', integrity: 100, size: '1.2 MB', lastVerified: '1 hour ago' },
        { id: 'FRG-003C', document: 'User_Database.sql', status: 'warning', integrity: 85, size: '45.0 MB', lastVerified: '2 hours ago' },
        { id: 'FRG-004D', document: 'Secret_Keys.txt', status: 'verified', integrity: 99, size: '0.1 MB', lastVerified: '5 mins ago' },
        { id: 'FRG-005E', document: 'Broken_Data.zip', status: 'critical', integrity: 42, size: '12.5 MB', lastVerified: 'Yesterday' },
    ]);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'verified':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-green-600/30 bg-green-600/20 px-2 py-1 text-xs font-medium text-green-400">
                        <CheckCircle className="size-3" /> Verified
                    </span>
                );
            case 'warning':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-yellow-600/30 bg-yellow-600/20 px-2 py-1 text-xs font-medium text-yellow-400">
                        <AlertTriangle className="size-3" /> Warning
                    </span>
                );
            case 'critical':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-red-600/30 bg-red-600/20 px-2 py-1 text-xs font-medium text-red-400">
                        <AlertOctagon className="size-3" /> Critical
                    </span>
                );
            default:
                return null;
        }
    };

    const getIntegrityBar = (integrity) => {
        const color = integrity >= 90 ? 'bg-green-500' : integrity >= 50 ? 'bg-yellow-500' : 'bg-red-500';
        return (
            <div className="flex items-center gap-3">
                <div className="h-2 w-24 rounded-full bg-slate-700">
                    <div className={`h-2 rounded-full ${color}`} style={{ width: `${integrity}%` }} />
                </div>
                <span className="text-xs text-slate-400 font-mono">{integrity}%</span>
            </div>
        );
    };

    return (
        <AdminLayout>
            <Head title="System Monitoring" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">System Monitoring</h1>
                    <p className="mt-1 text-sm text-slate-400">Monitor encrypted document fragments and system integrity (Static View)</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: 'Total Fragments', value: '4,281', icon: Database, color: 'blue' },
                        { label: 'Verified', value: '4,150', icon: CheckCircle, color: 'green' },
                        { label: 'Warning', value: '128', icon: AlertTriangle, color: 'yellow' },
                        { label: 'Critical', value: '3', icon: AlertOctagon, color: 'red' },
                    ].map((stat) => {
                        const Icon = stat.icon;
                        const colorClass = stat.color === 'blue' ? 'bg-blue-600/20 text-blue-400' : 
                                         stat.color === 'green' ? 'bg-green-600/20 text-green-400' :
                                         stat.color === 'yellow' ? 'bg-yellow-600/20 text-yellow-400' :
                                         'bg-red-600/20 text-red-400';
                        return (
                            <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm text-slate-400">{stat.label}</p>
                                        <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
                                    </div>
                                    <div className={`rounded-lg p-3 ${colorClass}`}>
                                        <Icon className="size-6" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
                    <div className="grid grid-cols-12 gap-4 bg-slate-800/50 px-6 py-4">
                        <div className="col-span-2 text-xs font-semibold text-slate-400 uppercase">Fragment ID</div>
                        <div className="col-span-3 text-xs font-semibold text-slate-400 uppercase">Document</div>
                        <div className="col-span-2 text-xs font-semibold text-slate-400 uppercase">Status</div>
                        <div className="col-span-2 text-xs font-semibold text-slate-400 uppercase">Integrity</div>
                        <div className="col-span-1 text-xs font-semibold text-slate-400 uppercase">Size</div>
                        <div className="col-span-2 text-xs font-semibold text-slate-400 uppercase">Last Verified</div>
                    </div>

                    <div className="divide-y divide-slate-800">
                        {covers.map((cover) => (
                            <div key={cover.id} className="grid grid-cols-12 items-center gap-4 px-6 py-4 transition hover:bg-slate-800/30">
                                <div className="col-span-2">
                                    <span className="text-sm font-mono text-slate-300">{cover.id}</span>
                                </div>
                                <div className="col-span-3">
                                    <span className="text-sm text-white">{cover.document}</span>
                                </div>
                                <div className="col-span-2">{getStatusBadge(cover.status)}</div>
                                <div className="col-span-2">{getIntegrityBar(cover.integrity)}</div>
                                <div className="col-span-1">
                                    <span className="text-sm text-slate-400">{cover.size}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="text-xs text-slate-500">{cover.lastVerified}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

import { Sidebar } from "@/Components/Sidebar";
import AdminTopbar from './AdminTopbar';
import { usePage, router } from '@inertiajs/react';

export default function AdminLayout({ 
    children, 
    header,
    headerActions,
    totalStorage, 
    storageLimit, 
    hasProcessingDocs = false 
}) {
    const { auth } = usePage().props;

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-cyber-surface transition-colors overflow-hidden">
            {/* Unified Sidebar with Personal + Management sections */}
            <Sidebar
                totalStorage={totalStorage}
                storageLimit={storageLimit}
                hasProcessingDocs={hasProcessingDocs}
                onNewFolderClick={() => {
                    // Admins can also create folders if they are in personal view
                    router.visit(route('myDocuments'));
                }}
            />

            <div className="flex flex-col flex-1 h-screen overflow-hidden">
                {/* Updated AdminTopbar with standard layout */}
                <AdminTopbar 
                    header={header} 
                    headerActions={headerActions} 
                />
                
                <main className="flex-1 overflow-y-auto p-6 sm:p-8">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}



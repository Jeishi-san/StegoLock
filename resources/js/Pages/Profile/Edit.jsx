import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status, totalStorage, storageLimit }) {
    return (
        <AuthenticatedLayout
            totalStorage={totalStorage}
            storageLimit={storageLimit}
            header={
                <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white transition-colors">
                    Profile
                </h2>
            }
        >
            <Head title="Profile" />

            <div className="p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* Left Column */}
                        <div className="flex flex-col gap-8">
                            <div className="bg-white dark:bg-cyber-surface/50 p-8 shadow-sm rounded-[2.5rem] border border-slate-100 dark:border-cyber-border/50 backdrop-blur-xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-cyber-accent opacity-0 group-hover:opacity-100 transition-opacity shadow-glow-cyan" />
                                <UpdateProfileInformationForm
                                    mustVerifyEmail={mustVerifyEmail}
                                    status={status}
                                />
                            </div>
                            <div className="bg-white dark:bg-cyber-surface/50 p-8 shadow-sm rounded-[2.5rem] border border-slate-100 dark:border-cyber-border/50 backdrop-blur-xl relative overflow-hidden group hover:shadow-lg transition-all duration-300">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                                <DeleteUserForm />
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="flex flex-col gap-8 h-full">
                            <div className="bg-white dark:bg-cyber-surface/50 p-8 shadow-sm rounded-[2.5rem] border border-slate-100 dark:border-cyber-border/50 backdrop-blur-xl relative overflow-hidden group hover:shadow-lg transition-all duration-300 h-full">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                <UpdatePasswordForm />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

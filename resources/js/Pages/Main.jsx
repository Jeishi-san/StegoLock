import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Inertia } from '@inertiajs/inertia';
import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';

export default function Main() {

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    My Documents
                </h2>
            }
        >
            <Head title="My Documents" />


        </AuthenticatedLayout>
    );
}

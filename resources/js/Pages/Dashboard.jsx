import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Inertia } from '@inertiajs/inertia';
import { Head } from '@inertiajs/react';

export default function Dashboard() {

    const handleUpload = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        Inertia.post('/documents/upload', formData);
    };

    const handleGenerate = (e) => {
        e.preventDefault();

        Inertia.post('/covers/text/generate', { count: 30 });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            You're logged in!
                            <form onSubmit={handleUpload} encType="multipart/form-data">
                                <input type="file" name="file" required />
                                <button type="submit">Upload</button>
                            </form>
                        </div>
                        <div className="p-6 text-gray-900">
                            <form method="POST" action={`/documents/decrypt`}>
                                <input type="number" name="document_id" placeholder="Document ID" required />
                                <button type="submit">Decrypt</button>
                            </form>
                        </div>
                        <div className="p-6 text-gray-900">
                            <form onSubmit={handleGenerate} encType="multipart/form-data">
                                <button type="submit">Generate Text</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

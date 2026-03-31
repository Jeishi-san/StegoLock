import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Inertia } from '@inertiajs/inertia';
import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';

export default function Dashboard() {

    const form = useForm({
        file: null,
    });

    const handleUpload = () => {
        form.post('/documents/upload', {
            onSuccess: (page) => {
                console.log('Success:', page.props);
            },
            onError: (errors) => {
                console.log('Validation errors:', errors);
            },
            onFinish: () => {
                console.log('Request finished');
            },
        });
    };

    const unlockDoc = useForm({
        id: '',
    });

    const handleUnlock = () => {
        unlockDoc.post('/documents/unlock', {
            onSuccess: (page) => {
                console.log('Success:', page.props);
            },
            onError: (errors) => {
                console.log('Validation errors:', errors);
            },
            onFinish: () => {
                console.log('Request finished');
            },
        });
    };

    const handleDownload = (path) => {
        window.location.href = `/documents/download?path=${encodeURIComponent(path)}`;
    };



    const handleGenerate = (e) => {
        e.preventDefault();

        Inertia.post('/covers/text/generate', { count: 8 });
    };

    const handleExtract = (e) => {
        e.preventDefault();
        //const formData = new FormData(e.target);
        //Inertia.post('/documents/unlock', formData);
        Inertia.post('/documents/unlock');
    };

    const handleScanCover = (e) => {
        e.preventDefault();
        Inertia.post('/covers/scan');
    };

    const handleMap = (e) => {
        e.preventDefault();
        Inertia.post('/covers/scan');
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

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-6">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            {/* <form onSubmit={handleUpload} encType="multipart/form-data">
                                <input type="file" name="file" required />
                                <button type="submit">Upload</button>
                            </form> */}
                            <input type="file" onChange={(e) => form.setData('file', e.target.files[0])} />
                            <button onClick={handleUpload}>Upload</button>
                        </div>
                        <div className="p-6 text-gray-900">
                            <input
                                type="number"
                                value={unlockDoc.data.id}
                                onChange={(e) => unlockDoc.setData('id', e.target.value)}
                            />
                            <button onClick={handleUnlock}>Unlock Document</button>
                        </div>
                        <div className="p-6 text-gray-900">
                            <button onClick={handleDownload}>Download Document</button>
                        </div>
                        {/* <div className="p-6 text-gray-900">
                            <form onSubmit={handleGenerate} encType="multipart/form-data">
                                <button type="submit">Generate Text</button>
                            </form>
                        </div>
                        <div className="p-6 text-gray-900">
                            <form onSubmit={handleExtract} encType="multipart/form-data"> */}
                                {/* <input type="number" name="documentid" placeholder="documentid" required /> */}
                                {/* <button type="submit">Extract</button>
                            </form>
                        </div>
                        <div className="p-6 text-gray-900">
                            <form onSubmit={handleScanCover} encType="multipart/form-data">
                                <button type="submit">ScanCover</button>
                            </form>
                        </div>
                        <div className="p-6 text-gray-900">
                            <form onSubmit={handleMap} encType="multipart/form-data">
                                <button type="submit">Map</button>
                            </form>
                        </div> */}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

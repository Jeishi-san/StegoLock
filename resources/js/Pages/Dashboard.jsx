import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Inertia } from '@inertiajs/inertia';
import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';

export default function Dashboard() {

    // const handleUpload = (e) => {
    //     e.preventDefault();
    //     const formData = new FormData(e.target);
    //     console.log("UPLOAD TRIGGERED");
    //     Inertia.post('/documents/upload', formData);
    //     console.log("UPLOAD TRIGGERED2");
    // };

    const form = useForm({
        file: null,
    });

    const handleUpload = () => {
        form.post('/documents/upload');
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

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
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
                            <form onSubmit={handleGenerate} encType="multipart/form-data">
                                <button type="submit">Generate Text</button>
                            </form>
                        </div>
                        <div className="p-6 text-gray-900">
                            <form onSubmit={handleExtract} encType="multipart/form-data">
                                {/* <input type="number" name="documentid" placeholder="documentid" required /> */}
                                <button type="submit">Extract</button>
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
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

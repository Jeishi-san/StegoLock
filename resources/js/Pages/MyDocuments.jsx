import { Shield, FileText, Star, MoreVertical } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatBytes, formatDate } from '@/Utils/fileUtils';
import { Inertia } from '@inertiajs/inertia';
import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';

export default function MyDocuments({ documents }) {

    //console.log('Hello:', documents);

    const getFileColor = (type) => {
        switch (type) {
            case 'pdf':
                return 'text-red-500 bg-red-50';
            case 'doc':
            case 'docx':
                return 'text-blue-500 bg-blue-50';
            case 'txt':
                return 'text-gray-600 bg-gray-50';
            default:
                return 'Unknown File Type';
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    My Documents
                </h2>
            }
        >
            <Head title="My Documents"/>

            {/* GRID VIEW (DEFAULT) */}

                {documents.length > 0 ? (
                    documents.map(doc => {
                        return (
                            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                                <div
                                    key={doc.document_id}
                                    className="group relative p-4 bg-white rounded-lg shadow hover:shadow-lg hover:ring-1 hover:ring-purple-600 transition"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition space-x-1">
                                        {/* Star */}
                                        <button>
                                            <Star className="size-8 text-gray-400 hover:bg-gray-100 rounded-md p-1.5" />
                                        </button>
                                        {/* Vertical 3-Dot Menu */}
                                        <button>
                                            <MoreVertical className="size-8 text-gray-400 hover:bg-gray-100 rounded-md p-1.5" />
                                        </button>
                                    </div>

                                    <FileText className={"size-14 rounded-xl p-2 " + getFileColor(doc.file_type)} />

                                    <h3 className="text-md font-semibold text-gray-800 my-3">
                                        {doc.filename}
                                    </h3>

                                    <div className='flex justify-between'>
                                        <p className="text-sm text-gray-500">
                                            {formatBytes(doc.encrypted_size)}
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            {formatDate(new Date(doc.created_at))}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="flex-1 flex items-center justify-center p-8">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shield className="size-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Found</h3>
                            <p className="text-gray-500">Upload files to get started</p>
                        </div>
                    </div>
                )}

        </AuthenticatedLayout>
    );
}

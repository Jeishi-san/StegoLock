import { HardDrive, Trash2, X, FileText, Image, Film, Music, Archive } from 'lucide-react';

export function ManageStorage({ 
  totalStorage, 
  storageLimit, 
  documents,
  onClose,
  onDeleteDocument
}) {
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const storagePercentage = (totalStorage / storageLimit) * 100;

  // Categorize files by type
  const categorizeFiles = () => {
    const categories = {
      documents: { size: 0, count: 0, icon: FileText, color: 'blue' },
      images: { size: 0, count: 0, icon: Image, color: 'green' },
      videos: { size: 0, count: 0, icon: Film, color: 'purple' },
      audio: { size: 0, count: 0, icon: Music, color: 'pink' },
      archives: { size: 0, count: 0, icon: Archive, color: 'yellow' },
      other: { size: 0, count: 0, icon: FileText, color: 'gray' }
    };

    documents.forEach(doc => {
      if (doc.type.includes('pdf') || doc.type.includes('document') || doc.type.includes('text')) {
        categories.documents.size += doc.size;
        categories.documents.count++;
      } else if (doc.type.includes('image')) {
        categories.images.size += doc.size;
        categories.images.count++;
      } else if (doc.type.includes('video')) {
        categories.videos.size += doc.size;
        categories.videos.count++;
      } else if (doc.type.includes('audio')) {
        categories.audio.size += doc.size;
        categories.audio.count++;
      } else if (doc.type.includes('zip') || doc.type.includes('rar') || doc.type.includes('archive')) {
        categories.archives.size += doc.size;
        categories.archives.count++;
      } else {
        categories.other.size += doc.size;
        categories.other.count++;
      }
    });

    return categories;
  };

  const categories = categorizeFiles();

  // Sort documents by size (largest first)
  const sortedDocuments = [...documents].sort((a, b) => b.size - a.size);
  const largestFiles = sortedDocuments.slice(0, 10);

  // Calculate storage by folder
  const storageByFolder = documents.reduce((acc, doc) => {
    if (!acc[doc.folder]) {
      acc[doc.folder] = 0;
    }
    acc[doc.folder] += doc.size;
    return acc;
  }, {});

  const folderData = Object.entries(storageByFolder)
    .map(([folder, size]) => ({ folder, size }))
    .sort((a, b) => b.size - a.size);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HardDrive className="size-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Manage Storage</h2>
              <p className="text-sm text-gray-500">Monitor and optimize your storage usage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="size-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Storage Overview */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Storage Overview</h3>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Storage Used</p>
                  <p className="text-3xl font-bold text-gray-900">{formatBytes(totalStorage)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 mb-1">Available</p>
                  <p className="text-2xl font-semibold text-gray-700">{formatBytes(storageLimit - totalStorage)}</p>
                </div>
              </div>
              <div className="w-full bg-white rounded-full h-3 shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-600 to-blue-500 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
                <span>{storagePercentage.toFixed(1)}% used</span>
                <span>{formatBytes(storageLimit)} total</span>
              </div>
            </div>
          </div>

          {/* Storage by Category */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Storage by Category</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(categories).map(([key, data]) => {
                const Icon = data.icon;
                const colorClasses = {
                  blue: 'bg-blue-100 text-blue-600',
                  green: 'bg-green-100 text-green-600',
                  purple: 'bg-purple-100 text-purple-600',
                  pink: 'bg-pink-100 text-pink-600',
                  yellow: 'bg-yellow-100 text-yellow-600',
                  gray: 'bg-gray-100 text-gray-600'
                };
                
                if (data.count === 0) return null;

                return (
                  <div key={key} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className={`p-2 rounded-lg ${colorClasses[data.color]}`}>
                        <Icon className="size-5" />
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">{formatBytes(data.size)}</p>
                        <p className="text-xs text-gray-500">{data.count} files</p>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mt-3 capitalize">{key}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Storage by Folder */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Storage by Folder</h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {folderData.map(({ folder, size }) => {
                const percentage = (size / totalStorage) * 100;
                return (
                  <div key={folder} className="p-4 border-b border-gray-200 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{folder}</span>
                      <span className="text-sm text-gray-600">{formatBytes(size)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Largest Files */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Largest Files</h3>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">File Name</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Folder</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Size</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {largestFiles.map(doc => (
                      <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{doc.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{doc.folder}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{formatBytes(doc.size)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete "${doc.name}"?`)) {
                                onDeleteDocument(doc.id);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded transition-colors"
                          >
                            <Trash2 className="size-4" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

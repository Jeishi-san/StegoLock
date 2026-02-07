import { Folder, Plus, FolderOpen } from 'lucide-react';

export function FolderGrid({ 
  folders, 
  viewMode, 
  onSelectFolder,
  onNewFolderClick 
}) {
  
  const FolderCard = ({ folderName }) => {
    return (
      <div 
        onClick={() => onSelectFolder(folderName)}
        className="group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer z-0"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50">
            <Folder className="size-8 text-indigo-600" />
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{folderName}</h3>
          <p className="text-sm text-gray-500">User folder</p>
        </div>
      </div>
    );
  };

  if (folders.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="size-10 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Folders Yet</h3>
          <p className="text-gray-500 mb-6">Create folders to organize your documents better</p>
          <button
            onClick={onNewFolderClick}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-indigo-500/30"
          >
            <Plus className="size-5" />
            Create Your First Folder
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {folders.map(folder => <FolderCard key={folder} folderName={folder} />)}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden relative z-10">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {folders.map(folder => (
                <tr 
                  key={folder} 
                  onClick={() => onSelectFolder(folder)}
                  className="hover:bg-gray-50/50 transition-colors group cursor-pointer relative z-0"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 flex-shrink-0">
                        <Folder className="size-5 text-indigo-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">{folder}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">User folder</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

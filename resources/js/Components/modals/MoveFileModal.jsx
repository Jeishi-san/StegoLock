import { X, FolderOpen, FolderPlus } from 'lucide-react';
import { useState } from 'react';

export function MoveFileModal({ 
  document, 
  onMove, 
  onClose, 
  customFolders = [],
  onCreateFolder 
}) {
  const [selectedFolder, setSelectedFolder] = useState(document.folder);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedFolder && selectedFolder !== document.folder) {
      onMove(selectedFolder);
    } else {
      onClose();
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      setError('Folder name cannot be empty');
      return;
    }
    
    if (customFolders.includes(newFolderName.trim())) {
      setError('A folder with this name already exists');
      return;
    }
    
    onCreateFolder?.(newFolderName.trim());
    setSelectedFolder(newFolderName.trim());
    setIsCreatingFolder(false);
    setNewFolderName('');
    setError('');
  };

  const handleCancelCreateFolder = () => {
    setIsCreatingFolder(false);
    setNewFolderName('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Move File</h2>
            <p className="text-sm text-gray-600 mt-1 truncate">{document.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="size-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Destination Folder
            </label>
            
            {/* Create New Folder Button */}
            {!isCreatingFolder && (
              <button
                type="button"
                onClick={() => setIsCreatingFolder(true)}
                className="w-full flex items-center gap-3 px-4 py-3 mb-3 rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 transition-all text-left"
              >
                <FolderPlus className="size-5 text-indigo-600" />
                <span className="font-medium text-indigo-900">Create New Folder</span>
              </button>
            )}
            
            {/* Create Folder Form */}
            {isCreatingFolder && (
              <div className="mb-3 p-4 rounded-lg border-2 border-indigo-300 bg-indigo-50/50">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => {
                    setNewFolderName(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter folder name"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                  autoFocus
                />
                {error && (
                  <p className="text-xs text-red-600 mb-2">{error}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreateFolder}
                    className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelCreateFolder}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {/* User Created Folders List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {customFolders.length === 0 && !isCreatingFolder && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No folders yet. Create your first folder above.
                </p>
              )}
              {customFolders.map((folder) => {
                const isSelected = folder === selectedFolder;
                const isCurrent = folder === document.folder;
                
                return (
                  <button
                    key={folder}
                    type="button"
                    onClick={() => setSelectedFolder(folder)}
                    disabled={isCurrent}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50'
                        : isCurrent
                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                    }`}
                  >
                    <FolderOpen className={`size-5 ${isSelected ? 'text-indigo-600' : 'text-gray-500'}`} />
                    <span className={`font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                      {folder}
                    </span>
                    {isCurrent && (
                      <span className="ml-auto text-xs text-gray-500">(Current)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFolder || selectedFolder === document.folder}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Move File
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

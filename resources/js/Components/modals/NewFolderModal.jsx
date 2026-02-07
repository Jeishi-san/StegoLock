import { X, FolderPlus } from 'lucide-react';
import { useState } from 'react';

export function NewFolderModal({ existingFolders, onCreateFolder, onClose }) {
  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmedName = folderName.trim();
    
    // Validation
    if (!trimmedName) {
      setError('Folder name cannot be empty');
      return;
    }
    
    if (existingFolders.includes(trimmedName)) {
      setError('A folder with this name already exists');
      return;
    }
    
    // Check for reserved names
    const reservedNames = ['All Documents', 'Starred', 'Secured Files', 'Original Files'];
    if (reservedNames.includes(trimmedName)) {
      setError('This folder name is reserved');
      return;
    }
    
    onCreateFolder(trimmedName);
    onClose();
  };

  const handleNameChange = (e) => {
    setFolderName(e.target.value);
    setError(''); // Clear error when user types
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg">
              <FolderPlus className="size-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">New Folder</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="size-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label htmlFor="foldername" className="block text-sm font-medium text-gray-700 mb-2">
              Folder Name
            </label>
            <input
              type="text"
              id="foldername"
              value={folderName}
              onChange={handleNameChange}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter folder name"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
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
              disabled={!folderName.trim()}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { X } from 'lucide-react';
import { useState } from 'react';

export function RenameModal({ document, onRename, onClose }) {
  // Extract file extension from original name
  const getFileExtension = (filename) => {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.slice(lastDotIndex) : '';
  };

  // Get name without extension
  const getNameWithoutExtension = (filename) => {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename;
  };

  const originalExtension = getFileExtension(document.name);
  const originalNameWithoutExt = getNameWithoutExtension(document.name);
  
  const [nameWithoutExt, setNameWithoutExt] = useState(originalNameWithoutExt);
  const [currentExtension, setCurrentExtension] = useState(originalExtension);

  // Full name with extension for validation
  const fullName = nameWithoutExt + currentExtension;

  // Check if the extension is valid (matches original)
  const isExtensionValid = currentExtension === originalExtension;

  const handleInputChange = (value) => {
    // Check if user is trying to add/modify extension
    const lastDotIndex = value.lastIndexOf('.');
    
    if (lastDotIndex > 0) {
      // User has a dot in the input - extract both parts
      const namepart = value.slice(0, lastDotIndex);
      const extpart = value.slice(lastDotIndex);
      setNameWithoutExt(namepart);
      setCurrentExtension(extpart);
    } else {
      // No dot or dot at start - treat entire value as name
      setNameWithoutExt(value);
      setCurrentExtension(originalExtension);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedName = nameWithoutExt.trim();
    const newFullName = trimmedName + originalExtension;
    
    if (trimmedName && isExtensionValid && newFullName !== document.name) {
      onRename(newFullName);
    } else {
      onClose();
    }
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
          <h2 className="text-xl font-semibold text-gray-900">Rename File</h2>
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
            <label htmlFor="filename" className="block text-sm font-medium text-gray-700 mb-2">
              File Name
            </label>
            <div className="relative">
              <input
                type="text"
                id="filename"
                value={fullName}
                onChange={(e) => handleInputChange(e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                  !isExtensionValid ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={`Enter new file name${originalExtension}`}
                autoFocus
              />
            </div>
            {!isExtensionValid && (
              <p className="mt-2 text-sm text-red-600">
                File extension must be "{originalExtension}"
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              The file extension "{originalExtension}" cannot be changed.
            </p>
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
              disabled={!nameWithoutExt.trim() || !isExtensionValid || fullName === document.name}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

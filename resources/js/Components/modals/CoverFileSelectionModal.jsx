import { useState } from 'react';
import { X, Image, FileText, Music, Loader2 } from 'lucide-react';

export function CoverFileSelectionModal({
  documentName,
  onSecure,
  onClose,
  isSecuring = false,
}) {
  const [selectedCoverType, setSelectedCoverType] = useState('');

  const coverTypes = [
    {
      id: 'png',
      label: 'PNG Image',
      icon: Image,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      hoverBg: 'hover:bg-purple-50',
      borderColor: 'border-purple-500',
    },
    {
      id: 'jpg',
      label: 'JPG/JPEG Image',
      icon: Image,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      hoverBg: 'hover:bg-blue-50',
      borderColor: 'border-blue-500',
    },
    {
      id: 'txt',
      label: 'Text File',
      icon: FileText,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      hoverBg: 'hover:bg-gray-50',
      borderColor: 'border-gray-500',
    },
    {
      id: 'mp3',
      label: 'MP3 Audio',
      icon: Music,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      hoverBg: 'hover:bg-green-50',
      borderColor: 'border-green-500',
    },
    {
      id: 'wav',
      label: 'WAV Audio',
      icon: Music,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      hoverBg: 'hover:bg-teal-50',
      borderColor: 'border-teal-500',
    },
  ];

  const handleSecure = () => {
    if (selectedCoverType) {
      onSecure(selectedCoverType);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isSecuring ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Select Cover File Format</h2>
          {!isSecuring && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="size-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-1">Document to secure:</p>
            <p className="font-medium text-gray-900 truncate">{documentName}</p>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Select a cover file format to embed your encrypted document:
          </p>

          {/* Cover Type Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {coverTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedCoverType === type.id;
              
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedCoverType(type.id)}
                  disabled={isSecuring}
                  className={`flex flex-col items-center gap-3 p-4 border-2 rounded-xl transition-all ${
                    isSelected
                      ? `${type.borderColor} bg-gradient-to-br from-indigo-50 to-purple-50`
                      : `border-gray-300 ${type.hoverBg}`
                  } ${isSecuring ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`p-3 ${type.bgColor} rounded-lg`}>
                    <Icon className={`size-6 ${type.color}`} />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-900 text-sm">{type.label}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {isSecuring && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3">
                <Loader2 className="size-5 text-indigo-600 animate-spin" />
                <div>
                  <p className="font-medium text-indigo-900">Securing your document...</p>
                  <p className="text-sm text-indigo-700">
                    Encrypting and embedding into {coverTypes.find(t => t.id === selectedCoverType)?.label}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isSecuring}
            className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSecure}
            disabled={!selectedCoverType || isSecuring}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSecuring ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Securing...
              </>
            ) : (
              'Save and Secure'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

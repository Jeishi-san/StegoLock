import { X, Upload, Shield } from 'lucide-react';

export function UploadOptionsModal({
  fileName,
  onUploadOnly,
  onSecureNow,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Choose Upload Option</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="size-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">Selected file:</p>
            <p className="font-medium text-gray-900 truncate">{fileName}</p>
          </div>

          <div className="space-y-3">
            {/* Upload File Button */}
            <button
              onClick={onUploadOnly}
              className="w-full flex items-center gap-4 p-4 border-2 border-gray-300 rounded-xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
            >
              <div className="p-3 bg-gray-100 group-hover:bg-indigo-100 rounded-lg transition-colors">
                <Upload className="size-6 text-gray-600 group-hover:text-indigo-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Upload File</div>
                <div className="text-sm text-gray-600">
                  Store file as original without securing
                </div>
              </div>
            </button>

            {/* Secure Now Button */}
            <button
              onClick={onSecureNow}
              className="w-full flex items-center gap-4 p-4 border-2 border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl hover:from-indigo-100 hover:to-purple-100 transition-all group"
            >
              <div className="p-3 bg-indigo-100 group-hover:bg-indigo-200 rounded-lg transition-colors">
                <Shield className="size-6 text-indigo-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Secure Now</div>
                <div className="text-sm text-gray-600">
                  Encrypt and embed into a cover file immediately
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

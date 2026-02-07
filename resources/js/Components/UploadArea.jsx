import { useState, useRef } from 'react';
import { Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { UploadOptionsModal } from '@/Components/modals/UploadOptionsModal';
import { CoverFileSelectionModal } from '@/Components/modals/CoverFileSelectionModal';

export function UploadArea({ onUpload, onCancel }) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [rejectedFiles, setRejectedFiles] = useState([]);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [showCoverSelection, setShowCoverSelection] = useState(false);
  const [isSecuring, setIsSecuring] = useState(false);
  const fileInputRef = useRef(null);

  const ACCEPTED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  const ACCEPTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];

  const isValidFile = (file) => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return ACCEPTED_FILE_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(extension);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(isValidFile);
    const invalidFiles = files.filter(file => !isValidFile(file));
    setSelectedFiles(validFiles);
    setRejectedFiles(invalidFiles);
  };

  const handleFileSelect = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const validFiles = files.filter(isValidFile);
      const invalidFiles = files.filter(file => !isValidFile(file));
      setSelectedFiles(validFiles);
      setRejectedFiles(invalidFiles);

      // If valid files selected, show upload options modal
      if (validFiles.length > 0) {
        setShowUploadOptions(true);
      }
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const handleRemoveRejectedFile = (index) => {
    setRejectedFiles(rejectedFiles.filter((_, i) => i !== index));
  };

  const handleUploadOnly = () => {
    if (selectedFiles.length > 0) {
      setShowUploadOptions(false);
      onUpload(selectedFiles, false);
      setSelectedFiles([]);
    }
  };

  const handleSecureNow = () => {
    setShowUploadOptions(false);
    setShowCoverSelection(true);
  };

  const handleSecureWithCover = async (coverFileType) => {
    setIsSecuring(true);

    // Simulate backend processing (2-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 2500));

    setIsSecuring(false);
    setShowCoverSelection(false);

    if (selectedFiles.length > 0) {
      onUpload(selectedFiles, true, coverFileType);
      setSelectedFiles([]);
    }
  };

  const handleCloseCoverSelection = () => {
    if (!isSecuring) {
      setShowCoverSelection(false);
      // Go back to file selection
      setSelectedFiles([]);
    }
  };

  const handleCloseUploadOptions = () => {
    setShowUploadOptions(false);
    setSelectedFiles([]);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-8 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Upload Documents</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="size-5 text-gray-500" />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Upload className={`size-12 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>

            <div>
              <p className="text-lg font-medium text-gray-900 mb-1">
                Drop files here or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports .pdf, .doc/.docx, and .txt files only
              </p>
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Browse Files
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && !showUploadOptions && (
          <div className="mt-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200/50 p-6 shadow-inner">
            <h3 className="font-semibold text-gray-900 mb-4">
              Selected Files ({selectedFiles.length})
            </h3>
            <div className="space-y-3 mb-6">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-200/50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="size-5 text-blue-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatBytes(file.size)}</p>
                    </div>
                    <CheckCircle className="size-5 text-green-600 flex-shrink-0" />
                  </div>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="ml-3 p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUploadOptions(true)}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg shadow-indigo-500/30"
              >
                Continue with {selectedFiles.length} {selectedFiles.length === 1 ? 'File' : 'Files'}
              </button>
              <button
                onClick={onCancel}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {selectedFiles.length === 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={onCancel}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Rejected Files */}
        {rejectedFiles.length > 0 && (
          <div className="mt-6 bg-red-50 rounded-xl border border-red-200 p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="size-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 mb-1">
                  Invalid File Type
                </h3>
                <p className="text-sm text-red-700">
                  The following {rejectedFiles.length} {rejectedFiles.length === 1 ? 'file is' : 'files are'} not supported. Only .pdf, .doc/.docx, and .txt files are allowed.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {rejectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="size-5 text-red-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatBytes(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveRejectedFile(index)}
                    className="ml-3 p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Options Modal */}
      {showUploadOptions && selectedFiles.length > 0 && (
        <UploadOptionsModal
          fileName={selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} files`}
          onUploadOnly={handleUploadOnly}
          onSecureNow={handleSecureNow}
          onClose={handleCloseUploadOptions}
        />
      )}

      {/* Cover File Selection Modal */}
      {showCoverSelection && selectedFiles.length > 0 && (
        <CoverFileSelectionModal
          documentName={selectedFiles.length === 1 ? selectedFiles[0].name : `${selectedFiles.length} files`}
          onSecure={handleSecureWithCover}
          onClose={handleCloseCoverSelection}
          isSecuring={isSecuring}
        />
      )}
    </div>
  );
}

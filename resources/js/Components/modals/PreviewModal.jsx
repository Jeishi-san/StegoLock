import { X, Lock, Unlock, FileText, Download } from 'lucide-react';
import { formatBytes, formatDateTime } from '@/Utils/fileUtils';

export function PreviewModal({
  document: doc,
  onClose,
  onToggleEncryption,
}) {
  const getPreviewContent = () => {
    const previewData = {
      pdf: { icon: FileText, color: 'text-red-600', title: 'PDF Document', pages: 12, format: 'PDF 1.7' },
      word: { icon: FileText, color: 'text-blue-600', title: 'Word Document', pages: 8, format: 'DOCX' },
      text: { icon: FileText, color: 'text-gray-600', title: 'Text Document', lines: 150, format: 'Plain Text' },
    };

    const type = doc.type.includes('pdf') ? 'pdf' : doc.type.includes('word') || doc.type.includes('document') ? 'word' : 'text';
    const preview = previewData[type];
    const Icon = preview.icon;

    if (type === 'pdf') {
      return (
        <div className="flex-1 bg-gray-100 rounded-lg flex items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-md">
            <Icon className="size-20 mx-auto" style={{ color: preview.color }} />
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{preview.title}</h3>
              <p className="text-gray-600">
                This is a preview of your PDF document. The actual PDF viewer would display the full content here.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Pages:</span>
                <span className="font-medium">{preview.pages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Format:</span>
                <span className="font-medium">{preview.format}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Author:</span>
                <span className="font-medium">John Doe</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'word') {
      return (
        <div className="flex-1 bg-white rounded-lg overflow-auto p-8">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">{doc.name.replace(/\.[^/.]+$/, '')}</h1>
              <div className="h-px bg-gray-200"></div>
            </div>
            <div className="space-y-4 text-gray-700">
              <p className="leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <p className="leading-relaxed">
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </p>
              <h2 className="text-xl font-semibold text-gray-900 mt-6">Section Heading</h2>
              <p className="leading-relaxed">
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>First key point in the document</li>
                <li>Second important item</li>
                <li>Third essential detail</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    if (type === 'text') {
      return (
        <div className="flex-1 bg-gray-900 rounded-lg overflow-auto p-6">
          <pre className="text-gray-100 font-mono text-sm leading-relaxed">
{`# Meeting Notes - ${formatDateTime(doc.uploadDate).split(',')[0]}

Attendees:
- John Smith
- Jane Doe
- Mike Johnson
- Sarah Williams

Agenda:
1. Project status update
2. Q4 budget review
3. Team expansion plans
4. Action items from previous meeting

Discussion Points:
- Project is on track for delivery
- Budget allocation needs revision
- Hiring 2 new team members approved
- Customer feedback has been positive

Action Items:
[ ] Update project timeline (John)
[ ] Prepare budget proposal (Jane)
[ ] Create job postings (Mike)
[ ] Schedule client meeting (Sarah)

Next Meeting: ${formatDateTime(new Date(doc.uploadDate.getTime() + 7 * 24 * 60 * 60 * 1000)).split(',')[0]}`}
          </pre>
        </div>
      );
    }

    return (
      <div className="flex-1 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center space-y-3">
          <FileText className="size-16 text-gray-400 mx-auto" />
          <p className="text-gray-600">Preview not available for this file type</p>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-xl font-semibold text-gray-900 truncate mb-2">
              {doc.name}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{formatBytes(doc.size)}</span>
              <span>&bull;</span>
              <span>{formatDateTime(doc.uploadDate)}</span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                {doc.isEncrypted ? (
                  <>
                    <Lock className="size-3.5 text-green-600" />
                    <span className="text-green-600 font-medium">Secured</span>
                  </>
                ) : (
                  <>
                    <Unlock className="size-3.5 text-gray-600" />
                    <span className="text-gray-600 font-medium">Original</span>
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {onToggleEncryption && (
              <>
                <button
                  onClick={() => {
                    // Create a blob and download the file
                    const blob = new Blob([`Mock content for ${doc.name}`], { type: 'application/octet-stream' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = doc.name;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Download className="size-4" />
                  Download
                </button>
                <button
                  onClick={() => onToggleEncryption(doc.id, doc.type)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {doc.isEncrypted ? (
                    <>
                      <Unlock className="size-4" />
                      Retrieve
                    </>
                  ) : (
                    <>
                      <Lock className="size-4" />
                      Secure
                    </>
                  )}
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="size-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-6">
          {getPreviewContent()}
        </div>
      </div>
    </div>
  );
}

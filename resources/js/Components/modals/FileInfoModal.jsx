import { X, Info, Calendar, Lock, Unlock, User, Folder, Activity, Image } from 'lucide-react';
import { formatBytes, formatDateTime, getOwnerDisplay } from '@/Utils/fileUtils';

export function FileInfoModal({ document: doc, onClose, currentUserEmail = 'user@example.com' }) {
  const InfoItem = ({ icon: Icon, label, value, color = 'text-gray-600' }) => (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-gray-100 rounded-lg">
        <Icon className={`size-5 ${color}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className={`text-sm ${color}`}>{value}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Info className="size-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">File Information</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="size-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* File Name */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{doc.name}</h3>
            <p className="text-sm text-gray-500">{doc.type}</p>
          </div>

          {/* File Details */}
          <div className="space-y-4 mb-6">
            <InfoItem
              icon={Calendar}
              label="Date Added"
              value={formatDateTime(doc.uploadDate)}
            />

            <InfoItem
              icon={doc.isEncrypted ? Lock : Unlock}
              label="Status"
              value={doc.isEncrypted ? 'Secured' : 'Original'}
              color={doc.isEncrypted ? 'text-green-600' : 'text-gray-600'}
            />

            <InfoItem
              icon={User}
              label="Owner"
              value={getOwnerDisplay(doc.owner, currentUserEmail)}
            />

            <InfoItem
              icon={Folder}
              label="Folder"
              value={doc.folder || 'All Documents'}
            />

            <InfoItem
              icon={Info}
              label="Size"
              value={formatBytes(doc.size)}
            />

            {doc.coverFileType && (
              <InfoItem
                icon={Image}
                label="Cover File Format"
                value={doc.coverFileType.toUpperCase()}
                color="text-indigo-600"
              />
            )}
          </div>

          {/* Activity History */}
          {doc.activities && doc.activities.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="size-5 text-gray-600" />
                <h4 className="font-medium text-gray-900">Activity History</h4>
              </div>
              <div className="space-y-3">
                {doc.activities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">
                          by {activity.user === 'me' ? currentUserEmail : activity.user}
                        </p>
                        <span className="text-xs text-gray-400">&bull;</span>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shared With */}
          {doc.sharedWith && doc.sharedWith.length > 0 && (
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h4 className="font-medium text-gray-900 mb-3">Shared With</h4>
              <div className="space-y-2">
                {doc.sharedWith.map((email, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <User className="size-4 text-gray-500" />
                    <p className="text-sm text-gray-700">{email === 'me' ? currentUserEmail : email}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

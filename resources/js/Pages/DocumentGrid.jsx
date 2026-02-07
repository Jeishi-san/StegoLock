import { Star, MoreVertical, Shield, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatBytes, formatDate, getFileIcon, getFileColor, getOwnerDisplay } from '@/Utils/fileUtils';
import { FileActionsMenu } from '@/Components/FileActionsMenu';
import { PreviewModal } from '@/Components/modals/PreviewModal';
import { RenameModal } from '@/Components/modals/RenameModal';
import { MoveFileModal } from '@/Components/modals/MoveFileModal';
import { ShareFileModal } from '@/Components/modals/ShareFileModal';
import { FileInfoModal } from '@/Components/modals/FileInfoModal';
import { DeleteConfirmModal } from '@/Components/modals/DeleteConfirmModal';
import { CoverFileSelectionModal } from '@/Components/modals/CoverFileSelectionModal';

export function DocumentGrid({
  documents,
  viewMode,
  onDelete,
  onToggleStar,
  onToggleEncryption,
  onRename,
  onMoveFile,
  currentUserEmail = 'user@example.com',
  customFolders = [],
  onCreateFolder
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [activeModal, setActiveModal] = useState({ type: null, docId: null });
  const [isSecuring, setIsSecuring] = useState(false);

  const activeDoc = activeModal.docId ? documents.find(d => d.id === activeModal.docId) || null : null;

  const handleAction = async (action, docId) => {
    if (action === 'encrypt') {
      // Show cover file selection modal instead of directly encrypting
      openModal('coverSelection', docId);
      return;
    }

    setProcessingId(docId);
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (action === 'download') {
      toast.success('File downloaded successfully');
    } else if (action === 'decrypt') {
      onToggleEncryption?.(docId);
      toast.success('File retrieved successfully');
    }
    setProcessingId(null);
  };

  const handleSecureWithCover = async (coverFileType) => {
    if (!activeDoc) return;

    setIsSecuring(true);

    // Simulate backend processing (2-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 2500));

    setIsSecuring(false);
    onToggleEncryption?.(activeDoc.id, coverFileType);
    closeModal();

    toast.success(`File secured successfully with ${coverFileType.toUpperCase()} cover`);
  };

  const openModal = (type, docId) => setActiveModal({ type, docId });
  const closeModal = () => setActiveModal({ type: null, docId: null });

  const DocumentCard = ({ doc }) => {
    const Icon = getFileIcon(doc.type);
    const colorClass = getFileColor(doc.type);
    const isProcessing = processingId === doc.id;
    const isMenuOpen = openMenuId === doc.id;

    return (
      <div className={`group relative bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 hover:shadow-xl hover:border-indigo-200 transition-all ${isMenuOpen ? 'z-1' : 'z-0'}`}>
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${colorClass}`}>
            <Icon className="size-8" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleStar(doc.id); }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
              <Star className={`size-5 ${doc.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
            </button>
            <div className="relative">
              <button
                id={`menu-btn-${doc.id}`}
                onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === doc.id ? null : doc.id); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="size-5 text-gray-600" />
              </button>
              {openMenuId === doc.id && (
                <FileActionsMenu
                  doc={doc}
                  buttonId={`menu-btn-${doc.id}`}
                  onClose={() => setOpenMenuId(null)}
                  onToggleEncryption={() => handleAction(doc.isEncrypted ? 'decrypt' : 'encrypt', doc.id)}
                  onPreview={() => openModal('preview', doc.id)}
                  onDownload={() => handleAction('download', doc.id)}
                  onRename={() => openModal('rename', doc.id)}
                  onMoveFile={() => openModal('move', doc.id)}
                  onShare={() => openModal('share', doc.id)}
                  onInfo={() => openModal('info', doc.id)}
                  onDelete={() => openModal('delete', doc.id)}
                  isProcessing={isProcessing}
                />
              )}
            </div>
          </div>
        </div>

        <div onClick={() => openModal('preview', doc.id)} className="cursor-pointer">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{doc.name}</h3>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>{formatBytes(doc.size)}</span>
            <span>{formatDate(doc.uploadDate)}</span>
          </div>
          {doc.isEncrypted && (
            <div className="flex items-center gap-2 mt-3 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
              <Shield className="size-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">Secured</span>
            </div>
          )}
        </div>

        {isProcessing && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
            <Loader2 className="size-8 text-indigo-600 animate-spin" />
          </div>
        )}
      </div>
    );
  };

  if (documents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="size-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Documents Found</h3>
          <p className="text-gray-500">Upload files to get started</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
          {documents.map(doc => <DocumentCard key={doc.id} doc={doc} />)}
        </div>
      ) : (
        <div className="p-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 overflow-hidden relative z-10">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Owner</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Size</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Modified</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {documents.map(doc => {
                  const Icon = getFileIcon(doc.type);
                  const colorClass = getFileColor(doc.type);
                  const isProcessing = processingId === doc.id;
                  const isMenuOpen = openMenuId === doc.id;

                  return (
                    <tr key={doc.id} className={`hover:bg-gray-50/50 transition-colors group relative ${isMenuOpen ? 'z-[50]' : 'z-0'}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => openModal('preview', doc.id)}>
                          <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                            <Icon className="size-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                            <p className="text-sm text-gray-500">{doc.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{getOwnerDisplay(doc.owner, currentUserEmail)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatBytes(doc.size)}</td>
                      <td className="px-6 py-4">
                        {doc.isEncrypted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-200">
                            <Shield className="size-3" /> Secured
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">Original</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{formatDate(doc.uploadDate)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); onToggleStar(doc.id); }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <Star className={`size-4 ${doc.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                          </button>
                          <div className="relative">
                            <button
                              id={`menu-btn-list-${doc.id}`}
                              onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === doc.id ? null : doc.id); }}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <MoreVertical className="size-4 text-gray-600" />
                            </button>
                            {openMenuId === doc.id && (
                              <FileActionsMenu
                                doc={doc}
                                buttonId={`menu-btn-list-${doc.id}`}
                                onClose={() => setOpenMenuId(null)}
                                onToggleEncryption={() => handleAction(doc.isEncrypted ? 'decrypt' : 'encrypt', doc.id)}
                                onPreview={() => openModal('preview', doc.id)}
                                onDownload={() => handleAction('download', doc.id)}
                                onRename={() => openModal('rename', doc.id)}
                                onMoveFile={() => openModal('move', doc.id)}
                                onShare={() => openModal('share', doc.id)}
                                onInfo={() => openModal('info', doc.id)}
                                onDelete={() => openModal('delete', doc.id)}
                                isProcessing={isProcessing}
                              />
                            )}
                          </div>
                          {isProcessing && <Loader2 className="size-4 text-indigo-600 animate-spin ml-2" />}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {activeModal.type === 'preview' && activeDoc && (
        <PreviewModal
          document={activeDoc}
          onClose={closeModal}
          onToggleEncryption={(id, coverFileType) => {
            const doc = documents.find(d => d.id === id);
            if (doc && !doc.isEncrypted) {
              // If securing, show cover selection modal
              openModal('coverSelection', id);
            } else {
              // If retrieving, just toggle
              onToggleEncryption?.(id);
            }
          }}
        />
      )}
      {activeModal.type === 'rename' && activeDoc && (
        <RenameModal document={activeDoc} onClose={closeModal} onRename={(newName) => { onRename?.(activeDoc.id, newName); closeModal(); }} />
      )}
      {activeModal.type === 'move' && activeDoc && (
        <MoveFileModal
          document={activeDoc}
          onClose={closeModal}
          onMove={(folder) => { onMoveFile?.(activeDoc.id, folder); closeModal(); }}
          customFolders={customFolders}
          onCreateFolder={onCreateFolder}
        />
      )}
      {activeModal.type === 'share' && activeDoc && (
        <ShareFileModal document={activeDoc} onClose={closeModal} currentUserEmail={currentUserEmail} />
      )}
      {activeModal.type === 'info' && activeDoc && (
        <FileInfoModal document={activeDoc} onClose={closeModal} currentUserEmail={currentUserEmail} />
      )}
      {activeModal.type === 'delete' && activeDoc && (
        <DeleteConfirmModal document={activeDoc} onClose={closeModal} onDelete={onDelete} />
      )}
      {activeModal.type === 'coverSelection' && activeDoc && (
        <CoverFileSelectionModal
          documentName={activeDoc.name}
          onSecure={handleSecureWithCover}
          onClose={closeModal}
          isSecuring={isSecuring}
        />
      )}
    </>
  );
}

import { useState, useEffect } from 'react';
import { X, Share2, Mail, CheckCircle2, AlertCircle, Trash2, Loader2, Clock, UserCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { ConfirmModal } from './ConfirmModal';

export function ShareFileModal({ document: doc, onClose }) {
  const [email, setEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(true);
  
  // For Removal Confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [shareToDelete, setShareToDelete] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    fetchRecipients();
  }, [doc.document_id]);

  const fetchRecipients = async () => {
    try {
      const response = await axios.get(`/documents/recipients/${doc.document_id}`);
      setRecipients(response.data);
    } catch (error) {
      console.error("Failed to fetch recipients", error);
    } finally {
      setIsLoadingRecipients(false);
    }
  };

  const handleShare = async (emailToShare = null) => {
    const targetEmail = emailToShare || email;
    if (!targetEmail) return;

    setIsSharing(true);
    try {
        const response = await axios.post(route('documents.share'), {
            document_id: doc.document_id,
            email: targetEmail
        });
        
        toast.success(response.data.message || `File shared with ${targetEmail}`);
        setEmail('');
        setShowConfirm(false);
        fetchRecipients();
        // Refresh page data to show shared badge icon
        import('@inertiajs/react').then(({ router }) => {
            router.reload({ only: ['documents'] });
        });
    } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to share file');
    } finally {
        setIsSharing(false);
    }
  };

  const confirmRemoveAccess = (shareId) => {
    setShareToDelete(shareId);
    setShowDeleteConfirm(true);
  };

  const handleRemoveAccess = async () => {
    setIsRemoving(true);
    try {
      await axios.post(route('documents.share.remove'), { share_id: shareToDelete });
      toast.success('Access removed successfully');
      setShowDeleteConfirm(false);
      setShareToDelete(null);
      fetchRecipients();
      // Refresh page data
      import('@inertiajs/react').then(({ router }) => {
          router.reload({ only: ['documents', 'sentShares'] });
      });
    } catch (error) {
      toast.error('Failed to remove access');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleConfirm = () => {
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setShowConfirm(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
        if (showConfirm) {
            handleShare();
        } else if (email) {
            handleConfirm();
        }
    }
  };

  const getStatusBadge = (share) => {
    if (share.is_expired) {
      return <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded-full"><Clock className="size-3" /> Expired</span>;
    }
    switch (share.status) {
      case 'accepted':
        return <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase tracking-wider bg-green-50 px-2 py-0.5 rounded-full"><UserCheck className="size-3" /> Shared</span>;
      default:
        return <span className="flex items-center gap-1 text-[10px] font-bold text-yellow-600 uppercase tracking-wider bg-yellow-50 px-2 py-0.5 rounded-full"><Clock className="size-3" /> Pending</span>;
    }
  };

  return (
    <>
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onKeyDown={handleKeyDown}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg shadow-md shadow-indigo-200">
              <Share2 className="size-6 text-white" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">Share File</h2>
                <p className="text-xs text-gray-500 font-medium truncate max-w-[250px]">{doc.filename}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* New Share Form */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">New Share</h3>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="size-5 text-gray-400" />
                    </div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="Enter recipient email address"
                        disabled={showConfirm}
                        autoFocus
                    />
                </div>
                {!showConfirm ? (
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                        Share
                    </button>
                ) : (
                    <div className="flex gap-1">
                        <button
                            onClick={() => handleShare()}
                            disabled={isSharing}
                            className="px-4 py-2.5 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200 disabled:opacity-50"
                        >
                            {isSharing ? <Loader2 className="size-5 animate-spin" /> : "Confirm"}
                        </button>
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="px-4 py-2.5 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                )}
            </div>
          </div>

          {/* Existing Recipients */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Current Access</h3>
            <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                {isLoadingRecipients ? (
                    <div className="p-8 flex flex-col items-center justify-center text-gray-400">
                        <Loader2 className="size-8 animate-spin mb-2" />
                        <span className="text-xs font-medium">Loading recipients...</span>
                    </div>
                ) : recipients.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {recipients.map(share => (
                            <div key={share.share_id} className="p-4 flex items-center justify-between hover:bg-white transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                                        {share.user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{share.user.name}</p>
                                        <p className="text-xs text-gray-500 font-medium">{share.user.email}</p>
                                        <div className="mt-1">{getStatusBadge(share)}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    {share.is_expired && (
                                        <button
                                            onClick={() => handleShare(share.user.email)}
                                            className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                            title="Share Again"
                                        >
                                            <RefreshCw className="size-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => confirmRemoveAccess(share.share_id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                        title="Remove Access"
                                    >
                                        <Trash2 className="size-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <div className="size-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                            <Users className="size-6 text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">Not shared with anyone yet.</p>
                    </div>
                )}
            </div>
          </div>

          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-3">
              <AlertCircle className="size-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                  <p className="text-sm font-bold text-indigo-900 leading-none mb-1">Security Note</p>
                  <p className="text-[11px] text-indigo-700 font-medium leading-relaxed">
                      Shares expire automatically after 24 hours. You can remove access at any time to immediately invalidate the recipient's ability to unlock this file.
                  </p>
              </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-200 rounded-xl transition-all"
            >
              Close
            </button>
        </div>
      </div>
    </div>

    <ConfirmModal 
        show={showDeleteConfirm}
        title="Remove Access"
        message="Are you sure you want to remove access for this user? They will no longer be able to unlock this document."
        confirmText="Remove Access"
        isDanger={true}
        isLoading={isRemoving}
        onConfirm={handleRemoveAccess}
        onCancel={() => { setShowDeleteConfirm(false); setShareToDelete(null); }}
    />
    </>
  );
}

import { Users } from 'lucide-react';

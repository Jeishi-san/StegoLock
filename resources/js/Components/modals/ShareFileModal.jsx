import { useState, useEffect } from 'react';
import { X, Share2, Mail, CheckCircle2, AlertCircle, Trash2, Loader2, Clock, UserCheck, RefreshCw, ShieldCheck, UserPlus } from 'lucide-react';
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
      return (
        <span className="flex items-center gap-1 text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
            <Clock className="size-3" /> Expired
        </span>
      );
    }
    switch (share.status) {
      case 'accepted':
        return (
            <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <UserCheck className="size-3" /> Shared
            </span>
        );
      default:
        return (
            <span className="flex items-center gap-1 text-[10px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                <Clock className="size-3" /> Pending
            </span>
        );
    }
  };

  return (
    <>
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onKeyDown={handleKeyDown}>
      <div 
        className="bg-white dark:bg-cyber-void rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-cyber-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-indigo-600 dark:bg-cyber-accent/10 p-6 text-white dark:text-cyber-accent text-center relative border-b dark:border-cyber-border">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/20 dark:hover:bg-cyber-accent/20 rounded-full transition-colors z-10"
          >
            <X className="size-5" />
          </button>
          
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 dark:bg-cyber-accent/20 rounded-full mb-4 shadow-inner">
              <Share2 className="size-10 text-white dark:text-cyber-accent" />
          </div>
          <h2 className="text-xl font-bold dark:text-white uppercase tracking-tight">Share File</h2>
          <p className="text-indigo-100 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 truncate px-6">
              {doc.filename}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* New Share Form */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <UserPlus className="size-4 text-indigo-500" />
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Add Recipient</h3>
            </div>
            <div className="flex flex-col gap-3">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="size-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-cyber-surface border border-slate-200 dark:border-cyber-border rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-cyber-accent focus:border-transparent transition-all font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm"
                        placeholder="recipient@example.com"
                        disabled={showConfirm}
                        autoFocus
                    />
                </div>
                {!showConfirm ? (
                    <button
                        onClick={handleConfirm}
                        className="w-full py-3 bg-indigo-600 dark:bg-cyber-accent text-white font-black uppercase tracking-widest text-xs rounded-xl hover:shadow-lg transition-all active:scale-95"
                    >
                        Share Access
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleShare()}
                            disabled={isSharing}
                            className="flex-1 py-3 bg-emerald-500 dark:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                        >
                            {isSharing ? <Loader2 className="size-4 animate-spin" /> : "Confirm Share"}
                        </button>
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="p-3 bg-slate-100 dark:bg-cyber-surface text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-cyber-border/30 transition-all"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                )}
            </div>
          </div>

          {/* Existing Recipients */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Active Access</h3>
            </div>
            <div className="bg-slate-50 dark:bg-cyber-surface/30 rounded-2xl border border-slate-100 dark:border-cyber-border overflow-hidden shadow-inner">
                {isLoadingRecipients ? (
                    <div className="p-10 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                        <Loader2 className="size-10 animate-spin mb-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Retrieving list...</span>
                    </div>
                ) : recipients.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-cyber-border/30">
                        {recipients.map(share => (
                            <div key={share.share_id} className="p-4 flex items-center justify-between hover:bg-white dark:hover:bg-cyber-surface transition-all group">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="size-10 shrink-0 bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-500/20 dark:to-indigo-600/10 rounded-xl flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-black text-sm border border-indigo-100/50 dark:border-indigo-500/20">
                                        {share.user.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-slate-900 dark:text-white truncate">{share.user.name}</p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold truncate">{share.user.email}</p>
                                        <div className="mt-1">{getStatusBadge(share)}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    {share.is_expired && (
                                        <button
                                            onClick={() => handleShare(share.user.email)}
                                            className="p-2 bg-white dark:bg-cyber-void text-indigo-500 dark:text-indigo-400 hover:text-white hover:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg shadow-sm border border-slate-100 dark:border-cyber-border transition-all"
                                            title="Share Again"
                                        >
                                            <RefreshCw className="size-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => confirmRemoveAccess(share.share_id)}
                                        className="p-2 bg-white dark:bg-cyber-void text-slate-400 dark:text-slate-600 hover:text-white hover:bg-red-600 dark:hover:bg-red-500 rounded-lg shadow-sm border border-slate-100 dark:border-cyber-border transition-all"
                                        title="Remove Access"
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-10 text-center">
                        <div className="size-12 bg-white dark:bg-cyber-void rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100 dark:border-cyber-border">
                            <Mail className="size-6 text-slate-200 dark:text-slate-700" />
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest">Not shared with anyone</p>
                    </div>
                )}
            </div>
          </div>

          <div className="p-5 bg-slate-900 dark:bg-cyber-surface/50 rounded-2xl border border-slate-800 dark:border-cyber-border flex items-start gap-4">
              <ShieldCheck className="size-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Security Protocol</p>
                  <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                      Shares expire after 24 hours. Removing access invalidates the key immediately.
                  </p>
              </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 dark:bg-cyber-surface border-t border-slate-100 dark:border-cyber-border/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-cyber-border/30 rounded-xl transition-all"
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


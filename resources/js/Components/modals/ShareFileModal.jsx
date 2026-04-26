import { useState, useEffect } from 'react';
import { X, Share2, Mail, CheckCircle2, AlertCircle, Trash2, Loader2, Clock, UserCheck, RefreshCw, Users } from 'lucide-react';
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
        
        toast.success(response.data.message || `Module shared with ${targetEmail}`);
        setEmail('');
        setShowConfirm(false);
        fetchRecipients();
        // Refresh page data to show shared badge icon
        import('@inertiajs/react').then(({ router }) => {
            router.reload({ only: ['documents'] });
        });
    } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to share module');
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
      toast.success('Access revoked successfully');
      setShowDeleteConfirm(false);
      setShareToDelete(null);
      fetchRecipients();
      // Refresh page data
      import('@inertiajs/react').then(({ router }) => {
          router.reload({ only: ['documents', 'sentShares'] });
      });
    } catch (error) {
      toast.error('Failed to revoke access');
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
      return <span className="flex items-center gap-1.5 text-[9px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20"><Clock className="size-3" /> Expired</span>;
    }
    switch (share.status) {
      case 'accepted':
        return <span className="flex items-center gap-1.5 text-[9px] font-black text-cyber-accent uppercase tracking-widest bg-cyber-accent/10 px-2.5 py-1 rounded-full border border-cyber-accent/20"><UserCheck className="size-3" /> Manifested</span>;
      default:
        return <span className="flex items-center gap-1.5 text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20"><Clock className="size-3" /> Pending</span>;
    }
  };

  return (
    <>
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-cyber-void/80 backdrop-blur-md z-[100] flex items-center justify-center p-4" onKeyDown={handleKeyDown}>
      <div className="glass-panel max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh] rounded-[3rem] border-slate-200 dark:border-cyber-border/50 animate-fade-in shadow-2xl bg-white dark:bg-cyber-void">
        {/* Header */}
        <div className="bg-cyber-accent/5 dark:bg-cyber-accent/10 p-10 text-center relative border-b border-slate-100 dark:border-cyber-border">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="size-6" />
          </button>
          <div className="inline-flex items-center justify-center w-24 h-24 bg-cyber-accent/10 dark:bg-cyber-accent/20 rounded-[2rem] mb-6 shadow-xl dark:shadow-glow-cyan border border-cyber-accent/20 dark:border-cyber-accent/30">
            <Share2 className="size-12 text-cyber-accent" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Access Control</h2>
          <p className="text-cyber-accent-dark dark:text-cyber-accent font-black text-[10px] tracking-[0.4em] uppercase mt-2 truncate px-10">{doc.filename}</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
          {/* New Share Form */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-1.5 h-5 bg-cyber-accent rounded-full shadow-glow-cyan" />
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Deploy Invitation</h3>
            </div>
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        <Mail className="size-5 text-slate-500" />
                    </div>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-cyber-surface/50 border border-slate-200 dark:border-cyber-border rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-cyber-accent/50 focus:border-cyber-accent transition-all shadow-inner"
                        placeholder="Recipient Node Address (Email)"
                        disabled={showConfirm}
                        autoFocus
                    />
                </div>
                {!showConfirm ? (
                    <button
                        onClick={handleConfirm}
                        className="px-8 py-4 bg-cyber-accent text-white dark:text-cyber-void font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-slate-900 dark:hover:bg-white transition-all shadow-lg dark:shadow-glow-cyan"
                    >
                        Share
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleShare()}
                            disabled={isSharing}
                            className="px-6 py-4 bg-cyber-accent text-white dark:text-cyber-void font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-slate-900 dark:hover:bg-white transition-all shadow-lg dark:shadow-glow-cyan disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                        >
                            {isSharing ? <Loader2 className="size-5 animate-spin" /> : "Confirm"}
                        </button>
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="px-4 py-4 bg-slate-100 dark:bg-cyber-surface text-slate-400 font-black rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all border border-slate-200 dark:border-cyber-border"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                )}
            </div>
          </div>

          {/* Existing Recipients */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-1.5 h-5 bg-fuchsia-500 rounded-full shadow-glow-fuchsia" />
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Authorized Nodes</h3>
            </div>
            <div className="bg-slate-50 dark:bg-cyber-surface/30 rounded-[2.5rem] border border-slate-200 dark:border-cyber-border overflow-hidden">
                {isLoadingRecipients ? (
                    <div className="p-16 flex flex-col items-center justify-center text-slate-500">
                        <Loader2 className="size-10 animate-spin mb-4 text-cyber-accent" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Mapping Nodes...</span>
                    </div>
                ) : recipients.length > 0 ? (
                    <div className="divide-y divide-cyber-border/20">
                        {recipients.map(share => (
                            <div key={share.share_id} className="p-6 flex items-center justify-between hover:bg-white dark:hover:bg-cyber-surface/50 transition-all group/node">
                                <div className="flex items-center gap-5">
                                    <div className="size-14 bg-slate-100 dark:bg-cyber-surface rounded-2xl border border-slate-200 dark:border-cyber-border flex items-center justify-center text-cyber-accent font-black text-xl group-hover/node:border-cyber-accent/50 transition-all shadow-lg dark:shadow-2xl">
                                        {share.user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{share.user.name}</p>
                                        <p className="text-[11px] text-slate-500 font-medium font-mono">{share.user.email}</p>
                                        <div className="mt-2">{getStatusBadge(share)}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover/node:opacity-100 transition-all">
                                    {share.is_expired && (
                                        <button
                                            onClick={() => handleShare(share.user.email)}
                                            className="p-3 text-cyber-accent hover:bg-cyber-accent/10 border border-transparent hover:border-cyber-accent/30 rounded-xl transition-all"
                                            title="Re-deploy Access"
                                        >
                                            <RefreshCw className="size-5" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => confirmRemoveAccess(share.share_id)}
                                        className="p-3 text-slate-500 hover:text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl transition-all"
                                        title="Revoke Access"
                                    >
                                        <Trash2 className="size-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-16 text-center">
                        <div className="size-20 bg-slate-100 dark:bg-cyber-surface rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-200 dark:border-cyber-border shadow-inner">
                            <Users className="size-10 text-slate-300 dark:text-slate-700" />
                        </div>
                        <p className="text-slate-400 dark:text-slate-500 font-medium px-8">No external nodes have been authorized to access this module.</p>
                    </div>
                )}
            </div>
          </div>

          <div className="p-6 bg-cyber-accent/5 dark:bg-cyber-accent/5 rounded-[2rem] border border-cyber-accent/10 dark:border-cyber-accent/20 flex items-start gap-4">
              <div className="p-2.5 bg-cyber-accent/10 rounded-xl border border-cyber-accent/10 dark:border-cyber-accent/20">
                <AlertCircle className="size-5 text-cyber-accent-dark dark:text-cyber-accent dark:shadow-glow-cyan" />
              </div>
              <div>
                  <p className="text-[11px] font-black text-cyber-accent-dark dark:text-cyber-accent uppercase tracking-widest mb-1.5">Security Protocol</p>
                  <p className="text-[12px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                      Invitations undergo automatic entropy degradation after 24 hours. Administrative revocation is instantaneous and absolute.
                  </p>
              </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 bg-slate-50 dark:bg-cyber-surface/30 border-t border-slate-100 dark:border-cyber-border flex justify-end">
            <button
              onClick={onClose}
              className="px-10 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-cyber-surface hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all border border-slate-200 dark:border-cyber-border"
            >
              Close Console
            </button>
        </div>
      </div>
    </div>

    <ConfirmModal 
        show={showDeleteConfirm}
        title="Revoke Access"
        message="Are you sure you want to revoke access for this node? The recipient will lose all decryption capabilities for this module immediately."
        confirmText="Revoke Access"
        isDanger={true}
        isLoading={isRemoving}
        onConfirm={handleRemoveAccess}
        onCancel={() => { setShowDeleteConfirm(false); setShareToDelete(null); }}
    />
    </>
  );
}


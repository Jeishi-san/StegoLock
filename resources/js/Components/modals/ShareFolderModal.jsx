import { useState, useEffect } from 'react';
import { X, Share2, Mail, CheckCircle2, AlertCircle, Trash2, Loader2, Clock, UserCheck, RefreshCw, ShieldCheck, UserPlus, FolderOpen, Info } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { ConfirmModal } from './ConfirmModal';

export function ShareFolderModal({ folder, onClose }) {
  const [email, setEmail] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleShare = async () => {
    if (!email) return;

    setIsSharing(true);
    try {
        const response = await axios.post(route('folders.share'), {
            folder_id: folder.folder_id,
            email: email
        });
        
        toast.success(response.data.message || `Folder shared with ${email}`);
        setEmail('');
        setShowConfirm(false);
        // Refresh page data
        import('@inertiajs/react').then(({ router }) => {
            router.reload({ only: ['documents', 'folders'] });
        });
        onClose();
    } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to share folder');
    } finally {
      setIsSharing(false);
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

  return (
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
              <FolderOpen className="size-10 text-white dark:text-cyber-accent" />
          </div>
          <h2 className="text-xl font-bold dark:text-white uppercase tracking-tight">Share Folder</h2>
          <p className="text-indigo-100 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 truncate px-6">
              {folder.name}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Warning Message */}
          <div className="p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertCircle className="size-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Recursive Security Protocol</span>
              </div>
              <p className="text-[10px] text-amber-600 dark:text-amber-500/80 font-bold leading-relaxed">
                  Notice: Sharing this folder will grant access to ALL current subfolders and documents contained within that you own. Documents shared with you by others will be skipped.
              </p>
              <div className="pt-1 flex items-start gap-2 text-[10px] text-amber-600 dark:text-amber-500/80 font-bold leading-relaxed">
                  <Info className="size-3 mt-0.5 flex-shrink-0" />
                  <span>Note: Files added to this folder after this action will NOT be automatically shared and will require a separate share operation.</span>
              </div>
          </div>

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
                        Share Folder
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={handleShare}
                            disabled={isSharing}
                            className="flex-1 py-3 bg-emerald-500 dark:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center min-w-[100px]"
                        >
                            {isSharing ? <Loader2 className="size-4 animate-spin" /> : "Confirm & Share All"}
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

          <div className="p-5 bg-slate-900 dark:bg-cyber-surface/50 rounded-2xl border border-slate-800 dark:border-cyber-border flex items-start gap-4">
              <ShieldCheck className="size-5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Security Protocol</p>
                  <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                      DEKs for all nested files will be re-wrapped using a temporary secure handoff key. Access can be revoked from the Shared Documents panel.
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
  );
}

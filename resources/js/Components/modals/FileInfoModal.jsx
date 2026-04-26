import { useState, useEffect } from 'react';
import { X, History, FileText, User, Clock, CheckCircle2, Share2, Unlock, Trash2, ShieldCheck, Loader2, AlertCircle, Lock } from 'lucide-react';
import { formatDate } from '@/Utils/fileUtils';
import axios from 'axios';

export function FileInfoModal({ document: doc, onClose }) {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchActivity();
  }, [doc.document_id]);

  const fetchActivity = async () => {
    try {
      const response = await axios.get(`/documents/activity/${doc.document_id}`);
      setActivities(response.data);
    } catch (error) {
      console.error("Failed to fetch activity", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'shared': return <Share2 className="size-4 text-fuchsia-400" />;
      case 'accepted': return <CheckCircle2 className="size-4 text-cyber-accent" />;
      case 'unlocked': return <Unlock className="size-4 text-cyan-400" />;
      case 'removed': return <Trash2 className="size-4 text-red-400" />;
      case 'locking_started': return <Lock className="size-4 text-amber-400" />;
      case 'locking_completed': return <ShieldCheck className="size-4 text-cyber-accent" />;
      case 'locking_failed': 
      case 'unlocking_failed': return <AlertCircle className="size-4 text-red-500" />;
      case 'deleted': return <Trash2 className="size-4 text-slate-500" />;
      default: return <FileText className="size-4 text-slate-400" />;
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getActionText = (activity) => {
    const actor = activity.user.id === doc.user_id ? "You" : activity.user.name;
    const errorMsg = activity.metadata?.error ? (
        <span className="block text-[10px] text-red-500 font-mono mt-1 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
            Error: {activity.metadata.error}
        </span>
    ) : null;

    switch (activity.action) {
      case 'shared': 
        return <>{actor} shared this module with <span className="text-white font-bold">{activity.metadata?.recipient_email}</span></>;
      case 'accepted': 
        return <>{actor} accepted the share invitation</>;
      case 'unlocked': 
        return <>{actor} unlocked/decrypted the module</>;
      case 'removed': 
        return <>{actor} removed access for a recipient</>;
      case 'locking_started':
        return <>{actor} initiated module encryption & locking</>;
      case 'locking_completed':
        return <>Module encryption & locking completed successfully</>;
      case 'locking_failed':
        return <>{actor} failed to lock module {errorMsg}</>;
      case 'unlocking_failed':
        return <>{actor} failed to unlock module {errorMsg}</>;
      case 'deleted':
        return <>{actor} purged this module from the grid</>;
      default: 
        return <>{actor} performed {activity.action}</>;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-cyber-void/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
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
            <History className="size-12 text-cyber-accent" />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Audit Logs</h2>
          <p className="text-cyber-accent-dark dark:text-cyber-accent font-black text-[10px] tracking-[0.4em] uppercase mt-2 truncate px-10">{doc.filename}</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
            {/* File Stats Summary */}
            <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 dark:bg-cyber-surface/50 rounded-3xl border border-slate-200 dark:border-cyber-border group hover:border-cyber-accent/30 transition-all shadow-inner">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Integrity Status</p>
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="size-5 text-cyber-accent dark:shadow-glow-cyan" />
                        <p className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">{doc.status}</p>
                    </div>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-cyber-surface/50 rounded-3xl border border-slate-200 dark:border-cyber-border group hover:border-cyber-accent/30 transition-all shadow-inner">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Manifest Date</p>
                    <div className="flex items-center gap-3">
                        <Clock className="size-5 text-slate-500 group-hover:text-cyber-accent transition-colors" />
                        <p className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{formatDate(new Date(doc.created_at))}</p>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-1.5 h-6 bg-cyber-accent rounded-full shadow-glow-cyan" />
                    <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Sequential Audit</h3>
                </div>
                
                {isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-500">
                        <div className="relative mb-6">
                            <Loader2 className="size-12 animate-spin text-cyber-accent" />
                            <div className="absolute inset-0 size-12 blur-xl bg-cyber-accent/20 animate-pulse" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Querying Distributed Ledger...</span>
                    </div>
                ) : activities.length > 0 ? (
                    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-7 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-cyber-accent before:via-slate-200 dark:before:via-cyber-border/30 before:to-transparent">
                        {activities.map((activity, index) => (
                            <div key={activity.id} className="relative flex items-start gap-6 group">
                                <div className="flex items-center justify-center size-14 rounded-2xl bg-white dark:bg-cyber-surface border border-slate-200 dark:border-cyber-border group-hover:border-cyber-accent/50 shadow-xl dark:shadow-2xl z-10 transition-all duration-300">
                                    {getActionIcon(activity.action)}
                                </div>
                                <div className="flex-1 pt-2">
                                    <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                                        {getActionText(activity)}
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                                        <Clock className="size-3" />
                                        {formatDateTime(activity.created_at)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-16 text-center border-2 border-dashed border-cyber-border/30 rounded-[2.5rem] bg-cyber-surface/10">
                        <div className="size-20 bg-cyber-surface rounded-3xl flex items-center justify-center mx-auto mb-6 border border-cyber-border shadow-inner">
                            <History className="size-10 text-slate-700" />
                        </div>
                        <p className="text-slate-500 font-medium px-8">No audit logs have been recorded for this module in the current epoch.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-10 bg-slate-50 dark:bg-cyber-surface/30 border-t border-slate-100 dark:border-cyber-border flex justify-end">
            <button
              onClick={onClose}
              className="px-10 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-cyber-surface hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all border border-slate-200 dark:border-cyber-border"
            >
              Close Ledger
            </button>
        </div>
      </div>
    </div>
  );
}

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
      case 'shared': return <Share2 className="size-4 text-indigo-600" />;
      case 'accepted': return <CheckCircle2 className="size-4 text-green-600" />;
      case 'unlocked': return <Unlock className="size-4 text-purple-600" />;
      case 'removed': return <Trash2 className="size-4 text-red-600" />;
      case 'locking_started': return <Lock className="size-4 text-orange-600" />;
      case 'locking_completed': return <ShieldCheck className="size-4 text-green-600" />;
      case 'locking_failed': 
      case 'unlocking_failed': return <AlertCircle className="size-4 text-red-600" />;
      case 'deleted': return <Trash2 className="size-4 text-gray-600" />;
      default: return <FileText className="size-4 text-gray-600" />;
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getActionText = (activity) => {
    const actor = activity.user.id === doc.user_id ? "You" : activity.user.name;
    const errorMsg = activity.metadata?.error ? (
        <span className="block text-[10px] text-red-500 font-mono mt-1 bg-red-50 p-1 rounded border border-red-100">
            Error: {activity.metadata.error}
        </span>
    ) : null;

    switch (activity.action) {
      case 'shared': 
        return <>{actor} shared this file with <span className="font-bold">{activity.metadata?.recipient_email}</span></>;
      case 'accepted': 
        return <>{actor} accepted the share invitation</>;
      case 'unlocked': 
        return <>{actor} unlocked/decrypted the file</>;
      case 'removed': 
        return <>{actor} removed access for a recipient</>;
      case 'locking_started':
        return <>{actor} initiated file encryption & locking</>;
      case 'locking_completed':
        return <>File encryption & locking completed successfully</>;
      case 'locking_failed':
        return <>{actor} failed to lock file {errorMsg}</>;
      case 'unlocking_failed':
        return <>{actor} failed to unlock file {errorMsg}</>;
      case 'deleted':
        return <>{actor} deleted this file from the system</>;
      default: 
        return <>{actor} performed {activity.action}</>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg shadow-md shadow-indigo-200">
              <History className="size-6 text-white" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">File History</h2>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {/* File Stats Summary */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="size-4 text-green-600" />
                        <p className="text-sm font-bold text-gray-900 uppercase">{doc.status}</p>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Created</p>
                    <div className="flex items-center gap-2">
                        <Clock className="size-4 text-gray-500" />
                        <p className="text-sm font-bold text-gray-900">{formatDateTime(doc.created_at)}</p>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Activity Timeline</h3>
                
                {isLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center text-gray-400">
                        <Loader2 className="size-10 animate-spin mb-4" />
                        <span className="text-sm font-medium">Retrieving audit logs...</span>
                    </div>
                ) : activities.length > 0 ? (
                    <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-100 before:via-gray-100 before:to-transparent">
                        {activities.map((activity, index) => (
                            <div key={activity.id} className="relative flex items-start gap-4 group">
                                <div className="flex items-center justify-center size-10 rounded-full bg-white border-2 border-gray-100 shadow-sm z-10 group-hover:border-indigo-200 transition-colors">
                                    {getActionIcon(activity.action)}
                                </div>
                                <div className="flex-1 pt-1">
                                    <div className="text-sm text-gray-600 leading-snug">
                                        {getActionText(activity)}
                                    </div>
                                    <p className="text-[11px] text-gray-400 font-medium mt-1">
                                        {formatDateTime(activity.created_at)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                        <div className="size-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                            <History className="size-6 text-gray-200" />
                        </div>
                        <p className="text-sm text-gray-400 font-medium">No activity recorded for this file yet.</p>
                    </div>
                )}
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
  );
}

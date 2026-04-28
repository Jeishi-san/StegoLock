import Modal from '@/Components/Modal';
import { 
    Activity, Clock, User, 
    CheckCircle2, XCircle, Upload, 
    HardDrive, Shield, UserCheck, 
    UserPlus, Trash2, X
} from 'lucide-react';

export default function UserActivityModal({ show, onClose, user, activities = [], loading }) {
    const getActivityIcon = (action) => {
        switch (action) {
            case 'login': return UserCheck;
            case 'upload': return Upload;
            case 'create_user': return UserPlus;
            case 'quota_update': return HardDrive;
            case 'account_status': return Shield;
            case 'delete': return Trash2;
            default: return Activity;
        }
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="2xl">
            <div className="relative overflow-hidden bg-white dark:bg-cyber-surface shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-cyber-border/30 bg-slate-50/50 dark:bg-cyber-void/30">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-500/20">
                            {user?.name?.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                {user?.name}'s Activity History
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                <User className="size-3" /> {user?.email}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-cyber-border/30 rounded-lg transition-all"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[60vh] overflow-y-auto no-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="size-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 animate-pulse uppercase tracking-widest">
                                Retrieving Audit Trail...
                            </p>
                        </div>
                    ) : activities.length > 0 ? (
                        <div className="space-y-6 relative before:absolute before:left-[1.35rem] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-cyber-border/30">
                            {activities.map((activity, index) => {
                                const Icon = getActivityIcon(activity.action);
                                return (
                                    <div key={activity.id} className="relative pl-10 group">
                                        {/* Timeline Dot */}
                                        <div className="absolute left-0 top-0 size-11 rounded-xl bg-white dark:bg-cyber-surface border border-slate-200 dark:border-cyber-border/50 flex items-center justify-center text-indigo-500 shadow-sm z-10 transition-all group-hover:scale-110 group-hover:border-indigo-500/50 group-hover:shadow-indigo-500/10">
                                            <Icon className="size-5" />
                                        </div>

                                        <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-cyber-void/30 border border-slate-100 dark:border-cyber-border/30 transition-all group-hover:border-indigo-500/20 group-hover:bg-white dark:group-hover:bg-cyber-surface/50">
                                            <div className="flex items-start justify-between gap-4 mb-2">
                                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                                                    {activity.action.replace('_', ' ')}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                    <Clock className="size-3" />
                                                    {new Date(activity.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">
                                                {activity.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <div className="size-16 rounded-2xl bg-slate-50 dark:bg-cyber-void/50 flex items-center justify-center border border-slate-200 dark:border-cyber-border/50 mx-auto mb-4">
                                <Activity className="size-8 text-slate-300 dark:text-cyber-border/50" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Activity Found</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                This user hasn't performed any logged actions yet.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-cyber-border/30 bg-slate-50/50 dark:bg-cyber-void/30 text-right">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white dark:bg-cyber-border/20 border border-slate-200 dark:border-cyber-border/50 text-slate-600 dark:text-white text-sm font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-cyber-border/40 transition-all"
                    >
                        Close History
                    </button>
                </div>
            </div>
        </Modal>
    );
}

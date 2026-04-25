import { X, AlertCircle, Loader2 } from 'lucide-react';

export function ConfirmModal({ 
    show, 
    title, 
    message, 
    onConfirm, 
    onCancel, 
    confirmText = "Confirm", 
    cancelText = "Cancel", 
    isDanger = false,
    isLoading = false 
}) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className={`p-6 text-white text-center relative ${isDanger ? 'bg-red-600' : 'bg-indigo-600'}`}>
                    <button 
                        onClick={onCancel}
                        disabled={isLoading}
                        className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="size-5" />
                    </button>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                        <AlertCircle className="size-10 text-white" />
                    </div>
                    <h2 className="text-xl font-bold">{title}</h2>
                </div>

                <div className="p-6">
                    <p className="text-sm text-gray-500 leading-relaxed text-center mb-6">
                        {message}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={onCancel}
                            disabled={isLoading}
                            className="px-4 py-2.5 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${
                                isDanger 
                                    ? 'bg-red-600 hover:bg-red-700 shadow-red-100' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                            }`}
                        >
                            {isLoading && <Loader2 className="size-4 animate-spin" />}
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

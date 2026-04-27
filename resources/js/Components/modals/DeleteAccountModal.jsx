import { X, AlertCircle, Loader2, ShieldAlert } from 'lucide-react';
import TextInput from '@/Components/TextInput';
import InputLabel from '@/Components/InputLabel';
import InputError from '@/Components/InputError';
import SecondaryButton from '@/Components/SecondaryButton';
import DangerButton from '@/Components/DangerButton';

export default function DeleteAccountModal({ 
    show, 
    onClose, 
    onDelete, 
    passwordValue, 
    setPasswordValue, 
    errors, 
    processing,
    passwordInputRef
}) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div 
                className="bg-white dark:bg-cyber-void rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-slate-200 dark:border-cyber-border"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-red-600 dark:bg-red-900/40 p-6 text-white text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X className="size-5" />
                    </button>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                        <ShieldAlert className="size-10 text-white" />
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tight">Delete Account</h2>
                    <p className="text-red-100 text-sm mt-1 font-medium">This action is permanent and irreversible</p>
                </div>

                <form onSubmit={onDelete} className="p-8">
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                        Once your account is deleted, all of its resources and data will be permanently deleted. Please enter your password to confirm you would like to permanently delete your account.
                    </p>

                    <div className="space-y-2">
                        <InputLabel
                            htmlFor="password"
                            value="Password"
                            className="sr-only"
                        />

                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            ref={passwordInputRef}
                            value={passwordValue}
                            onChange={(e) => setPasswordValue(e.target.value)}
                            className="w-full"
                            isFocused
                            placeholder="Confirm Password"
                        />

                        <InputError
                            message={errors.password}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-8 flex justify-end gap-3">
                        <SecondaryButton 
                            onClick={onClose}
                            className="dark:bg-cyber-surface dark:text-slate-300 dark:border-cyber-border"
                        >
                            Cancel
                        </SecondaryButton>

                        <DangerButton 
                            disabled={processing}
                            className="shadow-lg shadow-red-500/30"
                        >
                            {processing ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="size-4 animate-spin" />
                                    Deleting...
                                </span>
                            ) : (
                                'Delete Account'
                            )}
                        </DangerButton>
                    </div>
                </form>
            </div>
        </div>
    );
}

import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2,} from "lucide-react";
import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Login" />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <div className="space-y-1 mb-8">
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    Welcome Back
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Please enter your credentials to access the vault.</p>
            </div>

            <form onSubmit={submit} className="space-y-6">
                <div className="space-y-2">
                    <InputLabel htmlFor="email" value="Email Address" />
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-cyber-accent transition-colors" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            placeholder="name@example.com"
                            value={data.email}
                            className="w-full pl-12 py-4"
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                            required
                        />
                    </div>
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div className="space-y-2">
                    <InputLabel htmlFor="password" value="Password" />
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-cyber-accent transition-colors" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            value={data.password}
                            className="w-full pl-12 py-4"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                    </div>
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center cursor-pointer group">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            className="size-4 bg-slate-100 dark:bg-cyber-surface border-slate-200 dark:border-cyber-border text-cyber-accent rounded focus:ring-cyber-accent"
                            onChange={(e) =>
                                setData('remember', e.target.checked)
                            }
                        />
                        <span className="ml-2 text-sm text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">Remember me</span>
                    </label>
                    <Link 
                        href={canResetPassword ? route('password.request') : '#'} 
                        className="text-sm text-cyber-accent-dark dark:text-cyber-accent hover:underline font-bold transition-colors"
                    >
                        Forgot password?
                    </Link>
                </div>

                <div className="pt-2">
                    <PrimaryButton className="w-full py-4 text-lg shadow-xl" disabled={processing}>
                        {processing ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="size-5 animate-spin" />
                                <span>Authorizing...</span>
                            </div>
                        ) : 'Sign In to Vault'}
                    </PrimaryButton>
                </div>
            </form>

            <div className="mt-10 text-center">
                <p className="text-slate-500 dark:text-slate-400">
                    Don't have an account?{' '}
                    <Link 
                        href={route('register')} 
                        className="text-cyber-accent-dark dark:text-cyber-accent font-black uppercase tracking-widest text-[11px] hover:underline transition-all"
                    >
                        Create Account
                    </Link>
                </p>
            </div>
        </>
    );
}

Login.layout = page => <GuestLayout children={page} mode="login" />

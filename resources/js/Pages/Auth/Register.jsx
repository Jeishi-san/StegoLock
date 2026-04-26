import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2,} from "lucide-react";
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Register" />

            <div className="space-y-1 mb-8">
                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    Join StegoLock
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Create your decentralized security profile.</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div className="space-y-2">
                    <InputLabel htmlFor="name" value="Full Name"/>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-cyber-accent transition-colors" />
                        <TextInput
                            id="name"
                            name="name"
                            placeholder="John Doe"
                            value={data.name}
                            className="w-full pl-12 py-4"
                            autoComplete="name"
                            isFocused={true}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                    </div>
                    <InputError message={errors.name} className="mt-2" />
                </div>

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                autoComplete="new-password"
                                onChange={(e) => setData('password', e.target.value)}
                                required
                            />
                        </div>
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div className="space-y-2">
                        <InputLabel htmlFor="password_confirmation" value="Confirm" />
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-cyber-accent transition-colors" />
                            <TextInput
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                placeholder="••••••••"
                                value={data.password_confirmation}
                                className="w-full pl-12 py-4"
                                autoComplete="new-password"
                                onChange={(e) =>
                                    setData('password_confirmation', e.target.value)
                                }
                                required
                            />
                        </div>
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>
                </div>

                <div className="pt-4">
                    <PrimaryButton className="w-full py-4 text-lg shadow-xl" disabled={processing}>
                        {processing ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="size-5 animate-spin" />
                                <span>Generating Profile...</span>
                            </div>
                        ) : 'Initialize Account'}
                    </PrimaryButton>
                </div>
            </form>

            <div className="mt-10 text-center">
                <p className="text-slate-500 dark:text-slate-400">
                    Already have an account?{' '}
                    <Link 
                        href={route('login')} 
                        className="text-cyber-accent-dark dark:text-cyber-accent font-black uppercase tracking-widest text-[11px] hover:underline transition-all"
                    >
                        Sign In
                    </Link>
                </p>
            </div>
        </>
    );
}

Register.layout = page => <GuestLayout children={page} mode="register" />

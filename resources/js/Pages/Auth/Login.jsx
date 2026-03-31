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
        <GuestLayout>
            <Head title="Login" />

            {status && (
                <div className="mb-4 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <h2 className="text-2xl font-semibold text-gray-900 mb-8">
                Sign In
            </h2>

            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1">
                    <InputLabel htmlFor="email" value="Email" />
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="w-full pl-10 pr-4 py-3"
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                            required
                        />

                        <InputError message={errors.email} className="mt-2" />
                    </div>
                </div>

                <div className="space-y-1">
                    <InputLabel htmlFor="password" value="Password" />
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="w-full pl-10 pr-4 py-3"
                            autoComplete="current-password"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />

                        <InputError message={errors.password} className="mt-2" />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            className="size-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            onChange={(e) =>
                                setData('remember', e.target.checked)
                            }
                        />
                        <span className="ml-2 text-sm text-gray-600">Remember me</span>
                    </label>
                    <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        {canResetPassword && (<Link href={route('password.request')}>Forgot password?</Link>)}
                    </button>
                </div>

                <div className="">
                    <button
                        type="submit" className="w-full mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium text-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
                        disabled={processing}>
                        Log in
                    </button>
                </div>
            </form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white/80 text-gray-500">
                        <Link href={route('register')} className="underline hover:text-gray-900">Create an account instead</Link>
                    </span>
                </div>
            </div>
        </GuestLayout>
    );
}

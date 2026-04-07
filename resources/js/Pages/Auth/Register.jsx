import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2,} from "lucide-react";
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
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
        <GuestLayout>
            <Head title="Register" />

            <h2 className="text-2xl font-semibold text-gray-900 mb-8">
                Create Account
            </h2>

            <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1">
                    <InputLabel htmlFor="name" value="Full Name"/>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="w-full pl-10 pr-4 py-3"
                            autoComplete="name"
                            isFocused={true}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />

                        <InputError message={errors.name} className="mt-2" />
                    </div>
                </div>

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
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />

                        <InputError message={errors.password} className="mt-2" />
                    </div>
                </div>

                <div className="space-y-1">
                    <InputLabel htmlFor="password_confirmation" value="Confirm Password"/>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="w-full pl-10 pr-4 py-3"
                            autoComplete="new-password"
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            required
                        />

                        <InputError
                            message={errors.password_confirmation}
                            className="mt-2"
                        />
                    </div>
                </div>

                <div className="">
                    <button
                        type="submit" className="w-full mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium text-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30"
                        disabled={processing}>
                        Create Account
                    </button>
                </div>
            </form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white/80 text-gray-500">
                        <Link href={route('login')} className="underline hover:text-gray-900">Sign in instead</Link>
                    </span>
                </div>
            </div>

        </GuestLayout>
    );
}

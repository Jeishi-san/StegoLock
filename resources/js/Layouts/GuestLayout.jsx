import { Shield, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2,} from "lucide-react";
import { DecorativeBackground } from "@/Components/DecorativeBackground";
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center pt-6 sm:justify-center sm:pt-0">
            <DecorativeBackground/>
            <div>
                <Link href="/register">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/50">
                            <Shield className="size-12 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            Welcome to Stegolock
                        </h1>
                    </div>
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-white p-8 pb-2 shadow-2xl sm:max-w-md rounded-3xl">
                    {children}
            </div>
        </div>
    );
}

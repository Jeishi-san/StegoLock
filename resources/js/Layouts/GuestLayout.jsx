import { Shield, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2,} from "lucide-react";
import { DecorativeBackground } from "@/Components/DecorativeBackground";
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center pt-6 sm:justify-center sm:pt-0">
            <DecorativeBackground/>
            <div>
                <Link href="/">
                    <Shield className="size-12 text-black" />
                    <div className=" ">Welcome to Stegolock</div>
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-white px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg">
                {children}
            </div>
        </div>
    );
}

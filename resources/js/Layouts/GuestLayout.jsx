import { Shield } from "lucide-react";
import { DecorativeBackground } from "@/Components/DecorativeBackground";
import { Link, router } from '@inertiajs/react';
import { useEffect, useState, useRef } from 'react';

export default function GuestLayout({ children, mode = 'login' }) {
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [currentChildren, setCurrentChildren] = useState(children);
    const prevMode = useRef(mode);

    useEffect(() => {
        const saved = localStorage.getItem('stegolock_theme');
        if (saved === 'dark' || !saved) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    useEffect(() => {
        if (prevMode.current !== mode) {
            setIsTransitioning(true);
            
            // Sync content swap with the middle of the branding slide
            const timer = setTimeout(() => {
                setCurrentChildren(children);
                setIsTransitioning(false);
            }, 500);

            prevMode.current = mode;
            return () => clearTimeout(timer);
        } else {
            setCurrentChildren(children);
        }
    }, [mode, children]);

    const isLogin = mode === 'login';

    return (
        <div className="relative min-h-screen bg-white dark:bg-cyber-void transition-colors duration-500 overflow-hidden font-sans">
            <DecorativeBackground />
            
            <div className="relative flex min-h-screen">
                {/* Branding Panel - Natural sliding wipe with no fade */}
                <div 
                    className={`hidden lg:flex absolute inset-y-0 w-full flex-col items-center justify-center transition-all duration-1000 cubic-bezier(0.7, 0, 0.3, 1) z-30 bg-white dark:bg-cyber-void shadow-2xl ${
                        isLogin ? 'translate-x-1/2' : '-translate-x-1/2'
                    }`}
                >
                    {/* Branding Content - No fade, always solid */}
                    <div className="w-full flex items-center justify-center">
                        <div className={`w-1/2 flex flex-col items-center justify-center p-12 transition-all duration-1000 cubic-bezier(0.7, 0, 0.3, 1) ${
                            isLogin ? '-translate-x-1/2' : 'translate-x-1/2'
                        }`}>
                            <div className="max-w-md text-center space-y-8 group cursor-default">
                                <div className="relative inline-flex items-center justify-center p-8 bg-gradient-to-br from-cyber-accent via-indigo-500 to-purple-600 rounded-[3rem] shadow-2xl shadow-cyan-500/50 dark:shadow-[0_0_40px_rgba(34,211,238,0.6)] animate-bounce-subtle group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                                    <Shield className="size-24 text-white drop-shadow-lg relative z-10" />
                                    <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                </div>
                                <div className="space-y-4">
                                    <h1 className="text-7xl font-[900] text-slate-900 dark:text-white tracking-tighter leading-[0.85] transform origin-top group-hover:scale-105 inline-block group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyber-accent group-hover:to-indigo-500 transition-all duration-500">
                                        Stego<span className="text-cyber-accent group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyber-accent group-hover:to-indigo-500 transition-all duration-500">Lock</span>
                                    </h1>
                                    <div className="h-1.5 w-24 bg-cyber-accent mx-auto rounded-full shadow-glow-cyan" />
                                    <p className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                        Advanced steganographic security layer.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Area - Travelling at the back with smooth fade */}
                <div 
                    className={`flex-1 flex items-center justify-center p-6 sm:p-12 transition-all duration-1000 ease-in-out z-10 ${
                        isLogin ? 'lg:pr-[50%]' : 'lg:pl-[50%]'
                    }`}
                >
                    <div 
                        className={`w-full max-w-md transition-all duration-500 ${
                            isTransitioning ? 'opacity-0 scale-95 blur-sm translate-y-4' : 'opacity-100 scale-100 blur-0 translate-y-0'
                        }`}
                    >
                        <div className="lg:hidden text-center mb-12">
                            <Link href="/" className="group inline-block">
                                <div className="relative inline-flex items-center justify-center p-3 bg-gradient-to-br from-cyber-accent via-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-cyan-500/40 dark:shadow-[0_0_20px_rgba(34,211,238,0.6)] group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                    <Shield className="size-8 text-white drop-shadow-md relative z-10" />
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                                <h1 className="text-4xl font-[900] text-slate-900 dark:text-white tracking-tighter leading-[0.85] transform group-hover:scale-105 inline-block group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyber-accent group-hover:to-indigo-500 transition-all duration-300">
                                    Stego<span className="text-cyber-accent group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyber-accent group-hover:to-indigo-500 transition-all duration-300">Lock</span>
                                </h1>
                            </Link>
                        </div>

                        <div className="glass-panel p-10 rounded-[3rem] border-slate-200 dark:border-cyber-border/50 shadow-2xl bg-white/80 dark:bg-cyber-surface/10 backdrop-blur-3xl transition-all hover:border-cyber-accent">
                            {currentChildren}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

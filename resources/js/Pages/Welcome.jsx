import { Head, Link } from '@inertiajs/react';
import { Shield, Lock, Layers, EyeOff, Share2, FileText, CheckCircle, ArrowRight, Github, ExternalLink, Users, Target, Info, Moon, Sun } from 'lucide-react';
import { DecorativeBackground } from '@/Components/DecorativeBackground';
import { useState, useEffect } from 'react';

export default function Welcome({ auth, laravelVersion, phpVersion }) {
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('stegolock_theme');
            return saved ? saved === 'dark' : true;
        }
        return true;
    });

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('stegolock_theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('stegolock_theme', 'light');
        }
    }, [darkMode]);

    return (
        <div className="relative min-h-screen bg-white dark:bg-cyber-void selection:bg-cyber-accent selection:text-white dark:selection:text-cyber-void transition-colors duration-300">
            <Head title="StegoLock - Secure Document Storage" />
            
            <DecorativeBackground />

            {/* Navigation */}
            <nav className="sticky top-0 z-50 glass-header">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="bg-cyber-accent p-1.5 rounded-lg shadow-lg dark:shadow-glow-cyan">
                                <Shield className="size-6 text-white dark:text-cyber-void" />
                            </div>
                            <span className="text-xl font-[900] text-slate-900 dark:text-white tracking-tighter leading-[0.85] scale-y-90 transform origin-left">
                                Stego<span className="text-cyber-accent">Lock</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setDarkMode(!darkMode)}
                                className="p-2 text-slate-400 hover:text-cyber-accent transition-colors"
                            >
                                {darkMode ? <Moon className="size-5" /> : <Sun className="size-5" />}
                            </button>
                            {auth.user ? (
                                <Link
                                    href={route('myDocuments')}
                                    className="btn-cyber"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-cyber-accent transition"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="btn-cyber"
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            <main>
                {/* Hero Section */}
                <section className="relative pt-20 pb-24 overflow-hidden">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col lg:flex-row items-center gap-12">
                            <div className="flex-1 text-center lg:text-left space-y-8 max-w-2xl">
                                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-cyber-surface/50 border border-cyber-accent/30 text-cyber-accent text-sm font-medium animate-fade-in backdrop-blur-sm">
                                    <span className="flex h-2 w-2 rounded-full bg-cyber-accent mr-2 animate-pulse shadow-glow-cyan"></span>
                                    Reconstruction-Dependent Security
                                </div>
                                <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
                                    Secure Digital Storage <br />
                                    <span className="text-cyber-accent-dark dark:text-glow-cyan">
                                        Through Invisibility.
                                    </span>
                                </h1>
                                <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                                    StegoLock strengthens protection against unauthorized access through a hybrid cryptography-steganography model. Your documents aren't just encrypted—they're fragmented and hidden.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                                    <Link
                                        href={route('register')}
                                        className="w-full sm:w-auto px-8 py-4 bg-cyber-accent text-white dark:text-cyber-void rounded-2xl font-bold text-lg hover:bg-slate-900 dark:hover:bg-white transition shadow-lg dark:shadow-glow-cyan-strong flex items-center justify-center gap-2"
                                    >
                                        Secure Your Documents <ArrowRight className="size-5" />
                                    </Link>
                                    <a
                                        href="#how-it-works"
                                        className="w-full sm:w-auto px-8 py-4 bg-slate-100 dark:bg-cyber-surface/50 text-slate-900 dark:text-white border border-slate-200 dark:border-cyber-border rounded-2xl font-bold text-lg hover:bg-slate-200 dark:hover:bg-cyber-surface transition backdrop-blur-md flex items-center justify-center gap-2"
                                    >
                                        Learn More
                                    </a>
                                </div>
                            </div>
                            <div className="flex-1 relative animate-float">
                                <div className="absolute inset-0 bg-cyber-accent/10 blur-[100px] rounded-full"></div>
                                <img
                                    src="/assets/images/stegolock_hero.png"
                                    alt="StegoLock Security Model"
                                    className="relative z-10 w-full max-w-lg mx-auto rounded-3xl shadow-2xl border border-cyber-border/50 backdrop-blur-sm bg-cyber-surface/20"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* How it Works Section */}
                <section id="how-it-works" className="py-24 bg-slate-50 dark:bg-cyber-surface/20 border-y border-slate-200 dark:border-cyber-border/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                            <h2 className="text-sm font-bold tracking-widest text-cyber-accent-dark dark:text-cyber-accent uppercase">The Security Pipeline</h2>
                            <h3 className="text-4xl font-bold text-slate-900 dark:text-white">How StegoLock Protects You</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-lg">Our reconstruction-dependent model ensures that partial access provides no meaningful data to unauthorized parties.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                            {/* Connector Line (Desktop) */}
                            <div className="hidden md:block absolute top-1/3 left-1/4 right-1/4 h-0.5 border-t-2 border-dashed border-slate-200 dark:border-cyber-accent/20 -z-0"></div>
                            
                            <div className="glass-panel p-8 rounded-3xl space-y-6 hover:border-cyber-accent/50 dark:hover:shadow-glow-cyan transition duration-300 relative z-10 group bg-white dark:bg-transparent">
                                <div className="bg-cyber-accent size-14 rounded-2xl flex items-center justify-center shadow-lg dark:shadow-glow-cyan group-hover:scale-110 transition-transform">
                                    <Lock className="size-7 text-white dark:text-cyber-void" />
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 dark:text-white">AES-GCM Encryption</h4>
                                <p className="text-slate-600 dark:text-slate-400">Secure documents using Advanced Encryption Standard in Galois/Counter Mode, ensuring both confidentiality and data integrity.</p>
                            </div>

                            <div className="glass-panel p-8 rounded-3xl space-y-6 hover:border-cyber-accent/50 dark:hover:shadow-glow-cyan transition duration-300 relative z-10 group bg-white dark:bg-transparent">
                                <div className="bg-slate-100 dark:bg-slate-700 size-14 rounded-2xl flex items-center justify-center shadow-md dark:shadow-lg border border-slate-200 dark:border-slate-600 group-hover:scale-110 transition-transform">
                                    <Layers className="size-7 text-cyber-accent-dark dark:text-cyber-accent" />
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 dark:text-white">Intelligent Segmentation</h4>
                                <p className="text-slate-600 dark:text-slate-400">The encrypted file is split into multiple segments, making it structurally impossible to decrypt without all pieces.</p>
                            </div>

                            <div className="glass-panel p-8 rounded-3xl space-y-6 hover:border-cyber-accent/50 dark:hover:shadow-glow-cyan transition duration-300 relative z-10 group bg-white dark:bg-transparent">
                                <div className="bg-slate-100 dark:bg-slate-700 size-14 rounded-2xl flex items-center justify-center shadow-md dark:shadow-lg border border-slate-200 dark:border-slate-600 group-hover:scale-110 transition-transform">
                                    <EyeOff className="size-7 text-cyber-accent-dark dark:text-cyber-accent" />
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 dark:text-white">Stegano-Embedding</h4>
                                <p className="text-slate-600 dark:text-slate-400">Fragments are concealed within ordinary-looking cover files (images/text) and scattered across cloud storage.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Objectives & Study Details */}
                <section className="py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col lg:flex-row gap-16">
                            <div className="flex-1 space-y-12">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-cyber-accent/10 p-2 rounded-lg border border-cyber-accent/20">
                                            <Target className="size-6 text-cyber-accent" />
                                        </div>
                                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">Study Objectives</h3>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic border-l-4 border-cyber-accent/50 pl-6 py-2 bg-slate-50 dark:bg-cyber-surface/30 rounded-r-xl">
                                        "The main objective is to develop StegoLock, a cloud-based web application that strengthens protection against unauthorized access through a reconstruction-dependent security model."
                                    </p>
                                    <ul className="space-y-4">
                                        {[
                                            "Implement AES-based encryption with KDF-based key management.",
                                            "Design segmentation and steganographic embedding processes.",
                                            "Integrate access control and secure sharing mechanisms.",
                                            "Evaluate using ISO/IEC 25010 quality characteristics."
                                        ].map((obj, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <div className="mt-1.5 bg-cyber-accent size-1.5 rounded-full shrink-0 shadow-glow-cyan"></div>
                                                <span className="text-slate-500 dark:text-slate-400">{obj}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="flex-1 space-y-12">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
                                            <Users className="size-6 text-cyber-accent" />
                                        </div>
                                        <h3 className="text-3xl font-bold text-white">Primary Beneficiaries</h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="glass-panel p-6 rounded-2xl hover:border-cyber-accent/30 transition">
                                            <h4 className="font-bold text-white mb-2">Organizations</h4>
                                            <p className="text-sm text-slate-400">Secure management of confidential records for healthcare, legal, and government agencies.</p>
                                        </div>
                                        <div className="glass-panel p-6 rounded-2xl hover:border-cyber-accent/30 transition">
                                            <h4 className="font-bold text-white mb-2">Professionals</h4>
                                            <p className="text-sm text-slate-400">Individuals storing sensitive data with guaranteed confidentiality and integrity.</p>
                                        </div>
                                        <div className="glass-panel p-6 rounded-2xl hover:border-cyber-accent/30 transition sm:col-span-2">
                                            <h4 className="font-bold text-white mb-2">Future Researchers</h4>
                                            <p className="text-sm text-slate-400">A reference for hybrid security systems balancing protection, usability, and key management.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call to Action */}
                <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-gradient-to-br from-slate-100 to-white dark:from-cyber-surface dark:to-cyber-void rounded-[3rem] p-12 lg:p-20 text-center space-y-8 relative overflow-hidden border border-slate-200 dark:border-cyber-border shadow-2xl transition-all duration-300">
                        {/* Decorative Circle */}
                        <div className="absolute -top-20 -right-20 w-80 h-80 bg-cyber-accent/10 rounded-full blur-[100px]"></div>
                        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-cyber-accent/5 rounded-full blur-[100px]"></div>
                        
                        <h3 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white relative z-10">Ready to secure your documents?</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-lg lg:text-xl max-w-2xl mx-auto relative z-10">
                            Join organizations and professionals who trust StegoLock for their most sensitive digital assets.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                            <Link
                                href={route('register')}
                                className="px-10 py-5 bg-cyber-accent text-white dark:text-cyber-void rounded-2xl font-bold text-xl hover:bg-slate-900 dark:hover:bg-white transition shadow-lg dark:shadow-glow-cyan"
                            >
                                Get Started Free
                            </Link>
                            <Link
                                href={route('login')}
                                className="px-10 py-5 bg-slate-100 dark:bg-cyber-surface text-slate-900 dark:text-white border border-slate-200 dark:border-cyber-border rounded-2xl font-bold text-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-slate-50 dark:bg-cyber-void border-t border-slate-200 dark:border-cyber-border/50 pt-20 pb-10 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-2 space-y-6">
                            <div className="flex items-center gap-2">
                                <div className="bg-cyber-accent p-1.5 rounded-lg">
                                    <Shield className="size-6 text-white dark:text-cyber-void" />
                                </div>
                                <span className="text-xl font-[900] text-slate-900 dark:text-white tracking-tighter leading-[0.85] scale-y-90 transform origin-left ml-2">Stego<span className="text-cyber-accent">Lock</span></span>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 max-w-md">
                                A capstone project focused on advancing digital document security through hybrid cryptography and steganography.
                            </p>
                            <div className="flex gap-4">
                                <a href="#" className="text-slate-400 hover:text-cyber-accent transition"><Github className="size-6" /></a>
                                <a href="#" className="text-slate-400 hover:text-cyber-accent transition"><Share2 className="size-6" /></a>
                                <a href="#" className="text-slate-400 hover:text-cyber-accent transition"><Info className="size-6" /></a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-6">Quick Links</h4>
                            <ul className="space-y-4 text-slate-500 dark:text-slate-400">
                                <li><Link href={route('login')} className="hover:text-cyber-accent transition">Login</Link></li>
                                <li><Link href={route('register')} className="hover:text-cyber-accent transition">Register</Link></li>
                                <li><a href="#how-it-works" className="hover:text-cyber-accent transition">How it Works</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-6">Technologies</h4>
                            <ul className="space-y-4 text-slate-500 dark:text-slate-400">
                                <li className="flex items-center gap-2 text-sm"><div className="size-1 bg-cyber-accent rounded-full"></div> AES-256 GCM</li>
                                <li className="flex items-center gap-2 text-sm"><div className="size-1 bg-cyber-accent rounded-full"></div> KDF</li>
                                <li className="flex items-center gap-2 text-sm"><div className="size-1 bg-cyber-accent rounded-full"></div> Steganography</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-200 dark:border-cyber-border/30 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-slate-500 text-sm">
                            © {new Date().getFullYear()} StegoLock Capstone Project. All rights reserved.
                        </p>
                        <div className="flex gap-8 text-sm text-slate-500">
                            <span className="flex items-center gap-2">Laravel v{laravelVersion}</span>
                            <span className="flex items-center gap-2">PHP v{phpVersion}</span>
                        </div>
                    </div>
                </div>
            </footer>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                    100% { transform: translateY(0px); }
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-fade-in {
                    animation: fade-in 1s ease-out forwards;
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .animate-bounce-slow {
                    animation: bounce-slow 4s ease-in-out infinite;
                }
            `}} />
        </div>
    );
}

import { Head, Link } from '@inertiajs/react';
import { Shield, Lock, Layers, EyeOff, Share2, FileText, CheckCircle, ArrowRight, Github, ExternalLink, Users, Target, Info } from 'lucide-react';
import { DecorativeBackground } from '@/Components/DecorativeBackground';

export default function Welcome({ auth, laravelVersion, phpVersion }) {
    return (
        <div className="relative min-h-screen bg-white selection:bg-indigo-600 selection:text-white">
            <Head title="StegoLock - Secure Document Storage" />
            
            <DecorativeBackground />

            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-200/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-1.5 rounded-lg shadow-sm">
                                <Shield className="size-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                                StegoLock
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            {auth.user ? (
                                <Link
                                    href={route('myDocuments')}
                                    className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition shadow-md shadow-indigo-200"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-indigo-600 transition"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition shadow-md shadow-indigo-200"
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
                                <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium animate-fade-in">
                                    <span className="flex h-2 w-2 rounded-full bg-indigo-600 mr-2 animate-pulse"></span>
                                    Reconstruction-Dependent Security
                                </div>
                                <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
                                    Secure Digital Storage <br />
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                                        Through Invisibility.
                                    </span>
                                </h1>
                                <p className="text-xl text-gray-600 leading-relaxed">
                                    StegoLock strengthens protection against unauthorized access through a hybrid cryptography-steganography model. Your documents aren't just encrypted—they're fragmented and hidden.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                                    <Link
                                        href={route('register')}
                                        className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition shadow-xl shadow-indigo-200 flex items-center justify-center gap-2"
                                    >
                                        Secure Your Documents <ArrowRight className="size-5" />
                                    </Link>
                                    <a
                                        href="#how-it-works"
                                        className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-2xl font-bold text-lg hover:bg-gray-50 transition flex items-center justify-center gap-2"
                                    >
                                        Learn More
                                    </a>
                                </div>
                            </div>
                            <div className="flex-1 relative animate-float">
                                <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full"></div>
                                <img
                                    src="/assets/images/stegolock_hero.png"
                                    alt="StegoLock Security Model"
                                    className="relative z-10 w-full max-w-lg mx-auto rounded-3xl shadow-2xl border border-white/50"
                                />
                                {/* Floating stats or elements */}
                                <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 hidden md:block animate-bounce-slow">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 p-2 rounded-lg">
                                            <CheckCircle className="size-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 font-medium">Encryption</p>
                                            <p className="text-sm font-bold text-gray-900">AES-256 GCM</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How it Works Section */}
                <section id="how-it-works" className="py-24 bg-gray-50/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                            <h2 className="text-sm font-bold tracking-widest text-indigo-600 uppercase">The Security Pipeline</h2>
                            <h3 className="text-4xl font-bold text-gray-900">How StegoLock Protects You</h3>
                            <p className="text-gray-600 text-lg">Our reconstruction-dependent model ensures that partial access provides no meaningful data to unauthorized parties.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                            {/* Connector Line (Desktop) */}
                            <div className="hidden md:block absolute top-1/3 left-1/4 right-1/4 h-0.5 border-t-2 border-dashed border-indigo-200 -z-0"></div>
                            
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6 hover:shadow-xl hover:-translate-y-1 transition duration-300 relative z-10">
                                <div className="bg-indigo-600 size-14 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                                    <Lock className="size-7 text-white" />
                                </div>
                                <h4 className="text-xl font-bold text-gray-900">AES-GCM Encryption</h4>
                                <p className="text-gray-600">Secure documents using Advanced Encryption Standard in Galois/Counter Mode, ensuring both confidentiality and data integrity.</p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6 hover:shadow-xl hover:-translate-y-1 transition duration-300 relative z-10">
                                <div className="bg-purple-600 size-14 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                                    <Layers className="size-7 text-white" />
                                </div>
                                <h4 className="text-xl font-bold text-gray-900">Intelligent Segmentation</h4>
                                <p className="text-gray-600">The encrypted file is split into multiple segments, making it structurally impossible to decrypt without all pieces.</p>
                            </div>

                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6 hover:shadow-xl hover:-translate-y-1 transition duration-300 relative z-10">
                                <div className="bg-blue-600 size-14 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                                    <EyeOff className="size-7 text-white" />
                                </div>
                                <h4 className="text-xl font-bold text-gray-900">Stegano-Embedding</h4>
                                <p className="text-gray-600">Fragments are concealed within ordinary-looking cover files (images/text) and scattered across cloud storage.</p>
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
                                        <div className="bg-indigo-100 p-2 rounded-lg">
                                            <Target className="size-6 text-indigo-600" />
                                        </div>
                                        <h3 className="text-3xl font-bold text-gray-900">Study Objectives</h3>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed italic border-l-4 border-indigo-200 pl-6 py-2">
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
                                                <div className="mt-1.5 bg-indigo-600 size-1.5 rounded-full shrink-0"></div>
                                                <span className="text-gray-700">{obj}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="flex-1 space-y-12">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-100 p-2 rounded-lg">
                                            <Users className="size-6 text-purple-600" />
                                        </div>
                                        <h3 className="text-3xl font-bold text-gray-900">Primary Beneficiaries</h3>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
                                            <h4 className="font-bold text-gray-900 mb-2">Organizations</h4>
                                            <p className="text-sm text-gray-600">Secure management of confidential records for healthcare, legal, and government agencies.</p>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
                                            <h4 className="font-bold text-gray-900 mb-2">Professionals</h4>
                                            <p className="text-sm text-gray-600">Individuals storing sensitive data with guaranteed confidentiality and integrity.</p>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition sm:col-span-2">
                                            <h4 className="font-bold text-gray-900 mb-2">Future Researchers</h4>
                                            <p className="text-sm text-gray-600">A reference for hybrid security systems balancing protection, usability, and key management.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call to Action */}
                <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-indigo-600 rounded-[3rem] p-12 lg:p-20 text-center space-y-8 relative overflow-hidden shadow-2xl shadow-indigo-300">
                        {/* Decorative Circle */}
                        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/30 rounded-full blur-3xl"></div>
                        
                        <h3 className="text-4xl lg:text-5xl font-bold text-white relative z-10">Ready to secure your documents?</h3>
                        <p className="text-indigo-100 text-lg lg:text-xl max-w-2xl mx-auto relative z-10">
                            Join organizations and professionals who trust StegoLock for their most sensitive digital assets.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                            <Link
                                href={route('register')}
                                className="px-10 py-5 bg-white text-indigo-600 rounded-2xl font-bold text-xl hover:bg-indigo-50 transition shadow-lg"
                            >
                                Get Started Free
                            </Link>
                            <Link
                                href={route('login')}
                                className="px-10 py-5 bg-indigo-700 text-white border border-indigo-500 rounded-2xl font-bold text-xl hover:bg-indigo-800 transition"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 pt-20 pb-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-2 space-y-6">
                            <div className="flex items-center gap-2">
                                <div className="bg-indigo-600 p-1.5 rounded-lg">
                                    <Shield className="size-6 text-white" />
                                </div>
                                <span className="text-xl font-bold text-gray-900">StegoLock</span>
                            </div>
                            <p className="text-gray-500 max-w-md">
                                A capstone project focused on advancing digital document security through hybrid cryptography and steganography.
                            </p>
                            <div className="flex gap-4">
                                <a href="#" className="text-gray-400 hover:text-indigo-600 transition"><Github className="size-6" /></a>
                                <a href="#" className="text-gray-400 hover:text-indigo-600 transition"><Share2 className="size-6" /></a>
                                <a href="#" className="text-gray-400 hover:text-indigo-600 transition"><Info className="size-6" /></a>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-6">Quick Links</h4>
                            <ul className="space-y-4 text-gray-500">
                                <li><Link href={route('login')} className="hover:text-indigo-600 transition">Login</Link></li>
                                <li><Link href={route('register')} className="hover:text-indigo-600 transition">Register</Link></li>
                                <li><a href="#how-it-works" className="hover:text-indigo-600 transition">How it Works</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-6">Technologies</h4>
                            <ul className="space-y-4 text-gray-500">
                                <li className="flex items-center gap-2 text-sm"><div className="size-1 bg-indigo-400 rounded-full"></div> AES-256 GCM</li>
                                <li className="flex items-center gap-2 text-sm"><div className="size-1 bg-indigo-400 rounded-full"></div> RSA / KDF</li>
                                <li className="flex items-center gap-2 text-sm"><div className="size-1 bg-indigo-400 rounded-full"></div> Steganography</li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-100 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
                        <p className="text-gray-400 text-sm">
                            © {new Date().getFullYear()} StegoLock Capstone Project. All rights reserved.
                        </p>
                        <div className="flex gap-8 text-sm text-gray-400">
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

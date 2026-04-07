import React, { useState } from 'react';
import { Shield, ChevronRight, UserPlus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [role, setRole] = useState('Researcher');
    const navigate = useNavigate();
    const roles = ['Administrator', 'Researcher', 'Environmental Scientist', 'Wildlife Authority'];

    const toggleMode = () => setIsLogin(!isLogin);

    const handleAuth = () => {
        // In a real app, you'd validate credentials here
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 bg-forest-bg bg-cover bg-center">
                <div className="absolute inset-0 bg-dna-deep/60 backdrop-blur-[2px]"></div>
            </div>

            {/* Header */}
            <div className="absolute top-8 left-8 flex items-center space-x-3 text-white">
                <div className="w-10 h-10 bg-dna-emerald rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                    <Shield className="w-6 h-6" />
                </div>
                <h1 className="text-xl font-bold tracking-tight">BioScope <span className="text-slate-400 font-light">| AI Biodiversity Intelligence</span></h1>
            </div>

            {/* Auth Card */}
            <div className="glass-card w-full max-w-md p-8 relative z-10 animate-fade-in shadow-2xl">
                <h2 className="text-2xl font-bold text-center mb-1 text-white">
                    {isLogin ? 'Login Screen' : 'Create Account'}
                </h2>
                <div className="w-12 h-1 bg-dna-emerald mx-auto mb-8 rounded-full"></div>

                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                    {!isLogin && (
                        <div className="space-y-2 animate-slide-down">
                            <label className="text-sm font-medium text-slate-300">Full Name</label>
                            <input
                                type="text"
                                className="glass-input w-full text-white"
                                placeholder="Enter your full name"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Email</label>
                        <input
                            type="email"
                            className="glass-input w-full text-white"
                            placeholder="Enter your email"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Password</label>
                        <input
                            type="password"
                            className="glass-input w-full text-white"
                            placeholder="Enter your password"
                        />
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-medium text-slate-300">Role</label>
                        <div className="flex flex-wrap gap-2">
                            {roles.map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => setRole(r)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${role === r
                                        ? 'bg-dna-emerald text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)]'
                                        : 'bg-white/5 text-slate-400 hover:bg-white/10'
                                        }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isLogin && (
                        <div className="text-center">
                            <button type="button" className="text-xs text-dna-cyan hover:underline transition-all">
                                Forgot Password?
                            </button>
                        </div>
                    )}

                    <div className="pt-2">
                        <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mb-6">
                            <div className={`bg-dna-emerald h-full transition-all duration-500 ${isLogin ? 'w-1/3' : 'w-2/3'} shadow-[0_0_10px_rgba(16,185,129,0.5)]`}></div>
                        </div>

                        <button
                            type="button"
                            className="btn-primary w-full flex items-center justify-center space-x-2"
                            onClick={handleAuth}
                        >
                            <span>{isLogin ? 'Login' : 'Register'}</span>
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="text-sm text-slate-400">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}
                        <button
                            onClick={toggleMode}
                            className="ml-2 text-dna-emerald font-bold hover:underline transition-all inline-flex items-center"
                        >
                            {isLogin ? (
                                <>
                                    <UserPlus className="w-3 h-3 mr-1" /> Register Now
                                </>
                            ) : (
                                <>
                                    <ArrowLeft className="w-3 h-3 mr-1" /> Back to Login
                                </>
                            )}
                        </button>
                    </p>
                </div>
            </div>

            {/* Footer Info */}
            <div className="absolute bottom-8 text-slate-500 text-xs text-center w-full">
                © 2026 BioScope – AI Biodiversity Intelligence System. All rights reserved.
            </div>
        </div>
    );
};

export default Login;

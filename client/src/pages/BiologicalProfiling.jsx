import React, { useState } from 'react';
import { 
    Globe, 
    Zap, 
    Fingerprint
} from 'lucide-react';

const BiologicalProfiling = () => {
    return (
        <div className="w-full h-[calc(100vh-180px)] min-h-[700px] flex flex-col space-y-4 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-dna-emerald/20 rounded-2xl flex items-center justify-center border border-dna-emerald/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                        <Fingerprint className="w-7 h-7 text-dna-emerald" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-dna-emerald to-dna-cyan bg-clip-text text-transparent">
                            Biological Profiling
                        </h1>
                        <p className="text-slate-400 mt-1 uppercase text-[10px] font-black tracking-[0.2em]">
                            Advanced Genomic Identification & AI Profiling
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <div className="bg-dna-emerald/10 border border-dna-emerald/20 px-4 py-2 rounded-xl">
                        <p className="text-[10px] font-black text-dna-emerald uppercase tracking-widest flex items-center">
                            <Zap className="w-3 h-3 mr-2" /> Neural Engine Online
                        </p>
                    </div>
                </div>
            </div>

            {/* Dashboard Iframe (Streamlit) */}
            <div className="flex-1 glass-card border-white/5 bg-slate-900/40 backdrop-blur-md rounded-2xl border overflow-hidden relative">
                <iframe
                    src="http://localhost:8501/?embed=true"
                    title="eDNA Biodiversity AI Explorer"
                    className="w-full h-full border-0 rounded-xl"
                    style={{ background: 'transparent' }}
                />
            </div>

            {/* Status Footer */}
            <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] rounded-xl border border-white/5">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center">
                    <Globe className="w-3 h-3 mr-2 text-dna-cyan" /> Integrated Genomic Intelligence Layer v1.5
                </p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    Port 8501 Service Active
                </p>
            </div>
        </div>
    );
};

export default BiologicalProfiling;

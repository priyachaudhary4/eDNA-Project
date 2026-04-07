import React from 'react';
import { Settings, Construction } from 'lucide-react';

const PlaceholderPage = ({ title }) => {
    return (
        <div className="h-full flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
            <div className="w-24 h-24 bg-dna-emerald/10 rounded-full flex items-center justify-center text-dna-emerald animate-pulse">
                <Construction className="w-12 h-12" />
            </div>
            <div>
                <h2 className="text-3xl font-bold text-white">{title}</h2>
                <p className="text-slate-400 mt-2 max-w-md mx-auto">
                    We are currently engineering this module for high-throughput biodiversity intelligence. This feature will be available in the next research cycle.
                </p>
            </div>
            <div className="flex space-x-4">
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-500 font-mono">
                    STATUS: IN_DEVELOPMENT
                </div>
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-500 font-mono">
                    PHASE: ALPHA-0.4
                </div>
            </div>
        </div>
    );
};

export default PlaceholderPage;

import React, { useState, useEffect, useRef } from 'react';
import {
    Fingerprint,
    Upload,
    Dna,
    Search,
    Activity,
    FileText,
    Download,
    Database,
    ShieldCheck,
    Globe,
    RefreshCw,
    X,
    ChevronRight,
    Trophy,
    ExternalLink
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../config/api';

const BiologicalProfiling = () => {
    const [file, setFile] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState([]);
    const [speciesList, setSpeciesList] = useState([]);
    const [wikipediaInfo, setWikipediaInfo] = useState(null);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    // Fetch species library on mount
    useEffect(() => {
        const fetchSpecies = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/dna/species`);
                setSpeciesList(response.data.species || []);
            } catch (err) {
                console.error("Failed to load species library");
            }
        };
        fetchSpecies();
    }, []);

    const fetchWikipediaInfo = async (speciesName) => {
        try {
            const formattedName = speciesName.replace(/ /g, "_");
            const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${formattedName}`;
            const response = await axios.get(url, { timeout: 5000 });

            if (response.status === 200) {
                return {
                    title: response.data.title,
                    extract: response.data.extract,
                    imageUrl: response.data.thumbnail?.source,
                    wikiUrl: response.data.content_urls?.desktop?.page
                };
            }
        } catch (err) {
            console.warn("Wikipedia fetch failed for:", speciesName);
        }
        return null;
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
        }
    };

    const runAnalysis = async () => {
        if (!file) return;

        setAnalyzing(true);
        setError(null);
        setResults([]);
        setWikipediaInfo(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/dna/analyze`, formData);
            const data = response.data;

            if (data.error) throw new Error(data.error);

            setResults(data.results || []);

            // Identify dominant species for Wikipedia profiling
            if (data.results && data.results.length > 0) {
                // Find the most frequent species in the results
                const counts = {};
                let dominant = data.results[0].Species;
                let max = 0;

                data.results.forEach(r => {
                    counts[r.Species] = (counts[r.Species] || 0) + 1;
                    if (counts[r.Species] > max) {
                        max = counts[r.Species];
                        dominant = r.Species;
                    }
                });

                const wiki = await fetchWikipediaInfo(dominant);
                setWikipediaInfo(wiki);
            }
        } catch (err) {
            setError(err.message || "Neural Engine Failure");
        } finally {
            setAnalyzing(false);
        }
    };

    const getMetrics = () => {
        if (!results.length) return { total: 0, high: 0, top: "None" };
        const high = results.filter(r => r.Status === "✅ Detected").length;
        const dominant = results.reduce((acc, curr) => {
            acc[curr.Species] = (acc[curr.Species] || 0) + 1;
            return acc;
        }, {});
        const sorted = Object.entries(dominant).sort((a, b) => b[1] - a[1]);
        return {
            total: results.length,
            high: high,
            top: sorted[0] ? sorted[0][0] : "None"
        };
    };

    const metrics = getMetrics();

    return (
        <div className="w-full flex flex-col space-y-6 bg-[#0f172a] text-white min-h-screen p-4 rounded-3xl overflow-hidden border border-white/5">
            {/* Header */}
            <header className="flex flex-col space-y-1 mb-4 border-b border-white/5 pb-6">
                <div className="flex items-center space-x-3">
                    <Dna className="w-8 h-8 text-[#10b981]" />
                    <h1 className="text-3xl font-extrabold tracking-tight text-[#10b981]">
                        eDNA Biodiversity AI Explorer
                    </h1>
                </div>
                <p className="text-slate-400 text-sm italic ml-11">
                    Zero-shot Species Detection via <span className="text-white font-mono">DNABERT-2</span> Embedding Similarity
                </p>
            </header>

            <div className="flex flex-col lg:flex-row gap-8 flex-1">
                {/* Sidebar (col1) */}
                <aside className="lg:w-1/3 space-y-8">
                    {/* Upload Section */}
                    <section className="space-y-4">
                        <div className="flex items-center space-x-2 text-[#10b981]">
                            <Upload className="w-5 h-5" />
                            <h2 className="text-lg font-bold">Upload Sample</h2>
                        </div>
                        <p className="text-xs text-slate-400">
                            Provide eDNA sequencing data from hair, blood, soil, or water samples.
                        </p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            Supported formats: .fasta, .csv, .txt
                        </p>

                        <div className="bg-[#1e293b] rounded-2xl border border-white/10 p-1 relative">
                            <div
                                onClick={() => !analyzing && fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center space-y-3 cursor-pointer transition-all ${analyzing ? 'opacity-50' : 'hover:border-[#10b981]/50 bg-black/20'}`}
                            >
                                <div className="flex items-center space-x-3 w-full justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-slate-800 rounded-lg">
                                            <Upload className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-bold text-white">Drag and drop file here</p>
                                            <p className="text-[9px] text-slate-500 uppercase font-black">Limit 200MB per file • FASTA, CSV, TXT</p>
                                        </div>
                                    </div>
                                    <button className="px-3 py-1.5 bg-[#1e293b] border border-white/10 rounded-lg text-[10px] font-bold hover:bg-white/5">
                                        Browse files
                                    </button>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>

                            {file && (
                                <div className="p-4 flex items-center justify-between border-t border-white/5 mt-1 bg-black/10 rounded-b-2xl animate-in slide-in-from-top-2">
                                    <div className="flex items-center space-x-3 overflow-hidden">
                                        <FileText className="w-4 h-4 text-[#10b981] flex-shrink-0" />
                                        <div className="overflow-hidden">
                                            <p className="text-xs font-bold text-slate-200 truncate">{file.name}</p>
                                            <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setFile(null)} className="p-1 hover:bg-white/10 rounded-full">
                                        <X className="w-4 h-4 text-slate-500" />
                                    </button>
                                </div>
                            )}

                            <div className="p-2">
                                <button
                                    onClick={results.length > 0 ? () => { setResults([]); setFile(null); setWikipediaInfo(null); } : runAnalysis}
                                    disabled={!file || analyzing}
                                    className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center transition-all ${analyzing
                                            ? 'bg-slate-800 text-slate-500 cursor-wait'
                                            : results.length > 0
                                                ? 'bg-black/40 text-blue-400 border border-blue-500/30 hover:bg-blue-500/10'
                                                : file
                                                    ? 'bg-[#10b981] text-black shadow-lg shadow-[#10b981]/10'
                                                    : 'bg-slate-800 text-slate-600'
                                        }`}
                                >
                                    {analyzing ? (
                                        <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                                    ) : results.length > 0 ? (
                                        <Search className="w-3 h-3 mr-2" />
                                    ) : (
                                        <Activity className="w-3 h-3 mr-2" />
                                    )}
                                    {analyzing ? 'Analyzing...' : results.length > 0 ? 'Reset / Clear' : 'Run Biological Map'}
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Species Database Section */}
                    <section className="space-y-4 pt-4">
                        <div className="flex items-center space-x-2 text-[#10b981]">
                            <Database className="w-5 h-5" />
                            <h2 className="text-lg font-bold">Species Database</h2>
                        </div>
                        <p className="text-[10px] font-bold text-slate-300">
                            {speciesList.length} species loaded from reference library:
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase font-black leading-relaxed">
                            Reference species are loaded from <span className="text-blue-400/60 lowercase italic">reference_db.json</span> .
                        </p>
                        <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-hide">
                            {speciesList.map((s, i) => (
                                <span key={i} className="px-2 py-1 bg-black/20 border border-white/5 rounded-md text-[9px] text-slate-400">
                                    {s}
                                </span>
                            ))}
                        </div>
                    </section>
                </aside>

                {/* Main Content (col2) */}
                <main className="lg:w-2/3 space-y-8">
                    <AnimatePresence mode="wait">
                        {!results.length && !analyzing ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-[#10b981]/5 border border-[#10b981]/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-6"
                            >
                                <div className="w-20 h-20 bg-[#10b981]/10 rounded-full flex items-center justify-center">
                                    <ShieldCheck className="w-10 h-10 text-[#10b981]" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-bold">Genomic Profiling Engine Ready</h3>
                                    <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                                        Upload eDNA data to begin high-resolution similarity mapping and taxonomic identification.
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full pt-4">
                                    {[
                                        { t: 'Zero-Shot', d: 'DNA AI Inference' },
                                        { t: '117M Params', d: 'Transformer Model' },
                                        { t: 'Real-time', d: 'KNN Similarity' }
                                    ].map((item, i) => (
                                        <div key={i} className="p-4 bg-black/20 rounded-xl border border-white/5">
                                            <p className="text-[#10b981] font-black text-[10px] uppercase tracking-tighter">{item.t}</p>
                                            <p className="text-slate-500 text-[10px]">{item.d}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ) : analyzing ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-[#1e293b] border border-white/5 rounded-2xl p-20 flex flex-col items-center justify-center space-y-8"
                            >
                                <div className="relative">
                                    <div className="w-24 h-24 border-4 border-[#10b981]/20 rounded-full animate-spin border-t-[#10b981]"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <RefreshCw className="w-8 h-8 text-[#10b981] animate-spin-slow" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-black text-white uppercase tracking-[0.2em] animate-pulse">Running Neural Engine</h3>
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Computing transformer embeddings...</p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-8"
                            >
                                {/* Analysis Success Toast */}
                                <div className="bg-[#10b981]/10 border border-[#10b981]/20 p-4 rounded-xl flex items-center">
                                    <div className="w-2 h-2 bg-[#10b981] rounded-full mr-4 animate-pulse"></div>
                                    <p className="text-sm font-bold text-[#10b981]">Parsed {results.length} sequences successfully.</p>
                                </div>

                                {/* Results Header Section */}
                                <div className="flex items-center space-x-2 text-[#10b981] mb-2">
                                    <Activity className="w-5 h-5" />
                                    <h2 className="text-lg font-bold">Analysis Results</h2>
                                </div>

                                {/* Metrics Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-[#1e293b] border border-white/5 p-6 rounded-2xl flex flex-col justify-between h-[120px]">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Processed</p>
                                        <p className="text-4xl font-black text-white">{metrics.total}</p>
                                    </div>
                                    <div className="bg-[#1e293b] border border-white/5 p-6 rounded-2xl flex flex-col justify-between h-[120px]">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">High Similarity Finds</p>
                                        <p className="text-4xl font-black text-white">{metrics.high}</p>
                                    </div>
                                    <div className="bg-[#1e293b] border border-white/10 p-6 rounded-2xl flex flex-col justify-between h-[120px] relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                                            <Globe className="w-12 h-12" />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Most Common Species</p>
                                        <p className="text-3xl font-black text-white truncate pr-4">{metrics.top}</p>
                                    </div>
                                </div>

                                {/* 1:1 Replicated Wikipedia Profile Section */}
                                {wikipediaInfo && (
                                    <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        <div className="flex items-center space-x-3 text-[#10b981]">
                                            <div className="p-2 bg-[#10b981]/10 rounded-lg">
                                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                                </svg>
                                            </div>
                                            <h2 className="text-2xl font-bold tracking-tight">About {wikipediaInfo.title}</h2>
                                        </div>

                                        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                                            {/* 3D Perspective Mobile Frame */}
                                            {wikipediaInfo.imageUrl && (
                                                <div 
                                                    className="w-[260px] md:w-[300px] lg:w-[320px] flex-shrink-0 relative rounded-[35px] border-[5px] border-[#10b981]/40 shadow-[20px_20px_40px_rgba(0,0,0,0.4)] group/img transition-all duration-700 hover:rotate-0 hover:scale-[1.05] hover:border-[#10b981]/80 hover:shadow-[0_0_60px_rgba(16,185,129,0.3)] cursor-pointer"
                                                    style={{ 
                                                        transform: 'perspective(1200px) rotateY(-10deg) rotateX(5deg)',
                                                        transformStyle: 'preserve-3d'
                                                    }}
                                                >
                                                    {/* Border Sparks Layer */}
                                                    <div className="absolute -inset-[5px] rounded-[35px] pointer-events-none z-20 opacity-0 group-hover/img:opacity-100 transition-opacity duration-500">
                                                        {[...Array(12)].map((_, i) => (
                                                            <div 
                                                                key={i}
                                                                className="absolute animate-pulse"
                                                                style={{
                                                                    width: '4px',
                                                                    height: '4px',
                                                                    backgroundColor: i % 2 === 0 ? '#10b981' : '#38bdf8',
                                                                    boxShadow: `0 0 12px ${i % 2 === 0 ? '#10b981' : '#38bdf8'}, 0 0 20px ${i % 2 === 0 ? '#10b981' : '#38bdf8'}`,
                                                                    borderRadius: '50%',
                                                                    // Position sparks only on the border
                                                                    top: i < 3 ? '-2px' : i < 6 ? '100%' : `${(i - 6) * 33}%`,
                                                                    left: i < 3 ? `${i * 50}%` : i < 6 ? `${(i - 3) * 50}%` : (i < 9 ? '-2px' : '100%'),
                                                                    animationDelay: `${i * 0.2}s`,
                                                                    animationDuration: '1s'
                                                                }}
                                                            />
                                                        ))}
                                                        {/* Spinning border light trail */}
                                                        <div className="absolute inset-0 rounded-[35px] border-2 border-transparent border-t-[#38bdf8] border-r-[#10b981] opacity-40 animate-spin-slow"></div>
                                                    </div>

                                                    {/* Internal Glow on Hover */}
                                                    <div className="absolute inset-0 rounded-[30px] opacity-0 group-hover/img:opacity-100 transition-opacity duration-700 bg-gradient-to-tr from-[#10b981]/10 via-transparent to-white/5 pointer-events-none z-10"></div>
                                                    
                                                    <img
                                                        src={wikipediaInfo.imageUrl}
                                                        alt={wikipediaInfo.title}
                                                        className="w-full h-[320px] md:h-[380px] object-cover rounded-[30px] transition-all duration-700 group-hover/img:scale-105 filter brightness-100 group-hover/img:brightness-110 contrast-110"
                                                    />

                                                    {/* Light Sweep Effect */}
                                                    <div className="absolute inset-0 rounded-[30px] overflow-hidden pointer-events-none">
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-[150%] skew-x-[-25deg] group-hover/img:translate-x-[150%] transition-transform duration-[1200ms] ease-in-out"></div>
                                                    </div>

                                                    {/* Glass Overlay for depth */}
                                                    <div className="absolute inset-0 rounded-[30px] bg-gradient-to-tr from-[#10b981]/15 via-transparent to-white/5 pointer-events-none mix-blend-overlay"></div>
                                                    
                                                    {/* Floating Badge (Species Name) on hover */}
                                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 translate-y-4 opacity-0 group-hover/img:translate-y-0 group-hover/img:opacity-100 transition-all duration-500 bg-black/60 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full z-20 whitespace-nowrap">
                                                        <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
                                                            Taxonomic Profile: {wikipediaInfo.title}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex-1 space-y-8 pt-4">
                                                <p className="text-[17px] text-slate-200 leading-[1.6] font-normal tracking-wide">
                                                    {wikipediaInfo.extract}
                                                </p>
                                                
                                                <a
                                                    href={wikipediaInfo.wikiUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center px-6 py-3.5 bg-[#ff4b4b] hover:bg-[#ff3535] text-white text-sm font-bold rounded-2xl transition-all shadow-xl shadow-red-500/20 hover:translate-y-[-2px] active:scale-95"
                                                >
                                                    <span className="mr-3 text-lg">🚀</span>
                                                    Read more on Wikipedia
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Detailed Findings Table (1:1 styling) */}
                                <div className="space-y-4 pt-4">
                                    <h3 className="text-lg font-bold text-slate-100 italic">Detailed Findings</h3>
                                    <div className="bg-[#1e293b] border border-white/5 rounded-2xl overflow-hidden">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-black/20 text-slate-400 font-black uppercase tracking-widest border-b border-white/5">
                                                <tr>
                                                    <th className="px-6 py-4">ID</th>
                                                    <th className="px-6 py-4">Species</th>
                                                    <th className="px-6 py-4">Embedding Similarity</th>
                                                    <th className="px-6 py-4 text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {results.map((row, i) => (
                                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                                        <td className="px-6 py-4 font-mono text-[10px] text-[#10b981]">{row.ID}</td>
                                                        <td className="px-6 py-4 font-bold">{row.Species}</td>
                                                        <td className="px-6 py-4 font-black">{row.Similarity}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex justify-center">
                                                                <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase flex items-center ${row.Status === '✅ Detected' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-500/30'}`}>
                                                                    {row.Status === '✅ Detected' ? <ShieldCheck className="w-3 h-3 mr-1" /> : null}
                                                                    {row.Status.replace('✅ ', '')}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Top Matches Table (1:1 styling) */}
                                {results.length > 0 && results[0].TopMatches && (
                                    <div className="space-y-4 pt-4">
                                        <h3 className="text-lg font-bold text-slate-100 flex items-center truncate">
                                            <Trophy className="w-5 h-5 mr-2 text-yellow-500" /> Top Matches (First Sequence)
                                        </h3>
                                        <div className="bg-[#1e293b] border border-white/5 rounded-2xl overflow-hidden">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-black/20 text-slate-400 font-black uppercase tracking-widest border-b border-white/5">
                                                    <tr>
                                                        <th className="px-6 py-4">Rank</th>
                                                        <th className="px-6 py-4">Species</th>
                                                        <th className="px-6 py-4">Embedding Similarity</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {results[0].TopMatches.map((match, i) => (
                                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                                            <td className="px-6 py-4">
                                                                {i === 0 ? <span className="text-xl">🥇</span> : i === 1 ? <span className="text-xl">🥈</span> : i === 2 ? <span className="text-xl">🥉</span> : <span className="w-6 h-6 bg-blue-500/20 text-blue-400 rounded-md flex items-center justify-center font-black">{i + 1}</span>}
                                                            </td>
                                                            <td className="px-6 py-4 font-bold">{match.species}</td>
                                                            <td className="px-6 py-4 font-black">{match.similarity}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Report Action Buttons */}
                                <div className="flex flex-col md:flex-row gap-4 pt-6">
                                    <button className="flex-1 bg-[#1e293b] hover:bg-black/30 border border-white/10 text-white font-black uppercase text-[10px] py-4 rounded-xl transition-all shadow-xl hover:translate-y-[-2px] flex items-center justify-center tracking-[0.2em]">
                                        <Download className="w-4 h-4 mr-3 text-blue-400" /> Download CSV Report
                                    </button>
                                    <button className="flex-1 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 border border-[#ef4444]/40 text-[#ef4444] font-black uppercase text-[10px] py-4 rounded-xl transition-all shadow-xl hover:translate-y-[-2px] flex items-center justify-center tracking-[0.2em]">
                                        <FileText className="w-4 h-4 mr-3" /> Download PDF Report
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            {/* Sub-footer matching screenshot vibe */}
            <div className="mt-8 border-t border-white/5 pt-4 flex justify-between items-center px-4">
                <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.3em]">
                    BioScope Neural Core v2.4 • Integrated Intelligence System
                </p>
                <div className="flex space-x-4">
                    <div className="flex items-center space-x-1">
                        <div className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse"></div>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Engine: Online</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BiologicalProfiling;

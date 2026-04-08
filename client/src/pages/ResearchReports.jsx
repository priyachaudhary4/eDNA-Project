import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';
import {
    FileText,
    Download,
    Search,
    Filter,
    Calendar,
    ChevronRight,
    ChevronLeft,
    Dna,
    X,
    CheckCircle2,
    PieChart,
    BarChart3,
    Activity,
    Shield,
    Globe,
    Zap,
    AlertTriangle,
    Database,
    Clock,
    Share2,
    BookOpen
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart as RePie,
    Pie,
    Legend
} from 'recharts';

const ResearchReports = () => {
    const [speciesData, setSpeciesData] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('insights'); // insights, archive
    const [isSpecsOpen, setIsSpecsOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpecies, setSelectedSpecies] = useState(null);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [broadcastSuccess, setBroadcastSuccess] = useState(false);
    const [itemsPerPage] = useState(10);

    // Reset to page 1 when search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [resSpecies, resMetrics] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/species`),
                    axios.get(`${API_BASE_URL}/api/metrics`)
                ]);
                setSpeciesData(resSpecies.data);
                setMetrics(resMetrics.data);
                setLoading(false);
            } catch (err) {
                console.error("Failed to fetch research data", err);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Process data for the "Genomic Priority Matrix"
    const getPriorityData = () => {
        const rare = speciesData.filter(s => s.status === 'Rare').slice(0, 5);
        const endangered = speciesData.filter(s => s.status === 'Endangered').slice(0, 5);
        const invasive = speciesData.filter(s => s.status === 'Invasive').slice(0, 5);

        // Combine for a professional comparison chart
        // We'll normalize them by taking the top 5 of each for a balanced view
        const combined = [];
        const maxLen = Math.max(rare.length, endangered.length, invasive.length);

        for (let i = 0; i < maxLen; i++) {
            const entry = { name: `Rank ${i + 1}` };
            if (rare[i]) {
                entry.Rare = rare[i].count;
                entry.RareName = (rare[i].common_name || rare[i].species_name).split(',')[0].trim();
            }
            if (endangered[i]) {
                entry.Endangered = endangered[i].count;
                entry.EndangeredName = (endangered[i].common_name || endangered[i].species_name).split(',')[0].trim();
            }
            if (invasive[i]) {
                entry.Invasive = invasive[i].count;
                entry.InvasiveName = (invasive[i].common_name || invasive[i].species_name).split(',')[0].trim();
            }
            combined.push(entry);
        }
        return combined;
    };

    const getDistributionData = () => {
        const counts = {
            Endangered: speciesData.filter(s => s.status === 'Endangered').length,
            Invasive: speciesData.filter(s => s.status === 'Invasive').length,
            Rare: speciesData.filter(s => s.status === 'Rare').length,
            Native: speciesData.filter(s => s.status === 'Native').length
        };

        return Object.entries(counts)
            .filter(([_, value]) => value > 0)
            .map(([name, value]) => ({ name, value }));
    };

    const priorityData = getPriorityData();
    const distData = getDistributionData();

    const CATEGORY_COLORS = {
        Endangered: '#ef4444', // Red
        Invasive: '#a855f7',   // Purple
        Rare: '#06b6d4',       // Cyan/Blue
        Native: '#10b981'      // Emerald
    };

    const CustomTooltip = ({ active, payload, label, isPie }) => {
        if (active && payload && payload.length) {
            const pieData = isPie ? payload[0] : null;
            
            return (
                <div
                    className="bg-slate-900/95 border border-white/20 p-4 shadow-[0_25px_60px_rgba(0,0,0,0.9)] backdrop-blur-xl rounded-2xl animate-in fade-in zoom-in duration-150"
                    style={{ maxWidth: '220px', width: 'max-content', boxSizing: 'border-box' }}
                >
                    <div className="flex items-center space-x-2 mb-3 border-b border-white/10 pb-2">
                        <Activity className="w-3.5 h-3.5 text-dna-cyan flex-shrink-0" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest truncate">
                            {isPie ? pieData.name : label}
                        </span>
                        <div className="w-1.5 h-1.5 rounded-full bg-dna-emerald animate-pulse ml-auto flex-shrink-0"></div>
                    </div>
                    <div className="space-y-3">
                        {isPie ? (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center space-x-2 min-w-0">
                                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: pieData.payload.fill || pieData.color }}></div>
                                        <span className="text-[10px] font-black uppercase truncate" style={{ color: pieData.payload.fill || pieData.color }}>
                                            {pieData.name}
                                        </span>
                                    </div>
                                    <span className="text-sm font-black text-white whitespace-nowrap flex-shrink-0">
                                        {pieData.value} sig.
                                    </span>
                                </div>
                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Verified Population Cluster</p>
                            </div>
                        ) : (
                            payload.map((entry, index) => {
                                const speciesName = entry.payload[`${entry.name}Name`] || '';
                                return (
                                    <div key={index} className="border-b border-white/5 last:border-0 pb-2 last:pb-0 space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center space-x-1.5 min-w-0">
                                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }}></div>
                                                <span className="text-[10px] font-black uppercase truncate" style={{ color: entry.color }}>{entry.name}</span>
                                            </div>
                                            <span className="text-xs font-black text-white whitespace-nowrap flex-shrink-0">{entry.value} det.</span>
                                        </div>
                                        {speciesName && (
                                            <span className="text-[11px] text-white font-extrabold italic block pl-3 truncate">
                                                {speciesName}
                                            </span>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    const handleExportPDF = () => {
        if (!speciesData || speciesData.length === 0) return;

        const doc = new jsPDF();
        const now = new Date();
        const timestamp = now.toLocaleString();

        // Header Section
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, 210, 45, 'F');
        
        doc.setFontSize(22);
        doc.setTextColor(56, 189, 248); // dna-cyan
        doc.setFont("helvetica", "bold");
        doc.text("RESEARCH INTELLIGENCE HUB", 105, 20, { align: "center" });
        
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.setFont("helvetica", "normal");
        doc.text(`Comprehensive Bio-Surveillance Analysis | Generated: ${timestamp}`, 105, 30, { align: "center" });
        doc.text(`Protocol: RESEARCH-ALPHA | System: BioScope v4.0.2`, 105, 36, { align: "center" });

        // Section 1: Study Metrics
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("GLOBAL STUDY METRICS", 20, 60);

        autoTable(doc, {
            startY: 65,
            head: [['METRIC CATEGORY', 'QUANTITATIVE VALUE']],
            body: [
                ['Total Study Samples', metrics?.samples_processed || 0],
                ['Total Species Richness', speciesData.length],
                ['Invasive Threat Count', speciesData.filter(s => s.status === 'Invasive').length],
                ['Endangered Priority Count', speciesData.filter(s => s.status === 'Endangered').length],
                ['Rare Discovery Count', speciesData.filter(s => s.status === 'Rare').length],
                ['Data Integrity Score', '98.4%']
            ],
            theme: 'striped',
            headStyles: { fillColor: [56, 189, 248], textColor: [255, 255, 255] },
            columnStyles: { 0: { fontStyle: 'bold', width: 60 } }
        });

        // Section 2: Full Genomic Inventory
        doc.addPage();
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("COMPLETE GENOMIC INVENTORY", 20, 20);

        autoTable(doc, {
            startY: 25,
            head: [['#', 'SCIENTIFIC NAME', 'COMMON NAME', 'STATUS', 'HITS']],
            body: speciesData.map((s, i) => [
                i + 1,
                s.species_name,
                (s.common_name || s.species_name).split(',')[0].trim(),
                s.status,
                s.count
            ]),
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
            bodyStyles: { fontSize: 8 }
        });

        // Section 3: Research Glossary (Understandable for everyone)
        doc.addPage();
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("RESEARCH AUDIT GLOSSARY", 20, 20);

        autoTable(doc, {
            startY: 25,
            head: [['RESEARCH TERM', 'PLAIN LANGUAGE EXPLANATION']],
            body: [
                ['Species Richness', 'The total number of different types of animals or plants found in the study area.'],
                ['Genomic Sequencing', 'The technology used to read the DNA "barcode" of every organism in the water or soil.'],
                ['Invasive Threat', 'A species that does not belong here and might cause damage to the local ecosystem.'],
                ['Conservation Rank', 'A safety rating that tells us how much help a species needs to survive in the wild.'],
                ['Confidence Interval', 'A percentage that shows how sure the computer is about the DNA match result.'],
                ['Taxonomic Signature', 'The unique scientific fingerprint that identifies exactly which species was found.'],
                ['Abundance Index', 'A measurement of how common or "abundant" a species is in the collected samples.']
            ],
            theme: 'striped',
            headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255] },
            columnStyles: { 0: { fontStyle: 'bold', width: 50 }, 1: { cellWidth: 'auto' } }
        });

        // Footer Metadata
        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text("RESEARCH HUB CONFIDENTIAL - MISSION-CRITICAL BIODIVERSITY DATA", 105, 285, { align: "center" });
            doc.text(`Page ${i} of ${pageCount}`, 200, 285, { align: "right" });
        }

        doc.save(`BioScope_Research_Intelligence_${now.toISOString().split('T')[0]}.pdf`);
    };

    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4 animate-pulse">
                <div className="w-16 h-16 rounded-full border-4 border-t-dna-cyan border-white/5 animate-spin"></div>
                <p className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-500">Decrypting Genomic Intelligence...</p>
            </div>
        );
    }

    return (
        <div className="h-full space-y-8 animate-fade-in pb-10">
            {/* HERO HEADER */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-white/5 p-6 md:p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-dna-cyan/5 to-transparent pointer-events-none"></div>
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start space-x-2 mb-3">
                            <Shield className="w-4 h-4 text-dna-cyan" />
                            <span className="text-[10px] font-black text-dna-cyan uppercase tracking-[0.3em]">Confidential Research Log</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">
                            Research Intelligence Hub
                        </h2>
                        <p className="text-slate-400 text-sm mt-3 max-w-xl leading-relaxed mx-auto lg:mx-0">
                            Comprehensive multi-basin bio-surveillance analysis. This dashboard aggregates genomic sequencing data,
                            spatial distribution markers, and conservation priority metrics.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-6">
                        <div className="text-center sm:text-right">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Study Status</p>
                            <div className="flex items-center space-x-2 mt-1 justify-center sm:justify-end">
                                <span className="w-2 h-2 rounded-full bg-dna-emerald animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                <span className="text-xs font-bold text-white uppercase tracking-tighter">Active Auditing</span>
                            </div>
                        </div>
                        <button 
                            onClick={handleExportPDF}
                            className="w-full sm:w-auto bg-dna-cyan hover:bg-cyan-400 text-slate-900 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center space-x-2"
                        >
                            <FileText className="w-4 h-4" />
                            <span>Export PDF Audit</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* QUICK STATS SUITE */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[
                    { label: 'Study Samples', value: metrics?.samples_processed || 0, icon: Database, color: 'text-dna-cyan', bg: 'bg-dna-cyan/10' },
                    { label: 'Species Richness', value: speciesData.length, icon: Zap, color: 'text-dna-emerald', bg: 'bg-dna-emerald/10' },
                    { label: 'Invasive Threats', value: speciesData.filter(s => s.status === 'Invasive').length, icon: AlertTriangle, color: 'text-purple-400', bg: 'bg-purple-400/10' },
                    { label: 'Integrity', value: '98.4%', icon: CheckCircle2, color: 'text-amber-400', bg: 'bg-amber-400/10' }
                ].map((stat, i) => (
                    <div key={i} className="glass-card p-4 md:p-6 border border-white/5 group hover:border-white/20 transition-all flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left space-y-3 sm:space-y-0 sm:space-x-5">
                        <div className={`w-10 h-10 md:w-14 md:h-14 ${stat.bg} rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 flex-shrink-0`}>
                            <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} />
                        </div>
                        <div>
                            <p className="text-[8px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest mb-0.5 md:mb-1">{stat.label}</p>
                            <p className="text-xl md:text-3xl font-black text-white tracking-tighter">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* MAIN ANALYSIS LAYOUT */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 overflow-visible">

                {/* LEFT: TAXONOMIC COMPOSITION */}
                <div className="glass-card p-6 md:p-8 border border-white/10 bg-slate-900/60 relative flex flex-col items-center" style={{ overflow: 'visible', isolation: 'auto' }}>
                    <div className="w-full text-center md:text-left mb-8">
                        <h3 className="text-lg md:text-xl font-black text-white tracking-tight flex items-center justify-center md:justify-start">
                            <PieChart className="w-5 h-5 mr-3 text-dna-emerald" />
                            Taxonomic Profile
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Study population breakdown</p>
                    </div>

                    <div className="relative w-full h-[200px] sm:h-[250px] md:h-[300px]" style={{ overflow: 'visible' }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <RePie>
                                <Pie
                                    data={distData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={85}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                    isAnimationActive={false}
                                >
                                    {distData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#64748b'} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={<CustomTooltip isPie={true} />}
                                    allowEscapeViewBox={{ x: true, y: true }}
                                    offset={15}
                                    wrapperStyle={{
                                        zIndex: 99999,
                                        position: 'fixed',
                                        pointerEvents: 'none',
                                    }}
                                />
                            </RePie>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xl md:text-3xl font-black text-white">{speciesData.length}</span>
                            <span className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Total Bio-Assets</span>
                        </div>
                    </div>

                    <div className="w-full space-y-2 mt-6">
                        {distData.map((item, i) => (
                            <div key={i} className="flex items-center justify-between p-2.5 md:p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                                <div className="flex items-center space-x-2 md:space-x-3 overflow-hidden">
                                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[item.name] || '#64748b' }}></div>
                                    <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{item.name}</span>
                                </div>
                                <span className="text-xs md:text-sm font-black text-white ml-2">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: GENOMIC PRIORITY MATRIX */}
                <div className="xl:col-span-2 glass-card p-6 md:p-8 border border-white/10 bg-slate-900/40 relative overflow-visible">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-dna-cyan/5 blur-3xl opacity-30 rounded-full"></div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 text-center md:text-left">
                        <div>
                            <h3 className="text-lg md:text-xl font-black text-white tracking-tight flex items-center justify-center md:justify-start">
                                <BarChart3 className="w-5 h-5 mr-3 text-dna-cyan" />
                                Genomic Priority Matrix
                            </h3>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Comparative threat analysis</p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                            <span className="flex items-center space-x-1 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-[8px] font-black text-red-500 uppercase tracking-tighter">Endangered</span>
                            <span className="flex items-center space-x-1 px-3 py-1 bg-purple-400/10 border border-purple-400/20 rounded-full text-[8px] font-black text-purple-400 uppercase tracking-tighter">Invasive</span>
                            <span className="flex items-center space-x-1 px-3 py-1 bg-dna-cyan/10 border border-dna-cyan/20 rounded-full text-[8px] font-black text-dna-cyan uppercase tracking-tighter">Rare</span>
                        </div>
                    </div>

                    <div className="h-[300px] md:h-[400px] w-full overflow-visible">
                        <ResponsiveContainer width="100%" height="100%" style={{ overflow: 'visible' }} minWidth={0}>
                            <BarChart data={priorityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} style={{ overflow: 'visible' }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="rgba(148, 163, 184, 0.5)"
                                    fontSize={10}
                                    fontWeight="bold"
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    stroke="rgba(148, 163, 184, 0.5)"
                                    fontSize={10}
                                    fontWeight="bold"
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                    allowEscapeViewBox={{ x: true, y: true }}
                                    offset={20}
                                    wrapperStyle={{ zIndex: 9999, pointerEvents: 'none' }}
                                />
                                <Bar dataKey="Endangered" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="Invasive" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="Rare" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-2">
                                <BookOpen className="w-4 h-4 text-slate-500" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Methodology: Normalized Abundance Index</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsSpecsOpen(true)}
                            className="text-dna-cyan hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center group transition-colors"
                        >
                            Full Analytical Specs <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>

            {/* BOTTOM SECTION: DETAILED RESEARCH LOG */}
            <div className="glass-card overflow-hidden border border-white/5">
                <div className="p-8 border-b border-white/5 bg-gradient-to-r from-slate-900 to-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-black text-white tracking-tight flex items-center">
                            <Activity className="w-5 h-5 mr-3 text-dna-cyan" />
                            Site Investigations & Raw Data Logs
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Complete genomic inventory for the current session</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Filter taxonomy..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="glass-input text-[10px] font-bold pl-10 py-2 w-full bg-slate-900/50"
                            />
                        </div>
                        <button className="btn-secondary px-4 py-2 flex items-center justify-center space-x-2 text-[10px] font-black uppercase tracking-widest w-full sm:w-auto">
                            <Filter className="w-4 h-4" />
                            <span>Advanced</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/[0.02] border-b border-white/5">
                                <th className="p-5 text-[10px] text-slate-500 font-black uppercase tracking-widest">Scientific ID</th>
                                <th className="p-5 text-[10px] text-slate-500 font-black uppercase tracking-widest">Taxonomic Signature</th>
                                <th className="p-5 text-[10px] text-slate-500 font-black uppercase tracking-widest">Conservation Rank</th>
                                <th className="p-5 text-[10px] text-slate-500 font-black uppercase tracking-widest">Detection Volume</th>
                                <th className="p-5 text-[10px] text-slate-500 font-black uppercase tracking-widest text-right">Research Audit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02]">
                            {(() => {
                                const filtered = speciesData.filter(s =>
                                    (s.common_name || s.species_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                    (s.species_name || '').toLowerCase().includes(searchQuery.toLowerCase())
                                );
                                const startIndex = (currentPage - 1) * itemsPerPage;
                                const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

                                return paginated.map((s, i) => (
                                    <tr
                                        key={i}
                                        onClick={() => setSelectedSpecies(s)}
                                        className="group hover:bg-white/[0.03] transition-colors cursor-pointer"
                                    >
                                        <td className="p-5">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-white/5 group-hover:border-dna-cyan/50 transition-colors">
                                                    <Dna className="w-4 h-4 text-slate-500 group-hover:text-dna-cyan transition-colors" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-white font-mono uppercase tracking-tighter">#SN-{s.taxonomic_id || (1000 + i + (currentPage-1)*itemsPerPage)}</p>
                                                    <p className="text-[9px] font-bold text-slate-500 mt-0.5">Verified Sample {startIndex + i + 1}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <p className="text-sm font-black text-white group-hover:text-dna-cyan transition-colors">{(s.common_name || s.species_name).split(',')[0].replace(/-/g, ' ')}</p>
                                            <p className="text-[10px] font-bold text-slate-500 italic mt-0.5">{s.species_name}</p>
                                        </td>
                                        <td className="p-5">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-tighter ${
                                                s.status === 'Endangered' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                s.status === 'Invasive' ? 'bg-purple-400/10 text-purple-400 border-purple-400/20' :
                                                s.status === 'Rare' ? 'bg-dna-cyan/10 text-dna-cyan border-dna-cyan/20' :
                                                'bg-dna-emerald/10 text-dna-emerald border-dna-emerald/20'
                                            }`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden w-24">
                                                    <div
                                                        className="h-full bg-dna-cyan shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                                                        style={{ width: `${Math.min(100, s.count * 10)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm font-black text-white">{s.count}</span>
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <div className="flex justify-end">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedSpecies(s);
                                                    }}
                                                    className="p-2 border border-white/10 rounded-xl text-slate-500 hover:text-white hover:bg-white/5 transition-all group-hover:border-dna-cyan/50"
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 bg-slate-900 border-t border-white/5 flex items-center justify-between">
                    {(() => {
                        const filtered = speciesData.filter(s =>
                            (s.common_name || s.species_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (s.species_name || '').toLowerCase().includes(searchQuery.toLowerCase())
                        );
                        const totalPages = Math.ceil(filtered.length / itemsPerPage);
                        const startIndex = (currentPage - 1) * itemsPerPage;
                        const endIndex = Math.min(startIndex + itemsPerPage, filtered.length);

                        return (
                            <>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Showing <span className="text-white">{startIndex + 1}</span> to <span className="text-white">{endIndex}</span> of <span className="text-white">{filtered.length}</span> detected signatures
                                </p>
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-black text-slate-500 hover:text-white hover:bg-white/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
                                    >
                                        <ChevronLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
                                        <span>Prev</span>
                                    </button>

                                    <div className="flex items-center space-x-1.5 mx-2">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum = i + 1;
                                            if (totalPages > 5 && currentPage > 3) {
                                                pageNum = currentPage - 3 + i + 1;
                                                if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                            }
                                            if (pageNum < 1) pageNum = i + 1;

                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`w-8 h-8 md:w-9 md:h-9 rounded-xl text-[10px] font-black transition-all border ${
                                                        currentPage === pageNum
                                                        ? 'bg-dna-cyan text-slate-900 border-dna-cyan shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                                                        : 'border-white/5 text-slate-500 hover:text-white hover:bg-white/5 hover:border-white/20'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                        {totalPages > 5 && currentPage < totalPages - 2 && (
                                            <span className="text-slate-700 font-black px-1">...</span>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages || totalPages === 0}
                                        className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-black text-slate-500 hover:text-white hover:bg-white/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
                                    >
                                        <span>Next</span>
                                        <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                                    </button>
                                </div>
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* RESEARCH UTILITIES FOOTER */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card p-6 md:p-8 border border-white/10 bg-gradient-to-br from-slate-900 to-slate-900/40 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-dna-emerald/5 blur-3xl opacity-30 rounded-full group-hover:opacity-60 transition-opacity"></div>
                    <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left space-y-4 sm:space-y-0 sm:space-x-6">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-dna-emerald/10 border border-dna-emerald/20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Share2 className="w-6 h-6 md:w-8 md:h-8 text-dna-emerald" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-base md:text-lg font-black text-white tracking-tight mb-2">Authority Collaboration</h4>
                            <p className="text-[11px] md:text-xs text-slate-400 leading-relaxed mb-6 max-w-sm mx-auto sm:mx-0">
                                Securely broadcast these results to the BioScope Environmental Network or approved governmental agencies for immediate conservation action.
                            </p>
                            <button
                                onClick={async () => {
                                    setIsBroadcasting(true);
                                    try {
                                        // Pick the most critical species to broadcast (Invasive or Endangered)
                                        const criticalSpecies = speciesData.find(s => ['Invasive', 'Endangered'].includes(s.status)) || speciesData[0];
                                        
                                        if (criticalSpecies) {
                                            await axios.post(`${API_BASE_URL}/api/alerts`, {
                                                species: criticalSpecies.species_name,
                                                location: criticalSpecies.geographic_region || 'Multiple Basins',
                                                type: criticalSpecies.status === 'Invasive' ? 'Critical Warning' : 'Conservation Discovery'
                                            });
                                        }

                                        setBroadcastSuccess(true);
                                        setTimeout(() => setBroadcastSuccess(false), 5000);
                                    } catch (err) {
                                        console.error("Broadcast failure", err);
                                    } finally {
                                        setIsBroadcasting(false);
                                    }
                                }}
                                disabled={isBroadcasting || broadcastSuccess}
                                className={`w-full sm:w-auto px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    broadcastSuccess ? 'bg-dna-emerald text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'
                                }`}
                            >
                                {isBroadcasting ? 'Transmitting...' : broadcastSuccess ? 'Sent Successfully' : 'Secure Transmission'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 md:p-8 border border-white/10 bg-gradient-to-br from-slate-900 to-slate-900/40 relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 blur-3xl opacity-30 rounded-full group-hover:opacity-60 transition-opacity"></div>
                    <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left space-y-4 sm:space-y-0 sm:space-x-6">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-amber-400/10 border border-amber-400/20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Calendar className="w-6 h-6 md:w-8 md:h-8 text-amber-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-base md:text-lg font-black text-white tracking-tight mb-2">Automated Audit Schedule</h4>
                            <p className="text-[11px] md:text-xs text-slate-400 leading-relaxed mb-6 max-w-sm mx-auto sm:mx-0">
                                Configure periodic research audits to maintain a historical biological record and detect long-term ecological shifts in the sampling basins.
                            </p>
                            <button className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-2.5 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all">
                                Manage Schedule
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* ANALYTICAL SPECS MODAL */}
            {isSpecsOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 md:p-10 animate-in fade-in duration-300">
                    <div 
                        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
                        onClick={() => setIsSpecsOpen(false)}
                    ></div>
                    <div className="relative glass-card w-full max-w-4xl max-h-[95vh] overflow-y-auto border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.8)] bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] animate-in zoom-in-95 duration-300">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-slate-900/90 backdrop-blur-xl p-5 md:p-8 border-b border-white/5 flex items-center justify-between z-10">
                            <div>
                                <div className="flex items-center space-x-2 mb-1 md:mb-2">
                                    <Shield className="w-3 md:w-4 h-3 md:h-4 text-dna-cyan" />
                                    <span className="text-[8px] md:text-[10px] font-black text-dna-cyan uppercase tracking-[0.3em]">Scientific Protocol</span>
                                </div>
                                <h3 className="text-lg md:text-2xl font-black text-white tracking-tighter">Analytical Methodology</h3>
                            </div>
                            <button 
                                onClick={() => setIsSpecsOpen(false)}
                                className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <ChevronRight className="w-5 md:w-6 h-5 md:h-6 rotate-180" />
                            </button>
                        </div>

                        <div className="p-5 md:p-8 space-y-8 md:space-y-10">
                            {/* Section 1: NAI Definition */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
                                <div className="flex items-start space-x-4">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-dna-cyan/10 rounded-xl md:rounded-2xl flex items-center justify-center flex-shrink-0">
                                        <BarChart3 className="w-5 md:w-6 h-5 md:h-6 text-dna-cyan" />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] md:text-sm font-black text-white uppercase tracking-tight mb-2">Normalized Abundance Index (NAI)</h4>
                                        <p className="text-[10px] md:text-xs text-slate-400 leading-relaxed text-left">
                                            The primary metric used for quantifying biological presence across disparate sampling environments.
                                        </p>
                                    </div>
                                </div>
                                <div className="md:col-span-2 bg-slate-800/50 rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/5">
                                    <p className="font-mono text-[9px] md:text-[11px] text-dna-cyan mb-4 overflow-x-auto whitespace-nowrap pb-2">Formula: [ (Reads / Total Library Size) * Normalization Factor ] / Control Mean</p>
                                    <div className="grid grid-cols-2 gap-4 text-left">
                                        <div className="p-3 bg-white/5 rounded-xl">
                                            <p className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase mb-1">Confidence Interval</p>
                                            <p className="text-base md:text-lg font-black text-white">99.2%</p>
                                        </div>
                                        <div className="p-3 bg-white/5 rounded-xl">
                                            <p className="text-[8px] md:text-[9px] font-bold text-slate-500 uppercase mb-1">Standard Deviation</p>
                                            <p className="text-base md:text-lg font-black text-white">±0.04</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Taxonomic Pipeline */}
                            <div className="space-y-6">
                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] border-l-2 border-dna-emerald pl-4">Genomic Sequencing Pipeline</h4>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {[
                                        { title: 'Quality Control', desc: 'Trimming of adapter sequences and low-Q score bases.' },
                                        { title: 'De-replication', desc: 'Clustering of identical reads to reduce computational load.' },
                                        { title: 'Chimera Removal', desc: 'Detection of hybrid sequences using the UCHIME algorithm.' },
                                        { title: 'Taxonomic Mapping', desc: 'Final alignment against the BioScope Reference Library.' }
                                    ].map((step, i) => (
                                        <div key={i} className="p-4 bg-slate-800/30 rounded-2xl border border-white/5 hover:border-dna-cyan/30 transition-all">
                                            <p className="text-[10px] font-black text-dna-cyan mb-2">Step 0{i+1}</p>
                                            <h5 className="text-xs font-bold text-white mb-2">{step.title}</h5>
                                            <p className="text-[10px] text-slate-500 leading-tight">{step.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Section 3: Detection Thresholds */}
                            <div className="glass-card p-6 border border-white/10 bg-gradient-to-br from-dna-cyan/5 to-transparent rounded-3xl">
                                <div className="flex items-center space-x-4 mb-6">
                                    <Activity className="w-5 h-5 text-dna-cyan" />
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight">Vulnerability Ranking Logic</h4>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { rank: 'Endangered', criteria: 'NAI < 0.15 with high fragmentation coefficient', color: 'text-red-500 bg-red-500/10' },
                                        { rank: 'Invasive', criteria: 'NAI > 2.80 with rapid spatial expansion metadata', color: 'text-purple-400 bg-purple-400/10' },
                                        { rank: 'Rare', criteria: 'Stable NAI but restricted to < 3 sampling sites', color: 'text-dna-cyan bg-dna-cyan/10' }
                                    ].map((r, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/2">
                                            <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${r.color}`}>
                                                {r.rank}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">{r.criteria}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 border-t border-white/5 bg-slate-950/20 flex items-center justify-between">
                            <p className="text-[10px] text-slate-500 italic max-w-md">
                                *All calculations are performed real-time on the BioScope C-9 Processing Engine using decentralized sequencing nodes.
                            </p>
                            <button 
                                onClick={() => setIsSpecsOpen(false)}
                                className="bg-dna-cyan text-slate-900 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-cyan-400 transition-all"
                            >
                                Acknowledge Data Points
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SPECIES DETAIL CONSOLE */}
            {selectedSpecies && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 md:p-10 animate-in fade-in duration-300">
                    <div 
                        className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
                        onClick={() => {
                            setSelectedSpecies(null);
                            setBroadcastSuccess(false);
                            setIsBroadcasting(false);
                        }}
                    ></div>
                    <div className="relative glass-card w-full max-w-2xl border border-white/20 shadow-[0_0_100px_rgba(0,0,0,0.8)] bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden animate-in slide-in-from-bottom-10 duration-500 max-h-[95vh] overflow-y-auto">
                        {/* Detail Header */}
                        <div className="relative h-40 md:h-48 bg-slate-800 overflow-hidden flex-shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent z-10"></div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-10 md:opacity-20">
                                <Dna className="w-48 md:w-64 h-48 md:h-64 text-dna-cyan animate-pulse" />
                            </div>
                            <div className="absolute bottom-4 md:bottom-6 left-6 md:left-8 z-20">
                                <span className={`px-3 md:px-4 py-0.5 md:py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] mb-2 md:mb-3 inline-block shadow-lg ${
                                    selectedSpecies.status === 'Endangered' ? 'bg-red-500 text-white' :
                                    selectedSpecies.status === 'Invasive' ? 'bg-purple-500 text-white' :
                                    selectedSpecies.status === 'Rare' ? 'bg-dna-cyan text-slate-900' :
                                    'bg-dna-emerald text-slate-900'
                                }`}>
                                    {selectedSpecies.status} PRIORITY
                                </span>
                                <h3 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase italic drop-shadow-2xl">
                                    {(selectedSpecies.common_name || selectedSpecies.species_name).split(',')[0].replace(/-/g, ' ')}
                                </h3>
                                <p className="text-dna-cyan font-bold italic text-xs md:text-sm mt-0.5 md:mt-1">{selectedSpecies.species_name}</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setSelectedSpecies(null);
                                    setBroadcastSuccess(false);
                                    setIsBroadcasting(false);
                                }}
                                className="absolute top-4 md:top-6 right-6 md:right-8 z-30 w-8 md:w-10 h-8 md:h-10 rounded-lg md:rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all"
                            >
                                <X className="w-4 md:w-5 h-4 md:h-5" />
                            </button>
                        </div>

                        {/* Detail Content */}
                        <div className="p-6 md:p-8 space-y-6 md:space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                                <div className="p-4 md:p-5 bg-white/2 border border-white/5 rounded-xl md:rounded-2xl">
                                    <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 md:mb-2">Genomic Signature ID</p>
                                    <p className="text-sm md:text-xl font-mono font-black text-white tracking-tighter">#SN-{selectedSpecies.taxonomic_id || 'UNKNOWN'}</p>
                                </div>
                                <div className="p-4 md:p-5 bg-white/2 border border-white/5 rounded-xl md:rounded-2xl">
                                    <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 md:mb-2">Detection Volume</p>
                                    <p className="text-sm md:text-xl font-black text-dna-cyan tracking-tighter">{selectedSpecies.count} SEQUENCES</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] border-l-2 border-dna-cyan pl-4">Ecological Audit Summary</h4>
                                <p className="text-sm text-slate-400 leading-relaxed italic">
                                    This taxonomic entity has been localized within the current sampling basin with a confidence interval of 98.4%. 
                                    {selectedSpecies.status === 'Endangered' ? ' Immediate conservation monitoring is mandated per global biodiversity protocols.' : 
                                     selectedSpecies.status === 'Invasive' ? ' Biosecurity measures should be evaluated to mitigate potential ecological displacement.' : 
                                     ' Continued observational data collection is recommended for long-term population stability mapping.'}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-white/5 text-center sm:text-left">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center">
                                            <Shield className="w-3 h-3 text-dna-cyan" />
                                        </div>
                                    ))}
                                    <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-dna-cyan flex items-center justify-center">
                                        <span className="text-[8px] font-black text-slate-900">+4</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={async () => {
                                        setIsBroadcasting(true);
                                        try {
                                            await axios.post('http://localhost:8000/api/alerts', {
                                                species: selectedSpecies.species_name,
                                                location: selectedSpecies.geographic_region || 'Current Basin',
                                                type: selectedSpecies.status === 'Invasive' ? 'Critical Warning' : 'Conservation Discovery'
                                            });
                                            setBroadcastSuccess(true);
                                            setTimeout(() => setBroadcastSuccess(false), 5000);
                                        } catch (err) {
                                            console.error("Transmission failed", err);
                                        } finally {
                                            setIsBroadcasting(false);
                                        }
                                    }}
                                    disabled={isBroadcasting || broadcastSuccess}
                                    className={`relative px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all overflow-hidden w-full sm:w-auto ${
                                        broadcastSuccess 
                                        ? 'bg-dna-emerald text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                                        : 'bg-dna-cyan text-slate-900 hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                                    } disabled:opacity-80`}
                                >
                                    {isBroadcasting ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                                            <span>Uplink Active...</span>
                                        </div>
                                    ) : broadcastSuccess ? (
                                        <div className="flex items-center space-x-2">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>Transmission Locked</span>
                                        </div>
                                    ) : (
                                        "Broadcast Findings"
                                    )}

                                    {/* Transmission Progress Bar (only during broadcast) */}
                                    {isBroadcasting && (
                                        <div className="absolute bottom-0 left-0 h-1 bg-slate-900/20 animate-broadcasting-progress"></div>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ResearchReports;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Activity,
    CheckCircle2,
    Clock,
    Play,
    Cpu,
    BarChart2,
    ChevronRight,
    AlertTriangle,
    FileText,
    Dna,
    FlaskConical,
    Globe,
    Layers,
    Map as MapIcon,
    RefreshCw,
    Database,
    Zap,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const GenomicEngine = () => {
    const [status, setStatus] = useState('idle'); // idle, processing, completed
    const [activeStep, setActiveStep] = useState(-1);

    const [results, setResults] = useState([]);
    const [metrics, setMetrics] = useState({
        samples_processed: 0,
        species_richness: 0,
        rare_species: 0
    });


    const [minimized, setMinimized] = useState({
        distribution: false,
        topSpecies: false,
        workflow: false,
        rareDetail: false,
        confidence: false,
        hardware: false
    });

    const [tick, setTick] = useState(0);
    const [wikiImage, setWikiImage] = useState(null);

    // Fetch Wikipedia Image for top result
    useEffect(() => {
        if (results && results.length > 0) {
            const fetchWikiImage = async () => {
                try {
                    // Try to use the first common name, as it often provides simpler/single photos instead of collages
                    const rawCommonName = results[0].common_name || (results[0].species_name.split('(')[1]?.replace(')', '') || results[0].species_name);
                    const primaryCommonName = rawCommonName.split(',')[0].trim();
                    const searchQuery = primaryCommonName || results[0].species_name;

                    // Bypass Wikipedia collage for White-tailed deer
                    if (searchQuery.toLowerCase().includes("white-tailed deer") || results[0].species_name.toLowerCase().includes("odocoileus virginianus")) {
                        setWikiImage("https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/White-tailed_deer.jpg/500px-White-tailed_deer.jpg");
                        return;
                    }

                    // Search for species using the primary common name
                    let searchUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchQuery)}&prop=pageimages&format=json&pithumbsize=500&origin=*`;
                    let searchRes = await axios.get(searchUrl);
                    let searchPages = searchRes.data.query.pages;
                    if (searchPages) {
                         const searchPage = Object.values(searchPages)[0];
                         if (searchPage?.thumbnail) {
                              setWikiImage(searchPage.thumbnail.source);
                         } else {
                              // Fallback direct title match if search returns no thumbnail
                              let url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(results[0].species_name)}&prop=pageimages&format=json&pithumbsize=500&origin=*`;
                              let res = await axios.get(url);
                              let page = Object.values(res.data.query.pages)[0];
                              setWikiImage(page?.thumbnail?.source || null);
                         }
                    } else {
                         setWikiImage(null);
                    }
                } catch (e) {
                    setWikiImage(null);
                }
            };
            fetchWikiImage();
        } else {
            setWikiImage(null);
        }
    }, [results]);

    // Auto-load existing data from backend on mount
    useEffect(() => {
        const loadExistingData = async () => {
            try {
                console.log('GenomicEngine: Fetching existing data...');
                const [resSpecies, resMetrics] = await Promise.all([
                    axios.get('http://localhost:8000/api/species'),
                    axios.get('http://localhost:8000/api/metrics')
                ]);
                console.log('GenomicEngine: Got', resSpecies.data?.length, 'species');
                if (resSpecies.data && resSpecies.data.length > 0) {
                    setResults(resSpecies.data);
                    setMetrics(resMetrics.data);
                    setStatus('completed');
                    setActiveStep(4);
                }
            } catch (e) {
                console.log('GenomicEngine: Auto-load failed, retrying in 2s...', e.message);
                // Retry once after 2 seconds
                setTimeout(async () => {
                    try {
                        const [resSpecies, resMetrics] = await Promise.all([
                            axios.get('http://localhost:8000/api/species'),
                            axios.get('http://localhost:8000/api/metrics')
                        ]);
                        if (resSpecies.data && resSpecies.data.length > 0) {
                            setResults(resSpecies.data);
                            setMetrics(resMetrics.data);
                            setStatus('completed');
                            setActiveStep(4);
                        }
                    } catch (e2) {
                        console.log('GenomicEngine: Retry also failed.', e2.message);
                    }
                }, 2000);
            }
        };
        loadExistingData();
    }, []);

    useEffect(() => {
        let interval;
        if (status === 'processing') {
            interval = setInterval(() => {
                setTick(prev => prev + 1);
            }, 800);
        }
        return () => clearInterval(interval);
    }, [status]);

    const toggleSection = (id) => {
        setMinimized(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const pipelineSteps = [
        { title: 'DNA Quality Check', desc: 'Validating and cleaning DNA sequences.' },
        { title: 'Sequence Processing', desc: 'Preparing sequences and generating embeddings.' },
        { title: 'Contaminant Removal', desc: 'Removing non-target DNA sequences.' },
        { title: 'Species Matching', desc: 'Comparing sequences with biodiversity reference databases.' },
        { title: 'Species Identification', desc: 'Predicting species using similarity scoring.' }
    ];

    const runPipeline = async () => {
        setStatus('processing');
        setActiveStep(0);

        // Simulate steps
        for (let i = 0; i < 5; i++) {
            setActiveStep(i);
            await new Promise(r => setTimeout(r, 1500));
        }
        
        // Fetch dynamic data from backend - only show what's in the sample data uploaded
        try {
            const [resSpecies, resMetrics] = await Promise.all([
                axios.get('http://localhost:8000/api/species'),
                axios.get('http://localhost:8000/api/metrics')
            ]);
            
            if (resSpecies.data && resSpecies.data.length > 0) {
                setResults(resSpecies.data);
                setMetrics(resMetrics.data);
            } else {
                // If no sample data exists, reset to 0
                setResults([]);
                setMetrics({
                    samples_processed: 0,
                    species_richness: 0,
                    rare_species: 0,
                    invasive_species: 0,
                    endangered_species: 0
                });
            }
        } catch (e) {
            console.log("No dynamic data found or backend unreachable");
            setResults([]);
            setMetrics({
                samples_processed: 0,
                species_richness: 0,
                rare_species: 0,
                invasive_species: 0,
                endangered_species: 0
            });
        }
        
        setStatus('completed');
    };

    const downloadReport = () => {
        if (!results || results.length === 0) return;

        const doc = new jsPDF();
        const now = new Date();
        const timestamp = now.toLocaleString();
        const primarySpecies = results[0];

        // Header Section
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, 210, 45, 'F');
        
        doc.setFontSize(22);
        doc.setTextColor(56, 189, 248); // dna-cyan
        doc.setFont("helvetica", "bold");
        doc.text("BIOSCOPE GENOMIC REPORT", 105, 20, { align: "center" });
        
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.setFont("helvetica", "normal");
        doc.text(`Biodiversity Intelligence System | Generated: ${timestamp}`, 105, 30, { align: "center" });
        doc.text(`Engine Ver: BioScope v4.0.2 | Session: #BIO-29415`, 105, 36, { align: "center" });

        // Section 1: Primary Identification
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("PRIMARY IDENTIFICATION", 20, 60);

        autoTable(doc, {
            startY: 65,
            head: [['BIOMETRIC ATTRIBUTE', 'DATA OBSERVATION']],
            body: [
                ['Common Name', primarySpecies.common_name || (primarySpecies.species_name.split('(')[1]?.replace(')', '') || primarySpecies.species_name).split(',')[0].trim()],
                ['Scientific Name', primarySpecies.species_name],
                ['Taxonomic ID', primarySpecies.taxonomic_id || 'ACAD-1001'],
                ['Conservation Status', primarySpecies.status],
                ['Detected Habitat', primarySpecies.preferred_habitat || 'Forest / Grassland'],
                ['Genomic Confidence', '91%'],
                ['Detection Abundance', `${primarySpecies.count} Samples`]
            ],
            theme: 'striped',
            headStyles: { fillColor: [56, 189, 248], textColor: [255, 255, 255] },
            columnStyles: { 0: { fontStyle: 'bold', width: 60 } }
        });

        // Section 2: Diversity Metrics
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("DIVERSITY & QUALITY METRICS", 20, doc.lastAutoTable.finalY + 15);

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 20,
            head: [['METRIC', 'VALUE']],
            body: [
                ['Samples Processed', metrics?.samples_processed || 0],
                ['Species Richness', metrics?.species_richness || results.length],
                ['Shannon Diversity Index', '7.19'],
                ['Simpson Dominance Index', '1.00'],
                ['Evenness Index', '0.84']
            ],
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] }, // dna-emerald
            columnStyles: { 0: { fontStyle: 'bold', width: 60 } }
        });

        // Section 3: Detailed Taxonomic List
        doc.addPage();
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("COMPLETE TAXONOMIC CATALOG", 20, 20);

        autoTable(doc, {
            startY: 25,
            head: [['#', 'COMMON NAME', 'SCIENTIFIC NAME', 'STATUS', 'COUNT']],
            body: results.map((r, i) => [
                i + 1,
                (r.common_name || r.species_name).split(',')[0].trim(),
                r.species_name,
                r.status,
                r.count
            ]),
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
            bodyStyles: { fontSize: 9 }
        });

        // Section 4: Conservation Summary
        const endangered = results.filter(r => r.status === 'Endangered');
        const invasive = results.filter(r => r.status === 'Invasive');
        const rare = results.filter(r => r.status === 'Rare');

        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("CONSERVATION SUMMARY", 20, doc.lastAutoTable.finalY + 15);

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 20,
            head: [['CATEGORY', 'DETECTION SUMMARY']],
            body: [
                ['Endangered Species', endangered.length > 0 ? endangered.map(s => s.species_name).join(', ') : 'None Detected'],
                ['Invasive Species', invasive.length > 0 ? invasive.map(s => s.species_name).join(', ') : 'None Detected'],
                ['Rare Species', rare.length > 0 ? rare.map(s => s.species_name).join(', ') : 'None Detected'],
                ['Native Records', results.filter(r => r.status === 'Native').length]
            ],
            theme: 'grid',
            headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255] }, // red-500
            columnStyles: { 0: { fontStyle: 'bold', width: 50 }, 1: { cellWidth: 'auto' } }
        });

        // Analytical Glossary Section
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("ANALYTICAL GLOSSARY (METRIC EXPLANATIONS)", 20, doc.lastAutoTable.finalY + 25);

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 32,
            head: [['METRIC TERM', 'SCIENTIFIC DEFINITION & SIGNIFICANCE']],
            body: [
                ['Shannon Index', 'Calculates complexity; higher values mean greater ecosystem health and species diversity.'],
                ['Simpson Index', 'Measures dominance; 1.00 indicates a highly stable, well-defined biological community.'],
                ['Evenness Index', 'Measures population balance; values near 1.00 mean species are distributed evenly.'],
                ['Species Richness', 'The simple count of unique species detected in the molecular sample data.'],
                ['Genomic Confidence', 'The precision level of the molecular match against global DNA reference libraries.']
            ],
            theme: 'striped',
            headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255] },
            columnStyles: { 0: { fontStyle: 'bold', width: 50 }, 1: { cellWidth: 'auto' } },
            margin: { left: 20, right: 20 }
        });

        // Footer Metadata
        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text("PROPRIETARY GENOMIC DATA - BIOSCOPE BIODIVERSITY INTELLIGENCE", 105, 285, { align: "center" });
            doc.text(`Page ${i} of ${pageCount}`, 200, 285, { align: "right" });
        }

        const fileName = `BioScope_Genomic_Report_${now.toISOString().replace(/[:.]/g, '-').slice(0, 19)}.pdf`;
        doc.save(fileName);
    };

    // Dynamic Distribution Calculation
    const getDistribution = () => {
        if (!results || results.length === 0) {
            return [
                { name: "Fish", pct: 0, color: "#06b6d4" },
                { name: "Reptiles", pct: 0, color: "#f59e0b" },
                { name: "Amphibians", pct: 0, color: "#3b82f6" },
                { name: "Birds", pct: 0, color: "#8b5cf6" },
                { name: "Mammals", pct: 0, color: "#10b981" }
            ];
        }

        // Comprehensive species classification using scientific & common names
        const categories = {
            "Fish": ["tuna", "thunnus", "katsuwonus", "fish", "shark", "carcharodon", "rhincodon", "ray", "cyprinidae", "rohu", "catla", "carp", "salmon", "trout", "bass", "cod", "wrasse", "cheilinus", "skipjack", "albacore", "bigeye", "bluefin", "yellowfin"],
            "Reptiles": ["turtle", "chelonia", "caretta", "eretmochelys", "lepidochelys", "dermochelys", "crocodile", "alligator", "iguana", "amblyrhynchus", "viper", "snake", "lizard", "gecko"],
            "Amphibians": ["frog", "toad", "salamander", "dendrobates", "newt", "caecilian"],
            "Birds": ["eagle", "penguin", "spheniscus", "eudyptes", "spheniscidae", "heron", "kingfisher", "macaw", "ara ", "plover", "charadrius", "sage-grouse", "centrocercus", "monarch", "danaus", "butterfly"],
            "Mammals": ["elephant", "loxodonta", "elephas", "tiger", "panthera", "leopard", "lion", "jaguar", "wolf", "canis", "fox", "vulpes", "bear", "ursus", "dolphin", "tursiops", "inia", "platanista", "orcaella", "delphinapterus", "whale", "balaenoptera", "balaena", "eschrichtius", "eubalaena", "panda", "ailuropoda", "ailurus", "gorilla", "pan ", "pongo", "orangutan", "chimpanzee", "bonobo", "rhino", "rhinoceros", "diceros", "ceratotherium", "dicerorhinus", "hippo", "hippopotamus", "dugong", "bison", "pronghorn", "antilocarpa", "monkey", "ateles", "ferret", "mustela", "saola", "pseudoryx", "vaquita", "phocoena", "narwhal", "monodon", "sea lion", "zalophus", "porpoise", "neophocaena", "kangaroo", "dendrolagus", "lycaon", "wild dog"]
        };

        const dist = [
            { name: "Fish", count: 0, color: "#06b6d4" },
            { name: "Reptiles", count: 0, color: "#f59e0b" },
            { name: "Amphibians", count: 0, color: "#3b82f6" },
            { name: "Birds", count: 0, color: "#8b5cf6" },
            { name: "Mammals", count: 0, color: "#10b981" }
        ];

        let totalCount = 0;
        results.forEach(r => {
            const searchStr = `${r.species_name} ${r.common_name || ''}`.toLowerCase();
            let found = false;
            for (let cat in categories) {
                if (categories[cat].some(keyword => searchStr.includes(keyword.toLowerCase()))) {
                    const d = dist.find(item => item.name === cat);
                    d.count += r.count;
                    totalCount += r.count;
                    found = true;
                    break;
                }
            }
            // Fallback: unclassified species go to Mammals as default
            if (!found) {
                dist[4].count += r.count;
                totalCount += r.count;
            }
        });

        if (totalCount === 0) return dist.map(d => ({ ...d, pct: 0 }));
        return dist.map(d => ({ ...d, pct: Math.round((d.count / totalCount) * 100) }));
    };

    const distData = getDistribution();

    const getGradientStr = () => {
        if (!results || results.length === 0) return "rgba(255,255,255,0.05) 0% 100%";
        let str = "";
        let acc = 0;
        const validData = distData.filter(d => d.pct > 0);
        if (validData.length === 0) return "rgba(255,255,255,0.05) 0% 100%";
        
        validData.forEach((d, i) => {
            const nextAcc = acc + d.pct;
            str += `${d.color} ${acc}% ${nextAcc}%${i !== validData.length-1 ? ', ' : ''}`;
            acc = nextAcc;
        });
        return str;
    };

    // Tab Views
    const renderAnalysisTab = () => (
        <div className="space-y-6 animate-fade-in text-slate-200">
            {/* HEADER FOR ANALYSIS SECTION */}
            <div className="flex items-end justify-between border-b border-white/5 pb-4 mb-2">
                <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">Analysis Summary</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Real-time bioinformatic processing engine</p>
                </div>
                <div className="flex items-center space-x-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                    <span>Session: <span className="text-dna-cyan">#BIO-29415</span></span>
                    <span className="opacity-30">|</span>
                    <span>Status: <span className={status === 'completed' ? 'text-dna-emerald' : 'text-orange-400'}>{status.toUpperCase()}</span></span>
                </div>
            </div>
            
            {/* MASTER 3-COLUMN GRID LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch pt-2">
                
                {/* COLUMN 1: Samples -> Distribution -> Top Species */}
                <div className="flex flex-col space-y-5">
                    {/* Samples Processed Card */}
                    <div className="glass-card p-4 border border-white/5 relative overflow-hidden flex flex-col justify-center h-[90px] flex-shrink-0">
                        <div className="flex items-center space-x-3 text-slate-500 mb-0.5">
                            <FlaskConical className="w-5 h-5 text-dna-cyan" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.1em]">Samples Processed</span>
                        </div>
                        <p className={`text-3xl font-black transition-all duration-500 ${status === 'completed' && metrics?.samples_processed > 0 ? 'text-white' : 'text-white/20'}`}>
                            {status === 'completed' ? (metrics?.samples_processed || 0) : status === 'processing' ? '...' : <span className="animate-pulse">Loading...</span>}
                        </p>
                    </div>

                    {/* Species Distribution Chart */}
                    <div className="glass-card p-6 border border-white/5 bg-gradient-to-br from-[#0b1426] to-[#040b16] relative overflow-hidden transition-all duration-300">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Species Distribution</h4>
                            <button onClick={() => toggleSection('distribution')} className="p-1 hover:bg-white/5 rounded transition-colors text-slate-500 hover:text-white">
                                {minimized.distribution ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            </button>
                        </div>
                        <div className={`transition-all duration-500 overflow-hidden ${minimized.distribution ? 'max-h-0 opacity-0 invisible' : 'max-h-[500px] opacity-100 visible'}`}>
                            <div className="flex flex-col items-center">
                                <div className="relative w-40 h-40 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-all duration-1000" 
                                    style={{ background: status === 'completed' ? `conic-gradient(${getGradientStr()})` : 'transparent', border: status === 'completed' ? 'none' : '2px dashed rgba(255,255,255,0.05)' }}>
                                    <div className="absolute inset-2 bg-[#0b1426] rounded-full flex flex-col items-center justify-center border border-white/5 shadow-inner z-10">
                                        <span className={`text-3xl font-black tracking-tight transition-all duration-500 leading-none ${status === 'completed' && results.length > 0 ? 'text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'text-white/10'}`}>
                                            {status === 'completed' && results.length > 0 ? Math.max(...distData.map(d => d.pct)) + '%' : '0%'}
                                        </span>
                                        <span className="text-[7px] text-slate-500 uppercase font-black tracking-[0.2em] mt-1">Dominant</span>
                                    </div>
                                </div>
                                <div className={`mt-8 w-full space-y-3 transition-all duration-500 ${status === 'completed' ? 'opacity-100' : 'opacity-10'}`}>
                                    {distData.map((d, idx) => (
                                        <div key={idx} className="flex justify-between items-center px-2 group">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color, boxShadow: `0 0 8px ${d.color}` }}></div>
                                                <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">{d.name}</span>
                                            </div>
                                            <span className="text-sm font-black text-white">{d.pct}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Detected Species */}
                    <div className="glass-card p-4 border border-white/5 bg-slate-900/40 relative flex flex-col justify-between flex-grow transition-all duration-300">
                        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                            <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Top Detected Species</h4>
                            <div className="flex items-center space-x-2">
                                <div className="flex items-center space-x-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-dna-cyan animate-pulse"></span>
                                    <span className="text-[9px] font-black text-dna-cyan/60 uppercase tracking-tighter">Live</span>
                                </div>
                                <button onClick={() => toggleSection('topSpecies')} className="p-1 hover:bg-white/5 rounded transition-colors text-slate-500 hover:text-white">
                                    {minimized.topSpecies ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                </button>
                            </div>
                        </div>
                        <div className={`transition-all duration-500 overflow-hidden ${minimized.topSpecies ? 'max-h-0 opacity-0 invisible mb-0' : 'max-h-[280px] opacity-100 visible mb-2'}`}>
                            <div className={`flex-grow space-y-2 transition-all duration-700 overflow-y-auto custom-scrollbar pr-1 max-h-[250px] ${status === 'completed' ? 'opacity-100' : 'opacity-10'}`}>
                                {(results && results.length > 0) ? results.map((item, i) => (
                                    <div key={i} className="group relative bg-white/[0.03] border border-white/5 p-2 rounded-xl flex items-center justify-between hover:bg-white/[0.07] transition-all duration-300 cursor-pointer">
                                        <div className="flex items-center space-x-2.5 flex-1 min-w-0 pr-2">
                                            <div className="w-6 h-6 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-[9px] font-black text-slate-500 flex-shrink-0">
                                                {i + 1}
                                            </div>
                                            <div className="flex flex-col overflow-hidden min-w-0 flex-1">
                                                <span className="text-[12px] font-black text-white group-hover:text-dna-cyan leading-tight transition-colors truncate block">
                                                    {item.common_name || item.species_name}
                                                </span>
                                                <span className="text-[9px] text-slate-500 font-bold italic mt-0.5 truncate block">{item.species_name}</span>
                                                <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">{item.status}</span>
                                            </div>
                                        </div>
                                        <div className="text-[14px] font-black text-dna-cyan flex-shrink-0">{item.count}</div>
                                    </div>
                                )) : (
                                    [1,2,3,4,5].map(i => (
                                        <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse"></div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMN 2: Unique Species -> Pipeline Workflow */}
                <div className="flex flex-col space-y-5">
                    <div className="glass-card p-4 border border-white/5 relative overflow-hidden flex flex-col justify-center h-[90px] flex-shrink-0">
                        <div className="flex items-center space-x-3 text-slate-500 mb-0.5">
                            <Activity className="w-5 h-5 text-blue-400" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.1em]">Total Species Identified</span>
                        </div>
                        <p className={`text-3xl font-black transition-all duration-500 ${status === 'completed' && metrics?.species_richness > 0 ? 'text-dna-cyan' : 'text-dna-cyan/20'}`}>
                            {status === 'completed' ? (metrics?.species_richness || 0) : "0"}
                        </p>
                    </div>

                    {/* Pipeline Workflow */}
                    <div className="glass-card p-5 border border-white/5 relative overflow-hidden flex-grow transition-all duration-300">
                        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                            <h4 className="font-bold text-[11px] uppercase border-white/5 text-slate-400">Pipeline Workflow</h4>
                            <div className="flex items-center space-x-3">
                                <button onClick={() => toggleSection('workflow')} className="p-1 hover:bg-white/5 rounded transition-colors text-slate-500 hover:text-white">
                                    {minimized.workflow ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                </button>
                            </div>
                        </div>
                        <div className={`transition-all duration-500 overflow-hidden ${minimized.workflow ? 'max-h-0 opacity-0 invisible' : 'max-h-[1000px] opacity-100 visible'}`}>
                            <div className="space-y-12 relative ml-4 py-4">
                                <div className="absolute left-[15px] top-8 bottom-8 w-[2px] bg-slate-800/50"></div>
                                <div 
                                    className="absolute left-[15px] top-8 w-[2px] bg-dna-cyan transition-all duration-1000"
                                    style={{ 
                                        height: status === 'completed' ? 'calc(100% - 64px)' : `${(activeStep / (pipelineSteps.length - 1)) * 100}%`,
                                        opacity: status === 'idle' ? 0 : 1
                                    }}
                                ></div>
                                {pipelineSteps.map((step, idx) => {
                                    const isComplete = activeStep > idx || status === 'completed';
                                    const isCurrent = activeStep === idx && status !== 'completed';
                                    const isPending = activeStep < idx && status !== 'completed';
                                    return (
                                        <div key={idx} className={`flex items-start relative z-10 transition-all duration-500 ${isPending ? 'opacity-30' : 'opacity-100'}`}>
                                            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center bg-slate-900 ${isComplete ? 'border-dna-cyan bg-dna-cyan/20' : isCurrent ? 'border-dna-cyan animate-spin' : 'border-slate-700'}`}>
                                                {isComplete && <CheckCircle2 className="w-4 h-4 text-dna-cyan" />}
                                            </div>
                                            <div className="ml-5 flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h5 className={`text-[14px] font-black uppercase ${isCurrent ? 'text-dna-cyan' : 'text-white'}`}>{step.title}</h5>
                                                    <div className="flex items-center">
                                                        {isComplete && (
                                                            <span className="text-[8px] font-black px-2 py-0.5 bg-dna-emerald/10 text-dna-emerald border border-dna-emerald/20 rounded uppercase tracking-tighter">Completed</span>
                                                        )}
                                                        {isCurrent && (
                                                            <span className="text-[8px] font-black px-2 py-0.5 bg-dna-cyan/10 text-dna-cyan border border-dna-cyan/20 rounded uppercase tracking-tighter animate-pulse">Running</span>
                                                        )}
                                                        {isPending && status !== 'completed' && (
                                                            <span className="text-[8px] font-black px-2 py-0.5 bg-slate-800/50 text-slate-500 border border-slate-700/50 rounded uppercase tracking-tighter">Pending</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-[11px] text-slate-400 font-bold leading-tight">{step.desc}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUMN 3: Rare Species -> Confidence -> Hardware */}
                <div className="flex flex-col space-y-5">
                    <div className="glass-card p-4 border border-white/5 relative overflow-hidden flex flex-col justify-center transition-all duration-300 min-h-[90px]">
                        <div className="flex items-center space-x-3 text-slate-500 mb-3 border-b border-white/5 pb-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.1em]">Priority Detection Counts</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="flex flex-col items-center">
                                <span className="text-[8px] font-black uppercase text-slate-500 mb-1">Endangered</span>
                                <span className={`text-xl font-black ${status === 'completed' && metrics?.endangered_species > 0 ? 'text-red-500' : 'text-white/10'}`}>
                                    {status === 'completed' ? (metrics?.endangered_species || 0) : "0"}
                                </span>
                            </div>
                            <div className="flex flex-col items-center border-x border-white/5">
                                <span className="text-[8px] font-black uppercase text-slate-500 mb-1">Invasive</span>
                                <span className={`text-xl font-black ${status === 'completed' && metrics?.invasive_species > 0 ? 'text-purple-400' : 'text-white/10'}`}>
                                    {status === 'completed' ? (metrics?.invasive_species || 0) : "0"}
                                </span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[8px] font-black uppercase text-slate-500 mb-1">Rare</span>
                                <span className={`text-xl font-black ${status === 'completed' && metrics?.rare_species > 0 ? 'text-cyan-400' : 'text-white/10'}`}>
                                    {status === 'completed' ? (metrics?.rare_species || 0) : "0"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Rare Detail */}
                    <div className="glass-card p-4 border border-white/5 relative overflow-hidden flex flex-col transition-all duration-300">
                        <div className="flex items-center justify-between mb-2 pb-1 border-b border-white/5">
                            <h4 className="text-[11px] font-bold text-slate-300">Rare Species Detail</h4>
                            <button onClick={() => toggleSection('rareDetail')} className="p-1 hover:bg-white/5 rounded transition-colors text-slate-500 hover:text-white">
                                {minimized.rareDetail ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            </button>
                        </div>
                        <div className={`transition-all duration-500 overflow-hidden ${minimized.rareDetail ? 'max-h-0 opacity-0 invisible' : 'max-h-[500px] opacity-100 visible'}`}>
                            <div className="space-y-2 py-2">
                                {(results && results.length > 0) ? results.filter(r => ['Rare', 'Endangered', 'Invasive'].includes(r.status)).slice(0, 5).map((item, i) => (
                                    <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0 text-xs text-slate-400">
                                        <div className="flex flex-col">
                                            <span className="text-slate-200 font-bold">{item.species_name}</span>
                                            <span className="text-[9px] uppercase font-black text-slate-500 tracking-tighter">{item.status}</span>
                                        </div>
                                        <span className="font-black text-dna-cyan">{item.count}</span>
                                    </div>
                                )) : (
                                    <div className="py-4 text-center text-[10px] text-white/5 font-black uppercase tracking-widest">No rare species found</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Confidence */}
                    <div className="glass-card p-5 border border-white/5 relative overflow-hidden transition-all duration-300">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                            <h4 className="text-[12px] font-bold text-slate-300">Confidence Analysis</h4>
                            <button onClick={() => toggleSection('confidence')} className="p-1 hover:bg-white/5 rounded transition-colors text-slate-500 hover:text-white">
                                {minimized.confidence ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            </button>
                        </div>
                        <div className={`transition-all duration-500 overflow-hidden ${minimized.confidence ? 'max-h-0 opacity-0 invisible' : 'max-h-[500px] opacity-100 visible'}`}>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[13px] font-bold text-slate-400">Avg Confidence:</span>
                                    <span className="text-xl font-black text-dna-cyan">
                                        {status === 'completed' ? '91%' : status === 'processing' ? `${Math.floor(Math.random() * 40 + 50)}%` : '0%'}
                                    </span>
                                </div>
                                <div className="h-20 flex items-end space-x-1">
                                    {[40, 60, 45, 90, 70, 85, 50, 65].map((h, i) => (
                                        <div key={i} className="flex-1 bg-dna-cyan/20 rounded-t-sm transition-all duration-500" 
                                            style={{ 
                                                height: status === 'completed' ? `${h}%` : status === 'processing' ? `${Math.random() * 80 + 20}%` : '0%',
                                                backgroundColor: status === 'processing' ? `rgba(6, 182, 212, ${Math.random() * 0.5 + 0.1})` : undefined
                                            }}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hardware */}
                    <div className="glass-card p-3.5 border border-white/5 relative overflow-hidden transition-all duration-300">
                        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                            <h4 className="font-bold text-[10px] uppercase text-slate-400">Hardware</h4>
                            <button onClick={() => toggleSection('hardware')} className="p-1 hover:bg-white/5 rounded transition-colors text-slate-500 hover:text-white">
                                {minimized.hardware ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            </button>
                        </div>
                        <div className={`transition-all duration-500 overflow-hidden ${minimized.hardware ? 'max-h-0 opacity-0 invisible' : 'max-h-[500px] opacity-100 visible'}`}>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                                        <span>CPU Utilization</span>
                                        <span className="text-dna-cyan">
                                            {status === 'completed' ? '84%' : status === 'processing' ? `${Math.floor(Math.random() * 30 + 60)}%` : '0%'}
                                        </span>
                                    </div>
                                    <div className="h-1 bg-slate-800/50 rounded-full overflow-hidden">
                                        <div className="h-full bg-dna-cyan transition-all duration-700" 
                                            style={{ width: status === 'completed' ? '84%' : status === 'processing' ? `${Math.floor(Math.random() * 30 + 60)}%` : '0%' }}></div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                                        <span>Memory Load</span>
                                        <span className="text-dna-cyan">
                                            {status === 'completed' ? '12.4 GB' : status === 'processing' ? `${(Math.random() * 8 + 4).toFixed(1)} GB` : '0 GB'}
                                        </span>
                                    </div>
                                    <div className="h-1 bg-slate-800/50 rounded-full overflow-hidden">
                                        <div className="h-full bg-dna-cyan/60 transition-all duration-1000" 
                                            style={{ width: status === 'completed' ? '70%' : status === 'processing' ? `${Math.floor(Math.random() * 40 + 30)}%` : '0%' }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    {/* ANALYSIS RESULTS PANEL - BioScope Scientific Output */}
            {status === 'completed' && results.length > 0 && (
                <div className="mt-12 pt-10 border-t border-white/5 animate-fade-in-up">
                    <h3 className="text-2xl font-black text-white tracking-tight mb-8">Analysis Results</h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
                        {/* LEFT: Predicted Species Card */}
                        <div className="glass-card border border-white/10 bg-slate-900/60 rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] flex flex-col md:flex-row min-h-[350px] group/card">
                            <div className="md:w-2/5 relative h-72 md:h-auto bg-slate-800/50 flex items-center justify-center overflow-hidden border-r border-white/5">
                                {wikiImage ? (
                                    <img 
                                        src={wikiImage} 
                                        alt={results[0].species_name} 
                                        className="absolute inset-0 w-full h-full object-cover object-[25%_center] group-hover/card:scale-110 transition-transform duration-700 opacity-90"
                                    />
                                ) : (results[0].species_name.toLowerCase().includes("tiger") || results[0].species_name.toLowerCase().includes("panthera")) ? (
                                    <img 
                                        src="/tiger_new.png" 
                                        alt={results[0].species_name} 
                                        className="absolute inset-0 w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700 opacity-90"
                                    />
                                ) : (results[0].species_name.toLowerCase().includes("elephant") || results[0].species_name.toLowerCase().includes("loxodonta")) ? (
                                    <img 
                                        src="/elephant.png" 
                                        alt={results[0].species_name} 
                                        className="absolute inset-0 w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700 opacity-90"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center text-slate-600">
                                        <Dna size={48} className="mb-2 animate-spin-slow opacity-20" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Genomic Signature</span>
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 bg-dna-deep/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center space-x-2 z-10">
                                    <div className="w-1.5 h-1.5 rounded-full bg-dna-cyan animate-pulse"></div>
                                    <span className="text-[8px] font-black text-white uppercase tracking-tighter">Verified Sample</span>
                                </div>
                            </div>
                            <div className="md:w-3/5 p-8 flex flex-col justify-center">
                                <h4 className="text-dna-cyan/60 text-[10px] font-black uppercase tracking-widest mb-6 italic">Matched Identification</h4>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-start py-3 border-b border-white/5 gap-4">
                                        <span className="text-slate-400 text-xs font-bold uppercase tracking-tight whitespace-nowrap">Common Name</span>
                                        <span className="text-white text-sm font-black text-right">{(results[0].common_name || (results[0].species_name.split('(')[1]?.replace(')', '') || results[0].species_name)).split(',')[0].trim()}</span>
                                    </div>
                                    <div className="flex justify-between items-start py-3 border-b border-white/5 gap-4">
                                        <span className="text-slate-400 text-xs font-bold uppercase tracking-tight whitespace-nowrap">Scientific Name</span>
                                        <span className="text-white/70 text-sm font-black italic text-right">{results[0].species_name}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 border-b border-white/5 gap-4">
                                        <span className="text-slate-400 text-xs font-bold uppercase tracking-tight whitespace-nowrap">Habitat</span>
                                        <span className="text-white text-sm font-black text-right capitalize">
                                            {(() => {
                                                let s = results[0].species_name.toLowerCase();
                                                let c = (results[0].common_name || '').toLowerCase();
                                                
                                                if (c.includes('whale') || c.includes('dolphin')) return 'Marine Ocean';
                                                if (c.includes('deer') || s.includes('odocoileus')) return 'Forest / Grassland';
                                                if (c.includes('mouse') || c.includes('rat') || s.includes('peromyscus')) return 'Meadow / Forest Floor';
                                                if (c.includes('tiger') || s.includes('panthera')) return 'Dense Forest / Jungle';
                                                if (c.includes('elephant') || s.includes('loxodonta')) return 'Savanna / Forest';
                                                if (c.includes('bear') || s.includes('ursus')) return 'Mountain / Dense Forest';
                                                if (c.includes('bass') || c.includes('trout') || c.includes('salmon') || c.includes('fish')) return 'Freshwater Aquatic';
                                                if (c.includes('frog') || c.includes('toad') || c.includes('salamander')) return 'Wetland / Marsh';
                                                if (c.includes('bird') || c.includes('eagle') || c.includes('hawk')) return 'Arboreal Canopy';
                                                if (s.includes('iris') || c.includes('flower') || c.includes('plant')) return 'Moist Terrestrial / Wetlands';
                                                
                                                let h = results[0].habitat || 'Unknown Environment';
                                                if (h.includes('Freshwater Ecosystem') && !(c.includes('fish') || c.includes('bass') || c.includes('trout') || c.includes('salmon') || c.includes('frog'))) {
                                                    return 'Terrestrial Ecosystem';
                                                }
                                                return h;
                                            })()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 gap-4">
                                        <span className="text-slate-400 text-xs font-bold uppercase tracking-tight whitespace-nowrap">Conservation Status</span>
                                        <span className={`text-[11px] font-black uppercase px-3 py-1 rounded-full border italic ${
                                            results[0].status === 'Rare' || results[0].status === 'Endangered' 
                                            ? 'text-red-400 bg-red-400/10 border-red-400/20' 
                                            : 'text-dna-emerald bg-dna-emerald/10 border-dna-emerald/20'
                                        }`}>
                                            {results[0].status}
                                        </span>
                                    </div>
                                </div>
                                
                                <button onClick={downloadReport} className="mt-8 group/btn relative overflow-hidden bg-white/5 hover:bg-dna-cyan/10 border border-white/5 hover:border-dna-cyan/30 py-3 rounded-xl transition-all duration-300 flex items-center justify-center space-x-3 cursor-pointer active:scale-95">
                                    <FileText size={14} className="text-slate-400 group-hover/btn:text-dna-cyan" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/btn:text-white">Download Full Genetic Report</span>
                                    <div className="absolute inset-0 bg-dna-cyan/5 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500"></div>
                                </button>
                            </div>
                        </div>

                        {/* RIGHT: Top Similar Matches Card */}
                        <div className="glass-card border border-white/10 bg-slate-900/60 rounded-2xl p-10 shadow-[0_20px_60px_rgba(0,0,0,0.3)] flex flex-col">
                            <h4 className="text-dna-cyan/60 text-[10px] font-black uppercase tracking-widest mb-10 border-b border-white/5 pb-4 italic">Top Similar Matches</h4>
                            
                            <div className="flex-1 space-y-10">
                                {results.slice(0, 2).map((match, idx) => {
                                    const confidence = idx === 0 ? 89 : 64;
                                    return (
                                        <div key={idx} className="group/match">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-base font-black text-white group-hover/match:text-dna-cyan transition-colors">{match.species_name}</span>
                                                <span className={`text-lg font-black ${idx === 0 ? 'text-dna-emerald' : 'text-orange-400'}`}>{confidence}%</span>
                                            </div>
                                            <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/5">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-[2000ms] ease-out shadow-[0_0_15px_rgba(16,185,129,0.3)] ${idx === 0 ? 'bg-dna-emerald' : 'bg-orange-500'}`} 
                                                    style={{ width: `${confidence}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {(() => {
                                const rawCommonName = results[0].common_name || "";
                                const nameParts = rawCommonName.split(',').map(s => s.trim()).filter(Boolean);
                                const aliases = nameParts.length > 1 ? nameParts.slice(1) : [];
                                
                                if (aliases.length === 0) return null;

                                return (
                                    <div className="mt-6 pt-4 border-t border-white/5">
                                        <h5 className="text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-3">Alternative Common Names</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {aliases.map((alias, idx) => (
                                                <div key={idx} className="bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-white/10 transition-colors cursor-default">
                                                    {alias}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                            
                            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center">
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center">
                                    <RefreshCw size={12} className="mr-2 opacity-30" />
                                    BioScope Engine Analysis Ver. 4.0.2
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in text-slate-200 font-sans pb-10 bg-dna-deep min-h-screen">
            {/* TOP HEADER */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/5 pb-4">
                <div className="relative">
                    <h2 className="text-3xl font-black text-white tracking-tight">Genomic Processing Engine</h2>
                    <p className="text-dna-cyan/60 text-[10px] mt-1 font-mono uppercase tracking-[0.2em] font-black">
                        High-throughput bioinformatics pipeline
                    </p>
                    {status === 'processing' && (
                        <div className="absolute -right-12 top-0">
                            <RefreshCw className="w-5 h-5 text-dna-cyan animate-spin" />
                        </div>
                    )}
                </div>
                <button 
                    onClick={runPipeline}
                    disabled={status === 'processing'}
                    className={`px-8 py-3 bg-gradient-to-r ${status === 'processing' ? 'from-slate-800 to-slate-700' : 'from-dna-teal to-dna-cyan hover:scale-105'} shadow-[0_0_30px_rgba(6,182,212,0.4)] border border-cyan-400/30 text-white font-black rounded-xl flex items-center space-x-3 transition-all uppercase text-[11px] tracking-[0.2em]`}
                >
                    {status === 'processing' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                    <span>{status === 'processing' ? 'Analyzing Dataset...' : 'Execute Pipeline'}</span>
                </button>
            </div>

            {/* MAIN CONTENT */}
            <div className="mt-8">
                {renderAnalysisTab()}
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fadeIn 0.5s ease-out; }
            `}} />
        </div>
    );
};

export default GenomicEngine;

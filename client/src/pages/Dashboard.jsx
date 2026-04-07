import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    AreaChart,
    Area,
    Cell,
    Legend
} from 'recharts';
import {
    Users,
    Trophy,
    AlertCircle,
    Activity,
    ArrowUpRight,
    ShieldAlert,
    MapPin,
    Loader2,
    Calendar,
    Database,
    Search,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Globe
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, trend, loading }) => {
    return (
        <div className="glass-card p-5 relative overflow-hidden group border-l-4 h-full flex flex-col justify-between transition-all hover:scale-[1.02]" 
             style={{ borderLeftColor: color }}>
            <div className="flex justify-between items-start mb-4">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                    <Icon className="w-5 h-5 lg:w-6 lg:h-6" style={{ color: color }} />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-white/5 border border-white/10 ${trend >= 0 ? 'text-dna-emerald' : 'text-red-400'}`}>
                        <span className="text-xs">{trend >= 0 ? '↗' : '↘'}</span>
                        <span>{Math.abs(Number(trend)).toFixed(1)}%</span>
                    </div>
                )}
            </div>
            
            <div className="space-y-1">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em]">{title}</p>
                <div className="flex items-baseline space-x-2">
                    <h3 className="text-3xl font-black text-white leading-tight">
                        {loading ? <div className="w-16 h-8 bg-white/5 animate-pulse rounded-lg" /> : (value || '0')}
                    </h3>
                </div>
            </div>

            <div className="absolute -top-4 -right-4 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-700 pointer-events-none">
                <Icon className="w-24 h-24" style={{ color: color }} />
            </div>
        </div>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [activeRegionIdx, setActiveRegionIdx] = useState(0);
    const [metrics, setMetrics] = useState(null);
    const [speciesData, setSpeciesData] = useState([]);
    const [fullSpeciesList, setFullSpeciesList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [minimized, setMinimized] = useState({
        explorer: false
    });

    const toggleSection = (section) => {
        setMinimized(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const regionalHotspots = [
        { name: 'Brahmaputra Delta Zone', gps: '26.1° N, 91.7° E' },
        { name: 'Ganga Delta Region', gps: '22.5° N, 89.1° E' },
        { name: 'Western Ghats Reserve', gps: '10.8° N, 76.6° E' },
        { name: 'National Park System', gps: '29.5° N, 78.4° E' },
        { name: 'Mekong Delta Zone', gps: '10.2° N, 105.8° E' }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveRegionIdx((prev) => (prev + 1) % regionalHotspots.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const [metricsRes, speciesRes] = await Promise.all([
                axios.get('http://localhost:8000/api/metrics'),
                axios.get('http://localhost:8000/api/species'),
            ]);

            setMetrics(metricsRes.data);
            
            // Mapping for the Explorer and the Chart - Adding safety checks for species names
            const allMapped = (speciesRes.data || []).map(s => {
                const name = s.species_name || s.common_name || 'Unknown Species';
                const parts = String(name).split(' ');
                const shortName = parts.length > 1 ? `${parts[0][0]}. ${parts.slice(1).join(' ')}` : name;
                return {
                    name: name,
                    shortName: shortName,
                    value: s.count || 0,
                    region: s.geographic_region || 'Unknown Region',
                    status: s.status || 'Native'
                };
            });

            setFullSpeciesList(allMapped);

            // Comparative Threat Analysis: Pick 5 highly ranked species from each priority category
            const endangered = allMapped.filter(s => s.status === 'Endangered').sort((a,b) => b.value - a.value).slice(0, 5);
            const invasive = allMapped.filter(s => s.status === 'Invasive').sort((a,b) => b.value - a.value).slice(0, 5);
            const rare = allMapped.filter(s => s.status === 'Rare').sort((a,b) => b.value - a.value).slice(0, 5);

            setSpeciesData([...endangered, ...invasive, ...rare]);
            setLoading(false);
        } catch (err) {
            console.error("Dashboard synchronization failure:", err);
            setLoading(false);
        }

        // Fetch alerts separately so failures don't block the dashboard
        try {
            const alertsRes = await axios.get('http://localhost:8000/api/alerts');
            setAlerts(alertsRes.data);
        } catch (err) {
            console.warn("Alerts sync deferred:", err.message);
        }
    };

    useEffect(() => {
        fetchData();
        // Polling for live intelligence updates every 15 seconds
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }, []);

    const trendData = [
        { month: 'Jan', value: 40 },
        { month: 'Feb', value: 45 },
        { month: 'Mar', value: 42 },
        { month: 'Apr', value: 58 },
        { month: 'May', value: 65 },
        { month: 'Jun', value: 62 },
        { month: 'Jul', value: 78 },
    ];

    return (
        <div className="space-y-8 animate-fade-in pb-24">
            {/* BioScope Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Bio<span className="text-dna-cyan underline decoration-dna-cyan/20 underline-offset-8">Scope</span> | Intelligence</h2>
                    <p className="text-slate-400 text-sm mt-2 flex items-center">
                        <span className="w-2 h-2 rounded-full bg-dna-emerald mr-2 animate-pulse"></span>
                        Real-time AI monitoring of global hotspots & ecosystem health
                    </p>
                </div>
                <div className="flex space-x-3">
                    <button className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-300 hover:bg-white/10 transition-all">
                        <Calendar className="w-4 h-4 text-dna-emerald" />
                        <span>Last 30 Days</span>
                    </button>
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                <StatCard
                    title="Total Detections"
                    value={metrics?.total_detections}
                    icon={Activity}
                    color="#10b981"
                    trend={metrics?.richness_trend}
                    loading={loading}
                />
                <StatCard
                    title="Endangered Species"
                    value={metrics?.endangered_species}
                    icon={AlertCircle}
                    color="#f43f5e"
                    trend={metrics?.endangered_trend}
                    loading={loading}
                />
                <StatCard
                    title="Rare Species"
                    value={metrics?.rare_species}
                    icon={Trophy}
                    color="#06b6d4"
                    trend={metrics?.rare_trend}
                    loading={loading}
                />
                <StatCard
                    title="Invasive Species"
                    value={metrics?.invasive_species}
                    icon={ShieldAlert}
                    color="#818cf8"
                    trend={metrics?.invasive_trend}
                    loading={loading}
                />
                <StatCard
                    title="Shannon Index"
                    value={metrics?.shannon_index?.toFixed(2)}
                    icon={Users}
                    color="#94a3b8"
                    loading={loading}
                />
            </div>


            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Main Chart */}
                <div className="xl:col-span-2 glass-card p-6 min-h-[450px]">
                    <div className="flex items-center justify-between mb-8 text-slate-100">
                        <div>
                            <h3 className="text-xl font-bold italic tracking-tight">Ecosystem Threat Profile | <span className="text-dna-cyan uppercase animate-pulse">Comparative Priority Analysis</span></h3>
                            <p className="text-slate-400 text-xs">High-Fidelity grouping: 5 Endangered (Red) ➝ 5 Invasive (Purple) ➝ 5 Rare (Cyan)</p>
                        </div>
                    </div>
                    <div className="h-80 w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <BarChart data={speciesData.length > 0 ? speciesData : [{ shortName: 'No Data Detected', value: 0 }]}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                <XAxis
                                    dataKey="shortName"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }}
                                    interval={0}
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#ffffff05' }}
                                    allowEscapeViewBox={{ x: true, y: true }}
                                    wrapperStyle={{ zIndex: 1000 }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                              <div className="bg-[#1e293b]/95 border border-white/10 p-3 rounded-lg shadow-2xl backdrop-blur-md">
                                                    <p className="text-white text-sm font-bold tracking-tight mb-1">{data.name}</p>
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${data.status === 'Endangered' ? 'bg-red-500/20 text-red-500' :
                                                            data.status === 'Invasive' ? 'bg-purple-500/20 text-purple-400' :
                                                                data.status === 'Rare' ? 'bg-cyan-500/10 text-cyan-400' :
                                                                    'bg-emerald-500/10 text-emerald-400'
                                                            }`}>
                                                            {data.status}
                                                        </span>
                                                        <p className="text-slate-300 text-xs font-medium">
                                                            <span className="text-dna-cyan">{data.value.toLocaleString()}</span> Detections
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar
                                    dataKey="value"
                                    radius={[6, 6, 0, 0]}
                                    barSize={32}
                                >
                                    {speciesData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={
                                                entry.status === 'Invasive' ? 'url(#colorInvasive)' :
                                                    entry.status === 'Endangered' ? 'url(#colorEndangered)' :
                                                        entry.status === 'Rare' ? 'url(#colorRare)' :
                                                            entry.status === 'Concern' ? 'url(#colorConcern)' :
                                                                'url(#colorNative)'
                                            }
                                        />
                                    ))}
                                </Bar>
                                <defs>
                                    <linearGradient id="colorNative" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#10B981" stopOpacity={0.4} />
                                    </linearGradient>
                                    <linearGradient id="colorRare" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#06B6D4" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#06B6D4" stopOpacity={0.4} />
                                    </linearGradient>
                                    <linearGradient id="colorInvasive" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.4} />
                                    </linearGradient>
                                    <linearGradient id="colorEndangered" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#EF4444" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#EF4444" stopOpacity={0.4} />
                                    </linearGradient>
                                    <linearGradient id="colorConcern" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.4} />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Trends Chart */}
                <div className="glass-card p-6">
                    <h3 className="text-lg font-bold mb-6">Diversity Trends</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <AreaChart data={metrics?.trend_data?.length > 0 ? metrics.trend_data : trendData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', zIndex: 1000 }}
                                    allowEscapeViewBox={{ x: true, y: true }}
                                    formatter={(v) => [v, 'Species Detected']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#06B6D4"
                                    fill="url(#colorArea)"
                                    strokeWidth={2}
                                />
                                <defs>
                                    <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.2} />
                                        <stop offset="100%" stopColor="#06B6D4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>Bio-Volume Discovery Trend</span>
                            <span className="text-dna-cyan font-bold">{metrics?.total_detections ? metrics.total_detections.toLocaleString() : metrics?.species_richness || 0} Unified Detections</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Alert Panel */}
                <div className="glass-card overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center space-x-3 text-dna-cyan">
                            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                            <h3 className="font-bold">Bio-Surveillance & Alerts</h3>
                        </div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">{alerts.length} Active Events</span>
                    </div>
                    <div className="p-6 space-y-4 max-h-[460px] overflow-y-auto custom-scrollbar">
                        {alerts.length > 0 ? alerts.map(alert => {
                            const isEndangered = alert.type.includes("Conservation") || alert.message.includes("Endangered");
                            const isInvasive = alert.type.includes("Critical") || alert.message.includes("Invasive");
                            const isRare = alert.type.includes("Discovery") || alert.message.includes("Rare");

                            const themeColor = isEndangered ? "red" : isInvasive ? "purple" : isRare ? "cyan" : "slate";
                            const themeHex = isEndangered ? "#EF4444" : isInvasive ? "#8B5CF6" : isRare ? "#06B6D4" : "#94a3b8";

                            return (
                                <div key={alert.id} className="flex items-start space-x-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all group animate-fade-in">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border`}
                                        style={{ backgroundColor: `${themeHex}10`, borderColor: `${themeHex}30`, color: themeHex }}>
                                        <AlertCircle className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: themeHex }}>{alert.type}</span>
                                            <span className="text-slate-500 text-[10px] font-mono">{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <h4 className="font-bold text-slate-100 text-sm leading-tight leading-snug">
                                            {alert.message.split(alert.species_involved).map((part, i, arr) => (
                                                <React.Fragment key={i}>
                                                    {part}
                                                    {i < arr.length - 1 && (
                                                        <span className="text-dna-cyan underline decoration-dna-cyan/30 underline-offset-4 italic mx-1 px-1.5 py-0.5 rounded bg-dna-cyan/10 border border-dna-cyan/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]">
                                                            {alert.species_involved}
                                                        </span>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                                            <div className="flex items-center text-[10px] text-slate-400">
                                                <MapPin className="w-3 h-3 mr-1 opacity-50" />
                                                <span>Basin: <span className="text-slate-200">{alert.location}</span></span>
                                            </div>
                                            <div className="flex items-center text-[10px] text-slate-400">
                                                <Activity className="w-3 h-3 mr-1 opacity-50" />
                                                <span>Risk: <span className="font-bold" style={{ color: themeHex }}>
                                                    {isEndangered ? "EXTREME CONSERVATION RISK" :
                                                        isInvasive ? "CRITICAL ECO-THREAT" :
                                                            isRare ? "HIGH BIOLOGICAL PRIORITY" :
                                                                "SIGNIFICANT"}
                                                </span></span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate('/alerts')}
                                        className={`p-2 rounded-lg opacity-40 group-hover:opacity-100 transition-all hover:bg-white/5 active:scale-95 cursor-pointer`}
                                        title="Investigate in Alert Center"
                                    >
                                        <ArrowUpRight className="w-4 h-4 text-slate-400" />
                                    </button>
                                </div>
                            );
                        }) : (
                            <div className="h-40 flex flex-col items-center justify-center text-slate-500">
                                <Activity className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-sm italic">Bio-Sweep in progress. All clear.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Map Preview */}
                <div className="glass-card p-6 h-full min-h-[350px] flex flex-col relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-dna-emerald/5 blur-[80px] -z-10 group-hover:bg-dna-emerald/10 transition-all duration-1000"></div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <div className="flex items-center space-x-2">
                            <Globe className="w-5 h-5 text-dna-emerald animate-pulse" />
                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-100">Global Surveillance Matrix</h3>
                        </div>
                        <button
                            onClick={() => navigate('/map')}
                            className="px-3 py-1.5 bg-dna-cyan/10 text-dna-cyan border border-dna-cyan/20 rounded-lg text-[10px] uppercase font-black tracking-widest hover:bg-dna-cyan/20 transition-all active:scale-95 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                        >
                            Deploy GIS Agent
                        </button>
                    </div>
                    
                    <div className="flex-1 bg-slate-950 rounded-2xl overflow-hidden relative border border-white/10 shadow-inner group-hover:border-dna-emerald/30 transition-all duration-500">
                        {/* High-fidelity dark map background */}
                        <div className="absolute inset-0 opacity-40" style={{ 
                            backgroundImage: `radial-gradient(circle at 2px 2px, #1e293b 1px, transparent 0)`,
                            backgroundSize: '24px 24px' 
                        }}></div>

                        <div className="absolute inset-0 flex items-center justify-center">
                            {/* Live Genomic Hotspots Layer */}
                            {regionalHotspots.map((spot, i) => (
                                <div 
                                    key={i}
                                    className={`absolute transition-all duration-1000 ${i === activeRegionIdx ? 'opacity-100 scale-100' : 'opacity-20 scale-90'}`}
                                    style={{ 
                                        top: `${25 + (i * 15) % 50}%`, 
                                        left: `${15 + (i * 20) % 70}%` 
                                    }}
                                >
                                    <div className="relative">
                                        <div className={`absolute -inset-8 rounded-full blur-2xl transition-all duration-1000 ${i === activeRegionIdx ? 'bg-dna-emerald/20 opacity-100' : 'bg-transparent opacity-0'}`}></div>
                                        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-[0_0_15px_rgba(16,185,129,0.8)] transition-all duration-500 ${i === activeRegionIdx ? 'bg-dna-emerald scale-125' : 'bg-slate-700'}`}></div>
                                        {i === activeRegionIdx && (
                                            <div className="absolute top-1/2 left-4 -translate-y-1/2 whitespace-nowrap">
                                                <div className="glass-card px-3 py-1.5 border-dna-emerald/30 scale-90 origin-left animate-slide-right bg-slate-900/90 backdrop-blur-xl">
                                                    <p className="text-[10px] text-white font-black uppercase tracking-tighter">{spot.name}</p>
                                                    <p className="text-[8px] text-dna-cyan font-bold font-mono">{spot.gps}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Scanning Overlay */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <div className="w-full h-1 bg-gradient-to-r from-transparent via-dna-emerald/30 to-transparent absolute top-0 animate-[scanning_4s_linear_infinite] shadow-[0_0_20px_rgba(16,185,129,0.6)]"></div>
                        </div>

                        {/* Status Watermark */}
                        <div className="absolute bottom-4 right-4 text-right flex flex-col items-end">
                            <div className="flex items-center space-x-1.5 mb-1 bg-slate-900/60 px-2 py-0.5 rounded border border-white/5">
                                <span className="w-1.5 h-1.5 rounded-full bg-dna-emerald animate-pulse"></span>
                                <span className="text-[8px] text-slate-300 font-bold uppercase tracking-widest">Resolver Active</span>
                            </div>
                            <p className="text-[10px] text-dna-cyan/40 font-black tracking-[0.2em]">CORTEX-G.V4.2</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* GENO-DATABASE EXPLORER SECTION */}
            <div className="mt-8 glass-card border border-white/5 bg-slate-900/40 relative overflow-hidden transition-all duration-300">
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Database className="w-5 h-5 text-dna-cyan" />
                        <h3 className="text-xl font-black text-white tracking-tight text-glow">Geno-Database Explorer</h3>
                    </div>
                    <button onClick={() => toggleSection('explorer')} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors text-slate-500 hover:text-white border border-white/5">
                        {minimized.explorer ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>
                </div>

                <div className={`transition-all duration-500 overflow-hidden ${minimized.explorer ? 'max-h-0 opacity-0 invisible' : 'max-h-[3000px] opacity-100 visible'}`}>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.02] text-slate-500 text-[10px] uppercase tracking-[0.2em] font-black border-b border-white/5">
                                    <th className="px-6 py-4">Scientific Classification</th>
                                    <th className="px-6 py-4">Priority Level</th>
                                    <th className="px-6 py-4">Database Source</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Detections</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {fullSpeciesList.length > 0 ? fullSpeciesList
                                    .slice((currentPage - 1) * 30, currentPage * 30)
                                    .map((item, idx) => (
                                        <tr key={idx} className="hover:bg-white/[0.03] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-200 group-hover:text-dna-cyan transition-colors">{item.name}</span>
                                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">NCBI Genomic Entry</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-black tracking-tighter" style={{
                                                    color: item.status === 'Endangered' ? '#EF4444' :
                                                        item.status === 'Invasive' ? '#A78BFA' :
                                                            item.status === 'Rare' ? '#22D3EE' : '#94A3B8'
                                                }}>
                                                    {item.status === 'Endangered' ? 'EXTREME' :
                                                        item.status === 'Invasive' ? 'CRITICAL' :
                                                            item.status === 'Rare' ? 'HIGH PRIORITY' : 'STABLE'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                                    <Globe className="w-3 h-3 text-dna-cyan/40" />
                                                    <span>All Regions (Auto-Detect)</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border italic ${
                                                    item.status === 'Endangered' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                    item.status === 'Invasive' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                                    item.status === 'Rare' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                                                    'bg-emerald-500/10 text-dna-emerald border-emerald-500/20'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-sm font-black text-dna-cyan">{item.value}</span>
                                            </td>
                                        </tr>
                                    )) : (
                                    <tr>
                                        <td colSpan="5" className="py-20 text-center text-slate-600 font-black uppercase tracking-widest text-xs opacity-20">
                                            Awaiting Data Sync...
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* PAGINATION & STATS FOOTER */}
                    <div className="p-6 border-t border-white/5 bg-white/[0.01] flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            {fullSpeciesList.length > 0 ? (
                                <>Showing <span className="text-slate-300">{(currentPage - 1) * 30 + 1}-{Math.min(currentPage * 30, fullSpeciesList.length)}</span> out of <span className="text-slate-300">{fullSpeciesList.length}</span> entries</>
                            ) : 'Showing 0-0 of 0 entries'}
                        </div>

                        <div className="flex items-center space-x-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1 || fullSpeciesList.length === 0}
                                className="flex items-center space-x-1 px-3 py-2 rounded-xl border border-white/10 text-[10px] font-black text-slate-500 hover:text-white hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
                            >
                                <ChevronLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
                                <span className="hidden sm:inline">Prev</span>
                            </button>
                            
                            <div className="flex items-center space-x-1.5 mx-2">
                                {Array.from({ length: Math.min(5, Math.ceil(fullSpeciesList.length / 30)) }).map((_, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all border ${
                                            currentPage === i + 1 
                                            ? 'bg-dna-cyan text-slate-900 border-dna-cyan shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                                            : 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                {Math.ceil(fullSpeciesList.length / 30) > 5 && <span className="text-slate-600 px-1">...</span>}
                            </div>

                            <button 
                                onClick={() => setCurrentPage(p => Math.min(Math.ceil(fullSpeciesList.length / 30), p + 1))}
                                disabled={currentPage >= Math.ceil(fullSpeciesList.length / 30) || fullSpeciesList.length === 0}
                                className="flex items-center space-x-1 px-3 py-2 rounded-xl border border-white/10 text-[10px] font-black text-slate-500 hover:text-white hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
                            >
                                <span className="hidden sm:inline">Next</span>
                                <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                            </button>
                        </div>

                        <div className="text-[10px] font-black text-dna-cyan/40 uppercase tracking-widest">
                            BioScope Engine v4.0
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

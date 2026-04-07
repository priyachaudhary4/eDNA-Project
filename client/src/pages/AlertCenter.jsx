import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    Bell,
    AlertTriangle,
    ShieldAlert,
    CheckCircle2,
    ArrowRight,
    Send,
    Download,
    Filter,
    Trash2,
    Loader2,
    Search,
    MapPin,
    Calendar,
    ChevronRight,
    ChevronLeft,
    X,
    MoreVertical,
    Activity,
    Eye,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

const AlertCenter = () => {
    const [alerts, setAlerts] = useState([]);
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [isDisseminating, setIsDisseminating] = useState(false);
    const [broadcastData, setBroadcastData] = useState({
        species: '',
        location: 'Brahmaputra Basin',
        type: 'Critical Alert'
    });
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [broadcastSuccess, setBroadcastSuccess] = useState(false);
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Reset to page 1 when search or filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterType]);

    const fetchData = async () => {
        try {
            const metricsRes = await axios.get('http://localhost:8000/api/metrics');
            setMetrics(metricsRes.data);
        } catch (err) {
            console.warn("Alert Center: metrics sync deferred:", err.message);
        }

        try {
            const alertsRes = await axios.get('http://localhost:8000/api/alerts');
            setAlerts(alertsRes.data);
        } catch (err) {
            console.warn("Alert Center: alerts sync deferred:", err.message);
        }

        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        // Polling for new alerts and metrics every 30 seconds
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const filteredAlerts = useMemo(() => {
        return alerts.filter(alert => {
            const matchesSearch = 
                alert.species_involved?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                alert.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                alert.location?.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesType = filterType === 'All' || 
                (filterType === 'Critical' && (alert.type.toLowerCase().includes('critical') || alert.type.toLowerCase().includes('invasive'))) ||
                (filterType === 'Discovery' && (alert.type.toLowerCase().includes('discovery') || alert.type.toLowerCase().includes('rare'))) ||
                (filterType === 'Conservation' && (alert.type.toLowerCase().includes('conservation') || alert.type.toLowerCase().includes('priority') || alert.type.toLowerCase().includes('warning')));
            
            return matchesSearch && matchesType;
        });
    }, [alerts, searchQuery, filterType]);

    const getTypeStyles = (type) => {
        const t = type?.toLowerCase() || '';
        if (t.includes('critical') || t.includes('invasive')) return {
            bg: 'bg-purple-500/10',
            text: 'text-purple-400',
            border: 'border-purple-500/30',
            glow: 'shadow-[0_0_15px_rgba(139,92,246,0.2)]',
            icon: ShieldAlert
        };
        if (t.includes('discovery') || t.includes('rare')) return {
            bg: 'bg-dna-cyan/10',
            text: 'text-dna-cyan',
            border: 'border-dna-cyan/30',
            glow: 'shadow-[0_0_15px_rgba(6,182,212,0.2)]',
            icon: CheckCircle2
        };
        if (t.includes('warning') || t.includes('conservation') || t.includes('endangered')) return {
            bg: 'bg-red-500/10',
            text: 'text-red-400',
            border: 'border-red-500/30',
            glow: 'shadow-[0_0_15px_rgba(239,68,68,0.2)]',
            icon: AlertTriangle
        };
        return {
            bg: 'bg-slate-500/10',
            text: 'text-slate-400',
            border: 'border-white/10',
            glow: '',
            icon: Bell
        };
    };

    const handleExport = () => {
        const headers = ['ID', 'Type', 'Species', 'Message', 'Location', 'Timestamp'];
        const csvRows = [
            headers.join(','),
            ...alerts.map(a => [
                a.id,
                `"${a.type}"`,
                `"${a.species_involved || ''}"`,
                `"${a.message}"`,
                `"${a.location}"`,
                new Date(a.timestamp).toLocaleString()
            ].join(','))
        ];
        
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BioScope_Alert_Log_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const handleDeleteAlert = async (id) => {
        try {
            await axios.delete(`http://localhost:8000/api/alerts/${id}`);
            setAlerts(prev => prev.filter(a => a.id !== id));
        } catch (err) {
            console.error("Failed to delete alert", err);
        }
    };

    return (
        <div className="space-y-6 lg:space-y-8 animate-fade-in pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center">
                        <ShieldAlert className="w-8 h-8 mr-3 text-red-500 animate-pulse" />
                        Bio-Surveillance <span className="text-slate-500 ml-2 font-light">| Center</span>
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Real-time threat monitoring and cross-basin notification protocol</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button 
                        onClick={handleExport}
                        className="flex-1 md:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-300 hover:bg-white/10 transition-all active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Export Log</span>
                        <span className="sm:hidden">Export</span>
                    </button>
                    <button 
                        className="flex-1 md:flex-none btn-primary px-6 py-2.5 flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 transition-all"
                        onClick={() => setIsDisseminating(true)}
                    >
                        <Send className="w-4 h-4" />
                        <span className="font-black uppercase tracking-widest text-xs">Broadcast Protocol</span>
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-4 border-l-4 border-purple-500 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShieldAlert className="w-12 h-12 text-purple-500" />
                    </div>
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Invasive Species</p>
                    <div className="flex items-end space-x-2">
                        <h3 className="text-2xl font-black text-white leading-none">
                            {loading ? '--' : (metrics?.invasive_species || 0).toString().padStart(2, '0')}
                        </h3>
                        <span className="text-[8px] text-purple-400 font-bold mb-1 px-1 py-0.5 bg-purple-500/10 rounded">Critical</span>
                    </div>
                </div>

                <div className="glass-card p-4 border-l-4 border-dna-cyan relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                        <CheckCircle2 className="w-12 h-12 text-dna-cyan" />
                    </div>
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Rare Discoveries</p>
                    <div className="flex items-end space-x-2">
                        <h3 className="text-2xl font-black text-white leading-none">
                            {loading ? '--' : (metrics?.rare_species || 0).toString().padStart(2, '0')}
                        </h3>
                        <span className="text-[8px] text-dna-cyan font-bold mb-1 px-1 py-0.5 bg-dna-cyan/10 rounded">Validated</span>
                    </div>
                </div>

                <div className="glass-card p-4 border-l-4 border-red-500 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                        <AlertTriangle className="w-12 h-12 text-red-500" />
                    </div>
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Endangered Species</p>
                    <div className="flex items-end space-x-2">
                        <h3 className="text-2xl font-black text-white leading-none">
                            {loading ? '--' : (metrics?.endangered_species || 0).toString().padStart(2, '0')}
                        </h3>
                        <span className="text-[8px] text-red-400 font-bold mb-1 px-1 py-0.5 bg-red-500/10 rounded">Priority</span>
                    </div>
                </div>

                <div className="glass-card p-4 border-l-4 border-amber-500 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Activity className="w-12 h-12 text-amber-500" />
                    </div>
                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">High Alert Total</p>
                    <div className="flex items-end space-x-2">
                        <h3 className="text-2xl font-black text-white leading-none">
                            {loading ? '--' : ((metrics?.invasive_species || 0) + (metrics?.rare_species || 0) + (metrics?.endangered_species || 0)).toString().padStart(2, '0')}
                        </h3>
                        <span className="text-[8px] text-amber-400 font-bold mb-1 px-1 py-0.5 bg-amber-500/10 rounded">Consolidated</span>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8 relative">
                {/* Mobile Filter Toggle */}
                <button 
                    onClick={() => setIsFilterVisible(!isFilterVisible)}
                    className="lg:hidden flex items-center justify-between w-full p-4 glass-card border border-white/10 group active:scale-[0.98] transition-all bg-slate-900/40 backdrop-blur-md"
                >
                    <div className="flex items-center space-x-3">
                        <Filter className={`w-4 h-4 ${isFilterVisible ? 'text-dna-cyan' : 'text-slate-500'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">Refine Surveillance Feed</span>
                    </div>
                    {isFilterVisible ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                {/* Left: Filter & Search Sidebar */}
                <div className={`lg:col-span-1 space-y-6 ${isFilterVisible ? 'block' : 'hidden lg:block animate-fade-in'}`}>
                    <div className="glass-card p-6 space-y-6 lg:sticky lg:top-24 shadow-2xl">
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center">
                                <Search className="w-4 h-4 mr-2 text-dna-cyan" />
                                Filter Parameters
                            </h4>
                            
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input 
                                    type="text" 
                                    placeholder="Search by species, basin..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="glass-input w-full pl-10 h-12 text-sm focus:border-dna-cyan transition-all"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Intensity Level</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['All', 'Critical', 'Discovery', 'Conservation'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => {
                                            setFilterType(type);
                                            // Optional: Close on mobile after selection path
                                            // if (window.innerWidth < 1280) setIsFilterVisible(false);
                                        }}
                                        className={`px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-tighter transition-all border ${
                                            filterType === type 
                                            ? 'bg-dna-cyan/20 border-dna-cyan text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                                            : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'
                                        }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5">
                            <h4 className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mb-4">Transmission Status</h4>
                            <div className="space-y-3">
                                {[
                                    { label: 'Wildlife Control', status: 'Online', color: 'text-dna-emerald' },
                                    { label: 'Field Units', status: 'Active', color: 'text-dna-emerald' },
                                    { label: 'Global Registry', status: 'Syncing', color: 'text-dna-cyan' },
                                ].map(ch => (
                                    <div key={ch.label} className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/5 transition-colors">
                                        <span className="text-xs text-slate-400 font-bold">{ch.label}</span>
                                        <div className="flex items-center space-x-2">
                                            <div className={`w-1 h-1 rounded-full bg-current ${ch.color} animate-pulse`}></div>
                                            <span className={`text-[9px] font-black uppercase ${ch.color}`}>{ch.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Alert Stream */}
                <div className="lg:col-span-2 xl:col-span-3 space-y-4">
                    <div className="glass-card overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-slate-900/50 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Activity className="w-4 h-4 text-dna-cyan" />
                                <span className="text-xs font-black uppercase text-slate-500 tracking-widest">Live Alert Stream</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                {filteredAlerts.length} Events Listed
                            </span>
                        </div>

                        <div className="divide-y divide-white/5 bg-slate-900/40">
                            {loading ? (
                                <div className="py-24 flex flex-col items-center justify-center space-y-4">
                                    <Loader2 className="w-12 h-12 text-dna-cyan animate-spin" />
                                    <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">Synchronizing Neural-Link Feed...</p>
                                </div>
                            ) : filteredAlerts.length > 0 ? (
                                (() => {
                                    const startIndex = (currentPage - 1) * itemsPerPage;
                                    const paginatedAlerts = filteredAlerts.slice(startIndex, startIndex + itemsPerPage);
                                    
                                    return paginatedAlerts.map(alert => {
                                        const styles = getTypeStyles(alert.type);
                                        const Icon = styles.icon;
                                        return (
                                            <div 
                                                key={alert.id} 
                                                className="p-5 lg:p-6 flex flex-col sm:flex-row items-start justify-between hover:bg-white/[0.03] transition-all group relative cursor-pointer"
                                                onClick={() => setSelectedAlert(alert)}
                                            >
                                                <div className="flex items-start space-x-4 lg:space-x-6 w-full">
                                                    <div className={`p-3.5 rounded-2xl border ${styles.bg} ${styles.border} ${styles.text} ${styles.glow} flex-shrink-0 group-hover:scale-110 transition-transform duration-500`}>
                                                        <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
                                                    </div>
                                                    <div className="space-y-1.5 flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                                                            <h4 className="font-black text-white text-base lg:text-lg tracking-tight group-hover:text-dna-cyan transition-colors truncate">
                                                                {alert.species_involved || 'Unknown Biometric Entry'}
                                                            </h4>
                                                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-tighter ${styles.bg} ${styles.text} ${styles.border}`}>
                                                                {alert.type}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs lg:text-sm text-slate-400 leading-relaxed font-medium">
                                                            {alert.message}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2">
                                                            <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                                                                <MapPin className="w-3 h-3 mr-1.5 text-dna-cyan opacity-60" />
                                                                <span>Basin: <span className="text-slate-300 ml-1">{alert.location}</span></span>
                                                            </div>
                                                            <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                                                                <Calendar className="w-3 h-3 mr-1.5 text-dna-cyan opacity-60" />
                                                                <span>{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                <span className="mx-1.5 opacity-30">|</span>
                                                                <span>{new Date(alert.timestamp).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex sm:flex-col items-center justify-end space-x-2 sm:space-x-0 sm:space-y-2 mt-4 sm:mt-0 w-full sm:w-auto opacity-40 group-hover:opacity-100 transition-all">
                                                    <button 
                                                        className="p-2.5 text-slate-400 hover:text-white bg-white/5 border border-white/10 rounded-xl hover:bg-slate-800 transition-all flex-1 sm:flex-none"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedAlert(alert);
                                                        }}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        className="p-2.5 text-slate-400 hover:text-red-400 bg-white/5 border border-white/10 rounded-xl hover:bg-red-500/10 hover:border-red-500/30 transition-all flex-1 sm:flex-none"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteAlert(alert.id);
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()
                            ) : (
                                <div className="py-32 flex flex-col items-center justify-center text-slate-600">
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5 relative">
                                        <ShieldAlert className="w-10 h-10 opacity-20" />
                                        <div className="absolute inset-0 bg-dna-cyan/5 blur-2xl rounded-full"></div>
                                    </div>
                                    <p className="text-lg font-black uppercase tracking-[0.2em] text-slate-500">Biological Silence</p>
                                    <p className="text-xs font-bold text-slate-600 mt-2 uppercase tracking-widest italic">No matching alerts detected in current sector</p>
                                    <button 
                                        onClick={() => {setFilterType('All'); setSearchQuery('');}}
                                        className="mt-6 text-[10px] font-black uppercase text-dna-cyan hover:underline tracking-[0.3em] bg-dna-cyan/10 px-4 py-2 rounded-lg border border-dna-cyan/20 transition-all"
                                    >
                                        Reset Neural Filters
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-4 bg-slate-900 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                {filteredAlerts.length > 0 ? (
                                    <>Showing <span className="text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="text-white">{Math.min(currentPage * itemsPerPage, filteredAlerts.length)}</span> of <span className="text-white">{filteredAlerts.length}</span> threats</>
                                ) : '0 threats detected'}
                            </div>

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
                                    {Array.from({ length: Math.min(5, Math.ceil(filteredAlerts.length / itemsPerPage)) }).map((_, i) => (
                                        <button 
                                            key={i}
                                            onClick={() => setCurrentPage(i + 1)}
                                            className={`w-8 h-8 rounded-xl text-[10px] font-black transition-all border ${
                                                currentPage === i + 1 
                                                ? 'bg-dna-cyan text-slate-900 border-dna-cyan shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                                                : 'border-white/5 text-slate-500 hover:text-white hover:bg-white/5 hover:border-white/20'
                                            }`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                    {Math.ceil(filteredAlerts.length / itemsPerPage) > 5 && <span className="text-slate-700 font-black px-1">...</span>}
                                </div>

                                <button 
                                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredAlerts.length / itemsPerPage), prev + 1))}
                                    disabled={currentPage >= Math.ceil(filteredAlerts.length / itemsPerPage) || filteredAlerts.length === 0}
                                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-black text-slate-500 hover:text-white hover:bg-white/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed group"
                                >
                                    <span>Next</span>
                                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                                </button>
                            </div>
                        </div>

                        <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                            <span>BioScope v4.0.2 Security Core</span>
                            <div className="flex items-center space-x-4">
                                <span className="flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-dna-emerald mr-1.5"></div>ENC Secure</span>
                                <span className="flex items-center"><div className="w-1.5 h-1.5 rounded-full bg-dna-cyan mr-1.5"></div>Real-time Polling Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Selected Alert Detailed View Modal */}
            {selectedAlert && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 lg:p-8 animate-in fade-in transition-all">
                    <div 
                        className="absolute inset-0 bg-dna-deep/90 backdrop-blur-xl" 
                        onClick={() => setSelectedAlert(null)}
                    ></div>
                    <div className="glass-card w-full max-w-2xl bg-slate-950/80 border border-white/10 relative z-10 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-300">
                        <div className={`h-1.5 w-full ${getTypeStyles(selectedAlert.type).bg} bg-opacity-100`}></div>
                        
                        <div className="p-8">
                            <div className="flex items-start justify-between mb-8">
                                <div className="space-y-1">
                                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full border ${getTypeStyles(selectedAlert.type).bg} ${getTypeStyles(selectedAlert.type).text} ${getTypeStyles(selectedAlert.type).border}`}>
                                        {selectedAlert.type}
                                    </span>
                                    <h3 className="text-3xl font-black text-white pt-4 tracking-tighter">
                                        {selectedAlert.species_involved}
                                    </h3>
                                </div>
                                <button 
                                    onClick={() => setSelectedAlert(null)}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/10"
                                >
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2 group hover:bg-white/[0.07] transition-all">
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Spatial Reference</p>
                                    <div className="flex items-center space-x-2 text-white">
                                        <MapPin className="w-4 h-4 text-dna-cyan" />
                                        <span className="font-bold">{selectedAlert.location} Basin</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-2 group hover:bg-white/[0.07] transition-all">
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Detection Timestamp</p>
                                    <div className="flex items-center space-x-2 text-white">
                                        <Calendar className="w-4 h-4 text-dna-cyan" />
                                        <span className="font-bold">{new Date(selectedAlert.timestamp).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <h4 className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Situation Audit</h4>
                                <div className="p-6 bg-slate-900/50 border border-white/5 rounded-2xl italic text-slate-300 leading-relaxed shadow-inner">
                                    "{selectedAlert.message}"
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <button className="flex-1 btn-primary py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-2 active:scale-95 transition-all">
                                    <ShieldAlert className="w-4 h-4" />
                                    <span>Initiate Verification</span>
                                </button>
                                <button 
                                    className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all active:scale-95"
                                    onClick={() => setSelectedAlert(null)}
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Broadcast Protocol Modal */}
            {isDisseminating && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in transition-all">
                    <div 
                        className="absolute inset-0 bg-dna-deep/95 backdrop-blur-2xl" 
                        onClick={() => setIsDisseminating(false)}
                    ></div>
                    <div className="glass-card w-full max-w-lg border border-white/10 relative z-10 overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.15)] animate-in slide-in-from-bottom-8 duration-500">
                        <div className="p-8">
                            <div className="flex items-start justify-between mb-8">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-white tracking-tight">Manual Broadcast</h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Manual Threat Dissemination Protocol</p>
                                </div>
                                <button onClick={() => setIsDisseminating(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            <form className="space-y-6" onSubmit={async (e) => {
                                e.preventDefault();
                                setIsBroadcasting(true);
                                try {
                                    await axios.post('http://localhost:8000/api/alerts', broadcastData);
                                    setBroadcastSuccess(true);
                                    setTimeout(() => {
                                        setIsDisseminating(false);
                                        setBroadcastSuccess(false);
                                        setBroadcastData({ species: '', location: 'Brahmaputra Basin', type: 'Critical Alert' });
                                        fetchData();
                                    }, 2000);
                                } catch (err) {
                                    console.error("Broadcast transmission failure", err);
                                } finally {
                                    setIsBroadcasting(false);
                                }
                            }}>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Species of Concern</label>
                                    <input 
                                        type="text" 
                                        required
                                        className="glass-input w-full" 
                                        placeholder="e.g., P. tigris altica" 
                                        value={broadcastData.species}
                                        onChange={(e) => setBroadcastData({...broadcastData, species: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Target Location / Basin</label>
                                    <select 
                                        className="glass-input w-full"
                                        value={broadcastData.location}
                                        onChange={(e) => setBroadcastData({...broadcastData, location: e.target.value})}
                                    >
                                        <option>Brahmaputra Basin</option>
                                        <option>Ganga Delta</option>
                                        <option>Western Ghats Reserve</option>
                                        <option>Mekong Delta Zone</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Transmission Priority</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            type="button" 
                                            onClick={() => setBroadcastData({...broadcastData, type: 'Critical Alert'})}
                                            className={`px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-tighter transition-all border ${
                                                broadcastData.type === 'Critical Alert' 
                                                ? 'bg-red-500/20 border-red-500/30 text-red-500' 
                                                : 'bg-white/5 border-white/10 text-slate-500'
                                            }`}
                                        >
                                            Critical Threat
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setBroadcastData({...broadcastData, type: 'Standard Discovery'})}
                                            className={`px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-tighter transition-all border ${
                                                broadcastData.type === 'Standard Discovery' 
                                                ? 'bg-dna-cyan/20 border-dna-cyan/30 text-dna-cyan' 
                                                : 'bg-white/5 border-white/10 text-slate-500'
                                            }`}
                                        >
                                            Standard Discovery
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-white/10 flex space-x-3">
                                    <button 
                                        type="button"
                                        disabled={isBroadcasting}
                                        onClick={() => setIsDisseminating(false)}
                                        className="flex-1 py-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 font-black uppercase tracking-widest text-[10px] transition-all hover:bg-white/10"
                                    >
                                        Cancel Protocol
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={isBroadcasting || broadcastSuccess}
                                        className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all duration-500 ${
                                            broadcastSuccess 
                                            ? 'bg-dna-emerald text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                                            : 'btn-primary shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                                        }`}
                                    >
                                        {isBroadcasting ? (
                                            <div className="flex items-center justify-center space-x-2">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                <span>Uplink Established...</span>
                                            </div>
                                        ) : broadcastSuccess ? (
                                            <div className="flex items-center justify-center space-x-2">
                                                <CheckCircle2 className="w-4 h-4" />
                                                <span>Broadcast Authorized</span>
                                            </div>
                                        ) : 'Authorize Broadcast'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlertCenter;


import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Upload,
    MapPin,
    FileText,
    Download,
    Send,
    Search,
    Filter,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    Check,
    Trash2,
    Pause,
    Play
} from 'lucide-react';

const DataUpload = () => {
    const navigate = useNavigate();
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [jobs, setJobs] = useState(() => {
        const saved = localStorage.getItem('bioScopeJobs');
        return saved ? JSON.parse(saved) : [];
    });
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const fileInputRef = useRef(null);

    // Metadata state
    const [region, setRegion] = useState(() => localStorage.getItem('uploadRegion') || 'Brahmaputra Basin');
    const [sampleType, setSampleType] = useState(() => localStorage.getItem('uploadSampleType') || 'Water eDNA');
    const [habitat, setHabitat] = useState(() => localStorage.getItem('uploadHabitat') || '');
    const [date, setDate] = useState(() => localStorage.getItem('uploadDate') || new Date().toISOString().split('T')[0]);
    const [forceMetadata, setForceMetadata] = useState(false);

    // Persist metadata to local storage so it survives tab switches
    useEffect(() => {
        localStorage.setItem('uploadRegion', region);
        localStorage.setItem('uploadSampleType', sampleType);
        localStorage.setItem('uploadHabitat', habitat);
        localStorage.setItem('uploadDate', date);
    }, [region, sampleType, habitat, date]);

    // Persist jobs list whenever it updates
    useEffect(() => {
        localStorage.setItem('bioScopeJobs', JSON.stringify(jobs));
    }, [jobs]);

    const fetchJobs = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/samples');
            const mappedJobs = response.data.map(sample => ({
                id: sample.id,
                name: sample.filename,
                type: 'Pipeline',
                detections: sample.detection_count || 0,
                status: sample.status,
                date: new Date(sample.sampling_date || sample.created_at || new Date()).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                }),
                is_active: sample.is_active
            })); // Removed .reverse() because backend is already sorted desc
            setJobs(mappedJobs);
        } catch (err) {
            console.error("Failed to fetch jobs", err);
        }
    };

    useEffect(() => {
        fetchJobs();
        // Periodic refresh every 30 seconds to update job detection counts and statuses
        const interval = setInterval(fetchJobs, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = async (file) => {
        if (!file) return;

        setUploading(true);
        setError(null);
        setSuccessMsg(null);
        setProgress(0);

        const regionCoords = {
            'Brahmaputra Basin': { lat: 26.11, lng: 91.70 },
            'Ganga Delta': { lat: 22.50, lng: 89.10 },
            'Western Ghats Reserve': { lat: 10.80, lng: 76.60 },
            'National Park System': { lat: 29.50, lng: 78.40 },
            'Mekong Delta Zone': { lat: 10.20, lng: 105.80 }
        };

        const currentCoords = regionCoords[region] || { lat: 26.11, lng: 91.70 };

        const formData = new FormData();
        formData.append('file', file);
        formData.append('region', region);
        formData.append('date', date);
        formData.append('habitat', habitat || 'Freshwater Ecosystem');
        formData.append('sample_type', sampleType);
        formData.append('lat', currentCoords.lat.toString());
        formData.append('lng', currentCoords.lng.toString());
        formData.append('force_metadata', forceMetadata.toString());

        // Optimistic Job Entry for immediate visual feedback
        const tempJobId = `temp_${Date.now()}`;
        const optimisticJob = {
            id: tempJobId,
            name: file.name,
            type: 'Pipeline',
            detections: 0,
            status: 'Processing',
            date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            is_active: 1
        };
        setJobs(prev => [optimisticJob, ...prev]);

        try {
            const response = await axios.post('http://localhost:8000/api/upload', formData, {
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                }
            });

            // Update the optimistic job with real data
            const finalJob = {
                id: response.data.sample_id,
                name: file.name,
                type: 'Pipeline',
                detections: response.data.records_added || response.data.count || 0,
                status: response.data.status,
                date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                is_active: 1
            };

            setJobs(prev => prev.map(j => j.id === tempJobId ? finalJob : j));
            
            if (response.data.status === 'Failed') {
                setError(`Upload Failed: ${response.data.error || 'Sequence parser could not identify taxonomic data.'}`);
                setTimeout(() => {
                    setUploading(false);
                    setProgress(0);
                }, 1000);
            } else {
                setSuccessMsg("Sample successfully uploaded to Genomic Pipeline. Data is now available in the Intelligence Dashboard.");
                fetchJobs(); // Sync with server records
                setTimeout(() => {
                    setUploading(false);
                    setProgress(0);
                    // navigate('/dashboard'); // Removed automatic redirect
                }, 2000);
            }

        } catch (err) {
            setError("Pipeline Error: Backend server connection failed.");
            setJobs(prev => prev.filter(j => j.id !== tempJobId)); // Remove failed optimistic job
            setUploading(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/species');
            const data = response.data;

            if (data.length === 0) {
                setError("No taxonomic data available to export.");
                return;
            }

            // Simple CSV conversion
            const headers = Object.keys(data[0]).join(',');
            const rows = data.map(obj => Object.values(obj).join(',')).join('\n');
            const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `BioScope_Export_${new Date().getTime()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setSuccessMsg("Taxonomic report exported successfully!");
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err) {
            setError("Failed to generate export report.");
        }
    };

    const handleCriticalAlert = async () => {
        try {
            await axios.post('http://localhost:8000/api/alerts', {
                species: "Invasive Entry Detected",
                location: region,
                type: "Critical"
            });
            setSuccessMsg("CRITICAL ALERT DISSEMINATED to all regional authorities!");
            setTimeout(() => setSuccessMsg(null), 4000);
        } catch (err) {
            setError("Failed to broadcast alert. Check system connection.");
        }
    };

    const handleDelete = async (jobId) => {
        try {
            await axios.delete(`http://localhost:8000/api/samples/${jobId}`);
            setJobs(prev => prev.filter(j => j.id !== jobId));
            setSuccessMsg(`Sample successfully purged from BioScope Records.`);
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err) {
            setError("Purge failed. Database access error.");
        }
    };

    const handleToggleActive = async (jobId) => {
        try {
            const response = await axios.put(`http://localhost:8000/api/samples/${jobId}/toggle_active`);
            setJobs(prev => prev.map(j => j.id === jobId ? { ...j, is_active: response.data.is_active } : j));
            setSuccessMsg(`Sample dynamically ${response.data.is_active ? 'resumed' : 'paused'} in processing pipeline.`);
            setTimeout(() => setSuccessMsg(null), 3000);
        } catch (err) {
            setError("Pipeline toggle failed. Database unreachable.");
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm("CRITICAL: This will permanently purge ALL processed samples and taxonomic results from the BioScope Intelligence Core. Proceed?")) return;

        try {
            await axios.delete('http://localhost:8000/api/samples');
            setJobs([]);
            setSuccessMsg("BioScope Intelligence Core has been purged and reset.");
            setTimeout(() => setSuccessMsg(null), 4000);
        } catch (err) {
            setError("Bulk purge failed. System locked or unreachable.");
        }
    };

    const onButtonClick = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Data Upload & Management</h2>
                    <p className="text-slate-400 text-sm mt-1">Submit genomic samples and monitor processing status</p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center space-x-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-all text-slate-200"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export CSV</span>
                    </button>
                    <button
                        onClick={handleCriticalAlert}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm hover:bg-red-500/30 transition-all font-bold"
                    >
                        <Send className="w-4 h-4" />
                        <span>Critical Alert</span>
                    </button>
                    <button
                        onClick={handleClearAll}
                        className="flex items-center space-x-2 px-4 py-2 bg-slate-500/10 text-slate-400 border border-slate-500/20 rounded-lg text-sm hover:bg-slate-500/20 transition-all font-bold"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Clear All</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center space-x-3 text-red-400 text-sm animate-shake">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}

            {successMsg && (
                <div className="bg-dna-emerald/10 border border-dna-emerald/20 p-4 rounded-xl flex items-center justify-between text-dna-emerald text-sm animate-slide-down">
                    <div className="flex items-center space-x-3">
                        <Check className="w-5 h-5" />
                        <span>{successMsg}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => navigate('/map')}
                            className="px-3 py-1.5 bg-dna-emerald/20 border border-dna-emerald/30 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-dna-emerald/30 transition-all flex items-center space-x-2"
                        >
                            <MapPin className="w-3.5 h-3.5" />
                            <span>View on Map</span>
                        </button>
                        <button
                            onClick={() => navigate('/reports')}
                            className="px-3 py-1.5 bg-dna-cyan/20 border border-dna-cyan/30 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-dna-cyan/30 transition-all flex items-center space-x-2 text-dna-cyan"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Research Results</span>
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Zone */}
                <div className="lg:col-span-1 space-y-6">
                    <div
                        className={`glass-card p-8 border-2 border-dashed transition-all flex flex-col items-center justify-center text-center ${dragActive ? 'border-dna-emerald bg-dna-emerald/5' : 'border-white/10 hover:border-white/20'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={(e) => handleUpload(e.target.files[0])}
                        />
                        <div className="w-16 h-16 bg-dna-emerald/10 rounded-full flex items-center justify-center mb-4">
                            <Upload className="w-8 h-8 text-dna-emerald" />
                        </div>
                        <h3 className="text-lg font-bold">Upload Genomic Samples</h3>
                        <p className="text-slate-400 text-xs mt-2 mb-6">Drag and drop FASTQ, CSV or Metadata files</p>

                        {uploading ? (
                            <div className="w-full space-y-3">
                                <div className="flex justify-between text-xs mb-1">
                                    <span>{progress === 100 ? 'Analyzing Sequences...' : 'Uploading...'}</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-dna-emerald h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={onButtonClick}
                                className="btn-primary w-full"
                            >
                                Browse Files
                            </button>
                        )}
                        <p className="text-[10px] text-slate-500 mt-4 italic">Max file size: 2GB per upload</p>
                    </div>

                    <div className="glass-card p-6 space-y-6 animate-slide-right">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <h3 className="font-bold flex items-center text-sm">
                                <Filter className="w-4 h-4 mr-2 text-dna-emerald shadow-emerald-500/50" />
                                Collection Metadata
                            </h3>
                            <button
                                onClick={() => setForceMetadata(!forceMetadata)}
                                className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${forceMetadata ? 'bg-dna-emerald/20 text-dna-emerald' : 'bg-white/10 text-slate-400'}`}
                            >
                                {forceMetadata ? 'Force override ON' : 'Auto-extract OFF'}
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">DNA Source Type</label>
                                <select
                                    className="glass-input w-full text-xs py-2 h-10 transition-all focus:border-dna-emerald"
                                    value={sampleType || "Water eDNA"}
                                    onChange={(e) => setSampleType(e.target.value)}
                                >
                                    <option>Water eDNA</option>
                                    <option>Soil DNA</option>
                                    <option>Hair Analysis</option>
                                    <option>Tissue Genomic</option>
                                    <option>Faecal DNA</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Basin / Region</label>
                                <select
                                    className="glass-input w-full text-xs py-2 h-10 transition-all focus:border-dna-emerald"
                                    value={region}
                                    onChange={(e) => setRegion(e.target.value)}
                                >
                                    <option>All Regions (Auto-Detect)</option>
                                    {sampleType === 'Water eDNA' ? (
                                        <>
                                            <option>Brahmaputra Basin</option>
                                            <option>Ganga Delta</option>
                                            <option>Mekong Delta Zone</option>
                                            <option>Indian Ocean Reef</option>
                                            <option>Pacific Kelp Forest</option>
                                            <option>Atlantic Deep Sea</option>
                                            <option>Great Barrier Reef</option>
                                            <option>Red Sea Coral</option>
                                            <option>Mediterranean Sea</option>
                                        </>
                                    ) : (
                                        <>
                                            <option>Brahmaputra Basin</option>
                                            <option>Ganga Delta</option>
                                            <option>Western Ghats Reserve</option>
                                            <option>National Park System</option>
                                            <option>Mekong Delta Zone</option>
                                            <option>Amazon Basin</option>
                                            <option>Everglades Wetlands</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Extraction Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-dna-emerald/60" />
                                    <input
                                        type="date"
                                        className="glass-input w-full text-xs pl-10 py-2 h-10"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 mt-4">
                            <div className="p-3 bg-dna-emerald/5 border border-dna-emerald/10 rounded-lg">
                                <p className="text-[9px] text-dna-emerald font-bold uppercase tracking-widest mb-1">Engine Guidance</p>
                                <p className="text-[10px] text-slate-400 leading-relaxed italic">
                                    BioScope AI performs best with high-coverage FASTQ samples. Ensure environmental metadata is accurate for localized habitat analysis.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Processing Status Table */}
                <div className="lg:col-span-2 glass-card overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between">
                        <h3 className="font-bold">Recent Processing Jobs</h3>
                        <div className="flex items-center space-x-2 bg-white/5 rounded-lg px-3 py-1 border border-white/10">
                            <Search className="w-3.5 h-3.5 text-slate-400" />
                            <input type="text" placeholder="Filter..." className="bg-transparent text-xs focus:outline-none" />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white/5 text-[10px] uppercase tracking-wider text-slate-500">
                                    <th className="px-6 py-4 font-bold">Method</th>
                                    <th className="px-6 py-4 font-bold">Date</th>
                                    <th className="px-6 py-4 font-bold">Detections (Count)</th>
                                    <th className="px-6 py-4 font-bold">Status</th>
                                    <th className="px-6 py-4 font-bold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {jobs.length > 0 ? jobs.map((row) => (
                                    <tr key={row.id} className="hover:bg-white/5 transition-all group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-2 h-2 rounded-full ${row.is_active === 0 ? 'bg-slate-500' : row.status === 'Completed' ? 'bg-dna-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)]' : row.status === 'Processing' ? 'bg-dna-cyan animate-pulse' : 'bg-red-400'}`}></div>
                                                <span className={`text-sm font-medium ${row.is_active === 0 ? 'text-slate-500 line-through' : ''}`}>{row.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-slate-400">{row.date}</td>
                                        <td className="px-6 py-4 font-mono text-xs">
                                            <span className="text-dna-cyan font-bold">
                                                {row.detections?.toLocaleString() || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold ${row.is_active === 0 ? 'bg-slate-500/10 text-slate-500' : row.status === 'Completed' ? 'bg-dna-emerald/10 text-dna-emerald' :
                                                row.status === 'Processing' ? 'bg-dna-cyan/10 text-dna-cyan' :
                                                    'bg-red-400/10 text-red-400'
                                                }`}>
                                                {row.is_active === 0 ? 'Paused' : row.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleToggleActive(row.id)}
                                                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-slate-500/20 text-slate-400 rounded-lg transition-all"
                                                    title={row.is_active === 0 ? "Resume Sample Processing" : "Pause Sample Data Feed"}
                                                >
                                                    {row.is_active === 0 ? <Play className="w-4 h-4 text-dna-emerald" /> : <Pause className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(row.id)}
                                                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                                                    title="Purge Sample From Records"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-500">
                                                <FileText className="w-10 h-10 mb-4 opacity-20" />
                                                <p className="text-lg font-bold text-slate-400">Biological Records Empty</p>
                                                <p className="text-sm">Upload genomic manifests or CSV pipelines to begin monitoring.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataUpload;

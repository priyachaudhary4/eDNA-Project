import React, { useState } from 'react';
import {
    Settings,
    User,
    Lock,
    Bell,
    Database,
    Shield,
    CheckCircle2,
    Activity,
    Save,
    Globe,
    HardDrive,
    ChevronRight,
    AlertTriangle,
    Zap
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';

const SystemSettings = () => {
    const { profile, updateProfile } = useProfile();
    const [activeTab, setActiveTab] = useState('Profile');
    const [localName, setLocalName] = useState(profile.name);
    const [localDesignation, setLocalDesignation] = useState(profile.designation);
    const [localDivision, setLocalDivision] = useState(profile.division);
    const [localId, setLocalId] = useState(profile.id);
    const [localLab, setLocalLab] = useState(profile.lab || 'Global Surveillance Matrix Center (HQ)');
    const [profileImage, setProfileImage] = useState(profile.image);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    // Functional Settings State
    const [securitySettings, setSecuritySettings] = useState([
        { id: 'enc', label: 'Satellite Link Encryption', active: true, desc: 'Secure data transmission for remote field samples.' },
        { id: 'bio', label: 'Two-Factor Bio-Auth', active: false, desc: 'Require fingerprint/face scan for overrides.' },
        { id: 'ses', label: 'Automatic Session Termination', active: true, desc: 'Logout after 15 mins of inactivity.' },
    ]);

    const [notificationSettings, setNotificationSettings] = useState([
        { title: 'Invasive Species Detections', icon: AlertTriangle, color: 'text-amber-400', push: true, email: false },
        { title: 'System Engine Updates', icon: Zap, color: 'text-dna-cyan', push: true, email: true },
        { title: 'Automated Audit Complete', icon: CheckCircle2, color: 'text-dna-emerald', push: true, email: false },
        { title: 'Cloud Link Status', icon: Globe, color: 'text-purple-400', push: true, email: false },
    ]);

    const [pipelineSettings, setPipelineSettings] = useState({
        depth: 70,
        threads: '64 Parallel Threads',
        autoTrigger: true,
        cloudSync: true,
        ghostCompression: false
    });

    const [regionSettings, setRegionSettings] = useState({
        zone: 'Brahmaputra Basin (Primary)',
        lat: '88.291',
        lng: '23.992'
    });

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate secure uplink to regional server
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        updateProfile({
            name: localName,
            designation: localDesignation,
            division: localDivision,
            id: localId,
            lab: localLab,
            image: profileImage
        });

        setIsSaving(false);
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    const settingsTabs = [
        { id: 'Profile', icon: User, label: 'Researcher ID' },
        { id: 'Security', icon: Lock, label: 'Access Control' },
        { id: 'Notifications', icon: Bell, label: 'Alert Protocols' },
        { id: 'Data Pipeline', icon: Database, label: 'Bio-Engine' },
        { id: 'Region Params', icon: Globe, label: 'Spatial Hub' },
    ];

    return (
        <div className="h-full space-y-8 animate-fade-in pb-10">
            {/* HERO HEADER */}
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-white/5 p-6 md:p-8 shadow-2xl">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-dna-emerald/5 to-transparent pointer-events-none"></div>
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="text-center lg:text-left">
                        <div className="flex items-center justify-center lg:justify-start space-x-2 mb-3">
                            <Settings className="w-4 h-4 text-dna-emerald" />
                            <span className="text-[10px] font-black text-dna-emerald uppercase tracking-[0.3em]">Core Configuration</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black text-white tracking-tighter">
                            System Settings
                        </h2>
                        <p className="text-slate-400 text-sm mt-3 max-w-xl leading-relaxed mx-auto lg:mx-0">
                            Configure researcher identity, biological processing parameters, and secure transmission protocols for the BioScope engine.
                        </p>
                    </div>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`w-full lg:w-auto px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center space-x-2 ${
                            isSaved 
                            ? 'bg-dna-emerald text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                            : 'bg-dna-emerald hover:bg-emerald-400 text-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                        } active:scale-95 disabled:opacity-70`}
                    >
                        {isSaving ? (
                            <>
                                <Activity className="w-4 h-4 animate-pulse" />
                                <span>Processing...</span>
                            </>
                        ) : isSaved ? (
                            <>
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Configuration Secured</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                <span>Save Changes</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* SETTINGS NAVIGATION - Responsive Scrollable on Mobile */}
                <div className="w-full lg:w-1/4">
                    <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 gap-3 no-scrollbar">
                        {settingsTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-shrink-0 flex items-center space-x-3 px-6 py-4 rounded-2xl transition-all border border-white/5 ${
                                    activeTab === tab.id 
                                    ? 'bg-dna-emerald/20 text-dna-emerald border-dna-emerald/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
                                    : 'bg-slate-900/40 text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'animate-pulse' : ''}`} />
                                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* SETTINGS CONTENT */}
                <div className="w-full lg:w-3/4 animate-slide-right">
                    <div className="glass-card p-6 md:p-10 border border-white/10 bg-slate-900/60 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-dna-emerald/5 blur-3xl opacity-20 rounded-full pointer-events-none"></div>
                        
                        <div className="relative z-10">
                            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight mb-8 flex items-center">
                                <Shield className="w-6 h-6 mr-4 text-dna-emerald" />
                                {settingsTabs.find(t => t.id === activeTab)?.id === 'Data Pipeline' ? 'Bio-Engine' : settingsTabs.find(t => t.id === activeTab)?.label} Control Panel
                            </h3>

                            {/* PROFILE TAB */}
                            {activeTab === 'Profile' && (
                                <div className="space-y-10 animate-fade-in">
                                    <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-8 pb-10 border-b border-white/5">
                                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-dna-emerald to-dna-cyan p-1 shadow-2xl relative group">
                                            <div className="w-full h-full rounded-[1.4rem] bg-slate-900 flex items-center justify-center overflow-hidden">
                                                {profileImage ? (
                                                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-10 h-10 text-slate-700 group-hover:text-dna-emerald transition-colors" />
                                                )}
                                            </div>
                                            <div 
                                                onClick={() => document.getElementById('avatar-upload').click()}
                                                className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-[1.4rem] cursor-pointer"
                                            >
                                                <Settings className="w-6 h-6 text-white animate-spin-slow" />
                                            </div>
                                        </div>
                                        <div className="text-center sm:text-left">
                                            <h4 className="text-lg font-black text-white">{profile.name}</h4>
                                            <p className="text-xs text-slate-500 mt-1 mb-4 uppercase font-bold tracking-widest">{profile.designation}</p>
                                            <input 
                                                id="avatar-upload"
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={handleImageChange}
                                            />
                                            <button 
                                                onClick={() => document.getElementById('avatar-upload').click()}
                                                className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] uppercase font-black tracking-widest hover:bg-white/10 hover:border-dna-emerald/30 transition-all text-slate-300"
                                            >
                                                Update Avatar
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] ml-1">Full Researcher Name</label>
                                            <input 
                                                type="text" 
                                                className="glass-input w-full text-sm font-bold p-4 bg-slate-900/50 rounded-2xl border-white/5 focus:border-dna-emerald/40 ring-0 focus:ring-dna-emerald/20" 
                                                value={localName}
                                                onChange={(e) => setLocalName(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] ml-1">Primary Designation</label>
                                            <select 
                                                className="glass-input w-full text-sm font-bold p-4 bg-slate-900/50 rounded-2xl border-white/5 focus:border-dna-emerald/40 ring-0 focus:ring-dna-emerald/20" 
                                                value={localDesignation}
                                                onChange={(e) => setLocalDesignation(e.target.value)}
                                            >
                                                <option>Lead Biodiversity Researcher</option>
                                                <option>Senior Genomic Analyst</option>
                                                <option>Field Ecology Specialist</option>
                                                <option>Conservation Data Scientist</option>
                                                <option>Bio-Intelligence Director</option>
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] ml-1">Strategic Division</label>
                                            <select 
                                                className="glass-input w-full text-sm font-bold p-4 bg-slate-900/50 rounded-2xl border-white/5 focus:border-dna-emerald/40 ring-0 focus:ring-dna-emerald/20" 
                                                value={localDivision}
                                                onChange={(e) => setLocalDivision(e.target.value)}
                                            >
                                                <option>Ecological Genomic Division</option>
                                                <option>Biodiversity Monitoring Unit</option>
                                                <option>Invasive Species Task Force</option>
                                                <option>Regional Conservation Hub</option>
                                                <option>Global Matrix Intelligence</option>
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] ml-1">Authorization ID</label>
                                            <input 
                                                type="text" 
                                                className="glass-input w-full text-sm font-bold p-4 bg-slate-900/50 rounded-2xl border-white/5 focus:border-dna-emerald/40 ring-0 focus:ring-dna-emerald/20" 
                                                value={localId}
                                                onChange={(e) => setLocalId(e.target.value)}
                                            />
                                        </div>

                                        <div className="space-y-3 md:col-span-2">
                                            <label className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] ml-1">Designated Research Lab / Office</label>
                                            <select 
                                                className="glass-input w-full text-sm font-bold p-4 bg-slate-900/50 rounded-2xl border-white/5 focus:border-dna-emerald/40 ring-0 focus:ring-dna-emerald/20"
                                                value={localLab}
                                                onChange={(e) => setLocalLab(e.target.value)}
                                            >
                                                <option>Brahmaputra Basin Research Unit (Assam, IN)</option>
                                                <option>Ganga-Delta Surveillance Office (Kolkata, IN)</option>
                                                <option>Western Ghats Genomic Hub (Karnataka, IN)</option>
                                                <option>National Marine Bio-Survey (Chennai, IN)</option>
                                                <option>Global Surveillance Matrix Center (HQ)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SECURITY TAB */}
                            {activeTab === 'Security' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="p-4 md:p-6 bg-red-500/5 border border-red-500/10 rounded-3xl flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
                                        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                                            <Shield className="w-6 h-6 text-red-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-sm text-red-500 uppercase tracking-widest">Enhanced Encryption Required</h4>
                                            <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-lg">Your account is currently using standard 256-bit AES. For governmental data broadcasting, we recommend hardware token-based MFA.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {securitySettings.map((item, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => setSecuritySettings(prev => prev.map(s => s.id === item.id ? { ...s, active: !s.active } : s))}
                                                className="flex items-center justify-between p-4 md:p-5 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/10 transition-all cursor-pointer"
                                            >
                                                <div className="space-y-1 flex-1 min-w-0 pr-4">
                                                    <p className="text-xs md:text-sm font-black text-white uppercase tracking-tight truncate">{item.label}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold truncate">{item.desc}</p>
                                                </div>
                                                <div className={`w-12 h-6 rounded-full relative p-1 flex-shrink-0 transition-all ${item.active ? 'bg-dna-emerald/20 border-dna-emerald/30' : 'bg-slate-800 border-white/5'}`}>
                                                    <div className={`w-4 h-4 rounded-full transition-all ${item.active ? 'bg-dna-emerald ml-auto' : 'bg-slate-600'}`}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="text-dna-cyan hover:text-white text-[10px] font-black uppercase tracking-widest flex items-center transition-colors px-1">
                                        Access Global Audit Logs <ChevronRight className="w-4 h-4 ml-1" />
                                    </button>
                                </div>
                            )}

                            {/* NOTIFICATIONS TAB */}
                            {activeTab === 'Notifications' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {notificationSettings.map((box, i) => (
                                            <div key={i} className="flex items-center p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-all group relative">
                                                <div className={`w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center mr-4 border border-white/5 group-hover:border-white/10 transition-colors`}>
                                                    <box.icon className={`w-5 h-5 ${box.color}`} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-black text-white uppercase tracking-tight">{box.title}</p>
                                                    <div className="flex items-center mt-2 space-x-3">
                                                        <span 
                                                            onClick={() => setNotificationSettings(prev => prev.map((item, idx) => idx === i ? { ...item, push: !item.push } : item))}
                                                            className={`text-[10px] font-bold cursor-pointer transition-colors ${box.push ? 'text-dna-emerald' : 'text-slate-600'}`}
                                                        >
                                                            Push {box.push ? 'Active' : 'Off'}
                                                        </span>
                                                        <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                                        <span 
                                                            onClick={() => setNotificationSettings(prev => prev.map((item, idx) => idx === i ? { ...item, email: !item.email } : item))}
                                                            className={`text-[10px] font-bold cursor-pointer transition-colors ${box.email ? 'text-dna-emerald' : 'text-slate-600'}`}
                                                        >
                                                            Email {box.email ? 'On' : 'Off'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-6 md:p-8 rounded-3xl bg-slate-900/40 border border-white/5 text-center">
                                        <Bell className="w-8 h-8 md:w-10 md:h-10 text-slate-700 mx-auto mb-4" />
                                        <h4 className="text-[10px] md:text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Notification Routing Hub</h4>
                                        <p className="text-[10px] md:text-xs text-slate-600 max-w-md mx-auto leading-relaxed">Broadcast critical biological threats directly to your satellite terminal or verified network nodes.</p>
                                    </div>
                                </div>
                            )}

                            {/* DATA PIPELINE TAB */}
                            {activeTab === 'Data Pipeline' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="p-4 md:p-6 bg-dna-cyan/5 border border-dna-cyan/10 rounded-3xl flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                                        <div className="w-12 h-12 bg-dna-cyan/10 border border-dna-cyan/20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                                            <Database className="w-6 h-6 text-dna-cyan" />
                                        </div>
                                        <div className="text-center sm:text-left">
                                            <h4 className="font-black text-sm text-dna-cyan uppercase tracking-widest">Bio-Sequencing Engine Active</h4>
                                            <p className="text-xs text-slate-500 mt-2 leading-relaxed">Dynamic FASTQ processing is currently utilizing {profile.id === 'BS-8829-QX' ? '78%' : '62%'} of memory allocation for optimized taxonomic identification of rare species.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 mb-10">
                                        <div className="space-y-4">
                                            <label className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] ml-1">Heuristic Depth Factor: {pipelineSettings.depth}%</label>
                                            <div className="relative pt-1">
                                                <input 
                                                    type="range" 
                                                    min="0"
                                                    max="100"
                                                    value={pipelineSettings.depth}
                                                    onChange={(e) => setPipelineSettings(prev => ({ ...prev, depth: e.target.value }))}
                                                    className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-dna-cyan" 
                                                />
                                                <div className="flex justify-between text-[10px] font-bold text-slate-600 mt-3 px-1">
                                                    <span>Performance</span>
                                                    <span>Accuracy</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] ml-1">Concurrency Limit</label>
                                            <div className="relative">
                                                <select 
                                                    className="glass-input w-full text-xs font-bold p-4 bg-slate-900/50 appearance-none rounded-2xl border-white/5 focus:border-dna-cyan/40"
                                                    value={pipelineSettings.threads}
                                                    onChange={(e) => setPipelineSettings(prev => ({ ...prev, threads: e.target.value }))}
                                                >
                                                    <option>64 Parallel Threads</option>
                                                    <option>128 Ultra-Threads (Experimental)</option>
                                                    <option>Cloud-Distributed Logic</option>
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                    <ChevronRight className="w-4 h-4 rotate-90" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            { id: 'autoTrigger', label: 'Auto-Trigger Inference', desc: 'Immediately start taxonomic analysis upon metadata validation.' },
                                            { id: 'cloudSync', label: 'Global RefSeq Nightly Sync', desc: 'Synchronize local species ledger with the NCBI cloud nightly.' },
                                        ].map((item, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => setPipelineSettings(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                                className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/10 transition-all cursor-pointer"
                                            >
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black text-white uppercase tracking-tight">{item.label}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold">{item.desc}</p>
                                                </div>
                                                <div className={`w-12 h-6 rounded-full relative p-1 transition-all ${pipelineSettings[item.id] ? 'bg-dna-cyan/20 border-dna-cyan/30' : 'bg-slate-800 border-white/5'}`}>
                                                    <div className={`w-4 h-4 rounded-full transition-all ${pipelineSettings[item.id] ? 'bg-dna-cyan ml-auto shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-slate-600'}`}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* REGION PARAMS TAB */}
                            {activeTab === 'Region Params' && (
                                <div className="space-y-8 animate-fade-in">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="glass-card p-6 border border-white/5 bg-slate-900/40">
                                            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center">
                                                <Globe className="w-4 h-4 mr-3 text-purple-400" />
                                                Spatial Detection Filters
                                            </h4>
                                            <div className="space-y-6">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Active Surveillance Zone</label>
                                                    <select 
                                                        className="glass-input w-full text-xs font-bold p-3"
                                                        value={regionSettings.zone}
                                                        onChange={(e) => setRegionSettings(prev => ({ ...prev, zone: e.target.value }))}
                                                    >
                                                        <option>Brahmaputra Basin (Primary)</option>
                                                        <option>Ganga-Delta Reserve</option>
                                                        <option>Western Ghats Biodiversity Hub</option>
                                                        <option>Global Surveillance Matrix</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Coordination Offset (GPS)</label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <input 
                                                            type="text" 
                                                            className="glass-input text-xs font-bold p-3" 
                                                            value={regionSettings.lat} 
                                                            onChange={(e) => setRegionSettings(prev => ({ ...prev, lat: e.target.value }))}
                                                        />
                                                        <input 
                                                            type="text" 
                                                            className="glass-input text-xs font-bold p-3" 
                                                            value={regionSettings.lng} 
                                                            onChange={(e) => setRegionSettings(prev => ({ ...prev, lng: e.target.value }))}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="glass-card p-6 border border-white/5 bg-slate-900/40">
                                            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center">
                                                <Database className="w-4 h-4 mr-3 text-dna-cyan" />
                                                Protected Area Database
                                            </h4>
                                            <div className="space-y-4">
                                                {['IUCN Red List Core', 'National Park Registry', 'Reserve Forest Map', 'Marine Protected Zones'].map((db, i) => (
                                                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                                        <span className="text-[10px] font-bold text-slate-300">{db}</span>
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-dna-emerald animate-pulse"></div>
                                                            <span className="text-[8px] font-black text-dna-emerald uppercase tracking-tighter">Syncing</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 md:p-6 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
                                        <p className="text-[9px] md:text-[10px] text-slate-500 leading-relaxed italic text-center">
                                            "Geospatial parameters directly influence the Heatmap intensity and Alert prioritization logic 
                                            integrated within the GIS Surveillance module."
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemSettings;

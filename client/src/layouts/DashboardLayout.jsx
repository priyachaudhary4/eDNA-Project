import React, { useState } from 'react';
import {
    Home,
    Database,
    Dna,
    Search,
    Bell,
    Map as MapIcon,
    AlertTriangle,
    Settings,
    LogOut,
    User,
    FileText,
    Menu,
    X,
    ShieldAlert,
    CheckCircle2,
    Clock,
    Eye,
    ChevronRight,
    Loader2,
    Fingerprint
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useProfile } from '../context/ProfileContext';
import API_BASE_URL from '../config/api';

const navItems = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Database, label: 'Data Upload', path: '/upload' },
    { icon: Dna, label: 'Genomic Engine', path: '/genomic' },
    { icon: Search, label: 'Species Inquiry', path: '/species' },
    { icon: AlertTriangle, label: 'Alert Center', path: '/alerts' },
    { icon: MapIcon, label: 'GIS Mapping', path: '/map' },
    { icon: FileText, label: 'Research Results', path: '/reports' },
    { icon: Fingerprint, label: 'Biological Profiling', path: '/profiling' },
    { icon: Settings, label: 'System Settings', path: '/settings' },
];

const Layout = ({ children }) => {
    const { profile } = useProfile();
    const location = useLocation();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifs, setLoadingNotifs] = useState(false);
    const [lastOpened, setLastOpened] = useState(localStorage.getItem('notif_last_opened') || 0);

    const newCount = notifications.filter(n => new Date(n.timestamp).getTime() > lastOpened).length;

    const fetchNotifications = async () => {
        try {
            setLoadingNotifs(true);
            const response = await axios.get(`${API_BASE_URL}/api/alerts`);
            setNotifications(response.data.slice(0, 10)); // Show latest 10
            setLoadingNotifs(false);
        } catch (err) {
            console.warn("Notifications sync deferred:", err.message);
            setLoadingNotifs(false);
        }
    };

    React.useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Polling for live alerts
        return () => clearInterval(interval);
    }, []);

    const handleDeleteNotification = async (e, id) => {
        e.stopPropagation();
        try {
            await axios.delete(`${API_BASE_URL}/api/alerts/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error("Failed to delete notification", err);
        }
    };

    const handleToggleNotif = () => {
        if (!isNotifOpen) {
            const now = Date.now();
            setLastOpened(now);
            localStorage.setItem('notif_last_opened', now);
        }
        setIsNotifOpen(!isNotifOpen);
    };

    const handleClearAll = async () => {
        if (window.confirm("Clear all notifications? This will not affect your uploaded data.")) {
            try {
                await axios.delete(`${API_BASE_URL}/api/alerts`);
                setNotifications([]);
                setIsNotifOpen(false);
            } catch (err) {
                console.error("Failed to clear notifications", err);
            }
        }
    };

    const isCritical = (type) => {
        const t = type?.toLowerCase() || '';
        return t.includes('critical') || t.includes('invasive') || t.includes('endangered') || t.includes('warning') || t.includes('priority') || t.includes('security');
    };

    const getIcon = (type) => {
        const t = type?.toLowerCase() || '';
        if (t.includes('critical') || t.includes('invasive')) return <ShieldAlert className="w-4 h-4 text-red-500" />;
        if (t.includes('endangered') || t.includes('warning') || t.includes('priority')) return <AlertTriangle className="w-4 h-4 text-amber-500" />;
        if (t.includes('discovery') || t.includes('rare')) return <CheckCircle2 className="w-4 h-4 text-dna-emerald" />;
        return <Bell className="w-4 h-4 text-dna-cyan" />;
    };

    return (
        <div className="flex h-screen bg-dna-deep text-white overflow-hidden relative">
            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-white/5 flex flex-col z-40
                transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-dna-emerald rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                            <Dna className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">Bio<span className="text-dna-cyan underline decoration-dna-emerald decoration-2 underline-offset-4">Scope</span></span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-slate-500 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="text-sm font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <Link to="/" className="nav-item">
                        <LogOut className="w-5 h-5" />
                        <span className="text-sm font-medium">Logout</span>
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative w-full">
                {/* Top Header */}
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 lg:px-8 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="p-2 -ml-2 text-slate-400 hover:text-white lg:hidden"
                        >
                            <Menu size={24} />
                        </button>

                        <div className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-1.5 w-64 lg:w-96">
                            <Search className="w-4 h-4 text-slate-400 mr-2" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="bg-transparent text-sm focus:outline-none w-full text-slate-200"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 lg:space-x-6">
                        <div className="relative">
                            <button 
                                onClick={handleToggleNotif}
                                className={`relative text-slate-400 hover:text-white transition-all p-2 rounded-full hover:bg-white/5 ${isNotifOpen ? 'text-white bg-white/10' : ''}`}
                            >
                                <Bell className="w-5 h-5" />
                                {newCount > 0 && (
                                    <span className="absolute top-2 right-2 px-1 min-w-[12px] h-3 bg-red-500 text-[8px] font-black text-white rounded-full flex items-center justify-center animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                                        {newCount}
                                    </span>
                                )}
                            </button>

                            {/* Notifications Dropdown */}
                            {isNotifOpen && (
                                <>
                                    <div className="fixed inset-0 z-20" onClick={() => setIsNotifOpen(false)}></div>
                                    <div className="absolute right-0 mt-4 w-[320px] sm:w-[380px] bg-slate-950/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-30 animate-in fade-in slide-in-from-top-2 rounded-2xl overflow-hidden">
                                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                            <h3 className="text-xs font-black uppercase tracking-[0.1em] text-white">Neural Notifications</h3>
                                            <button 
                                                onClick={handleClearAll}
                                                className="text-[8px] text-red-500 hover:text-red-400 font-black uppercase tracking-widest border border-red-500/20 px-2 py-1 rounded-md hover:bg-red-500/5 transition-all"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                        <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                                            {loadingNotifs && notifications.length === 0 ? (
                                                <div className="p-12 flex flex-col items-center justify-center space-y-3">
                                                    <Loader2 className="w-6 h-6 text-dna-cyan animate-spin opacity-40" />
                                                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Syncing Feed...</p>
                                                </div>
                                            ) : notifications.length > 0 ? (
                                                <div className="divide-y divide-white/5">
                                                    {/* Critical Section */}
                                                    {notifications.some(n => isCritical(n.type)) && (
                                                        <div className="bg-red-500/5 px-4 py-2 border-b border-white/5">
                                                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center">
                                                                <ShieldAlert className="w-3 h-3 mr-2" />
                                                                Priority Detections
                                                            </p>
                                                        </div>
                                                    )}
                                                    {notifications.filter(n => isCritical(n.type)).map((notif) => (
                                                        <div 
                                                            key={notif.id}
                                                            onClick={() => {
                                                                navigate('/alerts');
                                                                setIsNotifOpen(false);
                                                            }}
                                                            className="p-4 hover:bg-white/[0.07] transition-colors cursor-pointer group relative"
                                                        >
                                                            <div className="flex items-start space-x-3">
                                                                <div className="mt-1">{getIcon(notif.type)}</div>
                                                                <div className="space-y-1 flex-1 min-w-0">
                                                                    <p className="text-[10px] font-black text-white group-hover:text-dna-cyan transition-colors truncate uppercase tracking-tight pr-6">
                                                                        {notif.species_involved || 'System Alert'}
                                                                    </p>
                                                                    <p className="text-xs text-slate-400 line-clamp-2 leading-snug font-medium">
                                                                        {notif.message}
                                                                    </p>
                                                                    <div className="flex items-center text-[8px] text-slate-500 font-bold uppercase pt-1">
                                                                        <Clock className="w-2.5 h-2.5 mr-1 opacity-50" />
                                                                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        <span className="mx-2 opacity-20">|</span>
                                                                        <span className="text-dna-cyan opacity-80">{notif.location}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-center justify-between h-full space-y-2">
                                                                    <button 
                                                                        onClick={(e) => handleDeleteNotification(e, notif.id)}
                                                                        className="p-1.5 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                                                        title="Dismiss Alert"
                                                                    >
                                                                        <X className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-white transition-all group-hover:translate-x-1" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* General Section */}
                                                    {notifications.some(n => !isCritical(n.type)) && (
                                                        <div className="bg-white/5 px-4 py-2 border-b border-white/5">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                                                <Bell className="w-3 h-3 mr-2 text-dna-cyan" />
                                                                General Intelligence
                                                            </p>
                                                        </div>
                                                    )}
                                                    {notifications.filter(n => !isCritical(n.type)).map((notif) => (
                                                        <div 
                                                            key={notif.id}
                                                            onClick={() => {
                                                                navigate('/alerts');
                                                                setIsNotifOpen(false);
                                                            }}
                                                            className="p-4 hover:bg-white/[0.07] transition-colors cursor-pointer group relative"
                                                        >
                                                            <div className="flex items-start space-x-3">
                                                                <div className="mt-1">{getIcon(notif.type)}</div>
                                                                <div className="space-y-1 flex-1 min-w-0">
                                                                    <p className="text-[10px] font-black text-white group-hover:text-dna-cyan transition-colors truncate uppercase tracking-tight pr-6">
                                                                        {notif.species_involved || 'System Alert'}
                                                                    </p>
                                                                    <p className="text-xs text-slate-400 line-clamp-2 leading-snug font-medium">
                                                                        {notif.message}
                                                                    </p>
                                                                    <div className="flex items-center text-[8px] text-slate-500 font-bold uppercase pt-1">
                                                                        <Clock className="w-2.5 h-2.5 mr-1 opacity-50" />
                                                                        {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        <span className="mx-2 opacity-20">|</span>
                                                                        <span className="text-dna-cyan opacity-80">{notif.location}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col items-center justify-between h-full space-y-2">
                                                                    <button 
                                                                        onClick={(e) => handleDeleteNotification(e, notif.id)}
                                                                        className="p-1.5 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                                                        title="Dismiss Alert"
                                                                    >
                                                                        <X className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-white transition-all group-hover:translate-x-1" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-12 text-center">
                                                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">No Active Threat Signals</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="border-t border-white/5 bg-white/[0.02] flex flex-col">
                                            <Link 
                                                to="/alerts" 
                                                onClick={() => setIsNotifOpen(false)}
                                                className="p-3 text-center hover:bg-white/[0.05] transition-all"
                                            >
                                                <span className="text-[10px] font-black text-dna-cyan uppercase tracking-[0.2em] flex items-center justify-center">
                                                    Go to Alert Center <ChevronRight className="w-3 h-3 ml-2" />
                                                </span>
                                            </Link>
                                            <div className="pb-3 px-4 text-center">
                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                                                    {notifications.length} {notifications.length === 1 ? 'Total Notification' : 'Total Notifications'} Signal Detected
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex items-center space-x-2 lg:space-x-3 lg:pl-6 lg:border-l lg:border-white/10">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold">{profile.name}</p>
                                <p className="text-[10px] text-dna-cyan uppercase tracking-wider">{profile.designation}</p>
                            </div>
                            <div className="w-9 h-9 lg:w-10 lg:h-10 bg-gradient-to-br from-dna-emerald to-dna-cyan rounded-full border-2 border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {profile.image ? (
                                    <img src={profile.image} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import axios from 'axios';
import { Map as MapIcon, Filter, Layers, Download, Search, Loader2, RefreshCw, X, Menu, FileText, Activity } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Fix for default marker icon in Leaflet + React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const ChangeView = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
};

// =========================================================
// UNIVERSAL SPATIAL RESOLVER ENGINE
// =========================================================
const PROTECTED_AREAS_DB = {
    "Yellowstone National Park": [44.4280, -110.5885],
    "Everglades Wetlands": [25.2866, -80.8987],
    "Yosemite Valley": [37.7459, -119.5932],
    "Brahmaputra Basin": [26.1158, 91.7086],
    "Ganga Delta": [22.15, 88.65],
    "Western Ghats Reserve": [11.13, 76.43],
    "Kaziranga Wetlands": [26.58, 93.17],
    "Ranthambore Reserve": [26.01, 76.50],
    "Mekong Delta": [10.03, 105.78],
    "Ha Long Bay": [20.91, 107.18],
    "Amazon Basin": [-3.46, -62.21],
    "Great Barrier Reef": [-18.28, 147.69],
    "Galapagos Islands": [-0.82, -90.98],
    "Indian Ocean Reef": [-10.0, 70.0],
    "Pacific Kelp Forest": [36.6, -122.0],
    "Atlantic Deep Sea": [35.0, -45.0],
    "Red Sea Coral": [22.0, 38.0],
    "Mediterranean Sea": [34.0, 18.0]
};

const ADMINISTRATIVE_CENTROIDS = {
    "India": [20.5937, 78.9629],
    "USA": [37.0902, -95.7129],
    "Brazil": [-14.2350, -51.9253],
    "Australia": [-25.2744, 133.7751],
    "Vietnam": [14.0583, 108.2772],
    "Ecuador": [-1.8312, -78.1834],
    "Assam": [26.2006, 92.9376],
    "California": [36.7783, -119.4179],
    "Florida": [27.9944, -81.7603],
    "Wyoming": [43.0759, -107.2903]
};

const getHabitatStyle = (habitatName) => {
    if (!habitatName) return { color: "#ffffff", opacity: 0.1, radius: 15000 };
    const name = habitatName.toLowerCase();

    // Dynamic schema mapping: Map dataset values to visualization standards
    if (name.includes('forest') || name.includes('woodland') || name.includes('rainforest')) {
        return { color: "#064e3b", opacity: 0.3, radius: 30000 }; // Dark Green
    }
    if (name.includes('grassland') || name.includes('savanna') || name.includes('prairie')) {
        return { color: "#4ade80", opacity: 0.3, radius: 25000 }; // Light Green 
    }
    if (name.includes('wetland') || name.includes('marsh') || name.includes('river') || name.includes('marine') || name.includes('reef') || name.includes('delta')) {
        return { color: "#3b82f6", opacity: 0.3, radius: 25000 }; // Blue
    }
    if (name.includes('mountain') || name.includes('alpine') || name.includes('karst')) {
        return { color: "#78350f", opacity: 0.3, radius: 25000 }; // Brown
    }
    if (name.includes('desert') || name.includes('arid') || name.includes('sand')) {
        return { color: "#eab308", opacity: 0.3, radius: 25000 }; // Yellow
    }

    // Default fallback map to arbitrary style if completely heterogeneous
    return { color: "#ffffff", opacity: 0.1, radius: 15000 };
};

const resolveSpatialSchema = (sample) => {
    let resolvedCoords = null;
    let resolutionMethod = "Fallback";

    // 1. Precise Coordinate Match
    if (sample.latitude && sample.longitude) {
        resolvedCoords = [sample.latitude, sample.longitude];
        resolutionMethod = "Coordinates";
    }
    // 2. Protected Area / Park Name Match
    else if (sample.region && PROTECTED_AREAS_DB[sample.region]) {
        resolvedCoords = PROTECTED_AREAS_DB[sample.region];
        resolutionMethod = "Protected Area DB";
    }
    // 4. Partial / Fuzzy Match for Region or Country
    else if (sample.region || sample.country) {
        const searchText = (sample.region || sample.country).toLowerCase();
        
        // Try to find a match in the DBs
        const matchKey = Object.keys(ADMINISTRATIVE_CENTROIDS).find(k => 
            searchText.includes(k.toLowerCase()) || k.toLowerCase().includes(searchText)
        ) || Object.keys(PROTECTED_AREAS_DB).find(k => 
            searchText.includes(k.toLowerCase()) || k.toLowerCase().includes(searchText)
        );

        if (matchKey) {
            resolvedCoords = ADMINISTRATIVE_CENTROIDS[matchKey] || PROTECTED_AREAS_DB[matchKey];
            resolutionMethod = "Inferred Centroid";
        } else {
            // No fallback coordinate - strictly data driven
            resolvedCoords = null;
            resolutionMethod = "Unresolvable";
        }
    }
    else {
        resolvedCoords = null;
        resolutionMethod = "No Spatial Data";
    }

    // Convert to GeoJSON Feature
    const geoJsonFeature = {
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [resolvedCoords[1], resolvedCoords[0]] // GeoJSON uses [lng, lat]
        },
        properties: {
            ...sample,
            resolvedLatitude: resolvedCoords[0],
            resolvedLongitude: resolvedCoords[1],
            resolutionMethod: resolutionMethod,
            habitatInfluenceRadius: getHabitatStyle(sample.habitat_type).radius
        }
    };

    return { resolvedCoords, geoJsonFeature, resolutionMethod };
};
// =========================================================

const GISMap = () => {
    const [locations, setLocations] = useState([]);
    const [geoJsonFeatures, setGeoJsonFeatures] = useState({ type: "FeatureCollection", features: [] });
    const [filteredLocations, setFilteredLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mapCenter, setMapCenter] = useState([26.1158, 91.7086]);
    const [zoom, setZoom] = useState(5);
    const [mapMode, setMapMode] = useState('map'); // 'map', 'heatmap', 'satellite'
    const [selectedSpecies, setSelectedSpecies] = useState(['All Species', 'Native', 'Endangered', 'Rare', 'Concern', 'Invasive']);
    const [confidenceThreshold, setConfidenceThreshold] = useState(85);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCountry, setSelectedCountry] = useState('All Countries');
    const [selectedRegion, setSelectedRegion] = useState('All Regions');
    const [selectedHabitat, setSelectedHabitat] = useState('All Habitats');
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const fetchLocations = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:8000/api/samples');
            const data = response.data.filter(sample => sample.is_active === 1);
            setLocations(data);

            // Initial view: Center on latest sample or global average
            if (data.length > 0) {
                // Focus on the LATEST sample (data[0] since backend is desc)
                const latest = data[0];
                const { resolvedCoords } = resolveSpatialSchema(latest);
                setMapCenter(resolvedCoords);
                setZoom(6); // Slightly tighter zoom for better site investigation
            }
            setLastUpdated(new Date());
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch map data", err);
            setLoading(false);
        }
    };

    // Dynamically poll for new samples to simulate realtime pipeline update
    useEffect(() => {
        fetchLocations();
        const intervalId = setInterval(fetchLocations, 15000); // 15-second update loop
        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        applyFilters();
        
        // Auto-Zoom to selected region if set
        if (selectedRegion !== 'All Regions') {
            const centroid = ADMINISTRATIVE_CENTROIDS[selectedRegion] || PROTECTED_AREAS_DB[selectedRegion];
            if (centroid) {
                setMapCenter(centroid);
                setZoom(7);
            } else {
                // If not in DB, try to find a sample that matches and zoom to it
                const firstMatch = locations.find(l => (l.region || "").toLowerCase().includes(selectedRegion.toLowerCase()));
                if (firstMatch) {
                    const { resolvedCoords } = resolveSpatialSchema(firstMatch);
                    if (resolvedCoords) {
                        setMapCenter(resolvedCoords);
                        setZoom(7);
                    }
                }
            }
        }
    }, [locations, selectedSpecies, confidenceThreshold, searchQuery, selectedCountry, selectedRegion, selectedHabitat]);

    const countries = ['All Countries', ...new Set(locations.map(l => l.country).filter(Boolean))];
    
    // Expand regions to include data, protected areas, and administrative centroids
    const dynamicRegions = locations
        .filter(l => selectedCountry === 'All Countries' || l.country === selectedCountry)
        .map(l => l.region)
        .filter(Boolean);
    const dbRegions = [...Object.keys(PROTECTED_AREAS_DB), ...Object.keys(ADMINISTRATIVE_CENTROIDS)];
    const regions = ['All Regions', ...new Set([...dynamicRegions, ...dbRegions])].sort();

    const habitats = ['All Habitats', ...new Set(locations
        .filter(l => (selectedCountry === 'All Countries' || l.country === selectedCountry) &&
            (selectedRegion === 'All Regions' || l.region === selectedRegion))
        .map(l => l.habitat_type)
        .filter(Boolean))];

    const applyFilters = () => {
        let filtered = [...locations];

        // Search Filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(loc =>
                (loc.region || "").toLowerCase().includes(query) ||
                (loc.filename || "").toLowerCase().includes(query) ||
                (loc.country || "").toLowerCase().includes(query) ||
                (loc.habitat_type || "").toLowerCase().includes(query) ||
                (loc.sample_type || "").toLowerCase().includes(query) ||
                (loc.results || []).some(r => 
                    (r.species_name || "").toLowerCase().includes(query) ||
                    (r.common_name || "").toLowerCase().includes(query)
                )
            );
        }

        // Region, Country & Habitat Filters
        // Region, Country & Habitat Filters - Using fuzzy logic to match data to dropdown selection
        if (selectedCountry !== 'All Countries') filtered = filtered.filter(loc => loc.country === selectedCountry);
        if (selectedRegion !== 'All Regions') {
            filtered = filtered.filter(loc => {
                const target = selectedRegion.toLowerCase();
                const region = (loc.region || "").toLowerCase();
                const country = (loc.country || "").toLowerCase();
                return region === target || region.includes(target) || target.includes(region) || country === target;
            });
        }
        if (selectedHabitat !== 'All Habitats') filtered = filtered.filter(loc => loc.habitat_type === selectedHabitat);

        // Species Status Filter
        if (!selectedSpecies.includes('All Species')) {
            filtered = filtered.filter(sample =>
                sample.results?.some(r => selectedSpecies.includes(r.status))
            );
        }

        // Confidence Filter - Only apply if results exist
        filtered = filtered.filter(loc => {
            if (!loc.results || loc.results.length === 0) return true; // Show empty samples too
            return loc.results.some(r => (r.confidence * 100) >= confidenceThreshold);
        });

        // Map to internal UI structures and GeoJSON Feature Collection
        const enrichedFeatures = [];
        const geoFeatures = [];

        filtered.forEach(loc => {
            const { resolvedCoords, geoJsonFeature, resolutionMethod } = resolveSpatialSchema(loc);
            if (resolvedCoords) { // Only add to map if coordinates were successfully resolved
                enrichedFeatures.push({
                    ...loc,
                    resolvedCoords,
                    resolutionMethod
                });
                geoFeatures.push(geoJsonFeature);
            }
        });

        setFilteredLocations(enrichedFeatures);
        setGeoJsonFeatures({
            type: "FeatureCollection",
            features: geoFeatures
        });
    };

    const toggleSpeciesFilter = (cat) => {
        setSelectedSpecies(prev => {
            if (cat === 'All Species') return prev.includes('All Species') ? [] : ['All Species', 'Native', 'Endangered', 'Rare', 'Concern', 'Invasive'];
            const next = prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat];
            const categories = ['Native', 'Endangered', 'Rare', 'Concern', 'Invasive'];
            const allSelected = categories.every(c => next.includes(c));
            if (allSelected && !next.includes('All Species')) return ['All Species', ...next];
            if (!allSelected && next.includes('All Species')) return next.filter(c => c !== 'All Species');
            return next;
        });
    };

    const handleExportPDF = () => {
        if (!filteredLocations || filteredLocations.length === 0) return;

        const doc = new jsPDF();
        const now = new Date();
        const timestamp = now.toLocaleString();

        // Header Section
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, 210, 45, 'F');
        
        doc.setFontSize(22);
        doc.setTextColor(56, 189, 248); // dna-cyan
        doc.setFont("helvetica", "bold");
        doc.text("GIS SPATIAL INTELLIGENCE REPORT", 105, 20, { align: "center" });
        
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.setFont("helvetica", "normal");
        doc.text(`Biodiversity Surveillance Map Intelligence | Generated: ${timestamp}`, 105, 30, { align: "center" });
        doc.text(`Engine Ver: BioScope v2.0 GeoJSON | Protocol: SPATIAL-ALPHA`, 105, 36, { align: "center" });

        // Section 1: Summary Cabinet
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("SURVEILLANCE SUMMARY", 20, 60);

        autoTable(doc, {
            startY: 65,
            head: [['PARAMETER', 'DATA VALUE']],
            body: [
                ['Active Hotspots Detected', filteredLocations.length],
                ['Total Species Profiles Identified', filteredLocations.reduce((acc, loc) => acc + (loc.results?.length || 0), 0)],
                ['Global Basin Sector', selectedRegion],
                ['Confidence Threshold', `${confidenceThreshold}%`],
                ['Surveillance Mode', mapMode.toUpperCase()]
            ],
            theme: 'striped',
            headStyles: { fillColor: [56, 189, 248], textColor: [255, 255, 255] },
            columnStyles: { 0: { fontStyle: 'bold', width: 60 } }
        });

        // Section 2: Detailed Hotspot Registry
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("SPATIAL HOTSPOT REGISTRY", 20, doc.lastAutoTable.finalY + 15);

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 20,
            head: [['LOCATION/REGION', 'COORDINATES', 'HABITAT TYPE', 'PRIMARY HITS']],
            body: filteredLocations.map(loc => [
                loc.region || loc.filename,
                `${loc.resolvedCoords[0].toFixed(3)}, ${loc.resolvedCoords[1].toFixed(3)}`,
                loc.habitat_type || 'Unknown',
                loc.results?.length || 0
            ]),
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
            columnStyles: { 3: { halign: 'center' } }
        });

        // Analytical Glossary Section
        doc.addPage();
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("BIOSPHERE INTELLIGENCE GLOSSARY", 20, 20);

        autoTable(doc, {
            startY: 25,
            head: [['TERM', 'PLAIN LANGUAGE EXPLANATION']],
            body: [
                ['Invasive Species', 'Non-native animals or plants that spread quickly and can harm the local environment.'],
                ['Endangered Species', 'High-priority species that are at risk of disappearing from the wild without protection.'],
                ['Rare Discoveries', 'Species that are seldom seen, often indicating new sightings or important habitat areas.'],
                ['Spatial Resolution', 'The technology used to calculate exactly where on the map a DNA sample was found.'],
                ['Confidence Threshold', 'The level of certainty (match percentage) required to confirm a species identity.'],
                ['Active Hotspot', 'A specific location on the map where high-priority DNA markers have been verified.'],
                ['Biodiversity Index', 'A scientific score that measures how healthy and varied the ecosystem is in a specific sector.']
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
            doc.text("BIO-SURVEILLANCE CONFIDENTIAL - SPATIAL INTELLIGENCE CORE OUTPUT", 105, 285, { align: "center" });
            doc.text(`Page ${i} of ${pageCount}`, 200, 285, { align: "right" });
        }

        doc.save(`BioScope_Spatial_Intelligence_${now.toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center justify-between w-full sm:w-auto">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">BioScope GIS Intelligence</h2>
                        <p className="text-slate-400 text-[10px] sm:text-xs mt-1 flex items-center flex-wrap gap-2">
                            Universal spatial resolution engine <span className="text-dna-cyan text-[10px] font-bold bg-dna-cyan/10 px-2 py-0.5 rounded border border-dna-cyan/20">v2.0 GeoJSON</span>
                        </p>
                    </div>
                    <button 
                        onClick={() => setIsFilterOpen(true)}
                        className="lg:hidden p-2 bg-white/5 border border-white/10 rounded-xl text-dna-cyan hover:bg-white/10"
                    >
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                        onClick={fetchLocations}
                        className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-3 py-2 bg-slate-800 text-slate-300 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-700 transition-all active:scale-95"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-dna-emerald' : ''}`} />
                        <span>Sync</span>
                    </button>
                    <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
                        {['map', 'heatmap', 'satellite'].map((m) => (
                            <button
                                key={m}
                                onClick={() => setMapMode(m)}
                                className={`px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all capitalize ${mapMode === m ? 'bg-dna-emerald text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                            >
                                {m === 'map' ? 'Def' : m}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleExportPDF}
                        className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2 bg-dna-cyan/10 text-dna-cyan border border-dna-cyan/30 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-dna-cyan/20 transition-all active:scale-95"
                    >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Export PDF</span>
                        <span className="sm:hidden text-[10px]">PDF</span>
                    </button>
                </div>
            </div>

            <div className="relative flex-1 rounded-3xl overflow-hidden border border-white/10 shadow-2xl min-h-[500px] lg:h-[calc(100vh-220px)] bg-slate-950">
                {/* Floating Controls Sidebar - Desktop & Drawer Mobile */}
                <div className={`
                    absolute top-0 right-0 h-full w-full max-w-[320px] z-[1001] transition-transform duration-500 lg:duration-300
                    lg:right-auto lg:left-6 lg:max-h-[calc(100%-40px)] lg:top-6 lg:translate-x-0
                    ${isFilterOpen ? 'translate-x-0 px-4 py-6' : 'translate-x-full lg:translate-x-0 hidden lg:block lg:p-0'}
                `}>
                    <div className="lg:hidden absolute inset-0 bg-dna-deep/80 backdrop-blur-md -z-10" onClick={() => setIsFilterOpen(false)}></div>
                    <div className="glass-card h-full lg:h-auto p-4 lg:p-5 space-y-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/20 backdrop-blur-2xl relative overflow-y-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-2 lg:hidden">
                            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-white">Spatial Intelligence</h3>
                            <button onClick={() => setIsFilterOpen(false)} className="p-2 text-slate-500 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <h3 className="hidden lg:flex font-black text-[10px] uppercase tracking-[0.2em] items-center text-white/50">
                                <Search className="w-3.5 h-3.5 mr-2 text-dna-cyan" />
                                Spatial Intelligence
                            </h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Search sector or species..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="glass-input w-full text-[11px] pl-9 h-9 border border-white/10 bg-slate-900/60 focus:border-dna-cyan"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 pt-3 border-t border-white/10">
                            <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Global Basin Filter</label>
                                    <select
                                        value={selectedRegion}
                                        onChange={(e) => {
                                            setSelectedRegion(e.target.value);
                                            if (window.innerWidth < 1024) setIsFilterOpen(false);
                                        }}
                                        className="glass-input w-full text-[11px] h-9 bg-slate-900/60 border-white/10 transition-colors focus:border-dna-cyan"
                                    >
                                        {regions.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-3 border-t border-white/10">
                            <label className="text-[9px] text-slate-500 uppercase font-black tracking-widest">Surveillance Priority</label>
                            <div className="grid grid-cols-3 gap-1.5">
                                {['All Species', 'Endangered', 'Invasive', 'Rare', 'Concern', 'Native'].map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => toggleSpeciesFilter(cat)}
                                        className={`px-2 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all border flex flex-col items-center justify-center gap-1 text-center ${
                                            selectedSpecies.includes(cat) 
                                            ? cat === 'All Species' ? 'bg-dna-emerald/20 border-dna-emerald text-dna-emerald shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 
                                              cat === 'Endangered' ? 'bg-red-500/20 border-red-500 text-red-100' :
                                              cat === 'Invasive' ? 'bg-purple-500/20 border-purple-500 text-purple-100' :
                                              cat === 'Rare' ? 'bg-dna-cyan/20 border-dna-cyan text-dna-cyan' :
                                              'bg-dna-cyan/20 border-dna-cyan text-white' 
                                            : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'
                                        }`}
                                    >
                                        <div className={`w-1 h-1 rounded-full ${
                                            cat === 'Endangered' ? 'bg-red-500' :
                                            cat === 'Invasive' ? 'bg-purple-500' :
                                            cat === 'Rare' ? 'bg-dna-cyan' :
                                            cat === 'Concern' ? 'bg-amber-500' :
                                            'bg-dna-emerald'
                                        }`} />
                                        <span className="truncate w-full">{cat}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2">
                            <div className="p-3 bg-indigo-900/40 rounded-xl border border-dna-cyan/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                                <h4 className="text-[9px] text-dna-cyan font-black uppercase tracking-[0.2em] mb-2 flex items-center">
                                    <Activity className="w-3 h-3 mr-1.5" />
                                    Diagnostics
                                </h4>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center text-[9px]">
                                        <span className="text-slate-400 font-bold">Active Hotspots</span>
                                        <span className="text-white font-black">{filteredLocations.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px]">
                                        <span className="text-slate-400 font-bold">System Sync</span>
                                        <div className="flex items-center">
                                            <div className="w-1 h-1 rounded-full bg-dna-emerald animate-pulse mr-1.5"></div>
                                            <span className="text-dna-emerald font-black uppercase tracking-tighter">Secure Link</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsFilterOpen(false)}
                                className="lg:hidden w-full mt-6 py-4 bg-dna-cyan text-slate-900 font-black uppercase tracking-widest text-[11px] rounded-xl active:scale-95 transition-all shadow-lg"
                            >
                                Apply Parameters
                            </button>
                        </div>
                    </div>
                </div>

                <MapContainer center={mapCenter} zoom={zoom} zoomControl={false} className="w-full h-full z-0">
                    <ChangeView center={mapCenter} zoom={zoom} />
                    {mapMode === 'map' && <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />}
                    {mapMode === 'satellite' && <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='&copy; ESRI' />}
                    {mapMode === 'heatmap' && <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />}

                    {filteredLocations.map((loc) => {
                        const coords = loc.resolvedCoords;
                        const habitatStyle = getHabitatStyle(loc.habitat_type);
                        const relevantStatuses = loc.results?.map(r => r.status) || [];
                        const filteredStatuses = selectedSpecies.includes('All Species') ? relevantStatuses : relevantStatuses.filter(s => selectedSpecies.includes(s));
                        
                        const getStatusColor = (statuses) => {
                            if (selectedSpecies.includes('All Species')) return '#10B981'; // Unified emerald signature for total genomic surveillance
                            if (statuses.includes('Invasive')) return '#a855f7';
                            if (statuses.includes('Endangered')) return '#ef4444';
                            if (statuses.includes('Rare')) return '#3b82f6';
                            return '#10B981';
                        };

                        const markerColor = getStatusColor(filteredStatuses);
                        const hasAlert = filteredStatuses.includes('Invasive') || filteredStatuses.includes('Endangered');
                        const pulseClass = hasAlert ? 'animate-pulse' : '';

                        const iconHtml = `
                            <div style="position: relative; width: 44px; height: 44px;">
                                <div style="background-color: ${markerColor}; position: absolute; left: 0; top: 0; width: 44px; height: 44px; border-radius: 50%; opacity: 0.15; transform: scale(2.5); filter: blur(10px);"></div>
                                <div style="background-color: ${markerColor}; position: absolute; left: 6px; top: 6px; width: 32px; height: 32px; border-radius: 50%; opacity: 0.3; transform: scale(1.3); filter: blur(5px);"></div>
                                <div style="background-color: #0f172a; position: absolute; left: 10px; top: 10px; width: 24px; height: 24px; border-radius: 50%; border: 2.5px solid ${markerColor}; box-shadow: 0 0 18px ${markerColor}, inset 0 0 6px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;">
                                    <span style="color: ${markerColor}; font-size: 7px; font-weight: 900; font-family: monospace; user-select: none;">${loc.results?.length > 999 ? '99+' : (loc.results?.length || 0)}</span>
                                </div>
                            </div>
                        `;

                        const universalIcon = L.divIcon({ className: 'universal-marker', html: iconHtml, iconSize: [44, 44], iconAnchor: [22, 22] });

                        return (
                            <React.Fragment key={loc.id}>
                                <Circle
                                    center={coords}
                                    radius={habitatStyle.radius}
                                    pathOptions={{
                                        fillColor: mapMode === 'heatmap' ? markerColor : habitatStyle.color,
                                        fillOpacity: mapMode === 'heatmap' ? 0.35 : habitatStyle.opacity,
                                        color: mapMode === 'heatmap' ? 'transparent' : habitatStyle.color,
                                        weight: 1,
                                        dashArray: '3, 6'
                                    }}
                                />
                                <Marker position={coords} icon={universalIcon}>
                                    <Popup className="custom-popup" maxWidth={300} minWidth={280} autoPan={true}>
                                        <div style={{ width: '280px', fontFamily: 'Inter, sans-serif', color: 'white' }}>

                                            {/* Header */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontWeight: 800, fontSize: '13px', color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {loc.region || 'Sampling Site'}
                                                    </p>
                                                    <p style={{ fontSize: '8px', color: '#94a3b8', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                                        {loc.country || 'Unknown'}
                                                    </p>
                                                </div>
                                                <span style={{
                                                    padding: '2px 7px', borderRadius: '4px', fontSize: '8px', fontWeight: 700, flexShrink: 0, marginLeft: '8px',
                                                    background: loc.status === 'Completed' ? 'rgba(16,185,129,0.2)' : 'rgba(6,182,212,0.2)',
                                                    color: loc.status === 'Completed' ? '#10b981' : '#06b6d4',
                                                    border: loc.status === 'Completed' ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(6,182,212,0.4)',
                                                    cursor: 'default'
                                                }}>{loc.status}</span>
                                            </div>

                                            {/* Coords + Habitat */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                                                <div style={{ background: 'rgba(15,23,42,0.7)', padding: '7px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                    <p style={{ fontSize: '7px', color: '#64748b', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>📍 Location</p>
                                                    <p style={{ fontSize: '9px', color: '#06b6d4', fontFamily: 'monospace', margin: 0, fontWeight: 600 }}>{coords[0].toFixed(2)}, {coords[1].toFixed(2)}</p>
                                                </div>
                                                <div style={{ background: 'rgba(15,23,42,0.7)', padding: '7px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                    <p style={{ fontSize: '7px', color: '#64748b', margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>🌿 Habitat</p>
                                                    <p style={{ fontSize: '9px', color: '#f8fafc', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{loc.habitat_type || 'Ecosystem'}</p>
                                                </div>
                                            </div>

                                            {/* Species Section */}
                                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
                                                {/* Header row */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                                                    <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.1em' }}>🔬 Species Detected</span>
                                                    <span style={{ fontSize: '9px', color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 800, cursor: 'default' }}>
                                                        {(loc.detection_count || loc.results?.length || 0).toLocaleString()} total
                                                    </span>
                                                </div>

                                                {loc.results && loc.results.length > 0 ? (() => {
                                                    const statusConfig = {
                                                        Endangered: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.4)' },
                                                        Invasive:   { color: '#a855f7', bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.4)' },
                                                        Rare:       { color: '#06b6d4', bg: 'rgba(6,182,212,0.12)', border: 'rgba(6,182,212,0.4)' },
                                                        Native:     { color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.4)' },
                                                        Concern:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)' },
                                                    };
                                                    const breakdown = loc.results.reduce((acc, r) => { const s = r.status || 'Native'; acc[s] = (acc[s] || 0) + 1; return acc; }, {});
                                                    const priorityOrder = ['Endangered', 'Invasive', 'Rare', 'Concern', 'Native'];
                                                    const sortedSpecies = [...loc.results].sort((a, b) => priorityOrder.indexOf(a.status) - priorityOrder.indexOf(b.status));

                                                    return (
                                                        <div>
                                                            {/* Status breakdown — display labels only, NOT clickable */}
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                                                                {Object.entries(breakdown).sort((a,b) => priorityOrder.indexOf(a[0]) - priorityOrder.indexOf(b[0])).map(([status, count]) => {
                                                                    const cfg = statusConfig[status] || statusConfig.Native;
                                                                    return (
                                                                        <span key={status} style={{
                                                                            background: cfg.bg,
                                                                            border: `1px solid ${cfg.border}`,
                                                                            color: cfg.color,
                                                                            fontSize: '8px',
                                                                            fontWeight: 800,
                                                                            padding: '3px 7px',
                                                                            borderRadius: '4px',
                                                                            textTransform: 'uppercase',
                                                                            letterSpacing: '0.05em',
                                                                            cursor: 'default',          /* not a button */
                                                                            userSelect: 'none',
                                                                            pointerEvents: 'none'      /* truly non-interactive */
                                                                        }}>
                                                                            {count} {status}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>

                                                            {/* Scrollable species list */}
                                                            <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px', paddingRight: '2px' }}>
                                                                {sortedSpecies.map((res, i) => {
                                                                    const cfg = statusConfig[res.status] || statusConfig.Native;
                                                                    return (
                                                                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: '5px', borderLeft: `2px solid ${cfg.color}`, flexShrink: 0 }}>
                                                                            <div style={{ flex: 1, minWidth: 0, marginRight: '6px' }}>
                                                                                <p style={{ fontSize: '10px', fontWeight: 700, color: '#f8fafc', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>{res.species_name}</p>
                                                                                {res.common_name && <p style={{ fontSize: '8px', color: '#64748b', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{res.common_name.split(',')[0]}</p>}
                                                                            </div>
                                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                                                                                <span style={{ fontSize: '9px', fontWeight: 800, color: cfg.color }}>{Math.round((res.confidence || 0) * 100)}%</span>
                                                                                <span style={{ fontSize: '7px', color: cfg.color, opacity: 0.7, textTransform: 'uppercase' }}>{res.status}</span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>

                                                            {loc.detection_count > loc.results.length && (
                                                                <p style={{ fontSize: '8px', color: '#475569', textAlign: 'center', marginTop: '5px', fontStyle: 'italic' }}>
                                                                    Showing top {loc.results.length} of {loc.detection_count.toLocaleString()} species detected
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })() : (
                                                    <p style={{ fontSize: '9px', color: '#475569', textAlign: 'center', fontStyle: 'italic', padding: '10px 0' }}>No species data yet</p>
                                                )}
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            </React.Fragment>
                        );
                    })}
                </MapContainer>
            </div>
        </div>
    );
};

export default GISMap;

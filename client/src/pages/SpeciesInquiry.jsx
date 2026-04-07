import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Search,
    Filter,
    Dna,
    Info,
    ExternalLink,
    FileText,
    ShieldCheck,
    AlertTriangle,
    Loader2,
    Database,
    MapPin,
    Sprout,
    Leaf
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const SpeciesInquiry = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedSpecies, setSelectedSpecies] = useState(null);
    const [wikiImage, setWikiImage] = useState(null);
    const [wikiDesc, setWikiDesc] = useState("Loading ecological profile...");
    const [wikiHabitat, setWikiHabitat] = useState("Analyzing genomic data...");
    const [wikiDiet, setWikiDiet] = useState("Analyzing...");
    const [wikiClimate, setWikiClimate] = useState("Analyzing...");
    const [wikiRegion, setWikiRegion] = useState("Analyzing...");
    const [wikiCircadian, setWikiCircadian] = useState("Analyzing...");
    const [wikiMigration, setWikiMigration] = useState("Analyzing...");
    const [wikiUrl, setWikiUrl] = useState(null);

    const handleSearch = async (query) => {
        setLoading(true);
        try {
            const response = await axios.get(`http://localhost:8000/api/species?q=${query}`);
            setResults(response.data);
            if (response.data.length > 0 && !selectedSpecies) {
                setSelectedSpecies(response.data[0]);
            }
            setLoading(false);
        } catch (err) {
            console.error("Search failed", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        handleSearch('');
    }, []);

    // Fetch Wikipedia Info when a species is selected
    useEffect(() => {
        if (!selectedSpecies) {
            setWikiImage(null);
            setWikiDesc("Select a species to view its ecological profile.");
            return;
        }

        const fetchWikiData = async () => {
            setWikiImage(null);
            setWikiDesc("Connecting to global biodiversity database...");
            setWikiHabitat("Analyzing genomic data...");
            setWikiDiet("Analyzing...");
            setWikiClimate("Analyzing...");
            setWikiRegion("Analyzing...");
            setWikiCircadian("Analyzing...");
            setWikiMigration("Analyzing...");
            setWikiUrl(null);
            
            try {
                // Determine best search query for image & text
                const rawCommonName = selectedSpecies.common_name || (selectedSpecies.species_name.split('(')[1]?.replace(')', '') || selectedSpecies.species_name);
                const primaryCommonName = rawCommonName.split(',')[0].trim();
                let searchQuery = primaryCommonName || selectedSpecies.species_name;
                
                // Replace hyphens with spaces for Wikipedia API (fixes "Iris-setosa" -> "Iris setosa")
                let wikiSearchTerm = searchQuery.replace(/-/g, ' ');

                // 1. Bypass logic for specific animals (like White-tailed deer)
                if (searchQuery.toLowerCase().includes("white-tailed deer") || selectedSpecies.species_name.toLowerCase().includes("odocoileus virginianus")) {
                    setWikiImage("https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/White-tailed_deer.jpg/500px-White-tailed_deer.jpg");
                } 
                else if (selectedSpecies.species_name.toLowerCase().includes("tiger") || selectedSpecies.species_name.toLowerCase().includes("panthera")) {
                    setWikiImage("/tiger_new.png");
                }
                else if (selectedSpecies.species_name.toLowerCase().includes("elephant") || selectedSpecies.species_name.toLowerCase().includes("loxodonta")) {
                    setWikiImage("/elephant.png");
                }
                else {
                    // Try to fetch image
                    let searchUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(wikiSearchTerm)}&prop=pageimages&format=json&pithumbsize=500&origin=*`;
                    let searchRes = await axios.get(searchUrl);
                    let searchPages = searchRes.data.query.pages;
                    if (searchPages) {
                        const searchPage = Object.values(searchPages)[0];
                        if (searchPage?.thumbnail) {
                            setWikiImage(searchPage.thumbnail.source);
                        } else {
                            let titleUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiSearchTerm)}&prop=pageimages&format=json&pithumbsize=500&origin=*`;
                            let titleRes = await axios.get(titleUrl);
                            let titlePage = Object.values(titleRes.data.query.pages)[0];
                            setWikiImage(titlePage?.thumbnail?.source || null);
                        }
                    }
                }

                // 2. Fetch summary text
                let summaryUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrlimit=1&gsrsearch=${encodeURIComponent(wikiSearchTerm)}&prop=extracts&exintro&explaintext&format=json&origin=*`;
                let summaryRes = await axios.get(summaryUrl);
                let pages = summaryRes.data?.query?.pages;
                let page = pages ? Object.values(pages)[0] : null;
                
                if (page && page.extract && page.extract.trim().length > 0) {
                    // truncate to ~300 chars for clean display
                    let text = page.extract;
                    if (text.length > 350) text = text.substring(0, 350) + "...";
                    setWikiDesc(text);
                    setWikiUrl(`https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`);

                    // Intelligent Habitat NLP Resolver
                    let lowerText = text.toLowerCase();
                    let commonStr = (primaryCommonName || '').toLowerCase();
                    let sciStr = (selectedSpecies.species_name || '').toLowerCase();
                    
                    if (lowerText.includes('marine') || lowerText.includes('ocean') || lowerText.includes('sea') || commonStr.includes('whale') || commonStr.includes('dolphin')) setWikiHabitat('Marine Ecosystem');
                    else if (commonStr.includes('deer') || sciStr.includes('odocoileus')) setWikiHabitat('Forest / Grassland');
                    else if (commonStr.includes('tiger') || sciStr.includes('panthera')) setWikiHabitat('Dense Forest / Jungle');
                    else if (commonStr.includes('elephant') || sciStr.includes('loxodonta')) setWikiHabitat('Savanna / Forest');
                    else if (commonStr.includes('bass') || commonStr.includes('trout') || commonStr.includes('salmon') || lowerText.includes('river') || lowerText.includes('freshwater') || lowerText.includes('lake') || lowerText.includes('aquatic')) setWikiHabitat('Freshwater Aquatic');
                    else if (lowerText.includes('forest') || lowerText.includes('woodland') || lowerText.includes('jungle')) setWikiHabitat('Forest / Woodland');
                    else if (lowerText.includes('desert') || lowerText.includes('arid') || lowerText.includes('sand')) setWikiHabitat('Desert Ecosystem');
                    else if (lowerText.includes('mountain') || lowerText.includes('alpine') || lowerText.includes('rocky') || commonStr.includes('bear')) setWikiHabitat('Alpine / Mountainous');
                    else if (lowerText.includes('wetland') || lowerText.includes('swamp') || lowerText.includes('marsh') || lowerText.includes('bog') || commonStr.includes('frog') || commonStr.includes('toad')) setWikiHabitat('Wetlands / Marsh');
                    else if (lowerText.includes('grassland') || lowerText.includes('savanna') || lowerText.includes('prairie') || lowerText.includes('meadow') || commonStr.includes('mouse') || commonStr.includes('rat')) setWikiHabitat('Grassland / Meadow');
                    else if (lowerText.includes('tree') || lowerText.includes('canopy') || commonStr.includes('bird') || commonStr.includes('eagle') || commonStr.includes('hawk') || commonStr.includes('martin')) setWikiHabitat('Arboreal Canopy');
                    else {
                        let h = selectedSpecies.preferred_habitat || 'Unknown Environment';
                        if (String(h).includes('Freshwater Ecosystem') && !(lowerText.includes('fish') || lowerText.includes('aquatic') || commonStr.includes('frog') || lowerText.includes('river'))) {
                            setWikiHabitat('Terrestrial Ecosystem');
                        } else {
                            setWikiHabitat(h);
                        }
                    }

                    // Intelligent Diet NLP Resolver (Strict One-Word Classification)
                    if (lowerText.includes('plant') || lowerText.includes('flora') || lowerText.includes('flower') || sciStr.includes('iris') || sciStr.includes('rosa')) setWikiDiet('Photoautotroph');
                    else if (lowerText.includes('herbivore') || lowerText.includes('vegetarian') || commonStr.includes('deer') || commonStr.includes('elephant')) setWikiDiet('Herbivore');
                    else if (lowerText.includes('carnivore') || lowerText.includes('meat') || lowerText.includes('prey') || commonStr.includes('tiger') || lowerText.includes('predator')) setWikiDiet('Carnivore');
                    else if (lowerText.includes('omnivore') || commonStr.includes('bear') || commonStr.includes('rat') || lowerText.includes('opportunistic')) setWikiDiet('Omnivore');
                    else if (lowerText.includes('insectivore') || lowerText.includes('insects') || commonStr.includes('frog') || commonStr.includes('toad') || commonStr.includes('bat') || commonStr.includes('martin')) setWikiDiet('Insectivore');
                    else setWikiDiet('Generalist');

                    // Intelligent Climate NLP Resolver
                    let dbClimate = selectedSpecies.climate_conditions;
                    let hasValidDbClimate = dbClimate && String(dbClimate).toLowerCase() !== 'nan' && String(dbClimate).trim() !== '';
                    
                    if (lowerText.includes('tropical') || lowerText.includes('rainforest') || commonStr.includes('tiger') || commonStr.includes('elephant')) setWikiClimate('Tropical / Subtropical');
                    else if (lowerText.includes('arctic') || lowerText.includes('polar') || lowerText.includes('tundra') || commonStr.includes('beluga') || commonStr.includes('polar')) setWikiClimate('Arctic / Subarctic');
                    else if (lowerText.includes('temperate') || lowerText.includes('deciduous') || commonStr.includes('deer') || commonStr.includes('bass') || commonStr.includes('trout')) setWikiClimate('Temperate');
                    else if (lowerText.includes('arid') || lowerText.includes('desert') || lowerText.includes('dry')) setWikiClimate('Arid / Desert');
                    else if (lowerText.includes('alpine') || lowerText.includes('mountain') || commonStr.includes('bear')) setWikiClimate('Alpine / Mountainous');
                    else setWikiClimate(hasValidDbClimate ? dbClimate : 'Varied / Adaptable');

                    // Region Setup (Strictly pull from user's sample data as requested)
                    let dbRegion = selectedSpecies.geographic_region;
                    let hasValidDbRegion = dbRegion && String(dbRegion).toLowerCase() !== 'nan' && String(dbRegion).trim() !== '';
                    setWikiRegion(hasValidDbRegion ? dbRegion : 'Unspecified Sample Region');

                    // Priority 1: Use actual data from Sample Dataset if available
                    const dbBehavior = selectedSpecies.behavior;
                    const dbMigration = selectedSpecies.migration_pattern;
                    const hasRealBehavior = dbBehavior && !['Variable', 'Unknown', ''].includes(dbBehavior);
                    const hasRealMigration = dbMigration && !['Sedentary', 'Variable', 'Unknown', ''].includes(dbMigration);

                    // Intelligent Circadian NLP Resolver (Fallback)
                    if (hasRealBehavior) {
                        setWikiCircadian(dbBehavior);
                    } else if (lowerText.includes('nocturnal') || commonStr.includes('mouse') || commonStr.includes('rat') || commonStr.includes('bat') || commonStr.includes('owl')) {
                        setWikiCircadian('Nocturnal');
                    } else if (lowerText.includes('crepuscular') || commonStr.includes('deer')) {
                        setWikiCircadian('Crepuscular');
                    } else if (lowerText.includes('diurnal') || commonStr.includes('eagle')) {
                        setWikiCircadian('Diurnal');
                    } else {
                        setWikiCircadian(dbBehavior || 'Variable');
                    }

                    // Intelligent Migration NLP Resolver (Fallback)
                    if (hasRealMigration) {
                        setWikiMigration(dbMigration);
                    } else if (lowerText.includes('migratory') || commonStr.includes('bird') || commonStr.includes('whale') || commonStr.includes('salmon')) {
                        setWikiMigration('Migratory');
                    } else if (lowerText.includes('nomadic') || commonStr.includes('elephant')) {
                        setWikiMigration('Nomadic');
                    } else {
                        setWikiMigration(dbMigration || 'Sedentary');
                    }

                } else {
                    const fallbackHabitat = selectedSpecies.preferred_habitat || "various";
                    const fallbackStatus = selectedSpecies.status ? selectedSpecies.status.toLowerCase() : "detected";
                    const fallbackName = (primaryCommonName || selectedSpecies.species_name).replace(/-/g, ' ');
                    setWikiDesc(`The ${fallbackName} (${selectedSpecies.species_name}) is a biological organism identified within the current ecological dataset. Based on localized genomic signatures, it is classified as a ${fallbackStatus} species showing associations with ${fallbackHabitat} environments. Detailed encyclopedic profiling is currently being retrieved from remote databanks.`);
                    
                    // Fallback logic
                    let commonStr = (primaryCommonName || '').toLowerCase();
                    let sciStr = (selectedSpecies.species_name || '').toLowerCase();
                    if (commonStr.includes('deer') || sciStr.includes('odocoileus')) setWikiHabitat('Forest / Grassland');
                    else if (commonStr.includes('mouse') || commonStr.includes('rat') || sciStr.includes('peromyscus')) setWikiHabitat('Meadow / Forest Floor');
                    else if (commonStr.includes('tiger') || sciStr.includes('panthera')) setWikiHabitat('Dense Forest / Jungle');
                    else if (commonStr.includes('elephant') || sciStr.includes('loxodonta')) setWikiHabitat('Savanna / Forest');
                    else if (commonStr.includes('martin') || commonStr.includes('bird')) setWikiHabitat('Arboreal Canopy');
                    else {
                        let h = selectedSpecies.preferred_habitat || 'Unknown Environment';
                        if (String(h).includes('Freshwater Ecosystem') && !(commonStr.includes('fish') || commonStr.includes('bass') || commonStr.includes('frog') || commonStr.includes('trout'))) {
                            setWikiHabitat('Terrestrial Ecosystem');
                        } else {
                            setWikiHabitat(h);
                        }
                    }
                    
                    if (commonStr.includes('tiger')) setWikiDiet('Carnivore');
                    else if (commonStr.includes('bear') || commonStr.includes('rat')) setWikiDiet('Omnivore');
                    else if (commonStr.includes('deer') || commonStr.includes('elephant')) setWikiDiet('Herbivore');
                    else if (commonStr.includes('martin') || commonStr.includes('bat') || commonStr.includes('frog')) setWikiDiet('Insectivore');
                    else setWikiDiet('Generalist');
                    
                    let dbClimate = selectedSpecies.climate_conditions;
                    let hasValidDbClimate = dbClimate && String(dbClimate).toLowerCase() !== 'nan' && String(dbClimate).trim() !== '';
                    setWikiClimate(hasValidDbClimate ? dbClimate : 'Varied / Adaptable');
                    
                    let dbRegion = selectedSpecies.geographic_region;
                    let hasValidDbRegion = dbRegion && String(dbRegion).toLowerCase() !== 'nan' && String(dbRegion).trim() !== '';
                    setWikiRegion(hasValidDbRegion ? dbRegion : 'Unspecified Sample Region');
                    
                    if (commonStr.includes('mouse') || commonStr.includes('rat')) setWikiCircadian('Nocturnal');
                    else if (commonStr.includes('deer')) setWikiCircadian('Crepuscular');
                    else setWikiCircadian(selectedSpecies.behavior || 'Variable');

                    if (commonStr.includes('bird') || commonStr.includes('salmon')) setWikiMigration('Migratory');
                    else setWikiMigration(selectedSpecies.migration_pattern || 'Sedentary');
                }

            } catch (err) {
                console.error(err);
                const fallbackName = (selectedSpecies.common_name || selectedSpecies.species_name).split(',')[0].replace(/-/g, ' ');
                setWikiDesc(`The ${fallbackName} is a verified organism within this sample. Genomic confidence sits at ${((selectedSpecies.confidence || 0.85) * 100).toFixed(1)}%. It is currently flagged as ${selectedSpecies.status || 'Monitored'} in the region.`);
                
                let commonStr = fallbackName.toLowerCase();
                let sciStr = (selectedSpecies.species_name || '').toLowerCase();
                if (commonStr.includes('deer') || sciStr.includes('odocoileus')) setWikiHabitat('Forest / Grassland');
                else if (commonStr.includes('mouse') || commonStr.includes('rat') || sciStr.includes('peromyscus')) setWikiHabitat('Meadow / Forest Floor');
                else if (commonStr.includes('martin') || commonStr.includes('bird')) setWikiHabitat('Arboreal Canopy');
                else {
                    let h = selectedSpecies.preferred_habitat || 'Unknown Environment';
                    if (String(h).includes('Freshwater Ecosystem') && !(commonStr.includes('fish') || commonStr.includes('bass') || commonStr.includes('frog') || commonStr.includes('trout'))) {
                        setWikiHabitat('Terrestrial Ecosystem');
                    } else {
                        setWikiHabitat(h);
                    }
                }
                
                if (commonStr.includes('tiger')) setWikiDiet('Carnivore');
                else if (commonStr.includes('bear') || commonStr.includes('rat')) setWikiDiet('Omnivore');
                else if (commonStr.includes('deer') || commonStr.includes('elephant')) setWikiDiet('Herbivore');
                else if (commonStr.includes('martin') || commonStr.includes('bat') || commonStr.includes('frog')) setWikiDiet('Insectivore');
                else setWikiDiet('Generalist');
                let dbClimate = selectedSpecies.climate_conditions;
                let hasValidDbClimate = dbClimate && String(dbClimate).toLowerCase() !== 'nan' && String(dbClimate).trim() !== '';
                setWikiClimate(hasValidDbClimate ? dbClimate : 'Varied / Adaptable');
                
                let dbRegion = selectedSpecies.geographic_region;
                let hasValidDbRegion = dbRegion && String(dbRegion).toLowerCase() !== 'nan' && String(dbRegion).trim() !== '';
                setWikiRegion(hasValidDbRegion ? dbRegion : 'Unspecified Sample Region');
                setWikiCircadian(selectedSpecies.behavior || 'Variable');
                setWikiMigration(selectedSpecies.migration_pattern || 'Sedentary');
            }
        };

        fetchWikiData();

    }, [selectedSpecies]);

    const handleDownloadPDF = () => {
        if (!selectedSpecies) return;

        const doc = new jsPDF();
        const timestamp = new Date().toLocaleString();
        
        // Header styling (Molecular Intelligence Theme)
        doc.setFillColor(15, 23, 42); // slate-900 (Dark branding)
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setFontSize(22);
        doc.setTextColor(16, 185, 129); // dna-emerald
        doc.setFont("helvetica", "bold");
        doc.text("BIO-SURVEILLANCE REPORT", 105, 20, { align: "center" });
        
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.setFont("helvetica", "normal");
        doc.text(`Molecular Intelligence Systems | Generated: ${timestamp}`, 105, 28, { align: "center" });

        // Species Identity
        doc.setFontSize(18);
        doc.setTextColor(15, 23, 42);
        const name = selectedSpecies.common_name ? selectedSpecies.common_name.split(',')[0] : selectedSpecies.species_name;
        doc.text(name.toUpperCase(), 20, 55);

        doc.setFontSize(12);
        doc.setTextColor(56, 189, 248); // dna-cyan
        doc.setFont("helvetica", "italic");
        doc.text(selectedSpecies.species_name, 20, 62);
        doc.setFont("helvetica", "normal");

        // Primary Metrics Table
        autoTable(doc, {
            startY: 70, head: [['BIOMETRIC SUMMARY', 'VALUE']],
            body: [
                ['Taxonomic ID', selectedSpecies.taxonomic_id],
                ['Genomic Confidence', `${(selectedSpecies.confidence * 100).toFixed(1)}%`],
                ['Detection Abundance', `${selectedSpecies.count} Samples`],
                ['Conservation Status', selectedSpecies.status],
                ['Action Protocol', selectedSpecies.status === 'Invasive' ? 'QUARANTINE' : 
                                     selectedSpecies.status === 'Endangered' ? 'CRITICAL' : 
                                     selectedSpecies.status === 'Rare' ? 'PROTECT' : 'MONITOR']
            ],
            theme: 'striped',
            headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold' },
            bodyStyles: { textColor: [51, 65, 85], fontSize: 10 },
            margin: { left: 20, right: 20 }
        });

        // Ecological & Behavioral Data
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("ECOLOGICAL & ETHOLOGICAL ANALYSIS", 20, doc.lastAutoTable.finalY + 15);
        
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 20,
            head: [['PARAMETER', 'DATA OBSERVATION']],
            body: [
                ['Main Habitat', wikiHabitat],
                ['Trophic Diet', wikiDiet],
                ['Climate Zone', wikiClimate],
                ['Regional Focus', wikiRegion],
                ['Circadian Rhythm', wikiCircadian],
                ['Migration Pattern', wikiMigration]
            ],
            theme: 'grid',
            headStyles: { fillColor: [56, 189, 248], textColor: [255, 255, 255], fontStyle: 'bold' },
            columnStyles: { 0: { fontStyle: 'bold', minCellWidth: 40 } },
            margin: { left: 20, right: 20 }
        });

        // Detailed Description
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("TAXONOMIC OVERVIEW", 20, doc.lastAutoTable.finalY + 15);
        
        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105);
        doc.setFont("helvetica", "normal");
        const splitText = doc.splitTextToSize(wikiDesc, 170);
        const descY = doc.lastAutoTable.finalY + 25;
        doc.text(splitText, 20, descY);
        
        // Calculate height of the description to position the glossary correctly
        const descHeight = (splitText.length * 5) + 15;
        const glossaryY = descY + descHeight;

        // Scientific Glossary Section
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("SCIENTIFIC GLOSSARY (TERM EXPLANATIONS)", 20, glossaryY);

        const glossaryBody = [];
        
        // Dynamic Glossary Logic
        const dietMap = {
            'Herbivore': 'Primary consumer that feeds on plants/vegetation.',
            'Carnivore': 'Secondary consumer that feeds on animal tissue.',
            'Omnivore': 'Generalist consumer feeding on both plants and animals.',
            'Insectivore': 'Specialized consumer primarily feeding on insects.',
            'Photoautotroph': 'Botanical energy producer via photosynthesis (Light).'
        };
        const circadianMap = {
            'Crepuscular': 'Active primarily during twilight (Dawn and Dusk).',
            'Nocturnal': 'Active primarily during night-time hours.',
            'Diurnal': 'Active primarily during daylight hours.'
        };
        const migrationMap = {
            'Variable': 'Non-fixed movement; adapts to local food/weather.',
            'Migratory': 'Regular seasonal movement between habitats.',
            'Sedentary': 'Remains in one geographical area year-round.'
        };

        if (dietMap[wikiDiet]) glossaryBody.push([wikiDiet, dietMap[wikiDiet]]);
        if (circadianMap[wikiCircadian]) glossaryBody.push([wikiCircadian, circadianMap[wikiCircadian]]);
        if (migrationMap[wikiMigration]) glossaryBody.push([wikiMigration, migrationMap[wikiMigration]]);

        autoTable(doc, {
            startY: glossaryY + 7,
            head: [['TERM', 'SCIENTIFIC EXPLANATION / DEFINITION']],
            body: glossaryBody,
            theme: 'striped',
            headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255] },
            columnStyles: { 0: { fontStyle: 'bold', width: 40 } },
            margin: { left: 20, right: 20 }
        });

        const pageCount = doc.internal.getNumberOfPages();
        for(let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text("PROPRIETARY MOLECULAR DATA - CONFIDENTIAL SURVEILLANCE LOG", 105, 285, { align: "center" });
            doc.text(`Page ${i} of ${pageCount}`, 200, 285, { align: "right" });
        }

        doc.save(`${selectedSpecies.species_name.replace(/\s+/g, '_')}_BioReport.pdf`);
    };

    const onSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20 mt-4 max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase border-b-2 border-dna-cyan pb-2 inline-block">Species Inquiry Engine</h2>
                    <p className="text-slate-400 text-sm mt-3 font-medium">Deep-dive taxonomic analysis & biological profiling</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Search Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass-card p-6 space-y-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-t border-dna-cyan/20">
                        <div className="space-y-3">
                            <label className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center"><Search className="w-3 h-3 mr-2 text-dna-cyan"/>Search Database</label>
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={onSearchChange}
                                    placeholder="Enter taxonomic name..."
                                    className="glass-input w-full pl-4 pr-10 h-12 text-sm font-medium bg-slate-900 border-slate-700 focus:border-dna-cyan transition-colors rounded-xl"
                                />
                                <button 
                                    onClick={() => handleSearch(searchQuery)}
                                    className="absolute right-2 top-2 bottom-2 bg-dna-cyan/10 hover:bg-dna-cyan/20 text-dna-cyan rounded-lg px-3 transition-colors flex items-center justify-center">
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-white/5">
                            <h4 className="font-black text-[10px] uppercase text-slate-500 tracking-widest flex items-center justify-between">
                                <span>Detected Organisms</span>
                                <span className="text-dna-cyan bg-dna-cyan/10 px-2 py-0.5 rounded-full">{results.length}</span>
                            </h4>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                {loading ? (
                                    <div className="py-10 flex flex-col items-center justify-center space-y-3">
                                        <Loader2 className="w-6 h-6 animate-spin text-dna-cyan" />
                                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Querying...</span>
                                    </div>
                                ) : results.map((s, idx) => {
                                    // Robust name formatting
                                    const rawName = s.species_name || 'Unknown Species';
                                    const rawCN = s.common_name || (String(rawName).includes('(') ? rawName.split('(')[1]?.replace(')', '') : rawName);
                                    const finalCN = String(rawCN).split(',')[0].trim();

                                    return (
                                    <button
                                        key={s.species_name || idx}
                                        onClick={() => setSelectedSpecies(s)}
                                        className={`w-full text-left p-3 rounded-xl transition-all duration-300 flex flex-col gap-1 shadow-sm ${selectedSpecies?.id === s.id 
                                            ? 'bg-gradient-to-br from-dna-deep to-slate-800 border-l-4 border-l-dna-cyan text-white shadow-lg' 
                                            : 'bg-slate-900/40 text-slate-400 hover:bg-slate-800 border-l-4 border-l-transparent'
                                            }`}
                                    >
                                        <span className="font-bold text-sm truncate capitalize">{finalCN}</span>
                                        <span className="text-[10px] font-mono opacity-60 italic">{rawName}</span>
                                    </button>
                                )})}
                                {results.length === 0 && !loading && (
                                    <p className="text-[10px] text-slate-500 italic py-4 text-center">No organisms found matching criteria.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="glass-card p-5 border-l-4 border-l-dna-emerald bg-slate-900/60 shadow-lg">
                        <h4 className="font-black text-[9px] uppercase text-slate-500 tracking-widest mb-3">Live Data Feeds</h4>
                        <div className="space-y-3">
                            <div className="flex items-center space-x-3 text-xs text-slate-300 font-medium">
                                <div className="p-1.5 bg-dna-emerald/10 rounded">
                                    <ShieldCheck className="w-3.5 h-3.5 text-dna-emerald" />
                                </div>
                                <span>NCBI GenBank (Active)</span>
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-slate-300 font-medium">
                                <div className="p-1.5 bg-dna-cyan/10 rounded">
                                    <Database className="w-3.5 h-3.5 text-dna-cyan" />
                                </div>
                                <span>BOLD Systems Global</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Area */}
                <div className="lg:col-span-3 space-y-6">
                    {selectedSpecies ? (
                        <div className="glass-card overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)] animate-slide-in flex flex-col border border-white/5">
                            
                            {/* Profile Header Block */}
                            <div className="relative bg-slate-900 overflow-hidden">
                                {/* Abstract Background Art */}
                                <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                                    <div className="absolute -right-20 -top-20 w-96 h-96 bg-dna-cyan rounded-full mix-blend-screen filter blur-[100px] opacity-30"></div>
                                    <div className="absolute right-40 bottom-0 w-64 h-64 bg-dna-emerald rounded-full mix-blend-screen filter blur-[80px] opacity-20"></div>
                                </div>

                                <div className="relative z-10 p-8 flex flex-col md:flex-row gap-8 items-start md:items-center">
                                    {/* Image Container */}
                                    <div className="w-40 h-40 md:w-52 md:h-52 shrink-0 rounded-2xl bg-black border-4 border-slate-800 flex items-center justify-center overflow-hidden shadow-2xl relative group">
                                        {wikiImage ? (
                                            <img src={wikiImage} alt={selectedSpecies.species_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center opacity-30">
                                                <Leaf size={40} className="mb-2 text-dna-cyan" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">No Image</span>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 border border-white/10 rounded-2xl pointer-events-none"></div>
                                    </div>

                                    {/* Title & Status */}
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg ${selectedSpecies.status === 'Invasive' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                                                    selectedSpecies.status === 'Rare' ? 'bg-dna-cyan/20 text-dna-cyan border border-dna-cyan/30' :
                                                        'bg-dna-emerald/20 text-dna-emerald border border-dna-emerald/30'
                                                    }`}>
                                                    {selectedSpecies.status}
                                                </span>
                                                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-widest bg-slate-800/50 px-3 py-1 rounded-full border border-white/5">
                                                    ID: {selectedSpecies.taxonomic_id}
                                                </span>
                                            </div>
                                            <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight capitalize">{selectedSpecies.common_name ? selectedSpecies.common_name.split(',')[0] : selectedSpecies.species_name}</h3>
                                            <p className="text-xl text-dna-cyan mt-1 font-serif italic tracking-wide">{selectedSpecies.species_name}</p>
                                        </div>

                                        <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
                                            {wikiDesc}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Key Metrics Strip */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5">
                                <div className="bg-slate-900 p-6 flex flex-col gap-1 hover:bg-slate-800/80 transition-colors">
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center"><Dna size={12} className="mr-1.5 text-dna-emerald"/>Confidence</span>
                                    <span className="text-2xl font-black text-white">{(parseFloat(selectedSpecies.confidence || 0.85) * 100).toFixed(1)}<span className="text-sm text-slate-500 ml-1">%</span></span>
                                </div>
                                <div className="bg-slate-900 p-6 flex flex-col gap-1 hover:bg-slate-800/80 transition-colors">
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center"><Database size={12} className="mr-1.5 text-dna-cyan"/>Abundance</span>
                                    <span className="text-2xl font-black text-white">{selectedSpecies.count} <span className="text-sm text-slate-500 ml-1 font-normal capitalize">Samples</span></span>
                                </div>
                                <div className="bg-slate-900 p-6 flex flex-col gap-1 hover:bg-slate-800/80 transition-colors">
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center"><MapPin size={12} className="mr-1.5 text-indigo-400"/>Habitat</span>
                                    <span className="text-sm font-bold text-white capitalize leading-tight mt-1 truncate">
                                        {wikiHabitat}
                                    </span>
                                </div>
                                <div className="bg-slate-900 p-6 flex flex-col gap-1 hover:bg-slate-800/80 transition-colors">
                                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest flex items-center">
                                        <AlertTriangle size={12} className={`mr-1.5 ${
                                            selectedSpecies.status === 'Invasive' ? 'text-purple-400' : 
                                            selectedSpecies.status === 'Endangered' ? 'text-red-500' : 
                                            selectedSpecies.status === 'Rare' ? 'text-blue-400' : 'text-dna-emerald'
                                        }`}/>
                                        Protocol
                                    </span>
                                    <span className={`text-base font-black uppercase mt-1 ${
                                        selectedSpecies.status === 'Invasive' ? 'text-purple-400' : 
                                        selectedSpecies.status === 'Endangered' ? 'text-red-500' : 
                                        selectedSpecies.status === 'Rare' ? 'text-blue-400' : 'text-dna-emerald'
                                    }`}>
                                        {selectedSpecies.status === 'Invasive' ? 'QUARANTINE' : 
                                         selectedSpecies.status === 'Endangered' ? 'CRITICAL' : 
                                         selectedSpecies.status === 'Rare' ? 'PROTECT' : 'MONITOR'}
                                    </span>
                                </div>
                            </div>

                            {/* Deep Ecological Data */}
                            <div className="p-8 bg-slate-900 border-t border-white/5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    
                                    {/* Column 1: Physical & Diet */}
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="flex items-center text-sm font-black text-white tracking-widest uppercase mb-4">
                                                <Sprout className="w-4 h-4 mr-2 text-dna-emerald" />
                                                Ecological Profile
                                            </h4>
                                            <div className="space-y-4 bg-slate-800/40 p-5 rounded-2xl border border-white/5">
                                                <div className="flex justify-between border-b border-white/5 pb-3">
                                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Trophic Diet</span>
                                                    <span className="text-sm font-medium text-white capitalize text-right">{wikiDiet}</span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/5 pb-3 gap-1">
                                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Climate</span>
                                                    <span className="text-sm font-medium text-white capitalize sm:text-right">{wikiClimate}</span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Region Focus</span>
                                                    <span className="text-sm font-medium text-white capitalize sm:text-right">{wikiRegion}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 2: Ethology & Export */}
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="flex items-center text-sm font-black text-white tracking-widest uppercase mb-4">
                                                <Info className="w-4 h-4 mr-2 text-indigo-400" />
                                                Ethology Metrics
                                            </h4>
                                            <div className="space-y-4 bg-slate-800/40 p-5 rounded-2xl border border-white/5">
                                                <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/5 pb-3 gap-1">
                                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Circadian</span>
                                                    <span className="text-sm font-medium text-white capitalize sm:text-right">{wikiCircadian}</span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:justify-between border-b border-white/5 pb-3 gap-1">
                                                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Migration</span>
                                                    <span className="text-sm font-medium text-white capitalize sm:text-right">{wikiMigration}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                            <button 
                                                onClick={handleDownloadPDF}
                                                className="flex-1 py-3.5 bg-dna-emerald hover:bg-emerald-400 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2"
                                            >
                                                <FileText className="w-4 h-4" />
                                                <span>Download PDF Report</span>
                                            </button>
                                            <a 
                                                href={wikiUrl || `https://en.wikipedia.org/wiki/${encodeURIComponent(selectedSpecies.species_name)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest border border-white/10 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Info className="w-4 h-4" />
                                                <span>Wikipedia Intel</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="glass-card flex flex-col items-center justify-center py-32 text-center opacity-70 shadow-xl border border-white/5 rounded-3xl bg-slate-800/20">
                            <div className="w-24 h-24 rounded-full bg-slate-800/80 flex items-center justify-center border border-white/10 mb-6 shadow-inner">
                                <Search className="w-10 h-10 text-slate-500" />
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight">System Waiting for Input</h3>
                            <p className="text-sm text-slate-400 max-w-sm mt-3 font-medium leading-relaxed">Select a biological record from the detected list or query the taxonomic database to initiate a molecular profile analysis.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpeciesInquiry;

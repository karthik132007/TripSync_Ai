import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Sparkles, Compass, MapPin, Coffee, Sun, Moon, Info, Utensils, Star, CheckCircle2, ChevronRight, Wallet } from 'lucide-react';
import { AmbientParticles } from '../ui/AmbientParticles';
import imageCache from '../../data/image_cache.json';

// --- Place Gallery Component ---
const PlaceGallery = ({ placeName }) => {
    const normalizedName = placeName.toLowerCase().trim();
    const cacheKey = Object.keys(imageCache).find(k => k.toLowerCase() === normalizedName) ||
        Object.keys(imageCache).find(k => normalizedName.includes(k.toLowerCase()) || k.toLowerCase().includes(normalizedName));

    if (!cacheKey || !imageCache[cacheKey] || !imageCache[cacheKey].images || imageCache[cacheKey].images.length === 0) {
        return null;
    }

    const images = imageCache[cacheKey].images.slice(0, 3);
    if (images.length === 0) return null;

    return (
        <div className="mb-14 grid grid-cols-1 md:grid-cols-12 gap-3 h-auto md:h-[450px] w-full rounded-[2rem] overflow-hidden shadow-2xl group/gallery animate-[fadeInUp_0.8s_ease-out] border border-black/5 bg-white">
            <div className={`overflow-hidden relative ${images.length > 1 ? 'md:col-span-8 h-[250px] md:h-full' : 'col-span-12 h-[300px] md:h-[450px]'}`}>
                <img
                    src={images[0]?.url_regular || images[0]?.url_raw}
                    alt={images[0]?.alt || placeName}
                    loading="lazy"
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
                <div className="absolute bottom-6 left-6 z-20 flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                    <MapPin size={16} className="text-white" />
                    <span className="text-sm font-bold text-white tracking-wide">{images[0]?.author || "Photography"}</span>
                </div>
            </div>

            {images.length > 1 && (
                <div className="col-span-12 md:col-span-4 grid grid-cols-2 md:grid-rows-2 md:grid-cols-1 gap-3 h-[150px] md:h-full p-2 bg-space-50">
                    {images[1] && (
                        <div className="h-full w-full overflow-hidden relative rounded-xl md:rounded-2xl shadow-sm border border-black/5">
                            <img
                                src={images[1]?.url_small || images[1]?.url_raw}
                                alt={images[1]?.alt || placeName}
                                loading="lazy"
                                className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700 ease-out"
                            />
                        </div>
                    )}
                    {images[2] && (
                        <div className="h-full w-full overflow-hidden relative rounded-xl md:rounded-2xl shadow-sm border border-black/5">
                            <img
                                src={images[2]?.url_small || images[2]?.url_raw}
                                alt={images[2]?.alt || placeName}
                                loading="lazy"
                                className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700 ease-out"
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- Parsers ---
const parseTripPlan = (text) => {
    if (!text) return null;
    try {
        const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        const jsonStr = match ? match[1] : text;
        return JSON.parse(jsonStr);
    } catch(e) {
        console.error("Failed to parse plan as JSON", e);
        return { error: true, raw: text };
    }
};

const normalizePlanData = (data) => {
    if(!data) return null;
    if(data.error) return data;
    
    let days = [];
    let expenses = null;
    let extras = [];
    
    // Parse Itinerary
    if (data.itinerary && Array.isArray(data.itinerary)) {
        days = data.itinerary.map(item => ({
            name: `Day ${item.day}`,
            activities: {
                Morning: item.morning || [],
                Afternoon: item.afternoon || [],
                Evening: item.evening || []
            }
        }));
    } else {
        // Fallback generic parser if 'itinerary' key is missing
        Object.keys(data).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes('day')) {
                days.push({ name: key, activities: data[key] });
            }
        });
        days.sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'}));
    }

    // Parse Expenses
    if (data.estimated_expense_breakdown) {
        expenses = data.estimated_expense_breakdown;
    } else {
        Object.keys(data).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes('expense') || lowerKey.includes('budget') || lowerKey.includes('cost')) {
                if(!expenses) expenses = data[key];
            }
        });
    }

    // Parse Extras (Tips, Food, Places)
    if (data.tips_and_additional_info) {
        extras.push({ title: "Tips & Info", content: data.tips_and_additional_info });
    }
    if (data.must_try_food) {
        extras.push({ title: "Must Try Food", content: data.must_try_food });
    }
    if (data.must_visit_places) {
        extras.push({ title: "Must Visit Places", content: data.must_visit_places });
    }
    
    // Fallback for extras if they weren't explicitly named
    if (extras.length === 0) {
        Object.keys(data).forEach(key => {
            const lowerKey = key.toLowerCase();
            if (!lowerKey.includes('day') && !lowerKey.includes('itinerary') && !lowerKey.includes('expense') && !lowerKey.includes('budget') && !lowerKey.includes('cost')) {
                extras.push({ title: key, content: data[key] });
            }
        });
    }

    return { days, expenses, extras };
};

// --- Render Helpers ---
const renderList = (items) => {
    if (!Array.isArray(items)) return <p className="text-space-700 font-medium">{String(items)}</p>;
    return (
        <ul className="space-y-3">
            {items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 group/item">
                    <CheckCircle2 size={18} className="text-pink-400 mt-0.5 shrink-0 opacity-70 group-hover/item:opacity-100 transition-opacity" />
                    <span className="text-space-700 font-medium group-hover/item:text-space-900 transition-colors">{item}</span>
                </li>
            ))}
        </ul>
    );
};

const formatTitle = (str) => {
    return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const getExtraIcon = (title) => {
    const t = title.toLowerCase();
    if (t.includes('food') || t.includes('eat')) return <Utensils size={20} className="text-pink-500" />;
    if (t.includes('place') || t.includes('visit')) return <Star size={20} className="text-ice-600" />;
    return <Info size={20} className="text-pink-400" />;
};

const getTimeIcon = (time) => {
    const t = time.toLowerCase();
    if (t.includes('morning')) return <Coffee size={20} className="text-pink-500" />;
    if (t.includes('afternoon')) return <Sun size={20} className="text-ice-600" />;
    if (t.includes('evening') || t.includes('night')) return <Moon size={20} className="text-space-700" />;
    return <Sparkles size={20} className="text-pink-400" />;
};

// --- Main Component ---
export const TripPlan = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [planData, setPlanData] = useState(null);
    const [preferences, setPreferences] = useState(null);
    const [isRendering, setIsRendering] = useState(true);
    const [activeTab, setActiveTab] = useState('Itinerary');

    useEffect(() => {
        let rawPlan = location.state?.recommendations || location.state?.planMarkdown;
        if (!rawPlan) rawPlan = localStorage.getItem('lastTripPlan');
        
        if (rawPlan) {
            const parsed = parseTripPlan(rawPlan);
            const normalized = normalizePlanData(parsed);
            if(JSON.stringify(normalized) !== JSON.stringify(planData)) {
                setPlanData(normalized);
            }
        }

        const prefs = localStorage.getItem('tripPreferences');
        if (prefs) setPreferences(JSON.parse(prefs));

        const timer = setTimeout(() => setIsRendering(false), 800);
        return () => clearTimeout(timer);
    }, [location]);

    const handleDownload = () => {
        const rawPlan = location.state?.recommendations || location.state?.planMarkdown || localStorage.getItem('lastTripPlan');
        if(!rawPlan) return;
        const blob = new Blob([rawPlan], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trip-plan-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleBack = () => navigate(-1);

    if (!planData && !isRendering) {
        return (
            <div className="relative min-h-screen flex items-center justify-center bg-space-50">
                <AmbientParticles />
                <div className="relative z-10 text-center max-w-md mx-auto p-12 bg-white/80 backdrop-blur-2xl rounded-[2.5rem] shadow-xl border border-black/5">
                    <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center mb-6 border border-black/5 shadow-[0_0_30px_rgba(255,96,144,0.2)]">
                        <Compass size={40} className="text-pink-500 animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-black text-space-900 mb-3 tracking-tight font-mono">No Journey Found</h2>
                    <p className="text-space-600 mb-8 text-lg font-medium">Your itinerary is a blank canvas. Let's design something extraordinary.</p>
                    <button onClick={() => navigate('/plan')} className="px-8 py-4 bg-space-900 text-white rounded-full font-bold hover:bg-space-800 hover:scale-105 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 mx-auto">
                        <Sparkles size={20} className="text-pink-400" />
                        Craft New Plan
                    </button>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'Itinerary', icon: <Compass size={18} /> },
        { id: 'Budget', icon: <Wallet size={18} /> },
        { id: 'Food', icon: <Utensils size={18} /> },
        { id: 'Places', icon: <Star size={18} /> },
        { id: 'Tips', icon: <Info size={18} /> }
    ];

    return (
        <div className="relative min-h-screen bg-space-50 text-space-900 font-sans selection:bg-pink-200 selection:text-space-900 pb-24">
            {/* Background Layers */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-white">
                <div className="absolute w-[800px] h-[800px] rounded-full opacity-[0.3]" style={{ background: 'radial-gradient(circle, var(--color-ice-200) 0%, transparent 70%)', top: '-15%', right: '-10%', filter: 'blur(120px)' }} />
                <div className="absolute w-[600px] h-[600px] rounded-full opacity-[0.2]" style={{ background: 'radial-gradient(circle, var(--color-pink-200) 0%, transparent 70%)', top: '40%', left: '-10%', filter: 'blur(100px)' }} />
                <div className="absolute w-[700px] h-[700px] rounded-full opacity-[0.2]" style={{ background: 'radial-gradient(circle, var(--color-ice-300) 0%, transparent 70%)', bottom: '-10%', right: '20%', filter: 'blur(110px)' }} />
            </div>
            <div className="fixed inset-0 opacity-[0.4] pointer-events-none z-[1]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-12 sticky top-4 z-50">
                    <button onClick={handleBack} className="group inline-flex items-center gap-2 px-6 py-3 bg-white/90 backdrop-blur-xl border border-black/5 rounded-full text-space-700 hover:text-space-900 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform text-pink-500" />
                        <span className="text-sm font-bold tracking-wide font-mono">Back</span>
                    </button>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button onClick={handleDownload} className="flex-1 sm:flex-none inline-flex justify-center items-center gap-2 px-6 py-3 rounded-full bg-white/90 backdrop-blur-xl border border-black/5 text-space-700 hover:text-space-900 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 text-sm font-mono font-bold">
                            <Download size={18} className="text-pink-500" /> Download JSON
                        </button>
                        <button onClick={() => navigate('/plan')} className="flex-1 sm:flex-none inline-flex justify-center items-center gap-2 px-8 py-3 rounded-full bg-space-900 text-white font-black shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm font-mono">
                            <Sparkles size={18} className="text-pink-400" /> New Plan
                        </button>
                    </div>
                </div>

                {/* Hero / Images */}
                <div className="mb-14 text-center animate-[fadeInUp_0.8s_ease-out]">
                    <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md px-5 py-2 rounded-full border border-black/5 shadow-sm mb-6">
                        <Sparkles size={16} className="text-pink-500 animate-pulse" />
                        <span className="text-space-700 text-xs sm:text-sm font-bold tracking-[0.2em] uppercase font-mono">
                            AI Curated Journey
                        </span>
                    </div>
                    <h1 className="text-5xl sm:text-7xl font-black text-space-900 tracking-tighter mb-8 font-mono">
                        {location.state?.placeData?.place || preferences?.place || "Your Destination"}
                    </h1>
                </div>

                {location.state?.placeData?.place && (
                    <PlaceGallery placeName={location.state.placeData.place} />
                )}

                {/* Main Content Area */}
                {isRendering ? (
                    <div className="animate-pulse space-y-12">
                        <div className="h-20 bg-black/5 rounded-[2rem] w-full"></div>
                        <div className="h-64 bg-black/5 rounded-[2rem] w-full mt-4"></div>
                        <div className="h-64 bg-black/5 rounded-[2rem] w-full mt-4"></div>
                    </div>
                ) : planData?.error ? (
                    <div className="bg-white/80 backdrop-blur-xl border border-coral-200 p-8 rounded-[2rem] mt-8 text-center text-coral-600 font-mono">
                        <p className="font-bold mb-4 text-xl">We couldn't structure the plan perfectly, but here's your generated text:</p>
                        <pre className="text-left text-space-700 bg-space-50 p-6 rounded-2xl overflow-auto border border-black/5 text-sm">{planData.raw}</pre>
                    </div>
                ) : (
                    <div className="space-y-12 pb-24 animate-[fadeIn_1.2s_ease-out]">
                        
                        {/* Preferences Summary */}
                        {preferences && (
                            <div className="flex flex-wrap items-center justify-center gap-4 py-8">
                                {[
                                    { label: "Dates", val: preferences.month?.join(', ') || 'Any time', color: "bg-ice-400" },
                                    { label: "Budget", val: 'INR ' + preferences.budget, color: "bg-coral-400" },
                                    { label: "Duration", val: preferences.duration + ' Days', color: "bg-blush-400" },
                                    { label: "Travel Style", val: preferences.best_for, color: "bg-ice-500" },
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col items-center bg-white/60 backdrop-blur-xl px-8 py-4 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
                                        <span className="text-[10px] uppercase tracking-[0.2em] text-space-400 font-bold mb-1 font-mono">{item.label}</span>
                                        <div className="flex items-center gap-2 font-mono font-bold text-space-800">
                                            <span className={`w-2 h-2 rounded-full ${item.color} animate-pulse`}></span>
                                            {item.val}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Tabs Navigation */}
                        <div className="flex justify-center mb-12 sticky top-[88px] z-40">
                            <div className="inline-flex items-center p-1.5 bg-white/60 backdrop-blur-2xl rounded-full border border-black/5 shadow-sm overflow-x-auto max-w-full glass-acrylic hide-scrollbar">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold font-mono transition-all duration-300 whitespace-nowrap ${
                                            activeTab === tab.id
                                                ? 'bg-pink-500 text-white shadow-md shadow-pink-500/20'
                                                : 'text-space-600 hover:text-space-900 hover:bg-space-100'
                                        }`}
                                    >
                                        {React.cloneElement(tab.icon, { className: activeTab === tab.id ? 'text-white' : 'text-ice-500' })}
                                        {tab.id}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tab Content Rendering */}
                        <div className="animate-[fadeInUp_0.8s_ease-out]">
                            {/* ITINERARY TAB */}
                            {activeTab === 'Itinerary' && planData.days && planData.days.length > 0 && (
                                <div>
                                    <h2 className="text-3xl font-black text-space-900 mb-10 text-center font-mono">Day-by-Day Itinerary</h2>
                                    <div className="space-y-16">
                                        {planData.days.map((day, idx) => (
                                            <div key={idx} className="relative pl-0 sm:pl-16 group/day">
                                                {/* Timeline vertical line (desktop only) */}
                                                <div className="hidden sm:block absolute left-4 top-10 bottom-[-4rem] w-px bg-gradient-to-b from-pink-200 via-ice-200 to-transparent"></div>
                                                
                                                {/* Day Header */}
                                                <div className="flex items-center gap-4 mb-8">
                                                    <div className="hidden sm:flex relative z-10 w-8 h-8 rounded-full bg-white border-4 border-pink-200 items-center justify-center -ml-[3.5rem] shadow-sm">
                                                        <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                                                    </div>
                                                    <h3 className="text-2xl sm:text-3xl font-black text-pink-500 font-mono inline-flex items-center gap-3">
                                                        {formatTitle(day.name)} 
                                                        <ChevronRight size={24} className="text-pink-200" />
                                                    </h3>
                                                </div>

                                                {/* Activities Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    {Object.entries(day.activities).map(([time, acts], actIdx) => (
                                                        <div key={actIdx} className="bg-white/80 backdrop-blur-xl border border-black/5 p-8 rounded-[1.5rem] shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 glass-card">
                                                            <div className="flex items-center gap-3 mb-6 border-b border-black/5 pb-4">
                                                                <div className="w-10 h-10 rounded-full bg-space-50 flex items-center justify-center shadow-inner">
                                                                    {getTimeIcon(time)}
                                                                </div>
                                                                <h4 className="font-bold text-space-900 text-lg font-mono tracking-tight">{formatTitle(time)}</h4>
                                                            </div>
                                                            <div className="text-space-700">
                                                                {renderList(acts)}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* BUDGET TAB */}
                            {activeTab === 'Budget' && planData.expenses && (
                                <div>
                                    <h2 className="text-3xl font-black text-space-900 mb-10 text-center font-mono">Estimated Expenses</h2>
                                    <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-xl glass-card">
                                        <table className="min-w-full divide-y divide-black/5 text-left text-sm sm:text-base">
                                            <thead className="bg-space-50 border-b border-black/10">
                                                <tr>
                                                    <th className="px-8 py-6 font-bold uppercase tracking-wider text-space-600 font-mono text-xs">Category</th>
                                                    <th className="px-8 py-6 font-bold uppercase tracking-wider text-space-600 font-mono text-xs text-right">Cost (INR)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-black/5 bg-white/50">
                                                {Array.isArray(planData.expenses) 
                                                    ? planData.expenses.map((exp, idx) => (
                                                        <tr key={idx} className="hover:bg-space-50/80 transition-colors">
                                                            {Object.values(exp).map((val, vIdx) => (
                                                                    <td key={vIdx} className={`px-8 py-5 text-space-800 font-medium ${vIdx === 1 ? 'text-right font-mono font-bold text-pink-600' : ''}`}>
                                                                        {val}
                                                                    </td>
                                                            ))}
                                                        </tr>
                                                    ))
                                                    : Object.entries(planData.expenses).map(([cat, cost], idx) => (
                                                        <tr key={idx} className="hover:bg-space-50/80 transition-colors group">
                                                            <td className="px-8 py-5 text-space-800 font-medium group-hover:text-space-900">{formatTitle(cat)}</td>
                                                            <td className="px-8 py-5 text-right font-mono font-bold text-pink-600">INR {cost}</td>
                                                        </tr>
                                                    ))
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* FOOD TAB */}
                            {activeTab === 'Food' && (
                                <div>
                                    <h2 className="text-3xl font-black text-space-900 mb-10 text-center font-mono">Gastronomic Journey</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {planData.extras?.filter(e => e.title.toLowerCase().includes('food') || e.title.toLowerCase().includes('eat')).map((extra, idx) => (
                                            <div key={idx} className="bg-gradient-to-br from-white to-pink-50/30 backdrop-blur-xl border border-black/5 p-8 rounded-[2rem] shadow-lg hover:shadow-xl transition-all glass-card">
                                                <div className="flex items-center gap-3 mb-6">
                                                    {getExtraIcon(extra.title)}
                                                    <h3 className="text-xl font-bold text-space-900 font-mono tracking-tight">{formatTitle(extra.title)}</h3>
                                                </div>
                                                {renderList(extra.content)}
                                            </div>
                                        ))}
                                    </div>
                                    {planData.extras?.filter(e => e.title.toLowerCase().includes('food') || e.title.toLowerCase().includes('eat')).length === 0 && (
                                        <p className="text-center text-space-600 font-mono">No specific food recommendations found for this trip.</p>
                                    )}
                                </div>
                            )}

                            {/* PLACES TAB */}
                            {activeTab === 'Places' && (
                                <div>
                                    <h2 className="text-3xl font-black text-space-900 mb-10 text-center font-mono">Must Visit Spots</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {planData.extras?.filter(e => e.title.toLowerCase().includes('place') || e.title.toLowerCase().includes('visit')).map((extra, idx) => (
                                            <div key={idx} className="bg-gradient-to-br from-white to-ice-50/30 backdrop-blur-xl border border-black/5 p-8 rounded-[2rem] shadow-lg hover:shadow-xl transition-all glass-card">
                                                <div className="flex items-center gap-3 mb-6">
                                                    {getExtraIcon(extra.title)}
                                                    <h3 className="text-xl font-bold text-space-900 font-mono tracking-tight">{formatTitle(extra.title)}</h3>
                                                </div>
                                                {renderList(extra.content)}
                                            </div>
                                        ))}
                                    </div>
                                    {planData.extras?.filter(e => e.title.toLowerCase().includes('place') || e.title.toLowerCase().includes('visit')).length === 0 && (
                                        <p className="text-center text-space-600 font-mono">No additional place priorities extracted.</p>
                                    )}
                                </div>
                            )}

                            {/* TIPS TAB */}
                            {activeTab === 'Tips' && (
                                <div>
                                    <h2 className="text-3xl font-black text-space-900 mb-10 text-center font-mono">Traveler Tips & Info</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {planData.extras?.filter(e => !e.title.toLowerCase().includes('place') && !e.title.toLowerCase().includes('visit') && !e.title.toLowerCase().includes('food') && !e.title.toLowerCase().includes('eat')).map((extra, idx) => (
                                            <div key={idx} className="bg-gradient-to-br from-white to-space-50/50 backdrop-blur-xl border border-black/5 p-8 rounded-[2rem] shadow-lg hover:shadow-xl transition-all glass-card">
                                                <div className="flex items-center gap-3 mb-6">
                                                    {getExtraIcon(extra.title)}
                                                    <h3 className="text-xl font-bold text-space-900 font-mono tracking-tight">{formatTitle(extra.title)}</h3>
                                                </div>
                                                {renderList(extra.content)}
                                            </div>
                                        ))}
                                    </div>
                                    {planData.extras?.filter(e => !e.title.toLowerCase().includes('place') && !e.title.toLowerCase().includes('visit') && !e.title.toLowerCase().includes('food') && !e.title.toLowerCase().includes('eat')).length === 0 && (
                                        <p className="text-center text-space-600 font-mono">No extra tips or info available.</p>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                )}
                
                {/* Footer Logo */}
                {planData && !planData.error && (
                    <div className="mt-20 pt-10 border-t border-black/5 text-center text-space-500 font-mono flex flex-col items-center gap-3 opacity-60">
                        <div className="w-16 h-1 bg-gradient-to-r from-transparent via-space-300 to-transparent rounded-full mb-2" />
                        <div className="tracking-[0.3em] uppercase text-[10px] text-space-400 font-bold">✦ TripSync AI Concierge ✦</div>
                    </div>
                )}
            </div>
        </div>
    );
};
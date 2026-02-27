import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Building, CloudSun, Calendar, Tag, Sparkles, DollarSign, Clock, Users } from 'lucide-react';
import { AmbientParticles } from '../ui/AmbientParticles';

export const PlaceInfo = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [placeData, setPlaceData] = useState(null);
    const [relatedPlaces, setRelatedPlaces] = useState([]);
    const [loading, setLoading] = useState(true);

    // AI Planner State
    const [planData, setPlanData] = useState(null);
    const [generatingPlan, setGeneratingPlan] = useState(false);
    const [isEditingPlan, setIsEditingPlan] = useState(false);

    const [planParams, setPlanParams] = useState(() => {
        try {
            const saved = localStorage.getItem('tripPreferences');
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    duration: parsed.duration || 3,
                    budget: parsed.budget || 50000,
                    best_for: parsed.best_for || 'Family',
                    tags: Array.isArray(parsed.tags) ? parsed.tags.join(', ') : (parsed.tags || 'Relaxing, Sightseeing')
                };
            }
        } catch (e) {
            console.error("Failed to parse tripPreferences from localStorage", e);
        }
        return {
            duration: 3,
            budget: 50000,
            best_for: 'Family',
            tags: 'Relaxing, Sightseeing'
        };
    });

    const handleParamChange = (e) => {
        const { name, value } = e.target;
        setPlanParams(prev => ({ ...prev, [name]: value }));
    };

    const handleGeneratePlan = async () => {
        setGeneratingPlan(true);
        try {
            const res = await fetch(`http://localhost:8000/places/${id}/plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    place: placeData.place || "this destination",
                    ...planParams,
                    duration: parseInt(planParams.duration) || 3,
                    budget: parseInt(planParams.budget) || 50000
                })
            });
            const data = await res.json();

            navigate(`/places/${id}/plan`, {
                state: {
                    planMarkdown: data.data,
                    placeData,
                    planParams
                }
            });
        } catch (error) {
            console.error("Error generating plan:", error);
        } finally {
            setGeneratingPlan(false);
        }
    };

    useEffect(() => {
        // Fetch place info and related places
        const fetchData = async () => {
            setLoading(true);
            try {
                const [infoRes, relatedRes] = await Promise.all([
                    fetch(`http://localhost:8000/places/${id}`),
                    fetch(`http://localhost:8000/places/${id}/related`)
                ]);

                const infoData = await infoRes.json();
                const relatedData = await relatedRes.json();

                setPlaceData(infoData.data);
                setRelatedPlaces(relatedData.data);
            } catch (error) {
                console.error("Error fetching place data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // Scroll to top on id change
        window.scrollTo(0, 0);
    }, [id]);

    if (loading || !placeData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fafafc] text-space-500">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-coral-200 border-t-coral-500 rounded-full animate-spin" />
                    <p className="animate-pulse tracking-wide font-medium">Loading destination details...</p>
                </div>
            </div>
        );
    }

    const imageUrl = placeData.image_url || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=2000';

    return (
        <div className="relative min-h-screen pb-24 font-sans text-space-900 selection:bg-ice-300/40 selection:text-space-900 overflow-x-hidden">

            {/* ===== BACKGROUND LAYERS ===== */}
            <div className="fixed inset-0 bg-gradient-to-br from-space-50 via-white to-ice-50/30 z-0" />

            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div
                    className="absolute w-[800px] h-[800px] rounded-full animate-blob opacity-[0.12]"
                    style={{ background: 'radial-gradient(circle, #A6E3E9 0%, transparent 70%)', top: '-15%', right: '-10%', filter: 'blur(120px)' }}
                />
                <div
                    className="absolute w-[600px] h-[600px] rounded-full animate-blob animation-delay-2000 opacity-[0.08]"
                    style={{ background: 'radial-gradient(circle, #FFD1D1 0%, transparent 70%)', top: '40%', left: '-10%', filter: 'blur(100px)' }}
                />
                <div
                    className="absolute w-[700px] h-[700px] rounded-full animate-blob animation-delay-4000 opacity-[0.06]"
                    style={{ background: 'radial-gradient(circle, #FF9494 0%, transparent 70%)', bottom: '-10%', right: '20%', filter: 'blur(110px)' }}
                />
                <div
                    className="absolute w-[500px] h-[500px] rounded-full animate-blob opacity-[0.05]"
                    style={{ background: 'radial-gradient(circle, #b6eaee 0%, transparent 70%)', top: '60%', left: '40%', filter: 'blur(90px)', animationDelay: '6s' }}
                />
            </div>

            <div className="fixed inset-0 pointer-events-none z-[1]">
                <AmbientParticles />
            </div>

            <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-[1]" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, #A6E3E9 0.6px, transparent 0)',
                backgroundSize: '32px 32px',
            }} />

            <div className="fixed inset-0 opacity-[0.015] pointer-events-none z-[1]" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
            }} />

            <div className="relative z-10 w-full">
                {/* Header / Hero Section */}
                <div className="relative h-[60vh] min-h-[500px] w-full">
                    <div className="absolute inset-0 z-0">
                        <img
                            src={imageUrl}
                            alt={placeData.place || "Destination"}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#fafafc] via-space-900/40 to-space-900/10" />
                    </div>

                    <div className="relative z-10 h-full max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 flex flex-col justify-end pb-16">
                        <button
                            onClick={() => navigate(-1)}
                            className="absolute top-8 left-6 sm:left-10 lg:left-16 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all hover:scale-105 cursor-pointer border border-white/20"
                        >
                            <ArrowLeft size={20} />
                        </button>

                        <div className="animate-fade-in-up">
                            <div className="flex items-center gap-2 mb-3">
                                <MapPin size={18} className="text-coral-400" />
                                <span className="text-white/90 text-sm md:text-base font-medium tracking-widest uppercase">
                                    {placeData.state ? `${placeData.state}, ` : ''}{placeData.country || 'Destination'}
                                </span>
                            </div>
                            <h1 className="text-6xl sm:text-7xl md:text-8xl font-black text-white tracking-tight leading-[1] drop-shadow-lg">
                                {placeData.place || "Destination Name"}
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 -mt-8 relative z-20">

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                        {/* Main Info Column */}
                        <div className="lg:col-span-2 space-y-10">
                            {/* Highlights Section */}
                            <div className="relative rounded-3xl border border-white/40 bg-white/[0.6] backdrop-blur-xl p-8 sm:p-10 shadow-[0_8px_32px_rgba(166,227,233,0.1)] transition-all duration-500 hover:bg-white/[0.8] hover:shadow-[0_20px_60px_rgba(166,227,233,0.15)] overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-ice-300/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                                <h2 className="text-2xl font-black text-space-900 mb-6 font-mono tracking-tight relative z-10">Trip Highlights</h2>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
                                    <div className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-coral-50/50 to-blush-50/30 border border-coral-100/50 shadow-sm hover:shadow-[0_8px_20px_rgba(255,148,148,0.1)] transition-all duration-300 hover:-translate-y-1">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral-100 to-blush-100 flex items-center justify-center shrink-0 border border-coral-200/50">
                                            <CloudSun size={24} className="text-coral-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-mono uppercase font-bold text-coral-400 tracking-wider mb-1">Best Season</p>
                                            <p className="text-sm font-semibold text-space-800">
                                                {placeData.season ? placeData.season.join(', ') : 'Year-round'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-ice-50/50 to-white border border-ice-100/50 shadow-sm hover:shadow-[0_8px_20px_rgba(166,227,233,0.1)] transition-all duration-300 hover:-translate-y-1">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ice-100 to-ice-50 flex items-center justify-center shrink-0 border border-ice-200/50">
                                            <Calendar size={24} className="text-ice-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-mono uppercase font-bold text-ice-500 tracking-wider mb-1">Ideal Duration</p>
                                            <p className="text-sm font-semibold text-space-800">
                                                {placeData.trip_duration ? `${placeData.trip_duration} Days` : '3-5 Days'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Tags Section */}
                                <div className="mt-10 relative z-10">
                                    <h3 className="text-xs uppercase font-mono font-bold text-space-400 tracking-[0.2em] mb-4 flex items-center gap-2">
                                        <Tag size={12} /> Vibes & Categories
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {placeData.tags && placeData.tags.map((tag, i) => (
                                            <span key={i} className="px-4 py-2 bg-ice-50 hover:bg-ice-100 text-space-700 text-xs font-bold tracking-wide rounded-full border border-ice-200 transition-colors cursor-default">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* AI Trip Planner Section */}
                            <div className="relative rounded-3xl border border-white/40 bg-white/[0.6] backdrop-blur-xl p-8 sm:p-10 shadow-[0_8px_32px_rgba(255,148,148,0.05)] transition-all duration-500 hover:bg-white/[0.8] hover:shadow-[0_20px_60px_rgba(255,148,148,0.1)] overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-coral-300/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral-400/20 to-blush-400/20 flex items-center justify-center border border-coral-200/50">
                                            <Sparkles size={24} className="text-coral-500" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-space-900 font-mono tracking-tight">AI Trip Planner</h2>
                                            <p className="text-sm text-space-500 font-medium mt-1">Curated using your selected preferences</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsEditingPlan(!isEditingPlan)}
                                        className="text-sm font-bold text-coral-500 hover:text-coral-600 underline cursor-pointer"
                                    >
                                        {isEditingPlan ? "Save Preferences" : "Edit Preferences"}
                                    </button>
                                </div>

                                {/* Preferences Summary / Edit */}
                                {isEditingPlan ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 relative z-10">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-space-500 uppercase">Duration (Days)</label>
                                            <input type="number" name="duration" value={planParams.duration} onChange={handleParamChange} className="w-full px-4 py-2 bg-white/50 backdrop-blur-md rounded-xl border border-space-200/60 focus:outline-none focus:border-coral-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-space-500 uppercase">Budget (₹)</label>
                                            <input type="number" name="budget" value={planParams.budget} onChange={handleParamChange} className="w-full px-4 py-2 bg-white/50 backdrop-blur-md rounded-xl border border-space-200/60 focus:outline-none focus:border-coral-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-space-500 uppercase">Best For</label>
                                            <input type="text" name="best_for" value={planParams.best_for} onChange={handleParamChange} className="w-full px-4 py-2 bg-white/50 backdrop-blur-md rounded-xl border border-space-200/60 focus:outline-none focus:border-coral-400" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-space-500 uppercase">Tags</label>
                                            <input type="text" name="tags" value={planParams.tags} onChange={handleParamChange} className="w-full px-4 py-2 bg-white/50 backdrop-blur-md rounded-xl border border-space-200/60 focus:outline-none focus:border-coral-400" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap items-center gap-3 mb-8 relative z-10">
                                        <div className="flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-md rounded-xl border border-space-200/60 shadow-sm">
                                            <Clock size={14} className="text-ice-600" />
                                            <span className="text-sm font-bold text-space-700">{planParams.duration} Days</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-md rounded-xl border border-space-200/60 shadow-sm">
                                            <DollarSign size={14} className="text-coral-500" />
                                            <span className="text-sm font-bold text-space-700">₹{planParams.budget}</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-md rounded-xl border border-space-200/60 shadow-sm">
                                            <Users size={14} className="text-space-400" />
                                            <span className="text-sm font-bold text-space-700">{planParams.best_for}</span>
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-md rounded-xl border border-space-200/60 shadow-sm max-w-full">
                                            <Tag size={14} className="text-space-400 shrink-0" />
                                            <span className="text-sm font-bold text-space-700 truncate" title={planParams.tags}>{planParams.tags}</span>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleGeneratePlan}
                                    disabled={generatingPlan}
                                    className={`group relative w-full py-4 rounded-xl font-bold text-sm transition-all duration-500 flex items-center justify-center gap-2 disabled:cursor-not-allowed overflow-hidden z-10
                                    ${generatingPlan ? 'bg-space-100/60 backdrop-blur-md text-space-400 border border-space-200 text-opacity-80'
                                            : 'bg-gradient-to-r from-coral-400 via-blush-400 to-ice-400 text-white shadow-[0_8px_30px_rgba(255,148,148,0.25)] hover:shadow-[0_12px_40px_rgba(255,148,148,0.35)] hover:-translate-y-0.5'}`}
                                >
                                    {!generatingPlan && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    )}

                                    {generatingPlan ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-space-400/30 border-t-space-500 rounded-full animate-spin" />
                                            <span className="relative">Generating Magic...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={18} className="relative group-hover:rotate-12 transition-transform duration-500" />
                                            <span className="relative">Let AI Curate Your Plan</span>
                                        </>
                                    )}
                                </button>

                            </div>
                        </div>

                        {/* Sidebar / Action Column */}
                        <div className="space-y-6">
                            {/* Hotels Action Card */}
                            <div className="relative rounded-3xl border border-white/40 bg-white/[0.6] backdrop-blur-xl p-8 shadow-[0_8px_32px_rgba(166,227,233,0.1)] transition-all duration-500 hover:bg-white/[0.8] hover:shadow-[0_20px_60px_rgba(166,227,233,0.15)] overflow-hidden sticky top-24">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blush-300/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blush-50 to-coral-50 flex items-center justify-center mb-6 border border-blush-100/50">
                                    <Building size={28} className="text-coral-400" />
                                </div>
                                <h2 className="text-2xl font-bold font-mono text-space-900 mb-2 relative z-10">Ready to book?</h2>
                                <p className="text-space-500 text-sm mb-8 leading-relaxed relative z-10">
                                    Explore the finest accommodations handpicked to enhance your stay in {placeData.place || "this destination"}.
                                </p>

                                <button className="w-full py-4 rounded-xl bg-space-900 hover:bg-coral-500 text-white font-bold text-sm shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_25px_rgba(255,148,148,0.4)] transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-1 relative z-10">
                                    Show Hotels at this Place
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Related Places Section */}
                    {relatedPlaces.length > 0 && (
                        <div className="mt-24 relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-3xl font-black font-mono text-space-900 tracking-tight">Similar Destinations</h2>
                                <span className="text-sm font-bold text-coral-500 tracking-wide uppercase"></span>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                                {relatedPlaces.map((related, idx) => (
                                    <div
                                        key={related.id}
                                        onClick={() => navigate(`/places/${related.id}`)}
                                        className="group cursor-pointer bg-white/60 backdrop-blur-lg rounded-2xl overflow-hidden border border-white/60 hover:border-ice-300/50 shadow-[0_4px_20px_rgba(166,227,233,0.05)] hover:shadow-[0_15px_40px_rgba(166,227,233,0.2)] transition-all duration-300 hover:-translate-y-1"
                                    >
                                        <div className="h-32 sm:h-40 overflow-hidden relative">
                                            <div className="absolute inset-0 bg-space-900/10 z-10 group-hover:bg-transparent transition-colors duration-500" />
                                            <img
                                                src={related.image_url || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=600'}
                                                alt={related.name}
                                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-[1.5s] ease-out"
                                            />
                                            <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-space-900/80 to-transparent z-10" />

                                            <div className="absolute bottom-3 left-3 right-3 z-20">
                                                <p className="text-white font-bold font-mono tracking-tight text-sm truncate">{related.name}</p>
                                            </div>
                                        </div>
                                        <div className="p-3 sm:p-4 bg-white/40 flex items-center justify-between">
                                            <span className="text-[10px] text-space-500 uppercase font-bold font-mono tracking-wider truncate mr-2">
                                                {related.state || 'Destination'}
                                            </span>
                                            <span className="text-xs font-bold text-coral-500 bg-coral-50/80 px-2 py-0.5 rounded-md border border-coral-100/50">
                                                {related.score}% Match
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

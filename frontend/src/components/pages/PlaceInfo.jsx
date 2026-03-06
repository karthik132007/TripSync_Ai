import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Building, CloudSun, Calendar, Tag, Sparkles, DollarSign, Clock, Users, X, Bed, Coins, Star } from 'lucide-react';
import { AmbientParticles } from '../ui/AmbientParticles';
import { API_CONFIG } from '../../config/api';

export const PlaceInfo = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [placeData, setPlaceData] = useState(null);
    const [relatedPlaces, setRelatedPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // AI Planner State
    const [planData, setPlanData] = useState(null);
    const [generatingPlan, setGeneratingPlan] = useState(false);
    const [isEditingPlan, setIsEditingPlan] = useState(false);

    // Hotels State
    const [showHotelModal, setShowHotelModal] = useState(false);
    const [hotelPrefs, setHotelPrefs] = useState({
        amenities: [],
        price_per_night: 5000,
        min_rating: 3,
        distance_from_downtown: 5
    });
    const [hotels, setHotels] = useState(null);
    const [loadingHotels, setLoadingHotels] = useState(false);

    const availableAmenities = [
        '24hr_front_desk', 'air_conditioning', 'bar', 'breakfast', 'concierge',
        'garden', 'gym', 'kitchen', 'laundry', 'non_smoking', 'parking', 'pool',
        'restaurant', 'spa', 'tv', 'wifi'
    ];

    const handleAmenityToggle = (amenity) => {
        setHotelPrefs(prev => {
            const newAmenities = prev.amenities.includes(amenity)
                ? prev.amenities.filter(a => a !== amenity)
                : [...prev.amenities, amenity];
            return { ...prev, amenities: newAmenities };
        });
    };

    const fetchHotels = async () => {
        setLoadingHotels(true);
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/places/${id}/hotels`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(hotelPrefs)
            });
            const data = await response.json();
            setHotels(data.data);
        } catch (error) {
            console.error("Error fetching hotels:", error);
        } finally {
            setLoadingHotels(false);
        }
    };

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
            const res = await fetch(`${API_CONFIG.BASE_URL}/places/${id}/plan`, {
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
            setError(null);

            try {
                // Fetch main details first
                const infoRes = await fetch(`${API_CONFIG.BASE_URL}/places/${id}`);
                if (!infoRes.ok) throw new Error("Place not found");
                const infoData = await infoRes.json();
                setPlaceData(infoData.data);

                // Fetch related places separately
                try {
                    const relatedRes = await fetch(`${API_CONFIG.BASE_URL}/places/${id}/related`);
                    if (relatedRes.ok) {
                        const relatedData = await relatedRes.json();
                        setRelatedPlaces(relatedData.data || []);
                    }
                } catch (err) {
                    console.warn("Could not fetch related places", err);
                }

            } catch (error) {
                console.error("Error fetching place data:", error);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // Scroll to top on id change
        window.scrollTo(0, 0);
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fafafc] text-space-500">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-coral-200 border-t-coral-500 rounded-full animate-spin" />
                    <p className="animate-pulse tracking-wide font-medium">Loading destination details...</p>
                </div>
            </div>
        );
    }

    if (error || !placeData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fafafc] text-space-500">
                <div className="text-center space-y-4">
                    <p className="text-xl font-bold text-space-900">Oops, something went wrong.</p>
                    <p className="text-sm">{error || "Could not load place details."}</p>
                    <button onClick={() => window.location.reload()} className="px-4 py-2 bg-space-900 text-white rounded-lg text-sm font-bold">
                        Retry
                    </button>
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

                                <button onClick={() => setShowHotelModal(true)} className="w-full py-4 rounded-xl bg-space-900 hover:bg-coral-500 text-white font-bold text-sm shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_25px_rgba(255,148,148,0.4)] transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-1 relative z-10">
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


                    {/* Hotel Modal */}
                    {showHotelModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-space-950/60 backdrop-blur-sm">
                            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
                                {/* Header */}
                                <div className="p-6 border-b border-space-100 flex items-center justify-between bg-white z-10">
                                    <div>
                                        <h2 className="text-2xl font-black font-mono text-space-900">Find Hotels</h2>
                                        <p className="text-space-500 text-sm">Customize your stay in {placeData?.place}</p>
                                    </div>
                                    <button onClick={() => setShowHotelModal(false)} className="p-2 hover:bg-space-100 rounded-full transition-colors">
                                        <X size={24} className="text-space-400" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="overflow-y-auto flex-1 p-6 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Price */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-bold text-space-700 uppercase flex items-center gap-2">
                                                <Coins size={16} className="text-coral-500" />
                                                Max Price: ₹{hotelPrefs.price_per_night}
                                            </label>
                                            <input
                                                type="range"
                                                min="1000"
                                                max="50000"
                                                step="500"
                                                value={hotelPrefs.price_per_night}
                                                onChange={(e) => setHotelPrefs(prev => ({ ...prev, price_per_night: Number(e.target.value) }))}
                                                className="w-full accent-coral-500 h-2 bg-space-100 rounded-full appearance-none cursor-pointer"
                                            />
                                        </div>
                                        {/* Rating */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-bold text-space-700 uppercase flex items-center gap-2">
                                                <Star size={16} className="text-ice-500" />
                                                Min Rating: {hotelPrefs.min_rating}+
                                            </label>
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                step="0.5"
                                                value={hotelPrefs.min_rating}
                                                onChange={(e) => setHotelPrefs(prev => ({ ...prev, min_rating: Number(e.target.value) }))}
                                                className="w-full accent-ice-500 h-2 bg-space-100 rounded-full appearance-none cursor-pointer"
                                            />
                                        </div>
                                        {/* Distance */}
                                        <div className="space-y-3">
                                            <label className="text-sm font-bold text-space-700 uppercase flex items-center gap-2">
                                                <MapPin size={16} className="text-blush-500" />
                                                Max Dist: {hotelPrefs.distance_from_downtown} km
                                            </label>
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="20"
                                                step="0.5"
                                                value={hotelPrefs.distance_from_downtown}
                                                onChange={(e) => setHotelPrefs(prev => ({ ...prev, distance_from_downtown: Number(e.target.value) }))}
                                                className="w-full accent-blush-500 h-2 bg-space-100 rounded-full appearance-none cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    {/* Amenities */}
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-space-700 uppercase flex items-center gap-2">
                                            <Tag size={16} className="text-space-400" />
                                            Amenities
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {availableAmenities.map(amenity => (
                                                <button
                                                    key={amenity}
                                                    onClick={() => handleAmenityToggle(amenity)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${hotelPrefs.amenities.includes(amenity)
                                                        ? 'bg-space-900 text-white border-space-900 shadow-lg shadow-space-200'
                                                        : 'bg-white text-space-500 border-space-200 hover:border-space-300 hover:bg-space-50'
                                                        }`}
                                                >
                                                    {amenity.replace(/_/g, ' ')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            onClick={fetchHotels}
                                            disabled={loadingHotels}
                                            className="px-8 py-3 bg-gradient-to-r from-coral-500 to-blush-500 text-white font-bold rounded-xl shadow-lg shadow-coral-200 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {loadingHotels ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Searching...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles size={18} />
                                                    Find Hotels
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    {/* Results */}
                                    {hotels && (
                                        <div className="space-y-4 pt-4 border-t border-space-100">
                                            <h3 className="text-lg font-bold text-space-900">Found {hotels.length} Hotels</h3>
                                            <div className="grid grid-cols-1 gap-4">
                                                {hotels.map((hotel, idx) => (
                                                    <div key={idx} className="flex gap-4 p-4 rounded-xl border border-space-100 bg-space-50/50 hover:bg-white hover:shadow-md transition-all">
                                                        <div className="w-24 h-24 bg-space-200 rounded-lg shrink-0 overflow-hidden relative">
                                                            <img
                                                                src={`https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=200&h=200&random=${idx}`}
                                                                alt={hotel.hotel_name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.src = 'https://placehold.co/200x200/e2e8f0/64748b?text=Hotel';
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start">
                                                                <h4 className="font-bold text-space-900 truncate pr-2" title={hotel.hotel_name}>
                                                                    {hotel.hotel_name}
                                                                </h4>
                                                                <span className="text-xs font-bold px-2 py-1 bg-ice-100 text-ice-700 rounded-lg flex items-center gap-1 shrink-0">
                                                                    <Star size={12} /> {hotel.rating}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-space-500 mt-1 flex items-center gap-1">
                                                                <MapPin size={12} />
                                                                {hotel.distance_from_downtown_km}km from center
                                                            </p>
                                                            <div className="flex flex-wrap gap-1 mt-2">
                                                                {(hotel.amenities || hotel.aminities || []).slice(0, 3).map(a => (
                                                                    <span key={a} className="text-[10px] px-1.5 py-0.5 bg-white border border-space-100 rounded text-space-400 capitalize">
                                                                        {a.replace(/_/g, ' ')}
                                                                    </span>
                                                                ))}
                                                                {(hotel.amenities || hotel.aminities || []).length > 3 && (
                                                                    <span className="text-[10px] px-1.5 py-0.5 text-space-400">
                                                                        +{(hotel.amenities || hotel.aminities).length - 3} more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right self-end flex flex-col items-end gap-2 shrink-0">
                                                            <div className="text-right">
                                                                <div className="text-lg font-black text-coral-500">
                                                                    ₹{hotel.price_per_night || hotel.price_per_nigh}
                                                                </div>
                                                                <div className="text-[10px] text-space-400 uppercase font-bold">per night</div>
                                                            </div>

                                                            {hotel.hotel_link && (
                                                                <a
                                                                    href={hotel.hotel_link}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="px-3 py-1.5 bg-space-900 hover:bg-coral-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
                                                                >
                                                                    View Deal
                                                                    <ArrowLeft size={10} className="rotate-180" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                                {hotels.length === 0 && (
                                                    <p className="text-center text-space-400 py-8">No hotels found matching your criteria.</p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Heart, Sparkles, RefreshCw, SlidersHorizontal } from 'lucide-react';

const RecommendationCard = ({ place, index, delay = 0, navigate }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [liked, setLiked] = useState(false);
    const cardRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.1 }
        );
        if (cardRef.current) observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, []);

    const imageUrl = place.image_url || null;

    // Generate a match percentage based on index (higher rank = higher match)
    const matchPercent = Math.max(82, 98 - index * 2);
    const badgeColor = matchPercent >= 95 ? 'bg-ice-500' : matchPercent >= 90 ? 'bg-ice-400' : matchPercent >= 85 ? 'bg-emerald-500' : 'bg-amber-500';

    return (
        <div
            ref={cardRef}
            className={`group relative flex flex-col rounded-2xl bg-white overflow-hidden border border-space-100/60 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_48px_rgba(54,185,255,0.12)] hover:border-ice-200/50 transition-all duration-700 hover:-translate-y-1.5 cursor-pointer
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
            style={{ transitionDelay: `${delay}ms` }}
            onClick={() => {
                if (place.id) navigate(`/places/${place.id}`);
            }}
        >
            {/* Image */}
            <div className="relative h-48 overflow-hidden" style={!imageUrl ? { background: 'linear-gradient(135deg, #0F1115 0%, #1a2332 40%, #A6E3E9 100%)' } : undefined}>
                {imageUrl && (
                <img
                    src={imageUrl}
                    alt={place.name || place.place}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                />)}

                {/* Match badge */}
                <div className={`absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full ${badgeColor} text-white text-xs font-bold shadow-md`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                    {matchPercent}% Match
                </div>

                {/* Heart button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setLiked(!liked);
                    }}
                    className={`absolute top-3 right-3 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer
                        ${liked
                            ? 'bg-pink-500 text-white shadow-lg shadow-pink-400/30'
                            : 'bg-white/80 backdrop-blur-sm text-space-400 hover:text-pink-500 hover:bg-white shadow-sm'
                        }`}
                >
                    <Heart size={14} className={liked ? 'fill-white' : ''} />
                </button>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 flex flex-col">
                {/* Name */}
                <h3 className="text-[15px] font-bold text-space-800 leading-snug line-clamp-2 mb-1.5">
                    {place.place || place.name}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-1 mb-3">
                    <MapPin size={12} className="text-space-400" />
                    <span className="text-xs text-space-500">
                        {place.state || place.country || 'Scenic Destination'}
                    </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mt-auto">
                    {place.tags && place.tags.slice(0, 3).map((tag, i) => (
                        <span
                            key={i}
                            className="px-2.5 py-1 bg-space-50 text-space-600 text-[11px] font-medium rounded-md border border-space-100/50"
                        >
                            {tag.charAt(0).toUpperCase() + tag.slice(1)}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export const Recommend = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [showCount, setShowCount] = useState(12);

    const recommendations = location.state?.recommendations || [];

    useEffect(() => {
        if (!location.state?.recommendations) {
            navigate('/plan', { replace: true });
        }
    }, [location.state, navigate]);

    if (!recommendations.length) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white text-space-500">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-ice-200 border-t-ice-500 rounded-full animate-spin" />
                    <p className="animate-pulse">Preparing your personal recommendations...</p>
                </div>
            </div>
        );
    }

    // Get user preferences from localStorage for display
    const prefs = (() => {
        try {
            return JSON.parse(localStorage.getItem('tripPreferences') || '{}');
        } catch { return {}; }
    })();

    const prefTags = prefs.tags?.slice(0, 3) || [];
    const displayed = recommendations.slice(0, showCount);

    return (
        <div className="min-h-screen bg-space-50 relative overflow-hidden pb-20">

            {/* Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-ice-100/30 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-100/20 rounded-full blur-[100px] translate-y-1/4 -translate-x-1/4" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">

                {/* Header */}
                <div className="mb-12">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-ice-50 border border-ice-200/50 text-ice-600 text-xs font-bold tracking-wider uppercase mb-5">
                        <Sparkles size={13} className="fill-ice-400" />
                        <span>AI Curated</span>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                        <div>
                            <h1 className="text-4xl sm:text-5xl font-black text-space-800 tracking-tight mb-3">
                                Your Top {recommendations.length} Matches
                            </h1>
                            <p className="text-base text-space-500 font-light max-w-lg">
                                Curated just for you based on your preferences
                                {prefTags.length > 0 && (
                                    <> for <span className="text-ice-500 font-medium">{prefTags[0]}</span>
                                    {prefTags[1] && <>, <span className="text-ice-500 font-medium">{prefTags[1]}</span></>}
                                    {prefTags[2] && <>, and <span className="text-pink-500 font-medium">{prefTags[2]}</span></>}.</>
                                )}
                            </p>
                        </div>

                        {/* Filter buttons */}
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={() => navigate('/plan')}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-space-200/60 text-space-600 text-sm font-medium hover:border-ice-300 hover:text-ice-600 transition-all duration-300 cursor-pointer"
                            >
                                <SlidersHorizontal size={14} />
                                Adjust Filters
                            </button>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {displayed.map((place, index) => (
                        <RecommendationCard
                            key={place.id || index}
                            place={place}
                            index={index}
                            delay={(index % 4) * 80}
                            navigate={navigate}
                        />
                    ))}
                </div>

                {/* Load More */}
                {showCount < recommendations.length && (
                    <div className="mt-12 text-center">
                        <button
                            onClick={() => setShowCount(showCount + 8)}
                            className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-white border border-space-200/60 text-space-700 text-sm font-semibold hover:border-ice-300 hover:text-ice-600 hover:shadow-[0_4px_20px_rgba(54,185,255,0.1)] transition-all duration-300 cursor-pointer"
                        >
                            Load More Results
                            <RefreshCw size={15} className="text-ice-500" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

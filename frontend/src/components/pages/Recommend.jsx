import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, Compass, Info, CloudSun, Calendar } from 'lucide-react';

const RecommendationCard = ({ place, index, delay = 0, navigate }) => {
    const [isVisible, setIsVisible] = useState(false);
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

    // Pool of beautiful travel placeholders to avoid repetition if Unsplash API fails/rate-limits
    const fallbacks = [
        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800', // Desert road
        'https://images.unsplash.com/photo-1501785888041-af3ef285b470', // Lake/Mountains
        'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1', // Lake/Forest
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb', // Valley
        'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee', // Forest path
        'https://images.unsplash.com/photo-1470770841072-f978cf4d019e', // Village/Mountains
        'https://images.unsplash.com/photo-1530789253388-582c481c54b0', // Airplane/Clouds
        'https://images.unsplash.com/photo-1519681393784-d120267933ba', // Snowy peaks
        'https://images.unsplash.com/photo-1533105079780-92b9be482077', // Santorini
        'https://images.unsplash.com/photo-1493246507139-91e8bef99c02', // Northern Lights
        'https://images.unsplash.com/photo-1501594907352-04cda38ebc29', // Beach
        'https://images.unsplash.com/photo-1440778303588-435521a205bc'  // Tropical
    ];

    const imageUrl = place.image_url || `${fallbacks[index % fallbacks.length]}?auto=format&fit=crop&q=80&w=1000`;

    return (
        <div
            ref={cardRef}
            className={`group relative flex flex-col rounded-[2rem] bg-white overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-ice-100/50 hover:border-ice-300/50 transition-all duration-[800ms] ease-out hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(166,227,233,0.15)]
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {/* Rank Badge */}
            <div className="absolute top-5 left-5 z-20 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center font-mono font-bold text-space-800 shadow-lg border border-white/20">
                #{index + 1}
            </div>

            {/* Image Section */}
            <div className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-space-900/10 z-10 group-hover:bg-transparent transition-colors duration-500" />
                <img
                    src={imageUrl}
                    alt={place.name}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-[1.5s] ease-out"
                />

                {/* Gradient Overlay for Text Visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-space-900/80 via-space-900/20 to-transparent z-10" />

                {/* Title overlay on image for a modern look */}
                <div className="absolute bottom-6 left-6 right-6 z-20">
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin size={16} className="text-coral-300" />
                        <span className="text-white/90 text-sm font-medium tracking-wide uppercase">
                            {place.country || 'Destination'}
                        </span>
                    </div>
                    <h3 className="text-3xl font-black text-white tracking-tight">
                        {place.place || place.name}
                    </h3>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-6 sm:p-8 flex-1 flex flex-col bg-white relative">
                {/* Tags / Categories */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {place.tags && place.tags.slice(0, 4).map((cat, i) => (
                        <span key={i} className="px-3 py-1 bg-ice-50 text-space-600 text-[11px] font-bold tracking-wide uppercase rounded-full border border-ice-100/50">
                            {cat}
                        </span>
                    ))}
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8 mt-auto">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center shrink-0">
                            <CloudSun size={16} className="text-orange-400" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-space-400 tracking-wider mb-1">Best Time</p>
                            <p className="text-xs font-medium text-space-700">
                                {place.season ? place.season.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ') : 'Year round'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <Calendar size={16} className="text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold text-space-400 tracking-wider mb-1">Duration</p>
                            <p className="text-xs font-medium text-space-700">
                                {place.trip_duration ? `${place.trip_duration} Days` : '3-5 Days'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* View More Button */}
                <button
                    onClick={() => {
                        if (place.id) {
                            navigate(`/places/${place.id}`);
                        } else {
                            console.log('No ID found for:', place.name);
                        }
                    }}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-space-900 to-space-800 hover:from-coral-500 hover:to-blush-500 text-white font-bold text-sm shadow-[0_4px_14px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_25px_rgba(255,148,148,0.4)] transition-all duration-500 flex items-center justify-center gap-2 group/btn cursor-pointer relative overflow-hidden transform hover:-translate-y-0.5"
                >
                    <span className="relative z-10 tracking-wide">View Full Guide</span>
                    <ArrowLeft size={16} className="relative z-10 rotate-180 group-hover/btn:translate-x-1.5 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export const Recommend = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Fallback to empty array if no state is passed
    const recommendations = location.state?.recommendations || [];

    // Redirect back to plan if accessed directly without data
    useEffect(() => {
        if (!location.state?.recommendations) {
            navigate('/plan', { replace: true });
        }
    }, [location.state, navigate]);

    if (!recommendations.length) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white text-space-500">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-coral-200 border-t-coral-500 rounded-full animate-spin" />
                    <p className="animate-pulse">Preparing your personal recommendations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafc] relative overflow-hidden pb-32">

            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-ice-100/30 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blush-100/30 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3" />
            </div>

            <div className="relative z-10 max-w-[1400px] mx-auto px-6 sm:px-10 lg:px-16 pt-28">

                {/* Header */}
                <div className="mb-20">
                    <button
                        onClick={() => navigate('/plan')}
                        className="group inline-flex items-center gap-2 text-space-400 hover:text-coral-500 transition-colors duration-200 mb-12 cursor-pointer"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-200" />
                        <span className="text-sm font-medium tracking-wide">Adjust Preferences</span>
                    </button>

                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ice-100/50 border border-ice-200 text-ice-600 text-xs font-bold tracking-widest uppercase mb-6">
                            <Star size={12} className="fill-current" />
                            <span>Your Curated Itinerary</span>
                        </div>
                        <h1 className="text-5xl sm:text-6xl font-black text-space-900 tracking-tight leading-[1.1] mb-6">
                            Top {recommendations.length} Destinations<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral-400 via-blush-500 to-ice-500">
                                Crafted For You
                            </span>
                        </h1>
                        <p className="text-lg text-space-500 leading-relaxed">
                            Based on your unique preferences, our AI engine has analyzed thousands of data points to find these perfect alignments for your next journey.
                        </p>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {/* Make top 2 results larger/featured by spanning columns if desired, but standard grid is usually cleaner */}
                    {recommendations.map((place, index) => (
                        <RecommendationCard
                            key={place.id || index}
                            place={place}
                            index={index}
                            delay={index % 4 * 100} // Staggered entrance animation
                            navigate={navigate}
                        />
                    ))}
                </div>

            </div>
        </div>
    );
};

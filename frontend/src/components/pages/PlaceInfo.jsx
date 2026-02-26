import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Building, CloudSun, Calendar, Tag } from 'lucide-react';

export const PlaceInfo = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [placeData, setPlaceData] = useState(null);
    const [relatedPlaces, setRelatedPlaces] = useState([]);
    const [loading, setLoading] = useState(true);

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
        <div className="min-h-screen bg-[#fafafc] pb-24 font-sans text-space-900 selection:bg-ice-300/40 selection:text-space-900">

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
                        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-ice-100/50">
                            <h2 className="text-2xl font-black text-space-900 mb-6">Trip Highlights</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-orange-50/50 border border-orange-100/50">
                                    <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                                        <CloudSun size={24} className="text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase font-bold text-space-400 tracking-wider mb-1">Best Season</p>
                                        <p className="text-sm font-semibold text-space-800">
                                            {placeData.season ? placeData.season.join(', ') : 'Year-round'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50">
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                                        <Calendar size={24} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase font-bold text-space-400 tracking-wider mb-1">Ideal Duration</p>
                                        <p className="text-sm font-semibold text-space-800">
                                            {placeData.trip_duration ? `${placeData.trip_duration} Days` : '3-5 Days'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Tags Section */}
                            <div className="mt-8">
                                <h3 className="text-sm uppercase font-bold text-space-400 tracking-widest mb-4 flex items-center gap-2">
                                    <Tag size={14} /> Vibes & Categories
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
                    </div>

                    {/* Sidebar / Action Column */}
                    <div className="space-y-6">
                        {/* Hotels Action Card */}
                        <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-ice-100/50 sticky top-24">
                            <div className="w-14 h-14 rounded-2xl bg-blush-50 flex items-center justify-center mb-6">
                                <Building size={28} className="text-coral-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-space-900 mb-2">Ready to book?</h2>
                            <p className="text-space-500 text-sm mb-8 leading-relaxed">
                                Explore the finest accommodations handpicked to enhance your stay in {placeData.place || "this destination"}.
                            </p>

                            <button className="w-full py-4 rounded-xl bg-space-900 hover:bg-coral-500 text-white font-bold text-sm shadow-[0_8px_20px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_25px_rgba(255,148,148,0.4)] transition-all duration-300 flex items-center justify-center gap-2 hover:-translate-y-1">
                                Show Hotels at this Place
                            </button>
                        </div>
                    </div>
                </div>

                {/* Related Places Section */}
                {relatedPlaces.length > 0 && (
                    <div className="mt-24">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-3xl font-black text-space-900 tracking-tight">Similar Destinations</h2>
                            <span className="text-sm font-bold text-coral-500 tracking-wide uppercase">AI Curated</span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                            {relatedPlaces.map((related, idx) => (
                                <div
                                    key={related.id}
                                    onClick={() => navigate(`/places/${related.id}`)}
                                    className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-ice-100/50 hover:border-ice-300/50 shadow-sm hover:shadow-[0_15px_40px_rgba(166,227,233,0.2)] transition-all duration-300 hover:-translate-y-1"
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
                                            <p className="text-white font-bold text-sm truncate">{related.name}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 sm:p-4 bg-white flex items-center justify-between">
                                        <span className="text-[10px] text-space-400 uppercase font-bold tracking-wider truncate mr-2">
                                            {related.state || 'Destination'}
                                        </span>
                                        <span className="text-xs font-bold text-coral-500 bg-coral-50 px-2 py-0.5 rounded-md">
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
    );
};

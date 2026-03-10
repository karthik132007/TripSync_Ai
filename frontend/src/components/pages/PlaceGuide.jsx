import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getPlaceDetailsUrl, getPlaceRelatedUrl } from '../../config/api';
import { Loader } from '../ui/Loader';

const GRADIENT_PLACEHOLDER = 'linear-gradient(135deg, #0F1115 0%, #1a2332 40%, #A6E3E9 100%)';

const InfoCard = ({ icon: Icon, title, value, accent = 'text-ice-600' }) => (
    <div className="rounded-2xl border border-ice-100/70 bg-ice-50/40 p-5 shadow-[0_8px_24px_rgba(15,17,21,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,17,21,0.08)]">
        <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-ice-100 flex items-center justify-center">
                <Icon size={16} className={accent} />
            </div>
            <p className="text-[11px] uppercase font-bold tracking-widest text-space-500">{title}</p>
        </div>
        <p className="text-space-800 text-sm sm:text-base font-semibold leading-relaxed">{value || 'N/A'}</p>
    </div>
);

const TagPill = ({ tag }) => (
    <span className="px-3.5 py-1.5 rounded-full border border-ice-200 bg-white text-space-700 text-[11px] font-bold uppercase tracking-wide transition-all duration-300 hover:border-coral-300 hover:bg-coral-50 hover:text-coral-600">
        {tag}
    </span>
);

const RelatedPlaceCard = ({ item, onClick }) => (
    <button
        onClick={onClick}
        className="group text-left rounded-2xl border border-ice-100/80 bg-white overflow-hidden shadow-[0_10px_26px_rgba(15,17,21,0.05)] transition-all duration-500 hover:-translate-y-1.5 hover:border-coral-200 hover:shadow-[0_16px_40px_rgba(15,17,21,0.12)] cursor-pointer"
    >
        <div className="relative h-28 overflow-hidden" style={!item.thumbnail_image_url ? { background: GRADIENT_PLACEHOLDER } : undefined}>
            {item.thumbnail_image_url && (
            <img
                src={item.thumbnail_image_url}
                alt={item.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />)}
            <div className="absolute inset-0 bg-gradient-to-t from-space-900/60 to-transparent" />
        </div>
        <div className="p-4">
            <h3 className="text-space-900 font-bold text-base leading-tight">{item.name}</h3>
            <p className="text-xs text-space-500 mt-1">Match score {Math.round(item.score)}%</p>
        </div>
    </button>
);

export const PlaceGuide = () => {
    const { placeId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [place, setPlace] = useState(location.state?.place || null);
    const [relatedPlaces, setRelatedPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const recommendationThumb = location.state?.place?.image_url || '';

    useEffect(() => {
        const loadPlaceData = async () => {
            setLoading(true);
            setError('');

            try {
                const [placeRes, relatedRes] = await Promise.all([
                    fetch(getPlaceDetailsUrl(placeId, { excludeImageUrl: recommendationThumb })),
                    fetch(getPlaceRelatedUrl(placeId)),
                ]);

                if (!placeRes.ok) throw new Error('Could not load place details');

                const placeJson = await placeRes.json();
                const relatedJson = relatedRes.ok ? await relatedRes.json() : { data: [] };

                setPlace(placeJson?.data || null);
                setRelatedPlaces(relatedJson?.data || []);
            } catch (err) {
                setError(err.message || 'Something went wrong');
            } finally {
                setLoading(false);
            }
        };

        if (placeId) loadPlaceData();
    }, [placeId, recommendationThumb]);

    const seasonLabel = useMemo(() => {
        if (!Array.isArray(place?.season) || place.season.length === 0) return 'Year round';
        return place.season.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');
    }, [place]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <Loader size="lg" />
            </div>
        );
    }

    if (error || !place) {
        return (
            <div className="min-h-screen bg-space-50 pt-28 px-6 sm:px-10 lg:px-16">
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center gap-2 text-space-500 hover:text-coral-500 transition-colors"
                >
                    <ArrowLeft size={16} />
                    <span className="text-sm font-medium">Back</span>
                </button>
                <p className="mt-6 text-red-500">{error || 'Place not found'}</p>
            </div>
        );
    }

    const heroImage = place.hero_image_url || place.image_url || null;

    return (
        <div className="min-h-screen bg-[#fafafc] pb-20">
            <section className="relative h-[350px] md:h-[420px] overflow-hidden animate-fade-in" style={!heroImage ? { background: GRADIENT_PLACEHOLDER } : undefined}>
                {heroImage && (
                <img
                    src={heroImage}
                    alt={place.place || place.name}
                    className="w-full h-full object-cover"
                />)}
                <div className="absolute inset-0 bg-gradient-to-t from-space-950/90 via-space-900/45 to-space-900/20" />

                <div className="absolute top-24 left-6 sm:left-10 lg:left-16 z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-white/85 backdrop-blur-sm text-space-700 hover:text-coral-500 transition-colors shadow-sm"
                    >
                        <ArrowLeft size={15} />
                        <span className="text-xs font-medium tracking-wide">Back</span>
                    </button>
                </div>

                <div className="absolute bottom-8 left-6 right-6 sm:left-10 sm:right-10 lg:left-16 lg:right-16 z-10 animate-fade-in-up">
                    <div className="max-w-4xl">
                        <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-white/90 text-[11px] uppercase tracking-widest font-bold mb-4">
                            <Sparkles size={12} />
                            Destination Guide
                        </p>
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
                            {place.place || place.name}
                        </h1>
                        <p className="mt-2 text-base sm:text-lg text-white/80">{place.country || 'Unknown country'}</p>
                    </div>
                </div>
            </section>

            <section className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 pt-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
                    <div className="space-y-4">
                        <InfoCard icon={CalendarDays} title="Best Season" value={seasonLabel} accent="text-coral-500" />
                        <InfoCard
                            icon={CloudSun}
                            title="Trip Duration"
                            value={place.trip_duration ? `${place.trip_duration} days` : 'N/A'}
                            accent="text-ice-600"
                        />
                        <InfoCard icon={CloudSun} title="Climate" value={place.climate || 'N/A'} accent="text-ice-700" />
                        <InfoCard
                            icon={Coins}
                            title="Estimated Cost / Day"
                            value={place.avg_cost_per_day ? `INR ${place.avg_cost_per_day}` : 'N/A'}
                            accent="text-coral-500"
                        />
                    </div>

                    <div className="rounded-[1.7rem] border border-ice-100/80 bg-white p-6 sm:p-7 shadow-[0_10px_30px_rgba(15,17,21,0.05)]">
                        <h2 className="text-xl sm:text-2xl font-black text-space-900 mb-4">Travel Tags</h2>
                        <p className="text-sm text-space-500 mb-5 leading-relaxed">
                            Quick glimpse of what this destination is best known for.
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                            {(place.tags || []).map((tag) => (
                                <TagPill key={tag} tag={tag} />
                            ))}
                            {(!place.tags || place.tags.length === 0) && (
                                <p className="text-sm text-space-500">No tags available</p>
                            )}
                        </div>

                        <div className="mt-10 pt-8 border-t border-space-100">
                            <button className="w-full rounded-2xl py-4 px-5 font-bold text-white bg-gradient-to-r from-space-900 to-space-800 hover:from-coral-500 hover:to-blush-500 transition-all duration-500 shadow-[0_10px_28px_rgba(15,17,21,0.2)] hover:-translate-y-0.5 cursor-pointer">
                                Show Hotels in This Place
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-14">
                    <h2 className="text-2xl sm:text-3xl font-black text-space-900 mb-2">Related Places</h2>
                    <p className="text-space-500 text-sm mb-6">Explore destinations with similar vibe and preferences.</p>

                    {relatedPlaces.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                            {relatedPlaces.map((item) => (
                                <RelatedPlaceCard
                                    key={item.id}
                                    item={item}
                                    onClick={() => navigate(`/place/${item.id}`)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-ice-100 bg-white p-5 text-space-500 text-sm">
                            No related places available right now.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

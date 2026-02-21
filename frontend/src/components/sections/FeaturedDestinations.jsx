import React from 'react';
import { MapPin, Star, ArrowRight, Compass } from 'lucide-react';
import { Button } from '../ui/Button';
import { useScrollReveal, useParallax } from '../../hooks/useScrollAnimations';

const DestinationCard = ({ dest, index }) => {
    const { ref, isVisible } = useScrollReveal({ threshold: 0.1 });

    return (
        <div
            ref={ref}
            style={{
                transitionDelay: `${(index % 3) * 120}ms`,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(50px) scale(0.97)',
            }}
            className="group rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm border border-ice-100/40 shadow-[0_2px_16px_#a6e3e908] hover:shadow-[0_20px_60px_-10px_#a6e3e925] transition-all duration-700 hover:-translate-y-2 flex flex-col card-shine"
        >
            {/* Image */}
            <div className="relative h-56 overflow-hidden">
                <img
                    src={dest.image}
                    alt={dest.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-space-900/60 via-space-900/15 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

                {/* Rating badge */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-sm font-bold text-space-900 shadow-sm">
                    <Star size={13} className="text-coral-400 fill-coral-400" />
                    {dest.rating}
                </div>

                {/* Title overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-md flex items-center gap-2">
                        <MapPin size={18} className="text-ice-300" />
                        {dest.title}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {dest.tags.map((tag, i) => (
                            <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-white/90 border border-white/20">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col">
                <p className="text-space-500 leading-relaxed mb-5 flex-1 text-[15px]">
                    {dest.description}
                </p>
                <button className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-space-100 text-space-500 hover:border-ice-300 hover:text-ice-700 hover:bg-ice-50/50 transition-all duration-300 font-medium text-sm group/btn">
                    <span>Explore Itinerary</span>
                    <ArrowRight size={15} className="text-ice-500 group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>
        </div>
    );
};

export const FeaturedDestinations = () => {
    const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
    const { ref: parallaxRef, offset } = useParallax(0.08);

    const destinations = [
        {
            id: 1,
            title: "Kyoto, Japan",
            image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=1000&auto=format&fit=crop",
            tags: ["Culture", "Temples", "Food"],
            rating: 4.9,
            description: "Experience the magic of ancient temples, serene gardens, and traditional tea houses."
        },
        {
            id: 2,
            title: "Amalfi Coast, Italy",
            image: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=1000&auto=format&fit=crop",
            tags: ["Romance", "Views", "Cuisine"],
            rating: 4.8,
            description: "Dramatic cliffs, pastel-colored villages, and the sparkling Mediterranean Sea."
        },
        {
            id: 3,
            title: "Bali, Indonesia",
            image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1000&auto=format&fit=crop",
            tags: ["Nature", "Wellness", "Beaches"],
            rating: 4.7,
            description: "Lush rice terraces, vibrant culture, and world-class surfing spots."
        },
        {
            id: 4,
            title: "Santorini, Greece",
            image: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?q=80&w=1000&auto=format&fit=crop",
            tags: ["Sunsets", "Architecture", "Relaxation"],
            rating: 4.9,
            description: "Iconic blue domes, stunning sunsets, and crystal-clear Aegean waters."
        },
        {
            id: 5,
            title: "Banff, Canada",
            image: "https://images.unsplash.com/photo-1503614472-8c93d56e92ce?q=80&w=1000&auto=format&fit=crop",
            tags: ["Adventure", "Mountains", "Wildlife"],
            rating: 4.8,
            description: "Turquoise glacial lakes, majestic peaks, and endless outdoor adventures."
        },
        {
            id: 6,
            title: "Marrakech, Morocco",
            image: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?q=80&w=1000&auto=format&fit=crop",
            tags: ["History", "Markets", "Architecture"],
            rating: 4.6,
            description: "Bustling souks, intricate palaces, and vibrant colors at every turn."
        }
    ];

    return (
        <section id="destinations" className="py-28 md:py-36 bg-white relative overflow-hidden">
            {/* Parallax background */}
            <div
                ref={parallaxRef}
                className="absolute inset-0 pointer-events-none"
                style={{ transform: `translateY(${offset * 0.5}px)`, willChange: 'transform' }}
            >
                <div className="absolute -top-20 right-0 w-[400px] h-[400px] bg-ice-200 rounded-full opacity-25 blur-[130px]" />
                <div className="absolute -bottom-20 left-0 w-[350px] h-[350px] bg-blush-200 rounded-full opacity-20 blur-[110px]" />
                <div className="absolute top-1/3 -left-20 w-[250px] h-[250px] bg-coral-200 rounded-full opacity-10 blur-[100px]" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div
                    ref={headerRef}
                    className="flex flex-col md:flex-row justify-between items-start md:items-end mb-14 gap-6 transition-all duration-700"
                    style={{
                        opacity: headerVisible ? 1 : 0,
                        transform: headerVisible ? 'translateY(0)' : 'translateY(30px)',
                    }}
                >
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ice-50/80 border border-ice-200/40 text-ice-700 text-xs font-mono tracking-widest uppercase mb-5 shadow-sm">
                            <Compass size={14} />
                            <span>Curated For You</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-space-800 mb-4 tracking-tight">
                            Trending Destinations
                        </h2>
                        <p className="text-lg text-space-500 font-light leading-relaxed">
                            Explore handpicked locations that match your unique travel style. Let AI uncover places you never knew you wanted to visit.
                        </p>
                    </div>
                    <Button variant="outline" className="shrink-0 group rounded-full">
                        View All <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {destinations.map((dest, index) => (
                        <DestinationCard key={dest.id} dest={dest} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
};

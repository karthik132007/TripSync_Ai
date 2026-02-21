import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Palette, Heart, Compass, Zap } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollAnimations';

// Animated counter that counts up when visible
const AnimatedCounter = ({ end, suffix = '', duration = 2000 }) => {
    const [count, setCount] = useState(0);
    const [started, setStarted] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started) {
                    setStarted(true);
                }
            },
            { threshold: 0.5 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [started]);

    useEffect(() => {
        if (!started) return;

        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [started, end, duration]);

    return (
        <span ref={ref} className="tabular-nums">
            {count.toLocaleString()}{suffix}
        </span>
    );
};

const stats = [
    {
        value: 1600,
        suffix: '+',
        label: 'Places Waiting for You',
        icon: <MapPin size={22} />,
        color: 'text-ice-500',
        glow: 'from-ice-300/20 to-transparent',
        border: 'hover:border-ice-200',
    },
    {
        value: 30,
        suffix: '+',
        label: 'Ways to Define Your Vibe',
        icon: <Palette size={22} />,
        color: 'text-coral-400',
        glow: 'from-coral-300/20 to-transparent',
        border: 'hover:border-coral-200',
    },
    {
        value: null,
        emoji: '✨',
        label: '"Wait… This Is Perfect" Moments',
        sublabel: 'Countless',
        icon: <Heart size={22} />,
        color: 'text-blush-500',
        glow: 'from-blush-300/20 to-transparent',
        border: 'hover:border-blush-200',
    },
    {
        value: null,
        emoji: '🧭',
        label: 'Built for the Indecisive Explorer',
        sublabel: '100%',
        icon: <Compass size={22} />,
        color: 'text-ice-600',
        glow: 'from-ice-400/20 to-transparent',
        border: 'hover:border-ice-200',
    },
];

export const Stats = () => {
    const { ref: sectionRef, isVisible } = useScrollReveal({ threshold: 0.1 });

    return (
        <section className="py-20 md:py-28 bg-white relative overflow-hidden">
            {/* Background accents */}
            <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-ice-200 rounded-full opacity-15 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[250px] h-[250px] bg-coral-200 rounded-full opacity-10 blur-[100px] pointer-events-none" />

            <div ref={sectionRef} className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className={`group relative p-7 rounded-2xl bg-white/80 backdrop-blur-sm border border-space-100/50 ${stat.border} transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_16px_48px_-8px_#a6e3e920] text-center`}
                            style={{
                                transitionDelay: `${index * 100}ms`,
                                opacity: isVisible ? 1 : 0,
                                transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
                            }}
                        >
                            {/* Glow on hover */}
                            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${stat.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                            {/* Icon */}
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-space-50 border border-space-100/50 ${stat.color} mb-5 group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                                {stat.icon}
                            </div>

                            {/* Value */}
                            <div className="relative z-10">
                                {stat.value !== null ? (
                                    <div className="text-4xl md:text-5xl font-black text-space-800 mb-2 tracking-tight">
                                        <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                                    </div>
                                ) : (
                                    <div className="text-3xl md:text-4xl font-black text-space-800 mb-2 tracking-tight">
                                        {stat.sublabel}
                                    </div>
                                )}
                                <p className="text-space-500 text-sm font-medium leading-snug">
                                    {stat.label}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tagline */}
                <div
                    className="mt-12 text-center transition-all duration-700"
                    style={{
                        transitionDelay: '500ms',
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    }}
                >
                    <p className="inline-flex items-center gap-2.5 text-space-400 font-mono text-sm tracking-wide">
                        <Zap size={14} className="text-ice-500" />
                        <span>Powered by Data. Guided by Wanderlust.</span>
                        <Zap size={14} className="text-coral-400" />
                    </p>
                </div>
            </div>
        </section>
    );
};

import React from 'react';
import { MessageSquareHeart, Map, PlaneTakeoff, Sparkles } from 'lucide-react';
import { useScrollReveal, useParallax } from '../../hooks/useScrollAnimations';

const StepCard = ({ step, index }) => {
    const { ref, isVisible } = useScrollReveal({ threshold: 0.2 });

    return (
        <div
            ref={ref}
            style={{
                transitionDelay: `${index * 150}ms`,
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
            }}
            className="group relative p-8 rounded-2xl bg-white/80 backdrop-blur-sm border border-ice-100/50 transition-all duration-700 hover:-translate-y-2 hover:shadow-[0_20px_60px_-10px_#a6e3e925] hover:border-ice-200/60"
        >
            {/* Step number */}
            <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white border border-space-100 shadow-sm flex items-center justify-center font-mono text-xs text-space-400 group-hover:text-ice-600 group-hover:border-ice-200 transition-all duration-300">
                {String(index + 1).padStart(2, '0')}
            </div>

            {/* Gradient accent line */}
            <div className={`h-0.5 w-12 rounded-full bg-gradient-to-r ${step.accent} mb-8 group-hover:w-20 transition-all duration-500`} />

            {/* Icon */}
            <div className={`w-14 h-14 rounded-xl ${step.iconBg} border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {step.icon}
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold text-space-800 mb-3 tracking-tight">
                {step.title}
            </h3>
            <p className="text-space-500 leading-relaxed text-[15px]">
                {step.description}
            </p>
        </div>
    );
};

export const HowItWorks = () => {
    const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
    const { ref: parallaxRef, offset } = useParallax(0.1);

    const steps = [
        {
            icon: <MessageSquareHeart size={28} />,
            title: "Tell us your vibe",
            description: "Share your travel mood, budget, and interests. Whether you crave adventure, romance, or a cultural deep-dive — we listen to you.",
            accent: "from-coral-400 to-blush-400",
            iconBg: "bg-coral-50 text-coral-500 border-coral-100",
        },
        {
            icon: <Sparkles size={28} />,
            title: "AI finds hidden gems",
            description: "Our intelligent engine analyzes thousands of real destinations, reviews, and local secrets to curate places you'd never find on your own.",
            accent: "from-ice-400 to-ice-600",
            iconBg: "bg-ice-50 text-ice-600 border-ice-100",
        },
        {
            icon: <PlaneTakeoff size={28} />,
            title: "Plan smarter, travel better",
            description: "Get a personalized itinerary with perfect timing, smart routes, and local tips. Your dream trip, effortlessly planned by AI.",
            accent: "from-blush-300 to-coral-400",
            iconBg: "bg-blush-50 text-coral-400 border-blush-100",
        }
    ];

    return (
        <section id="how-it-works" className="py-28 md:py-36 bg-space-50 relative overflow-hidden">
            {/* Parallax background blobs */}
            <div
                ref={parallaxRef}
                className="absolute inset-0 pointer-events-none"
                style={{ transform: `translateY(${offset * 0.5}px)`, willChange: 'transform' }}
            >
                <div className="absolute -top-20 -left-20 w-[400px] h-[400px] bg-ice-200 rounded-full opacity-30 blur-[130px] animate-edge-glow" />
                <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-blush-200 rounded-full opacity-20 blur-[120px] animate-edge-glow" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-coral-200 rounded-full opacity-10 blur-[100px]" />
            </div>

            {/* Dot grid */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
                backgroundImage: `radial-gradient(circle at 1.5px 1.5px, #A6E3E9 1px, transparent 0)`,
                backgroundSize: '44px 44px'
            }} />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <div
                    ref={headerRef}
                    className="text-center max-w-3xl mx-auto mb-20 transition-all duration-700"
                    style={{
                        opacity: headerVisible ? 1 : 0,
                        transform: headerVisible ? 'translateY(0)' : 'translateY(30px)',
                    }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-ice-200/40 text-ice-700 text-xs font-mono tracking-widest uppercase mb-6 shadow-sm">
                        <Map size={14} />
                        <span>How It Works</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-space-800 mb-6 tracking-tight">
                        Your dream trip,{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-ice-500 to-coral-400">
                            effortlessly planned
                        </span>
                    </h2>
                    <p className="text-lg text-space-500 font-light leading-relaxed">
                        We combine advanced AI with real travel data to create itineraries that feel like they were crafted by a local friend who knows you perfectly.
                    </p>
                </div>

                {/* Steps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {steps.map((step, index) => (
                        <StepCard key={index} step={step} index={index} />
                    ))}
                </div>

                {/* Connecting line (desktop) */}
                <div className="hidden md:block absolute top-[65%] left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-ice-200/40 to-transparent pointer-events-none" />
            </div>
        </section>
    );
};

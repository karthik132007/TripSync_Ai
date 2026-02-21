import React from 'react';
import { Heart, Sparkles, ShieldCheck, Brain, Compass } from 'lucide-react';
import { useScrollReveal, useParallax } from '../../hooks/useScrollAnimations';

export const WhyTripSync = () => {
    const { ref: headerRef, isVisible: headerVisible } = useScrollReveal();
    const { ref: imageRef, isVisible: imageVisible } = useScrollReveal({ threshold: 0.2 });
    const { ref: parallaxRef, offset } = useParallax(0.12);

    const features = [
        {
            icon: <Sparkles size={22} />,
            title: "Hyper-Personalized",
            description: "Every itinerary is as unique as your fingerprint, tailored to your exact preferences and hidden desires.",
            accent: "text-coral-400",
            bg: "bg-coral-50 border-coral-100",
        },
        {
            icon: <Brain size={22} />,
            title: "Emotion-Aware AI",
            description: "Our AI doesn't just match keywords — it understands the nuances of human emotion and travel longing.",
            accent: "text-ice-600",
            bg: "bg-ice-50 border-ice-100",
        },
        {
            icon: <ShieldCheck size={22} />,
            title: "Stress-Free Planning",
            description: "Say goodbye to endless tabs and overwhelming choices. We handle the logistics so you can focus on excitement.",
            accent: "text-blush-500",
            bg: "bg-blush-50 border-blush-100",
        },
    ];

    return (
        <section id="why-us" className="py-28 md:py-36 bg-space-50 relative overflow-hidden">
            {/* Parallax background */}
            <div
                ref={parallaxRef}
                className="absolute inset-0 pointer-events-none"
                style={{ transform: `translateY(${offset * 0.5}px)`, willChange: 'transform' }}
            >
                <div className="absolute top-0 -right-20 w-[500px] h-[500px] bg-coral-200 rounded-full opacity-15 blur-[130px]" />
                <div className="absolute -bottom-20 -left-20 w-[450px] h-[450px] bg-ice-200 rounded-full opacity-20 blur-[120px]" />
                <div className="absolute top-1/2 right-1/3 w-[200px] h-[200px] bg-blush-200 rounded-full opacity-10 blur-[80px]" />
            </div>

            {/* Dot grid */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
                backgroundImage: `radial-gradient(circle at 1.5px 1.5px, #A6E3E9 1px, transparent 0)`,
                backgroundSize: '48px 48px'
            }} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-center">

                    {/* Image Side */}
                    <div
                        ref={imageRef}
                        className="order-2 lg:order-1 transition-all duration-1000"
                        style={{
                            opacity: imageVisible ? 1 : 0,
                            transform: imageVisible ? 'translateX(0) scale(1)' : 'translateX(-40px) scale(0.95)',
                        }}
                    >
                        <div className="relative rounded-2xl overflow-hidden shadow-[0_20px_60px_-15px_#a6e3e930] border border-ice-100/40 group">
                            <img
                                src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1000&auto=format&fit=crop"
                                alt="Beautiful travel landscape"
                                className="w-full h-[400px] lg:h-[500px] object-cover transition-transform duration-1000 group-hover:scale-105"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-space-900/80 via-space-900/25 to-transparent" />

                            {/* Floating testimonial card */}
                            <div className="absolute bottom-6 left-6 right-6">
                                <div className="bg-white/90 backdrop-blur-xl p-5 rounded-xl border border-white/80 shadow-lg">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral-400 to-ice-400 flex items-center justify-center text-white shadow-md">
                                            <Heart size={18} className="fill-white/30" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-space-800">Travel with Soul</h4>
                                            <p className="text-xs text-space-400">Not just algorithms — emotion.</p>
                                        </div>
                                    </div>
                                    <p className="text-space-500 text-sm leading-relaxed italic">
                                        "TripSync AI didn't just give me a list of places; it understood the exact feeling I was looking for on my honeymoon."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Side */}
                    <div
                        ref={headerRef}
                        className="order-1 lg:order-2 transition-all duration-700"
                        style={{
                            opacity: headerVisible ? 1 : 0,
                            transform: headerVisible ? 'translateY(0)' : 'translateY(30px)',
                        }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-ice-200/40 text-ice-700 text-xs font-mono tracking-widest uppercase mb-6 shadow-sm">
                            <Compass size={14} />
                            <span>Why TripSync AI</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-black text-space-800 mb-8 leading-tight tracking-tight">
                            Because travel is about{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral-400 to-ice-500">
                                feeling
                            </span>
                            , not just seeing.
                        </h2>

                        <p className="text-lg text-space-500 mb-12 leading-relaxed font-light">
                            We believe the best trips resonate with your soul. Our AI curates experiences that leave you breathless, inspired, and deeply connected to the world.
                        </p>

                        {/* Feature List */}
                        <div className="space-y-5">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-4 group p-4 rounded-xl hover:bg-white/60 transition-all duration-300"
                                    style={{
                                        transitionDelay: `${index * 100 + 300}ms`,
                                        opacity: headerVisible ? 1 : 0,
                                        transform: headerVisible ? 'translateX(0)' : 'translateX(20px)',
                                    }}
                                >
                                    <div className={`mt-0.5 p-2.5 rounded-xl ${feature.bg} border ${feature.accent} flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                        {feature.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-space-800 mb-1">{feature.title}</h3>
                                        <p className="text-space-500 leading-relaxed text-[15px]">{feature.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

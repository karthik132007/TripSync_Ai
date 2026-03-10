import React from 'react';
import { Brain, Hotel, Zap, ArrowRight, Share2, Plane, Sparkles, CircleDollarSign } from 'lucide-react';
import { useScrollReveal, useParallax } from '../../hooks/useScrollAnimations';

const FeatureBullet = ({ icon, title, description, delay, isVisible }) => (
    <div
        className="flex items-start gap-4 group"
        style={{
            transitionDelay: `${delay}ms`,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
            transition: 'all 0.6s ease-out',
        }}
    >
        <div className="p-2.5 rounded-xl bg-ice-50 border border-ice-100 text-ice-500 flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
            {icon}
        </div>
        <div>
            <h4 className="font-bold text-space-800 mb-0.5">{title}</h4>
            <p className="text-sm text-space-500 leading-relaxed">{description}</p>
        </div>
    </div>
);

export const AIPersonalization = () => {
    const { ref: headerRef, isVisible: headerVisible } = useScrollReveal({ threshold: 0.15 });
    const { ref: gridRef, isVisible: gridVisible } = useScrollReveal({ threshold: 0.1 });
    const { ref: parallaxRef, offset } = useParallax(0.08);

    return (
        <section id="features" className="py-28 md:py-36 bg-space-50 relative overflow-hidden">
            {/* Background */}
            <div ref={parallaxRef} className="absolute inset-0 pointer-events-none" style={{ transform: `translateY(${offset * 0.5}px)`, willChange: 'transform' }}>
                <div className="absolute -top-20 -left-20 w-[400px] h-[400px] bg-ice-200 rounded-full opacity-25 blur-[130px] animate-edge-glow" />
                <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-pink-200 rounded-full opacity-15 blur-[120px] animate-edge-glow" style={{ animationDelay: '3s' }} />
            </div>

            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #36b9ff 0.7px, transparent 0)',
                backgroundSize: '44px 44px'
            }} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20 items-start">

                    {/* LEFT — Text Content */}
                    <div
                        ref={headerRef}
                        className="transition-all duration-700"
                        style={{
                            opacity: headerVisible ? 1 : 0,
                            transform: headerVisible ? 'translateY(0)' : 'translateY(30px)',
                        }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-ice-200/40 text-ice-600 text-xs font-semibold tracking-widest uppercase mb-6 shadow-sm">
                            <Sparkles size={14} />
                            <span>Seamless Integration</span>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-black text-space-800 mb-6 tracking-tight leading-tight">
                            AI-Powered<br />
                            <span className="text-gradient">Personalization</span>
                        </h2>

                        <p className="text-lg text-space-500 font-light leading-relaxed mb-10 max-w-md">
                            Our advanced algorithms learn from your style to suggest hidden gems, optimal routes, and perfect stays. It's not just planning, it's anticipating your desires.
                        </p>

                        {/* Feature bullets */}
                        <div className="space-y-5 mb-10">
                            <FeatureBullet
                                icon={<Brain size={20} />}
                                title="Deep Learning"
                                description="Understands your budget, pace, and vibe with every trip."
                                delay={200}
                                isVisible={headerVisible}
                            />
                            <FeatureBullet
                                icon={<Hotel size={20} />}
                                title="Curated Stays"
                                description="Hotels and villas hand-picked to match your aesthetic."
                                delay={350}
                                isVisible={headerVisible}
                            />
                            <FeatureBullet
                                icon={<Zap size={20} />}
                                title="Real-Time Sync"
                                description="Instant updates across all devices when plans change."
                                delay={500}
                                isVisible={headerVisible}
                            />
                        </div>

                        <a href="#destinations" className="inline-flex items-center gap-2 text-ice-500 font-semibold text-sm hover:gap-3 transition-all duration-300 group">
                            Explore Features
                            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>

                    {/* RIGHT — Bento Grid */}
                    <div
                        ref={gridRef}
                        className="grid grid-cols-2 gap-4 transition-all duration-700"
                        style={{
                            opacity: gridVisible ? 1 : 0,
                            transform: gridVisible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.97)',
                        }}
                    >
                        {/* Card 1 — Smart Itineraries */}
                        <div className="rounded-2xl overflow-hidden bg-white border border-space-100/50 shadow-[0_4px_24px_rgba(54,185,255,0.06)] hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(54,185,255,0.12)] transition-all duration-500 card-shine">
                            <div className="h-36 overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?q=80&w=600&auto=format&fit=crop"
                                    alt="City Planning"
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                            <div className="p-4">
                                <h3 className="font-bold text-space-800 mb-1">Smart Itineraries</h3>
                                <p className="text-xs text-space-500 leading-relaxed mb-3">Itineraries that adapt dynamically to flight changes and weather.</p>
                                <span className="text-xs font-semibold text-ice-500 bg-ice-50 px-3 py-1 rounded-full">✨ Automated</span>
                            </div>
                        </div>

                        {/* Card 2 — Budget Optimization */}
                        <div className="rounded-2xl overflow-hidden bg-white border border-space-100/50 shadow-[0_4px_24px_rgba(54,185,255,0.06)] hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(54,185,255,0.12)] transition-all duration-500 card-shine">
                            <div className="h-36 overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=600&auto=format&fit=crop"
                                    alt="Budget Travel"
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            </div>
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <CircleDollarSign size={16} className="text-pink-500" />
                                    <h3 className="font-bold text-space-800">Budget Optimization</h3>
                                </div>
                                <p className="text-xs text-space-500 leading-relaxed mb-3">Get the best value for your budget with AI-driven price predictions.</p>
                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Save ~35%</span>
                            </div>
                        </div>

                        {/* Card 3 — Collaborative Planning */}
                        <div className="rounded-2xl bg-white border border-space-100/50 shadow-[0_4px_24px_rgba(54,185,255,0.06)] p-5 hover:-translate-y-1 hover:shadow-[0_16px_48px_rgba(54,185,255,0.12)] transition-all duration-500 flex flex-col">
                            <div className="p-3 bg-ice-50 rounded-xl w-fit mb-4">
                                <Share2 size={22} className="text-ice-500" />
                            </div>
                            <h3 className="font-bold text-space-800 mb-1">Collaborative Planning</h3>
                            <p className="text-xs text-space-500 leading-relaxed mb-3 flex-1">Invite travel mates and collaboratively edit itineraries in real-time.</p>
                            <div className="flex -space-x-2">
                                {['🧑‍💼', '👩‍🎨', '🧑‍🚀'].map((e, i) => (
                                    <div key={i} className="w-7 h-7 rounded-full bg-gradient-to-br from-ice-100 to-pink-100 border-2 border-white flex items-center justify-center text-xs">{e}</div>
                                ))}
                            </div>
                        </div>

                        {/* Card 4 — Ready to fly CTA */}
                        <div className="rounded-2xl bg-gradient-to-br from-space-800 to-space-900 p-5 shadow-[0_4px_24px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-500 flex flex-col text-white">
                            <div className="p-3 bg-white/10 rounded-xl w-fit mb-4">
                                <Plane size={22} className="text-ice-300" />
                            </div>
                            <h3 className="font-bold text-white mb-1">Ready to fly?</h3>
                            <p className="text-xs text-white/60 leading-relaxed mb-4 flex-1">Join thousands of travelers syncing their next adventure.</p>
                            <a href="/plan" className="inline-flex items-center gap-2 text-sm font-semibold text-ice-300 border border-ice-400/40 rounded-full px-4 py-2 hover:bg-ice-400/10 transition-colors w-fit">
                                Get Started Now
                                <ArrowRight size={14} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

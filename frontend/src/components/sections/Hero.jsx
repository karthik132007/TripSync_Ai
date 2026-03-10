import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Eye, Plane } from 'lucide-react';
import { Button } from '../ui/Button';
import { useParallax } from '../../hooks/useScrollAnimations';

// Floating particle component
const Particle = ({ style }) => (
    <div
        className="absolute rounded-full pointer-events-none"
        style={{
            ...style,
            animation: `float-up ${style.duration || '8s'} ${style.delay || '0s'} ease-in-out infinite`,
        }}
    />
);

const generateParticles = (count) => {
    const colors = [
        'rgba(54, 185, 255, 0.5)',
        'rgba(122, 209, 255, 0.4)',
        'rgba(255, 138, 170, 0.35)',
        'rgba(184, 228, 255, 0.4)',
        'rgba(255, 179, 199, 0.3)',
    ];
    return Array.from({ length: count }, (_, i) => ({
        left: `${Math.random() * 100}%`,
        bottom: `${Math.random() * 20 - 10}%`,
        width: `${Math.random() * 4 + 2}px`,
        height: `${Math.random() * 4 + 2}px`,
        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
        duration: `${Math.random() * 8 + 6}s`,
        delay: `${Math.random() * 8}s`,
        filter: `blur(${Math.random() * 1}px)`,
    }));
};

const particles = generateParticles(30);

export const Hero = () => {
    const navigate = useNavigate();
    const { ref: parallaxRef, offset } = useParallax(0.2);

    return (
        <section ref={parallaxRef} className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-white via-ice-50/30 to-pink-50/20">

            {/* ===== ANIMATED MESH GRADIENT BACKGROUND ===== */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className="absolute w-[800px] h-[800px] rounded-full animate-blob opacity-[0.15]"
                    style={{ background: 'radial-gradient(circle, #7ad1ff 0%, transparent 70%)', top: '-15%', left: '-10%', filter: 'blur(80px)' }}
                />
                <div
                    className="absolute w-[600px] h-[600px] rounded-full animate-blob animation-delay-2000 opacity-[0.12]"
                    style={{ background: 'radial-gradient(circle, #ffb3c7 0%, transparent 70%)', top: '10%', right: '-8%', filter: 'blur(70px)' }}
                />
                <div
                    className="absolute w-[700px] h-[700px] rounded-full animate-blob animation-delay-4000 opacity-[0.10]"
                    style={{ background: 'radial-gradient(circle, #36b9ff 0%, transparent 70%)', bottom: '-20%', left: '20%', filter: 'blur(90px)' }}
                />

                {/* Aurora sweep */}
                <div
                    className="absolute w-[120%] h-[40%] top-[30%] -left-[10%] opacity-[0.06]"
                    style={{
                        background: 'linear-gradient(90deg, transparent 0%, #7ad1ff 25%, #ffb3c7 50%, #36b9ff 75%, transparent 100%)',
                        filter: 'blur(60px)',
                        animation: 'aurora-sweep 12s ease-in-out infinite alternate',
                    }}
                />
            </div>

            {/* Parallax glow */}
            <div className="absolute inset-0 pointer-events-none" style={{ transform: `translateY(${offset * 0.5}px)`, willChange: 'transform' }}>
                <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-ice-200 rounded-full opacity-25 blur-[140px] animate-edge-glow" />
                <div className="absolute -top-10 -right-10 w-[350px] h-[350px] bg-pink-200 rounded-full opacity-20 blur-[120px] animate-edge-glow" style={{ animationDelay: '3s' }} />
            </div>

            {/* Dot grid */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
                backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, #36b9ff 0.8px, transparent 0)',
                backgroundSize: '48px 48px'
            }} />

            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none">
                {particles.map((p, i) => <Particle key={i} style={p} />)}
            </div>

            {/* Noise texture */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")'
            }} />

            {/* ===== CONTENT ===== */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                    {/* LEFT — Text Content */}
                    <div className="max-w-xl">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 backdrop-blur-lg border border-ice-200/50 shadow-[0_2px_16px_rgba(54,185,255,0.08)] text-space-600 text-xs font-semibold mb-8 opacity-0 animate-fade-in-up tracking-wider uppercase">
                            <div className="relative">
                                <Sparkles size={14} className="text-ice-500" />
                                <div className="absolute inset-0 text-ice-500 animate-ping opacity-30"><Sparkles size={14} /></div>
                            </div>
                            <span>AI Travel Assistant v2.0</span>
                        </div>

                        {/* Heading */}
                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-space-800 mb-6 leading-[1.08] tracking-tight opacity-0 animate-fade-in-up animation-delay-100">
                            Intelligent Travel,<br />
                            <span className="text-gradient">Synced to You</span>
                        </h1>

                        {/* Subtitle */}
                        <p className="text-lg text-space-500 mb-10 leading-relaxed font-light opacity-0 animate-fade-in-up animation-delay-200 max-w-md">
                            Experience the future of travel planning. TripSync AI curates bespoke itineraries that evolve with your preferences in real-time, blending luxury with logic.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-start gap-4 opacity-0 animate-fade-in-up animation-delay-300">
                            <Button
                                onClick={() => navigate('/plan')}
                                variant="primary"
                                size="lg"
                                className="group shadow-lg shadow-ice-400/25 gap-2.5"
                            >
                                <span>Start Planning Free</span>
                                <ArrowRight className="group-hover:translate-x-1 transition-transform duration-300" size={18} />
                            </Button>

                            <Button
                                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                                variant="glass"
                                size="lg"
                                className="gap-2.5 border-space-200/60 hover:border-ice-300 text-space-600"
                            >
                                <Eye size={18} />
                                <span>View Demo</span>
                            </Button>
                        </div>

                        {/* User avatars */}
                        <div className="mt-10 flex items-center gap-3 opacity-0 animate-fade-in-up animation-delay-400">
                            <div className="flex -space-x-2.5">
                                {['🧑‍💼', '👩‍🎨', '🧑‍🚀', '👩‍💻'].map((emoji, i) => (
                                    <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-ice-100 to-pink-100 border-2 border-white flex items-center justify-center text-sm shadow-sm">
                                        {emoji}
                                    </div>
                                ))}
                            </div>
                            <span className="text-sm text-space-500 font-medium">Travelers joined this week</span>
                        </div>
                    </div>

                    {/* RIGHT — Floating Cards */}
                    <div className="relative hidden lg:block h-[500px]">

                        {/* Main Trip Card */}
                        <div className="absolute top-8 right-0 w-[300px] rounded-2xl overflow-hidden bg-white border border-space-100/60 shadow-[0_20px_60px_-15px_rgba(54,185,255,0.15)] animate-float-card z-20">
                            <div className="h-44 overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop"
                                    alt="Paris"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold text-space-800 text-lg mb-1">Parisian Weekend</h3>
                                <p className="text-space-500 text-sm mb-3">Experience Parisian culture from art & cuisine</p>
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-black text-space-800">$1,200</span>
                                    <span className="text-xs text-ice-500 font-semibold bg-ice-50 px-3 py-1 rounded-full">3 Days</span>
                                </div>
                            </div>
                        </div>

                        {/* Flight Status Card */}
                        <div className="absolute bottom-16 right-24 w-[240px] rounded-xl bg-white/90 backdrop-blur-xl border border-space-100/60 shadow-[0_12px_40px_-10px_rgba(54,185,255,0.12)] p-4 z-30 animate-float-card" style={{ animationDelay: '2s' }}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-ice-50 rounded-lg">
                                    <Plane size={16} className="text-ice-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-space-500 font-medium">Flight Status</p>
                                    <p className="text-sm font-bold text-space-800">On Time • BA209</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-1 text-xs text-space-400">
                                <span>LHR → CDG</span>
                                <span className="text-emerald-500 font-semibold">✓ Confirmed</span>
                            </div>
                        </div>

                        {/* Small accent card */}
                        <div className="absolute top-2 left-8 w-[160px] rounded-xl bg-gradient-to-br from-ice-400 to-ice-500 text-white p-4 shadow-lg shadow-ice-400/25 z-10 animate-float-card" style={{ animationDelay: '4s' }}>
                            <p className="text-xs font-semibold opacity-80 mb-1">AI Confidence</p>
                            <p className="text-2xl font-black">98.5%</p>
                            <p className="text-xs opacity-70 mt-1">Match Score</p>
                        </div>

                        {/* Decorative rings */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full border border-ice-200/30 pointer-events-none" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full border border-ice-100/20 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Bottom gradient blend */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
        </section>
    );
};

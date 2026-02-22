import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Map } from 'lucide-react';
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

// Generate random particles
const generateParticles = (count) => {
    const colors = [
        'rgba(166, 227, 233, 0.6)',
        'rgba(255, 209, 209, 0.5)',
        'rgba(255, 148, 148, 0.4)',
        'rgba(166, 227, 233, 0.3)',
        'rgba(82, 196, 208, 0.4)',
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

const particles = generateParticles(35);

export const Hero = () => {
    const navigate = useNavigate();
    const { ref: parallaxRef, offset } = useParallax(0.2);

    const handleStartPlanning = () => {
        navigate('/plan');
    };

    const handleHowItWorks = () => {
        document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section ref={parallaxRef} className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">

            {/* ===== ANIMATED MESH GRADIENT BACKGROUND ===== */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Animated aurora/mesh blobs — large, slow-moving, colorful */}
                <div
                    className="absolute w-[800px] h-[800px] rounded-full animate-blob opacity-[0.18]"
                    style={{
                        background: 'radial-gradient(circle, #A6E3E9 0%, transparent 70%)',
                        top: '-15%',
                        left: '-10%',
                        filter: 'blur(80px)',
                    }}
                />
                <div
                    className="absolute w-[600px] h-[600px] rounded-full animate-blob animation-delay-2000 opacity-[0.15]"
                    style={{
                        background: 'radial-gradient(circle, #FFD1D1 0%, transparent 70%)',
                        top: '10%',
                        right: '-8%',
                        filter: 'blur(70px)',
                    }}
                />
                <div
                    className="absolute w-[700px] h-[700px] rounded-full animate-blob animation-delay-4000 opacity-[0.12]"
                    style={{
                        background: 'radial-gradient(circle, #FF9494 0%, transparent 70%)',
                        bottom: '-20%',
                        left: '20%',
                        filter: 'blur(90px)',
                    }}
                />
                <div
                    className="absolute w-[500px] h-[500px] rounded-full animate-blob opacity-[0.1]"
                    style={{
                        background: 'radial-gradient(circle, #b6eaee 0%, transparent 70%)',
                        bottom: '5%',
                        right: '10%',
                        filter: 'blur(60px)',
                        animationDelay: '6s',
                        animationDuration: '18s',
                    }}
                />

                {/* Animated gradient sweep — aurora ribbon */}
                <div
                    className="absolute w-[120%] h-[40%] top-[30%] -left-[10%] opacity-[0.08]"
                    style={{
                        background: 'linear-gradient(90deg, transparent 0%, #A6E3E9 20%, #FFD1D1 40%, #FF9494 60%, #A6E3E9 80%, transparent 100%)',
                        filter: 'blur(60px)',
                        animation: 'aurora-sweep 12s ease-in-out infinite alternate',
                    }}
                />
            </div>

            {/* ===== PARALLAX GLOW LAYER ===== */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{ transform: `translateY(${offset * 0.5}px)`, willChange: 'transform' }}
            >
                <div className="absolute -top-20 -left-20 w-[500px] h-[500px] bg-ice-200 rounded-full opacity-30 blur-[140px] animate-edge-glow" />
                <div className="absolute -top-10 -right-10 w-[350px] h-[350px] bg-blush-200 rounded-full opacity-25 blur-[120px] animate-edge-glow" style={{ animationDelay: '3s' }} />
                <div className="absolute -bottom-20 -right-20 w-[550px] h-[550px] bg-ice-100 rounded-full opacity-30 blur-[160px] animate-edge-glow" style={{ animationDelay: '1.5s' }} />
                <div className="absolute -bottom-10 left-1/4 w-[400px] h-[400px] bg-coral-200 rounded-full opacity-15 blur-[130px] animate-edge-glow" style={{ animationDelay: '4s' }} />
            </div>

            {/* Constellation dot grid */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
                backgroundImage: `radial-gradient(circle at 1.5px 1.5px, #A6E3E9 1px, transparent 0)`,
                backgroundSize: '48px 48px'
            }} />

            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none">
                {particles.map((p, i) => (
                    <Particle key={i} style={p} />
                ))}
            </div>

            {/* Noise texture */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")'
            }} />

            {/* ===== CONTENT ===== */}
            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-32 pb-24">
                {/* AI Badge */}
                <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-lg border border-ice-200/50 shadow-[0_2px_20px_#a6e3e918] text-space-700 text-sm font-medium mb-10 opacity-0 animate-fade-in-up">
                    <div className="relative">
                        <Sparkles size={15} className="text-coral-400" />
                        <div className="absolute inset-0 text-coral-400 animate-ping opacity-30">
                            <Sparkles size={15} />
                        </div>
                    </div>
                    <span className="tracking-wide">AI-Powered Travel Engine</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-space-800 mb-8 tracking-tight leading-[1.05] opacity-0 animate-fade-in-up animation-delay-100">
                    Don't Know Where<br className="hidden sm:block" /> to Travel?{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-ice-500 via-coral-400 to-blush-400">
                        Let AI Decide.
                    </span>
                </h1>

                {/* Subheading */}
                <p className="text-lg md:text-xl text-space-500 max-w-2xl mx-auto mb-14 leading-relaxed font-light opacity-0 animate-fade-in-up animation-delay-200">
                    Describe your vibe, budget, and time — our intelligent engine analyzes thousands of destinations to curate the{' '}
                    <span className="font-medium text-space-700">perfect hidden gem</span>{' '}
                    just for you.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 opacity-0 animate-fade-in-up animation-delay-300">
                    <Button
                        onClick={handleStartPlanning}
                        variant="primary"
                        size="lg"
                        className="w-full sm:w-auto rounded-full shadow-lg shadow-coral-400/20 flex items-center justify-center gap-3 text-lg px-10 py-5 group"
                    >
                        <Map className="group-hover:rotate-12 transition-transform duration-300" size={22} />
                        <span className="font-semibold">Start Planning</span>
                        <ArrowRight className="group-hover:translate-x-1.5 transition-transform duration-300" size={20} />
                    </Button>

                    <Button
                        onClick={handleHowItWorks}
                        variant="glass"
                        size="lg"
                        className="w-full sm:w-auto rounded-full flex items-center justify-center gap-2 text-lg px-10 py-5 text-space-600 border-space-200/50 hover:border-ice-300 hover:shadow-[0_4px_24px_#a6e3e925] bg-white/50"
                    >
                        <span>How it works</span>
                    </Button>
                </div>

                {/* Status */}
                <div className="mt-14 flex items-center justify-center gap-2.5 text-sm text-space-400 font-mono opacity-0 animate-fade-in-up animation-delay-400">
                    <div className="relative">
                        <div className="w-2 h-2 rounded-full bg-emerald-400" />
                        <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-40" />
                    </div>
                    <span>AI Engine Active • Analyzing 10,000+ Destinations</span>
                </div>
            </div>

            {/* Bottom gradient blend */}
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
        </section>
    );
};

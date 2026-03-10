import React, { useState } from 'react';
import { ArrowRight, Send, MessageCircle, Sparkles } from 'lucide-react';
import { useScrollReveal } from '../../hooks/useScrollAnimations';
import { Button } from '../ui/Button';

const trustedLogos = ['LUXE', 'SKYWAY', 'GLOBE', 'NOMAD', 'ZENITH', 'ATLAS'];

export const CTASection = () => {
    const { ref, isVisible } = useScrollReveal({ threshold: 0.15 });
    const [email, setEmail] = useState('');

    return (
        <section className="py-20 md:py-28 bg-white relative overflow-hidden">

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* ===== DARK CTA CARD ===== */}
                <div
                    ref={ref}
                    className="rounded-3xl bg-gradient-to-br from-space-800 via-space-900 to-space-950 p-10 md:p-16 relative overflow-hidden transition-all duration-700"
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.97)',
                    }}
                >
                    {/* Background effects */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute -top-20 -left-20 w-[400px] h-[400px] bg-ice-500 rounded-full opacity-[0.08] blur-[120px]" />
                        <div className="absolute -bottom-20 -right-20 w-[350px] h-[350px] bg-pink-400 rounded-full opacity-[0.06] blur-[100px]" />
                        <div className="absolute inset-0 opacity-[0.03]" style={{
                            backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.3) 0.5px, transparent 0)',
                            backgroundSize: '32px 32px'
                        }} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center relative z-10">
                        {/* Left — Text + Email */}
                        <div>
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-5 leading-tight tracking-tight">
                                Ready to sync your<br />
                                <span className="text-gradient-ice">next adventure?</span>
                            </h2>
                            <p className="text-white/50 text-lg font-light leading-relaxed mb-8 max-w-md">
                                Stop planning, start experiencing. Let AI handle the logistics while you focus on the memories. Join the waitlist for exclusive early access.
                            </p>

                            {/* Email input */}
                            <div className="flex flex-col sm:flex-row gap-3 max-w-md">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email address"
                                    className="flex-1 px-5 py-3.5 rounded-full bg-white/[0.08] border border-white/[0.12] text-white placeholder-white/30 text-sm focus:outline-none focus:border-ice-400/50 focus:bg-white/[0.12] transition-all duration-300"
                                />
                                <Button variant="primary" size="md" className="gap-2 shrink-0">
                                    Get Started
                                    <Send size={15} />
                                </Button>
                            </div>

                            <p className="text-white/25 text-xs mt-4">No credit card required. Cancel anytime.</p>
                        </div>

                        {/* Right — Chat Preview Card */}
                        <div className="hidden lg:block">
                            <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.1] rounded-2xl p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-w-sm ml-auto">
                                {/* Header */}
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="p-2.5 bg-gradient-to-br from-ice-400 to-ice-500 rounded-xl text-white">
                                        <MessageCircle size={18} />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-sm">TripSync Bot</h4>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                            <span className="text-white/40 text-xs">Online</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Chat messages */}
                                <div className="space-y-3 mb-5">
                                    <div className="bg-white/[0.06] rounded-2xl rounded-tl-sm p-3.5 max-w-[85%]">
                                        <p className="text-white/70 text-sm leading-relaxed">
                                            🌍 I found an ideal 3-night trip to Bali. Want your itinerary with budget insights?
                                        </p>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <div className="bg-ice-500/20 border border-ice-400/20 rounded-full px-4 py-2 text-ice-300 text-xs font-medium">
                                            Yes, let's go!
                                        </div>
                                        <div className="bg-white/[0.06] border border-white/10 rounded-full px-4 py-2 text-white/50 text-xs font-medium">
                                            My Budget
                                        </div>
                                    </div>
                                </div>

                                {/* Typing indicator */}
                                <div className="flex items-center gap-2 text-white/30 text-xs">
                                    <Sparkles size={12} className="text-ice-400 animate-pulse" />
                                    <span>TripSync is generating your plan...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== TRUSTED BY ===== */}
                <div className="mt-14 text-center">
                    <p className="text-xs text-space-400 font-semibold tracking-[0.2em] uppercase mb-6">Trusted by travelers from</p>
                    <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14">
                        {trustedLogos.map((name, i) => (
                            <span key={i} className="text-space-300 font-bold text-sm tracking-wider flex items-center gap-2 hover:text-space-500 transition-colors duration-300">
                                <span className="text-ice-400">◆</span>
                                {name}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

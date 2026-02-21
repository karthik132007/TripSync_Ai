import React from 'react';
import { Compass, Heart, Twitter, Instagram, Github } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="bg-space-950 text-white/50 py-14 border-t border-white/[0.04]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2.5 mb-5">
                            <div className="p-2 bg-gradient-to-br from-ice-400 to-coral-400 rounded-xl text-white">
                                <Compass size={18} strokeWidth={2.5} />
                            </div>
                            <span className="font-mono font-bold text-lg tracking-tight text-white">
                                TripSync<span className="text-transparent bg-clip-text bg-gradient-to-r from-ice-400 to-coral-400">.AI</span>
                            </span>
                        </div>
                        <p className="text-white/30 text-sm max-w-xs leading-relaxed">
                            Discover your perfect journey with AI-powered personalized travel planning.
                            We turn your travel dreams into unforgettable reality.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-white/70 font-mono font-semibold mb-5 text-sm tracking-wider uppercase">Explore</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#destinations" className="hover:text-ice-300 transition-colors duration-200">Destinations</a></li>
                            <li><a href="#how-it-works" className="hover:text-ice-300 transition-colors duration-200">How it Works</a></li>
                            <li><a href="#why-us" className="hover:text-ice-300 transition-colors duration-200">Why Us</a></li>
                            <li><a href="#" className="hover:text-ice-300 transition-colors duration-200">Pricing</a></li>
                        </ul>
                    </div>

                    {/* Social */}
                    <div>
                        <h4 className="text-white/70 font-mono font-semibold mb-5 text-sm tracking-wider uppercase">Connect</h4>
                        <div className="flex gap-3">
                            <a href="#" className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-ice-300 hover:border-ice-300/20 hover:bg-white/[0.08] transition-all duration-200">
                                <Twitter size={18} />
                            </a>
                            <a href="#" className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-coral-300 hover:border-coral-300/20 hover:bg-white/[0.08] transition-all duration-200">
                                <Instagram size={18} />
                            </a>
                            <a href="#" className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/40 hover:text-blush-300 hover:border-blush-300/20 hover:bg-white/[0.08] transition-all duration-200">
                                <Github size={18} />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-8 border-t border-white/[0.04] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/25">
                    <p>© {new Date().getFullYear()} TripSync AI. All rights reserved.</p>
                    <p className="flex items-center gap-1.5">
                        Made with <Heart size={11} className="text-coral-400 fill-coral-400" /> for travelers everywhere
                    </p>
                </div>
            </div>
        </footer>
    );
};

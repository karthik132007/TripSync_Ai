import React from 'react';
import { Compass } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="bg-space-950 text-white/50 py-10 border-t border-white/[0.04]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-gradient-to-br from-ice-400 to-ice-500 rounded-lg text-white">
                            <Compass size={16} strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-base tracking-tight text-white">
                            TripSync<span className="text-gradient-ice"> AI</span>
                        </span>
                    </div>

                    {/* Links */}
                    <div className="flex items-center gap-6 text-sm text-white/40">
                        <a href="#" className="hover:text-ice-300 transition-colors duration-200">Privacy</a>
                        <a href="#" className="hover:text-ice-300 transition-colors duration-200">Terms</a>
                        <a href="#" className="hover:text-ice-300 transition-colors duration-200">Support</a>
                    </div>

                    {/* Copyright */}
                    <p className="text-xs text-white/25">
                        © {new Date().getFullYear()} TripSync AI. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

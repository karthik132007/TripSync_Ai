import React, { useState, useEffect } from 'react';
import { Compass, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';

export const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled
                    ? 'bg-white/70 backdrop-blur-xl border-b border-space-100/50 shadow-[0_2px_20px_#a6e3e910] py-3'
                    : 'bg-transparent py-5'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5 cursor-pointer group">
                        <div className="p-2 bg-gradient-to-br from-ice-400 to-coral-400 rounded-xl text-white shadow-md group-hover:shadow-lg group-hover:shadow-ice-300/30 transition-all duration-300 group-hover:-rotate-12">
                            <Compass size={22} strokeWidth={2.5} />
                        </div>
                        <span className={`font-mono font-bold text-xl tracking-tight transition-colors duration-300 ${isScrolled ? 'text-space-900' : 'text-space-900'
                            }`}>
                            TripSync<span className="text-transparent bg-clip-text bg-gradient-to-r from-ice-500 to-coral-400">.AI</span>
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <div className={`flex gap-6 font-medium text-sm transition-colors duration-300 ${isScrolled ? 'text-space-600' : 'text-space-600'
                            }`}>
                            <a href="#how-it-works" className="hover:text-ice-600 transition-colors duration-200">How it Works</a>
                            <a href="#destinations" className="hover:text-ice-600 transition-colors duration-200">Destinations</a>
                            <a href="#why-us" className="hover:text-ice-600 transition-colors duration-200">Why Us</a>
                        </div>
                        <Button variant="primary" size="sm" className="rounded-full shadow-md shadow-coral-400/15">
                            Start Planning
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`p-2.5 rounded-xl transition-colors duration-200 ${isScrolled
                                    ? 'text-space-800 hover:bg-space-100'
                                    : 'text-space-800 hover:bg-space-100/50'
                                }`}
                        >
                            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-space-100/50 shadow-xl">
                    <div className="px-4 pt-3 pb-6 space-y-1 flex flex-col">
                        <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-space-700 hover:text-ice-600 hover:bg-ice-50/50 rounded-xl font-medium transition-colors">
                            How it Works
                        </a>
                        <a href="#destinations" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-space-700 hover:text-ice-600 hover:bg-ice-50/50 rounded-xl font-medium transition-colors">
                            Destinations
                        </a>
                        <a href="#why-us" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-space-700 hover:text-ice-600 hover:bg-ice-50/50 rounded-xl font-medium transition-colors">
                            Why Us
                        </a>
                        <div className="pt-3 px-4">
                            <Button variant="primary" className="w-full rounded-full">Start Planning</Button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

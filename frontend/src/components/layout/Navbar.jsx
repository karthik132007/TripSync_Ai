import React, { useState, useEffect } from 'react';
import { Compass, Menu, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

export const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                isScrolled
                    ? 'bg-white/80 backdrop-blur-2xl border-b border-space-100/40 shadow-[0_1px_20px_rgba(54,185,255,0.06)] py-3'
                    : 'bg-transparent py-5'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <div
                        className="flex items-center gap-2.5 cursor-pointer group"
                        onClick={() => navigate('/')}
                    >
                        <div className="p-2 bg-gradient-to-br from-ice-400 to-ice-500 rounded-xl text-white shadow-md group-hover:shadow-lg group-hover:shadow-ice-300/30 transition-all duration-300 group-hover:-rotate-12">
                            <Compass size={20} strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-space-900">
                            TripSync<span className="text-gradient"> AI</span>
                        </span>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <div className="flex gap-7 font-medium text-sm text-space-600">
                            <a href="#features" className="hover:text-ice-500 transition-colors duration-200">Features</a>
                            <a href="#how-it-works" className="hover:text-ice-500 transition-colors duration-200">How it Works</a>
                            <a href="#destinations" className="hover:text-ice-500 transition-colors duration-200">Destinations</a>
                        </div>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate('/plan')}
                            className="shadow-lg shadow-ice-400/20"
                        >
                            Plan Your Trip
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2.5 rounded-xl text-space-800 hover:bg-space-100/50 transition-colors duration-200"
                        >
                            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-space-100/40 shadow-xl">
                    <div className="px-4 pt-3 pb-6 space-y-1 flex flex-col">
                        <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-space-700 hover:text-ice-500 hover:bg-ice-50/50 rounded-xl font-medium transition-colors">Features</a>
                        <a href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-space-700 hover:text-ice-500 hover:bg-ice-50/50 rounded-xl font-medium transition-colors">How it Works</a>
                        <a href="#destinations" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 text-space-700 hover:text-ice-500 hover:bg-ice-50/50 rounded-xl font-medium transition-colors">Destinations</a>
                        <div className="pt-3 px-4">
                            <Button variant="primary" className="w-full" onClick={() => { setIsMobileMenuOpen(false); navigate('/plan'); }}>Plan Your Trip</Button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

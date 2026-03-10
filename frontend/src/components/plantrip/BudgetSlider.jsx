import React, { useRef, useState } from 'react';

export const BudgetSlider = ({ value, onChange }) => {
    const min = 5000;
    const max = 500000;
    const step = 5000;
    const trackRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    const formatCurrency = (val) => {
        if (val >= 100000) return `₹${(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)}L`;
        return `₹${(val / 1000).toFixed(0)}K`;
    };

    const percentage = ((value - min) / (max - min)) * 100;

    const getVibeLabel = (val) => {
        if (val <= 15000) return { text: 'Backpacker', icon: '🎒' };
        if (val <= 40000) return { text: 'Budget Explorer', icon: '🚌' };
        if (val <= 100000) return { text: 'Comfortable', icon: '✈️' };
        if (val <= 250000) return { text: 'Premium', icon: '💎' };
        if (val <= 400000) return { text: 'Luxury', icon: '🥂' };
        return { text: 'Ultra Luxury', icon: '👑' };
    };

    const vibe = getVibeLabel(value);

    const handleTrackClick = (e) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const raw = min + pct * (max - min);
        onChange(Math.round(raw / step) * step);
    };

    return (
        <div className="space-y-5">
            {/* Price display */}
            <div className="flex items-end gap-4">
                <div className="text-4xl sm:text-5xl font-black text-space-800 tracking-tighter leading-none">
                    {formatCurrency(value)}
                </div>
                <div className="pb-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ice-50 border border-ice-100 text-xs font-semibold text-space-600">
                        <span>{vibe.icon}</span>
                        <span>{vibe.text}</span>
                    </span>
                </div>
            </div>

            {/* Slider */}
            <div className="relative group py-3" ref={trackRef} onClick={handleTrackClick}>
                <div className="relative h-2 rounded-full bg-space-100 overflow-hidden cursor-pointer">
                    <div
                        className="absolute h-full rounded-full bg-gradient-to-r from-ice-400 to-ice-500 transition-[width] duration-150"
                        style={{ width: `${percentage}%` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_3s_ease-in-out_infinite] bg-[length:200%_100%]" />
                    </div>
                </div>

                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onTouchStart={() => setIsDragging(true)}
                    onTouchEnd={() => setIsDragging(false)}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
                    style={{ top: '12px', height: '8px' }}
                />

                <div
                    className={`absolute w-6 h-6 rounded-full bg-white border-[3px] border-ice-400 shadow-[0_0_12px_rgba(54,185,255,0.25)] pointer-events-none transition-all duration-150
                        ${isDragging ? 'scale-125 shadow-[0_0_20px_rgba(54,185,255,0.4)]' : 'group-hover:scale-110'}`}
                    style={{ left: `calc(${percentage}% - 12px)`, top: '0px' }}
                >
                    <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-ice-400 to-ice-500" />
                </div>
            </div>

            {/* Range labels */}
            <div className="flex justify-between text-[10px] text-space-400 font-semibold tracking-widest uppercase">
                <span>BUDGET</span>
                <span>COMFORT</span>
                <span>LUXURY</span>
                <span>ULTRA</span>
            </div>
        </div>
    );
};

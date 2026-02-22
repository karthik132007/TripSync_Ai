import React, { useRef, useEffect, useState } from 'react';

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
        <div className="space-y-6">
            {/* Big price display */}
            <div className="flex items-end gap-4">
                <div className="text-5xl sm:text-6xl font-mono font-black text-gradient tracking-tighter leading-none">
                    {formatCurrency(value)}
                </div>
                <div className="pb-1.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/25 backdrop-blur-md border border-white/30 text-xs font-semibold text-space-600">
                        <span>{vibe.icon}</span>
                        <span>{vibe.text}</span>
                    </span>
                </div>
            </div>

            {/* Slider */}
            <div className="relative group py-3" ref={trackRef} onClick={handleTrackClick}>
                {/* Track background */}
                <div className="relative h-2.5 rounded-full bg-space-100/50 overflow-hidden cursor-pointer">
                    {/* Filled gradient track */}
                    <div
                        className="absolute h-full rounded-full bg-gradient-to-r from-ice-400 via-coral-400 to-blush-400 transition-[width] duration-150"
                        style={{ width: `${percentage}%` }}
                    >
                        {/* Shimmer overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_3s_ease-in-out_infinite] bg-[length:200%_100%]" />
                    </div>
                </div>

                {/* Hidden range input */}
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
                    style={{ top: '12px', height: '10px' }}
                />

                {/* Custom thumb */}
                <div
                    className={`absolute w-7 h-7 rounded-full bg-white border-[3px] border-coral-400 shadow-[0_0_16px_rgba(255,148,148,0.35)] pointer-events-none transition-all duration-150
                        ${isDragging ? 'scale-125 shadow-[0_0_24px_rgba(255,148,148,0.5)]' : 'group-hover:scale-110'}`}
                    style={{ left: `calc(${percentage}% - 14px)`, top: '0px' }}
                >
                    {/* Inner glow dot */}
                    <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-coral-400 to-blush-400" />
                </div>
            </div>

            {/* Range labels */}
            <div className="flex justify-between text-[10px] text-space-300 font-mono tracking-widest uppercase">
                <span>{formatCurrency(min)}</span>
                <span>{formatCurrency(max)}</span>
            </div>
        </div>
    );
};

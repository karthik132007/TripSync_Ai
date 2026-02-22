import React from 'react';
import { Minus, Plus } from 'lucide-react';

export const DurationInput = ({ value, onChange }) => {
    const min = 1;
    const max = 30;

    const increment = () => { if (value < max) onChange(value + 1); };
    const decrement = () => { if (value > min) onChange(value - 1); };

    const handleInput = (e) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val)) onChange(Math.min(max, Math.max(min, val)));
    };

    const getVibeLabel = (days) => {
        if (days <= 2) return '⚡ Quick escape';
        if (days <= 5) return '🌅 Long weekend';
        if (days <= 10) return '🗺️ Proper adventure';
        if (days <= 20) return '🌍 Deep exploration';
        return '🧳 Nomad lifestyle';
    };

    return (
        <div className="flex items-center gap-5">
            {/* Modern stepper */}
            <div className="flex items-center gap-0 rounded-2xl border border-white/30 backdrop-blur-md bg-white/15 overflow-hidden shadow-lg shadow-space-900/[0.03]">
                <button
                    type="button"
                    onClick={decrement}
                    disabled={value <= min}
                    className="w-14 h-14 flex items-center justify-center text-space-500 hover:bg-white/20 hover:text-coral-500 active:scale-90 transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                >
                    <Minus size={18} strokeWidth={2.5} />
                </button>

                <div className="w-px h-8 bg-white/20" />

                <input
                    type="number"
                    min={min}
                    max={max}
                    value={value}
                    onChange={handleInput}
                    className="w-20 h-14 text-center text-3xl font-mono font-black text-space-800 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />

                <div className="w-px h-8 bg-white/20" />

                <button
                    type="button"
                    onClick={increment}
                    disabled={value >= max}
                    className="w-14 h-14 flex items-center justify-center text-space-500 hover:bg-white/20 hover:text-ice-600 active:scale-90 transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                >
                    <Plus size={18} strokeWidth={2.5} />
                </button>
            </div>

            <div className="space-y-0.5">
                <span className="text-base font-semibold text-space-700">{value === 1 ? 'day' : 'days'}</span>
                <p className="text-xs text-space-400 font-medium">{getVibeLabel(value)}</p>
            </div>
        </div>
    );
};

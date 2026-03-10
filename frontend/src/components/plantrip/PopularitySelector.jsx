import React from 'react';

const popularityOptions = [
    { id: 'medium', label: 'Moderate', emoji: '🌊', vibe: 'Known but not crowded' },
    { id: 'high', label: 'Popular', emoji: '🔥', vibe: 'Traveler favorites' },
    { id: 'very high', label: 'Iconic', emoji: '⭐', vibe: 'Bucket-list icons' },
    { id: 'offbeat', label: 'Offbeat', emoji: '💎', vibe: 'Roads less traveled' },
];

export const PopularitySelector = ({ value, onChange }) => {
    return (
        <div className="space-y-2.5">
            {popularityOptions.map((opt) => {
                const isSelected = value === opt.id;

                return (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChange(opt.id)}
                        className={`group w-full flex items-center gap-4 px-5 py-4 rounded-xl border transition-all duration-500 cursor-pointer text-left
                            ${isSelected
                                ? 'border-ice-400/50 bg-gradient-to-r from-ice-400/10 to-ice-300/6 shadow-[0_4px_20px_rgba(54,185,255,0.10)]'
                                : 'border-space-200/50 bg-white/30 hover:bg-white/60 hover:border-ice-300/40'
                            }`}
                    >
                        {/* Radio circle */}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300
                            ${isSelected ? 'border-ice-400 bg-ice-400' : 'border-space-300'}`}>
                            {isSelected && (
                                <div className="w-2 h-2 rounded-full bg-white" />
                            )}
                        </div>

                        <span className="text-lg">{opt.emoji}</span>

                        <div className="flex-1">
                            <span className={`text-sm font-bold block ${isSelected ? 'text-ice-600' : 'text-space-700'}`}>
                                {opt.label}
                            </span>
                            <span className="text-[11px] text-space-400 block">
                                {opt.vibe}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

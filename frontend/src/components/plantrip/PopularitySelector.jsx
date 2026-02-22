import React from 'react';

const popularityOptions = [
    { id: 'medium', label: 'Medium', emoji: '🌊', vibe: 'Known but not crowded' },
    { id: 'high', label: 'High', emoji: '🔥', vibe: 'Traveler favorites' },
    { id: 'very high', label: 'Very High', emoji: '⭐', vibe: 'Bucket-list icons' },
    { id: 'offbeat', label: 'Offbeat', emoji: '💎', vibe: 'Roads less traveled' },
];

export const PopularitySelector = ({ value, onChange }) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {popularityOptions.map((opt) => {
                const isSelected = value === opt.id;

                return (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChange(opt.id)}
                        className={`group relative flex flex-col items-start gap-2.5 p-5 rounded-2xl border backdrop-blur-md transition-all duration-500 cursor-pointer overflow-hidden
                            ${isSelected
                                ? 'border-coral-400/40 bg-gradient-to-br from-coral-400/10 to-blush-300/10 shadow-[0_8px_32px_rgba(255,148,148,0.12)] scale-[1.02]'
                                : 'border-white/25 bg-white/15 hover:bg-white/25 hover:border-ice-300/40 hover:shadow-[0_8px_24px_rgba(166,227,233,0.1)] hover:scale-[1.02]'
                            }`}
                    >
                        {isSelected && (
                            <div className="absolute -top-8 -right-8 w-24 h-24 bg-coral-400/10 rounded-full blur-2xl pointer-events-none" />
                        )}

                        <span className="text-2xl relative">{opt.emoji}</span>
                        <div className="relative">
                            <span className={`text-sm font-bold block ${isSelected ? 'text-coral-600' : 'text-space-700'}`}>
                                {opt.label}
                            </span>
                            <span className={`text-[11px] mt-0.5 block ${isSelected ? 'text-coral-400' : 'text-space-400'}`}>
                                {opt.vibe}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

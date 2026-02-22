import React from 'react';

const climateOptions = [
    { id: 'tropical', label: 'Tropical', emoji: '🌴' },
    { id: 'subtropical', label: 'Subtropical', emoji: '🌺' },
    { id: 'cold', label: 'Cold', emoji: '❄️' },
    { id: 'mediterranean', label: 'Mediterranean', emoji: '🫒' },
    { id: 'moderate', label: 'Moderate', emoji: '🌤️' },
    { id: 'continental', label: 'Continental', emoji: '🌲' },
    { id: 'dry', label: 'Dry', emoji: '🏜️' },
    { id: 'temperate', label: 'Temperate', emoji: '🍃' },
    { id: 'highland', label: 'Highland', emoji: '⛰️' },
    { id: 'alpine', label: 'Alpine', emoji: '🏔️' },
];

export const ClimateSelector = ({ value = [], onChange }) => {
    const toggle = (id) => {
        if (value.includes(id)) {
            onChange(value.filter((v) => v !== id));
        } else {
            onChange([...value, id]);
        }
    };

    return (
        <div className="flex flex-wrap gap-3">
            {climateOptions.map((opt) => {
                const isSelected = value.includes(opt.id);

                return (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggle(opt.id)}
                        className={`group inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border backdrop-blur-md text-sm font-semibold transition-all duration-500 cursor-pointer
                            ${isSelected
                                ? 'border-coral-400/40 bg-gradient-to-r from-coral-400/12 to-blush-300/10 text-coral-600 shadow-[0_0_16px_rgba(255,148,148,0.12)] scale-[1.04]'
                                : 'border-white/25 bg-white/15 text-space-600 hover:bg-white/30 hover:border-ice-300/40 hover:scale-[1.02] hover:shadow-[0_0_12px_rgba(166,227,233,0.1)]'
                            }`}
                    >
                        <span className="text-base transition-transform duration-300 group-hover:scale-110">{opt.emoji}</span>
                        <span>{opt.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

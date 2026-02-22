import React from 'react';

const months = [
    { short: 'Jan', full: 'January', emoji: '❄️' },
    { short: 'Feb', full: 'February', emoji: '💐' },
    { short: 'Mar', full: 'March', emoji: '🌸' },
    { short: 'Apr', full: 'April', emoji: '🌤️' },
    { short: 'May', full: 'May', emoji: '☀️' },
    { short: 'Jun', full: 'June', emoji: '🌊' },
    { short: 'Jul', full: 'July', emoji: '🌧️' },
    { short: 'Aug', full: 'August', emoji: '🌦️' },
    { short: 'Sep', full: 'September', emoji: '🍂' },
    { short: 'Oct', full: 'October', emoji: '🎃' },
    { short: 'Nov', full: 'November', emoji: '🍁' },
    { short: 'Dec', full: 'December', emoji: '🎄' },
];

export const MonthSelector = ({ value = [], onChange }) => {
    const toggle = (month) => {
        if (value.includes(month)) {
            onChange(value.filter((m) => m !== month));
        } else {
            onChange([...value, month]);
        }
    };

    return (
        <div className="flex flex-wrap gap-3">
            {months.map((m) => {
                const isSelected = value.includes(m.full);
                return (
                    <button
                        key={m.full}
                        type="button"
                        onClick={() => toggle(m.full)}
                        className={`group relative px-5 py-3 rounded-2xl border backdrop-blur-md transition-all duration-500 cursor-pointer
                            ${isSelected
                                ? 'border-coral-400/50 bg-gradient-to-br from-coral-400/15 to-blush-300/10 shadow-[0_0_20px_rgba(255,148,148,0.15)] scale-[1.05]'
                                : 'border-white/30 bg-white/20 hover:bg-white/35 hover:border-ice-300/50 hover:shadow-[0_0_15px_rgba(166,227,233,0.12)] hover:scale-[1.03]'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-lg transition-transform duration-300 group-hover:scale-110">{m.emoji}</span>
                            <span className={`text-sm font-semibold tracking-wide transition-colors duration-300 ${isSelected ? 'text-coral-500' : 'text-space-600 group-hover:text-ice-700'}`}>
                                {m.short}
                            </span>
                        </div>
                        {/* Selection glow ring */}
                        {isSelected && (
                            <div className="absolute inset-0 rounded-2xl border border-coral-400/20 animate-pulse pointer-events-none" />
                        )}
                    </button>
                );
            })}
        </div>
    );
};

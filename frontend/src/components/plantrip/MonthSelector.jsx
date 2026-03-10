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
                        className={`group relative px-5 py-3 rounded-2xl border transition-all duration-500 cursor-pointer
                            ${isSelected
                                ? 'border-ice-400/50 bg-gradient-to-br from-ice-400/15 to-ice-300/10 shadow-[0_0_20px_rgba(54,185,255,0.15)] scale-[1.05]'
                                : 'border-space-200/50 bg-white/40 hover:bg-white/70 hover:border-ice-300/50 hover:shadow-[0_0_15px_rgba(54,185,255,0.08)] hover:scale-[1.03]'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-lg transition-transform duration-300 group-hover:scale-110">{m.emoji}</span>
                            <span className={`text-sm font-semibold tracking-wide transition-colors duration-300 ${isSelected ? 'text-ice-600' : 'text-space-600 group-hover:text-ice-600'}`}>
                                {m.short}
                            </span>
                        </div>
                        {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-ice-400 flex items-center justify-center">
                                <svg width="8" height="8" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
};

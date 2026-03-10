import React from 'react';
import { User, Users, Heart, Baby } from 'lucide-react';

const travelTypes = [
    { id: 'solo', label: 'Solo', icon: User, emoji: '🎒', vibe: 'Me, myself & the world' },
    { id: 'friends', label: 'Friends', icon: Users, emoji: '🤙', vibe: 'Squad adventures' },
    { id: 'couples', label: 'Couples', icon: Heart, emoji: '💕', vibe: 'Romantic escape' },
    { id: 'family', label: 'Family', icon: Baby, emoji: '👨‍👩‍👧‍👦', vibe: 'Memories together' },
];

export const TravelTypeSelector = ({ value, onChange }) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {travelTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = value === type.id;

                return (
                    <button
                        key={type.id}
                        type="button"
                        onClick={() => onChange(type.id)}
                        className={`group relative flex flex-col items-start gap-3 p-5 rounded-2xl border transition-all duration-500 cursor-pointer overflow-hidden
                            ${isSelected
                                ? 'border-ice-400/50 bg-gradient-to-br from-ice-400/10 to-ice-300/8 shadow-[0_8px_32px_rgba(54,185,255,0.12)] scale-[1.02]'
                                : 'border-space-200/50 bg-white/40 hover:bg-white/70 hover:border-ice-300/40 hover:shadow-[0_8px_24px_rgba(54,185,255,0.08)] hover:scale-[1.02]'
                            }`}
                    >
                        {isSelected && (
                            <>
                                <div className="absolute -top-12 -right-12 w-32 h-32 bg-ice-400/8 rounded-full blur-2xl pointer-events-none" />
                                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-ice-400 flex items-center justify-center">
                                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                            </>
                        )}

                        <div className="relative flex items-center gap-2.5">
                            <span className="text-2xl">{type.emoji}</span>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300
                                ${isSelected ? 'bg-ice-50 text-ice-500' : 'bg-space-50 text-space-400 group-hover:bg-ice-50 group-hover:text-ice-500'}`}>
                                <Icon size={18} />
                            </div>
                        </div>

                        <div className="relative">
                            <span className={`text-sm font-bold block ${isSelected ? 'text-ice-600' : 'text-space-700'}`}>
                                {type.label}
                            </span>
                            <span className={`text-[11px] mt-0.5 block ${isSelected ? 'text-ice-500' : 'text-space-400'}`}>
                                {type.vibe}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

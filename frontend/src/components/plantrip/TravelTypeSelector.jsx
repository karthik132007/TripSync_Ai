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
                        className={`group relative flex flex-col items-start gap-3 p-5 rounded-2xl border backdrop-blur-md transition-all duration-500 cursor-pointer overflow-hidden
                            ${isSelected
                                ? 'border-coral-400/40 bg-gradient-to-br from-coral-400/10 to-blush-300/10 shadow-[0_8px_32px_rgba(255,148,148,0.12)] scale-[1.02]'
                                : 'border-white/25 bg-white/15 hover:bg-white/25 hover:border-ice-300/40 hover:shadow-[0_8px_24px_rgba(166,227,233,0.1)] hover:scale-[1.02]'
                            }`}
                    >
                        {/* Background glow when selected */}
                        {isSelected && (
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-coral-400/10 rounded-full blur-2xl pointer-events-none" />
                        )}

                        <div className="relative flex items-center gap-2.5">
                            <span className="text-2xl">{type.emoji}</span>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300
                                ${isSelected ? 'bg-coral-400/15 text-coral-500' : 'bg-white/20 text-space-400 group-hover:bg-ice-100/40 group-hover:text-ice-600'}`}>
                                <Icon size={18} />
                            </div>
                        </div>

                        <div className="relative">
                            <span className={`text-sm font-bold block ${isSelected ? 'text-coral-600' : 'text-space-700'}`}>
                                {type.label}
                            </span>
                            <span className={`text-[11px] mt-0.5 block ${isSelected ? 'text-coral-400' : 'text-space-400'}`}>
                                {type.vibe}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

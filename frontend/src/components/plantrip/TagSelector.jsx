import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const tagEmojis = {
    adventure: '🧗', beach: '🏖️', 'bird-watching': '🦅', boating: '🚣',
    camping: '🏕️', canyon: '🏜️', caves: '🦇', culture: '🎭',
    desert: '🐪', food: '🍜', forest: '🌳', heritage: '🏛️',
    history: '📜', islands: '🏝️', lakes: '🏞️', luxury: '💎',
    mountains: '⛰️', nature: '🌿', nightlife: '🌃', offbeat: '🗺️',
    paragliding: '🪂', peaceful: '🧘', rafting: '🚣‍♂️', river: '🏞️',
    romantic: '💕', safari: '🦁', skiing: '⛷️', spiritual: '🙏',
    trekking: '🥾', 'water-sports': '🏄', waterfalls: '💧',
};

export const TagSelector = ({ value = [], onChange }) => {
    const [tags, setTags] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/data/tags.json')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to load tags');
                return res.json();
            })
            .then((data) => { setTags(data); setLoading(false); })
            .catch((err) => { setError(err.message); setLoading(false); });
    }, []);

    const toggle = (tag) => {
        if (value.includes(tag)) {
            onChange(value.filter((v) => v !== tag));
        } else {
            onChange([...value, tag]);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-3 text-space-400 py-8">
                <Loader2 size={18} className="animate-spin text-ice-400" />
                <span className="text-sm font-medium">Curating experiences...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-pink-600 text-sm bg-pink-50 border border-pink-200/50 rounded-2xl px-5 py-4">
                ⚠️ {error}
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-2.5">
            {tags.map((tag) => {
                const isSelected = value.includes(tag);
                const emoji = tagEmojis[tag] || '✨';
                const displayLabel = tag.charAt(0).toUpperCase() + tag.slice(1).replace('-', ' ');

                return (
                    <button
                        key={tag}
                        type="button"
                        onClick={() => toggle(tag)}
                        className={`group inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all duration-500 cursor-pointer
                            ${isSelected
                                ? 'border-ice-400/50 bg-gradient-to-r from-ice-400/15 to-ice-300/10 text-ice-700 shadow-[0_0_14px_rgba(54,185,255,0.12)] scale-[1.04]'
                                : 'border-space-200/40 bg-white/40 text-space-600 hover:bg-white/70 hover:border-ice-300/30 hover:scale-[1.02]'
                            }`}
                    >
                        <span className="text-sm transition-transform duration-300 group-hover:scale-110">{emoji}</span>
                        <span>{displayLabel}</span>
                    </button>
                );
            })}
        </div>
    );
};

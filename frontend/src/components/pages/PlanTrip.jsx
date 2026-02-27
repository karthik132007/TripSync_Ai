import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, Send, Compass } from 'lucide-react';
import { MonthSelector } from '../plantrip/MonthSelector';
import { BudgetSlider } from '../plantrip/BudgetSlider';
import { DurationInput } from '../plantrip/DurationInput';
import { TravelTypeSelector } from '../plantrip/TravelTypeSelector';
import { ClimateSelector } from '../plantrip/ClimateSelector';
import { TagSelector } from '../plantrip/TagSelector';
import { PopularitySelector } from '../plantrip/PopularitySelector';
import { AmbientParticles } from '../ui/AmbientParticles';
import { API_CONFIG, getApiUrl } from '../../config/api';

// ─── Scroll reveal hook ─────────────────────────────────────────────────
const useScrollReveal = (threshold = 0.15) => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(el);
                }
            },
            { threshold }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold]);

    return { ref, isVisible };
};

// ─── Journey step wrapper ───────────────────────────────────────────────
const JourneyStep = ({ number, question, hint, children, delay = 0 }) => {
    const { ref, isVisible } = useScrollReveal(0.1);

    return (
        <div
            ref={ref}
            className={`transition-all duration-[900ms] ease-out ${isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-10'
                }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className="relative rounded-3xl border border-white/20 bg-white/[0.06] backdrop-blur-xl p-8 sm:p-10 transition-all duration-500 hover:bg-white/[0.10] hover:border-white/30 hover:shadow-[0_20px_80px_rgba(166,227,233,0.05)]">
                {/* Step marker */}
                <div className="flex items-center gap-3 mb-7">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral-400/20 to-ice-400/15 border border-white/20 flex items-center justify-center">
                        <span className="text-[11px] font-mono font-bold text-coral-400 tracking-wider">
                            {String(number).padStart(2, '0')}
                        </span>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-coral-400/10 via-ice-300/8 to-transparent" />
                </div>

                {/* Question */}
                <h3 className="text-2xl sm:text-3xl font-mono font-bold text-space-800 tracking-tight leading-snug mb-2">
                    {question}
                </h3>

                {hint && (
                    <p className="text-sm text-space-400 mb-8 leading-relaxed max-w-lg">{hint}</p>
                )}
                {!hint && <div className="mb-8" />}

                {children}
            </div>
        </div>
    );
};

export const PlanTrip = () => {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [month, setMonth] = useState([]);
    const [budget, setBudget] = useState(50000);
    const [duration, setDuration] = useState(5);
    const [bestFor, setBestFor] = useState('');
    const [climate, setClimate] = useState([]);
    const [tags, setTags] = useState([]);
    const [popularity, setPopularity] = useState('');

    const isFormValid = month.length > 0 && bestFor && climate.length > 0 && tags.length > 0 && popularity;

    const handleSubmit = async () => {
        if (!isFormValid) return;

        const payload = {
            month: month.map((m) => m.toLowerCase()),
            budget,
            duration: duration,
            best_for: bestFor,
            weather: climate,
            tags,
            popular: popularity,
        };

        // Save preferences stringified for the AI planner on the Place details page
        localStorage.setItem('tripPreferences', JSON.stringify(payload));

        console.log('🚀 Trip Preferences:', JSON.stringify(payload, null, 2));
        setIsSubmitting(true);

        try {
            const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.RECOMMEND), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!response.ok) throw new Error('Request failed');
            const data = await response.json();
            console.log('✅ Recommendations:', data);

            // Navigate to recommendations page with data
            if (data && data.data) {
                navigate('/recommend', { state: { recommendations: data.data } });
            }
        } catch (err) {
            console.log('⚠️ Backend not connected yet. Payload ready:', payload);
        } finally {
            setIsSubmitting(false);
        }
    };

    const heroReveal = useScrollReveal(0.05);

    return (
        <div className="relative min-h-screen overflow-hidden">

            {/* ===== BACKGROUND LAYERS (UNCHANGED) ===== */}

            <div className="fixed inset-0 bg-gradient-to-br from-space-50 via-white to-ice-50/30 z-0" />

            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div
                    className="absolute w-[800px] h-[800px] rounded-full animate-blob opacity-[0.12]"
                    style={{ background: 'radial-gradient(circle, #A6E3E9 0%, transparent 70%)', top: '-15%', right: '-10%', filter: 'blur(120px)' }}
                />
                <div
                    className="absolute w-[600px] h-[600px] rounded-full animate-blob animation-delay-2000 opacity-[0.08]"
                    style={{ background: 'radial-gradient(circle, #FFD1D1 0%, transparent 70%)', top: '40%', left: '-10%', filter: 'blur(100px)' }}
                />
                <div
                    className="absolute w-[700px] h-[700px] rounded-full animate-blob animation-delay-4000 opacity-[0.06]"
                    style={{ background: 'radial-gradient(circle, #FF9494 0%, transparent 70%)', bottom: '-10%', right: '20%', filter: 'blur(110px)' }}
                />
                <div
                    className="absolute w-[500px] h-[500px] rounded-full animate-blob opacity-[0.05]"
                    style={{ background: 'radial-gradient(circle, #b6eaee 0%, transparent 70%)', top: '60%', left: '40%', filter: 'blur(90px)', animationDelay: '6s' }}
                />
            </div>

            <div className="fixed inset-0 pointer-events-none z-[1]">
                <AmbientParticles />
            </div>

            <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-[1]" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, #A6E3E9 0.6px, transparent 0)',
                backgroundSize: '32px 32px',
            }} />

            <div className="fixed inset-0 opacity-[0.015] pointer-events-none z-[1]" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
            }} />

            {/* ===== MAIN CONTENT — VERTICAL STORYTELLING FLOW ===== */}
            <div className="relative z-10">

                {/* ─── Hero ─────────────────────────────────────── */}
                <div className="max-w-[1050px] mx-auto px-6 sm:px-10 lg:px-16 pt-28 pb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="group inline-flex items-center gap-1.5 text-space-400 hover:text-coral-500 transition-colors duration-200 mb-20 cursor-pointer"
                    >
                        <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform duration-200" />
                        <span className="text-xs font-medium tracking-widest uppercase">Back</span>
                    </button>

                    <div
                        ref={heroReveal.ref}
                        className={`max-w-2xl transition-all duration-[1000ms] ease-out ${heroReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                    >
                        <div className="flex items-center gap-2.5 mb-5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-coral-400/20 to-ice-400/20 flex items-center justify-center">
                                <Compass size={16} className="text-coral-400" />
                            </div>
                            <span className="text-xs font-mono font-bold text-coral-400/80 tracking-[0.2em] uppercase">
                                AI Trip Planner
                            </span>
                        </div>

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-space-900 tracking-tight leading-[1.05] mb-5">
                            We're designing<br />
                            your next{' '}
                            <span className="text-gradient">experience</span>
                        </h1>

                        <p className="text-lg text-space-400 leading-relaxed max-w-lg">
                            Answer a few questions and our AI will curate destinations that match your soul — not just your search history.
                        </p>
                    </div>
                </div>

                {/* ─── Journey steps — vertical flow ────────────── */}
                <div className="max-w-[1050px] mx-auto px-6 sm:px-10 lg:px-16 pt-20 pb-32 space-y-16 sm:space-y-20">

                    <JourneyStep
                        number={1}
                        question="When's the adventure happening?"
                        hint="Pick all the months that work — the more flexible, the better our picks"
                        delay={0}
                    >
                        <MonthSelector value={month} onChange={setMonth} />
                    </JourneyStep>

                    <JourneyStep
                        number={2}
                        question="How heavy is the wallet feeling?"
                        hint="No judgment — just slide to your comfort zone"
                        delay={50}
                    >
                        <BudgetSlider value={budget} onChange={setBudget} />
                    </JourneyStep>

                    <JourneyStep
                        number={3}
                        question="How many days of freedom?"
                        delay={50}
                    >
                        <DurationInput value={duration} onChange={setDuration} />
                    </JourneyStep>

                    <JourneyStep
                        number={4}
                        question="Who's coming along for the ride?"
                        hint="Your crew shapes the whole journey"
                        delay={50}
                    >
                        <TravelTypeSelector value={bestFor} onChange={setBestFor} />
                    </JourneyStep>

                    <JourneyStep
                        number={5}
                        question="What weather do you vibe with?"
                        hint="Pick as many as you'd like — variety is the spice of travel"
                        delay={50}
                    >
                        <ClimateSelector value={climate} onChange={setClimate} />
                    </JourneyStep>

                    <JourneyStep
                        number={6}
                        question="What lights you up? 🔥"
                        hint="Choose the experiences that make your heart race"
                        delay={50}
                    >
                        <TagSelector value={tags} onChange={setTags} />
                    </JourneyStep>

                    <JourneyStep
                        number={7}
                        question="Hidden gem or crowd favorite?"
                        hint="How off the beaten path do you want to go?"
                        delay={50}
                    >
                        <PopularitySelector value={popularity} onChange={setPopularity} />
                    </JourneyStep>

                    {/* ─── CTA ──────────────────────────────────── */}
                    <div className="pt-8">
                        <div className="flex flex-col sm:flex-row items-start gap-5">
                            <button
                                onClick={handleSubmit}
                                disabled={!isFormValid || isSubmitting}
                                className={`group relative inline-flex items-center gap-3 px-12 py-5 rounded-full text-lg font-bold transition-all duration-500 cursor-pointer overflow-hidden
                                    ${isFormValid
                                        ? 'bg-gradient-to-r from-coral-400 via-blush-400 to-ice-400 text-white shadow-[0_8px_40px_rgba(255,148,148,0.25)] hover:shadow-[0_12px_56px_rgba(255,148,148,0.35)] hover:-translate-y-1 hover:scale-[1.02]'
                                        : 'bg-space-100/60 backdrop-blur-md text-space-400 cursor-not-allowed'
                                    }`}
                            >
                                {isFormValid && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                )}

                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span className="relative">Crafting your journey...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={20} className="relative group-hover:rotate-12 transition-transform duration-500" />
                                        <span className="relative">Generate My Trip</span>
                                        <Send size={18} className="relative group-hover:translate-x-1 transition-transform duration-300" />
                                    </>
                                )}
                            </button>

                            {!isFormValid && (
                                <p className="text-sm text-space-400 pt-1 sm:pt-4 font-medium">
                                    Complete all steps to unlock AI recommendations ✨
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowLeft, ArrowRight, Send, Compass, CheckCircle2 } from 'lucide-react';
import { MonthSelector } from '../plantrip/MonthSelector';
import { BudgetSlider } from '../plantrip/BudgetSlider';
import { DurationInput } from '../plantrip/DurationInput';
import { TravelTypeSelector } from '../plantrip/TravelTypeSelector';
import { ClimateSelector } from '../plantrip/ClimateSelector';
import { TagSelector } from '../plantrip/TagSelector';
import { PopularitySelector } from '../plantrip/PopularitySelector';
import { Loader } from '../ui/Loader';
import { API_CONFIG, getApiUrl } from '../../config/api';

const TOTAL_SLIDES = 2;

const slideConfig = [
    { step: 1, total: 2, title: 'Travel Style', subtitle: 'What kind of traveler are you?', description: 'Select the styles that resonate with your dream trip. TripSync AI uses these preferences to curate a bespoke itinerary just for you.' },
    { step: 2, total: 2, title: 'Trip Details', subtitle: 'Tell us about your perfect trip', description: 'Help us dial in the specifics — dates, duration, climate, and the experiences that light you up.' },
];

export const PlanTrip = () => {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [direction, setDirection] = useState('next'); // 'next' or 'prev'
    const containerRef = useRef(null);

    // Form state
    const [month, setMonth] = useState([]);
    const [budget, setBudget] = useState(50000);
    const [duration, setDuration] = useState(5);
    const [bestFor, setBestFor] = useState('');
    const [climate, setClimate] = useState([]);
    const [tags, setTags] = useState([]);
    const [popularity, setPopularity] = useState('');

    const isSlide1Valid = bestFor && popularity;
    const isSlide2Valid = month.length > 0 && climate.length > 0 && tags.length > 0;
    const isFormValid = isSlide1Valid && isSlide2Valid;

    const goNext = () => {
        if (currentSlide < TOTAL_SLIDES - 1) {
            setDirection('next');
            setCurrentSlide(currentSlide + 1);
            containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const goBack = () => {
        if (currentSlide > 0) {
            setDirection('prev');
            setCurrentSlide(currentSlide - 1);
            containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            navigate('/');
        }
    };

    const handleSubmit = async () => {
        if (!isFormValid) return;

        const payload = {
            month: month.map((m) => m.toLowerCase()),
            budget,
            duration,
            best_for: bestFor,
            weather: climate,
            tags,
            popular: popularity,
        };

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
            if (data?.data) {
                navigate('/recommend', { state: { recommendations: data.data } });
            }
        } catch (err) {
            console.log('⚠️ Backend not connected yet. Payload ready:', payload);
        } finally {
            setIsSubmitting(false);
        }
    };

    const config = slideConfig[currentSlide];
    const progress = ((currentSlide + 1) / TOTAL_SLIDES) * 100;

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-space-50 via-white to-ice-50/30" ref={containerRef}>

            {/* ===== BACKGROUND ===== */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute w-[700px] h-[700px] rounded-full animate-blob opacity-[0.10]"
                    style={{ background: 'radial-gradient(circle, #7ad1ff 0%, transparent 70%)', top: '-10%', right: '-10%', filter: 'blur(120px)' }} />
                <div className="absolute w-[500px] h-[500px] rounded-full animate-blob animation-delay-2000 opacity-[0.07]"
                    style={{ background: 'radial-gradient(circle, #ffb3c7 0%, transparent 70%)', top: '50%', left: '-10%', filter: 'blur(100px)' }} />
                <div className="absolute w-[600px] h-[600px] rounded-full animate-blob animation-delay-4000 opacity-[0.05]"
                    style={{ background: 'radial-gradient(circle, #36b9ff 0%, transparent 70%)', bottom: '-15%', right: '25%', filter: 'blur(110px)' }} />
            </div>

            <div className="fixed inset-0 opacity-[0.025] pointer-events-none z-[1]" style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, #36b9ff 0.5px, transparent 0)',
                backgroundSize: '36px 36px',
            }} />

            {/* ===== MAIN CONTENT ===== */}
            <div className="relative z-10 max-w-[960px] mx-auto px-6 sm:px-10 pt-28 pb-16 min-h-screen flex flex-col">

                {/* ── Step Indicator Header ── */}
                <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-space-100/50 shadow-[0_4px_24px_rgba(54,185,255,0.06)] p-6 sm:p-8 mb-10">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-xs font-bold text-ice-500 tracking-[0.2em] uppercase mb-1">
                                Step {config.step} of {config.total}
                            </p>
                            <h2 className="text-2xl sm:text-3xl font-black text-space-800 tracking-tight">
                                {config.title}
                            </h2>
                        </div>
                        <div className="p-3 bg-ice-50 rounded-xl text-ice-500 hidden sm:block">
                            <Compass size={24} />
                        </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full bg-space-100 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-ice-400 to-ice-500 transition-all duration-700 ease-out relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_3s_ease-in-out_infinite] bg-[length:200%_100%]" />
                        </div>
                    </div>
                </div>

                {/* ── Slide Title ── */}
                <div className="text-center mb-10">
                    <h1
                        className="text-3xl sm:text-4xl md:text-5xl font-black text-space-800 tracking-tight mb-3 transition-all duration-500"
                        key={`title-${currentSlide}`}
                        style={{ animation: `fade-in-up 0.5s ease-out forwards` }}
                    >
                        {config.subtitle}
                    </h1>
                    <p
                        className="text-base text-space-500 font-light max-w-xl mx-auto leading-relaxed"
                        key={`desc-${currentSlide}`}
                        style={{ animation: `fade-in-up 0.6s ease-out 0.1s forwards`, opacity: 0 }}
                    >
                        {config.description}
                    </p>
                </div>

                {/* ── Slide Content ── */}
                <div className="flex-1">
                    <div
                        key={currentSlide}
                        style={{
                            animation: `fade-in-up 0.5s ease-out 0.15s forwards`,
                            opacity: 0,
                        }}
                    >
                        {currentSlide === 0 && (
                            <div className="space-y-8">
                                {/* Travel Type */}
                                <SectionCard
                                    title="Travel Style"
                                    description="Who's coming along for the ride?"
                                    delay={0}
                                >
                                    <TravelTypeSelector value={bestFor} onChange={setBestFor} />
                                </SectionCard>

                                {/* Popularity / Pace */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <SectionCard
                                        title="Preferred Pace"
                                        description="How off the beaten path do you want to go?"
                                        delay={100}
                                    >
                                        <PopularitySelector value={popularity} onChange={setPopularity} />
                                    </SectionCard>

                                    {/* Budget */}
                                    <SectionCard
                                        title="Trip Budget"
                                        description="Slide to your comfort zone"
                                        delay={200}
                                    >
                                        <BudgetSlider value={budget} onChange={setBudget} />
                                    </SectionCard>
                                </div>
                            </div>
                        )}

                        {currentSlide === 1 && (
                            <div className="space-y-8">
                                {/* Month + Duration side by side */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <SectionCard
                                        title="When's the adventure?"
                                        description="Pick months that work for you"
                                        delay={0}
                                    >
                                        <MonthSelector value={month} onChange={setMonth} />
                                    </SectionCard>

                                    <SectionCard
                                        title="Duration"
                                        description="How many days of freedom?"
                                        delay={100}
                                    >
                                        <DurationInput value={duration} onChange={setDuration} />
                                    </SectionCard>
                                </div>

                                {/* Climate */}
                                <SectionCard
                                    title="Weather Vibes"
                                    description="Pick the climates you love"
                                    delay={200}
                                >
                                    <ClimateSelector value={climate} onChange={setClimate} />
                                </SectionCard>

                                {/* Tags */}
                                <SectionCard
                                    title="What lights you up? 🔥"
                                    description="Choose the experiences that make your heart race"
                                    delay={300}
                                >
                                    <TagSelector value={tags} onChange={setTags} />
                                </SectionCard>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Navigation Bar ── */}
                <div className="mt-12 pt-6 border-t border-space-100/50 flex items-center justify-between">
                    <button
                        onClick={goBack}
                        className="inline-flex items-center gap-2 text-space-500 hover:text-ice-600 font-medium text-sm transition-colors duration-200 cursor-pointer group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
                        Back
                    </button>

                    {currentSlide < TOTAL_SLIDES - 1 ? (
                        <button
                            onClick={goNext}
                            disabled={!isSlide1Valid}
                            className={`inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-semibold text-[15px] transition-all duration-500 cursor-pointer
                                ${isSlide1Valid
                                    ? 'btn-gradient shadow-lg shadow-ice-400/20 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(54,185,255,0.25)]'
                                    : 'bg-space-100 text-space-400 cursor-not-allowed'
                                }`}
                        >
                            Continue
                            <ArrowRight size={16} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!isFormValid || isSubmitting}
                            className={`group relative inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full font-semibold text-[15px] transition-all duration-500 cursor-pointer overflow-hidden
                                ${isFormValid
                                    ? 'btn-gradient shadow-lg shadow-ice-400/20 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(54,185,255,0.25)]'
                                    : 'bg-space-100 text-space-400 cursor-not-allowed'
                                }`}
                        >
                            {isFormValid && (
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            )}
                            {isSubmitting ? (
                                <>
                                    <Loader size="sm" text="Crafting your journey..." flexRow />
                                </>
                            ) : (
                                <>
                                    <Sparkles size={17} className="relative" />
                                    <span className="relative">Generate My Trip</span>
                                    <Send size={15} className="relative group-hover:translate-x-0.5 transition-transform" />
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Validation hint */}
                {currentSlide === 0 && !isSlide1Valid && (
                    <p className="text-center text-sm text-space-400 mt-4 font-medium">
                        Select a travel style and pace to continue ✨
                    </p>
                )}
                {currentSlide === 1 && !isSlide2Valid && (
                    <p className="text-center text-sm text-space-400 mt-4 font-medium">
                        Complete all sections to generate your trip ✨
                    </p>
                )}
            </div>
        </div>
    );
};

/* ─── Section Card Component ──────────────────────────────────── */
const SectionCard = ({ title, description, children, delay = 0 }) => {
    return (
        <div
            className="rounded-2xl bg-white/70 backdrop-blur-xl border border-space-100/50 shadow-[0_4px_24px_rgba(54,185,255,0.04)] p-6 sm:p-8 transition-all duration-500 hover:shadow-[0_8px_40px_rgba(54,185,255,0.08)] hover:border-ice-200/40"
            style={{
                animation: `fade-in-up 0.5s ease-out ${delay + 200}ms forwards`,
                opacity: 0,
            }}
        >
            <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-ice-400" />
                <h3 className="text-lg font-bold text-space-800 tracking-tight">{title}</h3>
            </div>
            {description && (
                <p className="text-sm text-space-500 mb-6 ml-5">{description}</p>
            )}
            <div className="ml-0">
                {children}
            </div>
        </div>
    );
};

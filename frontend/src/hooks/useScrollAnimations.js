import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for scroll-driven reveal animations.
 * Elements fade/slide in when they enter the viewport.
 *
 * @param {Object} options
 * @param {number} options.threshold - Intersection threshold (0-1)
 * @param {string} options.rootMargin - IntersectionObserver rootMargin
 * @returns {{ ref: React.RefObject, isVisible: boolean }}
 */
export const useScrollReveal = ({ threshold = 0.15, rootMargin = '0px 0px -60px 0px' } = {}) => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(element);
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [threshold, rootMargin]);

    return { ref, isVisible };
};

/**
 * Custom hook for parallax scrolling effect.
 * Returns a Y offset based on scroll position relative to element.
 *
 * @param {number} speed - Parallax speed multiplier (0.1 = subtle, 0.5 = strong)
 * @returns {{ ref: React.RefObject, offset: number }}
 */
export const useParallax = (speed = 0.15) => {
    const ref = useRef(null);
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            if (!ref.current) return;
            const rect = ref.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            // Calculate how far into viewport — centered = 0
            const centerOffset = rect.top - windowHeight / 2 + rect.height / 2;
            setOffset(centerOffset * speed);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [speed]);

    return { ref, offset };
};

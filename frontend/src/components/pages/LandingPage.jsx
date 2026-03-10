import React from 'react';
import { Hero } from '../sections/Hero';
import { AIPersonalization } from '../sections/AIPersonalization';
import { FeaturedDestinations } from '../sections/FeaturedDestinations';
import { CTASection } from '../sections/CTASection';

export const LandingPage = () => {
    return (
        <>
            <Hero />
            <AIPersonalization />
            <FeaturedDestinations />
            <CTASection />
        </>
    );
};

import React from 'react';
import { Hero } from '../sections/Hero';
import { Stats } from '../sections/Stats';
import { HowItWorks } from '../sections/HowItWorks';
import { FeaturedDestinations } from '../sections/FeaturedDestinations';
import { WhyTripSync } from '../sections/WhyTripSync';

export const LandingPage = () => {
    return (
        <>
            <Hero />
            <Stats />
            <HowItWorks />
            <FeaturedDestinations />
            <WhyTripSync />
        </>
    );
};

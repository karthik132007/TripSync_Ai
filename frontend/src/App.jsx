import React from 'react';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/sections/Hero';
import { HowItWorks } from './components/sections/HowItWorks';
import { FeaturedDestinations } from './components/sections/FeaturedDestinations';
import { WhyTripSync } from './components/sections/WhyTripSync';
import { Stats } from './components/sections/Stats';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-space-900 selection:bg-ice-300/40 selection:text-space-900">

      <Navbar />

      <main className="flex-grow">
        <Hero />
        <Stats />
        <HowItWorks />
        <FeaturedDestinations />
        <WhyTripSync />
      </main>

      <Footer />
    </div>
  );
}

export default App;

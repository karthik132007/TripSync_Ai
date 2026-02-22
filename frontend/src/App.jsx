import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './components/pages/LandingPage';
import { PlanTrip } from './components/pages/PlanTrip';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-space-900 selection:bg-ice-300/40 selection:text-space-900">

      <Navbar />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/plan" element={<PlanTrip />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;

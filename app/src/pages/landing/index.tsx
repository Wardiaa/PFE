import React, { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import FeaturesPinned from './components/FeaturesPinned';
import HowItWorks from './components/HowItWorks';
import StatsSection from './components/StatsSection';
import TrustedBy from './components/TrustedBy';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import '../../home.css'; // Import the scoped CSS

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

const Home: React.FC = () => {
  useEffect(() => {
    // Clean up ScrollTrigger on unmount
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <div className="landing-page relative bg-white">
      <div className="grain"></div> {/* Add grain element here */}
      <Navbar />
      <main className="overflow-x-hidden">
        <Hero />
        <TrustedBy />
        <FeaturesPinned />
        <StatsSection />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
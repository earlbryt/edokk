
import React from 'react';
import Navbar from '@/components/Layout/Navbar';
import Hero from '@/components/Landing/Hero';
import Features from '@/components/Landing/Features';
import CTA from '@/components/Landing/CTA';
import Footer from '@/components/Layout/Footer';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <CTA />
      <Footer />
    </div>
  );
};

export default Landing;

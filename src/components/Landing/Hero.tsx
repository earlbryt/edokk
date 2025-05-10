import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const Hero: React.FC = () => {
  return (
    <section className="relative pt-16 pb-16 md:pt-24 md:pb-20 lg:py-32 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-lens-purple/5 to-white z-0"></div>
      <div className="absolute top-1/4 right-0 w-64 h-64 bg-lens-purple/10 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-lens-blue/10 rounded-full filter blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Text content */}
          <div className="max-w-xl">
            <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl tracking-tight text-gray-900 mb-6 animate-fade-in">
              Find Your <span className="text-lens-purple">Perfect</span> Candidates Faster
            </h1>
            <p className="text-xl text-gray-600 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Transform your hiring process with our intelligent CV analysis platform. Reduce screening time by 80% and match the right talent to the right roles.
            </p>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <Link to="/signup">
                <Button size="lg" className="rounded-full px-8 py-6 text-lg bg-lens-purple hover:bg-lens-purple-light">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-lg border-lens-purple text-lens-purple hover:bg-lens-purple/5">
                  Log In <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            
            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-x-6">
              <div>
                <p className="text-3xl font-bold text-lens-purple">80%</p>
                <p className="text-sm text-gray-600">Time Saved</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-lens-purple">3x</p>
                <p className="text-sm text-gray-600">Hiring Efficiency</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-lens-purple">95%</p>
                <p className="text-sm text-gray-600">Match Accuracy</p>
              </div>
            </div>
          </div>
          
          {/* Right side - Dashboard preview */}
          <div className="relative lg:ml-auto">
            <div className="relative z-10 rounded-xl shadow-lg overflow-hidden">
              <img 
                src="/3d-dashboard.png" 
                alt="Lens Dashboard" 
                className="w-full h-auto"
              />
            </div>
            
            {/* Floating elements */}
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-lens-purple/20 rounded-lg rotate-12 z-0"></div>
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-lens-blue/20 rounded-lg -rotate-12 z-0"></div>
            
            {/* Floating card */}
            <div className="absolute -bottom-10 -right-10 bg-white p-4 rounded-lg shadow-lg border border-gray-100 z-20 hidden md:block">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">Perfect Match Found</p>
                  <p className="text-xs text-gray-500">12 candidates matched</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

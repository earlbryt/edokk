
import React from 'react';
import { Button } from "@/components/ui/button";

const Hero: React.FC = () => {
  return (
    <section className="relative pt-24 pb-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-white z-0"></div>
      <div className="absolute top-1/4 right-0 w-64 h-64 bg-lens-purple/10 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-lens-blue/10 rounded-full filter blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="font-display font-bold text-5xl md:text-6xl lg:text-7xl tracking-tight text-gray-900 mb-6 animate-fade-in">
            AI-Powered Recruitment Screening Platform
          </h1>
          <p className="text-xl text-gray-600 mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Transform your hiring process with our intelligent CV analysis platform. Reduce screening time by 80% and find the best candidates faster than ever before.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button size="lg" className="rounded-full px-8 py-6 text-lg bg-lens-purple hover:bg-lens-purple-light">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-lg">
              Schedule Demo
            </Button>
          </div>
        </div>
        
        <div className="mt-16 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="relative mx-auto max-w-5xl shadow-2xl rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10 pointer-events-none rounded-2xl"></div>
            <img 
              src="public/lovable-uploads/66af0d12-0137-4d14-a805-664900e08784.png" 
              alt="Lens Dashboard Preview" 
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

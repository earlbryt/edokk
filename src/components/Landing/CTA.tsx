
import React from 'react';
import { Button } from "@/components/ui/button";

const CTA: React.FC = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-lens-purple/90 to-blue-600/90 text-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-display text-4xl font-bold mb-6">Ready to Transform Your Recruitment Process?</h2>
          <p className="text-xl mb-10 text-white/90">
            Join forward-thinking recruiting agencies and HR departments who have already cut their screening time by 80%. 
            Start your free trial today and see the difference.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="rounded-full px-8 py-6 text-lg bg-white text-lens-purple hover:bg-gray-100">
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-lg border-white text-white hover:bg-white/10">
              Schedule a Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;

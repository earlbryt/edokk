import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Star, ArrowRight } from "lucide-react";

const CTA: React.FC = () => {


  return (
    <section className="py-20 px-4 bg-gradient-to-br from-lens-purple/90 to-blue-600/90 text-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/5 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">

        
        {/* Main CTA */}
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-display text-4xl font-bold mb-6">Ready to Transform Your Recruitment Process?</h2>
          <p className="text-xl mb-10 text-white/90">
            Join forward-thinking recruiting agencies and HR departments who have already cut their screening time by 80%.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="rounded-full px-8 py-6 text-lg bg-white text-lens-purple hover:bg-gray-100">
                Get Started Free
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-lg border-white text-white bg-lens-purple/20 hover:bg-lens-purple/30">
                Log In <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;

import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Star, ArrowRight } from "lucide-react";

const CTA: React.FC = () => {
  // Testimonial data
  const testimonials = [
    {
      quote: "Lens has completely transformed our hiring process. We're finding better candidates in half the time.",
      author: "Sarah Johnson",
      role: "HR Director",
      company: "TechCorp",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    },
    {
      quote: "The candidate bucketing feature alone has saved our team countless hours of manual screening.",
      author: "Michael Chen",
      role: "Talent Acquisition Lead",
      company: "InnovateCo",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    }
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-lens-purple/90 to-blue-600/90 text-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/5 rounded-full"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm p-6 rounded-xl border border-white/20">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-lg mb-4">"{testimonial.quote}"</p>
              <div className="flex items-center gap-4">
                <img 
                  src={testimonial.avatar} 
                  alt={testimonial.author} 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium">{testimonial.author}</p>
                  <p className="text-sm text-white/80">{testimonial.role}, {testimonial.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Main CTA */}
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="font-display text-4xl font-bold mb-6">Ready to Transform Your Recruitment Process?</h2>
          <p className="text-xl mb-10 text-white/90">
            Join forward-thinking recruiting agencies and HR departments who have already cut their screening time by 80%. 
            Start your free trial today and see the difference.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="rounded-full px-8 py-6 text-lg bg-white text-lens-purple hover:bg-gray-100">
                Get Started Free
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-lg border-white text-white hover:bg-white/10">
                Log In <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-white/80">No credit card required. 14-day free trial.</p>
        </div>
      </div>
    </section>
  );
};

export default CTA;

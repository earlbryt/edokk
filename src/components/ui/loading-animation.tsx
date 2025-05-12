import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './card';
import { User, Brain, Sparkles, FileText, Search, Award, Clock } from 'lucide-react';

interface LoadingAnimationProps {
  message?: string;
}

const recruitingFacts = [
  {
    fact: "Recruiters spend an average of just 7 seconds scanning a resume initially.",
    icon: <FileText className="h-6 w-6 text-lens-purple" />
  },
  {
    fact: "Top candidates are typically off the market within 10 days.",
    icon: <Clock className="h-6 w-6 text-lens-purple" />
  },
  {
    fact: "63% of job seekers have declined offers due to poor candidate experience.",
    icon: <User className="h-6 w-6 text-lens-purple" />
  },
  {
    fact: "AI-powered recruitment tools can reduce time-to-hire by up to 70%.",
    icon: <Brain className="h-6 w-6 text-lens-purple" />
  },
  {
    fact: "Companies with diverse teams outperform their competitors by 35%.",
    icon: <Award className="h-6 w-6 text-lens-purple" />
  },
  {
    fact: "Soft skills assessment improves hiring success rates by 25%.",
    icon: <Sparkles className="h-6 w-6 text-lens-purple" />
  },
  {
    fact: "Candidate experience directly impacts consumer brand perception and revenue.",
    icon: <User className="h-6 w-6 text-lens-purple" />
  },
  {
    fact: "Peer-to-peer recruiting yields 7x more candidate responses than cold outreach.",
    icon: <Search className="h-6 w-6 text-lens-purple" />
  }
];

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ message = "Loading data..." }) => {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  // Change fact every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFactIndex(prev => (prev + 1) % recruitingFacts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentFact = recruitingFacts[currentFactIndex];

  return (
    <div className="w-full min-h-[300px] flex items-center justify-center">
      <Card className="w-full max-w-md border-lens-purple/20 shadow-lg animate-pulse-slow">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-6">
            {/* Loading spinner */}
            <div className="relative">
              <div className="w-20 h-20 border-4 border-lens-purple/30 rounded-full animate-spin-slow"></div>
              <div className="w-20 h-20 border-4 border-transparent border-t-lens-purple rounded-full animate-spin absolute inset-0"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                {currentFact.icon}
              </div>
            </div>
            
            {/* Message */}
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-800">{message}</p>
              <div className="h-24 flex items-center justify-center mt-4">
                <p className="text-sm text-gray-600 max-w-sm transition-opacity duration-500">
                  <span className="font-medium text-lens-purple">Did you know?</span> {currentFact.fact}
                </p>
              </div>
            </div>
            
            {/* Progress dots */}
            <div className="flex gap-1.5">
              {recruitingFacts.map((_, index) => (
                <div 
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                    index === currentFactIndex 
                      ? 'bg-lens-purple' 
                      : 'bg-gray-300'
                  }`}
                ></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoadingAnimation;

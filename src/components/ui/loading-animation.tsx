import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './card';
import { Heart, Pill, Apple, Brain, Stethoscope, ShieldCheck, Flower2, Clock } from 'lucide-react';

interface LoadingAnimationProps {
  message?: string;
}

const healthcareFacts = [
  {
    fact: "Regular virtual consultations can reduce hospital readmissions by up to 45%.",
    icon: <Stethoscope className="h-6 w-6 text-lens-purple" />
  },
  {
    fact: "Patients who use telemedicine save an average of 100 minutes per visit compared to in-person appointments.",
    icon: <Clock className="h-6 w-6 text-lens-purple" />
  },
  {
    fact: "78% of patients report better medication adherence with digital reminders and prescription delivery.",
    icon: <Pill className="h-6 w-6 text-lens-purple" />
  },
  {
    fact: "AI-powered symptom assessment can improve diagnostic accuracy by up to 30%.",
    icon: <Brain className="h-6 w-6 text-lens-purple" />
  },
  {
    fact: "Integrated health platforms reduce medical errors by 52% through better coordination of care.",
    icon: <ShieldCheck className="h-6 w-6 text-lens-purple" />
  },
  {
    fact: "Personalized nutrition plans can improve chronic condition management by 40%.",
    icon: <Apple className="h-6 w-6 text-lens-purple" />
  },
  {
    fact: "Mental health apps with AI support increase therapy session effectiveness by 35%.",
    icon: <Brain className="h-6 w-6 text-lens-purple" />
  },
  {
    fact: "Herbal medicine knowledge databases help identify beneficial interactions with conventional treatments.",
    icon: <Flower2 className="h-6 w-6 text-lens-purple" />
  }
];

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ message = "Loading data..." }) => {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  // Change fact every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFactIndex(prev => (prev + 1) % healthcareFacts.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentFact = healthcareFacts[currentFactIndex];

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
              {healthcareFacts.map((_, index) => (
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

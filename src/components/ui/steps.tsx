import React from 'react';
import { cn } from '@/lib/utils';

interface StepsProps {
  currentStep: number;
  className?: string;
  children: React.ReactNode;
}

export const Steps = ({ currentStep, className, children }: StepsProps) => {
  const steps = React.Children.toArray(children);
  
  return (
    <div className={cn("w-full", className)}>
      <div className="relative flex justify-between">
        {steps.map((step, idx) => {
          const isActive = currentStep === idx;
          const isCompleted = currentStep > idx;
          
          return React.cloneElement(step as React.ReactElement<StepProps>, {
            stepNumber: idx + 1,
            isActive,
            isCompleted
          });
        })}
        
        {/* Progress Bar */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-gray-200">
          <div 
            className="absolute left-0 top-0 h-full bg-primary transition-all"
            style={{ 
              width: `${Math.max(0, currentStep) * (100 / (steps.length - 1))}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
};

interface StepProps {
  title: string;
  icon?: React.ReactNode;
  stepNumber?: number;
  isActive?: boolean;
  isCompleted?: boolean;
}

export const Step = ({ 
  title, 
  icon, 
  stepNumber, 
  isActive = false, 
  isCompleted = false 
}: StepProps) => {
  return (
    <div className="relative z-10 flex flex-col items-center">
      <div 
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary text-sm font-medium",
          isActive ? "bg-primary text-primary-foreground" : 
          isCompleted ? "bg-primary text-primary-foreground" : 
          "bg-background text-muted-foreground"
        )}
      >
        {isCompleted ? (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : icon || stepNumber}
      </div>
      <span 
        className={cn(
          "mt-2 text-xs font-medium",
          isActive || isCompleted ? "text-primary" : "text-muted-foreground"
        )}
      >
        {title}
      </span>
    </div>
  );
};

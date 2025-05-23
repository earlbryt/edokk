import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md',
  showText = true 
}) => {
  // Size mappings
  const sizeMap = {
    sm: {
      container: 'h-8 w-8',
      text: 'text-lg'
    },
    md: {
      container: 'h-10 w-10',
      text: 'text-xl'
    },
    lg: {
      container: 'h-12 w-12',
      text: 'text-2xl'
    }
  };

  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeMap[size].container} bg-gradient-to-br from-lens-purple to-lens-purple-light rounded-full flex items-center justify-center text-white font-bold relative overflow-hidden`}>
        <span className="relative z-10">eD</span>
        <div className="absolute inset-0 bg-white/10 opacity-50 rounded-full scale-[0.85]"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-3 bg-white/20 rounded-b-full"></div>
      </div>
      {showText && (
        <span className={`font-display font-semibold ${sizeMap[size].text} bg-gradient-to-r from-lens-purple to-emerald-600 bg-clip-text text-transparent`}>
          eDok
        </span>
      )}
    </Link>
  );
};

export default Logo;

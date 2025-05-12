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
      <img 
        src="/assets/favicon/favicon.svg" 
        alt="Lens Logo" 
        className={`${sizeMap[size].container}`}
      />
      {showText && (
        <span className={`font-display font-semibold ${sizeMap[size].text}`}>
          Lens
        </span>
      )}
    </Link>
  );
};

export default Logo;

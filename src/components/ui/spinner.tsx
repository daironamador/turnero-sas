
import React from 'react';

interface SpinnerProps {
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ className = "h-12 w-12" }) => {
  return (
    <div className={`animate-spin rounded-full border-b-2 border-ocular-600 ${className}`}></div>
  );
};

export default Spinner;

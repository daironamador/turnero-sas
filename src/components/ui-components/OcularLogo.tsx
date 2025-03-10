
import React from 'react';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OcularLogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
}

const OcularLogo: React.FC<OcularLogoProps> = ({ 
  className, 
  iconClassName, 
  textClassName,
  showText = true
}) => {
  return (
    <div className={cn('flex items-center', className)}>
      <div className="relative">
        <Eye 
          className={cn(
            'w-8 h-8 text-ocular-600 transition-all duration-300',
            iconClassName
          )} 
        />
        <div className="absolute inset-0 bg-ocular-400/20 blur-md -z-10 rounded-full"></div>
      </div>
      {showText && (
        <span className={cn(
          'ml-2 text-xl font-semibold tracking-tight text-foreground',
          textClassName
        )}>
          OcularVision
        </span>
      )}
    </div>
  );
};

export default OcularLogo;

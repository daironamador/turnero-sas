
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  className?: string;
  iconClassName?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  className,
  iconClassName,
}) => {
  return (
    <Card className={cn('overflow-hidden hover-scale', className)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            
            {trend !== undefined && (
              <div className="flex items-center mt-2">
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600'
                  )}
                >
                  {trend > 0 ? '+' : ''}{trend}% {trendLabel || 'desde ayer'}
                </span>
              </div>
            )}
          </div>
          
          <div className={cn(
            'p-3 rounded-full bg-ocular-100/50',
            iconClassName
          )}>
            <Icon className="w-5 h-5 text-ocular-700" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;

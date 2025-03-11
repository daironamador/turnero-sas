
import React from 'react';

interface StatsCardProps {
  label: string;
  value: number;
  bgColor?: string;
  textColor?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  label, 
  value, 
  bgColor = 'bg-gray-100', 
  textColor = 'text-gray-500' 
}) => {
  return (
    <div className={`${bgColor} p-3 rounded-md min-w-[120px] text-center`}>
      <div className={`text-sm ${textColor}`}>{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
};

export default StatsCard;

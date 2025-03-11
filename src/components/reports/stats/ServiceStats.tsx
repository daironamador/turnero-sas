
import React from 'react';
import { Ticket, ServiceTypeLabels } from '@/lib/types';
import StatsCard from './StatsCard';

interface ServiceStatsProps {
  tickets: Ticket[];
}

const ServiceStats: React.FC<ServiceStatsProps> = ({ tickets }) => {
  const serviceStats: Record<string, number> = {};
  
  tickets.forEach(ticket => {
    const serviceType = ticket.serviceType;
    if (!serviceStats[serviceType]) {
      serviceStats[serviceType] = 0;
    }
    serviceStats[serviceType]++;
  });
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {Object.entries(serviceStats).map(([serviceType, count]) => (
        <StatsCard 
          key={serviceType}
          label={ServiceTypeLabels[serviceType as any]}
          value={count}
          bgColor="bg-ocular-50"
          textColor="text-ocular-600"
        />
      ))}
    </div>
  );
};

export default ServiceStats;


import React from 'react';
import { Ticket } from '@/lib/types';
import StatsCard from './StatsCard';

interface StatusStatsProps {
  tickets: Ticket[];
}

const StatusStats: React.FC<StatusStatsProps> = ({ tickets }) => {
  const totalTickets = tickets.length;
  const completedTickets = tickets.filter(t => t.status === 'completed').length;
  const cancelledTickets = tickets.filter(t => t.status === 'cancelled').length;
  const redirectedTickets = tickets.filter(t => t.status === 'redirected').length;
  const vipTickets = tickets.filter(t => t.isVip).length;
  
  return (
    <div className="flex flex-wrap gap-4 mb-4">
      <StatsCard 
        label="Total" 
        value={totalTickets} 
      />
      <StatsCard 
        label="Completados" 
        value={completedTickets} 
        bgColor="bg-green-50" 
        textColor="text-green-600" 
      />
      <StatsCard 
        label="Cancelados" 
        value={cancelledTickets} 
        bgColor="bg-red-50" 
        textColor="text-red-600" 
      />
      <StatsCard 
        label="Redirigidos" 
        value={redirectedTickets} 
        bgColor="bg-blue-50" 
        textColor="text-blue-600" 
      />
      <StatsCard 
        label="VIP" 
        value={vipTickets} 
        bgColor="bg-yellow-50" 
        textColor="text-yellow-600" 
      />
    </div>
  );
};

export default StatusStats;

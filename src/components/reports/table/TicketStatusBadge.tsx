
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ServiceTypeLabels } from '@/lib/types';

interface TicketStatusBadgeProps {
  status: 'waiting' | 'serving' | 'completed' | 'cancelled' | 'redirected';
  redirectedTo?: string;
}

const TicketStatusBadge: React.FC<TicketStatusBadgeProps> = ({ status, redirectedTo }) => {
  const getBadgeClass = () => {
    switch (status) {
      case 'waiting':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'serving':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-100';
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'redirected':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-100';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'waiting':
        return 'En espera';
      case 'serving':
        return 'En atención';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      case 'redirected':
        return 'Redirigido';
    }
  };

  return (
    <>
      <Badge className={getBadgeClass()}>
        {getStatusLabel()}
      </Badge>
      
      {redirectedTo && (
        <Badge className="ml-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50">
          → {ServiceTypeLabels[redirectedTo as any]}
        </Badge>
      )}
    </>
  );
};

export default TicketStatusBadge;

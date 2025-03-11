
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket } from '@/lib/types';
import TicketQueueItem from './TicketQueueItem';

interface TicketQueueProps {
  waitingTickets: Ticket[];
}

const TicketQueue: React.FC<TicketQueueProps> = ({ waitingTickets }) => {
  if (waitingTickets.length === 0) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          Cola de Espera
          <Badge variant="secondary">{waitingTickets.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
          {waitingTickets.map((ticket, index) => (
            <TicketQueueItem 
              key={ticket.id} 
              ticket={ticket} 
              isNext={index === 0} 
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketQueue;

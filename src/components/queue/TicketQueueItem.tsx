
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { Ticket } from '@/lib/types';

interface TicketQueueItemProps {
  ticket: Ticket;
  isNext: boolean;
}

const TicketQueueItem: React.FC<TicketQueueItemProps> = ({ ticket, isNext }) => {
  return (
    <div className={`flex justify-between items-center p-2 rounded-md ${isNext ? 'bg-primary/5 border border-primary/20' : 'border-b last:border-b-0'}`}>
      <div className="flex items-center space-x-2">
        <Badge variant={isNext ? "default" : "outline"} className={isNext ? "bg-primary" : ""}>
          {ticket.ticketNumber}
        </Badge>
        {ticket.patientName && (
          <span className="text-sm">{ticket.patientName}</span>
        )}
      </div>
      <span className="text-xs text-muted-foreground">
        {format(new Date(ticket.createdAt), "h:mm a", { locale: es })}
      </span>
    </div>
  );
};

export default TicketQueueItem;

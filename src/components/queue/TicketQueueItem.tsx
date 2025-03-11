
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { Ticket } from '@/lib/types';
import { Star } from 'lucide-react';

interface TicketQueueItemProps {
  ticket: Ticket;
  isNext: boolean;
}

const TicketQueueItem: React.FC<TicketQueueItemProps> = ({ ticket, isNext }) => {
  const isVip = ticket.isVip;
  
  return (
    <div className={`flex justify-between items-center p-2 rounded-md ${
      isVip 
        ? 'bg-yellow-50 border border-yellow-300' 
        : isNext 
          ? 'bg-primary/5 border border-primary/20' 
          : 'border-b last:border-b-0'
    }`}>
      <div className="flex items-center space-x-2">
        <Badge 
          variant={isNext ? "default" : "outline"} 
          className={
            isVip 
              ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500" 
              : isNext 
                ? "bg-primary" 
                : ""
          }
        >
          {ticket.ticketNumber}
        </Badge>
        {ticket.patientName && (
          <span className="text-sm">{ticket.patientName}</span>
        )}
        {isVip && (
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
        )}
      </div>
      <span className="text-xs text-muted-foreground">
        {format(new Date(ticket.createdAt), "h:mm a", { locale: es })}
      </span>
    </div>
  );
};

export default TicketQueueItem;

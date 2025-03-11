
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket } from '@/lib/types';

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
            <div key={ticket.id} className={`flex justify-between items-center p-2 rounded-md ${index === 0 ? 'bg-primary/5 border border-primary/20' : 'border-b last:border-b-0'}`}>
              <div className="flex items-center space-x-2">
                <Badge variant={index === 0 ? "default" : "outline"} className={index === 0 ? "bg-primary" : ""}>
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketQueue;

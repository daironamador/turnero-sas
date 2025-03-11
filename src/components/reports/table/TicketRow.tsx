
import React from 'react';
import { Ticket, ServiceTypeLabels } from '@/lib/types';
import { format } from 'date-fns';
import { TableCell, TableRow } from '@/components/ui/table';
import { Star } from 'lucide-react';
import TicketStatusBadge from './TicketStatusBadge';

interface TicketRowProps {
  ticket: Ticket;
  getRoomDisplay: (counterNumber: string | null) => string;
}

const TicketRow: React.FC<TicketRowProps> = ({ ticket, getRoomDisplay }) => {
  const waitTimeMinutes = ticket.calledAt && ticket.createdAt 
    ? Math.round((ticket.calledAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60))
    : null;
    
  return (
    <TableRow>
      <TableCell className="font-medium">
        <div className="flex items-center">
          {ticket.ticketNumber}
          {ticket.isVip && (
            <Star className="ml-1 h-4 w-4 text-yellow-500" />
          )}
        </div>
      </TableCell>
      <TableCell>{ServiceTypeLabels[ticket.serviceType]}</TableCell>
      <TableCell>
        <TicketStatusBadge 
          status={ticket.status} 
          redirectedTo={ticket.redirectedTo} 
        />
      </TableCell>
      <TableCell>
        {ticket.patientName || '-'}
      </TableCell>
      <TableCell>
        {format(ticket.createdAt, 'dd/MM/yyyy')}
      </TableCell>
      <TableCell>
        {format(ticket.createdAt, 'HH:mm:ss')}
      </TableCell>
      <TableCell>
        {ticket.calledAt 
          ? format(ticket.calledAt, 'HH:mm:ss')
          : '-'}
      </TableCell>
      <TableCell>
        {waitTimeMinutes !== null 
          ? `${waitTimeMinutes.toString()} min`
          : '-'}
      </TableCell>
      <TableCell>
        {getRoomDisplay(ticket.counterNumber ? ticket.counterNumber.toString() : null)}
      </TableCell>
    </TableRow>
  );
};

export default TicketRow;

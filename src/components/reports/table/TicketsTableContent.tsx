
import React from 'react';
import { Ticket } from '@/lib/types';
import { TableBody, TableRow, TableCell } from '@/components/ui/table';
import TicketRow from './TicketRow';

interface TicketsTableContentProps {
  tickets: Ticket[];
  searchTerm: string;
  getRoomDisplay: (counterNumber: string | null) => string;
}

const TicketsTableContent: React.FC<TicketsTableContentProps> = ({ 
  tickets, 
  searchTerm,
  getRoomDisplay
}) => {
  const filteredTickets = tickets.filter(ticket => {
    const searchable = `${ticket.ticketNumber} ${ticket.serviceType} ${ticket.status} ${ticket.patientName || ''}`.toLowerCase();
    return searchable.includes(searchTerm.toLowerCase());
  });
  
  if (filteredTickets.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={9} className="text-center py-4 text-gray-500">
            No se encontraron tickets con el término de búsqueda
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }
  
  return (
    <TableBody>
      {filteredTickets.map((ticket) => (
        <TicketRow 
          key={ticket.id} 
          ticket={ticket} 
          getRoomDisplay={getRoomDisplay}
        />
      ))}
    </TableBody>
  );
};

export default TicketsTableContent;


import React, { useState } from 'react';
import { Ticket } from '@/lib/types';
import { Table, TableCaption, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { printReport } from '@/utils/printUtils';
import { useRooms } from './hooks/useRooms';
import StatusStats from './stats/StatusStats';
import ServiceStats from './stats/ServiceStats';
import TableControls from './search/TableControls';
import TicketsTableContent from './table/TicketsTableContent';

interface ReportsTableProps {
  tickets: Ticket[];
  startDate: Date;
  endDate: Date;
}

const ReportsTable: React.FC<ReportsTableProps> = ({ tickets, startDate, endDate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { getRoomDisplay } = useRooms();

  const handlePrintReport = () => {
    printReport(tickets, startDate, endDate);
  };
  
  const filteredTicketsCount = tickets.filter(ticket => {
    const searchable = `${ticket.ticketNumber} ${ticket.serviceType} ${ticket.status} ${ticket.patientName || ''}`.toLowerCase();
    return searchable.includes(searchTerm.toLowerCase());
  }).length;
  
  return (
    <div>
      <div className="mb-6">
        <StatusStats tickets={tickets} />
        <ServiceStats tickets={tickets} />
        
        <TableControls 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onPrintReport={handlePrintReport}
        />
      </div>
      
      <Table>
        <TableCaption>Total de tickets: {filteredTicketsCount}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket #</TableHead>
            <TableHead>Servicio</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Paciente</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Hora Creado</TableHead>
            <TableHead>Hora Llamado</TableHead>
            <TableHead>Tiempo Espera</TableHead>
            <TableHead>Sala</TableHead>
          </TableRow>
        </TableHeader>
        
        <TicketsTableContent 
          tickets={tickets}
          searchTerm={searchTerm}
          getRoomDisplay={getRoomDisplay}
        />
      </Table>
    </div>
  );
};

export default ReportsTable;


import React, { useState } from 'react';
import { Ticket, ServiceTypeLabels } from '@/lib/types';
import { format } from 'date-fns';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';

interface ReportsTableProps {
  tickets: Ticket[];
}

const ReportsTable: React.FC<ReportsTableProps> = ({ tickets }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter tickets based on search term
  const filteredTickets = tickets.filter(ticket => {
    const searchable = `${ticket.ticketNumber} ${ServiceTypeLabels[ticket.serviceType]} ${ticket.status}`.toLowerCase();
    return searchable.includes(searchTerm.toLowerCase());
  });
  
  // Calculate statistics
  const totalTickets = tickets.length;
  const completedTickets = tickets.filter(t => t.status === 'completed').length;
  const cancelledTickets = tickets.filter(t => t.status === 'cancelled').length;
  const redirectedTickets = tickets.filter(t => t.status === 'redirected').length;
  const waitingTickets = tickets.filter(t => t.status === 'waiting').length;
  const servingTickets = tickets.filter(t => t.status === 'serving').length;
  const vipTickets = tickets.filter(t => t.isVip).length;
  
  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="bg-gray-100 p-3 rounded-md min-w-[120px] text-center">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-2xl font-bold">{totalTickets}</div>
          </div>
          <div className="bg-green-50 p-3 rounded-md min-w-[120px] text-center">
            <div className="text-sm text-green-600">Completados</div>
            <div className="text-2xl font-bold text-green-700">{completedTickets}</div>
          </div>
          <div className="bg-red-50 p-3 rounded-md min-w-[120px] text-center">
            <div className="text-sm text-red-600">Cancelados</div>
            <div className="text-2xl font-bold text-red-700">{cancelledTickets}</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-md min-w-[120px] text-center">
            <div className="text-sm text-blue-600">Redirigidos</div>
            <div className="text-2xl font-bold text-blue-700">{redirectedTickets}</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-md min-w-[120px] text-center">
            <div className="text-sm text-yellow-600">VIP</div>
            <div className="text-2xl font-bold text-yellow-700">{vipTickets}</div>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <Input 
          placeholder="Buscar tickets..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      
      <Table>
        <TableCaption>Total de tickets: {filteredTickets.length}</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Ticket #</TableHead>
            <TableHead>Servicio</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Hora Creado</TableHead>
            <TableHead>Hora Llamado</TableHead>
            <TableHead>Tiempo Espera</TableHead>
            <TableHead>Sala</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTickets.map((ticket) => {
            // Calculate wait time
            const waitTimeMinutes = ticket.calledAt && ticket.createdAt 
              ? Math.round((ticket.calledAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60))
              : null;
              
            return (
              <TableRow key={ticket.id}>
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
                  <Badge
                    className={
                      ticket.status === 'waiting' 
                        ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                        : ticket.status === 'serving'
                          ? 'bg-orange-100 text-orange-800 hover:bg-orange-100'
                          : ticket.status === 'completed'
                            ? 'bg-green-100 text-green-800 hover:bg-green-100'
                            : ticket.status === 'cancelled'
                              ? 'bg-red-100 text-red-800 hover:bg-red-100'
                              : 'bg-purple-100 text-purple-800 hover:bg-purple-100'
                    }
                  >
                    {ticket.status === 'waiting' 
                      ? 'En espera' 
                      : ticket.status === 'serving'
                        ? 'En atención'
                        : ticket.status === 'completed'
                          ? 'Completado'
                          : ticket.status === 'cancelled'
                            ? 'Cancelado'
                            : 'Redirigido'}
                  </Badge>
                  {ticket.redirectedTo && (
                    <Badge className="ml-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50">
                      → {ServiceTypeLabels[ticket.redirectedTo]}
                    </Badge>
                  )}
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
                    ? `${waitTimeMinutes} min`
                    : '-'}
                </TableCell>
                <TableCell>
                  {ticket.counterNumber || '-'}
                </TableCell>
              </TableRow>
            );
          })}
          
          {filteredTickets.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                No se encontraron tickets con el término de búsqueda
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default ReportsTable;

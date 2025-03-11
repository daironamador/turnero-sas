
import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, RefreshCw, Forward, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Ticket, Room, Service } from '@/lib/types';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface TicketHistoryProps {
  counterNumber: string;
  rooms: Room[];
  services: Service[];
  onRecallTicket: (ticket: Ticket) => void;
}

const TicketHistory: React.FC<TicketHistoryProps> = ({
  counterNumber,
  rooms,
  services,
  onRecallTicket
}) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTicketHistory = async () => {
    setIsLoading(true);
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('counter_number', counterNumber)
        .gte('created_at', today.toISOString())
        .in('status', ['completed', 'redirected', 'cancelled'])
        .order('completed_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      const formattedTickets = data.map(ticket => ({
        id: ticket.id,
        ticketNumber: ticket.ticket_number,
        serviceType: ticket.service_type,
        status: ticket.status,
        isVip: ticket.is_vip,
        createdAt: new Date(ticket.created_at),
        calledAt: ticket.called_at ? new Date(ticket.called_at) : undefined,
        completedAt: ticket.completed_at ? new Date(ticket.completed_at) : undefined,
        counterNumber: ticket.counter_number,
        patientName: ticket.patient_name,
        redirectedTo: ticket.redirected_to,
        redirectedFrom: ticket.redirected_from,
        previousTicketNumber: ticket.previous_ticket_number,
      }));
      
      setTickets(formattedTickets);
    } catch (error) {
      console.error('Error fetching ticket history:', error);
      toast.error('No se pudo cargar el historial de tickets');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300"><CheckCircle className="h-3 w-3 mr-1" /> Completado</Badge>;
      case 'redirected':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300"><Forward className="h-3 w-3 mr-1" /> Redirigido</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300"><XCircle className="h-3 w-3 mr-1" /> Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Get service name from code
  const getServiceName = (code: string) => {
    const service = services.find(s => s.code === code);
    return service?.name || code;
  };

  // Handle recall button click
  const handleRecall = (ticket: Ticket) => {
    onRecallTicket(ticket);
  };

  React.useEffect(() => {
    fetchTicketHistory();
    
    // Set up interval to refresh every minute
    const interval = setInterval(fetchTicketHistory, 60000);
    
    return () => clearInterval(interval);
  }, [counterNumber]);

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Historial</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchTicketHistory}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            {isLoading ? 'Cargando historial...' : 'No hay tickets en el historial para hoy'}
          </div>
        ) : (
          <div className="overflow-auto max-h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map(ticket => (
                  <TableRow key={ticket.id} className={ticket.isVip ? 'bg-yellow-50' : ''}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Badge 
                          variant={ticket.isVip ? "default" : "outline"}
                          className={ticket.isVip ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500" : ""}
                        >
                          {ticket.ticketNumber}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {ticket.patientName || '-'}
                    </TableCell>
                    <TableCell>
                      {getServiceName(ticket.serviceType)}
                      {ticket.redirectedTo && (
                        <span className="text-xs ml-1 text-muted-foreground">
                          → {getServiceName(ticket.redirectedTo)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(ticket.status)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {ticket.completedAt 
                          ? format(ticket.completedAt, "h:mm a", { locale: es })
                          : format(ticket.createdAt, "h:mm a", { locale: es })
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRecall(ticket)}
                        title="Rellamar ticket"
                        className="h-8 w-8 p-0"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TicketHistory;

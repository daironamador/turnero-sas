
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServiceType, ServiceTypeLabels, Ticket } from '@/lib/types';
import { BellRing, Check, ChevronRight, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

// Mock data for demonstration
const mockTickets: Ticket[] = [
  {
    id: '1',
    ticketNumber: 'CG001',
    serviceType: 'CG',
    status: 'waiting',
    createdAt: new Date(new Date().getTime() - 1000 * 60 * 15), // 15 minutes ago
  },
  {
    id: '2',
    ticketNumber: 'CG002',
    serviceType: 'CG',
    status: 'waiting',
    createdAt: new Date(new Date().getTime() - 1000 * 60 * 10), // 10 minutes ago
  },
  {
    id: '3',
    ticketNumber: 'RX001',
    serviceType: 'RX',
    status: 'waiting',
    createdAt: new Date(new Date().getTime() - 1000 * 60 * 5), // 5 minutes ago
  },
  {
    id: '4',
    ticketNumber: 'RR001',
    serviceType: 'RR',
    status: 'waiting',
    createdAt: new Date(new Date().getTime() - 1000 * 60 * 3), // 3 minutes ago
  },
];

interface TicketManagerProps {
  counterNumber?: number;
}

const TicketManager: React.FC<TicketManagerProps> = ({ counterNumber = 1 }) => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [selectedTab, setSelectedTab] = useState<ServiceType>('CG');
  
  const handleCallNext = () => {
    // Find the next waiting ticket for the selected service type
    const nextTicket = tickets.find(
      ticket => ticket.serviceType === selectedTab && ticket.status === 'waiting'
    );
    
    if (!nextTicket) {
      toast({
        title: "Sin tickets pendientes",
        description: `No hay tickets pendientes para ${ServiceTypeLabels[selectedTab]}`,
      });
      return;
    }
    
    // Update the current ticket
    const updatedTicket: Ticket = {
      ...nextTicket,
      status: 'serving',
      calledAt: new Date(),
      counterNumber,
    };
    
    // If there's already a current ticket, mark it as completed
    if (currentTicket) {
      handleCompleteTicket();
    }
    
    // Update tickets list and set current ticket
    setTickets(
      tickets.map(ticket => ticket.id === updatedTicket.id ? updatedTicket : ticket)
    );
    setCurrentTicket(updatedTicket);
    
    // In a real app, this would trigger a display update or notification sound
    toast({
      title: "Ticket llamado",
      description: `Llamando ticket ${updatedTicket.ticketNumber} a ventanilla ${counterNumber}`,
    });
  };
  
  const handleCompleteTicket = () => {
    if (!currentTicket) return;
    
    const completedTicket: Ticket = {
      ...currentTicket,
      status: 'completed',
      completedAt: new Date(),
    };
    
    setTickets(
      tickets.map(ticket => ticket.id === completedTicket.id ? completedTicket : ticket)
    );
    setCurrentTicket(null);
    
    toast({
      title: "Ticket completado",
      description: `Ticket ${completedTicket.ticketNumber} completado`,
    });
  };
  
  const handleCancelTicket = () => {
    if (!currentTicket) return;
    
    const cancelledTicket: Ticket = {
      ...currentTicket,
      status: 'cancelled',
      completedAt: new Date(),
    };
    
    setTickets(
      tickets.map(ticket => ticket.id === cancelledTicket.id ? cancelledTicket : ticket)
    );
    setCurrentTicket(null);
    
    toast({
      title: "Ticket cancelado",
      description: `Ticket ${cancelledTicket.ticketNumber} cancelado`,
    });
  };
  
  const getWaitingCount = (serviceType: ServiceType) => {
    return tickets.filter(
      ticket => ticket.serviceType === serviceType && ticket.status === 'waiting'
    ).length;
  };
  
  return (
    <div className="space-y-6 animate-slide-down">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Tickets</h1>
          <p className="text-muted-foreground mt-1">Ventanilla {counterNumber}</p>
        </div>
      </div>
      
      {/* Current ticket being served */}
      {currentTicket ? (
        <Card className="bg-ocular-50 border-2 border-ocular-600">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Atendiendo Ahora</span>
              <Badge variant="outline" className="font-bold text-ocular-700 border-ocular-600">
                Ventanilla {counterNumber}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-0">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-4xl font-bold text-ocular-700 mb-2">
                  #{currentTicket.ticketNumber}
                </p>
                <p className="text-lg text-gray-600">
                  {ServiceTypeLabels[currentTicket.serviceType]}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Llamado: {format(currentTicket.calledAt!, "HH:mm:ss")}
                </p>
              </div>
              <div className="w-20 h-20 bg-ocular-100 rounded-full flex items-center justify-center">
                <span className="text-3xl font-bold text-ocular-600">
                  {currentTicket.serviceType}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between gap-4 pt-4">
            <Button 
              variant="outline" 
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleCancelTicket}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white" 
              onClick={handleCompleteTicket}
            >
              <Check className="w-4 h-4 mr-2" />
              Completar
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="bg-gray-50 border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <BellRing className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-xl font-medium text-gray-500 text-center">No hay ticket en atención</p>
            <p className="text-sm text-gray-400 text-center mt-1">
              Llame al siguiente ticket para comenzar
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Tabs with waiting tickets by service type */}
      <Tabs 
        defaultValue="CG" 
        value={selectedTab} 
        onValueChange={(value) => setSelectedTab(value as ServiceType)}
        className="w-full"
      >
        <TabsList className="w-full border-b">
          {(Object.keys(ServiceTypeLabels) as ServiceType[]).map((serviceType) => (
            <TabsTrigger
              key={serviceType}
              value={serviceType}
              className="flex-1 relative"
            >
              {ServiceTypeLabels[serviceType]}
              {getWaitingCount(serviceType) > 0 && (
                <Badge className="ml-2 bg-ocular-600">{getWaitingCount(serviceType)}</Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {(Object.keys(ServiceTypeLabels) as ServiceType[]).map((serviceType) => (
          <TabsContent key={serviceType} value={serviceType} className="mt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">Tickets en espera</h2>
                <Button 
                  className="bg-ocular-600 hover:bg-ocular-700"
                  onClick={handleCallNext}
                  disabled={getWaitingCount(serviceType) === 0}
                >
                  <ChevronRight className="w-4 h-4 mr-2" />
                  Llamar siguiente
                </Button>
              </div>
              
              {getWaitingCount(serviceType) === 0 ? (
                <div className="bg-gray-50 rounded-md p-8 text-center">
                  <p className="text-gray-500">No hay tickets en espera</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {tickets
                    .filter(ticket => ticket.serviceType === serviceType && ticket.status === 'waiting')
                    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
                    .map((ticket) => (
                      <Card key={ticket.id} className="hover-scale">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex justify-between items-center">
                            <span>#{ticket.ticketNumber}</span>
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">Espera</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-3">
                          <p className="text-sm text-gray-500">
                            Tiempo de espera: {Math.floor((new Date().getTime() - ticket.createdAt.getTime()) / (1000 * 60))} min
                          </p>
                        </CardContent>
                        <CardFooter className="pt-0">
                          <Button 
                            variant="outline" 
                            className="w-full border-ocular-200 text-ocular-600 hover:bg-ocular-50"
                            onClick={() => {
                              // Mark current ticket as completed if exists
                              if (currentTicket) {
                                handleCompleteTicket();
                              }
                              
                              // Call this specific ticket
                              const updatedTicket: Ticket = {
                                ...ticket,
                                status: 'serving',
                                calledAt: new Date(),
                                counterNumber,
                              };
                              
                              setTickets(
                                tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t)
                              );
                              setCurrentTicket(updatedTicket);
                              
                              toast({
                                title: "Ticket llamado",
                                description: `Llamando ticket ${updatedTicket.ticketNumber} a ventanilla ${counterNumber}`,
                              });
                            }}
                          >
                            Llamar este ticket
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default TicketManager;

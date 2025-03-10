
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServiceType, ServiceTypeLabels, Ticket } from '@/lib/types';
import { 
  BellRing, 
  Check, 
  ChevronRight, 
  X, 
  ArrowRightLeft,
  Star,
  RefreshCw,
  History
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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
    isVip: true,
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
  const [completedTickets, setCompletedTickets] = useState<Ticket[]>([]);
  const [redirectService, setRedirectService] = useState<ServiceType>('CG');
  const [isRedirectDialogOpen, setIsRedirectDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const handleCallNext = () => {
    // First check for VIP tickets
    let nextTicket = tickets.find(
      ticket => ticket.serviceType === selectedTab && ticket.status === 'waiting' && ticket.isVip
    );
    
    // If no VIP tickets, get the next regular ticket
    if (!nextTicket) {
      nextTicket = tickets.find(
        ticket => ticket.serviceType === selectedTab && ticket.status === 'waiting'
      );
    }
    
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
      title: updatedTicket.isVip ? "Ticket VIP llamado" : "Ticket llamado",
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
    
    // Update tickets list
    setTickets(
      tickets.map(ticket => ticket.id === completedTicket.id ? completedTicket : ticket)
    );
    
    // Add to completed tickets history
    setCompletedTickets([completedTicket, ...completedTickets]);
    
    // Clear current ticket
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
    
    // Add to completed tickets history
    setCompletedTickets([cancelledTicket, ...completedTickets]);
    
    setCurrentTicket(null);
    
    toast({
      title: "Ticket cancelado",
      description: `Ticket ${cancelledTicket.ticketNumber} cancelado`,
    });
  };
  
  const handleRedirectTicket = () => {
    if (!currentTicket) return;
    
    const previousTicketNumber = currentTicket.ticketNumber;
    
    // Create a new ticket for the redirected service
    const newTicketNumber = `${redirectService}${previousTicketNumber.substring(2)}`;
    
    const redirectedTicket: Ticket = {
      ...currentTicket,
      id: crypto.randomUUID(),
      ticketNumber: newTicketNumber,
      serviceType: redirectService,
      status: 'waiting',
      redirectedFrom: currentTicket.serviceType,
      previousTicketNumber: previousTicketNumber,
      calledAt: undefined,
      counterNumber: undefined,
      completedAt: undefined,
    };
    
    // Mark the current ticket as redirected
    const oldTicket: Ticket = {
      ...currentTicket,
      status: 'redirected',
      completedAt: new Date(),
      redirectedTo: redirectService,
    };
    
    // Update tickets list with both the old and new ticket
    setTickets([
      ...tickets.map(ticket => ticket.id === currentTicket.id ? oldTicket : ticket),
      redirectedTicket
    ]);
    
    // Add to completed tickets history
    setCompletedTickets([oldTicket, ...completedTickets]);
    
    // Clear current ticket
    setCurrentTicket(null);
    
    toast({
      title: "Ticket redirigido",
      description: `Ticket ${oldTicket.ticketNumber} redirigido a ${ServiceTypeLabels[redirectService]}`,
    });
    
    // Close the dialog
    setIsRedirectDialogOpen(false);
  };
  
  const handleRecallTicket = (ticket: Ticket) => {
    if (currentTicket) {
      // If there's already a current ticket, handle it first
      handleCompleteTicket();
    }
    
    // Create a recalled ticket (similar to the original but with updated status)
    const recalledTicket: Ticket = {
      ...ticket,
      status: 'serving',
      calledAt: new Date(),
      counterNumber,
    };
    
    // Update tickets list
    setTickets([
      ...tickets.filter(t => t.id !== ticket.id),
      recalledTicket
    ]);
    
    // Remove from completed tickets
    setCompletedTickets(completedTickets.filter(t => t.id !== ticket.id));
    
    // Set as current ticket
    setCurrentTicket(recalledTicket);
    
    toast({
      title: "Ticket rellamado",
      description: `Rellamando ticket ${recalledTicket.ticketNumber} a ventanilla ${counterNumber}`,
    });
    
    // Close history dialog if open
    setIsHistoryOpen(false);
  };
  
  const getWaitingCount = (serviceType: ServiceType) => {
    return tickets.filter(
      ticket => ticket.serviceType === serviceType && ticket.status === 'waiting'
    ).length;
  };
  
  const getVipWaitingCount = (serviceType: ServiceType) => {
    return tickets.filter(
      ticket => ticket.serviceType === serviceType && ticket.status === 'waiting' && ticket.isVip
    ).length;
  };
  
  return (
    <div className="space-y-6 animate-slide-down">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Tickets</h1>
          <p className="text-muted-foreground mt-1">Ventanilla {counterNumber}</p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center"
          >
            <History className="w-4 h-4 mr-2" />
            Historial
          </Button>
        </div>
      </div>
      
      {/* Current ticket being served */}
      {currentTicket ? (
        <Card className={`${currentTicket.isVip ? 'bg-yellow-50 border-2 border-yellow-500' : 'bg-ocular-50 border-2 border-ocular-600'}`}>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <div className="flex items-center">
                <span>Atendiendo Ahora</span>
                {currentTicket.isVip && (
                  <Star className="ml-2 h-5 w-5 text-yellow-500" />
                )}
              </div>
              <Badge variant="outline" className={`font-bold ${currentTicket.isVip ? 'text-yellow-700 border-yellow-600' : 'text-ocular-700 border-ocular-600'}`}>
                Ventanilla {counterNumber}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-0">
            <div className="flex justify-between items-center">
              <div>
                <p className={`text-4xl font-bold mb-2 ${currentTicket.isVip ? 'text-yellow-700' : 'text-ocular-700'}`}>
                  #{currentTicket.ticketNumber}
                </p>
                <p className="text-lg text-gray-600">
                  {ServiceTypeLabels[currentTicket.serviceType]}
                </p>
                {currentTicket.redirectedFrom && (
                  <p className="text-sm text-gray-500">
                    Redirigido desde: {ServiceTypeLabels[currentTicket.redirectedFrom]}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  Llamado: {format(currentTicket.calledAt!, "HH:mm:ss")}
                </p>
              </div>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${currentTicket.isVip ? 'bg-yellow-100' : 'bg-ocular-100'}`}>
                <span className={`text-3xl font-bold ${currentTicket.isVip ? 'text-yellow-600' : 'text-ocular-600'}`}>
                  {currentTicket.serviceType}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2 justify-between pt-4">
            <Button 
              variant="outline" 
              className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={handleCancelTicket}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            
            <Dialog open={isRedirectDialogOpen} onOpenChange={setIsRedirectDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                  Redirigir
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Redirigir Ticket</DialogTitle>
                  <DialogDescription>
                    Seleccione el servicio al que desea redirigir el ticket #{currentTicket.ticketNumber}
                  </DialogDescription>
                </DialogHeader>
                
                <RadioGroup 
                  value={redirectService} 
                  onValueChange={(value) => setRedirectService(value as ServiceType)}
                  className="grid grid-cols-2 gap-4 py-4"
                >
                  {(Object.keys(ServiceTypeLabels) as ServiceType[])
                    .filter(type => type !== currentTicket.serviceType)
                    .map(serviceType => (
                      <div key={serviceType} className="flex items-center space-x-2">
                        <RadioGroupItem value={serviceType} id={serviceType} />
                        <Label htmlFor={serviceType} className="font-medium">
                          {ServiceTypeLabels[serviceType]}
                        </Label>
                      </div>
                    ))
                  }
                </RadioGroup>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsRedirectDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleRedirectTicket}>
                    Redirigir Ticket
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="outline"
              className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
              onClick={() => {
                const recalledTicket = { ...currentTicket, calledAt: new Date() };
                setCurrentTicket(recalledTicket);
                
                setTickets(
                  tickets.map(ticket => ticket.id === recalledTicket.id ? recalledTicket : ticket)
                );
                
                toast({
                  title: "Ticket rellamado",
                  description: `Rellamando ticket ${recalledTicket.ticketNumber}`,
                });
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Rellamar
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
              <div className="flex items-center gap-2">
                {ServiceTypeLabels[serviceType]}
                {getWaitingCount(serviceType) > 0 && (
                  <Badge className="ml-2 bg-ocular-600">{getWaitingCount(serviceType)}</Badge>
                )}
                {getVipWaitingCount(serviceType) > 0 && (
                  <Badge className="ml-1 bg-yellow-500 flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {getVipWaitingCount(serviceType)}
                  </Badge>
                )}
              </div>
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
                    .sort((a, b) => {
                      // First sort by VIP status (VIP tickets first)
                      if (a.isVip && !b.isVip) return -1;
                      if (!a.isVip && b.isVip) return 1;
                      // Then by creation time (oldest first)
                      return a.createdAt.getTime() - b.createdAt.getTime();
                    })
                    .map((ticket) => (
                      <Card 
                        key={ticket.id} 
                        className={`hover-scale ${ticket.isVip ? 'border-2 border-yellow-300' : ''}`}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="flex justify-between items-center">
                            <div className="flex items-center">
                              <span>#{ticket.ticketNumber}</span>
                              {ticket.isVip && <Star className="ml-2 h-4 w-4 text-yellow-500" />}
                            </div>
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">Espera</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-3">
                          {ticket.redirectedFrom && (
                            <p className="text-sm text-gray-600 mb-1">
                              Desde: {ServiceTypeLabels[ticket.redirectedFrom]}
                            </p>
                          )}
                          <p className="text-sm text-gray-500">
                            Tiempo de espera: {Math.floor((new Date().getTime() - ticket.createdAt.getTime()) / (1000 * 60))} min
                          </p>
                        </CardContent>
                        <CardFooter className="pt-0">
                          <Button 
                            variant="outline" 
                            className={`w-full ${
                              ticket.isVip 
                                ? 'border-yellow-200 text-yellow-600 hover:bg-yellow-50' 
                                : 'border-ocular-200 text-ocular-600 hover:bg-ocular-50'
                            }`}
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
                                title: ticket.isVip ? "Ticket VIP llamado" : "Ticket llamado",
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
      
      {/* History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Historial de Tickets</DialogTitle>
            <DialogDescription>
              Tickets completados, cancelados y redirigidos
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {completedTickets.length === 0 ? (
              <p className="text-center text-gray-500">No hay tickets en el historial</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedTickets.map((ticket) => (
                  <Card key={ticket.id} className="hover:shadow-sm transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex justify-between items-center text-base">
                        <div className="flex items-center">
                          <span>#{ticket.ticketNumber}</span>
                          {ticket.isVip && <Star className="ml-2 h-4 w-4 text-yellow-500" />}
                        </div>
                        <Badge 
                          className={
                            ticket.status === 'completed' 
                              ? 'bg-green-100 text-green-800 border-green-200'
                              : ticket.status === 'redirected'
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : 'bg-red-100 text-red-800 border-red-200'
                          }
                        >
                          {ticket.status === 'completed' 
                            ? 'Completado' 
                            : ticket.status === 'redirected'
                              ? 'Redirigido'
                              : 'Cancelado'}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-sm text-gray-600">
                        {ServiceTypeLabels[ticket.serviceType]}
                      </p>
                      {ticket.redirectedTo && (
                        <p className="text-xs text-blue-600">
                          Redirigido a: {ServiceTypeLabels[ticket.redirectedTo]}
                        </p>
                      )}
                      {ticket.completedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          {format(ticket.completedAt, "dd/MM HH:mm:ss")}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button 
                        variant="outline" 
                        className="w-full border-gray-200 text-gray-600 hover:bg-gray-50"
                        onClick={() => handleRecallTicket(ticket)}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Rellamar Ticket
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TicketManager;

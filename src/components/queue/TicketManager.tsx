
import React, { useState, useEffect } from 'react';
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
  History,
  UserPlus
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
import { Input } from "@/components/ui/input";
import { 
  getTicketsByStatus, 
  callTicket, 
  completeTicket, 
  cancelTicket, 
  redirectTicket,
  updateTicketStatus
} from '@/services/ticketService';

interface TicketManagerProps {
  counterNumber?: number;
}

const TicketManager: React.FC<TicketManagerProps> = ({ counterNumber = 1 }) => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [selectedTab, setSelectedTab] = useState<ServiceType>('CG');
  const [completedTickets, setCompletedTickets] = useState<Ticket[]>([]);
  const [redirectService, setRedirectService] = useState<ServiceType>('CG');
  const [isRedirectDialogOpen, setIsRedirectDialogOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPatientDialogOpen, setIsPatientDialogOpen] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Cargar tickets al iniciar y configurar escucha de tiempo real
  useEffect(() => {
    loadTickets();
    
    // Escuchar actualizaciones en tiempo real
    const handleTicketsUpdate = () => {
      loadTickets();
    };
    
    window.addEventListener('tickets-updated', handleTicketsUpdate);
    
    return () => {
      window.removeEventListener('tickets-updated', handleTicketsUpdate);
    };
  }, []);
  
  const loadTickets = async () => {
    setLoading(true);
    try {
      // Cargar tickets en espera
      const waitingTickets = await getTicketsByStatus('waiting');
      
      // Cargar ticket en atención para esta ventanilla
      const servingTickets = await getTicketsByStatus('serving');
      const myServingTicket = servingTickets.find(t => t.counterNumber === counterNumber);
      
      if (myServingTicket) {
        setCurrentTicket(myServingTicket);
      }
      
      // Cargar tickets completados, cancelados o redirigidos
      const completedTicketsData = [
        ...await getTicketsByStatus('completed'),
        ...await getTicketsByStatus('cancelled'),
        ...await getTicketsByStatus('redirected')
      ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      setTickets(waitingTickets);
      setCompletedTickets(completedTicketsData);
    } catch (error) {
      console.error('Error cargando tickets:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar los tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCallNext = async () => {
    // Primero verificar si hay tickets VIP
    let nextTicket = tickets.find(
      ticket => ticket.serviceType === selectedTab && ticket.status === 'waiting' && ticket.isVip
    );
    
    // Si no hay tickets VIP, obtener el siguiente ticket regular
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
    
    try {
      // Si ya hay un ticket en atención, completarlo primero
      if (currentTicket) {
        await handleCompleteTicket();
      }
      
      // Llamar al siguiente ticket
      const updatedTicket = await callTicket(nextTicket.id, counterNumber);
      
      // Actualizar la UI
      setTickets(tickets.filter(t => t.id !== nextTicket!.id));
      setCurrentTicket(updatedTicket);
      
      toast({
        title: updatedTicket.isVip ? "Ticket VIP llamado" : "Ticket llamado",
        description: `Llamando ticket ${updatedTicket.ticketNumber} a ventanilla ${counterNumber}`,
      });
    } catch (error) {
      console.error('Error llamando al siguiente ticket:', error);
      toast({
        title: "Error",
        description: "No se pudo llamar al siguiente ticket",
        variant: "destructive",
      });
    }
  };
  
  const handleCompleteTicket = async () => {
    if (!currentTicket) return;
    
    try {
      const completedTicket = await completeTicket(currentTicket.id);
      
      // Actualizar listas
      setCompletedTickets([completedTicket, ...completedTickets]);
      setCurrentTicket(null);
      
      toast({
        title: "Ticket completado",
        description: `Ticket ${completedTicket.ticketNumber} completado`,
      });
    } catch (error) {
      console.error('Error completando ticket:', error);
      toast({
        title: "Error",
        description: "No se pudo completar el ticket",
        variant: "destructive",
      });
    }
  };
  
  const handleCancelTicket = async () => {
    if (!currentTicket) return;
    
    try {
      const cancelledTicket = await cancelTicket(currentTicket.id);
      
      // Actualizar listas
      setCompletedTickets([cancelledTicket, ...completedTickets]);
      setCurrentTicket(null);
      
      toast({
        title: "Ticket cancelado",
        description: `Ticket ${cancelledTicket.ticketNumber} cancelado`,
      });
    } catch (error) {
      console.error('Error cancelando ticket:', error);
      toast({
        title: "Error",
        description: "No se pudo cancelar el ticket",
        variant: "destructive",
      });
    }
  };
  
  const handleRedirectTicket = async () => {
    if (!currentTicket) return;
    
    try {
      const { oldTicket, newTicket } = await redirectTicket(
        currentTicket.id, 
        redirectService,
        patientName || currentTicket.patientName
      );
      
      // Actualizar listas
      setCompletedTickets([oldTicket, ...completedTickets]);
      setTickets([...tickets, newTicket]);
      setCurrentTicket(null);
      
      toast({
        title: "Ticket redirigido",
        description: `Ticket ${oldTicket.ticketNumber} redirigido a ${ServiceTypeLabels[redirectService]}`,
      });
      
      // Cerrar diálogos
      setIsRedirectDialogOpen(false);
      setIsPatientDialogOpen(false);
      setPatientName('');
    } catch (error) {
      console.error('Error redirigiendo ticket:', error);
      toast({
        title: "Error",
        description: "No se pudo redirigir el ticket",
        variant: "destructive",
      });
    }
  };
  
  const handleRecallTicket = async (ticket: Ticket) => {
    if (currentTicket) {
      // Si ya hay un ticket en atención, completarlo primero
      await handleCompleteTicket();
    }
    
    try {
      // Volver a llamar al ticket
      const recalledTicket = await callTicket(ticket.id, counterNumber);
      
      // Actualizar listas
      setCompletedTickets(completedTickets.filter(t => t.id !== ticket.id));
      setCurrentTicket(recalledTicket);
      
      toast({
        title: "Ticket rellamado",
        description: `Rellamando ticket ${recalledTicket.ticketNumber} a ventanilla ${counterNumber}`,
      });
      
      // Cerrar diálogo de historial
      setIsHistoryOpen(false);
    } catch (error) {
      console.error('Error rellamando ticket:', error);
      toast({
        title: "Error",
        description: "No se pudo rellamar el ticket",
        variant: "destructive",
      });
    }
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
            onClick={loadTickets}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
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
      
      {/* Ticket actualmente en atención */}
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
                {currentTicket.patientName && (
                  <p className="text-md text-gray-600 mt-1">
                    Paciente: {currentTicket.patientName}
                  </p>
                )}
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
                
                <div className="py-2">
                  <Label htmlFor="patientName">Nombre del Paciente (opcional)</Label>
                  <Input
                    id="patientName"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder={currentTicket.patientName || "Ingrese el nombre del paciente"}
                    className="mt-1"
                  />
                </div>
                
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
            
            {!currentTicket.patientName && (
              <Dialog open={isPatientDialogOpen} onOpenChange={setIsPatientDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="border-green-300 text-green-600 hover:bg-green-50 hover:text-green-700"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Agregar Paciente
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Agregar Datos del Paciente</DialogTitle>
                    <DialogDescription>
                      Ingrese el nombre del paciente para el ticket #{currentTicket.ticketNumber}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="py-4">
                    <Label htmlFor="patientNameInput">Nombre del Paciente</Label>
                    <Input
                      id="patientNameInput"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Ingrese el nombre completo"
                      className="mt-1"
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsPatientDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={async () => {
                      try {
                        // Actualizar el ticket con el nombre del paciente
                        const updatedTicket = await updateTicketStatus(
                          currentTicket.id,
                          currentTicket.status,
                          { patient_name: patientName }
                        );
                        
                        setCurrentTicket(updatedTicket);
                        setPatientName('');
                        setIsPatientDialogOpen(false);
                        
                        toast({
                          title: "Datos actualizados",
                          description: "Nombre del paciente agregado al ticket",
                        });
                      } catch (error) {
                        console.error('Error actualizando datos del paciente:', error);
                        toast({
                          title: "Error",
                          description: "No se pudo actualizar el nombre del paciente",
                          variant: "destructive",
                        });
                      }
                    }}>
                      Guardar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            
            <Button 
              variant="outline"
              className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
              onClick={async () => {
                try {
                  // Volver a llamar al ticket actual
                  const recalledTicket = await callTicket(currentTicket.id, counterNumber);
                  setCurrentTicket(recalledTicket);
                  
                  toast({
                    title: "Ticket rellamado",
                    description: `Rellamando ticket ${recalledTicket.ticketNumber}`,
                  });
                } catch (error) {
                  console.error('Error rellamando ticket:', error);
                  toast({
                    title: "Error",
                    description: "No se pudo rellamar el ticket",
                    variant: "destructive",
                  });
                }
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
      
      {/* Pestañas con tickets en espera por tipo de servicio */}
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
                  disabled={getWaitingCount(serviceType) === 0 || loading}
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
                      // Primero ordenar por estado VIP (tickets VIP primero)
                      if (a.isVip && !b.isVip) return -1;
                      if (!a.isVip && b.isVip) return 1;
                      // Luego por tiempo de creación (más antiguos primero)
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
                          {ticket.patientName && (
                            <p className="text-sm text-gray-600 mb-1">
                              Paciente: {ticket.patientName}
                            </p>
                          )}
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
                            disabled={loading}
                            onClick={async () => {
                              try {
                                // Completar ticket actual si existe
                                if (currentTicket) {
                                  await handleCompleteTicket();
                                }
                                
                                // Llamar a este ticket específico
                                const updatedTicket = await callTicket(ticket.id, counterNumber);
                                
                                // Actualizar listas
                                setTickets(tickets.filter(t => t.id !== ticket.id));
                                setCurrentTicket(updatedTicket);
                                
                                toast({
                                  title: ticket.isVip ? "Ticket VIP llamado" : "Ticket llamado",
                                  description: `Llamando ticket ${updatedTicket.ticketNumber} a ventanilla ${counterNumber}`,
                                });
                              } catch (error) {
                                console.error('Error llamando ticket específico:', error);
                                toast({
                                  title: "Error",
                                  description: "No se pudo llamar al ticket",
                                  variant: "destructive",
                                });
                              }
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
      
      {/* Diálogo de Historial */}
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
                      {ticket.patientName && (
                        <p className="text-sm text-gray-600">
                          Paciente: {ticket.patientName}
                        </p>
                      )}
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
                        disabled={loading}
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

// Función para actualizar estado de ticket con propiedades adicionales
const updateTicketStatus = async (id: string, status: string, updates: any = {}) => {
  const { data, error } = await supabase
    .from('tickets')
    .update({ status, ...updates })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error al actualizar ticket:', error);
    throw error;
  }

  return {
    id: data.id,
    ticketNumber: data.ticket_number,
    serviceType: data.service_type,
    status: data.status,
    isVip: data.is_vip,
    createdAt: new Date(data.created_at),
    calledAt: data.called_at ? new Date(data.called_at) : undefined,
    completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    counterNumber: data.counter_number,
    patientName: data.patient_name,
    redirectedTo: data.redirected_to,
    redirectedFrom: data.redirected_from,
    previousTicketNumber: data.previous_ticket_number,
  };
};

export default TicketManager;

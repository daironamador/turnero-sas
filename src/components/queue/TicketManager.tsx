
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { Service, Ticket, Room, ServiceType } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCheck, ChevronsUpDown, PhoneCall, XCircle, Clock, User, Calendar } from 'lucide-react';
import { 
  callTicket, 
  completeTicket, 
  cancelTicket, 
  redirectTicket
} from '@/services/ticketService';
import { Badge } from '@/components/ui/badge';

// Define types for mutation parameters
type CallTicketParams = { ticketId: string; counterNumber: string };
type CompleteTicketParams = { ticketId: string };
type CancelTicketParams = { ticketId: string };
type RedirectTicketParams = { ticketId: string; serviceType: ServiceType };

interface TicketManagerProps {
  currentTicket?: Ticket;
  waitingTickets: Ticket[];
  rooms: Room[];
  services: Service[];
  counterNumber: string;
  counterName?: string;
  onTicketChange: () => void;
}

const TicketManager: React.FC<TicketManagerProps> = ({ 
  currentTicket, 
  waitingTickets, 
  rooms, 
  services, 
  counterNumber,
  counterName,
  onTicketChange
}) => {
  const [isRedirectDialogOpen, setIsRedirectDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | undefined>(undefined);

  const nextTicket = waitingTickets.length > 0 ? waitingTickets[0] : undefined;

  // Mutations
  const callTicketMutation = useMutation({
    mutationFn: (params: CallTicketParams) => 
      callTicket(params.ticketId, params.counterNumber),
    onSuccess: () => {
      toast.success(`Se ha llamado al ticket ${nextTicket?.ticketNumber} en ${counterName || 'la sala seleccionada'}`);
      onTicketChange();
    },
    onError: (error: any) => {
      toast.error(error.message || "No se pudo llamar al ticket");
    },
  });

  const completeTicketMutation = useMutation({
    mutationFn: (params: CompleteTicketParams) => completeTicket(params.ticketId),
    onSuccess: () => {
      toast.success(`Se ha completado el ticket ${currentTicket?.ticketNumber}`);
      onTicketChange();
    },
    onError: (error: any) => {
      toast.error(error.message || "No se pudo completar el ticket");
    },
  });

  const cancelTicketMutation = useMutation({
    mutationFn: (params: CancelTicketParams) => cancelTicket(params.ticketId),
    onSuccess: () => {
      toast.success(`Se ha cancelado el ticket ${currentTicket?.ticketNumber}`);
      onTicketChange();
    },
    onError: (error: any) => {
      toast.error(error.message || "No se pudo cancelar el ticket");
    },
  });

  const redirectTicketMutation = useMutation({
    mutationFn: (params: RedirectTicketParams) => 
      redirectTicket(params.ticketId, params.serviceType),
    onSuccess: () => {
      toast.success(`Se ha redirigido el ticket ${currentTicket?.ticketNumber} al servicio ${selectedService}`);
      onTicketChange();
    },
    onError: (error: any) => {
      toast.error(error.message || "No se pudo redirigir el ticket");
    },
  });

  const handleCallNext = async () => {
    if (!nextTicket) return;
    callTicketMutation.mutate({ 
      ticketId: nextTicket.id, 
      counterNumber 
    });
  };

  const handleComplete = async () => {
    if (!currentTicket) return;
    completeTicketMutation.mutate({ 
      ticketId: currentTicket.id 
    });
  };

  const handleCancel = async () => {
    if (!currentTicket) return;
    cancelTicketMutation.mutate({ 
      ticketId: currentTicket.id 
    });
  };

  const handleRedirect = async () => {
    if (!currentTicket || !selectedService) return;
    redirectTicketMutation.mutate({ 
      ticketId: currentTicket.id, 
      serviceType: selectedService as ServiceType 
    });
    setIsRedirectDialogOpen(false);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Current Ticket */}
      <Card className={`bg-white border ${currentTicket ? 'border-primary/20' : 'border-muted'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            Ticket Actual
            {currentTicket && <Badge>{currentTicket.ticketNumber}</Badge>}
          </CardTitle>
          <CardDescription>
            {currentTicket ? 'Información del ticket en atención' : 'No hay ticket en atención'}
          </CardDescription>
        </CardHeader>
        
        {currentTicket ? (
          <>
            <CardContent className="pt-2">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Paciente:</span> 
                  <span>{currentTicket.patientName || 'Sin nombre'}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="font-normal">{currentTicket.serviceType}</Badge>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">
                    {currentTicket.status === 'serving' ? 'En atención' : currentTicket.status}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {format(new Date(currentTicket.createdAt), "dd/MM/yyyy", { locale: es })}
                  </span>
                </div>
                
                {currentTicket.calledAt && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Llamado a las {format(new Date(currentTicket.calledAt), "h:mm a", { locale: es })}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end gap-2 pt-2">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleCancel} 
                disabled={cancelTicketMutation.isPending}
              >
                {cancelTicketMutation.isPending ? 'Cancelando...' : 'Cancelar'}
                <XCircle className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setIsRedirectDialogOpen(true)}
                disabled={redirectTicketMutation.isPending}
              >
                Redirigir
                <ChevronsUpDown className="w-4 h-4 ml-2" />
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={handleComplete} 
                disabled={completeTicketMutation.isPending}
              >
                {completeTicketMutation.isPending ? 'Completando...' : 'Completar'}
                <CheckCheck className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </>
        ) : (
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No hay ticket actual</p>
          </CardContent>
        )}
      </Card>

      {/* Next Ticket and Waiting Queue */}
      <div className="space-y-6">
        {/* Next Ticket */}
        <Card className={`bg-white border ${nextTicket ? 'border-primary/20' : 'border-muted'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center justify-between">
              Siguiente Ticket
              {nextTicket && <Badge variant="outline">{nextTicket.ticketNumber}</Badge>}
            </CardTitle>
            <CardDescription>
              {nextTicket ? 'Próximo ticket a ser llamado' : 'No hay tickets en espera'}
            </CardDescription>
          </CardHeader>
          
          {nextTicket ? (
            <>
              <CardContent className="pt-0 pb-2">
                <div className="space-y-2">
                  {nextTicket.patientName && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Paciente:</span> 
                      <span>{nextTicket.patientName}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      En espera desde {format(new Date(nextTicket.createdAt), "h:mm a", { locale: es })}
                    </span>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-2">
                <Button 
                  className="w-full"
                  onClick={handleCallNext} 
                  disabled={callTicketMutation.isPending || !nextTicket}
                >
                  {callTicketMutation.isPending ? 'Llamando...' : 'Llamar Ticket'}
                  <PhoneCall className="w-4 h-4 ml-2" />
                </Button>
              </CardFooter>
            </>
          ) : (
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No hay tickets en espera</p>
            </CardContent>
          )}
        </Card>

        {/* Waiting Queue */}
        {waitingTickets.length > 0 && (
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
        )}
      </div>

      <Dialog open={isRedirectDialogOpen} onOpenChange={setIsRedirectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Redirigir Ticket</DialogTitle>
            <DialogDescription>
              Seleccione el servicio al que desea redirigir el ticket.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="service" className="text-right">
                Servicio
              </Label>
              <Select onValueChange={setSelectedService} defaultValue={selectedService}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Seleccione un servicio" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.code}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setIsRedirectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" onClick={handleRedirect}>
              Redirigir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TicketManager;

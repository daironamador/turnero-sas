
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
import { useMutation } from "@tanstack/react-query";
import { Service, Ticket, Room, ServiceType } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCheck, ChevronsUpDown, PhoneCall, XCircle } from 'lucide-react';
import { 
  callTicket, 
  completeTicket, 
  cancelTicket, 
  redirectTicket
} from '@/services/ticketService';

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
      toast(`Se ha llamado al ticket ${nextTicket?.ticketNumber} en ${counterName || 'la sala seleccionada'}`);
      onTicketChange();
    },
    onError: (error: any) => {
      toast.error(error.message || "No se pudo llamar al ticket");
    },
  });

  const completeTicketMutation = useMutation({
    mutationFn: (params: CompleteTicketParams) => completeTicket(params.ticketId),
    onSuccess: () => {
      toast(`Se ha completado el ticket ${currentTicket?.ticketNumber}`);
      onTicketChange();
    },
    onError: (error: any) => {
      toast.error(error.message || "No se pudo completar el ticket");
    },
  });

  const cancelTicketMutation = useMutation({
    mutationFn: (params: CancelTicketParams) => cancelTicket(params.ticketId),
    onSuccess: () => {
      toast(`Se ha cancelado el ticket ${currentTicket?.ticketNumber}`);
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
      toast(`Se ha redirigido el ticket ${currentTicket?.ticketNumber} al servicio ${selectedService}`);
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
    <div className="space-y-4">
      {currentTicket ? (
        <div className="rounded-md border p-4">
          <h3 className="text-lg font-semibold">Ticket Actual</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <p>
                <span className="font-medium">Número:</span> {currentTicket.ticketNumber}
              </p>
              <p>
                <span className="font-medium">Servicio:</span> {currentTicket.serviceType}
              </p>
              <p>
                <span className="font-medium">Estado:</span> {currentTicket.status}
              </p>
              {currentTicket.calledAt && (
                <p>
                  <span className="font-medium">Llamado a las:</span>{' '}
                  {format(new Date(currentTicket.calledAt), "h:mm a", { locale: es })}
                </p>
              )}
            </div>
            <div>
              {currentTicket.patientName && (
                <p>
                  <span className="font-medium">Paciente:</span> {currentTicket.patientName}
                </p>
              )}
              {counterName && (
                <p>
                  <span className="font-medium">Sala:</span> {counterName}
                </p>
              )}
              <p>
                <span className="font-medium">Creado:</span>{' '}
                {format(new Date(currentTicket.createdAt), "dd/MM/yyyy h:mm a", { locale: es })}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="destructive" 
              onClick={handleCancel} 
              disabled={cancelTicketMutation.isPending}
            >
              {cancelTicketMutation.isPending ? 'Cancelando...' : 'Cancelar'}
              <XCircle className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              onClick={() => setIsRedirectDialogOpen(true)}
              disabled={redirectTicketMutation.isPending}
            >
              Redirigir
              <ChevronsUpDown className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleComplete} 
              disabled={completeTicketMutation.isPending}
            >
              {completeTicketMutation.isPending ? 'Completando...' : 'Completar'}
              <CheckCheck className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-md border p-4 text-center">
          <p className="text-muted-foreground">No hay ticket actual</p>
        </div>
      )}

      <div className="rounded-md border p-4">
        <h3 className="text-lg font-semibold">
          {nextTicket ? 'Siguiente Ticket' : 'No hay tickets en espera'}
        </h3>
        {nextTicket && (
          <div className="mt-2 mb-4">
            <p><span className="font-medium">Número:</span> {nextTicket.ticketNumber}</p>
            <p><span className="font-medium">Servicio:</span> {nextTicket.serviceType}</p>
            {nextTicket.patientName && (
              <p><span className="font-medium">Paciente:</span> {nextTicket.patientName}</p>
            )}
            <p>
              <span className="font-medium">En espera desde:</span>{' '}
              {format(new Date(nextTicket.createdAt), "h:mm a", { locale: es })}
            </p>
          </div>
        )}
        <div className="mt-2 flex justify-center">
          <Button 
            className="w-full"
            onClick={handleCallNext} 
            disabled={callTicketMutation.isPending || !nextTicket}
          >
            {callTicketMutation.isPending ? 'Llamando...' : 'Llamar Siguiente'}
            <PhoneCall className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {waitingTickets.length > 0 && (
        <div className="rounded-md border p-4">
          <h3 className="text-lg font-semibold">Cola de Espera ({waitingTickets.length})</h3>
          <div className="mt-2 space-y-2">
            {waitingTickets.slice(0, 5).map((ticket, index) => (
              <div key={ticket.id} className="flex justify-between items-center p-2 border-b last:border-b-0">
                <div>
                  <span className="font-medium">{ticket.ticketNumber}</span>
                  {ticket.patientName && (
                    <span className="ml-2 text-sm text-muted-foreground">{ticket.patientName}</span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(ticket.createdAt), "h:mm a", { locale: es })}
                </span>
              </div>
            ))}
            {waitingTickets.length > 5 && (
              <p className="text-center text-sm text-muted-foreground pt-2">
                ...y {waitingTickets.length - 5} más en espera
              </p>
            )}
          </div>
        </div>
      )}

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

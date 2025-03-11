
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Input } from "@/components/ui/input";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Service, Ticket, Room, ServiceType } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCheck, ChevronsUpDown, PhoneCall, UserPlus, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  callTicket, 
  completeTicket, 
  cancelTicket, 
  redirectTicket
} from '@/services/ticketService';

// Define types for mutation parameters
type CallTicketParams = { ticketId: string; counterNumber: number };
type CompleteTicketParams = { ticketId: string };
type CancelTicketParams = { ticketId: string };
type RedirectTicketParams = { ticketId: string; serviceType: ServiceType };

interface TicketManagerProps {
  currentTicket?: Ticket;
  waitingTickets: Ticket[];
  rooms: Room[];
  services: Service[];
  counterNumber: number;
  onTicketChange: () => void;
}

const TicketManager: React.FC<TicketManagerProps> = ({ 
  currentTicket, 
  waitingTickets, 
  rooms, 
  services, 
  counterNumber,
  onTicketChange
}) => {
  const queryClient = useQueryClient();
  const [isRedirectDialogOpen, setIsRedirectDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | undefined>(undefined);

  // Mutations
  const callTicketMutation = useMutation({
    mutationFn: ({ ticketId, counterNumber }: CallTicketParams) => 
      callTicket(ticketId, counterNumber),
    onSuccess: () => {
      toast({
        title: "Ticket llamado",
        description: `Se ha llamado al ticket ${currentTicket?.ticketNumber} en el counter ${counterNumber}`,
      });
      onTicketChange();
    },
    onError: (error: any) => {
      toast({
        title: "Error al llamar ticket",
        description: error.message || "No se pudo llamar al ticket",
        variant: "destructive",
      });
    },
  });

  const completeTicketMutation = useMutation({
    mutationFn: ({ ticketId }: CompleteTicketParams) => completeTicket(ticketId),
    onSuccess: () => {
      toast({
        title: "Ticket completado",
        description: `Se ha completado el ticket ${currentTicket?.ticketNumber}`,
      });
      onTicketChange();
    },
    onError: (error: any) => {
      toast({
        title: "Error al completar ticket",
        description: error.message || "No se pudo completar el ticket",
        variant: "destructive",
      });
    },
  });

  const cancelTicketMutation = useMutation({
    mutationFn: ({ ticketId }: CancelTicketParams) => cancelTicket(ticketId),
    onSuccess: () => {
      toast({
        title: "Ticket cancelado",
        description: `Se ha cancelado el ticket ${currentTicket?.ticketNumber}`,
      });
      onTicketChange();
    },
    onError: (error: any) => {
      toast({
        title: "Error al cancelar ticket",
        description: error.message || "No se pudo cancelar el ticket",
        variant: "destructive",
      });
    },
  });

  const redirectTicketMutation = useMutation({
    mutationFn: ({ ticketId, serviceType }: RedirectTicketParams) => 
      redirectTicket(ticketId, serviceType as ServiceType),
    onSuccess: () => {
      toast({
        title: "Ticket redirigido",
        description: `Se ha redirigido el ticket ${currentTicket?.ticketNumber} al servicio ${selectedService}`,
      });
      onTicketChange();
    },
    onError: (error: any) => {
      toast({
        title: "Error al redirigir ticket",
        description: error.message || "No se pudo redirigir el ticket",
        variant: "destructive",
      });
    },
  });

  const handleCallNext = async () => {
    if (!currentTicket) return;
    callTicketMutation.mutate({ 
      ticketId: currentTicket.id, 
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
              {currentTicket.counterNumber && (
                <p>
                  <span className="font-medium">Counter:</span> {currentTicket.counterNumber}
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
        <h3 className="text-lg font-semibold">Acciones</h3>
        <div className="mt-2 flex justify-center">
          <Button 
            className="w-full"
            onClick={handleCallNext} 
            disabled={callTicketMutation.isPending || !waitingTickets.length}
          >
            {callTicketMutation.isPending ? 'Llamando...' : 'Llamar Siguiente'}
            <PhoneCall className="w-4 h-4 ml-2" />
          </Button>
        </div>
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
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setIsRedirectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" onClick={handleRedirect}>
              Redirigir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TicketManager;

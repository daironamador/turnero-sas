
import React, { useState } from 'react';
import { toast } from 'sonner';
import { useMutation } from "@tanstack/react-query";
import { 
  callTicket, 
  completeTicket, 
  cancelTicket, 
  redirectTicket
} from '@/services/ticketService';
import { Service, Ticket, Room, ServiceType } from '@/lib/types';
import { useSpeechSynthesis } from './display/useSpeechSynthesis';

// Import our new component files
import CurrentTicket from './CurrentTicket';
import NextTicket from './NextTicket';
import TicketQueue from './TicketQueue';
import RedirectDialog from './RedirectDialog';

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
  const { announceTicket } = useSpeechSynthesis();

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

  // Handle "Call Again" functionality
  const handleCallAgain = () => {
    if (!currentTicket || !counterName) return;
    
    // Find the original room name if this is a redirected ticket
    let originalRoomName: string | undefined;
    if (currentTicket.redirectedFrom) {
      // Try to find the room with the matching service
      const possibleRooms = rooms.filter(
        r => r.service?.code === currentTicket.redirectedFrom
      );
      if (possibleRooms.length > 0) {
        originalRoomName = possibleRooms[0].name;
      } else {
        originalRoomName = `servicio ${currentTicket.redirectedFrom}`;
      }
    }
    
    // Call the announceTicket function with the ticket information
    announceTicket(
      currentTicket.ticketNumber, 
      counterName, 
      currentTicket.redirectedFrom, 
      originalRoomName
    );
    toast.success(`Volviendo a llamar al ticket ${currentTicket.ticketNumber}`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Current Ticket */}
      <CurrentTicket 
        currentTicket={currentTicket}
        onComplete={handleComplete}
        onCancel={handleCancel}
        onRedirect={() => setIsRedirectDialogOpen(true)}
        onCallAgain={currentTicket ? handleCallAgain : undefined}
        isCompletePending={completeTicketMutation.isPending}
        isCancelPending={cancelTicketMutation.isPending}
        isRedirectPending={redirectTicketMutation.isPending}
      />

      {/* Next Ticket and Waiting Queue */}
      <div className="space-y-6">
        {/* Next Ticket */}
        <NextTicket 
          nextTicket={nextTicket}
          onCallNext={handleCallNext}
          isCallPending={callTicketMutation.isPending}
        />

        {/* Waiting Queue */}
        <TicketQueue waitingTickets={waitingTickets} />
      </div>

      {/* Redirect Dialog */}
      <RedirectDialog 
        isOpen={isRedirectDialogOpen}
        onOpenChange={setIsRedirectDialogOpen}
        selectedService={selectedService}
        onSelectService={setSelectedService}
        onRedirect={handleRedirect}
        services={services}
      />
    </div>
  );
};

export default TicketManager;

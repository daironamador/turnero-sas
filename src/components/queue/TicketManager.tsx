
import React, { useState } from 'react';
import { Service, Ticket, Room } from '@/lib/types';
import { useTicketMutations } from '@/hooks/useTicketMutations';
import { useTicketAnnouncer } from '@/hooks/useTicketAnnouncer';

// Import our component files
import CurrentTicket from './CurrentTicket';
import NextTicket from './NextTicket';
import TicketQueue from './TicketQueue';
import RedirectDialog from './RedirectDialog';
import TicketHistory from './TicketHistory';
import TicketActions from './TicketActions';

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
  
  // Use our custom hooks
  const { announceTicket } = useTicketAnnouncer();
  const {
    callTicketMutation,
    completeTicketMutation,
    cancelTicketMutation,
    redirectTicketMutation,
    recallTicketMutation
  } = useTicketMutations(counterNumber, onTicketChange);

  // Handler functions
  const handleCallNext = () => {
    if (!nextTicket) return;
    callTicketMutation.mutate({ 
      ticketId: nextTicket.id, 
      counterNumber 
    });
  };

  const handleComplete = () => {
    if (!currentTicket) return;
    completeTicketMutation.mutate({ 
      ticketId: currentTicket.id 
    });
  };

  const handleCancel = () => {
    if (!currentTicket) return;
    cancelTicketMutation.mutate({ 
      ticketId: currentTicket.id 
    });
  };

  const handleRedirect = () => {
    if (!currentTicket || !selectedService) return;
    redirectTicketMutation.mutate({ 
      ticketId: currentTicket.id, 
      serviceType: selectedService as any
    });
    setIsRedirectDialogOpen(false);
  };

  const handleCallAgain = () => {
    if (!currentTicket || !counterName) return;
    announceTicket(currentTicket, counterName, rooms);
  };

  const handleRecallFromHistory = (ticket: Ticket) => {
    if (!counterName) return;
    
    recallTicketMutation.mutate({ 
      ticket 
    }, {
      onSuccess: () => {
        // After successfully recalling, announce the ticket
        const updatedTicket = {
          ...ticket,
          status: 'serving',
          calledAt: new Date(),
          counterNumber: counterNumber
        };
        
        announceTicket(updatedTicket, counterName, rooms);
      }
    });
  };

  return (
    <TicketActions
      currentTicket={currentTicket}
      nextTicket={nextTicket}
      waitingTickets={waitingTickets}
      counterNumber={counterNumber}
      rooms={rooms}
      services={services}
      onCallNext={handleCallNext}
      onComplete={handleComplete}
      onCancel={handleCancel}
      onRedirect={() => setIsRedirectDialogOpen(true)}
      onCallAgain={handleCallAgain}
      onRecallFromHistory={handleRecallFromHistory}
      isCompletePending={completeTicketMutation.isPending}
      isCancelPending={cancelTicketMutation.isPending}
      isRedirectPending={redirectTicketMutation.isPending}
      isCallPending={callTicketMutation.isPending}
      isRedirectDialogOpen={isRedirectDialogOpen}
      selectedService={selectedService}
      onSelectService={setSelectedService}
      onOpenRedirectChange={setIsRedirectDialogOpen}
      onConfirmRedirect={handleRedirect}
    />
  );
};

export default TicketManager;

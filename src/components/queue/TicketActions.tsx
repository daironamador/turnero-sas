
import React from 'react';
import { Service, Ticket, Room } from '@/lib/types';

// Import our component files
import CurrentTicket from './CurrentTicket';
import NextTicket from './NextTicket';
import TicketQueue from './TicketQueue';
import RedirectDialog from './RedirectDialog';
import TicketHistory from './TicketHistory';

interface TicketActionsProps {
  currentTicket?: Ticket;
  nextTicket?: Ticket;
  waitingTickets: Ticket[];
  counterNumber: string;
  rooms: Room[];
  services: Service[];
  onCallNext: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onRedirect: () => void;
  onCallAgain: () => void;
  onRecallFromHistory: (ticket: Ticket) => void;
  isCompletePending: boolean;
  isCancelPending: boolean;
  isRedirectPending: boolean;
  isCallPending: boolean;
  isRedirectDialogOpen: boolean;
  selectedService?: string;
  onSelectService: (value: string) => void;
  onOpenRedirectChange: (open: boolean) => void;
  onConfirmRedirect: () => void;
}

const TicketActions: React.FC<TicketActionsProps> = ({
  currentTicket,
  nextTicket,
  waitingTickets,
  counterNumber,
  rooms,
  services,
  onCallNext,
  onComplete,
  onCancel,
  onRedirect,
  onCallAgain,
  onRecallFromHistory,
  isCompletePending,
  isCancelPending,
  isRedirectPending,
  isCallPending,
  isRedirectDialogOpen,
  selectedService,
  onSelectService,
  onOpenRedirectChange,
  onConfirmRedirect
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Current Ticket */}
      <CurrentTicket 
        currentTicket={currentTicket}
        onComplete={onComplete}
        onCancel={onCancel}
        onRedirect={onRedirect}
        onCallAgain={currentTicket ? onCallAgain : undefined}
        isCompletePending={isCompletePending}
        isCancelPending={isCancelPending}
        isRedirectPending={isRedirectPending}
      />

      {/* Next Ticket and Waiting Queue */}
      <div className="space-y-6">
        {/* Next Ticket */}
        <NextTicket 
          nextTicket={nextTicket}
          onCallNext={onCallNext}
          isCallPending={isCallPending}
        />

        {/* Waiting Queue */}
        <TicketQueue waitingTickets={waitingTickets} />
      </div>

      {/* Ticket History Section */}
      <TicketHistory
        counterNumber={counterNumber}
        rooms={rooms}
        services={services}
        onRecallTicket={onRecallFromHistory}
      />

      {/* Redirect Dialog */}
      <RedirectDialog 
        isOpen={isRedirectDialogOpen}
        onOpenChange={onOpenRedirectChange}
        selectedService={selectedService}
        onSelectService={onSelectService}
        onRedirect={onConfirmRedirect}
        services={services}
      />
    </div>
  );
};

export default TicketActions;

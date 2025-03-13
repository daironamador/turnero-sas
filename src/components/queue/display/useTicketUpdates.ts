
import { useEffect } from 'react';
import { Ticket } from '@/lib/types';
import { useTicketAnnouncement } from './hooks/useTicketAnnouncement';
import { useTicketBroadcast } from './hooks/useTicketBroadcast';
import { useTicketVisibility } from './hooks/useTicketVisibility';

interface UseTicketUpdatesProps {
  roomsQuery: any;
  servingTicketsQuery: any;
  waitingTicketsQuery: any;
  newlyCalledTicket: Ticket | null;
  setNewlyCalledTicket: (ticket: Ticket | null) => void;
  lastAnnounced: string | null;
  setLastAnnounced: (id: string | null) => void;
}

export function useTicketUpdates({
  roomsQuery,
  servingTicketsQuery,
  waitingTicketsQuery,
  newlyCalledTicket,
  setNewlyCalledTicket,
  lastAnnounced,
  setLastAnnounced
}: UseTicketUpdatesProps) {
  // Handle ticket announcement processing
  const { processTicketAnnouncement } = useTicketAnnouncement({
    setNewlyCalledTicket,
    setLastAnnounced
  });
  
  // Handle broadcast channel and real-time updates
  useTicketBroadcast({
    processTicketAnnouncement
  });
  
  // Handle ticket visibility timeout
  useTicketVisibility({
    newlyCalledTicket,
    setNewlyCalledTicket
  });
}

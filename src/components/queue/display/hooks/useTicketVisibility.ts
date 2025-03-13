
import { useEffect } from 'react';
import { Ticket } from '@/lib/types';

interface UseTicketVisibilityProps {
  newlyCalledTicket: Ticket | null;
  setNewlyCalledTicket: (ticket: Ticket | null) => void;
}

export function useTicketVisibility({
  newlyCalledTicket,
  setNewlyCalledTicket
}: UseTicketVisibilityProps) {
  useEffect(() => {
    if (newlyCalledTicket) {
      const timer = setTimeout(() => {
        setNewlyCalledTicket(null);
      }, 10000);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [newlyCalledTicket, setNewlyCalledTicket]);
}

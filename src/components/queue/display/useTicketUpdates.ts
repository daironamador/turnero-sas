
import { useEffect } from 'react';
import { Ticket } from '@/lib/types';
import { useSpeechSynthesis } from './useSpeechSynthesis';

interface UseTicketUpdatesProps {
  roomsQuery: any;
  servingTicketsQuery: any;
  lastCalledTicketsQuery: any;
  newlyCalledTicket: Ticket | null;
  setNewlyCalledTicket: (ticket: Ticket | null) => void;
  lastAnnounced: string | null;
  setLastAnnounced: (ticketKey: string | null) => void;
}

export function useTicketUpdates({
  roomsQuery,
  servingTicketsQuery,
  lastCalledTicketsQuery,
  newlyCalledTicket,
  setNewlyCalledTicket,
  lastAnnounced,
  setLastAnnounced
}: UseTicketUpdatesProps) {
  const { announceTicket } = useSpeechSynthesis();

  // Listen for real-time updates on tickets table
  useEffect(() => {
    const handleTicketsUpdated = (event: CustomEvent) => {
      try {
        const payload = event.detail;
        
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          // If a ticket was just set to 'serving', announce it
          if (payload.new.status === 'serving' && 
              payload.new.called_at && 
              (!payload.old || payload.old.status !== 'serving')) {
            
            const ticketNumber = payload.new.ticket_number;
            const counterNumber = payload.new.counter_number;
            
            if (!ticketNumber) {
              console.error("Missing ticket number", payload);
              return;
            }
            
            // Prevent duplicate announcements for the same ticket
            const ticketKey = `${ticketNumber}-${counterNumber}`;
            if (lastAnnounced !== ticketKey) {
              // Get room name if possible
              let counterLabel = counterNumber ? counterNumber : 'recepción';
              if (roomsQuery.data && counterNumber) {
                const room = roomsQuery.data.find((r: any) => r.id === counterNumber);
                if (room) {
                  counterLabel = room.name;
                }
              }
              
              // Create ticket object for display
              const newTicket: Ticket = {
                id: payload.new.id,
                ticketNumber: ticketNumber,
                serviceType: payload.new.service_type,
                status: payload.new.status,
                isVip: payload.new.is_vip || false,
                createdAt: new Date(payload.new.created_at),
                calledAt: payload.new.called_at ? new Date(payload.new.called_at) : undefined,
                counterNumber: counterNumber,
                patientName: payload.new.patient_name,
              };
              
              setNewlyCalledTicket(newTicket);
              setLastAnnounced(ticketKey);
              
              // Announce the ticket with voice
              announceTicket(ticketNumber, counterLabel);
              
              // Remove the notification after a few seconds
              setTimeout(() => {
                setNewlyCalledTicket(null);
              }, 8000);
            }
          }
        }
        
        // Refresh queries when changes happen
        servingTicketsQuery.refetch();
        lastCalledTicketsQuery.refetch();
      } catch (error) {
        console.error("Error handling ticket update:", error);
      }
    };
    
    window.addEventListener('tickets-updated', handleTicketsUpdated as EventListener);
    
    return () => {
      window.removeEventListener('tickets-updated', handleTicketsUpdated as EventListener);
    };
  }, [lastAnnounced, roomsQuery.data, servingTicketsQuery, lastCalledTicketsQuery, setNewlyCalledTicket, setLastAnnounced, announceTicket]);
}

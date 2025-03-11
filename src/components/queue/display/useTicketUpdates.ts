
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSpeechSynthesis } from './useSpeechSynthesis';
import { Ticket, ServiceType } from '@/lib/types';

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
  const queryClient = useQueryClient();
  const { announceTicket } = useSpeechSynthesis();
  
  // Set up real-time listener for ticket changes
  useEffect(() => {
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tickets'
        }, 
        (payload) => {
          console.info('Cambio en tickets recibido!', payload);
          
          // Refresh the queries to get updated data
          queryClient.invalidateQueries({ queryKey: ['servingTickets'] });
          queryClient.invalidateQueries({ queryKey: ['waitingTickets'] });
          
          // Handle newly called tickets
          if (payload.eventType === 'UPDATE' && payload.new.status === 'serving') {
            const calledTicket = {
              id: payload.new.id,
              ticketNumber: payload.new.ticket_number,
              serviceType: payload.new.service_type,
              status: payload.new.status,
              isVip: payload.new.is_vip,
              createdAt: new Date(payload.new.created_at),
              calledAt: payload.new.called_at ? new Date(payload.new.called_at) : undefined,
              counterNumber: payload.new.counter_number,
              redirectedFrom: payload.new.redirected_from,
              previousTicketNumber: payload.new.previous_ticket_number
            } as Ticket;
            
            setNewlyCalledTicket(calledTicket);
            
            // Only announce if this is a new call (not already announced)
            // For recalled tickets, we always want to announce them
            // Check if this is a recall (previous status was not 'waiting')
            const isRecall = payload.old && payload.old.status && payload.old.status !== 'waiting';
            
            if (isRecall || lastAnnounced !== calledTicket.id) {
              // Find room name for current counter
              let roomName = `sala ${calledTicket.counterNumber}`;
              if (roomsQuery.data && calledTicket.counterNumber) {
                const room = roomsQuery.data.find((r: any) => r.id === calledTicket.counterNumber);
                if (room) {
                  roomName = room.name;
                }
              }
              
              // For redirected tickets, find the original room name
              let originalRoomName = undefined;
              if (calledTicket.redirectedFrom && roomsQuery.data) {
                // We look for rooms with the matching service type (where the ticket came from)
                const possibleRooms = roomsQuery.data.filter(
                  (r: any) => r.service?.code === calledTicket.redirectedFrom
                );
                if (possibleRooms.length > 0) {
                  originalRoomName = possibleRooms[0].name;
                } else {
                  originalRoomName = `servicio ${calledTicket.redirectedFrom}`;
                }
              }
              
              // Use the ticket number for the announcement (it's already the original number now)
              const ticketNumberToAnnounce = calledTicket.ticketNumber;
              
              // Announce the called ticket with redirection info if applicable
              announceTicket(
                ticketNumberToAnnounce, 
                roomName, 
                calledTicket.redirectedFrom, 
                originalRoomName
              );
              
              // If it's a recall, we don't update lastAnnounced so it will be announced every time
              if (!isRecall) {
                setLastAnnounced(calledTicket.id);
              }
            }
          }
        });
    
    channel.subscribe();
    
    // Handler for the custom recall event from the Llamada page
    const handleTicketRecalled = (event: CustomEvent) => {
      const { ticketNumber, counterName, redirectedFrom, originalRoomName } = event.detail;
      
      // Show notification
      if (roomsQuery.data) {
        // Create a notification ticket for display
        const notificationTicket = {
          id: `recall-${Date.now()}`,
          ticketNumber: ticketNumber,
          counterNumber: roomsQuery.data.find((r: any) => r.name === counterName)?.id || "",
          status: 'serving',
          serviceType: 'OT' as ServiceType, // Use a valid ServiceType
          isVip: false,
          createdAt: new Date(),
          calledAt: new Date(),
          redirectedFrom: redirectedFrom
        } as Ticket;
        
        setNewlyCalledTicket(notificationTicket);
      }
      
      // Announce the recalled ticket using the speech synthesis
      announceTicket(
        ticketNumber,
        counterName,
        redirectedFrom,
        originalRoomName
      );
      
      console.info('Ticket recalled event received:', event.detail);
    };
    
    // Add event listener for the custom event
    window.addEventListener('ticket-recalled', handleTicketRecalled as EventListener);
    
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('ticket-recalled', handleTicketRecalled as EventListener);
    };
  }, [
    queryClient, 
    roomsQuery.data, 
    announceTicket, 
    setNewlyCalledTicket, 
    lastAnnounced, 
    setLastAnnounced
  ]);
  
  // Clear notification after 10 seconds
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

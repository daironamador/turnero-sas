
import { useState } from 'react';
import { toast } from 'sonner';
import { initializeFirebase } from '@/lib/firebase';
import { Room, Service, Ticket } from '@/lib/types';
import { useTicketAnnouncer } from '../useTicketAnnouncer';

export const useCurrentTicket = (selectedRoom: (Room & { service: Service }) | null, rooms: (Room & { service: Service })[] = []) => {
  const [currentTicket, setCurrentTicket] = useState<Ticket | undefined>(undefined);
  const { announceTicket } = useTicketAnnouncer();
  
  const fetchCurrentTicket = async () => {
    if (!selectedRoom) return;
    
    try {
      const app = await initializeFirebase();
      
      if (!app) {
        throw new Error('Firebase not configured');
      }
      
      const { getFirestore, collection, query, where, orderBy, limit, getDocs } = await import('firebase/firestore');
      const db = getFirestore(app);
      
      const ticketsRef = collection(db, 'tickets');
      const currentTicketQuery = query(
        ticketsRef,
        where('status', '==', 'serving'),
        where('counter_number', '==', selectedRoom.id),
        orderBy('called_at', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(currentTicketQuery);
      
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        
        const ticket = {
          id: doc.id,
          ticketNumber: data.ticket_number,
          serviceType: data.service_type,
          status: data.status,
          isVip: data.is_vip,
          createdAt: new Date(data.created_at),
          calledAt: data.called_at ? new Date(data.called_at) : undefined,
          completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
          counterNumber: data.counter_number,
          patientName: data.patient_name,
          redirectedTo: data.redirected_to,
          redirectedFrom: data.redirected_from,
          previousTicketNumber: data.previous_ticket_number,
        };
        
        setCurrentTicket(ticket);
        
        // Announce the ticket whenever fetched
        if (rooms && selectedRoom) {
          announceTicket(ticket, selectedRoom.name, rooms);
        }
      } else {
        setCurrentTicket(undefined);
      }
    } catch (error) {
      console.error('Error fetching current ticket:', error);
      toast.error("Error al cargar el ticket actual");
    }
  };

  return {
    currentTicket,
    setCurrentTicket,
    fetchCurrentTicket
  };
};

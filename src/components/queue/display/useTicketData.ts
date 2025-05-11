
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { initializeFirebase } from '@/lib/firebase';
import { Ticket, ServiceType } from '@/lib/types';

export function useTicketData(refreshInterval: number = 5000) {
  const [newlyCalledTicket, setNewlyCalledTicket] = useState<Ticket | null>(null);
  const [lastAnnounced, setLastAnnounced] = useState<string | null>(null);
  
  // Fetch current serving tickets
  const servingTicketsQuery = useQuery({
    queryKey: ['servingTickets'],
    queryFn: async () => {
      try {
        const app = await initializeFirebase();
        
        if (!app) {
          throw new Error('Firebase not configured');
        }
        
        const { getFirestore, collection, query, where, orderBy, getDocs } = await import('firebase/firestore');
        const db = getFirestore(app);
        
        const ticketsRef = collection(db, 'tickets');
        const servingTicketsQuery = query(
          ticketsRef,
          where('status', '==', 'serving'),
          orderBy('called_at', 'desc')
        );
        
        const snapshot = await getDocs(servingTicketsQuery);
        
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ticketNumber: data.ticket_number,
            serviceType: data.service_type as ServiceType,
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
        });
      } catch (error) {
        console.error("Error fetching serving tickets:", error);
        return [];
      }
    },
    refetchInterval: refreshInterval,
  });
  
  // Fetch waiting tickets
  const waitingTicketsQuery = useQuery({
    queryKey: ['waitingTickets'],
    queryFn: async () => {
      try {
        const app = await initializeFirebase();
        
        if (!app) {
          throw new Error('Firebase not configured');
        }
        
        const { getFirestore, collection, query, where, orderBy, limit, getDocs } = await import('firebase/firestore');
        const db = getFirestore(app);
        
        const ticketsRef = collection(db, 'tickets');
        const waitingTicketsQuery = query(
          ticketsRef,
          where('status', '==', 'waiting'),
          orderBy('created_at', 'asc'),
          limit(10)
        );
        
        const snapshot = await getDocs(waitingTicketsQuery);
        
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ticketNumber: data.ticket_number,
            serviceType: data.service_type as ServiceType,
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
        });
      } catch (error) {
        console.error("Error fetching waiting tickets:", error);
        return [];
      }
    },
    refetchInterval: refreshInterval,
  });
  
  // Fetch room data
  const roomsQuery = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      try {
        const app = await initializeFirebase();
        
        if (!app) {
          throw new Error('Firebase not configured');
        }
        
        const { getFirestore, collection, getDocs } = await import('firebase/firestore');
        const db = getFirestore(app);
        
        // Get rooms
        const roomsRef = collection(db, 'rooms');
        const roomsSnapshot = await getDocs(roomsRef);
        
        // Get services (to join with rooms)
        const servicesRef = collection(db, 'services');
        const servicesSnapshot = await getDocs(servicesRef);
        
        // Create services map
        const servicesMap = new Map();
        servicesSnapshot.forEach(doc => {
          servicesMap.set(doc.id, { id: doc.id, ...doc.data() });
        });
        
        // Join rooms with services
        return roomsSnapshot.docs.map(doc => {
          const roomData = doc.data();
          const service = servicesMap.get(roomData.service_id);
          
          return {
            ...roomData,
            id: doc.id,
            service: service || { id: roomData.service_id, code: 'unknown', name: 'Unknown Service' }
          };
        });
      } catch (error) {
        console.error("Error fetching rooms:", error);
        return [];
      }
    },
  });

  return {
    servingTicketsQuery,
    waitingTicketsQuery,
    roomsQuery,
    newlyCalledTicket,
    setNewlyCalledTicket,
    lastAnnounced,
    setLastAnnounced
  };
}

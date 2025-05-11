
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { initializeFirebase } from '@/lib/firebase';
import { getTicketsByStatus } from '@/services/ticketService';
import { Room, Service, Ticket } from '@/lib/types';
import { toast } from 'sonner';
import { useTicketAnnouncer } from './useTicketAnnouncer';

export function useLlamadaData() {
  const [selectedRoom, setSelectedRoom] = useState<(Room & { service: Service }) | null>(null);
  const [currentTicket, setCurrentTicket] = useState<Ticket | undefined>(undefined);
  const { announceTicket } = useTicketAnnouncer();
  
  // Fetch waiting tickets
  const waitingTicketsQuery = useQuery({
    queryKey: ['waitingTickets'],
    queryFn: async () => {
      const tickets = await getTicketsByStatus('waiting');
      
      // Sort tickets: VIP tickets first, then regular tickets, both by creation date
      return tickets.sort((a, b) => {
        // First sort by VIP status (VIP tickets come first)
        if (a.isVip && !b.isVip) return -1;
        if (!a.isVip && b.isVip) return 1;
        
        // Then sort by creation date (oldest first)
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    },
  });

  // Fetch rooms with their services
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
            isActive: roomData.is_active,
            service: service || { id: roomData.service_id, code: 'unknown', name: 'Unknown Service' }
          };
        }).filter(room => room.isActive);
      } catch (error) {
        console.error("Error fetching rooms:", error);
        return [];
      }
    },
  });

  // Fetch services
  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      try {
        const app = await initializeFirebase();
        
        if (!app) {
          throw new Error('Firebase not configured');
        }
        
        const { getFirestore, collection, query, where, getDocs } = await import('firebase/firestore');
        const db = getFirestore(app);
        
        const servicesRef = collection(db, 'services');
        const servicesQuery = query(
          servicesRef,
          where('is_active', '==', true)
        );
        
        const snapshot = await getDocs(servicesQuery);
        
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            code: data.code,
            name: data.name,
            description: data.description,
            isActive: data.is_active,
            createdAt: new Date(data.created_at)
          };
        });
      } catch (error) {
        console.error("Error fetching services:", error);
        return [];
      }
    },
  });

  // Fetch the current ticket being served at this room
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
        if (roomsQuery.data && selectedRoom) {
          announceTicket(ticket, selectedRoom.name, roomsQuery.data);
        }
      } else {
        setCurrentTicket(undefined);
      }
    } catch (error) {
      console.error('Error fetching current ticket:', error);
      toast.error("Error al cargar el ticket actual");
    }
  };

  // Handle ticket changes (refresh data)
  const handleTicketChange = () => {
    waitingTicketsQuery.refetch();
    fetchCurrentTicket();
  };

  // Initial data fetching
  useEffect(() => {
    fetchCurrentTicket();
  }, [selectedRoom]);

  // Listen for real-time updates
  useEffect(() => {
    const handleTicketsUpdated = () => {
      handleTicketChange();
    };

    window.addEventListener('tickets-updated', handleTicketsUpdated);
    
    return () => {
      window.removeEventListener('tickets-updated', handleTicketsUpdated);
    };
  }, []);

  // Auto-select the first room when data loads
  useEffect(() => {
    if (roomsQuery.data && roomsQuery.data.length > 0 && !selectedRoom) {
      setSelectedRoom(roomsQuery.data[0]);
    }
  }, [roomsQuery.data]);

  return {
    selectedRoom,
    setSelectedRoom,
    currentTicket,
    waitingTicketsQuery,
    roomsQuery,
    servicesQuery,
    handleTicketChange,
    announceTicket
  };
}

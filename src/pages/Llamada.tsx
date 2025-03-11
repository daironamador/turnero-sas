
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import TicketManager from '@/components/queue/TicketManager';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { getTicketsByStatus } from '@/services/ticketService';
import { Room, Service, Ticket } from '@/lib/types';
import { toast } from 'sonner';

const Llamada: React.FC = () => {
  const [counterNumber, setCounterNumber] = useState<number>(1);
  const [currentTicket, setCurrentTicket] = useState<Ticket | undefined>(undefined);
  
  // Fetch waiting tickets
  const waitingTicketsQuery = useQuery({
    queryKey: ['waitingTickets'],
    queryFn: async () => getTicketsByStatus('waiting'),
  });

  // Fetch rooms
  const roomsQuery = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('is_active', true);
      
      if (error) {
        throw error;
      }
      
      return data as Room[];
    },
  });

  // Fetch services
  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true);
      
      if (error) {
        throw error;
      }
      
      return data as Service[];
    },
  });

  // Handle ticket changes (refresh data)
  const handleTicketChange = () => {
    waitingTicketsQuery.refetch();
    // Find a ticket currently being served at this counter
    fetchCurrentTicket();
  };

  // Fetch the current ticket being served at this counter
  const fetchCurrentTicket = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('status', 'serving')
        .eq('counter_number', counterNumber)
        .order('called_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setCurrentTicket({
          id: data[0].id,
          ticketNumber: data[0].ticket_number,
          serviceType: data[0].service_type,
          status: data[0].status,
          isVip: data[0].is_vip,
          createdAt: new Date(data[0].created_at),
          calledAt: data[0].called_at ? new Date(data[0].called_at) : undefined,
          completedAt: data[0].completed_at ? new Date(data[0].completed_at) : undefined,
          counterNumber: data[0].counter_number,
          patientName: data[0].patient_name,
          redirectedTo: data[0].redirected_to,
          redirectedFrom: data[0].redirected_from,
          previousTicketNumber: data[0].previous_ticket_number,
        });
      } else {
        setCurrentTicket(undefined);
      }
    } catch (error) {
      console.error('Error fetching current ticket:', error);
      toast({
        description: "Error al cargar el ticket actual",
        variant: "destructive"
      });
    }
  };

  // Initial data fetching
  useEffect(() => {
    fetchCurrentTicket();
  }, [counterNumber]);

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

  // Check for loading or error states
  if (waitingTicketsQuery.isLoading || roomsQuery.isLoading || servicesQuery.isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (waitingTicketsQuery.error || roomsQuery.error || servicesQuery.error) {
    return (
      <MainLayout>
        <div className="p-4 border border-destructive rounded-md text-center">
          <p className="text-destructive">Error al cargar datos</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Llamada de Tickets</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Counter:</span>
          <select 
            className="border rounded px-2 py-1 bg-background"
            value={counterNumber}
            onChange={(e) => setCounterNumber(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5].map(num => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <TicketManager 
        currentTicket={currentTicket}
        waitingTickets={waitingTicketsQuery.data || []}
        rooms={roomsQuery.data || []}
        services={servicesQuery.data || []}
        counterNumber={counterNumber}
        onTicketChange={handleTicketChange}
      />
    </MainLayout>
  );
};

export default Llamada;

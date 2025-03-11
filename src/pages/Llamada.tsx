
import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import TicketManager from '@/components/queue/TicketManager';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { getTicketsByStatus } from '@/services/ticketService';
import { Room, Service, Ticket } from '@/lib/types';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PhoneCall } from 'lucide-react';

const Llamada: React.FC = () => {
  const [selectedRoom, setSelectedRoom] = useState<(Room & { service: Service }) | null>(null);
  const [currentTicket, setCurrentTicket] = useState<Ticket | undefined>(undefined);
  
  // Fetch waiting tickets
  const waitingTicketsQuery = useQuery({
    queryKey: ['waitingTickets'],
    queryFn: async () => getTicketsByStatus('waiting'),
  });

  // Fetch rooms with their services
  const roomsQuery = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*, service:service_id(id, code, name)')
        .eq('is_active', true);
      
      if (error) {
        throw error;
      }
      
      return data as (Room & { service: Service })[];
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
    fetchCurrentTicket();
  };

  // Fetch the current ticket being served at this room
  const fetchCurrentTicket = async () => {
    if (!selectedRoom) return;
    
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('status', 'serving')
        .eq('counter_number', selectedRoom.id)
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
      toast.error("Error al cargar el ticket actual");
    }
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

  const roomsByService = roomsQuery.data?.reduce((acc, room) => {
    const serviceCode = room.service.code;
    if (!acc[serviceCode]) {
      acc[serviceCode] = [];
    }
    acc[serviceCode].push(room);
    return acc;
  }, {} as Record<string, (Room & { service: Service })[]>);

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <PhoneCall className="mr-2 h-6 w-6 text-primary" />
          Llamada de Tickets
        </h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <Tabs defaultValue={selectedRoom?.id} onValueChange={(value) => {
          const room = roomsQuery.data?.find(r => r.id === value);
          if (room) setSelectedRoom(room);
        }}>
          <div className="bg-muted/50 p-1 border-b">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 w-full h-auto bg-transparent gap-1">
              {roomsQuery.data?.map(room => (
                <TabsTrigger 
                  key={room.id} 
                  value={room.id}
                  className="py-2 px-3 data-[state=active]:bg-white data-[state=active]:shadow-md flex-col items-center justify-center h-full"
                >
                  <div className="font-medium">{room.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{room.service.name}</div>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          {roomsQuery.data?.map(room => (
            <TabsContent key={room.id} value={room.id} className="mt-0 p-4">
              {selectedRoom && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-xl font-semibold">{selectedRoom.name}</h2>
                      <p className="text-muted-foreground">
                        Servicio: <Badge variant="outline">{selectedRoom.service.name}</Badge>
                      </p>
                    </div>
                  </div>
                  
                  <TicketManager 
                    currentTicket={currentTicket}
                    waitingTickets={waitingTicketsQuery.data?.filter(
                      ticket => ticket.serviceType === selectedRoom.service.code
                    ) || []}
                    rooms={roomsQuery.data || []}
                    services={servicesQuery.data || []}
                    counterNumber={selectedRoom.id}
                    counterName={selectedRoom.name}
                    onTicketChange={handleTicketChange}
                  />
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Llamada;

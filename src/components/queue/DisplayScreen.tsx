import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceType, ServiceTypeLabels, Ticket } from '@/lib/types';
import { format } from 'date-fns';
import { Bell, Volume2, Star, ArrowRightLeft, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';

interface DisplayScreenProps {
  refreshInterval?: number;
}

const DisplayScreen: React.FC<DisplayScreenProps> = ({ refreshInterval = 5000 }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newlyCalledTicket, setNewlyCalledTicket] = useState<Ticket | null>(null);
  const [lastAnnounced, setLastAnnounced] = useState<string | null>(null);
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Fetch current serving tickets
  const servingTicketsQuery = useQuery({
    queryKey: ['servingTickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('status', 'serving')
        .order('called_at', { ascending: false });
      
      if (error) throw error;
      
      return data.map(ticket => ({
        id: ticket.id,
        ticketNumber: ticket.ticket_number,
        serviceType: ticket.service_type as ServiceType,
        status: ticket.status,
        isVip: ticket.is_vip,
        createdAt: new Date(ticket.created_at),
        calledAt: ticket.called_at ? new Date(ticket.called_at) : undefined,
        completedAt: ticket.completed_at ? new Date(ticket.completed_at) : undefined,
        counterNumber: ticket.counter_number,
        patientName: ticket.patient_name,
        redirectedTo: ticket.redirected_to,
        redirectedFrom: ticket.redirected_from,
        previousTicketNumber: ticket.previous_ticket_number,
      }));
    },
    refetchInterval: refreshInterval,
  });
  
  // Fetch last completed/redirected tickets
  const lastCalledTicketsQuery = useQuery({
    queryKey: ['lastCalledTickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .in('status', ['completed', 'redirected'])
        .order('completed_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      return data.map(ticket => ({
        id: ticket.id,
        ticketNumber: ticket.ticket_number,
        serviceType: ticket.service_type as ServiceType,
        status: ticket.status,
        isVip: ticket.is_vip,
        createdAt: new Date(ticket.created_at),
        calledAt: ticket.called_at ? new Date(ticket.called_at) : undefined,
        completedAt: ticket.completed_at ? new Date(ticket.completed_at) : undefined,
        counterNumber: ticket.counter_number,
        patientName: ticket.patient_name,
        redirectedTo: ticket.redirected_to,
        redirectedFrom: ticket.redirected_from,
        previousTicketNumber: ticket.previous_ticket_number,
      }));
    },
    refetchInterval: refreshInterval,
  });
  
  // Fetch room data
  const roomsQuery = useQuery({
    queryKey: ['rooms'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*, service:service_id(id, code, name)');
      
      if (error) throw error;
      
      return data;
    },
  });
  
  // Listen for real-time updates on tickets table
  useEffect(() => {
    const handleTicketsUpdated = (event: CustomEvent) => {
      const payload = event.detail;
      
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        // If a ticket was just set to 'serving', announce it
        if (payload.new.status === 'serving' && 
            payload.new.called_at && 
            (!payload.old || payload.old.status !== 'serving')) {
          
          const ticketNumber = payload.new.ticket_number;
          const counterNumber = payload.new.counter_number;
          
          // Prevent duplicate announcements for the same ticket
          const ticketKey = `${ticketNumber}-${counterNumber}`;
          if (lastAnnounced !== ticketKey) {
            // Get room name if possible
            let counterLabel = counterNumber;
            if (roomsQuery.data) {
              const room = roomsQuery.data.find(r => r.id === counterNumber);
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
              isVip: payload.new.is_vip,
              createdAt: new Date(payload.new.created_at),
              calledAt: new Date(payload.new.called_at),
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
    };
    
    window.addEventListener('tickets-updated', handleTicketsUpdated as EventListener);
    
    return () => {
      window.removeEventListener('tickets-updated', handleTicketsUpdated as EventListener);
    };
  }, [lastAnnounced, roomsQuery.data]);
  
  // Function to announce ticket via speech synthesis
  const announceTicket = (ticketNumber: string, counterName: string) => {
    if (!window.speechSynthesis) return;
    
    const speech = new SpeechSynthesisUtterance();
    speech.text = `Turno #${ticketNumber}, pasar a ${counterName}`;
    speech.lang = 'es-ES';
    speech.volume = 1;
    speech.rate = 0.9;
    speech.pitch = 1;
    
    // Try to find a female Spanish voice
    const voices = window.speechSynthesis.getVoices();
    const spanishVoices = voices.filter(voice => 
      voice.lang.includes('es') && voice.name.includes('Female')
    );
    
    if (spanishVoices.length > 0) {
      speech.voice = spanishVoices[0];
    } else {
      // Use any Spanish voice as fallback
      const anySpanishVoice = voices.filter(voice => voice.lang.includes('es'));
      if (anySpanishVoice.length > 0) {
        speech.voice = anySpanishVoice[0];
      }
    }
    
    window.speechSynthesis.speak(speech);
  };
  
  // Make sure voices are loaded
  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };
    
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-ocular-600 text-white p-6">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">Centro Oftalmológico</h1>
          <div className="text-xl font-medium">{format(currentTime, "HH:mm - EEEE, dd 'de' MMMM, yyyy")}</div>
        </div>
      </div>
      
      {/* Newly called ticket notification */}
      {newlyCalledTicket && (
        <div className={`text-white p-4 animate-pulse ${newlyCalledTicket.isVip ? 'bg-yellow-500' : 'bg-ocular-500'}`}>
          <div className="container mx-auto flex items-center">
            <Bell className="w-6 h-6 mr-3 animate-bounce" />
            <span className="text-xl font-bold mr-2 flex items-center">
              Turno #{newlyCalledTicket.ticketNumber}
              {newlyCalledTicket.isVip && <Star className="ml-2 h-5 w-5" />}
            </span>
            <span className="text-xl">
              {roomsQuery.data && newlyCalledTicket.counterNumber ? 
                `por favor dirigirse a ${roomsQuery.data.find(r => r.id === newlyCalledTicket.counterNumber)?.name || `sala ${newlyCalledTicket.counterNumber}`}` : 
                "por favor dirigirse a recepción"}
            </span>
            <Volume2 className="w-6 h-6 ml-auto" />
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="flex-1 container mx-auto p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Currently serving */}
        <div className="lg:col-span-3 space-y-6">
          <h2 className="text-2xl font-bold text-ocular-700 flex items-center">
            <Bell className="w-6 h-6 mr-2 text-ocular-600" />
            Atendiendo Ahora
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {servingTicketsQuery.isLoading ? (
              <Card className="md:col-span-2">
                <CardContent className="flex items-center justify-center p-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocular-600"></div>
                </CardContent>
              </Card>
            ) : servingTicketsQuery.data?.length === 0 ? (
              <Card className="md:col-span-2 bg-gray-100">
                <CardContent className="flex items-center justify-center p-12">
                  <p className="text-xl text-gray-500">No hay tickets en atención</p>
                </CardContent>
              </Card>
            ) : (
              servingTicketsQuery.data?.map((ticket) => {
                // Get room name if available
                let counterName = `Sala ${ticket.counterNumber}`;
                if (roomsQuery.data && ticket.counterNumber) {
                  const room = roomsQuery.data.find(r => r.id === ticket.counterNumber);
                  if (room) {
                    counterName = room.name;
                  }
                }
                
                return (
                  <Card 
                    key={ticket.id} 
                    className={`${ticket.isVip ? 'border-2 border-yellow-500 bg-yellow-50' : 'border-2 border-ocular-600 bg-ocular-50'}`}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="flex justify-between">
                        <div className="flex items-center">
                          <span className="text-xl">{counterName}</span>
                          {ticket.isVip && <Star className="ml-2 h-5 w-5 text-yellow-500" />}
                        </div>
                        <span className={ticket.isVip ? 'text-yellow-700' : 'text-ocular-700'}>
                          {ServiceTypeLabels[ticket.serviceType]}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-center py-4">
                        <span className={`text-5xl font-bold ${ticket.isVip ? 'text-yellow-700' : 'text-ocular-700'}`}>
                          #{ticket.ticketNumber}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
        
        {/* Last called tickets */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-ocular-700">Últimos Llamados</h2>
          
          <div className="space-y-3">
            {lastCalledTicketsQuery.isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocular-600"></div>
                </CardContent>
              </Card>
            ) : lastCalledTicketsQuery.data?.length === 0 ? (
              <Card className="bg-gray-100">
                <CardContent className="flex items-center justify-center p-8">
                  <p className="text-gray-500">No hay registros de tickets llamados</p>
                </CardContent>
              </Card>
            ) : (
              lastCalledTicketsQuery.data?.map((ticket) => {
                // Get room name if available
                let counterName = `Sala ${ticket.counterNumber}`;
                if (roomsQuery.data && ticket.counterNumber) {
                  const room = roomsQuery.data.find(r => r.id === ticket.counterNumber);
                  if (room) {
                    counterName = room.name;
                  }
                }
                
                return (
                  <Card 
                    key={ticket.id} 
                    className={`border ${ticket.isVip ? 'border-yellow-200' : 'border-gray-200'}`}
                  >
                    <CardContent className="py-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center">
                            <p className="text-2xl font-semibold">#{ticket.ticketNumber}</p>
                            {ticket.isVip && <Star className="ml-2 h-4 w-4 text-yellow-500" />}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            {ServiceTypeLabels[ticket.serviceType]} • {format(ticket.calledAt!, "HH:mm")}
                            
                            {ticket.status === 'redirected' && ticket.redirectedTo && (
                              <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200 flex items-center gap-1">
                                <ArrowRightLeft className="h-3 w-3 mr-1" />
                                {ServiceTypeLabels[ticket.redirectedTo]}
                              </Badge>
                            )}
                            
                            {ticket.status === 'completed' && (
                              <Badge className="ml-2 bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                                <Check className="h-3 w-3 mr-1" />
                                Completado
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="bg-gray-100 px-3 py-2 rounded-md text-center">
                          <p className={`text-xl font-semibold ${ticket.isVip ? 'text-yellow-700' : 'text-ocular-700'}`}>
                            {ticket.counterNumber}
                          </p>
                          <p className="text-xs text-gray-500">Sala</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-ocular-800 text-white py-4">
        <div className="container mx-auto text-center">
          <p>Sistema de Gestión de Turnos • Centro Oftalmológico</p>
        </div>
      </div>
    </div>
  );
};

export default DisplayScreen;

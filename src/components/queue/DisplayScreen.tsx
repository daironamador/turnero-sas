
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceType, ServiceTypeLabels, Ticket } from '@/lib/types';
import { format } from 'date-fns';
import { Bell, Volume2, Star, ArrowRightLeft, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mock data for demonstration
const mockCurrentTickets: Ticket[] = [
  {
    id: '5',
    ticketNumber: 'CG003',
    serviceType: 'CG',
    status: 'serving',
    createdAt: new Date(new Date().getTime() - 1000 * 60 * 2), // 2 minutes ago
    calledAt: new Date(),
    counterNumber: 1,
  },
  {
    id: '6',
    ticketNumber: 'RX002',
    serviceType: 'RX',
    status: 'serving',
    createdAt: new Date(new Date().getTime() - 1000 * 60 * 8), // 8 minutes ago
    calledAt: new Date(new Date().getTime() - 1000 * 10), // 10 seconds ago
    counterNumber: 2,
    isVip: true,
  },
];

const mockLastCalledTickets: Ticket[] = [
  {
    id: '7',
    ticketNumber: 'CG005',
    serviceType: 'CG',
    status: 'completed',
    createdAt: new Date(new Date().getTime() - 1000 * 60 * 30), // 30 minutes ago
    calledAt: new Date(new Date().getTime() - 1000 * 60 * 5), // 5 minutes ago
    completedAt: new Date(),
    counterNumber: 1,
  },
  {
    id: '8',
    ticketNumber: 'RR002',
    serviceType: 'RR',
    status: 'redirected',
    createdAt: new Date(new Date().getTime() - 1000 * 60 * 35), // 35 minutes ago
    calledAt: new Date(new Date().getTime() - 1000 * 60 * 10), // 10 minutes ago
    completedAt: new Date(new Date().getTime() - 1000 * 60 * 2), // 2 minutes ago
    counterNumber: 3,
    redirectedTo: 'CG',
    isVip: true,
  },
  {
    id: '9',
    ticketNumber: 'EX001',
    serviceType: 'EX',
    status: 'completed',
    createdAt: new Date(new Date().getTime() - 1000 * 60 * 40), // 40 minutes ago
    calledAt: new Date(new Date().getTime() - 1000 * 60 * 15), // 15 minutes ago
    completedAt: new Date(new Date().getTime() - 1000 * 60 * 5), // 5 minutes ago
    counterNumber: 4,
  },
];

interface DisplayScreenProps {
  refreshInterval?: number;
}

const DisplayScreen: React.FC<DisplayScreenProps> = ({ refreshInterval = 5000 }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentTickets, setCurrentTickets] = useState<Ticket[]>(mockCurrentTickets);
  const [lastCalledTickets, setLastCalledTickets] = useState<Ticket[]>(mockLastCalledTickets);
  const [newlyCalledTicket, setNewlyCalledTicket] = useState<Ticket | null>(null);
  
  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);
  
  // In a real app, this would poll the server for updates
  useEffect(() => {
    const fetchData = () => {
      // Simulate a new ticket being called occasionally
      if (Math.random() > 0.7) {
        const serviceTypes: ServiceType[] = ['CG', 'RX', 'RR', 'EX', 'OT'];
        const randomService = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
        const randomNumber = Math.floor(Math.random() * 100).toString().padStart(3, '0');
        const randomCounter = Math.floor(Math.random() * 4) + 1;
        const isVip = Math.random() > 0.8; // 20% chance of being VIP
        
        const newTicket: Ticket = {
          id: crypto.randomUUID(),
          ticketNumber: `${randomService}${randomNumber}`,
          serviceType: randomService,
          status: 'serving',
          isVip,
          createdAt: new Date(new Date().getTime() - 1000 * 60 * 5),
          calledAt: new Date(),
          counterNumber: randomCounter,
        };
        
        setNewlyCalledTicket(newTicket);
        
        // Update current tickets after a delay
        setTimeout(() => {
          setCurrentTickets(prev => [...prev.filter(t => t.counterNumber !== randomCounter), newTicket]);
          setNewlyCalledTicket(null);
        }, 5000);
      }
    };
    
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);
  
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
              por favor dirigirse a sala {newlyCalledTicket.counterNumber}
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
            {currentTickets.length === 0 ? (
              <Card className="md:col-span-2 bg-gray-100">
                <CardContent className="flex items-center justify-center p-12">
                  <p className="text-xl text-gray-500">No hay tickets en atención</p>
                </CardContent>
              </Card>
            ) : (
              currentTickets.map((ticket) => (
                <Card 
                  key={ticket.id} 
                  className={`${ticket.isVip ? 'border-2 border-yellow-500 bg-yellow-50' : 'border-2 border-ocular-600 bg-ocular-50'}`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex justify-between">
                      <div className="flex items-center">
                        <span className="text-xl">Sala {ticket.counterNumber}</span>
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
              ))
            )}
          </div>
        </div>
        
        {/* Last called tickets */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-ocular-700">Últimos Llamados</h2>
          
          <div className="space-y-3">
            {lastCalledTickets.length === 0 ? (
              <Card className="bg-gray-100">
                <CardContent className="flex items-center justify-center p-8">
                  <p className="text-gray-500">No hay registros de tickets llamados</p>
                </CardContent>
              </Card>
            ) : (
              lastCalledTickets.map((ticket) => (
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
              ))
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

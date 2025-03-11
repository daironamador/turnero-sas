
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Bell } from 'lucide-react';
import { Ticket, ServiceTypeLabels } from '@/lib/types';

interface ServingTicketsSectionProps {
  tickets: Ticket[] | undefined;
  rooms: any[] | undefined;
  isLoading: boolean;
}

const ServingTicketsSection: React.FC<ServingTicketsSectionProps> = ({ tickets, rooms, isLoading }) => {
  return (
    <div className="lg:col-span-3 space-y-6">
      <h2 className="text-2xl font-bold text-ocular-700 flex items-center">
        <Bell className="w-6 h-6 mr-2 text-ocular-600" />
        Atendiendo Ahora
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <Card className="md:col-span-2">
            <CardContent className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ocular-600"></div>
            </CardContent>
          </Card>
        ) : tickets?.length === 0 ? (
          <Card className="md:col-span-2 bg-gray-100">
            <CardContent className="flex items-center justify-center p-12">
              <p className="text-xl text-gray-500">No hay tickets en atención</p>
            </CardContent>
          </Card>
        ) : (
          tickets?.map((ticket) => {
            // Get room name if available
            let counterName = `Sala ${ticket.counterNumber}`;
            if (rooms && ticket.counterNumber) {
              const room = rooms.find(r => r.id === ticket.counterNumber);
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
  );
};

export default ServingTicketsSection;

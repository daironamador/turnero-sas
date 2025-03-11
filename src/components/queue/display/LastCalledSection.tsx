
import React from 'react';
import { format } from 'date-fns';
import { ArrowRightLeft, Check, Star } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, ServiceTypeLabels } from '@/lib/types';

interface LastCalledSectionProps {
  tickets: Ticket[] | undefined;
  rooms: any[] | undefined;
  isLoading: boolean;
}

const LastCalledSection: React.FC<LastCalledSectionProps> = ({ tickets, rooms, isLoading }) => {
  return (
    <div className="lg:col-span-2 space-y-6">
      <h2 className="text-2xl font-bold text-ocular-700">Últimos Llamados</h2>
      
      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ocular-600"></div>
            </CardContent>
          </Card>
        ) : tickets?.length === 0 ? (
          <Card className="bg-gray-100">
            <CardContent className="flex items-center justify-center p-8">
              <p className="text-gray-500">No hay registros de tickets llamados</p>
            </CardContent>
          </Card>
        ) : (
          tickets?.map((ticket) => {
            // Get room name if available
            let roomName = ticket.counterNumber || '';
            if (rooms && ticket.counterNumber) {
              const room = rooms.find(r => r.id === ticket.counterNumber);
              if (room) {
                roomName = room.name;
              }
            }
            
            // Format the time safely
            let formattedTime = "";
            try {
              if (ticket.calledAt) {
                formattedTime = format(ticket.calledAt, "HH:mm");
              }
            } catch (error) {
              console.error("Error formatting date:", error);
              formattedTime = "--:--";
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
                        {ServiceTypeLabels[ticket.serviceType]} • {formattedTime}
                        
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
                        {roomName}
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
  );
};

export default LastCalledSection;

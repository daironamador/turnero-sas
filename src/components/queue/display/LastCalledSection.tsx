
import React from 'react';
import { format } from 'date-fns';
import { ArrowRightLeft, Check, Star, Clock } from 'lucide-react';
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
      <h2 className="text-2xl font-bold text-ocular-700">Turnos en Espera</h2>
      
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
              <p className="text-gray-500">No hay turnos en espera</p>
            </CardContent>
          </Card>
        ) : (
          tickets?.map((ticket) => {            
            // Format the time safely
            let formattedTime = "";
            try {
              if (ticket.createdAt) {
                formattedTime = format(new Date(ticket.createdAt), "HH:mm");
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
                        {ServiceTypeLabels[ticket.serviceType]} • <span className="flex items-center"><Clock className="h-3 w-3 mx-1" /> {formattedTime}</span>
                      </div>
                    </div>
                    <div className="bg-yellow-50 px-3 py-2 rounded-md text-center">
                      <p className={`text-xl font-semibold ${ticket.isVip ? 'text-yellow-700' : 'text-ocular-700'}`}>
                        En espera
                      </p>
                      <p className="text-xs text-gray-500">Estado</p>
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

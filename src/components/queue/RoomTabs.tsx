
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Room, Service, Ticket } from '@/lib/types';
import TicketManager from '@/components/queue/TicketManager';

interface RoomTabsProps {
  rooms: (Room & { service: Service })[];
  selectedRoom: (Room & { service: Service }) | null;
  setSelectedRoom: (room: Room & { service: Service }) => void;
  currentTicket: Ticket | undefined;
  waitingTickets: Ticket[];
  services: Service[];
  onTicketChange: () => void;
}

const RoomTabs: React.FC<RoomTabsProps> = ({
  rooms,
  selectedRoom,
  setSelectedRoom,
  currentTicket,
  waitingTickets,
  services,
  onTicketChange
}) => {
  if (!rooms || rooms.length === 0) {
    return <div className="p-4 text-center">No hay salas disponibles</div>;
  }

  return (
    <Tabs 
      defaultValue={selectedRoom?.id} 
      onValueChange={(value) => {
        const room = rooms.find(r => r.id === value);
        if (room) setSelectedRoom(room);
      }}
    >
      <div className="bg-muted/50 p-1 border-b">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 w-full h-auto bg-transparent gap-1">
          {rooms.map(room => (
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
      
      {rooms.map(room => (
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
                waitingTickets={waitingTickets.filter(
                  ticket => ticket.serviceType === selectedRoom.service.code
                )}
                rooms={rooms}
                services={services}
                counterNumber={selectedRoom.id}
                counterName={selectedRoom.name}
                onTicketChange={onTicketChange}
              />
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default RoomTabs;

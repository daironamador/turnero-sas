
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useLlamadaData } from '@/hooks/useLlamadaData';
import LlamadaPageHeader from '@/components/queue/LlamadaPageHeader';
import LlamadaLoading from '@/components/queue/LlamadaLoading';
import LlamadaError from '@/components/queue/LlamadaError';
import RoomTabs from '@/components/queue/RoomTabs';

const Llamada: React.FC = () => {
  const {
    selectedRoom,
    setSelectedRoom,
    currentTicket,
    waitingTicketsQuery,
    roomsQuery,
    servicesQuery,
    handleTicketChange
  } = useLlamadaData();

  // Check for loading or error states
  if (waitingTicketsQuery.isLoading || roomsQuery.isLoading || servicesQuery.isLoading) {
    return (
      <MainLayout>
        <LlamadaLoading />
      </MainLayout>
    );
  }

  if (waitingTicketsQuery.error || roomsQuery.error || servicesQuery.error) {
    return (
      <MainLayout>
        <LlamadaError />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <LlamadaPageHeader />
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {selectedRoom && roomsQuery.data && (
          <RoomTabs
            rooms={roomsQuery.data}
            selectedRoom={selectedRoom}
            setSelectedRoom={setSelectedRoom}
            currentTicket={currentTicket}
            waitingTickets={waitingTicketsQuery.data || []}
            services={servicesQuery.data || []}
            onTicketChange={handleTicketChange}
          />
        )}
      </div>
    </MainLayout>
  );
};

export default Llamada;

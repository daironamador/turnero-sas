
import React from 'react';
import { Bell } from 'lucide-react';
import DisplayHeader from './display/DisplayHeader';
import DisplayFooter from './display/DisplayFooter';
import TicketNotification from './display/TicketNotification';
import ServingTicketsSection from './display/ServingTicketsSection';
import LastCalledSection from './display/LastCalledSection';
import { useTicketData } from './display/useTicketData';
import { useTicketUpdates } from './display/useTicketUpdates';

interface DisplayScreenProps {
  refreshInterval?: number;
}

const DisplayScreen: React.FC<DisplayScreenProps> = ({ refreshInterval = 5000 }) => {
  const {
    servingTicketsQuery,
    lastCalledTicketsQuery,
    roomsQuery,
    newlyCalledTicket,
    setNewlyCalledTicket,
    lastAnnounced,
    setLastAnnounced
  } = useTicketData(refreshInterval);
  
  // Set up real-time updates for tickets
  useTicketUpdates({
    roomsQuery,
    servingTicketsQuery,
    lastCalledTicketsQuery,
    newlyCalledTicket,
    setNewlyCalledTicket,
    lastAnnounced,
    setLastAnnounced
  });
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <DisplayHeader />
      
      {/* Newly called ticket notification */}
      <TicketNotification 
        ticket={newlyCalledTicket} 
        rooms={roomsQuery.data} 
      />
      
      {/* Main content */}
      <div className="flex-1 container mx-auto p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Currently serving */}
        <ServingTicketsSection 
          tickets={servingTicketsQuery.data} 
          rooms={roomsQuery.data}
          isLoading={servingTicketsQuery.isLoading} 
        />
        
        {/* Last called tickets */}
        <LastCalledSection 
          tickets={lastCalledTicketsQuery.data} 
          rooms={roomsQuery.data}
          isLoading={lastCalledTicketsQuery.isLoading} 
        />
      </div>
      
      {/* Footer */}
      <DisplayFooter />
    </div>
  );
};

export default DisplayScreen;

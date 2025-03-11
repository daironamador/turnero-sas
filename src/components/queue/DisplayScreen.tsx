
import React, { useEffect } from 'react';
import DisplayHeader from './display/DisplayHeader';
import DisplayFooter from './display/DisplayFooter';
import TicketNotification from './display/TicketNotification';
import ServingTicketsSection from './display/ServingTicketsSection';
import LastCalledSection from './display/LastCalledSection';
import NotificationCarousel from './display/NotificationCarousel';
import { useTicketData } from './display/useTicketData';
import { useTicketUpdates } from './display/useTicketUpdates';

interface DisplayScreenProps {
  refreshInterval?: number;
}

const DisplayScreen: React.FC<DisplayScreenProps> = ({ refreshInterval = 5000 }) => {
  const {
    servingTicketsQuery,
    waitingTicketsQuery,
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
    waitingTicketsQuery,
    newlyCalledTicket,
    setNewlyCalledTicket,
    lastAnnounced,
    setLastAnnounced
  });
  
  // Listen for broadcast channel messages from other windows
  useEffect(() => {
    // Create a BroadcastChannel to receive announcements from Llamada page
    const ticketChannel = new BroadcastChannel('ticket-announcements');
    
    ticketChannel.onmessage = (event) => {
      console.log("Received broadcast message:", event.data);
      if (event.data.type === 'announce-ticket') {
        // When receiving an announcement request, update the display with the new ticket
        const ticketData = event.data.ticket;
        if (ticketData) {
          setNewlyCalledTicket(ticketData);
        }
      }
    };
    
    return () => {
      ticketChannel.close();
    };
  }, [setNewlyCalledTicket]);
  
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
        
        {/* Waiting tickets (previously Last called tickets) */}
        <LastCalledSection 
          tickets={waitingTicketsQuery.data} 
          rooms={roomsQuery.data}
          isLoading={waitingTicketsQuery.isLoading} 
        />
      </div>
      
      {/* Notifications Carousel */}
      <div className="container mx-auto px-6 mb-6">
        <NotificationCarousel />
      </div>
      
      {/* Footer */}
      <DisplayFooter />
    </div>
  );
};

export default DisplayScreen;


import React, { useEffect, useState, useRef } from 'react';
import DisplayHeader from './display/DisplayHeader';
import DisplayFooter from './display/DisplayFooter';
import TicketNotification from './display/TicketNotification';
import ServingTicketsSection from './display/ServingTicketsSection';
import LastCalledSection from './display/LastCalledSection';
import NotificationCarousel from './display/NotificationCarousel';
import ErrorDisplay from './display/ErrorDisplay';
import { useTicketData } from './display/useTicketData';
import { useTicketUpdates } from './display/useTicketUpdates';
import { toast } from 'sonner';

interface DisplayScreenProps {
  refreshInterval?: number;
}

const DisplayScreen: React.FC<DisplayScreenProps> = ({ refreshInterval = 1000 }) => {
  const [hasAudioError, setHasAudioError] = useState(false);
  const audioInitialized = useRef(false);

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

  // Check for database errors
  const hasDatabaseError = servingTicketsQuery.isError || waitingTicketsQuery.isError || roomsQuery.isError;

  // Initialize audio function
  const initializeAudio = async () => {
    if (!window.speechSynthesis) {
      setHasAudioError(true);
      return;
    }

    try {
      const testUtterance = new SpeechSynthesisUtterance(' ');
      testUtterance.volume = 0.01;
      
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Timeout')), 3000);
        
        testUtterance.onend = () => {
          clearTimeout(timeout);
          audioInitialized.current = true;
          setHasAudioError(false);
          toast.success('Audio activado correctamente');
          resolve();
        };
        
        testUtterance.onerror = (error) => {
          clearTimeout(timeout);
          setHasAudioError(true);
          reject(error);
        };
        
        window.speechSynthesis.speak(testUtterance);
      });
    } catch (error) {
      setHasAudioError(true);
      toast.error('Error al inicializar audio');
    }
  };

  // Handle retry for database connections
  const handleRetry = () => {
    servingTicketsQuery.refetch();
    waitingTicketsQuery.refetch();
    roomsQuery.refetch();
    toast.info('Reintentando conexión...');
  };

  useEffect(() => {
    // Check audio status periodically
    const checkAudio = () => {
      if (!audioInitialized.current && window.speechSynthesis) {
        setHasAudioError(true);
      }
    };

    checkAudio();
    const interval = setInterval(checkAudio, 10000);

    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Error Display */}
      <ErrorDisplay
        hasAudioError={hasAudioError}
        hasDatabaseError={hasDatabaseError}
        onRetry={handleRetry}
        onInitializeAudio={initializeAudio}
      />

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

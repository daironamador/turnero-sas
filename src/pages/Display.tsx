
import React, { useEffect } from 'react';
import DisplayScreen from '@/components/queue/DisplayScreen';
import { Helmet } from 'react-helmet';

const Display: React.FC = () => {
  // Add a title-based ID to this page to make it identifiable
  useEffect(() => {
    document.title = "Sistema de Turnos - Display";
    // This helps identify this is the display page for cross-window communication
    window.name = "ticket-display-screen";
    
    // Ensure we're capturing all messages, including from other devices on the network
    console.log("Display page initialized and ready to receive announcements");
    
    // Detect if we're running on a server vs. client
    const isClient = typeof window !== 'undefined';
    
    if (isClient) {
      // Check if BroadcastChannel is supported
      if (typeof BroadcastChannel !== 'undefined') {
        console.log("BroadcastChannel is supported in this browser");
      } else {
        console.warn("BroadcastChannel is NOT supported in this browser - announcements may not work");
      }
    }
  }, []);

  return (
    <>
      <Helmet>
        <title>Sistema de Turnos - Display</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>
      <DisplayScreen />
    </>
  );
};

export default Display;

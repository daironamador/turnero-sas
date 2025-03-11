
import React, { useEffect } from 'react';
import DisplayScreen from '@/components/queue/DisplayScreen';
import { Helmet } from 'react-helmet';

const Display: React.FC = () => {
  // Add a title-based ID to this page to make it identifiable
  useEffect(() => {
    document.title = "Sistema de Turnos - Display";
    // This helps identify this is the display page for cross-window communication
    window.name = "ticket-display-screen";
    
    // Log that the display page has been loaded and is ready
    console.log("Display page initialized and ready to receive announcements");
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

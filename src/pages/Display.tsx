
import React, { useEffect, useState } from 'react';
import DisplayScreen from '@/components/queue/DisplayScreen';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';

const Display: React.FC = () => {
  const [audioEnabled, setAudioEnabled] = useState(false);
  
  // Function to request audio permission and initialize speech synthesis
  const initializeAudio = () => {
    if (!window.speechSynthesis) {
      console.warn("Speech synthesis is not supported in this browser");
      return;
    }
    
    // Create a test utterance to request permission
    const testUtterance = new SpeechSynthesisUtterance("Test");
    testUtterance.volume = 0; // Silent test
    
    // Try to speak to trigger permission request
    window.speechSynthesis.speak(testUtterance);
    
    // Cancel after a short delay
    setTimeout(() => {
      window.speechSynthesis.cancel();
      setAudioEnabled(true);
      console.log("Audio initialized successfully");
    }, 100);
  };
  
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
      
      // Check if speech synthesis is supported
      if (window.speechSynthesis) {
        console.log("Speech synthesis is supported in this browser");
        
        // Initialize voices
        window.speechSynthesis.getVoices();
      } else {
        console.warn("Speech synthesis is NOT supported in this browser - voice announcements will not work");
      }
    }
  }, []);

  return (
    <>
      <Helmet>
        <title>Sistema de Turnos - Display</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>
      
      {!audioEnabled && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-100 p-4 flex items-center justify-center gap-4">
          <p className="text-yellow-800">Para escuchar los anuncios de voz, haga clic en el botón:</p>
          <Button onClick={initializeAudio} variant="outline" className="bg-white">
            <Volume2 className="mr-2 h-4 w-4" />
            Activar audio
          </Button>
        </div>
      )}
      
      <DisplayScreen />
    </>
  );
};

export default Display;

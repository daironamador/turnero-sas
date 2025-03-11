
import React, { useEffect, useRef } from 'react';
import DisplayScreen from '@/components/queue/DisplayScreen';
import { Helmet } from 'react-helmet';
import { toast } from 'sonner';

const Display: React.FC = () => {
  const audioInitialized = useRef(false);
  
  // Function to auto-initialize speech synthesis
  const initializeAudio = () => {
    if (!window.speechSynthesis) {
      console.warn("Speech synthesis is not supported in this browser");
      toast.error("Su navegador no soporta la síntesis de voz.");
      return;
    }
    
    try {
      // Initialize with a silent utterance to grant permissions
      const testUtterance = new SpeechSynthesisUtterance("");
      testUtterance.volume = 0; // Silent test
      testUtterance.onstart = () => {
        console.log("Audio initialized successfully");
        audioInitialized.current = true;
      };
      testUtterance.onend = () => {
        console.log("Audio test completed successfully");
      };
      testUtterance.onerror = (e) => {
        console.error("Audio initialization failed", e);
        toast.error("Error al inicializar el audio. Intente recargar la página.");
      };
      
      // Speak silently to grant permissions
      window.speechSynthesis.speak(testUtterance);
      
      // Force load voices
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => {
          console.log("Voices loaded:", speechSynthesis.getVoices().length);
        };
      }
      
      // Get voices right away too
      const voices = speechSynthesis.getVoices();
      console.log("Initial voices loaded:", voices.length);
    } catch (error) {
      console.error("Failed to initialize audio:", error);
      toast.error("Error al inicializar el audio");
    }
  };
  
  // Initialize page and audio
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
        toast.warning("Su navegador no soporta BroadcastChannel - los anuncios pueden no funcionar correctamente");
      }
      
      // Check if speech synthesis is supported
      if (window.speechSynthesis) {
        console.log("Speech synthesis is supported in this browser");
        
        // Auto-initialize audio immediately
        if (!audioInitialized.current) {
          initializeAudio();
        }
      } else {
        console.warn("Speech synthesis is NOT supported in this browser - voice announcements will not work");
        toast.error("Su navegador no soporta la síntesis de voz - los anuncios de voz no funcionarán");
      }
    }

    // Prevent browser from pausing speech synthesis when tab visibility changes
    const handleVisibilityChange = () => {
      if (window.speechSynthesis) {
        if (document.hidden) {
          window.speechSynthesis.pause();
        } else {
          window.speechSynthesis.resume();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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

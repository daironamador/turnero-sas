
import React, { useEffect, useRef } from 'react';
import DisplayScreen from '@/components/queue/DisplayScreen';
import { Helmet } from 'react-helmet';
import { toast } from 'sonner';

const Display: React.FC = () => {
  const audioInitialized = useRef(false);
  
  // Function to initialize speech synthesis
  const initializeAudio = () => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis is not supported in this browser");
      toast.error("Su navegador no soporta la síntesis de voz.");
      return;
    }
    
    try {
      // Initialize with a silent utterance to grant permissions
      const testUtterance = new SpeechSynthesisUtterance("");
      testUtterance.volume = 0; // Silent test
      
      // Force reset speech synthesis to clear any stuck state
      window.speechSynthesis.cancel();
      
      // Test with a small utterance
      window.speechSynthesis.speak(testUtterance);
      
      // Force load voices
      window.speechSynthesis.getVoices();
      
      // Set flag
      audioInitialized.current = true;
      console.log("Audio system initialized successfully");
      
      // Additional initialization to ensure it's ready
      setTimeout(() => {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel(); // Make sure queue is clear
          console.log("Audio system ready for announcements");
        }
      }, 1000);
    } catch (error) {
      console.error("Failed to initialize audio:", error);
      toast.error("Error al inicializar el audio. Intente recargar la página.");
    }
  };
  
  // Initialize page and audio
  useEffect(() => {
    document.title = "Sistema de Turnos - Display";
    // This helps identify this is the display page for cross-window communication
    window.name = "ticket-display-screen";
    
    console.log("Display page initialized and ready to receive announcements");
    
    // Check if we're running on a server vs. client
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
        
        // Auto-initialize audio immediately and then again after a timeout
        // This helps with some browsers that might not initialize correctly the first time
        initializeAudio();
        
        // Try again after a delay to ensure it's properly initialized
        setTimeout(() => {
          if (!audioInitialized.current) {
            console.log("Trying audio initialization again...");
            initializeAudio();
          }
        }, 2000);
      } else {
        console.error("Speech synthesis is NOT supported in this browser - voice announcements will not work");
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
          
          // When tab becomes visible again, re-initialize audio
          if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
            console.log("Tab visible again - ensuring audio system is ready");
            window.speechSynthesis.cancel(); // Clear any stuck utterances
          }
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

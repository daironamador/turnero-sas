
import React, { useEffect, useRef } from 'react';
import DisplayScreen from '@/components/queue/DisplayScreen';
import { Helmet } from 'react-helmet';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const Display: React.FC = () => {
  const audioInitialized = useRef(false);
  
  // Function to initialize speech synthesis (requires user interaction)
  const initializeAudio = () => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis is not supported in this browser");
      toast.error("Su navegador no soporta la síntesis de voz.");
      return Promise.reject(new Error('Speech synthesis not supported'));
    }
    
    return new Promise<void>((resolve, reject) => {
      try {
        // Force reset speech synthesis to clear any stuck state
        window.speechSynthesis.cancel();
        
        // Create voices list to force loading
        const voices = window.speechSynthesis.getVoices();
        console.log(`Available voices: ${voices.length}`);
        
        // Initialize with a silent utterance to grant permissions
        const testUtterance = new SpeechSynthesisUtterance(" ");
        testUtterance.volume = 0.01; // Very quiet test
        testUtterance.rate = 1;
        testUtterance.lang = 'es-419'; // Set language to Spanish
        
        const timeout = setTimeout(() => {
          reject(new Error('Audio initialization timeout'));
        }, 5000);
        
        // Set event handlers to track initialization
        testUtterance.onend = () => {
          clearTimeout(timeout);
          console.log("Audio system initialized successfully");
          audioInitialized.current = true;
          toast.success("Sistema de audio inicializado correctamente");
          resolve();
        };
        
        testUtterance.onerror = (error) => {
          clearTimeout(timeout);
          console.error("Error initializing audio:", error);
          toast.error("Error al inicializar audio - Haz clic en el icono de altavoz para reproducir el anuncio manualmente.");
          reject(error);
        };
        
        // Speak the test utterance
        window.speechSynthesis.speak(testUtterance);
        
        // Fallback check
        setTimeout(() => {
          if (!audioInitialized.current) {
            console.log("Audio initialization may have failed silently");
            toast.warning("Audio requiere interacción del usuario - Haz clic en cualquier lugar para activar");
          }
        }, 2000);
        
      } catch (error) {
        console.error("Failed to initialize audio:", error);
        toast.error("Error al inicializar audio - Haz clic en el icono de altavoz para reproducir el anuncio manualmente.");
        reject(error);
      }
    });
  };

  // Enable anonymous access to display data
  const enableAnonymousAccess = async () => {
    try {
      // Test connection to Supabase without auth
      const { data, error } = await supabase
        .from('tickets')
        .select('count(*)')
        .limit(1);
        
      if (error) {
        console.error("Error accessing Supabase:", error);
        toast.error("Error de conexión a la base de datos.");
      } else {
        console.log("Supabase connection successful for display page");
      }
    } catch (err) {
      console.error("Supabase connection error:", err);
    }
  };
  
  // Initialize page and audio
  useEffect(() => {
    document.title = "Sistema de Turnos - Display";
    // This helps identify this is the display page for cross-window communication
    window.name = "ticket-display-screen";
    
    console.log("Display page initialized and ready to receive announcements");
    
    // Enable anonymous access
    enableAnonymousAccess();
    
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
        
        // Add click handler to initialize audio on user interaction
        const handleUserInteraction = async () => {
          if (!audioInitialized.current) {
            try {
              await initializeAudio();
              document.removeEventListener('click', handleUserInteraction);
              document.removeEventListener('keydown', handleUserInteraction);
              document.removeEventListener('touchstart', handleUserInteraction);
            } catch (error) {
              console.error('Audio initialization failed on user interaction:', error);
            }
          }
        };
        
        document.addEventListener('click', handleUserInteraction, { once: true });
        document.addEventListener('keydown', handleUserInteraction, { once: true });
        document.addEventListener('touchstart', handleUserInteraction, { once: true });
        
        // Try auto-initialization but don't expect it to work due to browser policies
        initializeAudio().catch(() => {
          console.log("Auto-initialization failed as expected - waiting for user interaction");
          toast.info("Haz clic en cualquier lugar para activar el audio", {
            duration: 5000,
          });
        });
      } else {
        console.error("Speech synthesis is NOT supported in this browser - voice announcements will not work");
        toast.error("Su navegador no soporta la síntesis de voz - los anuncios de voz no funcionarán");
      }
    }

    // Prevent browser from pausing speech synthesis when tab visibility changes
    const handleVisibilityChange = () => {
      if (window.speechSynthesis) {
        if (document.hidden) {
          // If we're speaking and the tab becomes hidden, pause the speech
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            console.log("Speech paused due to tab visibility change");
          }
        } else {
          // Resume speech when tab becomes visible again
          window.speechSynthesis.resume();
          console.log("Speech resumed due to tab visibility change");
          
          // When tab becomes visible again, ensure audio system is ready
          if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) {
            console.log("Tab visible again - ensuring audio system is ready");
            window.speechSynthesis.cancel(); // Clear any stuck utterances
            
            // Try to re-initialize if needed
            if (!audioInitialized.current) {
              initializeAudio();
            }
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Create a periodic check to keep the synthesis system alive
    const keepAliveInterval = setInterval(() => {
      if (window.speechSynthesis && !window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel(); // Prevent any stuck states
        console.log("Periodic speech synthesis reset");
      }
    }, 30000); // Every 30 seconds
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(keepAliveInterval);
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

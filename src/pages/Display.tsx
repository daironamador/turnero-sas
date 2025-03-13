
import React, { useEffect, useRef } from 'react';
import DisplayScreen from '@/components/queue/DisplayScreen';
import { Helmet } from 'react-helmet';
import { toast } from 'sonner';

const Display: React.FC = () => {
  const audioInitialized = useRef(false);
  const deviceId = useRef<string>(localStorage.getItem('deviceId') || `display-${Math.random().toString(36).substring(2, 9)}`);
  const displayChannel = useRef<BroadcastChannel | null>(null);
  
  // Initialize device ID
  useEffect(() => {
    if (!localStorage.getItem('deviceId')) {
      localStorage.setItem('deviceId', deviceId.current);
    }
    
    // Set window name for easier identification
    window.name = `ticket-display-${deviceId.current}`;
    console.log(`Display initialized with device ID: ${deviceId.current}`);
    
    // Setup heartbeat to announce this display is available
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        displayChannel.current = new BroadcastChannel('ticket-announcements');
        
        // Announce presence immediately
        displayChannel.current.postMessage({
          type: 'display-device-online',
          deviceId: deviceId.current,
          timestamp: Date.now()
        });
        
        // Set up regular announcements
        const heartbeatInterval = setInterval(() => {
          if (displayChannel.current) {
            displayChannel.current.postMessage({
              type: 'display-device-online',
              deviceId: deviceId.current,
              timestamp: Date.now()
            });
          }
        }, 30000);
        
        return () => {
          clearInterval(heartbeatInterval);
          if (displayChannel.current) {
            displayChannel.current.close();
          }
        };
      }
    } catch (error) {
      console.error("Failed to set up display heartbeat:", error);
    }
  }, []);
  
  // Function to initialize speech synthesis
  const initializeAudio = () => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis is not supported in this browser");
      toast.error("Su navegador no soporta la síntesis de voz.");
      return;
    }
    
    try {
      // Force reset speech synthesis to clear any stuck state
      window.speechSynthesis.cancel();
      
      // Initialize with a silent utterance to grant permissions
      const testUtterance = new SpeechSynthesisUtterance(".");
      testUtterance.volume = 0.1; // Very quiet test
      testUtterance.rate = 1;
      testUtterance.lang = 'es-419'; // Set language to Spanish
      
      // Set event handlers to track initialization
      testUtterance.onend = () => {
        console.log("Audio system initialized successfully");
        audioInitialized.current = true;
        
        // Announce success
        toast.success("Sistema de audio inicializado correctamente");
        
        // Preload voices after successful initialization
        setTimeout(() => {
          const voices = window.speechSynthesis.getVoices();
          const spanishVoices = voices.filter(v => v.lang.includes('es'));
          console.log(`Audio system ready with ${voices.length} voices (${spanishVoices.length} Spanish)`);
        }, 500);
      };
      
      testUtterance.onerror = (error) => {
        console.error("Error initializing audio:", error);
        toast.error("Error al inicializar el audio. Intente recargar la página.");
      };
      
      // Speak the test utterance
      window.speechSynthesis.speak(testUtterance);
      
      // Force load voices
      window.speechSynthesis.getVoices();
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
      // Auto-focus window to ensure user agent allows audio
      try {
        window.focus();
      } catch (e) {
        console.warn("Could not focus window automatically");
      }
      
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
        initializeAudio();
        
        // Try again after delays to ensure it's properly initialized
        setTimeout(() => {
          if (!audioInitialized.current) {
            console.log("Trying audio initialization again after 2s...");
            initializeAudio();
          }
        }, 2000);
        
        setTimeout(() => {
          if (!audioInitialized.current) {
            console.log("Final attempt to initialize audio after 5s...");
            initializeAudio();
          }
        }, 5000);
        
        // Add a test sound button to the page
        const testAudioButton = document.createElement('button');
        testAudioButton.textContent = 'Probar Audio';
        testAudioButton.style.position = 'fixed';
        testAudioButton.style.bottom = '10px';
        testAudioButton.style.right = '10px';
        testAudioButton.style.zIndex = '9999';
        testAudioButton.style.padding = '8px 12px';
        testAudioButton.style.backgroundColor = '#0284c7';
        testAudioButton.style.color = 'white';
        testAudioButton.style.border = 'none';
        testAudioButton.style.borderRadius = '4px';
        testAudioButton.style.cursor = 'pointer';
        
        testAudioButton.onclick = () => {
          if (window.speechSynthesis) {
            window.speechSynthesis.cancel(); // Clear any pending speech
            const testSpeech = new SpeechSynthesisUtterance("Prueba de audio del sistema de turnos");
            testSpeech.lang = 'es-419';
            window.speechSynthesis.speak(testSpeech);
            toast.success("Probando sistema de audio...");
          } else {
            toast.error("Su navegador no soporta la síntesis de voz");
          }
        };
        
        document.body.appendChild(testAudioButton);
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
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Remove test button if it exists
      const testButton = document.querySelector('button[text="Probar Audio"]');
      if (testButton) {
        testButton.remove();
      }
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


import { useEffect, useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export function useSpeechInit() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isReadyState, setIsReadyState] = useState(false);
  const synthesisReadyRef = useRef(false);
  const initAttempts = useRef(0);
  const maxInitAttempts = 5;
  
  // Function to force load voices with enhanced error handling
  const forceLoadVoices = useCallback(() => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis not supported in this browser");
      return false;
    }
    
    try {
      // First clear any pending speech
      window.speechSynthesis.cancel();
      
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      
      if (availableVoices.length > 0) {
        synthesisReadyRef.current = true;
        setIsReadyState(true);
        
        console.log("Voice synthesis ready. Loaded voices:", availableVoices.length);
        
        // Log available Spanish voices
        const spanishVoices = availableVoices.filter(v => v.lang.includes('es'));
        if (spanishVoices.length) {
          console.log("Available Spanish voices:", spanishVoices.map(v => `${v.name} (${v.lang})`).join(', '));
        } else {
          console.warn("No Spanish voices found, will use default voice");
        }
        
        return true;
      } else {
        console.warn("No voices loaded yet");
        return false;
      }
    } catch (error) {
      console.error("Error loading voices:", error);
      return false;
    }
  }, []);
  
  // Initialize speech synthesis with robust retrying
  const initialize = useCallback(() => {
    if (!window.speechSynthesis) {
      console.error("Speech synthesis not supported");
      toast.error("Su navegador no soporta la síntesis de voz");
      return false;
    }
    
    try {
      // Track initialization attempts
      initAttempts.current += 1;
      
      if (initAttempts.current > maxInitAttempts) {
        console.error(`Exceeded maximum initialization attempts (${maxInitAttempts})`);
        toast.error("Error al inicializar el audio. Intente recargar la página.");
        return false;
      }
      
      console.log(`Speech synthesis initialization attempt ${initAttempts.current}/${maxInitAttempts}`);
      
      // Clear any pending or stuck speech
      window.speechSynthesis.cancel();
      
      // Force voice loading
      const voicesLoaded = forceLoadVoices();
      
      if (voicesLoaded) {
        synthesisReadyRef.current = true;
        setIsReadyState(true);
        
        // Speak a brief silent utterance to request permissions and test
        try {
          const testUtterance = new SpeechSynthesisUtterance(".");
          testUtterance.volume = 0.1;
          testUtterance.rate = 1;
          
          testUtterance.onend = () => {
            console.log("Test utterance completed successfully");
          };
          
          testUtterance.onerror = (event) => {
            console.error("Test utterance failed:", event);
            
            // Schedule another attempt with exponential backoff
            const backoffTime = Math.min(1000 * Math.pow(2, initAttempts.current - 1), 5000);
            setTimeout(() => initialize(), backoffTime);
          };
          
          window.speechSynthesis.speak(testUtterance);
          return true;
        } catch (e) {
          console.error("Error initializing speech:", e);
          return false;
        }
      } else if (initAttempts.current < maxInitAttempts) {
        // If voices not loaded, retry with exponential backoff
        const backoffTime = Math.min(1000 * Math.pow(2, initAttempts.current - 1), 5000);
        setTimeout(() => initialize(), backoffTime);
      }
      
      return false;
    } catch (error) {
      console.error("Error during speech synthesis initialization:", error);
      return false;
    }
  }, [forceLoadVoices]);
  
  // Make sure voices are loaded and handle various browser quirks
  useEffect(() => {
    // Reset speech synthesis to clear any stuck state
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    } else {
      console.error("Speech synthesis not available in this browser");
      return;
    }
    
    // Initial load attempt
    forceLoadVoices();
    
    // Setup event handler for when voices are loaded later
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        console.log("Voices changed event fired");
        forceLoadVoices();
      };
    }
    
    // Try to load voices after a short delay (Chrome sometimes needs this)
    const loadVoicesTimeout = setTimeout(() => {
      if (!synthesisReadyRef.current && window.speechSynthesis) {
        console.log("Retrying voice loading after 1s timeout...");
        forceLoadVoices();
      }
    }, 1000);
    
    // Additional attempt after browser has had more time to initialize
    const secondLoadVoicesTimeout = setTimeout(() => {
      if (!synthesisReadyRef.current && window.speechSynthesis) {
        console.log("Second retry of voice loading after 3s...");
        forceLoadVoices();
      }
    }, 3000);
    
    // Final attempt with warning
    const finalAttemptTimeout = setTimeout(() => {
      if (!synthesisReadyRef.current && window.speechSynthesis) {
        console.log("Final voice loading attempt after 5s...");
        const success = forceLoadVoices();
        
        if (!success) {
          console.warn("Unable to load speech synthesis voices after multiple attempts");
        }
      }
    }, 5000);
    
    // Reset the speech synthesis periodically to avoid Chrome bugs
    const resetSynthesisInterval = setInterval(() => {
      if (window.speechSynthesis && !window.speechSynthesis.speaking && synthesisReadyRef.current) {
        window.speechSynthesis.cancel();
      }
    }, 10000);
    
    // Ensure speech synthesis is not paused when page visibility changes
    const handleVisibilityChange = () => {
      if (window.speechSynthesis) {
        if (document.hidden) {
          console.log("Speech synthesis paused due to tab visibility change");
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
          }
        } else {
          console.log("Speech synthesis resumed due to tab visibility change");
          window.speechSynthesis.resume();
          
          // Force reload voices when returning to tab
          setTimeout(forceLoadVoices, 300);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(resetSynthesisInterval);
      clearTimeout(loadVoicesTimeout);
      clearTimeout(secondLoadVoicesTimeout);
      clearTimeout(finalAttemptTimeout);
      
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [forceLoadVoices]);

  return { 
    voices, 
    isReady: isReadyState,
    initialize
  };
}
